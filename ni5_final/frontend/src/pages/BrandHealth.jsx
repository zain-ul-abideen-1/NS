import { useState, useEffect } from 'react'
import axios from 'axios'
import { AreaChart, Area, BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts'
import { Heart, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, RefreshCw, Award, Star, Shield, Zap, ArrowUp, ArrowDown, Download } from 'lucide-react'
import toast from 'react-hot-toast'

const HEALTH_COLORS = { Excellent: '#10b981', Good: '#0ea5e9', Fair: '#f59e0b', Poor: '#ef4444' }
const SCORE_GRADIENT = (score) => score >= 80 ? '#10b981' : score >= 60 ? '#0ea5e9' : score >= 40 ? '#f59e0b' : '#ef4444'

function GaugeRing({ score, size = 120 }) {
  const r = size * 0.38
  const circ = 2 * Math.PI * r
  const pct = Math.min(100, Math.max(0, score))
  const offset = circ - (pct / 100) * circ
  const color = SCORE_GRADIENT(score)
  return (
    <svg width={size} height={size} className="mx-auto">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border)" strokeWidth={size*0.09}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={size*0.09}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{transition:'stroke-dashoffset 1s ease'}}/>
      <text x={size/2} y={size/2 - 6} textAnchor="middle" fill={color} fontSize={size*0.22} fontWeight="bold" fontFamily="monospace">{score}</text>
      <text x={size/2} y={size/2 + size*0.14} textAnchor="middle" fill="var(--muted)" fontSize={size*0.085}>/ 100</text>
    </svg>
  )
}

function MetricCard({ label, value, sub, trend, color }) {
  return (
    <div className="card p-4 space-y-1">
      <p className="text-xs text-[var(--muted)]">{label}</p>
      <p className="text-2xl font-display font-bold" style={{color: color || 'var(--text)'}}>{value}</p>
      {sub && <p className="text-xs text-[var(--muted)]">{sub}</p>}
      {trend !== undefined && (
        <div className="flex items-center gap-1 text-xs" style={{color: trend >= 0 ? 'var(--green)' : 'var(--red)'}}>
          {trend >= 0 ? <ArrowUp size={10}/> : <ArrowDown size={10}/>}
          {Math.abs(trend).toFixed(1)}% vs avg
        </div>
      )}
    </div>
  )
}

export default function BrandHealth() {
  const [data, setData] = useState(null)
  const [timeline, setTimeline] = useState([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState(30)

  const load = async () => {
    setLoading(true)
    try {
      const [healthRes, timelineRes] = await Promise.all([
        axios.get('/api/brand-health'),
        axios.get(`/api/brand-health/timeline?days=${timeRange}`)
      ])
      setData(healthRes.data)
      setTimeline(timelineRes.data.timeline || [])
    } catch (e) {
      toast.error('Failed to load brand health data')
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [timeRange])

  const exportReport = () => {
    if (!data) return
    const report = `NESTINSIGHTS BRAND HEALTH REPORT\n${'='.repeat(50)}\nGenerated: ${new Date().toLocaleString()}\n\nBrand Health Score: ${data.health_score}/100 (${data.health_label})\n\nKEY METRICS\n${'-'.repeat(30)}\nTotal Reviews Analyzed: ${data.total_reviews_analyzed}\nAverage Positive Sentiment: ${data.avg_positive_pct}%\nAverage Negative Sentiment: ${data.avg_negative_pct}%\nNPS Equivalent: ${data.nps_equivalent}\nFake Reviews Flagged: ${data.fake_total}\nSessions Analyzed: ${data.total_sessions}\n\nEXECUTIVE ANALYSIS\n${'-'.repeat(30)}\n${data.narrative}\n\nBEST PERFORMING SESSIONS\n${data.best_sessions?.map(s => `- ${s.name}: ${s.positive_pct}% positive (${s.reviews} reviews)`).join('\n')}\n\nNEEDS ATTENTION\n${data.worst_sessions?.map(s => `- ${s.name}: ${s.negative_pct}% negative (${s.reviews} reviews)`).join('\n')}\n`
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([report], {type:'text/plain'}))
    a.download = `brand_health_report_${new Date().toISOString().slice(0,10)}.txt`
    a.click()
    toast.success('Report exported!')
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <RefreshCw size={24} className="animate-spin text-[var(--brand)]"/>
    </div>
  )

  if (!data || data.error) return (
    <div className="p-8 text-center">
      <Heart size={40} className="text-[var(--muted)] mx-auto mb-3"/>
      <p className="text-[var(--text)] font-semibold">No sessions analyzed yet</p>
      <p className="text-xs text-[var(--muted)] mt-1">Analyze reviews first to generate your brand health report</p>
    </div>
  )

  const healthColor = HEALTH_COLORS[data.health_label] || '#0ea5e9'
  const radarData = [
    { metric: 'Positive Sentiment', value: Math.min(100, data.avg_positive_pct) },
    { metric: 'Low Negative', value: Math.max(0, 100 - data.avg_negative_pct) },
    { metric: 'Review Authenticity', value: Math.max(0, 100 - (data.fake_total / Math.max(data.total_reviews_analyzed, 1) * 100)) },
    { metric: 'Volume', value: Math.min(100, Math.log10(data.total_reviews_analyzed + 1) * 33) },
    { metric: 'NPS Score', value: Math.max(0, Math.min(100, data.nps_equivalent + 50)) },
    { metric: 'Consistency', value: Math.min(100, data.total_sessions * 8) },
  ]

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background:'var(--grad)'}}>
            <Heart size={18} className="text-white"/>
          </div>
          <div>
            <h1 className="page-title">Brand Health Monitor</h1>
            <p className="text-sm text-[var(--text2)] mt-0.5">Real-time brand health score across all your sessions · {data.total_reviews_analyzed.toLocaleString()} reviews analyzed</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="btn-ghost text-xs flex items-center gap-1"><RefreshCw size={12}/>Refresh</button>
          <button onClick={exportReport} className="btn-secondary text-xs flex items-center gap-1"><Download size={12}/>Export Report</button>
        </div>
      </div>

      {/* Health Score Hero */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        <div className="lg:col-span-1 card p-6 text-center space-y-3">
          <p className="text-xs text-[var(--muted)] font-semibold uppercase tracking-wider">Overall Brand Health</p>
          <GaugeRing score={data.health_score} size={140}/>
          <div>
            <span className="text-lg font-bold px-4 py-1.5 rounded-full text-white" style={{background:healthColor}}>{data.health_label}</span>
          </div>
          <p className="text-xs text-[var(--muted)]">{data.sessions_count} sessions · {data.total_reviews_analyzed.toLocaleString()} reviews</p>
        </div>

        <div className="lg:col-span-3 grid grid-cols-2 lg:grid-cols-3 gap-3">
          <MetricCard label="Positive Sentiment" value={`${data.avg_positive_pct}%`} color={data.avg_positive_pct > 65 ? 'var(--green)' : 'var(--amber)'}/>
          <MetricCard label="Negative Sentiment" value={`${data.avg_negative_pct}%`} color={data.avg_negative_pct > 30 ? 'var(--red)' : 'var(--green)'}/>
          <MetricCard label="NPS Equivalent" value={data.nps_equivalent > 0 ? `+${data.nps_equivalent}` : data.nps_equivalent}
            sub={data.nps_equivalent >= 50 ? 'World Class' : data.nps_equivalent >= 30 ? 'Excellent' : data.nps_equivalent >= 0 ? 'Good' : 'Needs Work'}
            color={data.nps_equivalent >= 30 ? 'var(--green)' : data.nps_equivalent >= 0 ? 'var(--amber)' : 'var(--red)'}/>
          <MetricCard label="Reviews Analyzed" value={data.total_reviews_analyzed.toLocaleString()} color="var(--brand)"/>
          <MetricCard label="Sessions" value={data.total_sessions} color="var(--text)"/>
          <MetricCard label="Fake Reviews" value={data.fake_total} sub={`${((data.fake_total/Math.max(data.total_reviews_analyzed,1))*100).toFixed(1)}% of total`}
            color={data.fake_total > data.total_reviews_analyzed * 0.1 ? 'var(--red)' : 'var(--green)'}/>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Sentiment trend timeline */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="section-title">Sentiment Trend</p>
            <div className="flex gap-1.5">
              {[7,30,90].map(d => (
                <button key={d} onClick={() => setTimeRange(d)}
                  className={`text-xs px-2 py-1 rounded border transition-all ${timeRange===d?'text-white border-transparent':'border-[var(--border)] text-[var(--muted)]'}`}
                  style={timeRange===d?{background:'var(--grad)'}:{}}>{d}d</button>
              ))}
            </div>
          </div>
          {timeline.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={timeline}>
                <defs>
                  <linearGradient id="posGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="negGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false}/>
                <XAxis dataKey="date" tick={{fontSize:9, fill:'var(--muted)'}} tickFormatter={v=>v.slice(5)}/>
                <YAxis tick={{fontSize:9, fill:'var(--muted)'}} domain={[0,100]}/>
                <Tooltip contentStyle={{background:'var(--card)',border:'1px solid var(--border)',fontSize:11}} labelFormatter={l=>`Date: ${l}`}/>
                <Area type="monotone" dataKey="positive_pct" stroke="#10b981" fill="url(#posGrad)" strokeWidth={2} name="Positive %"/>
                <Area type="monotone" dataKey="negative_pct" stroke="#ef4444" fill="url(#negGrad)" strokeWidth={2} name="Negative %"/>
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-[var(--muted)] text-sm">Not enough data for timeline. Analyze more sessions over time.</div>
          )}
        </div>

        {/* Brand health radar */}
        <div className="card p-5">
          <p className="section-title mb-4">Brand Health Dimensions</p>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="var(--border)"/>
              <PolarAngleAxis dataKey="metric" tick={{fontSize:9, fill:'var(--muted)'}}/>
              <Radar name="Score" dataKey="value" stroke={healthColor} fill={healthColor} fillOpacity={0.25} strokeWidth={2}/>
              <Tooltip contentStyle={{background:'var(--card)',border:'1px solid var(--border)',fontSize:11}}/>
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Session performance comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card p-5 space-y-3">
          <p className="section-title flex items-center gap-2"><Award size={13} className="text-[var(--green)]"/> Top Performing Sessions</p>
          <div className="space-y-2">
            {(data.best_sessions || []).map((s, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-[var(--bg)] border border-[var(--border)]">
                <span className="text-sm font-bold text-[var(--muted)] w-4">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-[var(--text)] truncate">{s.name}</p>
                  <p className="text-[10px] text-[var(--muted)]">{s.reviews.toLocaleString()} reviews</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-[var(--green)]">{s.positive_pct}%</p>
                  <p className="text-[9px] text-[var(--muted)]">positive</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5 space-y-3">
          <p className="section-title flex items-center gap-2"><AlertTriangle size={13} className="text-[var(--amber)]"/> Needs Attention</p>
          <div className="space-y-2">
            {(data.worst_sessions || []).map((s, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-[var(--bg)] border border-[var(--border)]">
                <AlertTriangle size={13} className="text-[var(--amber)] flex-shrink-0"/>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-[var(--text)] truncate">{s.name}</p>
                  <p className="text-[10px] text-[var(--muted)]">{s.reviews.toLocaleString()} reviews</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-[var(--red)]">{s.negative_pct}%</p>
                  <p className="text-[9px] text-[var(--muted)]">negative</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Narrative */}
      {data.narrative && (
        <div className="card p-5 space-y-3">
          <p className="section-title flex items-center gap-2"><Zap size={13} className="text-[var(--brand)]"/> AI Executive Analysis</p>
          <div className="prose-sm text-sm text-[var(--text2)] leading-relaxed whitespace-pre-wrap">{data.narrative}</div>
        </div>
      )}
    </div>
  )
}
