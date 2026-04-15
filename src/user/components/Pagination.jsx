import React from 'react'
import './pagination.css'

export default function Pagination({ currentPage, totalPages, onChange }) {
  if (totalPages <= 1) return null

  const handlePrev = () => onChange(Math.max(1, currentPage - 1))
  const handleNext = () => onChange(Math.min(totalPages, currentPage + 1))

  const pages = []
  for (let i = 1; i <= totalPages; i++) pages.push(i)

  const visiblePages = pages.filter((page) => {
    if (page === 1 || page === totalPages) return true
    return Math.abs(page - currentPage) <= 1
  })

  const numberedItems = []
  for (let i = 0; i < visiblePages.length; i++) {
    const page = visiblePages[i]
    const prev = visiblePages[i - 1]
    if (prev && page - prev > 1) numberedItems.push('ellipsis-' + page)
    numberedItems.push(page)
  }

  return (
    <nav className="pagination" aria-label="Pagination navigation">
      <button type="button" className="pagination-btn pagination-btn--nav" onClick={handlePrev} disabled={currentPage === 1}>
        <span aria-hidden="true">&larr;</span>
        <span>Previous</span>
      </button>

      <div key={currentPage} className="pagination-pages" role="list" aria-label="Pages">
        {numberedItems.map((item) => {
          if (typeof item === 'string') {
            return (
              <span key={item} className="pagination-ellipsis" aria-hidden="true">
                ...
              </span>
            )
          }

          const page = item
          return (
            <button
              key={page}
              type="button"
              onClick={() => onChange(page)}
              aria-current={page === currentPage ? 'page' : undefined}
              className={`pagination-page ${page === currentPage ? 'is-active' : ''}`}
            >
              {page}
            </button>
          )
        })}
      </div>

      <button type="button" className="pagination-btn pagination-btn--nav" onClick={handleNext} disabled={currentPage === totalPages}>
        <span>Next</span>
        <span aria-hidden="true">&rarr;</span>
      </button>
    </nav>
  )
}
