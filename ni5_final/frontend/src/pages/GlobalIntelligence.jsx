import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Cell
} from 'recharts'
import {
  Globe2, TrendingUp, TrendingDown, Zap, Brain, RefreshCw,
  Flame, Activity, ArrowUpRight, Clock, Sparkles, Radio,
  AlertTriangle, ChevronRight, Eye, Package, Star, Filter,
  Minus, Search, BarChart2, Newspaper
} from 'lucide-react'
import axios from 'axios'

// ── Helpers ────────────────────────────────────────────────────
const URGENCY_COLOR = { critical: '#ef4444', high: '#f97316', medium: '#f59e0b', low: '#10b981' }
const TREND_ICON = { rising: TrendingUp, falling: TrendingDown, stable: Minus }
const TREND_COLOR = { rising: '#10b981', falling: '#ef4444', stable: '#6b7280' }
const EVENT_COLORS = {
  economic: '#f59e0b', technology: '#6366f1', climate: '#3b82f6',
  health: '#ef4444', geopolitical: '#f97316', market: '#10b981',
  trade: '#ec4899', energy: '#facc15',
}

const ScoreRing = ({ score, size = 52 }) => {
  const r = (size - 8) / 2
  const circ = 2 * Math.PI * r
  const fill = (score / 100) * circ
  const color = score >= 75 ? '#ef4444' : score >= 55 ? '#f59e0b' : '#10b981'
  return (
    <svg width={size} height={size} className="flex-shrink-0">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border)" strokeWidth="4"/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="4"
        strokeDasharray={`${fill} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}/>
      <text x={size/2} y={size/2+1} textAnchor="middle" dominantBaseline="middle"
        fontSize={size > 44 ? 13 : 10} fontWeight="700" fill={color}>{score}</text>
    </svg>
  )
}

const Chip = ({ color, children }) => (
  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold text-white"
    style={{ background: color }}>
    {children}
  </span>
)

const Tooltip2 = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-3 shadow-xl text-xs">
      <p className="font-semibold mb-1 text-[var(--text)]">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: <strong>{p.value}</strong></p>
      ))}
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────
export default function GlobalIntelligence() {
  const [data, setData]           = useState(null)
  const [loading, setLoading]     = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [search, setSearch]       = useState('')
  const [catFilter, setCatFilter] = useState('All')
  const [sortBy, setSortBy]       = useState('demand_score')
  const [selected, setSelected]   = useState(null)
  const [tab, setTab]             = useState('products') // products | events | chart
  const [aiThinking, setAiThinking] = useState(false)
  const [countdown, setCountdown] = useState(900)

  const load = useCallback(async (forceRefresh = false) => {
    forceRefresh ? setRefreshing(true) : setLoading(true)
    setAiThinking(true)
    try {
  const endpoint = forceRefresh
    ? '/api/global/refresh-intelligence'
    : '/api/global/ai-intelligence'
  const res = forceRefresh ? await axios.post(endpoint) : await axios.get(endpoint)
  setData(res.data)
  setLastUpdated(new Date())
  setCountdown(900)
  if (res.data?.products?.length) setSelected(res.data.products[0])
  } catch (e) {
      console.error(e)
    }
    setLoading(false)
    setRefreshing(false)
    setAiThinking(false)
  }, [])

  // Auto-refresh every 15 min
  useEffect(() => {
    load()
    const refresh = setInterval(() => load(true), 15 * 60 * 1000)
    return () => clearInterval(refresh)
  }, [load])

  // Countdown timer
  useEffect(() => {
    const t = setInterval(() => setCountdown(c => c > 0 ? c - 1 : 900), 1000)
    return () => clearInterval(t)
  }, [])

  const products = (data?.products || [])
    .filter(p => catFilter === 'All' || p.category === catFilter)
    .filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()) ||
                             p.driven_by?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sortBy === 'demand_score' ? b.demand_score - a.demand_score
                  : sortBy === 'margin'        ? b.margin_pct - a.margin_pct
                  : a.name.localeCompare(b.name))

  const categories = ['All', ...new Set((data?.products || []).map(p => p.category))]
  const events     = data?.events || []
  const topProduct = products[0]
  const criticalCount = products.filter(p => p.demand_score >= 75).length
  const avgScore   = products.length ? Math.round(products.reduce((a, p) => a + p.demand_score, 0) / products.length) : 0
  const risingCount = products.filter(p => p.trend === 'rising').length

  const barData = products.slice(0, 10).map(p => ({
    name: p.emoji + ' ' + p.name.split(' ')[0],
    score: p.demand_score,
    margin: p.margin_pct,
  }))

  const fmtCountdown = () => {
    const m = Math.floor(countdown / 60)
    const s = countdown % 60
    return `${m}:${String(s).padStart(2,'0')}`
  }

  // ── Loading ──────────────────────────────────────────────────
  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="relative">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg,#6366f1,#0ea5e9)' }}>
          <Globe2 size={28} className="text-white animate-pulse"/>
        </div>
        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-green-400 animate-ping"/>
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-[var(--text)]">AI is scanning global markets…</p>
        <p className="text-xs text-[var(--muted)] mt-1">Fetching live headlines · Generating product intelligence</p>
      </div>
      <div className="flex gap-1">
        {[0,1,2,3,4].map(i => (
          <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-sky-400"
            animate={{ y: [0,-8,0] }} transition={{ repeat: Infinity, delay: i*0.15, duration: 0.8 }}/>
        ))}
      </div>
    </div>
  )

  return (
    <div className="p-4 lg:p-6 space-y-5 min-h-screen" style={{ background: 'var(--bg)' }}>

      {/* ── HEADER ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#6366f1,#0ea5e9)' }}>
            <Globe2 size={18} className="text-white"/>
          </div>
          <div>
            <h1 className="text-xl font-display font-bold text-[var(--text)] flex items-center gap-2">
              Global Product Intelligence
              {data?.ai_generated && (
                <span className="text-[10px] px-2 py-0.5 rounded-full text-white font-medium"
                  style={{ background: 'linear-gradient(135deg,#6366f1,#0ea5e9)' }}>
                  ✦ AI-Powered
                </span>
              )}
            </h1>
            <p className="text-xs text-[var(--muted)]">
              Real-time · {products.length} live products · {events.length} active events ·&nbsp;
              {data?.headlines_used || 0} headlines analysed today
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Live pulse */}
          <div className="flex items-center gap-1.5 bg-[var(--card)] border border-[var(--border)] rounded-lg px-3 py-1.5">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"
              style={{ boxShadow: '0 0 6px #4ade80' }}/>
            <span className="text-[10px] font-mono text-[var(--muted)]">
              {lastUpdated ? `LIVE · ${lastUpdated.toLocaleTimeString()}` : 'LIVE FEED'}
            </span>
          </div>

          {/* Countdown */}
          <div className="flex items-center gap-1.5 bg-[var(--card)] border border-[var(--border)] rounded-lg px-3 py-1.5">
            <Clock size={11} className="text-[var(--muted)]"/>
            <span className="text-[10px] font-mono text-[var(--muted)]">Next: {fmtCountdown()}</span>
          </div>

          {/* Refresh */}
          <button onClick={() => load(true)} disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white font-medium disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg,#6366f1,#0ea5e9)' }}>
            {refreshing
              ? <><RefreshCw size={12} className="animate-spin"/> Scanning…</>
              : <><Sparkles size={12}/> Refresh AI</>}
          </button>
        </div>
      </div>

      {/* ── AI THINKING BANNER ── */}
      <AnimatePresence>
        {aiThinking && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl border"
            style={{ background: '#6366f110', borderColor: '#6366f140' }}>
            <Brain size={14} className="text-indigo-400 animate-pulse"/>
            <p className="text-xs text-indigo-300">
              AI is scanning global headlines, detecting demand signals, and auto-generating product intelligence…
            </p>
            <div className="flex gap-0.5 ml-auto">
              {[0,1,2].map(i => (
                <motion.div key={i} className="w-1 h-3 rounded bg-indigo-400"
                  animate={{ scaleY: [1,2,1] }} transition={{ repeat: Infinity, delay: i*0.2, duration: 0.6 }}/>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── KPI STRIP ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Live Events',     val: events.length,       icon: Radio,      color: '#ef4444', sub: 'from real headlines'   },
          { label: 'Hot Products',    val: criticalCount,        icon: Flame,      color: '#f97316', sub: 'score ≥ 75'            },
          { label: 'Avg Demand',      val: avgScore + '%',       icon: Activity,   color: '#0ea5e9', sub: 'AI-scored'             },
          { label: 'Rising Trends',   val: risingCount,          icon: TrendingUp, color: '#10b981', sub: 'trending up now'       },
        ].map(({ label, val, icon: Icon, color, sub }) => (
          <motion.div key={label} whileHover={{ y: -2 }} className="card p-4 space-y-2">
            <div className="flex justify-between items-start">
              <p className="text-[10px] text-[var(--muted)] font-medium">{label}</p>
              <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: `${color}20` }}>
                <Icon size={12} style={{ color }}/>
              </div>
            </div>
            <p className="text-2xl font-display font-bold" style={{ color }}>{val}</p>
            <p className="text-[9px] text-[var(--muted)]">{sub}</p>
          </motion.div>
        ))}
      </div>

      {/* ── TABS ── */}
      <div className="flex gap-1 bg-[var(--card)] border border-[var(--border)] rounded-xl p-1 w-fit">
        {[
          { id: 'products', label: 'Live Products',  icon: Package   },
          { id: 'events',   label: 'World Events',   icon: Newspaper },
          { id: 'chart',    label: 'Demand Chart',   icon: BarChart2 },
        ].map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${tab === id ? 'text-white' : 'text-[var(--muted)] hover:text-[var(--text)]'}`}
            style={tab === id ? { background: 'linear-gradient(135deg,#6366f1,#0ea5e9)' } : {}}>
            <Icon size={11}/>{label}
          </button>
        ))}
      </div>

      {/* ══ TAB: PRODUCTS ══ */}
      {tab === 'products' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

          {/* Product List */}
          <div className="xl:col-span-1 card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[var(--text)] flex items-center gap-2">
                <Sparkles size={13} className="text-indigo-400"/>
                AI-Generated Products
              </h2>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                className="input text-[10px] py-1 px-2">
                <option value="demand_score">By Demand</option>
                <option value="margin">By Margin</option>
                <option value="name">By Name</option>
              </select>
            </div>

            {/* Search */}
            <div className="relative">
              <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--muted)]"/>
              <input value={search} onChange={e => setSearch(e.target.value)}
                className="input text-xs pl-7 py-1.5 w-full" placeholder="Search products or events…"/>
            </div>

            {/* Category pills */}
            <div className="flex gap-1 flex-wrap">
              {categories.map(c => (
                <button key={c} onClick={() => setCatFilter(c)}
                  className={`text-[9px] px-2 py-0.5 rounded-full font-medium transition-all ${catFilter === c ? 'text-white' : 'bg-[var(--border)] text-[var(--muted)]'}`}
                  style={catFilter === c ? { background: 'linear-gradient(135deg,#6366f1,#0ea5e9)' } : {}}>
                  {c}
                </button>
              ))}
            </div>

            {/* Product cards */}
            <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
              {products.map((p, i) => {
                const TIcon = TREND_ICON[p.trend] || Minus
                const isSelected = selected?.id === p.id
                return (
                  <motion.div key={p.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.02 }}
                    onClick={() => setSelected(isSelected ? null : p)}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all
                      ${isSelected ? 'border-indigo-400/60 bg-indigo-400/5' : 'border-[var(--border)] hover:border-indigo-400/30 hover:bg-[var(--card2)]'}`}>
                    <ScoreRing score={p.demand_score} size={44}/>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-sm">{p.emoji}</span>
                        <p className="text-xs font-semibold text-[var(--text)] truncate">{p.name}</p>
                      </div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[9px] text-[var(--muted)]">{p.category}</span>
                        {p.price_range && <span className="text-[9px] font-mono text-indigo-400">{p.price_range}</span>}
                        {p.margin_pct > 0 && <span className="text-[9px] text-green-400">↑{p.margin_pct}%</span>}
                      </div>
                      {p.driven_by && (
                        <p className="text-[9px] text-[var(--muted)] truncate">📡 {p.driven_by}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <TIcon size={12} style={{ color: TREND_COLOR[p.trend] }}/>
                      <Chip color={URGENCY_COLOR[p.stock_urgency] || '#6b7280'}>
                        {p.stock_urgency}
                      </Chip>
                    </div>
                  </motion.div>
                )
              })}
              {products.length === 0 && (
                <div className="text-center py-10 text-[var(--muted)]">
                  <Package size={24} className="mx-auto mb-2 opacity-40"/>
                  <p className="text-xs">No products match your filter</p>
                </div>
              )}
            </div>
          </div>

          {/* Right: Selected product detail */}
          <div className="xl:col-span-2 space-y-4">
            <AnimatePresence mode="wait">
              {selected ? (
                <motion.div key={selected.id}
                  initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="card p-5 border-2" style={{ borderColor: '#6366f130' }}>

                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-4xl">{selected.emoji}</span>
                      <div>
                        <h3 className="text-base font-display font-bold text-[var(--text)]">{selected.name}</h3>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <Chip color="#6366f1">{selected.category}</Chip>
                          <Chip color={URGENCY_COLOR[selected.stock_urgency]}>{selected.stock_urgency} urgency</Chip>
                          <Chip color={TREND_COLOR[selected.trend]}>{selected.trend}</Chip>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <ScoreRing score={selected.demand_score} size={56}/>
                      <p className="text-[9px] text-[var(--muted)] mt-1">demand score</p>
                    </div>
                  </div>

                  {/* AI Insight */}
                  <div className="rounded-xl p-4 mb-4 border border-indigo-500/20"
                    style={{ background: 'linear-gradient(135deg,#6366f108,#0ea5e908)' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <Brain size={13} className="text-indigo-400"/>
                      <span className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider">AI Market Insight</span>
                    </div>
                    <p className="text-sm text-[var(--text2)] leading-relaxed">{selected.insight}</p>
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {[
                      { label: 'Price Range',    val: selected.price_range || 'N/A', color: '#0ea5e9' },
                      { label: 'Est. Margin',    val: selected.margin_pct + '%',     color: '#10b981' },
                      { label: 'Demand Score',   val: selected.demand_score + '/100', color: URGENCY_COLOR[selected.stock_urgency] },
                    ].map(({ label, val, color }) => (
                      <div key={label} className="rounded-xl p-3 text-center" style={{ background: `${color}10` }}>
                        <p className="text-[9px] text-[var(--muted)] mb-1">{label}</p>
                        <p className="text-sm font-bold" style={{ color }}>{val}</p>
                      </div>
                    ))}
                  </div>

                  {/* Driven by */}
                  {selected.driven_by && (
                    <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-[var(--card2)] border border-[var(--border)]">
                      <Radio size={11} className="text-[var(--muted)] flex-shrink-0"/>
                      <p className="text-[10px] text-[var(--muted)]">
                        <span className="text-[var(--text)] font-medium">Signal: </span>{selected.driven_by}
                      </p>
                    </div>
                  )}

                  {/* Target regions */}
                  {selected.target_regions?.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[9px] text-[var(--muted)]">Target regions:</span>
                      {selected.target_regions.map(r => (
                        <Chip key={r} color="#6b7280">{r}</Chip>
                      ))}
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div key="empty" className="card p-10 text-center"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <Eye size={28} className="mx-auto mb-3 opacity-30"/>
                  <p className="text-sm text-[var(--muted)]">Select a product to see AI deep-dive</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Top 4 urgent cards */}
            <div>
              <h3 className="text-xs font-semibold text-[var(--text)] mb-3 flex items-center gap-2">
                <Flame size={12} className="text-orange-400"/>
                Most Urgent Right Now
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {products.filter(p => p.stock_urgency === 'critical' || p.stock_urgency === 'high').slice(0, 4).map((p, i) => {
                  const color = URGENCY_COLOR[p.stock_urgency]
                  return (
                    <motion.div key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.08 }}
                      onClick={() => setSelected(p)}
                      className="rounded-xl p-4 border cursor-pointer hover:scale-[1.01] transition-all"
                      style={{ borderColor: `${color}30`, background: `${color}08` }}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{p.emoji}</span>
                          <div>
                            <p className="text-xs font-semibold text-[var(--text)] leading-tight">{p.name}</p>
                            <Chip color={color}>{p.stock_urgency}</Chip>
                          </div>
                        </div>
                        <ScoreRing score={p.demand_score} size={38}/>
                      </div>
                      <p className="text-[10px] text-[var(--muted)] line-clamp-2">{p.insight}</p>
                      <div className="flex items-center gap-1 mt-2">
                        <span className="text-[9px] text-indigo-400 ml-auto flex items-center gap-0.5">
                          View details <ChevronRight size={9}/>
                        </span>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ TAB: EVENTS ══ */}
      {tab === 'events' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <AlertTriangle size={14} className="text-amber-400"/>
            <h2 className="text-sm font-semibold text-[var(--text)]">Live World Events</h2>
            <span className="text-[9px] bg-[var(--border)] px-2 py-0.5 rounded-full text-[var(--muted)]">
              Auto-detected from real headlines · AI classified
            </span>
          </div>

          {events.length === 0 ? (
            <div className="card p-10 text-center text-[var(--muted)]">
              <Globe2 size={28} className="mx-auto mb-3 opacity-30"/>
              <p className="text-sm">No live events detected — try refreshing</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {events.map((ev, i) => {
                const color = EVENT_COLORS[ev.type] || '#6b7280'
                // Products driven by this event type
                const relatedProducts = (data?.products || [])
                  .filter(p => p.driven_by?.toLowerCase().includes(ev.type) ||
                               p.insight?.toLowerCase().includes(ev.type))
                  .slice(0, 3)
                return (
                  <motion.div key={ev.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="card p-4 border-l-4"
                    style={{ borderLeftColor: color }}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{ev.icon}</span>
                        <div>
                          <div className="flex items-center gap-1 mb-0.5">
                            <Chip color={color}>{ev.type}</Chip>
                            <Chip color={ev.severity === 'high' ? '#ef4444' : ev.severity === 'medium' ? '#f59e0b' : '#10b981'}>
                              {ev.severity}
                            </Chip>
                          </div>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs font-medium text-[var(--text)] leading-relaxed mb-3">{ev.headline}</p>

                    {relatedProducts.length > 0 && (
                      <div>
                        <p className="text-[9px] text-[var(--muted)] mb-1.5 font-medium uppercase tracking-wider">Products impacted:</p>
                        <div className="flex flex-col gap-1">
                          {relatedProducts.map(p => (
                            <div key={p.id}
                              onClick={() => { setSelected(p); setTab('products') }}
                              className="flex items-center gap-2 px-2 py-1 rounded-lg bg-[var(--card2)] cursor-pointer hover:bg-[var(--border)] transition-all">
                              <span className="text-sm">{p.emoji}</span>
                              <span className="text-[10px] text-[var(--text)] flex-1 truncate">{p.name}</span>
                              <span className="text-[9px] font-bold" style={{ color: p.demand_score >= 75 ? '#ef4444' : '#f59e0b' }}>
                                {p.demand_score}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ══ TAB: CHART ══ */}
      {tab === 'chart' && (
        <div className="space-y-4">
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-[var(--text)] mb-1 flex items-center gap-2">
              <BarChart2 size={13} className="text-indigo-400"/>
              Top 10 Products by Demand Score
            </h2>
            <p className="text-[10px] text-[var(--muted)] mb-4">AI-scored based on live global headlines</p>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={barData} margin={{ top: 5, right: 10, left: -20, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.4}/>
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: 'var(--muted)' }}
                  angle={-35} textAnchor="end" interval={0}/>
                <YAxis tick={{ fontSize: 9, fill: 'var(--muted)' }} axisLine={false} tickLine={false} domain={[0,100]}/>
                <Tooltip content={<Tooltip2/>}/>
                <Bar dataKey="score" name="Demand Score" radius={[6,6,0,0]}>
                  {barData.map((e, i) => (
                    <Cell key={i} fill={e.score >= 75 ? '#ef4444' : e.score >= 60 ? '#f59e0b' : '#6366f1'}/>
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card p-5">
            <h2 className="text-sm font-semibold text-[var(--text)] mb-1 flex items-center gap-2">
              <TrendingUp size={13} className="text-green-400"/>
              Estimated Margin % by Product
            </h2>
            <p className="text-[10px] text-[var(--muted)] mb-4">Higher margin = better profit opportunity</p>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={barData} margin={{ top: 5, right: 10, left: -20, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.4}/>
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: 'var(--muted)' }}
                  angle={-35} textAnchor="end" interval={0}/>
                <YAxis tick={{ fontSize: 9, fill: 'var(--muted)' }} axisLine={false} tickLine={false}/>
                <Tooltip content={<Tooltip2/>}/>
                <Bar dataKey="margin" name="Margin %" radius={[6,6,0,0]}>
                  {barData.map((e, i) => (
                    <Cell key={i} fill={e.margin >= 60 ? '#10b981' : e.margin >= 35 ? '#0ea5e9' : '#6b7280'}/>
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* All products table */}
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-[var(--text)] mb-4 flex items-center gap-2">
              <Filter size={13} className="text-indigo-400"/>
              Full AI-Generated Product List
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    {['#','Product','Category','Demand','Margin','Price','Trend','Urgency','Signal'].map(h => (
                      <th key={h} className="text-left text-[9px] text-[var(--muted)] font-medium pb-2 pr-4 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {products.map((p, i) => {
                    const TIcon = TREND_ICON[p.trend] || Minus
                    return (
                      <tr key={p.id} onClick={() => { setSelected(p); setTab('products') }}
                        className="border-b border-[var(--border)] hover:bg-[var(--card2)] cursor-pointer transition-colors">
                        <td className="py-2 pr-4 text-[var(--muted)]">{i+1}</td>
                        <td className="py-2 pr-4 font-medium text-[var(--text)] whitespace-nowrap max-w-[160px] truncate">
                          {p.emoji} {p.name}
                        </td>
                        <td className="py-2 pr-4 text-[var(--muted)]">{p.category}</td>
                        <td className="py-2 pr-4 font-bold" style={{ color: p.demand_score >= 75 ? '#ef4444' : '#f59e0b' }}>
                          {p.demand_score}
                        </td>
                        <td className="py-2 pr-4 text-green-400">{p.margin_pct}%</td>
                        <td className="py-2 pr-4 text-[var(--muted)] whitespace-nowrap">{p.price_range}</td>
                        <td className="py-2 pr-4">
                          <TIcon size={12} style={{ color: TREND_COLOR[p.trend] }}/>
                        </td>
                        <td className="py-2 pr-4">
                          <Chip color={URGENCY_COLOR[p.stock_urgency] || '#6b7280'}>{p.stock_urgency}</Chip>
                        </td>
                        <td className="py-2 text-[9px] text-[var(--muted)] max-w-[140px] truncate">{p.driven_by}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── FOOTER ── */}
      <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
        <p className="text-[9px] text-[var(--dim)] flex items-center gap-1">
          <Radio size={9}/>
          Data sources: GDELT · Open-Meteo · Anthropic Claude · Auto-refreshes every 15 min
        </p>
        <p className="text-[9px] text-[var(--dim)]">
          {data?.ai_generated ? '✦ AI-generated product list' : '⚡ Rule-based fallback (add ANTHROPIC_API_KEY for full AI)'}
        </p>
      </div>
    </div>
  )
}  