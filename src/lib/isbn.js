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
  if (openbd && openbd.title) return openbd

  const google = await lookupGoogleBooks(normalized)
  if (google && google.title) return google

  return null
}
