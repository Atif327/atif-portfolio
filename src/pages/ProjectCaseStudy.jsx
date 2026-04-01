import React, { useMemo } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import Seo from '../components/Seo'
import { usePortfolioData } from '../context/PortfolioDataContext'

export default function ProjectCaseStudy() {
  const { slug } = useParams()
  const { sortedProjects } = usePortfolioData()

  const project = useMemo(
    () => sortedProjects.find((item) => item.title && item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') === slug),
    [slug, sortedProjects],
  )

  if (!project) return <Navigate to="/projects" replace />

  const title = `${project.title} | Case Study`
  const description = project.shortDescription || project.fullDescription || `Case study for ${project.title}`

  return (
    <section className="page-shell" style={{ padding: '40px 24px 56px' }}>
      <Seo title={title} description={description} pathname={`/projects/${slug}`} image={project.thumbnail || '/preview.png'} />

      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="rounded-[22px] border border-white/10 bg-[rgba(15,23,42,0.76)] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.35)]">
          <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.08em] text-cyan-300">Project Case Study</p>
          <h1 className="text-4xl font-extrabold text-white md:text-5xl">{project.title}</h1>
          <p className="mt-4 max-w-3xl text-[15px] leading-8 text-slate-300">{project.fullDescription || project.shortDescription}</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
          <article className="rounded-[22px] border border-white/10 bg-[rgba(15,23,42,0.76)] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.35)]">
            <h2 className="text-2xl font-bold text-white">Overview</h2>
            <p className="mt-3 leading-8 text-slate-300">{project.shortDescription || project.fullDescription}</p>

            <h2 className="mt-8 text-2xl font-bold text-white">Impact</h2>
            <p className="mt-3 leading-8 text-slate-300">
              This project demonstrates a practical approach to product delivery with a focus on responsive UI, maintainable architecture, and a polished user experience.
            </p>

            <h2 className="mt-8 text-2xl font-bold text-white">Highlights</h2>
            <p className="mt-3 leading-8 text-slate-300">{project.highlights || 'Structured UX, clean code, and reliable delivery.'}</p>

            <h2 className="mt-8 text-2xl font-bold text-white">Challenges and Solutions</h2>
            <p className="mt-3 leading-8 text-slate-300">{project.challengesSolutions || 'Built with clear data flow and performance-aware UI decisions.'}</p>
          </article>

          <aside className="rounded-[22px] border border-white/10 bg-[rgba(15,23,42,0.76)] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.35)]">
            <img src={project.thumbnail || '/preview.png'} alt={project.title} className="h-64 w-full rounded-2xl object-cover object-center" />

            <div className="mt-6 space-y-4 text-slate-300">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.08em] text-cyan-300">Category</p>
                <p className="mt-1">{project.category || 'Web Apps'}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.08em] text-cyan-300">Role</p>
                <p className="mt-1">{project.role || 'Full Stack Developer'}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.08em] text-cyan-300">Technologies</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(project.technologies || []).map((tech) => (
                    <span key={tech} className="rounded-full border border-cyan-300/20 bg-slate-950/60 px-3 py-1 text-xs text-cyan-200">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3">
              {project.liveUrl ? (
                <a href={project.liveUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-400 px-4 py-3 font-semibold text-white transition hover:translate-y-[-2px]">
                  View Live Project
                </a>
              ) : null}
              {project.githubUrl ? (
                <a href={project.githubUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 font-semibold text-slate-100 transition hover:border-cyan-300/50 hover:text-white">
                  Source Code
                </a>
              ) : null}
              <Link to="/projects" className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 font-semibold text-slate-100 transition hover:border-cyan-300/50 hover:text-white">
                Back to Projects
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </section>
  )
}
