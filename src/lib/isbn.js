function normalizeISBN(isbn) {
  return isbn.replace(/-/g, '').trim()
}

async function lookupOpenBD(isbn) {
  const res = await fetch(`https://api.openbd.jp/v1/get?isbn=${isbn}`)
  if (!res.ok) throw new Error('OpenBD 通信エラー')
  const json = await res.json()
  const item = json?.[0]
  if (!item) return null

  const summary = item.summary || {}
  const cover = summary.cover || null
  return {
    title: summary.title || null,
    author: summary.author || null,
    publisher: summary.publisher || null,
    cover_url: cover || null,
  }
}

async function lookupOpenLibraryCover(isbn) {
  try {
    const url = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg?default=false`
    const res = await fetch(url, { method: 'HEAD' })
    return res.ok ? url : null
  } catch {
    return null
  }
}

async function lookupRakutenBooks(isbn) {
  const appId     = import.meta.env.VITE_RAKUTEN_APP_ID
  const accessKey = import.meta.env.VITE_RAKUTEN_ACCESS_KEY
  if (!appId || !accessKey) {
    console.warn('[ISBN] VITE_RAKUTEN_APP_ID または VITE_RAKUTEN_ACCESS_KEY が未設定です')
    return null
  }
  try {
    const url = `https://openapi.rakuten.co.jp/ichibams/api/BooksBook/Search/20170404?applicationId=${appId}&accessKey=${accessKey}&isbn=${isbn}&format=json`
    const res = await fetch(url)
    if (!res.ok) return null
    const json = await res.json()
    const item = json?.Items?.[0]?.Item
    if (!item) return null
    return {
      title:     item.title         || null,
      author:    item.author        || null,
      publisher: item.publisherName || null,
      cover_url: item.largeImageUrl || null,
    }
  } catch {
    return null
  }
}

async function lookupGoogleBooks(isbn) {
  const res = await fetch(
    `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`
  )
  if (!res.ok) throw new Error('Google Books 通信エラー')
  const json = await res.json()
  const item = json?.items?.[0]
  if (!item) return null

  const info = item.volumeInfo || {}
  const thumbnail =
    info.imageLinks?.thumbnail?.replace('http://', 'https://') || null
  return {
    title: info.title || null,
    author: info.authors?.join(', ') || null,
    publisher: info.publisher || null,
    cover_url: thumbnail,
  }
}

export async function lookupByISBN(isbn) {
  const normalized = normalizeISBN(isbn)

  const openbd = await lookupOpenBD(normalized)
  console.log(`[ISBN] OpenBD: title=${openbd?.title ? 'found' : 'none'}, cover=${openbd?.cover_url ? 'yes' : 'no'}`)
  if (openbd && openbd.title) {
    if (!openbd.cover_url) {
      try {
        const rakuten = await lookupRakutenBooks(normalized)
        if (rakuten?.cover_url) {
          console.log('[ISBN] Rakuten: cover found')
          openbd.cover_url = rakuten.cover_url
        } else {
          const olCover = await lookupOpenLibraryCover(normalized)
          if (olCover) {
            console.log('[ISBN] OpenLibrary: cover found')
            openbd.cover_url = olCover
          }
        }
      } catch {}
    }
    return openbd
  }

  console.log('[ISBN] Fallback to Rakuten')
  const rakuten = await lookupRakutenBooks(normalized)
  if (rakuten && rakuten.title) return rakuten

  console.log('[ISBN] Fallback to Google Books')
  const google = await lookupGoogleBooks(normalized)
  if (google && google.title) return google

  return null
}
