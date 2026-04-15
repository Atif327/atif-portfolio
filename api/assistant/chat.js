import { GoogleGenAI } from '@google/genai'

const responseCache = new Map()
const CACHE_TTL_MS = 60 * 1000
const CACHE_VERSION = 3
const MIN_RESPONSE_DELAY_MS = Number(process.env.MIN_RESPONSE_DELAY_MS || 2000)
const PORTFOLIO_MAX_WAIT_MS = Number(process.env.PORTFOLIO_MAX_WAIT_MS || 900)
const GENERAL_MAX_WAIT_MS = Number(process.env.GENERAL_MAX_WAIT_MS || 3200)

const portfolioFacts = {
  profile: {
    name: 'Atif Ayyoub',
    title: 'AI Web & Custom Software Developer',
    location: 'Pakistan',
    about:
      'A results-driven software engineer focused on practical AI, scalable web apps, polished digital products, and reliable client communication.',
    tagline: 'Consistency Makes a Man Perfect in Their Skill Set.',
    email: 'atifayyoub82@gmail.com',
    phone: '+923270728950',
    languages: ['English', 'Urdu', 'Punjabi'],
    nationality: 'Pakistan',
    education: 'Bachelor of Science in Software Engineering at Comsats University Islamabad, Vehari Campus',
  },
  
  services: [
    {
      title: 'UI/UX Design',
      category: 'Design',
      rate: '$20/hour',
      shortDescription: 'Crafting intelligent UI/UX experiences with AI-powered design thinking.',
      fullDescription: 'Clean, modern interfaces supported by smart visual systems and prototypes for web and mobile products.',
    },
    {
      title: 'Web Development',
      category: 'Development',
      rate: '$20/hour',
      shortDescription: 'Building modern, responsive, and high-performance websites.',
      fullDescription: 'Scalable web applications focused on secure, fast, and user-friendly digital experiences.',
    },
    {
      title: 'Mobile App Development',
      category: 'Development',
      rate: '$20/hour',
      shortDescription: 'High-performance mobile apps with clean maintainable code.',
      fullDescription: 'Responsive and maintainable mobile solutions delivered with modern frameworks.',
    },
    {
      title: 'Desktop App Development',
      category: 'Development',
      rate: '$20/hour',
      shortDescription: 'Robust desktop applications for Windows, Mac, and Linux.',
      fullDescription: 'Reliable desktop solutions that turn complex workflows into intuitive experiences.',
    },
    {
      title: 'AI Integration',
      category: 'AI Tools',
      rate: '$25/hour',
      shortDescription: 'Integrating AI capabilities into products for smarter workflows and automation.',
      fullDescription: 'Practical AI features such as chat assistants, workflow automation, and intelligent recommendations.',
    },
    {
      title: 'API Development',
      category: 'APIs',
      rate: '$22/hour',
      shortDescription: 'Secure and scalable APIs for web, mobile, and third-party integrations.',
      fullDescription: 'REST APIs with clean architecture, robust validation, and documentation for maintainability.',
    },
  ],
  skills: ['Laravel', 'PHP', 'Flutter', 'JavaScript', 'MySQL', 'AI integration', 'REST APIs', 'Responsive UI'],
  projects: [
    {
      title: 'Wallpaper Hub',
      category: 'Web Apps',
      technologies: ['Laravel', 'PHP', 'MySQL'],
      summary: 'Laravel-powered web app for browsing, categorizing, and downloading high-quality wallpapers.',
      fullDescription:
        'Built with Laravel and MySQL. Supports user uploads, fast search, categories, and optimized image delivery for responsive viewing and downloads.',
      highlights: 'High quality image delivery, fast filtering, responsive UI.',
      challengesSolutions: 'Improved loading speed with optimized image rendering and structured categories.',
      githubUrl: 'https://github.com/Atif327/Wallhub',
      role: 'Full Stack Developer',
      status: 'completed',
    },
    {
      title: 'Task Manager',
      category: 'Mobile Apps',
      technologies: ['Flutter', 'Dart', 'SQLite'],
      summary: 'Flutter app for creating, organizing and tracking tasks and subtasks.',
      fullDescription: 'Built with Dart and SQLite with reminders, priorities, and progress tracking for offline-first productivity.',
      highlights: 'Offline-first architecture and simple UX.',
      challengesSolutions: 'Handled local state complexity with structured task model.',
      githubUrl: '',
      role: 'Mobile Developer',
      status: 'completed',
    },
    {
      title: 'Student Evaluation System',
      category: 'Web Apps',
      technologies: ['React', 'Node.js', 'SQLite'],
      summary: 'React + Node.js platform for managing assessments and attendance.',
      fullDescription: 'Uses SQLite storage and provides grade entry, analytics, and exportable summaries for instructors.',
      highlights: 'Assessment workflows, attendance tracking, reports.',
      challengesSolutions: 'Reduced manual reporting through export-ready summaries.',
      githubUrl: '',
      role: 'Full Stack Developer',
      status: 'completed',
    },
  ],
  education: [
    {
      title: 'Bachelor of Science in Software Engineering',
      institution: 'Comsats University Islamabad, Vehari Campus',
      status: 'Ongoing',
      duration: '2021 - Present',
      meta: ['CGPA 3.48', 'Spring 2025', 'Ongoing'],
    },
    {
      title: 'F.Sc. Pre-Medical',
      institution: 'Aspire College, Mailsi',
      status: 'Completed',
      duration: '2019 - 2021',
      meta: ['Marks 962 out of 1100', 'Completed'],
    },
    {
      title: 'Matriculation Science',
      institution: 'Rehan Public Boys High School',
      status: 'Completed',
      duration: '2017 - 2019',
      meta: ['Marks 1013 out of 1100', 'Completed'],
    },
  ],
  contact: {
    email: 'atifayyoub82@gmail.com',
    phone: '+923270728950',
    location: 'Pakistan',
    languages: ['English', 'Urdu', 'Punjabi'],
  },
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
  const names = portfolioFacts.projects.map((project) => project.title)
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

function joinList(values, limit = values.length) {
  return values.slice(0, limit).join(', ')
}

function formatServiceNames(services, limit) {
  return services.slice(0, limit).map((service) => service.title).join(', ')
}

function formatProjectLines(projects) {
  return projects
    .map((project) => {
      const tech = Array.isArray(project.technologies) ? project.technologies.join(', ') : ''
      const role = project.role ? ` Role: ${project.role}.` : ''
      const highlights = project.highlights ? ` Highlights: ${project.highlights}.` : ''
      const fullDescription = project.fullDescription ? ` Details: ${project.fullDescription}` : ''
      const github = project.githubUrl ? ` GitHub: ${project.githubUrl}` : ''
      return `- ${project.title} (${project.category}): ${project.summary}${tech ? ` Tech: ${tech}.` : ''}${role}${highlights}${fullDescription ? ` ${fullDescription}` : ''}${github}`
    })
    .join('\n')
}

function formatEducationLines(education) {
  return education
    .map((item) => `- ${item.title} at ${item.institution} (${item.status}, ${item.duration})`)
    .join('\n')
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

function buildConcurrencyServerAnswer() {
  return [
    'Quick answer: Design the server with a thread pool and shared-state synchronization so each client request is handled concurrently while shared resources remain consistent and safe.',
    '',
    'Details:',
    '- Concurrency model: Use a listener/acceptor thread to accept incoming connections and hand each client task to a fixed-size thread pool. This avoids creating unbounded threads and keeps throughput stable under load.',
    '- Thread pool sizing: Start with CPU-bound sizing near number of cores and higher sizing for I/O-bound workloads. Add a bounded task queue and rejection/backpressure policy to prevent memory spikes during traffic bursts.',
    '- Shared resource safety: Keep request-local state inside each worker thread. For shared objects (cache, in-memory session map, counters), use thread-safe objects or synchronization primitives.',
    '- Synchronization strategy: Use mutex/locks for critical sections, read-write locks for read-heavy data, and atomic types for counters/flags. Keep lock scope small to reduce contention and avoid deadlocks.',
    '- Thread-safe objects: Prefer concurrent collections (for example a concurrent map) instead of manual locking where possible. For mutable shared domain objects, apply immutability or guard mutations with locks.',
    '- Correctness rules: Define lock ordering, avoid nested locks where possible, and use timeouts around lock acquisition to reduce deadlock risk. Validate invariants after updates.',
    '- Data integrity: For database writes, use transactions and proper isolation levels. Combine app-level locking with DB constraints for correctness under concurrent writes.',
    '- Reliability and observability: Add request timeouts, circuit breakers, structured logs, and metrics (queue depth, active threads, lock wait time, error rate) to detect bottlenecks early.',
    '- Scalability path: Keep handlers stateless where possible so multiple server instances can run behind a load balancer; move shared state to external stores (DB/Redis).',
    '',
    'Next step:',
    'If you want, I can also provide language-specific pseudocode for a thread-pool server with synchronized shared cache and transactional DB writes.',
  ].join('\n')
}

async function ensureMinResponseDelay(startTimeMs) {
  const elapsedMs = Date.now() - startTimeMs
  const remainingMs = MIN_RESPONSE_DELAY_MS - elapsedMs
  if (remainingMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, remainingMs))
  }
}

function instantPortfolioReply(message) {
  const text = String(message || '').toLowerCase()

  if (/\b(who is atif|about atif|introduce|summary of atif)\b/.test(text)) {
    return [
      `Quick answer: ${portfolioFacts.profile.name} is an ${portfolioFacts.profile.title} based in ${portfolioFacts.profile.location}.`,
      '',
      'Details:',
      `- ${portfolioFacts.profile.about}`,
      `- Professional tagline: ${portfolioFacts.profile.tagline}`,
      `- Education: ${portfolioFacts.profile.education}`,
      `- Core services: ${formatServiceNames(portfolioFacts.services, 3)}.`,
      `- Core skills: ${joinList(portfolioFacts.skills, 5)}.`,
      `- Contact: ${portfolioFacts.profile.email} | ${portfolioFacts.profile.phone}`,
      `- Languages: ${joinList(portfolioFacts.profile.languages)}.`,
      '',
      'Projects:',
      formatProjectLines(portfolioFacts.projects),
      '',
      'Education:',
      formatEducationLines(portfolioFacts.education),
      '',
      'Next step:',
      'Would you like a service breakdown, project deep dive, or contact summary?',
    ].join('\n')
  }

  if (/\b(project|projects|built|portfolio work)\b/.test(text)) {
    return [
      `Quick answer: Atif has built ${portfolioFacts.projects.length} portfolio projects in this assistant dataset.`,
      '',
      'Details:',
      formatProjectLines(portfolioFacts.projects),
      '',
      'Next step:',
      'Tell me which project you want to explore in depth.',
    ].join('\n')
  }

  if (/\b(service|services|offer|offering|hire|hiring)\b/.test(text)) {
    const serviceLines = portfolioFacts.services
      .map((service) => `- ${service.title} (${service.category}, ${service.rate}): ${service.shortDescription}`)
      .join('\n')
    return `Quick answer: Atif offers AI, custom software, web, mobile, desktop, and API development services.\n\nDetails:\n${serviceLines}\n\nNext step:\nShare your project scope and I can suggest the most relevant service.`
  }

  if (/\b(skill|skills|tech|stack|technology|tools)\b/.test(text)) {
    return `Quick answer: Atif works with ${portfolioFacts.skills.slice(0, 5).join(', ')} and related tools.\n\nDetails:\n- Full skill set includes ${portfolioFacts.skills.join(', ')}.\n- Focus areas include AI integration, REST APIs, and responsive UI.\n- Project stacks vary by product type and goals.\n\nNext step:\nAsk for the tech stack of a specific project.`
  }

  if (/\b(contact|email|reach|availability|available|freelance)\b/.test(text)) {
    return `Quick answer: You can reach Atif at ${portfolioFacts.contact.email}.\n\nDetails:\n- Atif is based in ${portfolioFacts.contact.location}.\n- Phone: ${portfolioFacts.contact.phone}.\n- He is available for freelance and custom software work depending on scope and timeline.\n- Languages: ${joinList(portfolioFacts.contact.languages)}.\n\nNext step:\nIf you share your timeline and budget, I can help draft a concise inquiry message.`
  }

  if (/\b(education|study|college|university|degree)\b/.test(text)) {
    return `Quick answer: Atif is studying Software Engineering and has a strong science background.\n\nDetails:\n${formatEducationLines(portfolioFacts.education)}\n\nNext step:\nIf you want, I can summarize his academic timeline in one line.`
  }

  return null
}

function instantGeneralKnowledgeReply(message) {
  const text = String(message || '').toLowerCase().trim()

  if (/\b(concurrency|threads?|thread pool|thread safety|synchronization|thread-safe|multiple clients|shared resources)\b/.test(text)) {
    return buildConcurrencyServerAnswer()
  }

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
  const requestStartMs = Date.now()
  const respond = async (statusCode, payload) => {
    await ensureMinResponseDelay(requestStartMs)
    return res.status(statusCode).json(payload)
  }

  try {
    const message = String(req.body?.message || '').trim()
    if (!message) {
      return respond(400, { error: 'Message is required.' })
    }

    const history = normalizeHistory(req.body?.history)
    const isGreeting = looksLikeGreeting(message)
    const isFollowUp = looksLikeFollowUp(message)
    const isPortfolio = detectPortfolioIntent(message)

    if (isGreeting) {
      return respond(200, { reply: 'Hi! How can I help you today?' })
    }

    const mentionedProjects = detectMentionedProjects(history)
    if (isFollowUp && mentionedProjects.length > 1) {
      return respond(200, { reply: 'Which project would you like me to summarize?' })
    }

    const mode = isPortfolio || (isFollowUp && mentionedProjects.length > 0) ? 'portfolio' : 'general'
    const cacheKey = `v${CACHE_VERSION}:${mode}:${message.toLowerCase()}`
    const cachedReply = getCachedReply(cacheKey)
    if (cachedReply) {
      return respond(200, { reply: cachedReply })
    }

    if (mode === 'portfolio') {
      const fastPortfolioReply = instantPortfolioReply(message)
      if (fastPortfolioReply) {
        setCachedReply(cacheKey, fastPortfolioReply)
        return respond(200, { reply: fastPortfolioReply })
      }
    } else {
      const fastGeneralReply = instantGeneralKnowledgeReply(message)
      if (fastGeneralReply) {
        setCachedReply(cacheKey, fastGeneralReply)
        return respond(200, { reply: fastGeneralReply })
      }
    }

    const ai = createGeminiClient()
    if (!ai) {
      return respond(500, { error: 'GEMINI_API_KEY is missing on the server.' })
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

    return respond(200, { reply })
  } catch (error) {
    console.error('assistant-chat handler error:', error)
    return respond(500, { error: 'Unable to generate Gemini response.' })
  }
}