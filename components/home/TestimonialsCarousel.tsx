'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { motion, useReducedMotion } from 'framer-motion'
import Eyebrow from '@/components/shared/Eyebrow'

/* ── Responsive card dimensions ──────────────────────────────── */
interface Dims { cw: number; ch: number; spacing: number }

function calcDims(vw: number): Dims {
  if (vw < 480) return { cw: 200, ch: 300, spacing: 160 }
  if (vw < 768) return { cw: 250, ch: 370, spacing: 200 }
  return               { cw: 300, ch: 420, spacing: 240 }
}

/* ── Data ────────────────────────────────────────────────────── */
const DRAG_THRESH = 60
const TILTS       = [-2, 1.5, -1, 2.5, -1.5]

const testimonials = [
  {
    name:   'T. Aldridge',
    role:   'Lamp Collector · Victoria',
    quote:  "The Cattaraugus reproduction holds an extra flame — the bench test others won't run.",
    accent: '#2E4A3F',
    light:  true,
    image:  '/assets/SampleImage1.webp'
  },
  {
    name:   'W. Hooper',
    role:   'Restoration Workshop · Tasmania',
    quote:  "Acme Lamp & Sign's chimneys are the only ones we still recommend without an asterisk.",
    accent: '#9C7A2E',
    light:  true,
    image:  '/assets/SampleImage2.webp'
  },
  {
    name:   'B. Santos',
    role:   'Interior Architect · Sydney',
    quote:  'The kind of shop that ships a hand-written invoice and means it.',
    accent: '#C29B47',
    light:  false,
    image:  '/assets/SampleImage3.webp'
  },
  {
    name:   'R. Blackwood',
    role:   'Antique Dealer · Melbourne',
    quote:  'Every piece arrived straw-packed and hand-tagged. This is how the trade should work.',
    accent: '#4A4D50',
    light:  true,
    image:  '/assets/SampleImage4.webp'
  },
  {
    name:   'M. Perrin',
    role:   'Heritage Architect · Adelaide',
    quote:  "Finally — a supplier who knows a No. 2 chimney is not the same as a No. 3.",
    accent: '#233830',
    light:  true,
    image:  '/assets/SampleImage5.webp'
  },
]

const spring     = { type: 'spring' as const, stiffness: 280, damping: 28 }
const flipSpring = { type: 'spring' as const, stiffness: 180, damping: 22 }
const dotSpring  = { type: 'spring' as const, stiffness: 400, damping: 30 }
const instant    = { duration: 0 }

export default function TestimonialsCarousel() {
  const [active,  setActive]  = useState(2)
  const [flipped, setFlipped] = useState<Record<number, boolean>>({})
  const [dims,    setDims]    = useState<Dims>({ cw: 300, ch: 420, spacing: 240 })
  const prefersReduced        = useReducedMotion()

  const pointerStartX = useRef<number | null>(null)
  const didNavigate   = useRef(false)

  /* ── Responsive watcher ── */
  useEffect(() => {
    function update() { setDims(calcDims(window.innerWidth)) }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const { cw, ch, spacing } = dims

  /* ── Navigation ── */
  function goTo(i: number) {
    setActive(i)
    setFlipped({})
  }

  /* ── Card click ── */
  function handleCardClick(i: number) {
    if (didNavigate.current) { didNavigate.current = false; return }
    if (i === active) setFlipped(prev => ({ ...prev, [i]: !prev[i] }))
    else              goTo(i)
  }

  /* ── Swipe drag ── */
  function handlePointerDown(e: React.PointerEvent<HTMLElement>) {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    pointerStartX.current = e.clientX
    didNavigate.current   = false
  }

  function handlePointerUp(e: React.PointerEvent<HTMLElement>) {
    if (pointerStartX.current === null) return
    const delta = e.clientX - pointerStartX.current
    pointerStartX.current = null
    if (Math.abs(delta) < DRAG_THRESH) return
    didNavigate.current = true
    if (delta < 0) goTo(Math.min(active + 1, testimonials.length - 1))
    else           goTo(Math.max(active - 1, 0))
  }

  function handlePointerCancel() {
    pointerStartX.current = null
    didNavigate.current   = false
  }

  /* ── Keyboard ── */
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowRight') goTo(Math.min(active + 1, testimonials.length - 1))
    if (e.key === 'ArrowLeft')  goTo(Math.max(active - 1, 0))
  }

  return (
    <section
      className="bg-ink-charcoal py-16 sm:py-24 overflow-hidden"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
      aria-label="Customer testimonials"
    >
      {/* Heading */}
      <div className="max-w-[1280px] mx-auto px-6 text-center mb-12 sm:mb-16">
        <Eyebrow light className="mb-3">From the workshop floor</Eyebrow>
        <h2
          className="font-serif font-medium text-canvas-heading leading-tight"
          style={{ fontSize: 'clamp(22px, 3vw, 42px)' }}
        >
          What they said when the lamp held.
        </h2>
        <p className="hidden sm:block font-mono text-[10px] uppercase tracking-eyebrow text-canvas-dim mt-4">
          Click any card — center flips, others navigate &nbsp;·&nbsp; drag or use arrows
        </p>
        <p className="sm:hidden font-mono text-[10px] uppercase tracking-eyebrow text-canvas-dim mt-4">
          Tap any card — center flips, others navigate &nbsp;·&nbsp; swipe to browse
        </p>
      </div>

      {/* Card deck */}
      <div
        className="relative"
        style={{ height: ch + 48 }}
        aria-live="polite"
      >
        {testimonials.map((t, i) => {
          const dist      = i - active
          const absDist   = Math.abs(dist)
          const isActive  = dist === 0
          const isFlip    = !!flipped[i]
          const textColor  = t.light ? '#F5EFE0' : '#1E2022'
          const mutedColor = t.light ? 'rgba(245,239,224,0.5)' : 'rgba(30,32,34,0.5)'

          return (
            <div
              key={i}
              className="absolute"
              style={{
                left:         '50%',
                top:          24,
                perspective:  900,
                zIndex:       20 - absDist,
                pointerEvents: 'none',
              }}
            >
              {/* Position + scale + brightness */}
              <motion.div
                animate={{
                  x:      dist * spacing - cw / 2,
                  scale:  isActive ? 1.12 : Math.max(0.86, 1 - absDist * 0.05),
                  filter: `brightness(${isActive ? 1 : Math.max(0.42, 0.65 - absDist * 0.1)})`,
                }}
                transition={prefersReduced ? instant : spring}
                style={{ 
                  transformStyle: 'preserve-3d', 
                  pointerEvents: 'none',
                  willChange: 'transform, filter' // Added: Keep hardware composite active cleanly
                }}
              >
                {/* Tilt + flip */}
                <motion.div
                  onClick={() => handleCardClick(i)}
                  animate={{
                    rotateZ: prefersReduced ? 0 : TILTS[i % TILTS.length],
                    rotateY: isFlip ? 180 : 0,
                  }}
                  transition={prefersReduced ? instant : flipSpring}
                  className="antialiased transform-gpu" // Added: Subpixel text stabilization
                  style={{
                    width:          cw,
                    height:         ch,
                    transformStyle: 'preserve-3d',
                    cursor:         'pointer',
                    position:       'relative',
                    userSelect:     'none',
                    touchAction:    'none',
                    pointerEvents:  'auto',
                    willChange:     'transform', // Added: Prevent subpixel drop frame rasterization
                  }}
                  role="button"
                  tabIndex={isActive ? 0 : -1}
                  aria-pressed={isFlip}
                  aria-label={
                    isActive
                      ? `${t.name} — ${isFlip ? 'tap to close' : 'tap to read quote'}`
                      : `Maps to ${t.name}`
                  }
                  onKeyDown={e => {
                    if (isActive && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault()
                      handleCardClick(i)
                    }
                  }}
                >
                  {/* ── FRONT ── */}
                  <div
                    className="absolute inset-0 overflow-hidden border-[3px] antialiased select-none"
                    style={{
                      borderRadius:             32,
                      backfaceVisibility:       'hidden',
                      WebkitBackfaceVisibility: 'hidden',
                      borderColor:              t.accent,
                      background:               '#242628',
                      transform:                'translateZ(0px)', // Added: Forces isolated texture layer clear of 3D matrix blending
                    }}
                  >
                    <Image
                      src={t.image}
                      alt={`Portrait or workshop scene for ${t.name}`}
                      fill
                      sizes="(max-w-480px) 200px, (max-w-768px) 250px, 300px"
                      priority={i >= 1 && i <= 3}
                      className="object-cover pointer-events-none select-none z-0"
                    />

                    {/* Semi-transparent grid overlay */}
                    <div
                      className="absolute inset-0 z-10"
                      style={{
                        backgroundImage:
                          'repeating-linear-gradient(45deg,rgba(194,155,71,0.07) 0,rgba(194,155,71,0.07) 1px,transparent 1px,transparent 8px)',
                      }}
                    />
                    
                    {/* Dark gradient for text scannability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/40 z-10" />

                    <p
                      className="absolute top-4 left-5 font-serif leading-none tabular-nums z-20"
                      style={{ fontSize: cw < 240 ? 22 : 28, color: '#F5EFE0AA' }}
                    >
                      {String(i + 1).padStart(2, '0')}
                    </p>

                    {isActive && (
                      <p className="absolute top-5 right-5 font-mono text-[9px] uppercase tracking-eyebrow text-canvas-dim z-20">
                        {cw < 240 ? 'tap' : 'flip →'}
                      </p>
                    )}

                    <div className="absolute bottom-5 left-5 right-4 z-20">
                      <h3
                        className="font-serif font-medium text-canvas-heading leading-snug subpixel-antialiased"
                        style={{ fontSize: cw < 240 ? 18 : cw < 270 ? 20 : 24 }}
                      >
                        {t.name}
                      </h3>
                      <p
                        className="font-mono text-[9px] uppercase tracking-eyebrow mt-1"
                        style={{ color: '#C29B47' }}
                      >
                        {t.role.split('·')[0].trim()}
                      </p>
                    </div>
                  </div>

                  {/* ── BACK ── */}
                  <div
                    className="absolute inset-0 overflow-hidden border-[3px] flex flex-col items-center justify-center antialiased"
                    style={{
                      borderRadius:             32,
                      padding:                  cw < 240 ? '28px 20px' : '32px 28px',
                      backfaceVisibility:       'hidden',
                      WebkitBackfaceVisibility: 'hidden',
                      transform:                'rotateY(180deg) translateZ(0px)',
                      backgroundColor:          t.accent,
                      borderColor:              t.accent,
                    }}
                  >
                    <p
                      className="font-mono text-[9px] uppercase tracking-eyebrow mb-4 text-center"
                      style={{ color: mutedColor }}
                    >
                      {t.role}
                    </p>
                    <blockquote
                      className="font-serif italic leading-relaxed text-center subpixel-antialiased"
                      style={{ color: textColor, fontSize: cw < 240 ? 14 : 16 }}
                    >
                      &ldquo;{t.quote}&rdquo;
                    </blockquote>
                    <p
                      className="font-mono text-[9px] uppercase tracking-eyebrow mt-5"
                      style={{ color: mutedColor }}
                    >
                      — {t.name}
                    </p>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          )
        })}
      </div>

      {/* Controls */}
      <div
        className="flex justify-center items-center gap-4 mt-4"
        onPointerDown={e => e.stopPropagation()}
      >
        <button
          onClick={() => goTo(Math.max(active - 1, 0))}
          disabled={active === 0}
          className="w-10 h-10 rounded-full border border-white/15 flex items-center justify-center text-canvas-muted hover:border-brass/50 hover:text-brass transition-colors disabled:opacity-25 font-mono text-[14px] shrink-0"
          aria-label="Previous testimonial"
        >
          ←
        </button>

        <div className="flex items-center gap-2">
          {testimonials.map((_, i) => (
            <motion.button
              key={i}
              onClick={() => goTo(i)}
              animate={{
                width:           i === active ? 22 : 8,
                backgroundColor: i === active ? '#C29B47' : 'rgba(194,155,71,0.28)',
              }}
              transition={dotSpring}
              className="h-2 rounded-pill shrink-0"
              aria-label={`Go to testimonial ${i + 1}`}
              aria-current={i === active ? 'true' : undefined}
            />
          ))}
        </div>

        <button
          onClick={() => goTo(Math.min(active + 1, testimonials.length - 1))}
          disabled={active === testimonials.length - 1}
          className="w-10 h-10 rounded-full border border-white/15 flex items-center justify-center text-canvas-muted hover:border-brass/50 hover:text-brass transition-colors disabled:opacity-25 font-mono text-[14px] shrink-0"
          aria-label="Next testimonial"
        >
          →
        </button>
      </div>
    </section>
  )
}