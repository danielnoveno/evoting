'use client'

import { useEffect, useRef, useState, ReactNode, CSSProperties } from 'react'

/* ─────────────────────────────────────────────
   1. useScrollReveal – Intersection Observer hook
   ───────────────────────────────────────────── */
export function useScrollReveal(options?: IntersectionObserverInit) {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(el)
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px', ...options },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return { ref, isVisible }
}

/* ─────────────────────────────────────────────
   2. ScrollReveal – Wrapper component
   Supported variants:
     • fade-up  (default)
     • fade-down
     • fade-left
     • fade-right
     • zoom-in
     • zoom-out
   ───────────────────────────────────────────── */
type RevealVariant = 'fade-up' | 'fade-down' | 'fade-left' | 'fade-right' | 'zoom-in' | 'zoom-out'

const variantStyles: Record<RevealVariant, { hidden: CSSProperties; visible: CSSProperties }> = {
  'fade-up': {
    hidden: { opacity: 0, transform: 'translateY(48px)' },
    visible: { opacity: 1, transform: 'translateY(0)' },
  },
  'fade-down': {
    hidden: { opacity: 0, transform: 'translateY(-48px)' },
    visible: { opacity: 1, transform: 'translateY(0)' },
  },
  'fade-left': {
    hidden: { opacity: 0, transform: 'translateX(-60px)' },
    visible: { opacity: 1, transform: 'translateX(0)' },
  },
  'fade-right': {
    hidden: { opacity: 0, transform: 'translateX(60px)' },
    visible: { opacity: 1, transform: 'translateX(0)' },
  },
  'zoom-in': {
    hidden: { opacity: 0, transform: 'scale(0.92)' },
    visible: { opacity: 1, transform: 'scale(1)' },
  },
  'zoom-out': {
    hidden: { opacity: 0, transform: 'scale(1.08)' },
    visible: { opacity: 1, transform: 'scale(1)' },
  },
}

interface ScrollRevealProps {
  children: ReactNode
  variant?: RevealVariant
  delay?: number      // ms
  duration?: number   // ms
  className?: string
  id?: string
}

export function ScrollReveal({
  children,
  variant = 'fade-up',
  delay = 0,
  duration = 700,
  className = '',
  id,
}: ScrollRevealProps) {
  const { ref, isVisible } = useScrollReveal()
  const styles = variantStyles[variant]

  return (
    <div
      ref={ref}
      id={id}
      className={className}
      style={{
        ...(isVisible ? styles.visible : styles.hidden),
        transition: `opacity ${duration}ms cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform ${duration}ms cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
        willChange: 'opacity, transform',
      }}
    >
      {children}
    </div>
  )
}

/* ─────────────────────────────────────────────
   3. ParallaxLayer – Scroll-speed parallax
   Elements move at different speeds relative
   to the natural scroll position.
   speed > 0 : slower (lags behind)
   speed < 0 : faster (moves ahead)
   ───────────────────────────────────────────── */
interface ParallaxLayerProps {
  children: ReactNode
  speed?: number
  className?: string
}

export function ParallaxLayer({ children, speed = 0.15, className = '' }: ParallaxLayerProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    let ticking = false

    const onScroll = () => {
      if (!ticking) {
        ticking = true
        requestAnimationFrame(() => {
          const rect = el.getBoundingClientRect()
          const windowH = window.innerHeight
          // centre-relative offset: 0 when element centre = viewport centre
          const centre = rect.top + rect.height / 2 - windowH / 2
          el.style.transform = `translate3d(0, ${centre * speed * -1}px, 0)`
          ticking = false
        })
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll() // initial position

    return () => window.removeEventListener('scroll', onScroll)
  }, [speed])

  return (
    <div ref={ref} className={className} style={{ willChange: 'transform' }}>
      {children}
    </div>
  )
}

/* ─────────────────────────────────────────────
   4. StaggerContainer – Staggers children reveal
   Wraps children and staggers their delay.
   ───────────────────────────────────────────── */
interface StaggerContainerProps {
  children: ReactNode
  stagger?: number   // ms between each child
  variant?: RevealVariant
  duration?: number
  className?: string
  id?: string
}

export function StaggerContainer({
  children,
  stagger = 120,
  variant = 'fade-up',
  duration = 700,
  className = '',
  id,
}: StaggerContainerProps) {
  const { ref, isVisible } = useScrollReveal()
  const styles = variantStyles[variant]
  const items = Array.isArray(children) ? children : [children]

  return (
    <div ref={ref} id={id} className={className}>
      {items.map((child, i) => (
        <div
          key={i}
          style={{
            ...(isVisible ? styles.visible : styles.hidden),
            transition: `opacity ${duration}ms cubic-bezier(0.16,1,0.3,1) ${i * stagger}ms, transform ${duration}ms cubic-bezier(0.16,1,0.3,1) ${i * stagger}ms`,
            willChange: 'opacity, transform',
          }}
        >
          {child}
        </div>
      ))}
    </div>
  )
}

/* ─────────────────────────────────────────────
   5. FloatingShape – Decorative parallax shape
   Purely decorative, absolute-positioned element
   that floats on scroll for visual depth.
   ───────────────────────────────────────────── */
interface FloatingShapeProps {
  className?: string
  speed?: number
  style?: CSSProperties
}

export function FloatingShape({ className = '', speed = 0.08, style }: FloatingShapeProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    let ticking = false

    const onScroll = () => {
      if (!ticking) {
        ticking = true
        requestAnimationFrame(() => {
          const scrollY = window.scrollY
          el.style.transform = `translate3d(0, ${scrollY * speed}px, 0)`
          ticking = false
        })
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [speed])

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={`pointer-events-none absolute ${className}`}
      style={{ willChange: 'transform', ...style }}
    />
  )
}
