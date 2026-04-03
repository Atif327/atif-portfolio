import { createClient } from '@supabase/supabase-js'

const WINDOW_MS = 60 * 1000
const MAX_REQUESTS_PER_WINDOW = 8
const rateLimitStore = new Map()

function getServerSupabase() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) return null
  return createClient(supabaseUrl, serviceRoleKey)
}

function getClientIp(req) {
  const xff = req.headers['x-forwarded-for']
  if (Array.isArray(xff)) return xff[0]
  if (typeof xff === 'string') return xff.split(',')[0].trim()
  return req.socket?.remoteAddress || 'unknown'
}

function isRateLimited(req) {
  const now = Date.now()
  const ip = getClientIp(req)
  const bucket = rateLimitStore.get(ip)

  if (!bucket || now > bucket.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return false
  }

  if (bucket.count >= MAX_REQUESTS_PER_WINDOW) return true

  bucket.count += 1
  rateLimitStore.set(ip, bucket)
  return false
}

function sanitizeText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim()
}

function getAdminCredentials() {
  return {
    username: process.env.ADMIN_USERNAME || process.env.VITE_ADMIN_USERNAME || 'admin',
    password: process.env.ADMIN_PASSWORD || process.env.VITE_ADMIN_PASSWORD || 'admin123',
  }
}

function isAdminAuthorized(req) {
  const headerUsername = sanitizeText(req.headers['x-admin-username'])
  const headerPassword = sanitizeText(req.headers['x-admin-password'])
  const creds = getAdminCredentials()
  return headerUsername === creds.username && headerPassword === creds.password
}

function normalizeReviewRow(row) {
  return {
    id: row.id,
    name: row.name,
    rating: row.rating,
    message: row.message,
    createdAt: row.created_at,
  }
}

function normalizeAdminReviewRow(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    rating: row.rating,
    message: row.message,
    approved: Boolean(row.approved),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function validatePayload(payload) {
  const name = sanitizeText(payload?.name)
  const email = sanitizeText(payload?.email).toLowerCase()
  const message = sanitizeText(payload?.message)
  const rating = Number(payload?.rating)

  if (!name || name.length < 2 || name.length > 100) {
    return { ok: false, message: 'Name must be between 2 and 100 characters.' }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email) || email.length > 200) {
    return { ok: false, message: 'Please provide a valid email address.' }
  }

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { ok: false, message: 'Rating must be an integer from 1 to 5.' }
  }

  if (!message || message.length < 8 || message.length > 1200) {
    return { ok: false, message: 'Review message must be between 8 and 1200 characters.' }
  }

  return {
    ok: true,
    value: {
      name,
      email,
      rating,
      message,
    },
  }
}

async function handlePost(req, res, supabase) {
  if (isRateLimited(req)) {
    return res.status(429).json({ message: 'Too many review attempts. Please try again shortly.' })
  }

  const validation = validatePayload(req.body)
  if (!validation.ok) {
    return res.status(400).json({ message: validation.message })
  }

  const { name, email, rating, message } = validation.value

  const { data: existing, error: lookupError } = await supabase
    .from('reviews')
    .select('id')
    .ilike('email', email)
    .maybeSingle()

  if (lookupError && lookupError.code !== 'PGRST116') {
    return res.status(500).json({ message: 'Could not validate review uniqueness.' })
  }

  if (existing) {
    return res.status(409).json({ message: 'This email has already submitted a review.' })
  }

  const { error: insertError } = await supabase.from('reviews').insert({
    name,
    email,
    rating,
    message,
    approved: false,
  })

  if (insertError) {
    if (insertError.code === '23505') {
      return res.status(409).json({ message: 'This email has already submitted a review.' })
    }
    return res.status(500).json({ message: 'Could not submit review.' })
  }

  return res.status(201).json({
    success: true,
    message: 'Review submitted successfully and is pending approval.',
  })
}

async function handleGet(res, supabase) {
  const { data, error } = await supabase
    .from('reviews')
    .select('id, name, rating, message, created_at')
    .eq('approved', true)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    return res.status(500).json({ message: 'Could not fetch reviews.' })
  }

  return res.status(200).json({
    reviews: Array.isArray(data) ? data.map(normalizeReviewRow) : [],
  })
}

async function handleAdminGet(res, supabase) {
  const { data, error } = await supabase
    .from('reviews')
    .select('id, name, email, rating, message, approved, created_at, updated_at')
    .order('created_at', { ascending: false })
    .limit(300)

  if (error) {
    return res.status(500).json({ message: 'Could not fetch admin reviews.' })
  }

  return res.status(200).json({
    reviews: Array.isArray(data) ? data.map(normalizeAdminReviewRow) : [],
  })
}

async function handleAdminPatch(req, res, supabase) {
  const reviewId = sanitizeText(req.body?.id)
  const approved = req.body?.approved

  if (!reviewId) {
    return res.status(400).json({ message: 'Review id is required.' })
  }

  if (typeof approved !== 'boolean') {
    return res.status(400).json({ message: 'Approved must be a boolean.' })
  }

  const { error } = await supabase
    .from('reviews')
    .update({
      approved,
      updated_at: new Date().toISOString(),
    })
    .eq('id', reviewId)

  if (error) {
    return res.status(500).json({ message: 'Could not update review status.' })
  }

  return res.status(200).json({ success: true })
}

async function handleAdminDelete(req, res, supabase) {
  const reviewId = sanitizeText(req.query?.id || req.body?.id)
  if (!reviewId) {
    return res.status(400).json({ message: 'Review id is required.' })
  }

  const { error } = await supabase.from('reviews').delete().eq('id', reviewId)

  if (error) {
    return res.status(500).json({ message: 'Could not delete review.' })
  }

  return res.status(200).json({ success: true })
}

export default async function handler(req, res) {
  try {
    const supabase = getServerSupabase()
    const scope = sanitizeText(req.query?.scope).toLowerCase()
    const isAdminScope = scope === 'admin'

    if (!supabase) {
      return res.status(500).json({ message: 'Server is missing Supabase credentials.' })
    }

    if (isAdminScope || req.method === 'PATCH' || req.method === 'DELETE') {
      if (!isAdminAuthorized(req)) {
        return res.status(401).json({ message: 'Unauthorized admin request.' })
      }
    }

    if (req.method === 'POST') {
      return handlePost(req, res, supabase)
    }

    if (req.method === 'GET') {
      if (isAdminScope) {
        return handleAdminGet(res, supabase)
      }
      return handleGet(res, supabase)
    }

    if (req.method === 'PATCH') {
      return handleAdminPatch(req, res, supabase)
    }

    if (req.method === 'DELETE') {
      return handleAdminDelete(req, res, supabase)
    }

    return res.status(405).json({ message: 'Method not allowed' })
  } catch (error) {
    console.error('Reviews API handler error:', error)
    return res.status(500).json({ message: 'Could not submit review right now. Please try again shortly.' })
  }
}
