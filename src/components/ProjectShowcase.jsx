import React from 'react'
import { ArrowUpRight, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export default function ProjectShowcase({ featured, spotlight = [], onExploreServices }) {
  if (!featured) return null

  const caseStudySlug = slugify(featured.title)

  return (
    <section className="projects-showcase" aria-label="Featured project showcase">
      <article className="projects-showcase-hero">
        <div className="projects-showcase-media">
          {featured.image ? (
            <img
              src={featured.image}
              alt={`${featured.title} project preview`}
              className="projects-showcase-image"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="projects-showcase-placeholder">Featured project preview</div>
          )}
        </div>

        <div className="projects-showcase-content">
          <p className="projects-showcase-kicker">
            <Sparkles size={15} />
            Featured Case Study
          </p>
          <h2 className="projects-showcase-title">{featured.title}</h2>
          <p className="projects-showcase-description">{featured.description}</p>

          <div className="projects-showcase-tags">
            {(featured.tags || []).slice(0, 5).map((tag) => (
              <span className="projects-showcase-tag" key={tag}>{tag}</span>
            ))}
          </div>

          <div className="projects-showcase-actions">
            <Link to={`/projects/${caseStudySlug}`} className="projects-showcase-btn projects-showcase-btn-primary">
              Read Case Study
            </Link>
            {featured.liveUrl ? (
              <a
                href={featured.liveUrl}
                target="_blank"
                rel="noreferrer"
                className="projects-showcase-btn projects-showcase-btn-secondary"
              >
                Live Preview <ArrowUpRight size={16} />
              </a>
            ) : null}
            <button type="button" className="projects-showcase-btn projects-showcase-btn-ghost" onClick={onExploreServices}>
              Explore Services
            </button>
          </div>
        </div>
      </article>

      {spotlight.length > 0 ? (
        <aside className="projects-showcase-rail" aria-label="Highlighted projects">
          {spotlight.map((project) => (
            <Link to={`/projects/${slugify(project.title)}`} key={project.id} className="projects-spotlight-card">
              <div className="projects-spotlight-head">
                <h3>{project.title}</h3>
                <ArrowUpRight size={14} />
              </div>
              <p>{project.description}</p>
              <div className="projects-spotlight-tags">
                {(project.tags || []).slice(0, 3).map((tag) => (
                  <span key={`${project.id}-${tag}`}>{tag}</span>
                ))}
              </div>
            </Link>
          ))}
        </aside>
      ) : null}
    </section>
  )
}
