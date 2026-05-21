import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ThemeSwitcher from '../../../user/components/ThemeSwitcher'
import Seo from '../../../user/components/Seo'
import ReviewsSection, { toReviewSchema } from '../../../user/components/ReviewsSection'
import { usePortfolioData } from '../../../context/PortfolioDataContext'
import { fetchReviews } from '../../../services/reviewService'
import { getSocialIcon } from '../../../admin/iconMaps'
import { getOptimizedImageSrc } from '../../../lib/imageAssets'
import './home.css'

const LazyTechStack = React.lazy(() => import('../../../user/components/TechStack'))

function DeferredTechStack() {
  const containerRef = useRef(null)
  const [shouldLoad, setShouldLoad] = useState(false)

  useEffect(() => {
    if (shouldLoad) return undefined

    const node = containerRef.current
    if (!node || !('IntersectionObserver' in window)) {
      const timer = window.setTimeout(() => setShouldLoad(true), 0)
      return () => window.clearTimeout(timer)
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldLoad(true)
          observer.disconnect()
        }
      },
      {
        rootMargin: '480px 0px',
        threshold: 0.01,
      },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [shouldLoad])

  return (
    <div ref={containerRef} className="home-v2__tech-deferred">
      {shouldLoad ? (
        <Suspense fallback={<div className="home-v2__tech-placeholder" aria-hidden="true" />}>
          <LazyTechStack />
        </Suspense>
      ) : (
        <div className="home-v2__tech-placeholder" aria-hidden="true" />
      )}
    </div>
  )
}

export default function Home() {
  const navigate = useNavigate()
  const { settings, sortedSocialLinks } = usePortfolioData()
  const [approvedReviews, setApprovedReviews] = useState([])
  const [reviewsLoading, setReviewsLoading] = useState(true)
  const [reviewsError, setReviewsError] = useState('')

  const publicSocialLinks = sortedSocialLinks.filter((link) => link.isActive)
  const heroImage = getOptimizedImageSrc(settings.heroImage || '/atif-ayyoub-ai-developer.png')
  const normalizePlatform = (value) => String(value || '').toLowerCase().replace(/\s+/g, '').trim()
  const getSocialPriority = (value) => {
    const key = normalizePlatform(value)

    if (key.includes('linkedin')) return 1
    if (key.includes('github')) return 2
    if (key.includes('twitter') || key === 'x' || key.includes('twitter/x') || key.includes('twitterx')) return 3
    if (key.includes('youtube')) return 4

    return undefined
  }

  const followMeLinks = publicSocialLinks
    .filter((link) => getSocialPriority(link.platform) !== undefined)
    .sort((a, b) => {
      return getSocialPriority(a.platform) - getSocialPriority(b.platform)
    })

  useEffect(() => {
    let mounted = true

    async function loadReviews() {
      try {
        setReviewsError('')
        const result = await fetchReviews()
        if (mounted) {
          setApprovedReviews(Array.isArray(result) ? result : [])
        }
      } catch (error) {
        console.error('Failed to load approved reviews:', error)
        if (mounted) {
          setReviewsError(error?.message || 'Reviews are unavailable right now. Please try again shortly.')
        }
      } finally {
        if (mounted) {
          setReviewsLoading(false)
        }
      }
    }

    const runWhenIdle = window.requestIdleCallback || ((callback) => window.setTimeout(callback, 2800))
    const cancelIdle = window.cancelIdleCallback || window.clearTimeout
    const idleId = runWhenIdle(loadReviews, { timeout: 4500 })

    return () => {
      mounted = false
      cancelIdle(idleId)
    }
  }, [])

  const reviewSchema = useMemo(() => {
    if (approvedReviews.length === 0) return null
    return toReviewSchema(approvedReviews)
  }, [approvedReviews])

  return (
    <section className="home-v2">
      <Seo
        title="Atif Ayyoub | AI Web & Custom Software Developer"
        description="Portfolio of Atif Ayyoub, an AI Web & Custom Software Developer building scalable web apps, dashboards, APIs, and custom software solutions."
        pathname="/"
        schema={reviewSchema}
      />
      <div className="home-v2__container">
        <section className="home-v2__hero card-shell">
          <div className="home-v2__hero-content">
            <p className="home-v2__intro">Hi, I&apos;m {settings.fullName || 'Atif Ayyoub'}</p>
            <h1 className="home-v2__name">AI Web &amp; Custom Software Developer</h1>
            <p className="home-v2__subtitle">
              I build AI-powered web apps that automate workflows, reduce friction, and drive business growth.
            </p>
            <p className="home-v2__trust">Trusted by startups &amp; businesses worldwide</p>

            <div className="home-v2__actions">
              <button className="home-v2__btn home-v2__btn--primary" onClick={() => navigate('/projects')}>
                View My Work
              </button>
              <button className="home-v2__btn home-v2__btn--ghost" onClick={() => navigate('/contact')}>
                Contact Me
              </button>
            </div>
          </div>

          <div className="home-v2__hero-image-wrap">
            <div className="home-v2__hero-image-shell" aria-hidden="true" />
            <div className="home-v2__hero-image-ring">
              <img
                className="home-v2__hero-image"
                src={heroImage}
                alt="Hi, I'm Atif Ayyoub, an AI Web & Custom Software Developer"
                width="320"
                height="320"
                loading="eager"
                fetchPriority="high"
                decoding="async"
              />
            </div>
          </div>
        </section>

        <ThemeSwitcher />

        <section className="home-v2__section">
          <div className="home-v2__info-grid">
            <article className="home-v2__info-card card-shell">
              <h2 className="home-v2__card-title">Personal Information</h2>
              <ul className="home-v2__list">
                <li><span>Full Name</span><strong>{settings.fullName}</strong></li>
                <li><span>Date of Birth</span><strong>19-12-2004</strong></li>
                <li><span>Phone</span><strong>{settings.phone}</strong></li>
                <li><span>Address</span><strong>{settings.address}</strong></li>
              </ul>
            </article>

            <article className="home-v2__info-card card-shell">
              <h2 className="home-v2__card-title">Professional Details</h2>
              <ul className="home-v2__list">
                <li><span>Email Address</span><strong>{settings.email}</strong></li>
                <li><span>Professional Title</span><strong>{settings.professionalTitle}</strong></li>
                <li><span>Languages</span><strong>{settings.languages}</strong></li>
                <li><span>Nationality</span><strong>{settings.nationality}</strong></li>
              </ul>
            </article>
          </div>
        </section>

        {/* Removed: What Clients Say section (testimonials marquee) */}

        <ReviewsSection reviews={approvedReviews} loading={reviewsLoading} error={reviewsError} />

        <section className="home-v2__section">
          <h2 className="home-v2__section-title">Technologies I Work With</h2>
          <div className="home-v2__tech-wrap card-shell">
            <DeferredTechStack />
          </div>
        </section>

        <section className="home-v2__section">
          <div className="card-shell home-v2__social-card">
            <h2 className="home-v2__section-title">Follow Me</h2>
            <div className="home-v2__social-grid">
              {followMeLinks.map((link) => {
                const Icon = getSocialIcon(link.icon)
                return (
                  <a key={link.id} className="home-v2__social-item" href={link.url} target="_blank" rel="noreferrer">
                    <Icon className="home-v2__social-icon" />
                    <span>{link.platform}</span>
                  </a>
                )
              })}
            </div>
          </div>
        </section>
      </div>
    </section>
  )
}




