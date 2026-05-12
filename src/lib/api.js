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

export async function updateBook(bookId, updates) {
  const { data, error } = await supabase
    .from('libro_books')
    .update(updates)
    .eq('id', bookId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function fetchNotesByBookId(bookId) {
  const { data, error } = await supabase
    .from('libro_notes')
    .select(`
      *,
      tags:libro_note_tags(
        tag:libro_tags(id, name)
      )
    `)
    .eq('book_id', bookId)
    .order('chapter', { ascending: true, nullsFirst: true })
    .order('page', { ascending: true, nullsFirst: true })
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data || []).map(note => ({
    ...note,
    tags: (note.tags || []).map(t => t.tag).filter(Boolean),
  }))
}

export async function fetchLatestNoteByBookId(bookId) {
  const { data, error } = await supabase
    .from('libro_notes')
    .select('chapter')
    .eq('book_id', bookId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data  // null or { chapter }
}

export async function fetchNoteById(noteId) {
  const { data, error } = await supabase
    .from('libro_notes')
    .select('*')
    .eq('id', noteId)
    .single()
  if (error) throw error
  return data
}

export async function createNote(noteData) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('未ログインです')

  const { data, error } = await supabase
    .from('libro_notes')
    .insert({ ...noteData, user_id: user.id })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateNote(noteId, updates) {
  const { data, error } = await supabase
    .from('libro_notes')
    .update(updates)
    .eq('id', noteId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteNote(noteId) {
  const { error } = await supabase
    .from('libro_notes')
    .delete()
    .eq('id', noteId)
  if (error) throw error
}

// ── タグ ──────────────────────────────────────────────────────

export async function fetchTags() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('未ログインです')

  const { data, error } = await supabase
    .from('libro_tags')
    .select('*')
    .eq('user_id', user.id)
    .order('name', { ascending: true })
  if (error) throw error
  return data || []
}

export async function createTag(name) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('未ログインです')

  // UNIQUE(user_id, name) 制約があるため upsert で重複時は既存を返す
  const { data, error } = await supabase
    .from('libro_tags')
    .upsert({ user_id: user.id, name: name.trim() }, { onConflict: 'user_id,name' })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function fetchNoteTagsByNoteId(noteId) {
  const { data, error } = await supabase
    .from('libro_note_tags')
    .select('tag_id')
    .eq('note_id', noteId)
  if (error) throw error
  return (data || []).map(r => r.tag_id)
}

export async function updateNoteTags(noteId, tagIds) {
  const { error: delErr } = await supabase
    .from('libro_note_tags')
    .delete()
    .eq('note_id', noteId)
  if (delErr) throw delErr

  if (tagIds.length === 0) return

  const rows = tagIds.map(tag_id => ({ note_id: noteId, tag_id }))
  const { error: insErr } = await supabase.from('libro_note_tags').insert(rows)
  if (insErr) throw insErr
}

// ── メモ画像 ──────────────────────────────────────────────────

export async function fetchNoteImages(noteId) {
  const { data, error } = await supabase
    .from('libro_note_images')
    .select('*')
    .eq('note_id', noteId)
    .order('display_order', { ascending: true })
  if (error) throw error
  return data || []
}

export async function createNoteImage(noteImageData) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('未ログインです')

  const { data, error } = await supabase
    .from('libro_note_images')
    .insert({ ...noteImageData, user_id: user.id })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateNoteImageCaption(imageId, caption) {
  const { data, error } = await supabase
    .from('libro_note_images')
    .update({ caption })
    .eq('id', imageId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteNoteImage(imageId) {
  const { error } = await supabase.from('libro_note_images').delete().eq('id', imageId)
  if (error) throw error
}

// ── 書籍画像 ──────────────────────────────────────────────────

export async function fetchBookImages(bookId) {
  const { data, error } = await supabase
    .from('libro_book_images')
    .select('*')
    .eq('book_id', bookId)
    .order('display_order', { ascending: true })
  if (error) throw error
  return data || []
}

export async function createBookImage(bookImageData) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('未ログインです')

  const { data, error } = await supabase
    .from('libro_book_images')
    .insert({ ...bookImageData, user_id: user.id })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateBookImageCaption(imageId, caption) {
  const { data, error } = await supabase
    .from('libro_book_images')
    .update({ caption })
    .eq('id', imageId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteBookImage(imageId) {
  const { error } = await supabase.from('libro_book_images').delete().eq('id', imageId)
  if (error) throw error
}

// ── ユーザー設定 ──────────────────────────────────────────────

export async function fetchUserSettings() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('未ログインです')

  const { data, error } = await supabase
    .from('libro_user_settings')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null  // レコードなし
    throw error
  }
  return data
}

export async function upsertUserSettings(settings) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('未ログインです')

  const { data, error } = await supabase
    .from('libro_user_settings')
    .upsert({ user_id: user.id, ...settings }, { onConflict: 'user_id' })
    .select()
    .single()
  if (error) throw error
  return data
}

// ── 全文検索 ──────────────────────────────────────────────────

export async function searchAll(query) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('未ログインです')

  const pattern = `%${query}%`

  const [booksResult, notesResult, tagsResult] = await Promise.all([
    supabase
      .from('libro_books')
      .select('*')
      .eq('user_id', user.id)
      .or(`title.ilike.${pattern},author.ilike.${pattern},publisher.ilike.${pattern}`)
      .order('created_at', { ascending: false }),

    supabase
      .from('libro_notes')
      .select('*, book:libro_books(id, title, author, cover_url)')
      .eq('user_id', user.id)
      .or(`quote.ilike.${pattern},thought.ilike.${pattern}`)
      .order('created_at', { ascending: false }),

    supabase
      .from('libro_tags')
      .select(`
        id, name,
        note_tags:libro_note_tags(
          note:libro_notes(id, quote, thought, book_id,
            book:libro_books(id, title, author, cover_url)
          )
        )
      `)
      .eq('user_id', user.id)
      .ilike('name', pattern),
  ])

  if (booksResult.error) throw booksResult.error
  if (notesResult.error) throw notesResult.error
  if (tagsResult.error) throw tagsResult.error

  return {
    books: booksResult.data || [],
    notes: notesResult.data || [],
    tagged_notes: tagsResult.data || [],
  }
}
