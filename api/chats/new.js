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
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const chat = await assistantCore.createNewChat({
      sessionId: getSessionId(req),
      title: req.body?.title,
    })

    return res.status(201).json({ chat })
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Unable to create chat.' })
  }
}
