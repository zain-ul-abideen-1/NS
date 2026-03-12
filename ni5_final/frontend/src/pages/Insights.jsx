import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, TrendingUp, Users, AlertTriangle, Star, Network, BarChart3, Target, Brain, Download } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts'
import toast from 'react-hot-toast'
import { Sessions, Digest } from '../utils/api'
import { PageHeader, Skel, TooltipBox } from '../components/UI'

const COLORS = ['#38BDF8','#34D399','#FBBF24','#F87171','#A78BFA','#60A5FA','#FB923C','#4ADE80']

export default function Insights() {
  const { id } = useParams()
  const [tab, setTab] = useState('nps')
  const [session, setSession] = useState(null)
  const [nps,       setNps]       = useState(null)
  const [personas,  setPersonas]  = useState(null)
  const [risks,     setRisks]     = useState(null)
  const [quality,   setQuality]   = useState(null)
  const [cooccur,   setCooccur]   = useState(null)
  const [heatmap,   setHeatmap]   = useState(null)
  const [digest,    setDigest]    = useState(null)
  const [loading,   setLoading]   = useState({})

  const load = async (key, fn) => {
    if (loading[key]) return
    setLoading(l => ({ ...l, [key]: true }))
    try {
      const r = await fn()
      return r.data
    } catch (e) {
      toast.error(e.response?.data?.detail || `Failed to load ${key}`)
      return null
    } finally {
      setLoading(l => ({ ...l, [key]: false }))
    }
  }

  useEffect(() => {
    Sessions.get(id).then(r => setSession(r.data?.session)).catch(() => {})
    load('nps', () => Sessions.nps(id)).then(d => d && setNps(d))
  }, [id])

  const onTab = async (t) => {
    setTab(t)
    if (t === 'personas'  && !personas)  load('personas',  () => Sessions.personas(id)).then(d => d && setPersonas(d))
    if (t === 'risks'     && !risks)     load('risks',     () => Sessions.risks(id)).then(d => d && setRisks(d))
    if (t === 'quality'   && !quality)   load('quality',   () => Sessions.quality(id)).then(d => d && setQuality(d))
    if (t === 'cooccur'   && !cooccur)   load('cooccur',   () => Sessions.cooccurrence(id)).then(d => d && setCooccur(d))
    if (t === 'heatmap'   && !heatmap)   load('heatmap',   () => Sessions.heatmap(id)).then(d => d && setHeatmap(d))
    if (t === 'digest'    && !digest)    {
      const d = await load('digest', () => Digest.generate([id], 'This Session'))
      if (d) setDigest(d)
    }
  }

  const TABS = [
    { k: 'nps',     label: 'NPS Score',         icon: Target },
    { k: 'personas',label: 'Customer Personas',  icon: Users },
    { k: 'risks',   label: 'Risk Alerts',        icon: AlertTriangle },
    { k: 'quality', label: 'Quality Report',     icon: Star },
    { k: 'cooccur', label: 'Keyword Network',    icon: Network },
    { k: 'heatmap', label: 'Score Heatmap',      icon: BarChart3 },
    { k: 'digest',  label: 'AI Digest',          icon: Brain },
  ]

  return (
    <div className="p-6 lg:p-8 space-y-5">
      <div className="flex items-start gap-3">
        <Link to={`/history/${id}`} className="btn-ghost p-2 mt-1"><ArrowLeft size={15} /></Link>
        <div>
          <h1 className="page-title">Advanced Insights</h1>
          <p className="text-sm text-[var(--text2)] mt-0.5">{session?.name || id}</p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex flex-wrap gap-1.5">
        {TABS.map(({ k, label, icon: Icon }) => (
          <button key={k} onClick={() => onTab(k)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all border ${
              tab === k
                ? 'text-white border-transparent shadow-md'
                : 'text-[var(--muted)] border-[var(--border)] hover:text-[var(--text)] hover:border-[var(--border2)]'
            }`}
            style={tab === k ? { background: 'var(--grad-brand)' } : {}}>
            <Icon size={13} />
            {label}
          </button>
        ))}
      </div>

      {/* ── NPS ── */}
      {tab === 'nps' && (
        <NpsPanel nps={nps} loading={loading.nps} />
      )}

      {/* ── PERSONAS ── */}
      {tab === 'personas' && (
        <PersonasPanel personas={personas} loading={loading.personas} />
      )}

      {/* ── RISKS ── */}
      {tab === 'risks' && (
        <RisksPanel risks={risks} loading={loading.risks} />
      )}

      {/* ── QUALITY ── */}
      {tab === 'quality' && (
        <QualityPanel quality={quality} loading={loading.quality} />
      )}

      {/* ── CO-OCCURRENCE ── */}
      {tab === 'cooccur' && (
        <CooccurPanel data={cooccur} loading={loading.cooccur} />
      )}

      {/* ── HEATMAP ── */}
      {tab === 'heatmap' && (
        <HeatmapPanel data={heatmap} loading={loading.heatmap} />
      )}

      {/* ── DIGEST ── */}
      {tab === 'digest' && (
        <DigestPanel data={digest} loading={loading.digest} />
      )}
    </div>
  )
}

function Loader() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => <Skel key={i} className="h-24 rounded-xl" />)}
    </div>
  )
}

// ── NPS Panel ──
function NpsPanel({ nps, loading }) {
  if (loading) return <Loader />
  if (!nps) return <div className="card p-10 text-center text-sm text-[var(--muted)]">Loading NPS data...</div>

  const color = nps.nps >= 50 ? 'var(--green)' : nps.nps >= 20 ? 'var(--amber)' : nps.nps >= 0 ? 'var(--brand)' : 'var(--red)'
  const pieData = [
    { name: 'Promoters',  value: nps.promoters,  fill: 'var(--green)' },
    { name: 'Passives',   value: nps.passives,   fill: 'var(--amber)' },
    { name: 'Detractors', value: nps.detractors, fill: 'var(--red)'   },
  ]

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card p-6 flex flex-col items-center justify-center gap-4">
          <p className="section-title">Net Promoter Score</p>
          <div className="text-center">
            <p className="text-7xl font-display font-black" style={{ color }}>{nps.nps}</p>
            <p className="text-sm font-semibold mt-2" style={{ color }}>{nps.label}</p>
          </div>
          <p className="text-xs text-[var(--muted)] text-center">
            Based on {nps.total} reviews. NPS ranges from -100 to +100.
            Scores above 50 are considered excellent.
          </p>
        </div>

        <div className="card p-5">
          <p className="section-title mb-4">Score Breakdown</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                paddingAngle={3} dataKey="value">
                {pieData.map((d, i) => <Cell key={i} fill={d.fill} />)}
              </Pie>
              <Tooltip content={<TooltipBox />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-3 gap-3 mt-3">
            {[
              ['Promoters',  nps.promoter_pct,  'var(--green)'],
              ['Passives',   100-nps.promoter_pct-nps.detractor_pct, 'var(--amber)'],
              ['Detractors', nps.detractor_pct, 'var(--red)'],
            ].map(([label, pct, c]) => (
              <div key={label} className="card2 p-3 text-center">
                <p className="text-lg font-display font-bold" style={{ color: c }}>{pct}%</p>
                <p className="text-[10px] text-[var(--muted)]">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card p-5">
        <p className="section-title mb-3">NPS Benchmarks</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            ['Below 0',  'Critical — serious issues',       'var(--red)'],
            ['0 – 20',   'Needs improvement',               'var(--amber)'],
            ['20 – 50',  'Good — growing loyalty',          'var(--brand)'],
            ['Above 50', 'Excellent — strong advocates',    'var(--green)'],
          ].map(([range, desc, c]) => (
            <div key={range} className={`card2 p-3 ${nps.nps >= parseInt(range) || range === 'Above 50' && nps.nps >= 50 ? 'ring-1 ring-[var(--brand)]/20' : ''}`}>
              <p className="text-sm font-bold" style={{ color: c }}>{range}</p>
              <p className="text-[10px] text-[var(--muted)] mt-0.5">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Personas Panel ──
function PersonasPanel({ personas, loading }) {
  if (loading) return <Loader />
  if (!personas) return <div className="card p-10 text-center text-sm text-[var(--muted)]">Loading personas...</div>

  const colors = { positive: 'var(--green)', negative: 'var(--red)', neutral: 'var(--amber)' }

  return (
    <div className="space-y-5">
      {personas.ai_summary && (
        <div className="card p-5 ai-insight-block">
          <p className="text-sm text-[var(--text2)] leading-relaxed">{personas.ai_summary}</p>
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {personas.personas.map((p, i) => (
          <div key={i} className="card p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                style={{ background: `${colors[p.sentiment]}` }}>
                {p.name[0]}
              </div>
              <div>
                <p className="font-display font-bold text-sm text-[var(--text)]">{p.name}</p>
                <p className="text-[10px] text-[var(--muted)]">{p.pct}% of reviews</p>
              </div>
            </div>
            <p className="text-xs text-[var(--text2)] leading-relaxed">{p.description}</p>
            <div>
              <p className="label">Top Keywords</p>
              <div className="flex flex-wrap gap-1">
                {p.top_keywords.map(k => (
                  <span key={k} className="text-[10px] px-1.5 py-0.5 bg-[var(--border)] text-[var(--text2)] rounded font-mono">{k}</span>
                ))}
              </div>
            </div>
            {p.top_topics.length > 0 && (
              <div>
                <p className="label">Top Concerns</p>
                <div className="flex flex-wrap gap-1">
                  {p.top_topics.map(t => (
                    <span key={t} className="badge badge-blue text-[10px]">{t}</span>
                  ))}
                </div>
              </div>
            )}
            <div className="pt-2 border-t border-[var(--border)]">
              <p className="label">Recommended Action</p>
              <p className="text-xs text-[var(--text2)]">{p.action}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Risks Panel ──
function RisksPanel({ risks, loading }) {
  if (loading) return <Loader />
  if (!risks) return <div className="card p-10 text-center text-sm text-[var(--muted)]">Loading risk analysis...</div>

  const lvlColors = { critical: 'var(--red)', high: 'var(--amber)', medium: 'var(--brand)', low: 'var(--green)' }
  const bgColors  = { critical: 'rgba(248,113,113,.06)', high: 'rgba(251,191,36,.06)', medium: 'rgba(56,189,248,.06)', low: 'rgba(52,211,153,.06)' }
  const riskColor = risks.risk_score >= 60 ? 'var(--red)' : risks.risk_score >= 35 ? 'var(--amber)' : risks.risk_score >= 15 ? 'var(--brand)' : 'var(--green)'

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card p-4 text-center">
          <p className="text-4xl font-display font-black" style={{ color: riskColor }}>{risks.risk_score}</p>
          <p className="text-xs text-[var(--muted)] mt-1">Risk Score (0–100)</p>
        </div>
        {[
          ['Risk Level', risks.risk_label, riskColor],
          ['Total Alerts', risks.total_alerts, 'var(--amber)'],
          ['Critical Alerts', risks.alerts.filter(a=>a.level==='critical').length, 'var(--red)'],
        ].map(([l, v, c]) => (
          <div key={l} className="card p-4 text-center">
            <p className="text-2xl font-display font-bold" style={{ color: c }}>{v}</p>
            <p className="text-xs text-[var(--muted)] mt-1">{l}</p>
          </div>
        ))}
      </div>

      {risks.alerts.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-sm font-semibold text-[var(--green)]">No risk alerts detected</p>
          <p className="text-xs text-[var(--muted)] mt-1">This session shows healthy sentiment patterns</p>
        </div>
      ) : (
        <div className="space-y-3">
          {risks.alerts.map((a, i) => (
            <div key={i} className="card p-4 flex items-start gap-4"
              style={{ borderColor: lvlColors[a.level], background: bgColors[a.level] }}>
              <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" style={{ color: lvlColors[a.level] }} />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-semibold text-[var(--text)]">{a.title}</p>
                  <span className="badge text-[10px]"
                    style={{ background: bgColors[a.level], color: lvlColors[a.level], border: `1px solid ${lvlColors[a.level]}40` }}>
                    {a.level.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-[var(--text2)] leading-relaxed">{a.detail}</p>
              </div>
              <span className="text-xs font-mono text-[var(--muted)] flex-shrink-0 bg-[var(--card2)] px-2 py-1 rounded-lg">
                {a.metric}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Quality Panel ──
function QualityPanel({ quality, loading }) {
  if (loading) return <Loader />
  if (!quality) return <div className="card p-10 text-center text-sm text-[var(--muted)]">Loading quality report...</div>

  const qColor = quality.quality_score >= 0.75 ? 'var(--green)' : quality.quality_score >= 0.55 ? 'var(--brand)' : quality.quality_score >= 0.35 ? 'var(--amber)' : 'var(--red)'
  const radarData = [
    { metric: 'Helpfulness', value: Math.round(quality.avg_helpfulness * 100) },
    { metric: 'Authenticity', value: Math.round(quality.avg_authenticity * 100) },
    { metric: 'Low Spam', value: Math.round((1 - quality.avg_spam) * 100) },
    { metric: 'Useful Reviews', value: quality.very_helpful_pct },
    { metric: 'Genuine Rate', value: 100 - quality.fake_pct },
  ]

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          ['Quality Score', Math.round(quality.quality_score * 100) + '%', qColor],
          ['Quality Level', quality.quality_label, qColor],
          ['Fake Reviews', quality.fake_pct + '%', 'var(--red)'],
          ['Very Helpful', quality.very_helpful_pct + '%', 'var(--green)'],
        ].map(([l, v, c]) => (
          <div key={l} className="card p-4 text-center">
            <p className="text-2xl font-display font-bold" style={{ color: c }}>{v}</p>
            <p className="text-xs text-[var(--muted)] mt-1">{l}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card p-5">
          <p className="section-title mb-4">Quality Radar</p>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis dataKey="metric" tick={{ fill: 'var(--muted)', fontSize: 10 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: 'var(--muted)', fontSize: 9 }} />
              <Radar dataKey="value" stroke="var(--brand)" fill="var(--brand)" fillOpacity={0.2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5 space-y-4">
          <p className="section-title">Detailed Metrics</p>
          {[
            ['Avg Helpfulness',  quality.avg_helpfulness,  'var(--brand)'],
            ['Avg Authenticity', quality.avg_authenticity, 'var(--green)'],
            ['Spam Rate',        quality.avg_spam,         'var(--red)', true],
          ].map(([label, val, color, invert]) => (
            <div key={label}>
              <div className="flex justify-between mb-1 text-xs">
                <span className="text-[var(--text2)]">{label}</span>
                <span className="font-mono font-medium" style={{ color }}>{Math.round(val * 100)}%</span>
              </div>
              <div className="h-2 bg-[var(--border)] rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all"
                  style={{ width: `${Math.round(val * 100)}%`, background: color }} />
              </div>
            </div>
          ))}
          <div className="mt-4 p-3 bg-[var(--card2)] rounded-xl border border-[var(--border2)]">
            <p className="text-xs text-[var(--text2)] leading-relaxed">{quality.recommendation}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Co-occurrence Panel ──
function CooccurPanel({ data, loading }) {
  if (loading) return <Loader />
  if (!data) return <div className="card p-10 text-center text-sm text-[var(--muted)]">Loading keyword network...</div>

  return (
    <div className="space-y-5">
      <div className="card p-5">
        <p className="section-title mb-2">Keyword Co-occurrence Network</p>
        <p className="text-xs text-[var(--muted)] mb-4">
          Words that frequently appear together in reviews — reveals thematic clusters in customer feedback
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Top co-occurring pairs */}
          <div>
            <p className="label mb-2">Top Co-occurring Pairs</p>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {data.edges.slice(0, 20).map((e, i) => (
                <div key={i} className="flex items-center gap-2 p-2 card2 rounded-lg">
                  <span className="text-xs font-mono text-[var(--brand)] font-medium">{e.source}</span>
                  <div className="flex-1 h-1 bg-[var(--border)] rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{
                      width: `${Math.round(e.weight / data.edges[0]?.weight * 100)}%`,
                      background: COLORS[i % COLORS.length]
                    }} />
                  </div>
                  <span className="text-xs font-mono text-[var(--brand)] font-medium">{e.target}</span>
                  <span className="text-[10px] text-[var(--muted)] ml-1 font-mono">{e.weight}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top words chart */}
          <div>
            <p className="label mb-2">Most Frequent Words</p>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.top_words} layout="vertical" barSize={12}>
                <XAxis type="number" tick={{ fill: 'var(--muted)', fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="word" tick={{ fill: 'var(--text2)', fontSize: 10 }}
                  axisLine={false} tickLine={false} width={80} />
                <Tooltip content={<TooltipBox />} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} name="Frequency">
                  {data.top_words.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Word cloud from nodes */}
      <div className="card p-5">
        <p className="section-title mb-3">Network Nodes</p>
        <div className="flex flex-wrap gap-2">
          {data.nodes.map((n, i) => (
            <span key={n} className="px-2.5 py-1 rounded-lg text-xs font-medium text-white"
              style={{ background: COLORS[i % COLORS.length], opacity: 0.85 }}>
              {n}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Heatmap Panel ──
function HeatmapPanel({ data, loading }) {
  if (loading) return <Loader />
  if (!data) return <div className="card p-10 text-center text-sm text-[var(--muted)]">Loading heatmap...</div>

  return (
    <div className="space-y-5">
      <div className="card p-5">
        <p className="section-title mb-2">Sentiment Score Distribution</p>
        <p className="text-xs text-[var(--muted)] mb-4">
          How sentiment labels map to actual score ranges across {data.total} reviews
        </p>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data.score_distribution} barSize={28}>
            <XAxis dataKey="band" tick={{ fill: 'var(--muted)', fontSize: 9 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'var(--muted)', fontSize: 9 }} axisLine={false} tickLine={false} />
            <Tooltip content={<TooltipBox />} />
            <Bar dataKey="positive" fill="var(--green)"  radius={[3,3,0,0]} name="Positive" stackId="a" />
            <Bar dataKey="neutral"  fill="var(--brand)"  radius={[0,0,0,0]} name="Neutral"  stackId="a" />
            <Bar dataKey="negative" fill="var(--red)"    radius={[3,3,0,0]} name="Negative" stackId="a" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {Object.entries(data.avg_by_sentiment).map(([sent, avg]) => (
          <div key={sent} className="card p-4 text-center">
            <p className="text-xl font-display font-bold"
              style={{ color: sent === 'positive' ? 'var(--green)' : sent === 'negative' ? 'var(--red)' : 'var(--brand)' }}>
              {avg >= 0 ? '+' : ''}{avg.toFixed(3)}
            </p>
            <p className="text-xs text-[var(--muted)] mt-0.5 capitalize">Avg {sent} Score</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Digest Panel ──
function DigestPanel({ data, loading }) {
  if (loading) return <Loader />
  if (!data) return <div className="card p-10 text-center text-sm text-[var(--muted)]">Generating AI digest...</div>

  const copyDigest = () => {
    navigator.clipboard.writeText(data.digest)
    toast.success('Digest copied to clipboard')
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          ['Period', data.period, 'var(--text)'],
          ['Reviews', data.total_reviews, 'var(--brand)'],
          ['Avg Score', (data.avg_score >= 0 ? '+' : '') + data.avg_score?.toFixed(3), data.avg_score >= 0 ? 'var(--green)' : 'var(--red)'],
          ['Top Session', data.best_session?.slice(0,14) + (data.best_session?.length > 14 ? '...' : ''), 'var(--green)'],
        ].map(([l, v, c]) => (
          <div key={l} className="card p-4 text-center">
            <p className="text-base font-display font-bold truncate" style={{ color: c }}>{v}</p>
            <p className="text-xs text-[var(--muted)] mt-0.5">{l}</p>
          </div>
        ))}
      </div>

      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'var(--grad-brand)' }}>
              <Brain size={13} className="text-white" />
            </div>
            <p className="section-title">Intelligence Digest</p>
          </div>
          <button onClick={copyDigest} className="btn-ghost text-xs">
            <Download size={12} />Copy
          </button>
        </div>
        <div className="bg-[var(--card2)] border border-[var(--border2)] rounded-xl p-5">
          <pre className="text-sm text-[var(--text2)] font-sans leading-relaxed whitespace-pre-wrap">{data.digest}</pre>
        </div>
      </div>
    </div>
  )
}
