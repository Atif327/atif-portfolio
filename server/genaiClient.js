// server/genaiClient.js
const { GoogleGenAI } = require('@google/genai')

const apiKey = process.env.GEMINI_API_KEY
if (!apiKey) {
  console.warn('GEMINI_API_KEY not set. Gemini calls will fail until provided.')
}

function createClient() {
  return new GoogleGenAI({ apiKey })
}

module.exports = {
  createClient
}
