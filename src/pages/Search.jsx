import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { searchAll } from '../lib/api'

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

export default function Search() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const debouncedQuery = useDebounce(query, 300)

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults(null)
      setSearchParams({}, { replace: true })
      return
    }
    setSearchParams({ q: debouncedQuery }, { replace: true })
    setLoading(true)
    setError('')
    searchAll(debouncedQuery)
      .then(setResults)
      .catch(() => setError('検索に失敗しました'))
      .finally(() => setLoading(false))
  }, [debouncedQuery]) // eslint-disable-line react-hooks/exhaustive-deps

  const totalCount = results
    ? results.books.length + results.notes.length + results.tagged_notes.length
    : 0

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-4 flex items-center gap-3 sticky top-0 z-10">
        <button
          onClick={() => navigate('/dashboard')}
          className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 flex items-center gap-1 text-sm flex-shrink-0"
        >
          ← 戻る
        </button>
        <input
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="書籍・メモ・タグを検索…"
          autoFocus
          className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {loading && (
          <p className="text-center text-gray-400 dark:text-gray-500 py-12">検索中…</p>
        )}
        {error && (
          <p className="text-center text-red-500 py-12">{error}</p>
        )}

        {!loading && results && totalCount === 0 && (
          <div className="text-center py-16">
            <p className="text-3xl mb-3">🔍</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">「{debouncedQuery}」に一致する結果はありませんでした</p>
          </div>
        )}

        {!loading && results && results.books.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
              書籍 ({results.books.length})
            </h2>
            <div className="space-y-2">
              {results.books.map(book => (
                <div
                  key={book.id}
                  onClick={() => navigate(`/books/${book.id}`)}
                  className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 cursor-pointer hover:shadow-sm transition-shadow"
                >
                  <div className="w-10 h-14 flex-shrink-0 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden flex items-center justify-center">
                    {book.cover_url ? (
                      <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-gray-300 dark:text-gray-500 text-lg">📖</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{book.title}</p>
                    {book.author && <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{book.author}</p>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {!loading && results && results.notes.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
              メモ ({results.notes.length})
            </h2>
            <div className="space-y-2">
              {results.notes.map(note => (
                <div
                  key={note.id}
                  onClick={() => navigate(`/books/${note.book_id}`)}
                  className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 cursor-pointer hover:shadow-sm transition-shadow"
                >
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1 truncate">
                    {note.book?.title}
                  </p>
                  {note.quote && (
                    <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 mb-1 pl-2 border-l-2 border-gray-200 dark:border-gray-600">
                      {note.quote}
                    </p>
                  )}
                  {note.thought && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{note.thought}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {!loading && results && results.tagged_notes.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
              タグ ({results.tagged_notes.length})
            </h2>
            <div className="space-y-3">
              {results.tagged_notes.map(tag => {
                const notes = (tag.note_tags || []).map(nt => nt.note).filter(Boolean)
                return (
                  <div key={tag.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                    <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 font-medium mb-2">
                      #{tag.name}
                    </span>
                    {notes.length === 0 ? (
                      <p className="text-xs text-gray-400 dark:text-gray-500">メモなし</p>
                    ) : (
                      <div className="space-y-1.5">
                        {notes.slice(0, 3).map(note => (
                          <div
                            key={note.id}
                            onClick={() => navigate(`/books/${note.book_id}`)}
                            className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 rounded p-1 transition-colors"
                          >
                            <p className="text-xs text-blue-500 dark:text-blue-400 font-medium truncate">
                              {note.book?.title}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                              {note.quote || note.thought}
                            </p>
                          </div>
                        ))}
                        {notes.length > 3 && (
                          <p className="text-xs text-gray-400 dark:text-gray-500">他 {notes.length - 3} 件…</p>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {!loading && !results && !error && (
          <div className="text-center py-16">
            <p className="text-3xl mb-3">🔍</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">検索ワードを入力してください</p>
          </div>
        )}
      </main>
    </div>
  )
}
