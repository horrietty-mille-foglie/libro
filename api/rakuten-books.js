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

  try {
    const response = await fetch(url)
    const data = await response.json()
    return res.status(response.status).json(data)
  } catch (err) {
    return res.status(502).json({ error: 'Upstream API error', detail: String(err) })
  }
}
