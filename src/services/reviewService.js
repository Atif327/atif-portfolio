async function parseResponseSafe(response) {
  const text = await response.text().catch(() => '')
  if (!text) return {}

  try {
    return JSON.parse(text)
  } catch {
    return { message: text }
  }
}

function messageFromStatus(status) {
  if (status === 409) return 'This email has already submitted a review.'
  if (status === 429) return 'Too many review attempts. Please try again shortly.'
  if (status >= 500) return 'Server error while submitting review. Please try again.'
  return 'Failed to submit review.'
}

export async function submitReview(payload) {
  const response = await fetch('/api/reviews', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const result = await parseResponseSafe(response)

  if (!response.ok) {
    const normalizedMessage = String(result.message || '').replace(/<[^>]*>/g, '').trim()
    throw new Error(normalizedMessage || messageFromStatus(response.status))
  }

  return result
}

export async function fetchReviews() {
  const response = await fetch('/api/reviews')
  const result = await parseResponseSafe(response)

  if (!response.ok) {
    const normalizedMessage = String(result.message || '').replace(/<[^>]*>/g, '').trim()
    if (/missing supabase/i.test(normalizedMessage)) {
      throw new Error('Reviews are temporarily unavailable while server credentials are being configured.')
    }
    throw new Error(normalizedMessage || 'Failed to load reviews.')
  }

  return Array.isArray(result.reviews) ? result.reviews : []
}
