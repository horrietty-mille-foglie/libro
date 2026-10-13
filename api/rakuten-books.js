import { requireUser } from './_lib/auth.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const auth = await requireUser(req)
  if (auth.status) {
    return res.status(auth.status).json(auth.body)
  }

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

  try {
    const response = await fetch(url, { headers: requestHeaders })
    const data = await response.json()
    return res.status(response.status).json(data)
  } catch (err) {
    console.error('[rakuten-books] Fetch error:', err)
    return res.status(502).json({ error: 'Upstream API error' })
  }
}
