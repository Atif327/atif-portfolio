const express = require('express')
const { createClient } = require('@supabase/supabase-js')

const router = express.Router()
const WINDOW_MS = 60 * 1000
const MAX_REQUESTS_PER_WINDOW = 8
const rateLimitStore = new Map()

function getSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY

  if (!supabaseUrl || !serviceRoleKey) return null
  return createClient(supabaseUrl, serviceRoleKey)
}

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for']
  if (Array.isArray(forwarded)) return forwarded[0]
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim()
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
    value: { name, email, rating, message },
  }
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

router.get('/', async (req, res) => {
  try {
    const scope = sanitizeText(req.query?.scope).toLowerCase()
    const isAdminScope = scope === 'admin'

    if (isAdminScope && !isAdminAuthorized(req)) {
      return res.status(401).json({ message: 'Unauthorized admin request.' })
    }

    const supabase = getSupabaseClient()

    if (!supabase) {
      return res.status(500).json({ message: 'Server is missing Supabase credentials.' })
    }

    const query = isAdminScope
      ? supabase
          .from('reviews')
          .select('id, name, email, rating, message, approved, created_at, updated_at')
          .order('created_at', { ascending: false })
          .limit(300)
      : supabase
          .from('reviews')
          .select('id, name, rating, message, created_at')
          .eq('approved', true)
          .order('created_at', { ascending: false })
          .limit(50)

    const { data, error } = await query

    if (error) {
      return res.status(500).json({ message: isAdminScope ? 'Could not fetch admin reviews.' : 'Could not fetch reviews.' })
    }

    return res.status(200).json({
      reviews: Array.isArray(data)
        ? data.map(isAdminScope ? normalizeAdminReviewRow : normalizeReviewRow)
        : [],
    })
  } catch (error) {
    console.error('Reviews GET error:', error)
    return res.status(500).json({ message: 'Could not fetch reviews right now.' })
  }
})

router.post('/', async (req, res) => {
  try {
    if (isRateLimited(req)) {
      return res.status(429).json({ message: 'Too many review attempts. Please try again shortly.' })
    }

    const supabase = getSupabaseClient()
    if (!supabase) {
      return res.status(500).json({ message: 'Server is missing Supabase credentials.' })
    }

    const validation = validatePayload(req.body)
    if (!validation.ok) {
      return res.status(400).json({ message: validation.message })
    }

    const { name, email, rating, message } = validation.value

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

      return res.status(500).json({ message: insertError.message || 'Could not submit review.' })
    }

    return res.status(201).json({
      success: true,
      message: 'Review submitted successfully and is pending approval.',
    })
  } catch (error) {
    console.error('Reviews POST error:', error)
    return res.status(500).json({ message: 'Could not submit review right now. Please try again shortly.' })
  }
})

router.patch('/', async (req, res) => {
  if (!isAdminAuthorized(req)) {
    return res.status(401).json({ message: 'Unauthorized admin request.' })
  }

  const supabase = getSupabaseClient()
  if (!supabase) {
    return res.status(500).json({ message: 'Server is missing Supabase credentials.' })
  }

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
    .update({ approved, updated_at: new Date().toISOString() })
    .eq('id', reviewId)

  if (error) {
    return res.status(500).json({ message: 'Could not update review status.' })
  }

  return res.status(200).json({ success: true })
})

router.delete('/', async (req, res) => {
  if (!isAdminAuthorized(req)) {
    return res.status(401).json({ message: 'Unauthorized admin request.' })
  }

  const supabase = getSupabaseClient()
  if (!supabase) {
    return res.status(500).json({ message: 'Server is missing Supabase credentials.' })
  }

  const reviewId = sanitizeText(req.query?.id || req.body?.id)
  if (!reviewId) {
    return res.status(400).json({ message: 'Review id is required.' })
  }

  const { error } = await supabase.from('reviews').delete().eq('id', reviewId)

  if (error) {
    return res.status(500).json({ message: 'Could not delete review.' })
  }

  return res.status(200).json({ success: true })
})

module.exports = router