import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { lookupByISBN } from '../lib/isbn'
import { createBook } from '../lib/api'
import { deleteImage } from '../lib/storage'
import CoverUploader from '../components/CoverUploader'

const STATUS_OPTIONS = ['積読', '読書中', '読了']

export default function BookNew() {
  const navigate = useNavigate()
  const [isbn, setIsbn] = useState('')
  const [lookupState, setLookupState] = useState('idle') // idle | loading | found | notfound | error
  const [form, setForm] = useState({
    title: '', author: '', publisher: '', cover_url: '', status: '積読',
  })
  const [submitError, setSubmitError] = useState('')
  const [titleError, setTitleError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleLookup = async () => {
    if (!isbn.trim()) return
    setLookupState('loading')
    setTitleError('')
    setSubmitError('')
    try {
      const result = await lookupByISBN(isbn)
      if (!result) { setLookupState('notfound'); return }
      // 手動アップロード済み書影(Storage path)があれば削除
      const current = form.cover_url
      if (current && !current.startsWith('http')) {
        deleteImage(current).catch(() => {})
      }
      setForm(prev => ({
        ...prev,
        title: result.title || '',
        author: result.author || '',
        publisher: result.publisher || '',
        cover_url: result.cover_url || '',
      }))
      setLookupState('found')
    } catch {
      setLookupState('error')
    }
  }

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
    if (field === 'title') setTitleError('')
  }

  const handleCoverChange = (url) => {
    setForm(prev => ({ ...prev, cover_url: url || '' }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) { setTitleError('タイトルは必須です'); return }
    setSubmitting(true)
    setSubmitError('')
    try {
      await createBook({
        isbn: isbn.trim() || null,
        title: form.title.trim(),
        author: form.author.trim() || null,
        publisher: form.publisher.trim() || null,
        cover_url: form.cover_url.trim() || null,
        status: form.status,
      })
      navigate('/dashboard')
    } catch {
      setSubmitError('登録に失敗しました。再度お試しください')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100">本を登録</h1>
      </header>

      <main className="max-w-xl mx-auto px-4 py-8">
        {/* ISBN 検索 */}
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-3">
            ISBN から自動取得
          </h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={isbn}
              onChange={e => setIsbn(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLookup()}
              placeholder="例: 9784004310235"
              className="flex-1 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={handleLookup}
              disabled={lookupState === 'loading' || !isbn.trim()}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {lookupState === 'loading' ? '取得中…' : '自動取得'}
            </button>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
            動作確認用 ISBN 例: 9784004310235（岩波新書）、9784065132111（講談社）
          </p>
          {lookupState === 'notfound' && (
            <p className="mt-2 text-sm text-amber-600">書誌情報が見つかりませんでした。手動入力してください</p>
          )}
          {lookupState === 'error' && (
            <p className="mt-2 text-sm text-red-600">通信エラーが発生しました。再度お試しください</p>
          )}
          {lookupState === 'found' && (
            <p className="mt-2 text-sm text-green-600">書誌情報を取得しました。内容を確認して登録してください</p>
          )}
        </section>

        {/* 登録フォーム */}
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1">
            書籍情報
          </h2>

          {/* 表紙 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">表紙</label>
            <CoverUploader
              currentCoverUrl={form.cover_url || null}
              bookId={null}
              onCoverChange={handleCoverChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              タイトル <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={e => handleChange('title', e.target.value)}
              placeholder="書籍タイトル"
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {titleError && <p className="mt-1 text-xs text-red-600">{titleError}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">著者</label>
            <input
              type="text"
              value={form.author}
              onChange={e => handleChange('author', e.target.value)}
              placeholder="著者名"
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">出版社</label>
            <input
              type="text"
              value={form.publisher}
              onChange={e => handleChange('publisher', e.target.value)}
              placeholder="出版社"
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ステータス</label>
            <select
              value={form.status}
              onChange={e => handleChange('status', e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {submitError && <p className="text-sm text-red-600">{submitError}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? '登録中…' : '登録'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="flex-1 py-2 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 text-sm font-medium rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              キャンセル
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
