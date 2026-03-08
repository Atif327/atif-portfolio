import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { FaCalendarAlt, FaClock, FaGlobe } from 'react-icons/fa'

function pick(item, ...keys){
  for(const k of keys) if(item && item[k] !== undefined) return item[k]
  return undefined
}

export default function News(){
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    fetch('/news')
      .then(r=>r.json())
      .then(json=>{
        if(!mounted) return
        // try a few shapes
        let list = []
        if(Array.isArray(json)) list = json
        else if(Array.isArray(json.data)) list = json.data
        else if(Array.isArray(json.articles)) list = json.articles
        else if(json && typeof json === 'object'){
          // try to extract values
          list = Object.values(json).flat().filter(Boolean)
        }

        // normalize
        const mapped = list.map(it => ({
          title: pick(it,'title','heading','name','post_title') || 'Untitled',
          date: pick(it,'date','published','created_at','pubDate') || '',
          source: pick(it,'source','publisher','site','domain') || pick(it,'author','by') || 'Unknown',
          readTime: pick(it,'read_time','reading_time','read') || '',
          category: pick(it,'category','type','tag','tags') || (it.tags && it.tags[0]) || 'All',
          image: pick(it,'image','thumbnail','thumb','featured_image','media') || '',
          url: pick(it,'url','link','permalink') || '#'
        }))

        setItems(mapped)
      })
      .catch(()=>{
        if(mounted) setItems([])
      })
      .finally(()=>{ if(mounted) setLoading(false) })

    return ()=>{ mounted = false }
  }, [])

  return (
    <motion.section initial={{opacity:0,y:40}} animate={{opacity:1,y:0}} transition={{duration:0.6}} className="p-12">
      <div className="contact-hero">
        <h1 className="services-title">Latest News</h1>
        <p className="text-[var(--text-secondary)] mt-5">Stay updated with technology news</p>
      </div>

      <div className="news-grid mt-8">
        {loading && <div className="text-[var(--text-secondary)]">Loading...</div>}
        {!loading && items.length === 0 && <div className="text-[var(--text-secondary)]">No news available.</div>}

        {items.map((it, idx) => (
          <article key={idx} className="news-card-item">
            <div className="news-card-top">
              <div className="news-type">{it.category}</div>
              <div className="news-thumb">
                {it.image ? <img src={it.image} alt="thumb" /> : <div className="thumb-placeholder" />}
              </div>
            </div>

            <div className="news-card-bottom">
              <div className="meta-row">
                <div className="meta-item"><FaCalendarAlt className="meta-icon" /> {it.date}</div>
                <div className="meta-item"><FaGlobe className="meta-icon" /> {it.source}</div>
                <div className="meta-item"><FaClock className="meta-icon" /> {it.readTime ? `${it.readTime} read` : ''}</div>
              </div>

              <h2 className="news-title">{it.title}</h2>

              <a className="read-more" href={it.url} target="_blank" rel="noreferrer">READ MORE</a>
            </div>
          </article>
        ))}
      </div>
    </motion.section>
  )
}
