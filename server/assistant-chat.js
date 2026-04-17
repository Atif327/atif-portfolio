const express = require('express')
const assistantCore = require('./assistant-core')

const router = express.Router()

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

router.post('/chat', async (req, res) => {
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
})

router.post('/chats/new', async (req, res) => {
  try {
    const chat = await assistantCore.createNewChat({
      sessionId: getSessionId(req),
      title: req.body?.title,
    })

    return res.status(201).json({ chat })
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Unable to create chat.' })
  }
})

router.get('/chats', async (req, res) => {
  try {
    const chats = await assistantCore.getChats({ sessionId: getSessionId(req) })
    return res.status(200).json({ chats })
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Unable to fetch chats.' })
  }
})

router.get('/chats/:id', async (req, res) => {
  try {
    const thread = await assistantCore.getChatThread({
      chatId: req.params.id,
      sessionId: getSessionId(req),
    })

    if (!thread) {
      return res.status(404).json({ message: 'Chat thread not found.' })
    }

    return res.status(200).json(thread)
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Unable to fetch chat thread.' })
  }
})

module.exports = router
