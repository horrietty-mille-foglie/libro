import { supabase } from './supabase'

export async function fetchBooks({ status } = {}) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('未ログインです')

  let query = supabase
    .from('libro_books')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function fetchBookById(bookId) {
  const { data, error } = await supabase
    .from('libro_books')
    .select('*')
    .eq('id', bookId)
    .single()
  if (error) throw error
  return data
}

export async function createBook(bookData) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('未ログインです')

  const { data, error } = await supabase
    .from('libro_books')
    .insert({ ...bookData, user_id: user.id })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateBookStatus(bookId, status) {
  const { data, error } = await supabase
    .from('libro_books')
    .update({ status })
    .eq('id', bookId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteBook(bookId) {
  const { error } = await supabase
    .from('libro_books')
    .delete()
    .eq('id', bookId)
  if (error) throw error
}
