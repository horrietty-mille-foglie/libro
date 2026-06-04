import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) navigate('/dashboard')
    }
    checkAuth()
  }, [navigate])

  const handleEmailLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('メールアドレスまたはパスワードが正しくありません')
    } else {
      navigate('/dashboard')
    }
    setLoading(false)
  }

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    })
    if (error) console.error('Login error:', error)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="p-10 bg-white dark:bg-gray-800 rounded-lg shadow-md w-full max-w-sm">
        <h1 className="text-4xl font-semibold mb-2 text-gray-800 dark:text-gray-100 text-center">Libro</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8 text-center">読書メモアプリ</p>

        {error && (
          <p className="mb-4 text-sm text-red-500">{error}</p>
        )}

        <form onSubmit={handleEmailLogin} className="space-y-3 mb-4">
          <input
            type="email"
            autoComplete="username"
            placeholder="メールアドレス"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="password"
            autoComplete="current-password"
            placeholder="パスワード"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-6 bg-blue-600 text-white rounded-md text-base font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            {loading ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>

        <div className="relative my-4 flex items-center">
          <hr className="flex-grow border-gray-200 dark:border-gray-600" />
          <span className="mx-3 text-xs text-gray-400 dark:text-gray-500">または</span>
          <hr className="flex-grow border-gray-200 dark:border-gray-600" />
        </div>

        <button
          onClick={handleGoogleLogin}
          className="w-full py-3 px-6 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md text-base font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors cursor-pointer"
        >
          Googleでログイン
        </button>
      </div>
    </div>
  )
}
