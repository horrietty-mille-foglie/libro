import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    const handleCallback = async () => {
      const { data, error } = await supabase.auth.getSession()
      if (error) {
        console.error('Auth callback error:', error)
        navigate('/login', { replace: true })
        return
      }
      if (data.session) {
        navigate('/dashboard', { replace: true })
      } else {
        navigate('/login', { replace: true })
      }
    }
    handleCallback()
  }, [navigate])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">認証中...</p>
    </div>
  )
}
