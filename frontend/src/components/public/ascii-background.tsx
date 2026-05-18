'use client'

import { useEffect, useRef } from 'react'

export function AsciiBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number

    const fontSize = 16
    const characters = '01+<>#{}[]()*' // Programming and blockchain-esque characters
    
    const resize = () => {
      const parent = canvas.parentElement
      if (parent) {
        // Use devicePixelRatio for sharp text on retina screens
        const dpr = window.devicePixelRatio || 1
        canvas.width = parent.clientWidth * dpr
        canvas.height = parent.clientHeight * dpr
        ctx.scale(dpr, dpr)
        canvas.style.width = `${parent.clientWidth}px`
        canvas.style.height = `${parent.clientHeight}px`
      }
    }
    
    window.addEventListener('resize', resize)
    resize()

    let time = 0
    let mouseX = -1000
    let mouseY = -1000
    let isMouseActive = false

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouseX = e.clientX - rect.left
      mouseY = e.clientY - rect.top
      isMouseActive = true
    }

    const handleMouseLeave = () => {
      isMouseActive = false
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseout', handleMouseLeave)
    
    const draw = () => {
      const parent = canvas.parentElement
      if (!parent) return
      
      const w = parent.clientWidth
      const h = parent.clientHeight
      
      ctx.clearRect(0, 0, w, h)
      
      ctx.font = `${fontSize}px var(--font-geist-mono), "JetBrains Mono", monospace`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      const columns = Math.ceil(w / fontSize)
      const rows = Math.ceil(h / fontSize)
      
      for (let i = 0; i < columns; i++) {
        for (let j = 0; j < rows; j++) {
          const charX = i * fontSize + fontSize/2
          const charY = j * fontSize + fontSize/2

          let distToMouse = 9999
          if (isMouseActive) {
            distToMouse = Math.hypot(mouseX - charX, mouseY - charY)
          }

          // Create a wave effect using sine and cosine for an organic flowing feel
          const waveX = Math.sin(i * 0.08 + time)
          const waveY = Math.cos(j * 0.08 + time)
          const wave = waveX + waveY
          
          const mouseRadius = 240
          const mouseForce = isMouseActive ? Math.max(0, 1 - (distToMouse / mouseRadius)) : 0
          
          // Combine the organic wave with the mouse force
          const effectiveWave = wave + (mouseForce * 2.5)
          
          // Draw characters if they meet the threshold
          if (effectiveWave > -0.5) {
            const charIndex = Math.floor(Math.abs(effectiveWave * 10)) % characters.length
            const char = characters[charIndex]
            
            // Map wave to opacity
            let opacity = Math.max(0.08, Math.min(0.45, 0.15 + (wave * 0.15)))
            
            // Boost opacity significantly around the cursor
            if (mouseForce > 0) {
              opacity = Math.min(0.85, opacity + (mouseForce * 0.6))
            }
            
            // Use darker/bolder color when near the mouse
            if (mouseForce > 0.4) {
              ctx.fillStyle = `rgba(15, 23, 42, ${opacity})` // Slate-950
            } else {
              ctx.fillStyle = `rgba(51, 65, 85, ${opacity})` // Slate-700
            }
            
            ctx.fillText(char, charX, charY)
          }
        }
      }
      
      // Slower animation for a premium, calm feel
      time += 0.012
      animationFrameId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseout', handleMouseLeave)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none [mask-image:radial-gradient(ellipse_100%_100%_at_50%_50%,black_30%,transparent_80%)]">
      <canvas
        ref={canvasRef}
        className="block h-full w-full"
        aria-hidden="true"
      />
    </div>
  )
}
