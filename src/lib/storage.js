import { supabase } from './supabase'

const BUCKET = 'libro-images'

export async function uploadImage(blob, extension, bookId) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('未ログインです')

  const uuid = crypto.randomUUID()
  const storage_path = `${user.id}/${bookId}/${uuid}.${extension}`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storage_path, blob, { contentType: blob.type, upsert: false })

  if (error) throw error

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storage_path)
  return { storage_path, public_url: data.publicUrl }
}

export async function deleteImage(storage_path) {
  const { error } = await supabase.storage.from(BUCKET).remove([storage_path])
  if (error) throw error
}

export function getImageUrl(storage_path, options = {}) {
  const { width, height } = options

  if (width || height) {
    const transform = {}
    if (width)  transform.width  = width
    if (height) transform.height = height
    transform.resize = 'contain'
    const { data } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(storage_path, { transform })
    return data.publicUrl
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storage_path)
  return data.publicUrl
}
