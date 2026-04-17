import assistantCore from '../server/assistant-core.js'

function sanitizeSessionId(value) {
  return String(value || '')
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .slice(0, 80)
}

function getSessionId(req) {
  return (
    sanitizeSessionId(req.body?.sessionId) ||
    sanitizeSessionId(req.query?.sessionId) ||
    sanitizeSessionId(req.headers['x-session-id'])
  )
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const message = String(req.body?.message || '').trim()
    if (!message) return res.status(400).json({ message: 'Message is required.' })

    const result = await assistantCore.sendMessage({
      chatId: req.body?.chatId,
      message,
      sessionId: getSessionId(req),
      portfolioContext: req.body?.portfolioContext,
      preferredProvider: req.body?.preferredProvider,
    })

    return res.status(200).json(result)
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Unable to process chat message.' })
  }
}
