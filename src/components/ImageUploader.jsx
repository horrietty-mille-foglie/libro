import { useEffect, useRef, useState } from 'react'
import { processImageFile } from '../lib/imageProcessing'
import { uploadImage, deleteImage, getSignedImageUrl } from '../lib/storage'

// ── 原寸モーダル ──────────────────────────────────────────────
function ImageModal({ url, onClose }) {
  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div className="relative max-w-full max-h-full" onClick={e => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white text-sm hover:text-gray-300"
        >
          ✕ 閉じる
        </button>
        <img src={url} alt="" className="max-w-[90vw] max-h-[85vh] object-contain rounded" />
      </div>
    </div>
  )
}

// ── ImageUploader 本体 ────────────────────────────────────────
export default function ImageUploader({ bookId, existingImages, onImagesChange }) {
  const fileInputRef = useRef(null)
  const [processing, setProcessing] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [modalUrl, setModalUrl] = useState(null)

  // storage_path → { thumb, full } の署名付き URL キャッシュ
  const [signedUrls, setSignedUrls] = useState({})

  // existingImages が変わるたびに未解決の storage_path の署名付き URL を取得
  useEffect(() => {
    if (existingImages.length === 0) return

    const unresolved = existingImages.filter(
      img => img.storage_path && !signedUrls[img.storage_path]
    )
    if (unresolved.length === 0) return

    let cancelled = false
    const resolve = async () => {
      const entries = await Promise.all(
        unresolved.map(async img => {
          try {
            const [thumb, full] = await Promise.all([
              getSignedImageUrl(img.storage_path, { width: 200, height: 200 }),
              getSignedImageUrl(img.storage_path),
            ])
            return [img.storage_path, { thumb, full }]
          } catch {
            return [img.storage_path, { thumb: '', full: '' }]
          }
        })
      )
      if (!cancelled) {
        setSignedUrls(prev => {
          const next = { ...prev }
          entries.forEach(([path, urls]) => { next[path] = urls })
          return next
        })
      }
    }
    resolve()
    return () => { cancelled = true }
  }, [existingImages])  // eslint-disable-line react-hooks/exhaustive-deps

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    setProcessing(true)
    setUploadError('')
    try {
      const { blob, extension } = await processImageFile(file)
      const { storage_path } = await uploadImage(blob, extension, bookId)
      const newImage = {
        id: null,
        storage_path,
        caption: '',
        display_order: existingImages.length,
        _isNew: true,
      }
      onImagesChange([...existingImages, newImage])
    } catch (err) {
      setUploadError(err.message || '画像のアップロードに失敗しました')
    } finally {
      setProcessing(false)
    }
  }

  const handleCaptionChange = (index, caption) => {
    const next = existingImages.map((img, i) => i === index ? { ...img, caption } : img)
    onImagesChange(next)
  }

  const handleDelete = async (index) => {
    const img = existingImages[index]
    if (!window.confirm('この画像を削除しますか？')) return
    try {
      await deleteImage(img.storage_path)
      setSignedUrls(prev => {
        const next = { ...prev }
        delete next[img.storage_path]
        return next
      })
      onImagesChange(existingImages.filter((_, i) => i !== index))
    } catch {
      setUploadError('画像の削除に失敗しました')
    }
  }

  const handleThumbClick = async (storage_path) => {
    try {
      // 原寸は毎回新しい signed URL を生成（モーダル表示直前）
      const url = await getSignedImageUrl(storage_path)
      setModalUrl(url)
    } catch {
      setUploadError('画像URLの取得に失敗しました')
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">画像</label>

      {existingImages.length > 0 && (
        <div className="flex gap-3 overflow-x-auto pb-2 mb-3">
          {existingImages.map((img, i) => {
            const urls = signedUrls[img.storage_path]
            return (
              <div key={img.storage_path} className="flex-shrink-0 w-28">
                <div
                  className="w-28 h-28 rounded-lg overflow-hidden bg-gray-100 cursor-pointer border border-gray-200 hover:border-blue-400 transition-colors flex items-center justify-center"
                  onClick={() => handleThumbClick(img.storage_path)}
                >
                  {urls?.thumb ? (
                    <img
                      src={urls.thumb}
                      alt={img.caption || ''}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xs text-gray-400 animate-pulse">読込中</span>
                  )}
                </div>
                <input
                  type="text"
                  value={img.caption || ''}
                  onChange={e => handleCaptionChange(i, e.target.value)}
                  placeholder="キャプション"
                  className="mt-1 w-full text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400"
                />
                <button
                  type="button"
                  onClick={() => handleDelete(i)}
                  className="mt-1 w-full text-xs text-red-500 hover:text-red-700 text-center"
                >
                  削除
                </button>
              </div>
            )
          })}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={processing}
          className="text-xs px-4 py-2 border border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-500 disabled:opacity-50 transition-colors"
        >
          {processing ? '処理中…' : '+ 画像追加'}
        </button>
        {processing && (
          <span className="text-xs text-gray-400 animate-pulse">HEIC変換・圧縮中…</span>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.heic,.heif"
        className="hidden"
        onChange={handleFileChange}
      />

      {uploadError && (
        <p className="mt-2 text-xs text-red-600">{uploadError}</p>
      )}

      {modalUrl && (
        <ImageModal url={modalUrl} onClose={() => setModalUrl(null)} />
      )}
    </div>
  )
}
