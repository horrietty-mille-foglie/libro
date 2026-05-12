import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  fetchBookById,
  updateBook,
  deleteBook,
  fetchNotesByBookId,
  deleteNote,
} from '../lib/api'

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

// ── 日付編集モーダル ───────────────────────────────────────────
function DateModal({ startedAt, finishedAt, onSave, onClose }) {
  const [s, setS] = useState(startedAt || '')
  const [f, setF] = useState(finishedAt || '')

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4">読書期間を編集</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">開始日</label>
            <input
              type="date"
              value={s}
              onChange={e => setS(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">読了日</label>
            <input
              type="date"
              value={f}
              onChange={e => setF(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={() => onSave(s || null, f || null)}
            className="flex-1 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            保存
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2 border border-gray-300 text-gray-600 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors"
          >
            キャンセル
          </button>
        </div>
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
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
      {/* ヘッダー */}
      {(note.chapter || note.page) && (
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-3 font-medium">
          {note.chapter && <span>{note.chapter}</span>}
          {note.chapter && note.page && <span>·</span>}
          {note.page && <span>p.{note.page}</span>}
        </div>
      )}

      {/* 引用 */}
      {note.quote && (
        <div className="mb-3 pl-3 border-l-4 border-blue-200 bg-gray-50 rounded-r-md py-2 pr-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">引用</p>
          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{note.quote}</p>
        </div>
      )}

      {/* 考察 */}
      {note.thought && (
        <div className="mb-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">考察</p>
          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{note.thought}</p>
        </div>
      )}

      {/* フッター */}
      <div className="flex gap-2 justify-end pt-2 border-t border-gray-100">
        <button
          onClick={() => onEdit(note)}
          className="text-xs px-3 py-1.5 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50 transition-colors"
        >
          編集
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-xs px-3 py-1.5 border border-red-200 rounded-md text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
        >
          削除
        </button>
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

  if (loading) return <p className="text-center text-gray-400 py-12">読み込み中…</p>
  if (error)   return <p className="text-center text-red-500 py-12">{error}</p>

  return (
    <div className="relative pb-20">
      {notes.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-3xl mb-3">📝</p>
          <p className="text-sm text-gray-500">メモはまだありません。右下の + ボタンから追加してください</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notes.map(note => (
            <NoteCard
              key={note.id}
              note={note}
              bookId={bookId}
              onDeleted={handleDeleted}
              onEdit={handleEdit}
            />
          ))}
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => navigate(`/books/${bookId}/notes/new`)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white text-2xl rounded-full shadow-lg hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center z-20 cursor-pointer"
        title="メモを追加"
      >
        +
      </button>
    </div>
  )
}

// ── まとめタブ ────────────────────────────────────────────────
function SummaryTab({ book, onBookUpdated }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(book.summary || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      const updated = await updateBook(book.id, { summary: draft })
      onBookUpdated(updated)
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
  }

  return (
    <div>
      {editing ? (
        <div className="space-y-3">
          <textarea
            value={draft}
            onChange={e => setDraft(e.target.value)}
            rows={14}
            placeholder="書籍全体の感想・学びをここにまとめましょう"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saving ? '保存中…' : '保存'}
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 py-2 border border-gray-300 text-gray-600 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors"
            >
              キャンセル
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div className="flex justify-end mb-3">
            <button
              onClick={() => setEditing(true)}
              className="text-sm px-4 py-1.5 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50 transition-colors"
            >
              編集
            </button>
          </div>
          {book.summary ? (
            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed bg-white rounded-lg border border-gray-200 p-4">
              {book.summary}
            </p>
          ) : (
            <div className="text-center py-16">
              <p className="text-3xl mb-3">📄</p>
              <p className="text-sm text-gray-500">まとめはまだありません</p>
            </div>
          )}
        </div>
      )}
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
    if (newStatus === '読書中' && !book.started_at) {
      updates.started_at = today()
    }
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
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-400">読み込み中…</p>
    </div>
  )

  if (error || !book) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <p className="text-red-500">{error || '書籍が見つかりません'}</p>
      <button onClick={() => navigate('/dashboard')} className="text-sm text-blue-600 underline">
        一覧へ戻る
      </button>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center gap-3">
        <button
          onClick={() => navigate('/dashboard')}
          className="text-gray-500 hover:text-gray-700 flex items-center gap-1 text-sm"
        >
          <span>←</span> 戻る
        </button>
        <h1 className="text-base font-semibold text-gray-800 truncate">{book.title}</h1>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* 書誌情報 */}
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex gap-4">
            {book.cover_url ? (
              <img
                src={book.cover_url}
                alt={book.title}
                className="w-20 flex-shrink-0 object-cover rounded shadow"
              />
            ) : (
              <div className="w-20 h-28 flex-shrink-0 bg-gray-100 rounded flex items-center justify-center text-3xl">
                📖
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-gray-800 leading-snug mb-1">{book.title}</h2>
              {book.author    && <p className="text-sm text-gray-500 mb-0.5">{book.author}</p>}
              {book.publisher && <p className="text-xs text-gray-400">{book.publisher}</p>}
            </div>
          </div>
        </section>

        {/* ステータス + 読書期間 */}
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-600 flex-shrink-0">ステータス</label>
            <select
              value={book.status}
              onChange={e => handleStatusChange(e.target.value)}
              disabled={statusSaving}
              className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:opacity-60"
            >
              {STATUS_OPTIONS.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <span className={`ml-1 text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[book.status] ?? ''}`}>
              {book.status}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 text-sm text-gray-600">
              {book.started_at || book.finished_at ? (
                <span>
                  {formatDate(book.started_at) ?? '?'} 〜 {formatDate(book.finished_at) ?? ''}
                </span>
              ) : (
                <span className="text-gray-400">読書期間未設定</span>
              )}
            </div>
            <button
              onClick={() => setShowDateModal(true)}
              className="text-xs px-3 py-1.5 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50 transition-colors flex-shrink-0"
            >
              日付編集
            </button>
          </div>
        </section>

        {/* タブ */}
        <div>
          <div className="flex border-b border-gray-200 mb-4">
            {[['notes', 'メモ'], ['summary', 'まとめ']].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === key
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {activeTab === 'notes' && (
            <NotesTab bookId={id} navigate={navigate} />
          )}
          {activeTab === 'summary' && (
            <SummaryTab book={book} onBookUpdated={setBook} />
          )}
        </div>

        {/* 書籍削除 */}
        <section className="pt-2 pb-8">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="w-full py-2.5 border border-red-300 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
          >
            {deleting ? '削除中…' : '書籍を削除'}
          </button>
        </section>
      </main>

      {/* 日付編集モーダル */}
      {showDateModal && (
        <DateModal
          startedAt={book.started_at}
          finishedAt={book.finished_at}
          onSave={handleDateSave}
          onClose={() => setShowDateModal(false)}
        />
      )}
    </div>
  )
}
