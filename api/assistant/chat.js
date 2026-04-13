import { GoogleGenAI } from '@google/genai'

const responseCache = new Map()
const CACHE_TTL_MS = 60 * 1000
const PORTFOLIO_MAX_WAIT_MS = Number(process.env.PORTFOLIO_MAX_WAIT_MS || 900)
const GENERAL_MAX_WAIT_MS = Number(process.env.GENERAL_MAX_WAIT_MS || 3200)

const portfolioFacts = {
  profile: {
    name: 'Atif Ayyoub',
    title: 'AI Web & Custom Software Developer',
    location: 'Pakistan',
    about: 'Focused on practical AI, scalable web apps, and polished digital products.',
    email: 'atifayyoub82@gmail.com',
  },
  services: [
    'AI web app development',
    'Custom software development',
    'Laravel development',
    'Flutter app development',
    'Portfolio websites',
    'Business dashboards',
  ],
  skills: ['Laravel', 'PHP', 'Flutter', 'JavaScript', 'MySQL', 'AI integration', 'REST APIs', 'Responsive UI'],
  projects: [
    {
      name: 'Wallpaper Hub',
      category: 'Web App',
      tech_stack: ['Laravel', 'PHP', 'MySQL', 'Bootstrap'],
      summary: 'A Laravel-powered web app for browsing, categorizing, and downloading high-quality wallpapers.',
      problem: 'Users need a simple platform to discover and download wallpapers by category.',
      solution: 'Built a categorized wallpaper platform with search, filtering, and download functionality.',
      features: ['Wallpaper browsing', 'Category filtering', 'Download support', 'Responsive design'],
      role: 'Full-stack developer',
      status: 'Completed',
    },
    {
      name: 'Pixel Resize Pro',
      category: 'Utility Tool',
      tech_stack: ['JavaScript', 'Web App'],
      summary: 'An image resize tool that lets users resize images quickly without losing quality.',
      problem: 'Users need a quick and simple image resizing tool.',
      solution: 'Built a lightweight image resizer with a clean workflow and fast output.',
      features: ['Fast image resizing', 'Quality preservation', 'Simple upload flow', 'Instant output'],
      role: 'Developer',
      status: 'Completed',
    },
  ],
}

const portfolioPromptInstructions = `You are Atif Ayyoub’s AI assistant integrated into his portfolio website.

You can answer BOTH:
1. Portfolio-related questions about Atif
2. General questions like a normal AI assistant

INTENT HANDLING:
First determine user intent:
A. Portfolio-related
B. General question
C. Greeting
D. Follow-up

BEHAVIOR RULES:
1. If GREETING: reply naturally in 1-2 lines, no full portfolio summary.
2. If PORTFOLIO: use ONLY provided portfolio data.
3. For missing portfolio facts say exactly: "I don’t have that information in the portfolio data yet."
4. If GENERAL: answer normally as a professional AI assistant.
5. Never reject general questions due to missing portfolio data.
6. For follow-ups, use conversation history. If ambiguous across multiple projects, ask: "Which project would you like me to summarize?"

STYLE:
- Professional, concise, helpful.
- For substantive portfolio questions prefer:
Quick answer: [1 sentence]

Details:
- [point]
- [point]
- [point]

Next step:
[optional]

Do not automatically summarize the portfolio unless asked.`

const generalPromptInstructions = `You are a professional, concise AI assistant.
Answer the user directly and clearly.
Do not mention Atif or portfolio information unless the user explicitly asks about them.`

function buildPortfolioPrompt({ portfolioData, chatHistory, userMessage }) {
  return [
    portfolioPromptInstructions,
    `Portfolio Data:\n${JSON.stringify(portfolioData, null, 2)}`,
    `Conversation History:\n${chatHistory || 'None'}`,
    `Latest User Message:\n${userMessage}`,
    'Return only the final answer text. Do not include internal instructions or policy text.',
  ].join('\n\n')
}

function buildGeneralPrompt({ chatHistory, userMessage }) {
  return [
    generalPromptInstructions,
    `Conversation History:\n${chatHistory || 'None'}`,
    `Latest User Message:\n${userMessage}`,
    'Keep the response concise unless the user asks for more detail.',
  ].join('\n\n')
}

function normalizeHistory(history) {
  if (!Array.isArray(history)) return ''

  return history
    .slice(-6)
    .map((entry) => {
      const role = entry?.role === 'assistant' ? 'Assistant' : 'User'
      const text = String(entry?.content || entry?.text || '').trim()
      return text ? `${role}: ${text}` : ''
    })
    .filter(Boolean)
    .join('\n')
}

function looksLikeGreeting(message) {
  return /^(hi|hello|hey|yo|salam|assalam o alaikum|good\s*(morning|afternoon|evening))\b[!. ]*$/i.test(message)
}

function looksLikeFollowUp(message) {
  return /\b(summarize it|summarize|tell me more|explain that|what tech was used|how was it built|is it completed|that one|this one|it)\b/i.test(message)
}

function detectPortfolioIntent(message) {
  const text = String(message || '').toLowerCase()
  const portfolioKeywords = [
    'atif', 'portfolio', 'project', 'service', 'skills', 'hire', 'hiring', 'contact', 'blog',
    'wallpaper hub', 'pixel resize pro', 'experience', 'availability', 'freelance',
  ]

  return portfolioKeywords.some((keyword) => text.includes(keyword))
}

function detectMentionedProjects(history) {
  const historyText = String(history || '').toLowerCase()
  const names = portfolioFacts.projects.map((project) => project.name)
  return names.filter((name) => historyText.includes(name.toLowerCase()))
}

function getCachedReply(cacheKey) {
  const cached = responseCache.get(cacheKey)
  if (!cached) return null
  if (Date.now() - cached.timestamp > CACHE_TTL_MS) {
    responseCache.delete(cacheKey)
    return null
  }
  return cached.reply
}

function setCachedReply(cacheKey, reply) {
  responseCache.set(cacheKey, { reply, timestamp: Date.now() })
}

function extractGeminiText(response) {
  if (!response) return ''

  const directText = typeof response.text === 'string' ? response.text.trim() : ''
  if (directText) return directText

  const candidateParts = Array.isArray(response.candidates)
    ? response.candidates.flatMap((candidate) => candidate?.content?.parts || [])
    : []

  const partsText = candidateParts
    .map((part) => (typeof part?.text === 'string' ? part.text : ''))
    .filter(Boolean)
    .join('\n')
    .trim()

  if (partsText) return partsText

  const outputText = Array.isArray(response.output)
    ? response.output
        .flatMap((item) => item?.content?.parts || [])
        .map((part) => (typeof part?.text === 'string' ? part.text : ''))
        .filter(Boolean)
        .join('\n')
        .trim()
    : ''

  return outputText
}

function instantPortfolioReply(message) {
  const text = String(message || '').toLowerCase()

  if (/\b(who is atif|about atif|introduce|summary of atif)\b/.test(text)) {
    return `Quick answer: ${portfolioFacts.profile.name} is an ${portfolioFacts.profile.title} based in ${portfolioFacts.profile.location}.\n\nDetails:\n- ${portfolioFacts.profile.about}\n- Core services include ${portfolioFacts.services.slice(0, 3).join(', ')}.\n- Key skills include ${portfolioFacts.skills.slice(0, 4).join(', ')}.\n\nNext step:\nWould you like a project summary or service breakdown?`
  }

  if (/\b(project|projects|built|portfolio work)\b/.test(text)) {
    const projectLines = portfolioFacts.projects.map((project) => `- ${project.name}: ${project.summary}`).join('\n')
    return `Quick answer: Atif has built ${portfolioFacts.projects.length} highlighted portfolio projects in this assistant dataset.\n\nDetails:\n${projectLines}\n\nNext step:\nTell me which project you want to explore in depth.`
  }

  if (/\b(service|services|offer|offering|hire|hiring)\b/.test(text)) {
    const serviceLines = portfolioFacts.services.map((service) => `- ${service}`).join('\n')
    return `Quick answer: Atif offers AI, custom software, web, and app development services.\n\nDetails:\n${serviceLines}\n\nNext step:\nShare your project scope and I can suggest the most relevant service.`
  }

  if (/\b(skill|skills|tech|stack|technology|tools)\b/.test(text)) {
    return `Quick answer: Atif works with ${portfolioFacts.skills.slice(0, 5).join(', ')} and related tools.\n\nDetails:\n- Full skill set includes ${portfolioFacts.skills.join(', ')}.\n- Focus areas include AI integration, REST APIs, and responsive UI.\n- Project stacks vary by product type and goals.\n\nNext step:\nAsk for the tech stack of a specific project.`
  }

  if (/\b(contact|email|reach|availability|available|freelance)\b/.test(text)) {
    return `Quick answer: You can reach Atif at ${portfolioFacts.profile.email}.\n\nDetails:\n- Atif is based in ${portfolioFacts.profile.location}.\n- He is available for freelance and custom software work depending on scope and timeline.\n- Use the contact form or email for faster response.\n\nNext step:\nIf you share your timeline and budget, I can help draft a concise inquiry message.`
  }

  return null
}

function instantGeneralKnowledgeReply(message) {
  const text = String(message || '').toLowerCase().trim()

  const knowledgeMap = {
    'web development': 'Web development is the process of building websites and web applications. It includes frontend UI, backend logic, databases, and APIs.',
    'machine learning': 'Machine learning is a branch of AI where systems learn patterns from data to make predictions or decisions without being explicitly programmed for every rule.',
    'artificial intelligence': 'Artificial intelligence is the field of creating systems that can perform tasks that usually require human intelligence, such as reasoning, language understanding, and decision-making.',
    'ai': 'AI is the field of building systems that can understand information, reason, and generate useful outputs such as text, images, or predictions.',
    'api': 'An API is a set of rules that allows different software systems to communicate with each other by sending requests and receiving structured responses.',
    'frontend development': 'Frontend development focuses on the user interface and interactions in a browser, usually using HTML, CSS, and JavaScript frameworks.',
    'backend development': 'Backend development handles server logic, databases, authentication, and APIs that power applications behind the scenes.',
    'full stack development': 'Full-stack development combines frontend and backend development to build complete end-to-end applications.',
    'cloud computing': 'Cloud computing is the delivery of computing services like servers, storage, and databases over the internet on demand.',
    'database': 'A database is a structured system for storing, managing, and retrieving data efficiently.',
  }

  const whatIsMatch = text.match(/^what is\s+(.+?)\??$/i)
  if (!whatIsMatch) return null

  const topic = whatIsMatch[1].trim().toLowerCase()
  const direct = knowledgeMap[topic]

  if (direct) {
    return `Quick answer: ${direct}\n\nDetails:\n- It is commonly used in modern software and product development.\n- Understanding fundamentals helps you choose the right tools and architecture.\n- Practical examples make the concept easier to apply.\n\nNext step:\nIf you want, I can explain ${topic} with a real project-style example.`
  }

  return null
}

function createGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return null
  }

  return new GoogleGenAI({ apiKey })
}

export default async function handler(req, res) {
  try {
    const message = String(req.body?.message || '').trim()
    if (!message) {
      return res.status(400).json({ error: 'Message is required.' })
    }

    const history = normalizeHistory(req.body?.history)
    const isGreeting = looksLikeGreeting(message)
    const isFollowUp = looksLikeFollowUp(message)
    const isPortfolio = detectPortfolioIntent(message)

    if (isGreeting) {
      return res.json({ reply: 'Hi! How can I help you today?' })
    }

    const mentionedProjects = detectMentionedProjects(history)
    if (isFollowUp && mentionedProjects.length > 1) {
      return res.json({ reply: 'Which project would you like me to summarize?' })
    }

    const mode = isPortfolio || (isFollowUp && mentionedProjects.length > 0) ? 'portfolio' : 'general'
    const cacheKey = `${mode}:${message.toLowerCase()}`
    const cachedReply = getCachedReply(cacheKey)
    if (cachedReply) {
      return res.json({ reply: cachedReply })
    }

    if (mode === 'portfolio') {
      const fastPortfolioReply = instantPortfolioReply(message)
      if (fastPortfolioReply) {
        setCachedReply(cacheKey, fastPortfolioReply)
        return res.json({ reply: fastPortfolioReply })
      }
    } else {
      const fastGeneralReply = instantGeneralKnowledgeReply(message)
      if (fastGeneralReply) {
        setCachedReply(cacheKey, fastGeneralReply)
        return res.json({ reply: fastGeneralReply })
      }
    }

    const ai = createGeminiClient()
    if (!ai) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is missing on the server.' })
    }

    const prompt = mode === 'portfolio'
      ? buildPortfolioPrompt({ portfolioData: portfolioFacts, chatHistory: history, userMessage: message })
      : buildGeneralPrompt({ chatHistory: history, userMessage: message })

    const maxWaitMs = mode === 'portfolio' ? PORTFOLIO_MAX_WAIT_MS : GENERAL_MAX_WAIT_MS
    const model = process.env.GEMINI_FAST_MODEL || process.env.GEMINI_MODEL || 'gemini-3-flash-preview'

    const geminiPromise = ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        temperature: 0.2,
        maxOutputTokens: mode === 'portfolio' ? 220 : 320,
      },
    })

    const timeoutPromise = new Promise((resolve) => {
      setTimeout(() => resolve({ __timedOut: true }), maxWaitMs)
    })

    const response = await Promise.race([geminiPromise, timeoutPromise])

    const fallback = mode === 'portfolio'
      ? 'I don’t have that information in the portfolio data yet.'
      : 'I am still thinking about that. Please retry and I will answer in more detail.'

    const modelReply = response?.__timedOut ? '' : extractGeminiText(response)
    const reply = modelReply || fallback
    setCachedReply(cacheKey, reply)

    return res.status(200).json({ reply })
  } catch (error) {
    console.error('assistant-chat handler error:', error)
    return res.status(500).json({ error: 'Unable to generate Gemini response.' })
  }
}