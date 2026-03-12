import { useState } from 'react'
import { motion } from 'framer-motion'

export function SentBadge({ s, className = '' }) {
  const map = { positive: ['badge-pos','↑'], negative: ['badge-neg','↓'], neutral: ['badge-neu','→'] }
  const [cls, icon] = map[s] || map.neutral
  return <span className={`badge ${cls} ${className}`}>{icon} {s}</span>
}

export function PriBadge({ p }) {
  const map = { critical:['pri-critical',''], high:['pri-high',''], medium:['pri-medium',''], low:['pri-low',''] }
  const [cls, icon] = map[p] || map.medium
  return <span className={`badge ${cls} capitalize`}>{icon} {p}</span>
}

export function AuthBadge({ label }) {
  const map = {
    'genuine':        ['badge-pos',''],
    'likely genuine': ['badge-blue','~'],
    'suspicious':     ['badge-amb',''],
    'likely fake':    ['badge-neg',''],
  }
  const [cls, icon] = map[label] || ['badge-gray','?']
  return <span className={`badge ${cls}`}>{icon} {label}</span>
}

export function ScoreBar({ value = 0, showLabel = false, height = 'h-1.5' }) {
  const pct = Math.round((value + 1) / 2 * 100)
  const color = value > 0.05 ? 'var(--green)' : value < -0.05 ? 'var(--red)' : 'var(--brand)'
  return (
    <div className="space-y-1">
      <div className={`${height} bg-[var(--border)] rounded-full overflow-hidden`}>
        <div className={`h-full rounded-full transition-all duration-700`} style={{ width:`${pct}%`, background:color }} />
      </div>
      {showLabel && <p className="text-xs font-mono" style={{color}}>{value>0?'+':''}{value.toFixed(4)}</p>}
    </div>
  )
}

export function StatCard({ title, value, sub, color='var(--brand)', icon:Icon, trend }) {
  return (
    <div className="card p-5 flex items-start gap-3">
      {Icon && (
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{background:`${color}18`}}>
          <Icon size={17} style={{color}} />
        </div>
      )}
      <div className="min-w-0">
        <p className="label">{title}</p>
        <p className="text-2xl font-display font-bold leading-none" style={{color}}>{value}</p>
        {sub && <p className="text-xs text-[var(--text2)] mt-1">{sub}</p>}
        {trend && <p className={`text-xs mt-1 ${trend==='up'?'text-[var(--green)]':trend==='down'?'text-[var(--red)]':'text-[var(--muted)]'}`}>{trend==='up'?'↑ ':'↓ '}{trend}</p>}
      </div>
    </div>
  )
}

export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="text-sm text-[var(--text2)] mt-1">{subtitle}</p>}
      </div>
      {children && <div className="flex items-center gap-2 flex-wrap">{children}</div>}
    </div>
  )
}

export function TooltipBox({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="card2 p-3 text-xs min-w-28 shadow-xl">
      {label && <p className="text-[var(--muted)] mb-2 font-mono">{label}</p>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 mb-0.5">
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{background:p.color||p.fill}} />
          <span className="text-[var(--text)]">{p.name}: <strong>{typeof p.value==='number'?p.value.toFixed(2):p.value}</strong></span>
        </div>
      ))}
    </div>
  )
}

export function Empty({ icon:Icon, title, sub }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {Icon && <Icon size={32} className="text-[var(--dim)] mb-3" />}
      <p className="text-[var(--text)] font-medium text-sm">{title}</p>
      {sub && <p className="text-[var(--muted)] text-xs mt-1">{sub}</p>}
    </div>
  )
}

export function Skel({ className='' }) {
  return <div className={`skeleton ${className}`} />
}

export function UrgencyBar({ value=0 }) {
  const pct = Math.round(value*100)
  const color = value>=0.8?'var(--red)':value>=0.5?'var(--amber)':'var(--green)'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{width:`${pct}%`,background:color}} />
      </div>
      <span className="text-xs font-mono" style={{color}}>{pct}%</span>
    </div>
  )
}

export function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false)
  const copy = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(()=>setCopied(false),2000) }
  return (
    <button onClick={copy} className="btn-ghost text-xs py-1">
      {copied ? ' Copied' : '⎘ Copy'}
    </button>
  )
}
