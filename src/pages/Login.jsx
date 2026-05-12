import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Login() {
  const navigate = useNavigate()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) navigate('/dashboard')
    }
    checkAuth()
  }, [navigate])

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    if (error) console.error('Login error:', error)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-10 bg-white rounded-lg shadow-md w-full max-w-sm">
        <h1 className="text-4xl font-semibold mb-2 text-gray-800">Libro</h1>
        <p className="text-gray-500 mb-8">読書メモアプリ</p>
        <button
          onClick={handleGoogleLogin}
          className="w-full py-3 px-6 bg-blue-600 text-white rounded-md text-base font-medium hover:bg-blue-700 transition-colors cursor-pointer"
        >
          Googleでログイン
        </button>
      </div>
    </div>
  )
}
