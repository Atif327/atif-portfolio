function formatDate(isoDate) {
  if (!isoDate) return ''

  const parsed = new Date(isoDate)
  if (Number.isNaN(parsed.getTime())) return ''

  return parsed.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function toReviewSchema(reviews = []) {
  const realReviews = Array.isArray(reviews) ? reviews.slice(0, 6) : []

  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Atif Ayyoub',
    review: realReviews.map((review) => ({
      '@type': 'Review',
      author: {
        '@type': 'Person',
        name: review.name,
      },
      reviewRating: {
        '@type': 'Rating',
        ratingValue: String(review.rating),
        bestRating: '5',
      },
      reviewBody: review.message,
      datePublished: review.createdAt,
    })),
  }
}

export default function ReviewsSection({ reviews = [], loading = false }) {
  return (
    <section id="home-reviews-section" className="home-v2__section" aria-label="Client reviews">
      <h2 className="home-v2__section-title">Verified Client Reviews</h2>

      {loading ? <p className="home-v2__reviews-empty">Loading reviews...</p> : null}
      {!loading && reviews.length === 0 ? <p className="home-v2__reviews-empty">No approved reviews yet.</p> : null}

      {!loading && reviews.length > 0 ? (
        <div className="home-v2__reviews-grid">
          {reviews.slice(0, 6).map((review) => (
            <article key={review.id} className="card-shell home-v2__review-card">
              <div className="home-v2__review-head">
                <h3>{review.name}</h3>
                <span>{'★'.repeat(review.rating)}</span>
              </div>
              <p className="home-v2__review-text">{review.message}</p>
              <p className="home-v2__review-date">{formatDate(review.createdAt)}</p>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  )
}
