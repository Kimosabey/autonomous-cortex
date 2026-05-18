import * as React from 'react'
import { motion, useReducedMotion } from 'framer-motion'

import { cn } from '@/lib/utils'

/* === Mission Console — signature visuals === */

export function GridBackground({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn('pointer-events-none absolute inset-0 -z-10 overflow-hidden', className)}
    >
      {/* Radar concentric rings */}
      <svg
        className="absolute -right-32 -top-32 size-[40rem] opacity-[0.08]"
        viewBox="0 0 200 200"
      >
        <circle cx="100" cy="100" r="92" stroke="#0f172a" strokeWidth="0.6" fill="none" />
        <circle cx="100" cy="100" r="68" stroke="#0f172a" strokeWidth="0.5" fill="none" />
        <circle cx="100" cy="100" r="42" stroke="#0f172a" strokeWidth="0.5" fill="none" />
        <line x1="0" y1="100" x2="200" y2="100" stroke="#0f172a" strokeWidth="0.4" />
        <line x1="100" y1="0" x2="100" y2="200" stroke="#0f172a" strokeWidth="0.4" />
        <g className="radar-sweep" style={{ transformOrigin: '100px 100px' }}>
          <path d="M100 100 L100 8 A92 92 0 0 1 174 60 Z" fill="#d97706" opacity="0.18" />
        </g>
      </svg>
      <div
        className="absolute inset-0 opacity-[0.4]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(15,23,42,0.04) 1px, transparent 1px)," +
            "linear-gradient(90deg, rgba(15,23,42,0.04) 1px, transparent 1px)",
          backgroundSize: '40px 40px',
        }}
      />
    </div>
  )
}

export function MovingBorder({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('relative overflow-hidden rounded-2xl ops-card', className)}>
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-1"
        style={{
          background: 'repeating-linear-gradient(90deg, var(--color-amber) 0 12px, transparent 12px 20px)',
        }}
      />
      <div className="relative">{children}</div>
    </div>
  )
}

export function SpotlightHero({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const reduce = useReducedMotion()
  return (
    <section className={cn('relative overflow-hidden rounded-3xl ops-card', className)}>
      {/* Status LED row */}
      <div className="absolute right-6 top-6 flex items-center gap-3" aria-hidden>
        <span className="mono text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--color-slate-ops-soft)]">
          OPS
        </span>
        <motion.span
          className="size-2.5 rounded-full led-go"
          animate={reduce ? undefined : { opacity: [1, 0.4, 1] }}
          transition={{ duration: 1.6, repeat: Infinity }}
        />
        <motion.span
          className="size-2.5 rounded-full led-pending"
          animate={reduce ? undefined : { opacity: [1, 0.3, 1] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
        />
        <motion.span
          className="size-2.5 rounded-full led-no-go"
          animate={reduce ? undefined : { opacity: [1, 0.2, 1] }}
          transition={{ duration: 2.4, repeat: Infinity, delay: 0.6 }}
        />
      </div>
      <div className="relative">{children}</div>
    </section>
  )
}
