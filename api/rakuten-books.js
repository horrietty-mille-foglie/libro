export default async function handler(req, res) {
  const { isbn } = req.query
  if (!isbn || !/^\d+$/.test(isbn)) {
    return res.status(400).json({ error: 'Invalid ISBN' })
  }

  const appId     = process.env.RAKUTEN_APP_ID
  const accessKey = process.env.RAKUTEN_ACCESS_KEY
  if (!appId || !accessKey) {
    return res.status(500).json({ error: 'Server config missing' })
  }

  const url =
    `https://openapi.rakuten.co.jp/services/api/BooksBook/Search/20170404` +
    `?applicationId=${appId}&accessKey=${accessKey}&isbn=${isbn}&format=json`

  const requestHeaders = {
    'Referer': 'https://libro-app-mu.vercel.app',
    'referer': 'https://libro-app-mu.vercel.app',
    'User-Agent': 'Mozilla/5.0 (compatible; Libro/1.0; +https://libro-app-mu.vercel.app)',
    'Origin': 'https://libro-app-mu.vercel.app'
  }

  console.log('[rakuten-books] Request URL:', url.replace(accessKey, '***'))
  console.log('[rakuten-books] Request Headers:', requestHeaders)

  try {
    const response = await fetch(url, { headers: requestHeaders })
    const data = await response.json()
    console.log('[rakuten-books] Response status:', response.status)
    console.log('[rakuten-books] Response body:', JSON.stringify(data).substring(0, 200))
    return res.status(response.status).json(data)
  } catch (err) {
    console.log('[rakuten-books] Fetch error:', String(err))
    return res.status(502).json({ error: 'Upstream API error', detail: String(err) })
  }
}
