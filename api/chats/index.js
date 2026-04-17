import assistantCore from '../../server/assistant-core.js'

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
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const chats = await assistantCore.getChats({ sessionId: getSessionId(req) })
    return res.status(200).json({ chats })
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Unable to fetch chats.' })
  }
}
