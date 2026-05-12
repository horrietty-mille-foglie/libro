import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  fetchBookById, updateBook, deleteBook,
  fetchNotesByBookId, deleteNote,
  fetchBookImages, createBookImage, deleteBookImage,
  updateBookImageCaption,
} from '../lib/api'
import { deleteImage, getSignedImageUrl } from '../lib/storage'
import ImageUploader from '../components/ImageUploader'
import CoverUploader from '../components/CoverUploader'

const STATUS_OPTIONS = ['積読', '読書中', '読了']

const STATUS_BADGE = {
  '積読':   'bg-gray-100 text-gray-600',
  '読書中': 'bg-blue-100 text-blue-700',
  '読了':   'bg-green-100 text-green-700',
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

function formatDate(dateStr) {
  if (!dateStr) return null
  return new Date(dateStr).toLocaleDateString('ja-JP', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

// ── 日付編集モーダル ──────────────────────────────────────────
function DateModal({ startedAt, finishedAt, onSave, onClose }) {
  const [s, setS] = useState(startedAt || '')
  const [f, setF] = useState(finishedAt || '')

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-sm p-6">
        <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-4">読書期間を編集</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">開始日</label>
            <input type="date" value={s} onChange={e => setS(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">読了日</label>
            <input type="date" value={f} onChange={e => setF(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={() => onSave(s || null, f || null)}
            className="flex-1 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors">保存</button>
          <button onClick={onClose}
            className="flex-1 py-2 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 text-sm font-medium rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">キャンセル</button>
        </div>
      </div>
    </div>
  )
}

// ── 原寸モーダル ──────────────────────────────────────────────
function ImageModal({ url, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="relative" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute -top-10 right-0 text-white text-sm hover:text-gray-300">✕ 閉じる</button>
        <img src={url} alt="" className="max-w-[90vw] max-h-[85vh] object-contain rounded" />
      </div>
    </div>
  )
}

// ── メモカード ────────────────────────────────────────────────
function NoteCard({ note, bookId, onDeleted, onEdit }) {
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!window.confirm('このメモを削除しますか？')) return
    setDeleting(true)
    try {
      await deleteNote(note.id)
      onDeleted(note.id)
    } catch {
      alert('削除に失敗しました')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-4">
      {(note.chapter || note.page) && (
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-3 font-medium">
          {note.chapter && <span>{note.chapter}</span>}
          {note.chapter && note.page && <span>·</span>}
          {note.page && <span>p.{note.page}</span>}
        </div>
      )}

      {note.quote && (
        <div className="mb-3 pl-3 border-l-4 border-blue-200 dark:border-blue-800 bg-gray-50 dark:bg-gray-700 rounded-r-md py-2 pr-3">
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">引用</p>
          <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">{note.quote}</p>
        </div>
      )}

      {note.thought && (
        <div className="mb-3">
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">考察</p>
          <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">{note.thought}</p>
        </div>
      )}

      {note.tags && note.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {note.tags.map(tag => (
            <span key={tag.id} className="text-xs px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 font-medium">
              {tag.name}
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-2 justify-end pt-2 border-t border-gray-100 dark:border-gray-700">
        <button onClick={() => onEdit(note)}
          className="text-xs px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">編集</button>
        <button onClick={handleDelete} disabled={deleting}
          className="text-xs px-3 py-1.5 border border-red-200 dark:border-red-800 rounded-md text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 transition-colors">削除</button>
      </div>
    </div>
  )
}

// ── メモタブ ──────────────────────────────────────────────────
function NotesTab({ bookId, navigate }) {
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchNotesByBookId(bookId)
      .then(setNotes)
      .catch(() => setError('メモの読み込みに失敗しました'))
      .finally(() => setLoading(false))
  }, [bookId])

  const handleDeleted = (noteId) => setNotes(prev => prev.filter(n => n.id !== noteId))
  const handleEdit = (note) => navigate(`/books/${bookId}/notes/${note.id}/edit`)

  if (loading) return <p className="text-center text-gray-400 dark:text-gray-500 py-12">読み込み中…</p>
  if (error)   return <p className="text-center text-red-500 py-12">{error}</p>

  return (
    <div className="relative pb-20">
      {notes.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-3xl mb-3">📝</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">メモはまだありません。右下の + ボタンから追加してください</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notes.map(note => (
            <NoteCard key={note.id} note={note} bookId={bookId} onDeleted={handleDeleted} onEdit={handleEdit} />
          ))}
        </div>
      )}
      <button
        onClick={() => navigate(`/books/${bookId}/notes/new`)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white text-2xl rounded-full shadow-lg hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center z-20 cursor-pointer"
        title="メモを追加"
      >+</button>
    </div>
  )
}

// ── まとめタブ ────────────────────────────────────────────────
function SummaryTab({ book, onBookUpdated }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(book.summary || '')
  const [bookImages, setBookImages] = useState([])
  const [imagesLoading, setImagesLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [modalUrl, setModalUrl] = useState(null)
  const [signedUrls, setSignedUrls] = useState({})

  useEffect(() => {
    fetchBookImages(book.id)
      .then(setBookImages)
      .catch(() => {})
      .finally(() => setImagesLoading(false))
  }, [book.id])

  useEffect(() => {
    if (bookImages.length === 0) return
    const unresolved = bookImages.filter(img => img.storage_path && !signedUrls[img.storage_path])
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
  }, [bookImages]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleImagesChange = async (nextImages) => {
    setBookImages(nextImages)
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      const updated = await updateBook(book.id, { summary: draft })
      onBookUpdated(updated)

      const newImages = bookImages.filter(img => img._isNew)
      if (newImages.length > 0) {
        const existing = bookImages.filter(img => !img._isNew)
        const created = await Promise.all(newImages.map((img, i) =>
          createBookImage({
            book_id: book.id,
            storage_path: img.storage_path,
            caption: img.caption || null,
            display_order: existing.length + i,
          })
        ))
        setBookImages([...existing, ...created])
      }

      setEditing(false)
    } catch {
      setError('保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setDraft(book.summary || '')
    setEditing(false)
    setError('')
    const newImages = bookImages.filter(img => img._isNew)
    newImages.forEach(img => deleteImage(img.storage_path).catch(() => {}))
    setBookImages(bookImages.filter(img => !img._isNew))
  }

  const handleThumbClick = async (storage_path) => {
    try {
      const url = await getSignedImageUrl(storage_path)
      setModalUrl(url)
    } catch {
      setError('画像URLの取得に失敗しました')
    }
  }

  return (
    <div>
      {editing ? (
        <div className="space-y-4">
          <textarea
            value={draft}
            onChange={e => setDraft(e.target.value)}
            rows={12}
            placeholder="書籍全体の感想・学びをここにまとめましょう"
            className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
          />
          <ImageUploader bookId={book.id} existingImages={bookImages} onImagesChange={handleImagesChange} />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3">
            <button onClick={handleSave} disabled={saving}
              className="flex-1 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {saving ? '保存中…' : '保存'}
            </button>
            <button onClick={handleCancel}
              className="flex-1 py-2 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 text-sm font-medium rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              キャンセル
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div className="flex justify-end mb-3">
            <button onClick={() => setEditing(true)}
              className="text-sm px-4 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">編集</button>
          </div>

          {book.summary ? (
            <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap leading-relaxed bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-4">
              {book.summary}
            </p>
          ) : (
            <div className="text-center py-10 mb-4">
              <p className="text-3xl mb-3">📄</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">まとめはまだありません</p>
            </div>
          )}

          {!imagesLoading && bookImages.length > 0 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {bookImages.map(img => {
                const urls = signedUrls[img.storage_path]
                return (
                  <div
                    key={img.id || img.storage_path}
                    className="flex-shrink-0 w-28 h-28 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 cursor-pointer border border-gray-200 dark:border-gray-700 hover:border-blue-400 transition-colors flex items-center justify-center"
                    onClick={() => handleThumbClick(img.storage_path)}
                  >
                    {urls?.thumb ? (
                      <img src={urls.thumb} alt={img.caption || ''} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs text-gray-400 dark:text-gray-500 animate-pulse">読込中</span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {modalUrl && <ImageModal url={modalUrl} onClose={() => setModalUrl(null)} />}
    </div>
  )
}

// ── BookDetail メイン ─────────────────────────────────────────
export default function BookDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [book, setBook] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState(null)
  const [statusSaving, setStatusSaving] = useState(false)
  const [showDateModal, setShowDateModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchBookById(id)
      .then(b => {
        setBook(b)
        setActiveTab(b.status === '読了' ? 'summary' : 'notes')
      })
      .catch(() => setError('書籍の読み込みに失敗しました'))
      .finally(() => setLoading(false))
  }, [id])

  const handleStatusChange = async (newStatus) => {
    const updates = { status: newStatus }
    if (newStatus === '読書中' && !book.started_at) updates.started_at = today()
    if (newStatus === '読了' && !book.finished_at) {
      updates.finished_at = today()
      if (!book.started_at) updates.started_at = today()
    }
    setStatusSaving(true)
    try {
      const updated = await updateBook(id, updates)
      setBook(updated)
    } catch {
      alert('ステータスの更新に失敗しました')
    } finally {
      setStatusSaving(false)
    }
  }

  const handleDateSave = async (startedAt, finishedAt) => {
    try {
      const updated = await updateBook(id, { started_at: startedAt, finished_at: finishedAt })
      setBook(updated)
    } catch {
      alert('日付の保存に失敗しました')
    }
    setShowDateModal(false)
  }

  const handleCoverChange = async (newUrl) => {
    try {
      const updated = await updateBook(id, { cover_url: newUrl || null })
      setBook(updated)
    } catch {
      alert('表紙の更新に失敗しました')
    }
  }

  const handleDelete = async () => {
    if (!window.confirm(`「${book.title}」を削除しますか？\n関連するメモもすべて削除されます。`)) return
    setDeleting(true)
    try {
      await deleteBook(id)
      navigate('/dashboard')
    } catch {
      alert('削除に失敗しました')
      setDeleting(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <p className="text-gray-400 dark:text-gray-500">読み込み中…</p>
    </div>
  )

  if (error || !book) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50 dark:bg-gray-900">
      <p className="text-red-500">{error || '書籍が見つかりません'}</p>
      <button onClick={() => navigate('/dashboard')} className="text-sm text-blue-600 underline">一覧へ戻る</button>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-4 flex items-center gap-3">
        <button onClick={() => navigate('/dashboard')}
          className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 flex items-center gap-1 text-sm">
          <span>←</span> 戻る
        </button>
        <h1 className="text-base font-semibold text-gray-800 dark:text-gray-100 truncate">{book.title}</h1>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* 書誌情報 */}
        <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
          <div className="flex gap-4">
            <CoverUploader
              currentCoverUrl={book.cover_url}
              bookId={book.id}
              onCoverChange={handleCoverChange}
            />
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 leading-snug mb-1">{book.title}</h2>
              {book.author    && <p className="text-sm text-gray-500 dark:text-gray-400 mb-0.5">{book.author}</p>}
              {book.publisher && <p className="text-xs text-gray-400 dark:text-gray-500">{book.publisher}</p>}
            </div>
          </div>
        </section>

        {/* ステータス + 読書期間 */}
        <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400 flex-shrink-0">ステータス</label>
            <select value={book.status} onChange={e => handleStatusChange(e.target.value)} disabled={statusSaving}
              className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60">
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <span className={`ml-1 text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[book.status] ?? ''}`}>
              {book.status}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 text-sm text-gray-600 dark:text-gray-300">
              {book.started_at || book.finished_at ? (
                <span>{formatDate(book.started_at) ?? '?'} 〜 {formatDate(book.finished_at) ?? ''}</span>
              ) : (
                <span className="text-gray-400 dark:text-gray-500">読書期間未設定</span>
              )}
            </div>
            <button onClick={() => setShowDateModal(true)}
              className="text-xs px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex-shrink-0">
              日付編集
            </button>
          </div>
        </section>

        {/* タブ */}
        <div>
          <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
            {[['notes', 'メモ'], ['summary', 'まとめ']].map(([key, label]) => (
              <button key={key} onClick={() => setActiveTab(key)}
                className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === key
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}>
                {label}
              </button>
            ))}
          </div>
          {activeTab === 'notes'   && <NotesTab bookId={id} navigate={navigate} />}
          {activeTab === 'summary' && <SummaryTab book={book} onBookUpdated={setBook} />}
        </div>

        {/* 書籍削除 */}
        <section className="pt-2 pb-8">
          <button onClick={handleDelete} disabled={deleting}
            className="w-full py-2.5 border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-medium rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 transition-colors">
            {deleting ? '削除中…' : '書籍を削除'}
          </button>
        </section>
      </main>

      {showDateModal && (
        <DateModal startedAt={book.started_at} finishedAt={book.finished_at}
          onSave={handleDateSave} onClose={() => setShowDateModal(false)} />
      )}
    </div>
  )
}
