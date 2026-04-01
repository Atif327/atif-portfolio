const express = require('express')

const router = express.Router()

const assistantProfile = {
  name: 'Atif Ayyoub',
  title: 'AI Web & Custom Software Developer',
  email: 'atifayyoub82@gmail.com',
  location: 'Pakistan',
  services: ['Web Development', 'AI Integration', 'Custom Software Development', 'API Development', 'Mobile App Development'],
  projects: [
    { title: 'Wallpaper Hub', description: 'Laravel-powered wallpaper browsing app.' },
    { title: 'Task Manager', description: 'Flutter productivity app for tasks and reminders.' },
    { title: 'Student Evaluation System', description: 'React and Node.js assessment platform.' },
  ],
  skills: ['React', 'Node.js', 'JavaScript', 'OpenAI', 'Flutter', 'Laravel', 'PHP', 'MySQL', 'Supabase'],
}

function normalize(value) {
  return String(value || '').toLowerCase().trim()
}

function buildReply(message) {
  const text = normalize(message)

  if (!text) return 'Ask me about Atif Ayyoub, his services, projects, or how to hire him.'

  if (/\b(hi|hello|hey)\b/.test(text)) {
    return `Quick answer: I can help you explore ${assistantProfile.name}'s portfolio, services, and hiring details. Ask me about projects, skills, or contact info.`
  }

  if (/\b(who are you|who is atif|about atif|introduce yourself)\b/.test(text)) {
    return `${assistantProfile.name} is a ${assistantProfile.title} based in ${assistantProfile.location}. He focuses on practical AI features, scalable web apps, and polished user experiences.`
  }

  if (/\b(projects?|case studies|built)\b/.test(text)) {
    const projects = assistantProfile.projects.map((project) => `- ${project.title}: ${project.description}`).join('\n')
    return `Quick answer: Atif has built portfolio projects across web and mobile development.\n\nFeatured work:\n${projects}`
  }

  if (/\b(services?|offer|hire)\b/.test(text)) {
    const services = assistantProfile.services.map((service) => `- ${service}`).join('\n')
    return `Quick answer: Atif offers these services:\n\n${services}\n\nTo hire him, share your scope, timeline, and budget through the contact form or email ${assistantProfile.email}.`
  }

  if (/\b(skills?|stack|technologies?|tech|tools)\b/.test(text)) {
    return `Quick answer: Atif works with ${assistantProfile.skills.join(', ')} and related tooling for modern web delivery.`
  }

  if (/\b(contact|email|reach|message)\b/.test(text)) {
    return `Quick answer: The best direct contact is ${assistantProfile.email}. You can also use the portfolio contact form for project inquiries.`
  }

  if (/\b(ai|openai|assistant|automation|chatbot)\b/.test(text)) {
    return 'Quick answer: Atif builds practical AI integrations, assistants, and automation features that stay focused on real product value.'
  }

  return `Quick answer: ${assistantProfile.name} is a ${assistantProfile.title}. Ask me about projects, services, skills, or contact info for a focused answer.`
}

router.post('/chat', (req, res) => {
  try {
    const message = req.body?.message
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Message is required.' })
    }

    const reply = buildReply(message)

    return res.json({
      reply,
      assistant: assistantProfile,
    })
  } catch (error) {
    console.error('assistant-chat route error:', error)
    return res.status(500).json({ error: 'Unable to generate assistant response.' })
  }
})

module.exports = router
