import { createClient } from '@supabase/supabase-js'

const supabaseUrl     = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

// 許可メールアドレス（カンマ区切り）。未設定ならログイン済みユーザー全員を許可
function allowedEmails() {
  const raw = process.env.LIBRO_ALLOWED_EMAILS
  if (!raw) return null
  const list = raw.split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
  return list.length > 0 ? list : null
}

function bearerToken(req) {
  const header = req.headers?.authorization || req.headers?.Authorization
  if (!header) return null
  const match = /^Bearer\s+(.+)$/i.exec(String(header).trim())
  return match ? match[1] : null
}

/**
 * Authorization: Bearer トークンを Supabase で検証する。
 * 成功時は { user } を、失敗時は { status, body } を返す。
 * レスポンス用の body にはトークンや内部情報を一切含めない。
 */
export async function requireUser(req) {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[auth] Supabase の環境変数が設定されていません')
    return { status: 500, body: { error: 'Server config missing' } }
  }

  const token = bearerToken(req)
  if (!token) {
    return { status: 401, body: { error: 'Unauthorized' } }
  }

  let user
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const { data, error } = await supabase.auth.getUser(token)
    if (error || !data?.user) {
      return { status: 401, body: { error: 'Unauthorized' } }
    }
    user = data.user
  } catch (err) {
    console.error('[auth] トークン検証でエラー:', err)
    return { status: 401, body: { error: 'Unauthorized' } }
  }

  const allowList = allowedEmails()
  if (allowList) {
    const email = (user.email || '').toLowerCase()
    if (!email || !allowList.includes(email)) {
      return { status: 403, body: { error: 'Forbidden' } }
    }
  }

  return { user }
}
