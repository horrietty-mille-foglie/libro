export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'APIキーが設定されていません' })
  }

  try {
    const { book, notes } = req.body

    if (!notes || notes.length === 0) {
      return res.status(400).json({ error: '整理できるメモがありません' })
    }

    const notesText = notes.map((note, i) => {
      const parts = []
      if (note.chapter) parts.push(note.chapter)
      if (note.page != null) parts.push(`p.${note.page}`)
      const header = parts.length > 0 ? `【${parts.join(' ')}】` : `【メモ${i + 1}】`
      return `${header}\n引用: ${note.quote || '（なし）'}\n考察: ${note.thought || '（なし）'}`
    }).join('\n\n')

    const bookLines = [`タイトル: ${book.title}`]
    if (book.author)    bookLines.push(`著者: ${book.author}`)
    if (book.publisher) bookLines.push(`出版社: ${book.publisher}`)
    const bookInfo = bookLines.join('\n')

    const instruction = 'あなたは読書メモの編集を手伝うアシスタントです。以下は、ある本について読者が記録した引用（原文の抜粋）と考察（読者自身の感想・思考）です。これらをもとに、本全体を振り返る1つの読書メモを日本語で作成してください。要件: (1) 個々のメモの羅列ではなく、本全体のテーマや論旨を踏まえて統合する。(2) 読者自身の考察を軸に発展させ、引用は要点を生かして適宜織り込む。(3) Markdown で見出しと段落を使い読みやすくする。(4) メモにない内容を推測で補わず、事実を捏造しない。(5) 出力は読書メモ本文のみとし、前置きや『以下が〜』などの定型句は書かない。'

    const prompt = `${bookInfo}\n\n${instruction}\n\n${notesText}`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!response.ok) {
      await response.text()
      return res.status(response.status).json({ error: 'AI生成に失敗しました' })
    }

    const data = await response.json()
    const text = data.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('')

    return res.status(200).json({ summary: text })
  } catch (err) {
    console.error('[organize-notes] error:', err)
    return res.status(500).json({ error: 'サーバーエラーが発生しました' })
  }
}
