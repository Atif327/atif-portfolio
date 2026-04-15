import { createClient } from '@supabase/supabase-js'

function pick(item, ...keys) {
  for (const key of keys) {
    if (item && item[key] !== undefined) return item[key]
  }
  return undefined
}

function formatDateTime(raw) {
  if (!raw) return ''
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return raw
  const pad = (value) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function mapDev(list) {
  if (!Array.isArray(list)) return []
  return list.map((item) => ({
    title: pick(item, 'title') || 'Untitled',
    date: formatDateTime(pick(item, 'published_at') || item.readable_publish_date || ''),
    source: (item && item.user && item.user.name) || 'DEV',
    readTime: pick(item, 'reading_time') || '',
    category: (item && item.tag_list && item.tag_list[0]) || item.tag || 'All',
    image: pick(item, 'cover_image', 'social_image') || '',
    description: pick(item, 'description') || '',
    url: pick(item, 'url') || '#',
  }))
}

function mapNewsApi(articles) {
  if (!Array.isArray(articles)) return []
  return articles.map((item) => ({
    title: pick(item, 'title') || 'Untitled',
    date: formatDateTime(pick(item, 'publishedAt') || ''),
    source: (item && item.source && item.source.name) || 'NewsAPI',
    readTime: '',
    category: (item && item.source && item.source.name) || 'All',
    image: pick(item, 'urlToImage') || '',
    description: pick(item, 'description') || '',
    url: pick(item, 'url') || '#',
  }))
}

function slugify(value) {
  return String(value || 'news')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50) || 'news'
}

function isStorageUrl(value) {
  return typeof value === 'string' && value.includes('/storage/v1/object/public/news-images/')
}

function getServerSupabase() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) return null
  return createClient(supabaseUrl, serviceRoleKey)
}

async function uploadRemoteImage(supabase, imageUrl, name) {
  if (!supabase || !imageUrl || isStorageUrl(imageUrl)) return imageUrl

  const response = await fetch(imageUrl)
  if (!response.ok) throw new Error(`Image download failed: ${response.status}`)

  const contentType = response.headers.get('content-type') || 'image/jpeg'
  const extension = (contentType.split('/').pop() || 'jpg').split(';')[0]
  const arrayBuffer = await response.arrayBuffer()
  const fileName = `${slugify(name)}-${Date.now()}.${extension}`

  const { error } = await supabase.storage.from('news-images').upload(fileName, arrayBuffer, {
    contentType,
    upsert: false,
  })

  if (error) throw error

  const { data } = supabase.storage.from('news-images').getPublicUrl(fileName)
  return data?.publicUrl || imageUrl
}

async function persistToSupabase(items) {
  const supabase = getServerSupabase()
  if (!supabase || !Array.isArray(items) || items.length === 0) {
    return items
  }

  const rows = []
  for (const item of items) {
    let imageUrl = item.image || ''
    try {
      imageUrl = await uploadRemoteImage(supabase, imageUrl, item.title)
    } catch (error) {
      console.warn('Image migration failed for', item.url, error.message || error)
    }

    rows.push({
      title: item.title,
      description: item.description,
      url: item.url,
      image: imageUrl,
      published_at: item.date ? new Date(item.date).toISOString() : null,
      source: item.source,
      category: item.category,
    })
  }

  const { error: upsertError } = await supabase.from('news').upsert(rows, { onConflict: 'url' })
  if (upsertError) {
    console.warn('Supabase upsert failed', upsertError.message || upsertError)
    return rows.map((row) => ({
      title: row.title,
      description: row.description,
      url: row.url,
      image: row.image,
      date: formatDateTime(row.published_at),
      source: row.source,
      category: row.category,
      readTime: '',
    }))
  }

  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 7)
  const { error: deleteError } = await supabase.from('news').delete().lt('published_at', cutoff.toISOString())
  if (deleteError) {
    console.warn('Supabase cleanup failed', deleteError.message || deleteError)
  }

  return rows.map((row) => ({
    title: row.title,
    description: row.description,
    url: row.url,
    image: row.image,
    date: formatDateTime(row.published_at),
    source: row.source,
    category: row.category,
    readTime: '',
  }))
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    const NEWS_TARGET_COUNT = 30
    const devUrl = `https://dev.to/api/articles?per_page=${NEWS_TARGET_COUNT}&tag=technology`
    const newsApiKey = process.env.NEWS_API_KEY || process.env.VITE_NEWS_API_KEY
    const newsApiUrl = newsApiKey
      ? `https://newsapi.org/v2/top-headlines?category=technology&pageSize=${NEWS_TARGET_COUNT}&apiKey=${newsApiKey}`
      : null

    const requests = [
      fetch(devUrl, { headers: { Accept: 'application/json' } })
        .then((response) => {
          if (!response.ok) throw new Error('DEV.to failed')
          return response.json()
        })
        .then(mapDev),
    ]

    if (newsApiUrl) {
      requests.push(
        fetch(newsApiUrl, { headers: { Accept: 'application/json' } })
          .then((response) => {
            if (!response.ok) throw new Error('NewsAPI failed')
            return response.json()
          })
          .then((json) => mapNewsApi(json.articles || [])),
      )
    }

    const results = await Promise.allSettled(requests)
    const merged = []
    const seen = new Set()

    for (const result of results) {
      if (result.status !== 'fulfilled' || !Array.isArray(result.value)) continue
      for (const item of result.value) {
        const key = item.url || item.title
        if (seen.has(key)) continue
        seen.add(key)
        merged.push(item)
      }
    }

    // Only keep items that have a non-empty image thumbnail, then cap to target
    const filteredMerged = merged.filter((it) => it && it.image && String(it.image).trim()).slice(0, NEWS_TARGET_COUNT)

    const persistedItems = await persistToSupabase(filteredMerged)
    res.status(200).json({
      items: persistedItems,
      meta: {
        count: persistedItems.length,
        hasNewsApi: Boolean(newsApiUrl),
      },
    })
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to fetch news' })
  }
}