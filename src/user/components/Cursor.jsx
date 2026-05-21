import React, { useEffect, useRef } from 'react'

export default function Cursor(){
  const cursorRef = useRef(null)
  const frameRef = useRef(0)
  const pointRef = useRef({ x: -100, y: -100 })

  useEffect(()=>{
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return undefined

    const onMove = e => {
      pointRef.current = { x: e.clientX, y: e.clientY }
      if (frameRef.current) return

      frameRef.current = window.requestAnimationFrame(() => {
        frameRef.current = 0
        if (cursorRef.current) {
          cursorRef.current.style.left = `${pointRef.current.x}px`
          cursorRef.current.style.top = `${pointRef.current.y}px`
        }
      })
    }

    window.addEventListener('mousemove', onMove)
    return () => {
      window.removeEventListener('mousemove', onMove)
      if (frameRef.current) window.cancelAnimationFrame(frameRef.current)
    }
  },[])

  return <div ref={cursorRef} className="cursor-glow" style={{ left: -100, top: -100 }} />
}

