import React from 'react'

export default function DeferredAnimatedBg() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className="ambient-orb ambient-orb--secondary absolute -top-24 right-[-8%] h-72 w-72 rounded-full blur-3xl"
        style={{ background: 'color-mix(in srgb, var(--secondary) 28%, transparent)' }}
      />
      <div
        className="ambient-orb ambient-orb--primary absolute bottom-[-5rem] left-[-6%] h-80 w-80 rounded-full blur-3xl"
        style={{ background: 'color-mix(in srgb, var(--primary) 28%, transparent)' }}
      />
    </div>
  )
}

