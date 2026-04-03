import React, { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import ProjectShowcase from '../components/ProjectShowcase'
import ProjectCard from '../components/ProjectCard'
import Seo from '../components/Seo'
import { usePortfolioData } from '../context/PortfolioDataContext'
import './project.css'

export default function Projects(){
  const navigate = useNavigate()
  const { sortedProjects } = usePortfolioData()

  const normalizeCategory = (value) => {
    if (Array.isArray(value)) return value.map((entry) => String(entry).trim()).filter(Boolean)
    return String(value || '')
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean)
  }

  const publicProjects = useMemo(() => {
    return sortedProjects
      .filter((project) => project.isActive)
      .map((project) => ({
        id: project.id,
        title: project.title,
        category: project.category,
        image: project.thumbnail,
        repo: project.githubUrl,
        liveUrl: project.liveUrl,
        description: project.shortDescription,
        tags: project.technologies,
        categoryList: normalizeCategory(project.category),
      }))
  }, [sortedProjects])

  const filters = useMemo(() => {
    const allCategories = publicProjects.flatMap((project) => project.categoryList)
    const uniqueCategories = Array.from(new Set(allCategories))
    return ['All', ...uniqueCategories]
  }, [publicProjects])

  const [active, setActive] = useState('All')

  const filtered = useMemo(() => {
    if (active === 'All') return publicProjects
    return publicProjects.filter((project) => project.categoryList.includes(active))
  }, [active, publicProjects])

  const featured = filtered[0] || publicProjects[0]
  const spotlight = filtered.filter((project) => project.id !== featured?.id).slice(0, 3)
  const gridProjects = filtered.filter((project) => project.id !== featured?.id)

  const projectStats = [
    { value: `${publicProjects.length}+`, label: 'Published Projects' },
    { value: `${filters.length - 1}+`, label: 'Project Domains' },
    { value: '100%', label: 'Mobile Responsive' },
  ]

  return (
    <section className="projects-page">
      <Seo
        title="Web, AI & Software Projects | Atif Ayyoub"
        description="Browse web, AI, and software projects by Atif Ayyoub including scalable web apps, dashboards, and API-driven products."
        pathname="/projects"
      />
      <div className="projects-bg-blob" aria-hidden="true" />
      <div className="projects-bg-orb projects-bg-orb-left" aria-hidden="true" />
      <div className="projects-bg-orb projects-bg-orb-right" aria-hidden="true" />
      <div className="projects-noise" aria-hidden="true" />

      <div className="projects-shell section-container">
        <header className="projects-header">
          <div className="projects-eyebrow">Case Studies</div>
          <h1 className="projects-title">Professional Project Portfolio</h1>
          <p className="projects-subtitle">
            End-to-end product builds across AI tooling, web apps, dashboards, and API platforms.
            Each project is structured with clear outcomes, technical depth, and production-ready UX.
          </p>
          <div className="projects-filters" role="tablist" aria-label="Project categories">
            {filters.map(f => (
              <button
                key={f}
                type="button"
                onClick={()=>setActive(f)}
                role="tab"
                aria-selected={active === f}
                className={`project-filter-tab ${active===f ? 'is-active' : ''}`}
              >
                {f}
              </button>
            ))}
          </div>
        </header>

        <main className="projects-main">
          <ProjectShowcase
            featured={featured}
            spotlight={spotlight}
            onExploreServices={() => navigate('/services')}
          />

          <section className="projects-grid-wrap" aria-label="All projects">
            <div className="projects-cards-grid">
              {gridProjects.length === 0 ? <p className="projects-empty">No additional projects available for this category yet.</p> : null}
              {gridProjects.map((project, index) => (
                <motion.div
                  key={project.id}
                  className="project-card-motion"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.15 }}
                  transition={{ duration: 0.45, delay: Math.min(index * 0.08, 0.3) }}
                >
                  <ProjectCard project={project} />
                </motion.div>
              ))}
            </div>
          </section>

          <div className="project-stats-grid">
            {projectStats.map((item, index) => (
              <motion.article
                key={item.label}
                className="project-stat-card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.45, delay: index * 0.1 }}
              >
                <p className="project-stat-value">{item.value}</p>
                <p className="project-stat-label">{item.label}</p>
              </motion.article>
            ))}
          </div>

          <div className="projects-cta-wrap">
            <button
              type="button"
              className="projects-cta-btn"
              onClick={() => navigate('/services')}
            >
              Need a Similar Product? Let&apos;s Build It
            </button>
          </div>
        </main>
      </div>
    </section>
  )
}
