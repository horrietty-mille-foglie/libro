import { supabase } from './supabase'

const BUCKET = 'libro-images'
const SIGNED_URL_EXPIRES = 3600  // 1時間

export async function uploadImage(blob, extension, bookId) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('未ログインです')

  const uuid = crypto.randomUUID()
  const storage_path = `${user.id}/${bookId}/${uuid}.${extension}`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storage_path, blob, { contentType: blob.type, upsert: false })

  if (error) throw error

  return { storage_path }
}

export async function deleteImage(storage_path) {
  const { error } = await supabase.storage.from(BUCKET).remove([storage_path])
  if (error) throw error
}

// Private バケット用: 署名付き URL を生成（有効期限 1 時間）
export async function getSignedImageUrl(storage_path, options = {}) {
  const { width, height } = options

  const reqOptions = { expiresIn: SIGNED_URL_EXPIRES }

  if (width || height) {
    const transform = { resize: 'contain' }
    if (width)  transform.width  = width
    if (height) transform.height = height
    reqOptions.transform = transform
  }

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storage_path, SIGNED_URL_EXPIRES, reqOptions)

  if (error) throw error
  return data.signedUrl
}

// cover_url が外部 URL なら直接返し、Storage path なら署名付き URL を生成して返す
export async function resolveCoverUrl(cover_url, options = {}) {
  if (!cover_url) return null
  if (cover_url.startsWith('http://') || cover_url.startsWith('https://')) return cover_url
  return getSignedImageUrl(cover_url, options)
}

// 書影専用アップロード（ファイル名に cover_ プレフィックス）
export async function uploadCoverImage(blob, extension, bookId) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('未ログインです')

  const uuid = crypto.randomUUID()
  const folder = bookId || 'temp'
  const storage_path = `${user.id}/${folder}/cover_${uuid}.${extension}`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storage_path, blob, { contentType: blob.type, upsert: false })

  if (error) throw error
  return { storage_path }
}
