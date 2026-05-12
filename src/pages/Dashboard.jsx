import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { fetchBooks } from '../lib/api'
import { useUserSettings } from '../contexts/UserSettingsContext'
import BookCover from '../components/BookCover'

const STATUS_FILTERS = ['すべて', '積読', '読書中', '読了']

const STATUS_BADGE = {
  '積読':   'bg-gray-100 text-gray-600',
  '読書中': 'bg-blue-100 text-blue-700',
  '読了':   'bg-green-100 text-green-700',
}

function BookCardGrid({ book, onClick }) {
  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
    >
      <div className="aspect-[2/3] bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
        <BookCover
          coverUrl={book.cover_url}
          alt={book.title}
          imgClassName="w-full h-full object-cover"
          placeholderClassName="text-gray-300 dark:text-gray-500 text-4xl select-none"
        />
      </div>
      <div className="p-3">
        <p className="text-sm font-medium text-gray-800 dark:text-gray-100 line-clamp-2 leading-snug mb-1">
          {book.title}
        </p>
        {book.author && (
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate mb-2">{book.author}</p>
        )}
        <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[book.status] ?? ''}`}>
          {book.status}
        </span>
      </div>
    </div>
  )
}

function BookRowList({ book, onClick }) {
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-4 bg-white dark:bg-gray-800 px-4 py-3 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
    >
      <div className="w-10 h-14 flex-shrink-0 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden flex items-center justify-center">
        <BookCover
          coverUrl={book.cover_url}
          alt={book.title}
          imgClassName="w-full h-full object-cover"
          placeholderClassName="text-gray-300 dark:text-gray-500 text-lg"
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{book.title}</p>
        {book.author && (
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{book.author}</p>
        )}
      </div>
      <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[book.status] ?? ''}`}>
        {book.status}
      </span>
      <span className="flex-shrink-0 text-xs text-gray-400 dark:text-gray-500 hidden sm:block">
        {new Date(book.created_at).toLocaleDateString('ja-JP')}
      </span>
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { settings, updateListViewMode } = useUserSettings()
  const viewMode = settings.list_view_mode

  const [email, setEmail] = useState('')
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeFilter, setActiveFilter] = useState('すべて')

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user?.email) setEmail(session.user.email)

      try {
        const data = await fetchBooks()
        setBooks(data)
      } catch {
        setError('書籍の読み込みに失敗しました')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const filteredBooks = activeFilter === 'すべて'
    ? books
    : books.filter(b => b.status === activeFilter)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* ヘッダー */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Libro</h1>
        <div className="flex items-center gap-1 sm:gap-2">
          {email && (
            <span className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block truncate max-w-[180px] mr-1">
              {email}
            </span>
          )}
          <button
            onClick={() => navigate('/search')}
            title="検索"
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors text-base"
          >
            🔍
          </button>
          <button
            onClick={() => navigate('/settings')}
            title="設定"
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors text-base"
          >
            ⚙
          </button>
          <button
            onClick={handleLogout}
            className="text-sm px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
          >
            ログアウト
          </button>
        </div>
      </header>

      {/* フィルタ + 表示切替 */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="flex gap-1 overflow-x-auto scrollbar-none">
            {STATUS_FILTERS.map(filter => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                  activeFilter === filter
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                {filter}
                {filter === 'すべて'
                  ? ` (${books.length})`
                  : ` (${books.filter(b => b.status === filter).length})`}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 flex-shrink-0 ml-4">
            <button
              onClick={() => updateListViewMode('grid')}
              title="グリッド表示"
              className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
                <rect x="1" y="1" width="6" height="6" rx="1"/>
                <rect x="9" y="1" width="6" height="6" rx="1"/>
                <rect x="1" y="9" width="6" height="6" rx="1"/>
                <rect x="9" y="9" width="6" height="6" rx="1"/>
              </svg>
            </button>
            <button
              onClick={() => updateListViewMode('list')}
              title="リスト表示"
              className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
                <rect x="1" y="2" width="14" height="2.5" rx="1"/>
                <rect x="1" y="6.75" width="14" height="2.5" rx="1"/>
                <rect x="1" y="11.5" width="14" height="2.5" rx="1"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <main className="px-4 sm:px-6 py-6 max-w-7xl mx-auto">
        {loading && (
          <p className="text-center text-gray-400 dark:text-gray-500 py-20">読み込み中…</p>
        )}
        {!loading && error && (
          <p className="text-center text-red-500 py-20">{error}</p>
        )}
        {!loading && !error && filteredBooks.length === 0 && (
          <div className="text-center py-20">
            <p className="text-4xl mb-4">📚</p>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              {activeFilter === 'すべて'
                ? '本がまだ登録されていません。右下の + ボタンから登録してください'
                : `「${activeFilter}」の本はありません`}
            </p>
          </div>
        )}

        {!loading && !error && filteredBooks.length > 0 && (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredBooks.map(book => (
                <BookCardGrid key={book.id} book={book} onClick={() => navigate(`/books/${book.id}`)} />
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
              {filteredBooks.map(book => (
                <BookRowList key={book.id} book={book} onClick={() => navigate(`/books/${book.id}`)} />
              ))}
            </div>
          )
        )}
      </main>

      <button
        onClick={() => navigate('/books/new')}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white text-2xl rounded-full shadow-lg hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center z-20 cursor-pointer"
        title="本を登録"
      >
        +
      </button>
    </div>
  )
}
