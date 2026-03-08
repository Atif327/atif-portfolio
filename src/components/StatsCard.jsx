import React from 'react'

export default function StatsCard({title,subtitle}){
  return (
    <div className="bg-[#141B2D] p-6 rounded-xl border border-[var(--border)] hover:translate-y-[-5px] hover:shadow-lg transition-transform">
      <div className="text-3xl font-bold">{title}</div>
      <div className="text-sm text-[var(--text-secondary)] mt-2">{subtitle}</div>
    </div>
  )
}
