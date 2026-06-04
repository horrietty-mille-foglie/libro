import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUserSettings } from '../contexts/UserSettingsContext'
import { supabase } from '../lib/supabase'

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
  const [newPassword, setNewPassword] = useState('')
  const [passwordMsg, setPasswordMsg] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)

  const handlePasswordUpdate = async (e) => {
    e.preventDefault()
    if (newPassword.length < 6) {
      setPasswordMsg('6文字以上で入力してください')
      return
    }
    setPasswordLoading(true)
    setPasswordMsg('')
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) {
      setPasswordMsg('パスワードの更新に失敗しました')
    } else {
      setPasswordMsg('パスワードを更新しました')
      setNewPassword('')
    }
    setPasswordLoading(false)
  }

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

        <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">パスワード設定</h2>
          <form onSubmit={handlePasswordUpdate} className="space-y-3">
            <input
              type="password"
              autoComplete="new-password"
              placeholder="新しいパスワード（6文字以上）"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {passwordMsg && (
              <p className={`text-xs ${passwordMsg.includes('更新しました') ? 'text-green-600' : 'text-red-500'}`}>
                {passwordMsg}
              </p>
            )}
            <button
              type="submit"
              disabled={passwordLoading || !newPassword}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {passwordLoading ? '更新中...' : 'パスワードを更新'}
            </button>
          </form>
        </section>
      </main>
    </div>
  )
}
