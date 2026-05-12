import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Dashboard() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')

  useEffect(() => {
    const loadUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user?.email) setEmail(session.user.email)
    }
    loadUser()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-800">Libro</h1>
        <div className="flex items-center gap-4">
          {email && <span className="text-sm text-gray-500">{email}</span>}
          <button
            onClick={handleLogout}
            className="text-sm px-4 py-2 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            ログアウト
          </button>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">Libro へようこそ</h2>
        <p className="text-gray-500">書籍・読書メモを管理するアプリです。</p>
      </main>
    </div>
  )
}
