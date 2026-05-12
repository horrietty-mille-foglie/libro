import { useEffect, useRef, useState } from 'react'
import { processImageFile } from '../lib/imageProcessing'
import { uploadCoverImage, deleteImage, getSignedImageUrl } from '../lib/storage'

function isStoragePath(url) {
  return Boolean(url && !url.startsWith('http://') && !url.startsWith('https://'))
}

export default function CoverUploader({ currentCoverUrl, bookId, onCoverChange }) {
  const fileInputRef = useRef(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [thumbSrc, setThumbSrc] = useState(
    currentCoverUrl?.startsWith('http') ? currentCoverUrl : null
  )

  useEffect(() => {
    if (!currentCoverUrl) { setThumbSrc(null); return }
    if (!isStoragePath(currentCoverUrl)) {
      setThumbSrc(currentCoverUrl)
      return
    }
    let cancelled = false
    getSignedImageUrl(currentCoverUrl, { width: 200, height: 200 })
      .then(url => { if (!cancelled) setThumbSrc(url) })
      .catch(() => { if (!cancelled) setThumbSrc(null) })
    return () => { cancelled = true }
  }, [currentCoverUrl])

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    setProcessing(true)
    setError('')
    try {
      // 既存の Storage 画像は上書き前に削除（外部 URL は削除しない）
      if (isStoragePath(currentCoverUrl)) {
        await deleteImage(currentCoverUrl).catch(() => {})
      }
      const { blob, extension } = await processImageFile(file)
      const { storage_path } = await uploadCoverImage(blob, extension, bookId)
      onCoverChange(storage_path)
    } catch (err) {
      setError(err.message || '画像のアップロードに失敗しました')
    } finally {
      setProcessing(false)
    }
  }

  const handleDelete = async () => {
    if (isStoragePath(currentCoverUrl)) {
      await deleteImage(currentCoverUrl).catch(() => {})
    }
    onCoverChange(null)
  }

  return (
    <div className="flex items-start gap-3">
      {/* サムネ */}
      <div className="w-16 h-24 flex-shrink-0 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden flex items-center justify-center">
        {thumbSrc ? (
          <img src={thumbSrc} alt="表紙" className="w-full h-full object-cover" />
        ) : (
          <span className="text-gray-300 dark:text-gray-500 text-2xl select-none">📖</span>
        )}
      </div>

      {/* ボタン群 */}
      <div className="flex flex-col gap-1.5 justify-center">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={processing}
          className="text-xs px-3 py-1.5 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 hover:border-blue-400 hover:text-blue-500 disabled:opacity-50 transition-colors"
        >
          {processing ? '処理中…' : currentCoverUrl ? '表紙を変更' : '+ 表紙をアップロード'}
        </button>
        {currentCoverUrl && (
          <button
            type="button"
            onClick={handleDelete}
            className="text-xs text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
          >
            削除
          </button>
        )}
        {processing && (
          <span className="text-xs text-gray-400 dark:text-gray-500 animate-pulse">HEIC変換・圧縮中…</span>
        )}
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.heic,.heif"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  )
}
