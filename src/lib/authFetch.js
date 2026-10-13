import { supabase } from './supabase'

// 401 / 403 が返ったときに投げるエラー
export class ApiAuthError extends Error {
  constructor(message = AUTH_ERROR_MESSAGE) {
    super(message)
    this.name = 'ApiAuthError'
  }
}

export const AUTH_ERROR_MESSAGE = 'ログインし直してください（認証の有効期限が切れています）'

export function isApiAuthError(err) {
  return err?.name === 'ApiAuthError'
}

// Supabase セッションの access_token を取得
export async function getAccessToken() {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token || null
}

/**
 * /api/* 呼び出し用の fetch。
 * Supabase セッションの access_token を Authorization: Bearer として付ける。
 * 401 / 403 の場合は ApiAuthError を投げる。
 */
export async function authFetch(path, init = {}) {
  const token = await getAccessToken()
  if (!token) throw new ApiAuthError()

  const headers = new Headers(init.headers || {})
  headers.set('Authorization', `Bearer ${token}`)

  const res = await fetch(path, { ...init, headers })
  if (res.status === 401 || res.status === 403) {
    throw new ApiAuthError()
  }
  return res
}
