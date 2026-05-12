import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  fetchNoteById, fetchLatestNoteByBookId, createNote, updateNote,
  fetchNoteTagsByNoteId, updateNoteTags,
  fetchNoteImages, createNoteImage, deleteNoteImage,
} from '../lib/api'
import { deleteImage } from '../lib/storage'
import TagInput from '../components/TagInput'
import ImageUploader from '../components/ImageUploader'

export default function NoteEditor() {
  const { bookId, noteId } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(noteId)

  const [form, setForm] = useState({ chapter: '', page: '', quote: '', thought: '' })
  const [selectedTagIds, setSelectedTagIds] = useState([])
  const [images, setImages] = useState([])
  const [deletedImageIds, setDeletedImageIds] = useState([])

  const [loading, setLoading] = useState(isEdit)
  const [loadError, setLoadError] = useState('')
  const [saving, setSaving] = useState(false)
  const [validationError, setValidationError] = useState('')
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    if (!isEdit) {
      fetchLatestNoteByBookId(bookId)
        .then(latest => {
          if (latest?.chapter) setForm(prev => ({ ...prev, chapter: latest.chapter }))
        })
        .catch(() => {})
      return
    }
    Promise.all([
      fetchNoteById(noteId),
      fetchNoteTagsByNoteId(noteId),
      fetchNoteImages(noteId),
    ])
      .then(([note, tagIds, imgs]) => {
        setForm({
          chapter: note.chapter || '',
          page:    note.page != null ? String(note.page) : '',
          quote:   note.quote || '',
          thought: note.thought || '',
        })
        setSelectedTagIds(tagIds)
        setImages(imgs)
      })
      .catch(() => setLoadError('メモの読み込みに失敗しました'))
      .finally(() => setLoading(false))
  }, [noteId, isEdit])

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
    setValidationError('')
  }

  const handleImagesChange = (nextImages) => {
    if (isEdit) {
      const prevIds = images.filter(i => i.id).map(i => i.id)
      const nextIds = nextImages.filter(i => i.id).map(i => i.id)
      const removed = prevIds.filter(id => !nextIds.includes(id))
      setDeletedImageIds(prev => [...new Set([...prev, ...removed])])
    }
    setImages(nextImages)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.quote.trim() && !form.thought.trim()) {
      setValidationError('引用または考察のどちらか一方は入力してください')
      return
    }
    setSaving(true)
    setSaveError('')
    try {
      const payload = {
        book_id: bookId,
        chapter: form.chapter.trim() || null,
        page:    form.page !== '' ? Number(form.page) : null,
        quote:   form.quote.trim() || null,
        thought: form.thought.trim() || null,
      }

      let savedNoteId = noteId
      if (isEdit) {
        await updateNote(noteId, payload)
      } else {
        const created = await createNote(payload)
        savedNoteId = created.id
      }

      await updateNoteTags(savedNoteId, selectedTagIds)
      await Promise.all(deletedImageIds.map(id => deleteNoteImage(id)))

      const newImages = images.filter(img => img._isNew)
      await Promise.all(newImages.map((img, i) =>
        createNoteImage({
          note_id: savedNoteId,
          storage_path: img.storage_path,
          caption: img.caption || null,
          display_order: images.filter(x => !x._isNew).length + i,
        })
      ))

      navigate(`/books/${bookId}`)
    } catch {
      setSaveError('保存に失敗しました。再度お試しください')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <p className="text-gray-400 dark:text-gray-500">読み込み中…</p>
    </div>
  )

  if (loadError) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50 dark:bg-gray-900">
      <p className="text-red-500">{loadError}</p>
      <button onClick={() => navigate(`/books/${bookId}`)} className="text-sm text-blue-600 underline">
        戻る
      </button>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-4 flex items-center gap-3">
        <button
          onClick={() => navigate(`/books/${bookId}`)}
          className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 flex items-center gap-1 text-sm"
        >
          <span>←</span> 戻る
        </button>
        <h1 className="text-base font-semibold text-gray-800 dark:text-gray-100">
          {isEdit ? 'メモを編集' : 'メモを追加'}
        </h1>
      </header>

      <main className="max-w-xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 space-y-5">

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">章</label>
              <input
                type="text"
                value={form.chapter}
                onChange={e => handleChange('chapter', e.target.value)}
                placeholder="例: 第1章"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="w-24">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ページ</label>
              <input
                type="number"
                value={form.page}
                onChange={e => handleChange('page', e.target.value)}
                placeholder="42"
                min="1"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">引用</label>
            <textarea
              value={form.quote}
              onChange={e => handleChange('quote', e.target.value)}
              rows={4}
              placeholder="本文から気になった一文を引用…"
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">考察</label>
            <textarea
              value={form.thought}
              onChange={e => handleChange('thought', e.target.value)}
              rows={4}
              placeholder="この引用について思ったこと・学んだこと…"
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
            />
          </div>

          <TagInput selectedTagIds={selectedTagIds} onChange={setSelectedTagIds} />

          <ImageUploader bookId={bookId} existingImages={images} onImagesChange={handleImagesChange} />

          {validationError && <p className="text-sm text-red-600">{validationError}</p>}
          {saveError && <p className="text-sm text-red-600">{saveError}</p>}

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saving ? '保存中…' : '保存'}
            </button>
            <button
              type="button"
              onClick={() => navigate(`/books/${bookId}`)}
              className="flex-1 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 text-sm font-medium rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              キャンセル
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
