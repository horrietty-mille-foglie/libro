import { useNavigate } from 'react-router-dom'
import { useUserSettings } from '../contexts/UserSettingsContext'

const THEME_OPTIONS = [
  { value: 'light',  label: 'ライト' },
  { value: 'dark',   label: 'ダーク' },
  { value: 'system', label: 'システムに従う' },
]

const VIEW_OPTIONS = [
  { value: 'grid', label: 'グリッド' },
  { value: 'list', label: 'リスト' },
]

export default function Settings() {
  const navigate = useNavigate()
  const { settings, updateTheme, updateListViewMode } = useUserSettings()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-4 flex items-center gap-3">
        <button
          onClick={() => navigate('/dashboard')}
          className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 flex items-center gap-1 text-sm"
        >
          ← 戻る
        </button>
        <h1 className="text-base font-semibold text-gray-800 dark:text-gray-100">設定</h1>
      </header>

      <main className="max-w-xl mx-auto px-4 py-8 space-y-6">
        <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">テーマ</h2>
          <div className="space-y-3">
            {THEME_OPTIONS.map(opt => (
              <label key={opt.value} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="theme"
                  value={opt.value}
                  checked={settings.theme === opt.value}
                  onChange={() => updateTheme(opt.value)}
                  className="accent-blue-600"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">{opt.label}</span>
              </label>
            ))}
          </div>
        </section>

        <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">書籍一覧の表示</h2>
          <div className="space-y-3">
            {VIEW_OPTIONS.map(opt => (
              <label key={opt.value} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="list_view_mode"
                  value={opt.value}
                  checked={settings.list_view_mode === opt.value}
                  onChange={() => updateListViewMode(opt.value)}
                  className="accent-blue-600"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">{opt.label}</span>
              </label>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
