import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Download, Send, Search, Brain, Copy, Check, TrendingUp } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import toast from 'react-hot-toast'
import { Sessions, AI, Export } from '../utils/api'
import { SentBadge, ScoreBar, AuthBadge, TooltipBox, Skel } from '../components/UI'

const TABS = ['Overview', 'Reviews', 'Aspects', 'Emotions', 'Authenticity', 'AI Chat', 'Response Hub']

export default function SessionDetail() {
  const { id } = useParams()
  const [data,     setData]     = useState(null)
  const [tab,      setTab]      = useState('Overview')
  const [search,   setSearch]   = useState('')
  const [sentF,    setSentF]    = useState('')
  const [msgs,     setMsgs]     = useState([])
  const [chatIn,   setChatIn]   = useState('')
  const [chatLoad, setChatLoad] = useState(false)
  const chatRef = useRef(null)

  useEffect(() => {
    Sessions.get(id)
      .then(r => setData(r.data))
      .catch(() => toast.error('Failed to load session'))
  }, [id])

  useEffect(() => {
    chatRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs])

  if (!data) return (
    <div className="p-8 space-y-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="skeleton h-24 rounded-xl" />
      ))}
    </div>
  )

  const { session, reviews } = data
  const total  = session.total_reviews || 1
  const posPct = Math.round(session.positive_count / total * 100)
  const negPct = Math.round(session.negative_count / total * 100)
  const neuPct = Math.max(0, 100 - posPct - negPct)

  const filtered = reviews.filter(r => {
    const matchText = !search || r.text?.toLowerCase().includes(search.toLowerCase())
    const matchSent = !sentF  || r.sentiment === sentF
    return matchText && matchSent
  })

  const openChat = () => {
    if (msgs.length === 0) {
      const pos = Math.round((session?.positive_count||0) / (session?.total_reviews||1) * 100)
      setMsgs([{
        role: 'ai',
        text: `Hi! I'm your NestInsights AI. I've analyzed "${session?.name || 'this session'}" — ${session?.total_reviews||0} reviews, ${pos}% positive. What would you like to know?`
      }])
    }
  }

  const sendChat = async () => {
    const msg = chatIn.trim(); if (!msg) return
    setChatIn('')
    const userMsg = { role:'user', text:msg, content:msg }
    setMsgs(m => [...m, userMsg])
    setChatLoad(true)
    try {
      // Send full history so Claude remembers the conversation
      const history = [...msgs, userMsg].map(m => ({
        role: m.role === 'ai' ? 'assistant' : 'user',
        content: m.text || m.content || ''
      }))
      const r = await AI.chat(id, msg, history.slice(0,-1)) // history excludes current msg
      setMsgs(m => [...m, { role:'ai', text:r.data.reply, content:r.data.reply }])
    } catch {
      setMsgs(m => [...m, { role:'ai', text:'AI service unavailable. Check ANTHROPIC_API_KEY in backend/.env.', content:'' }])
    } finally { setChatLoad(false) }
  }

  const exportCsv = async () => {
    try {
      const r = await Export.csv(id)
      const url = URL.createObjectURL(new Blob([r.data]))
      const a = document.createElement('a'); a.href = url; a.download = `session_${id}.csv`; a.click()
      URL.revokeObjectURL(url)
    } catch { toast.error('Export failed') }
  }

  // Aggregate emotions across all reviews
  const emotionAgg = {}
  reviews.forEach(r => Object.entries(r.emotions || {}).forEach(([e, v]) => {
    emotionAgg[e] = (emotionAgg[e] || 0) + v
  }))
  const emotionData = Object.entries(emotionAgg)
    .map(([name, value]) => ({ name, value: +value.toFixed(2) }))
    .sort((a, b) => b.value - a.value)

  // Aggregate aspects
  const aspAgg = {}
  reviews.forEach(r => Object.entries(r.aspects || {}).forEach(([a, d]) => {
    if (!aspAgg[a]) aspAgg[a] = { positive:0, negative:0, neutral:0 }
    aspAgg[a][d.sentiment]++
  }))
  const aspData = Object.entries(aspAgg)
    .map(([name, d]) => ({ name: name.replace(/_/g, ' '), ...d }))
    .sort((a, b) => (b.positive + b.negative + b.neutral) - (a.positive + a.negative + a.neutral))

  // Auth counts
  const authCounts = { 'genuine':0, 'likely genuine':0, 'suspicious':0, 'likely fake':0 }
  reviews.forEach(r => { if (r.authenticity_label) authCounts[r.authenticity_label]++ })

  return (
    <div className="p-6 lg:p-8 space-y-5">
      {/* Header */}
      <div className="flex items-start gap-3 flex-wrap">
        <Link to="/history" className="btn-ghost p-2 mt-1"><ArrowLeft size={15} /></Link>
        <div className="flex-1 min-w-0">
          <h1 className="page-title truncate">{session.name || session.session_id}</h1>
          <p className="text-sm text-[var(--text2)] mt-0.5">
            {session.total_reviews} reviews · {session.source_type} · {new Date(session.created_at).toLocaleDateString()}
          </p>
        </div>
        <Link to={`/insights/${id}`} className="btn-secondary text-xs flex-shrink-0">
          <TrendingUp size={13} />Advanced Insights
        </Link>
        <button onClick={exportCsv} className="btn-secondary text-xs flex-shrink-0">
          <Download size={13} />Export CSV
        </button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          [posPct + '%', 'Positive', 'var(--green)'],
          [negPct + '%', 'Negative', 'var(--red)'],
          [session.avg_score?.toFixed(3), 'Avg Score', 'var(--brand)'],
          [session.fake_count || 0, 'Flagged Reviews', 'var(--amber)'],
        ].map(([v, l, c]) => (
          <div key={l} className="card p-4 text-center">
            <p className="text-2xl font-display font-bold" style={{ color: c }}>{v}</p>
            <p className="text-xs text-[var(--muted)] mt-0.5">{l}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 flex-wrap">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`tab-btn ${tab === t ? 'tab-active' : ''}`}>{t}</button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {tab === 'Overview' && (
        <div className="space-y-5">
          {/* AI Insights — prominent */}
          {session.ai_summary && (
            <div className="card p-5 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'var(--grad-brand)' }}>
                  <Brain size={13} className="text-white" />
                </div>
                <p className="section-title">AI Deep Insights</p>
              </div>
              <div className="bg-[var(--card2)] border border-[var(--border2)] rounded-xl p-4">
                <p className="text-sm text-[var(--text2)] leading-relaxed whitespace-pre-line">{session.ai_summary}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Sentiment pie */}
            <div className="card p-5">
              <p className="section-title mb-4">Sentiment Distribution</p>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={[
                      { name:'Positive', value:session.positive_count },
                      { name:'Negative', value:session.negative_count },
                      { name:'Neutral',  value:Math.max(0, session.neutral_count || 0) },
                    ]}
                    cx="50%" cy="50%" innerRadius={48} outerRadius={72}
                    paddingAngle={3} dataKey="value">
                    {['var(--green)','var(--red)','var(--brand)'].map((c, i) => (
                      <Cell key={i} fill={c} />
                    ))}
                  </Pie>
                  <Tooltip content={<TooltipBox />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-5 mt-3">
                {[['Positive','var(--green)',posPct],['Negative','var(--red)',negPct],['Neutral','var(--brand)',neuPct]].map(([n,c,p]) => (
                  <div key={n} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c }} />
                    <span className="text-xs text-[var(--muted)]">{n}</span>
                    <span className="text-xs font-medium text-[var(--text)]">{p}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Score histogram */}
            <div className="card p-5">
              <p className="section-title mb-4">Score Distribution</p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={[
                  { range:'Very Neg', count: reviews.filter(r => r.score < -0.5).length },
                  { range:'Negative', count: reviews.filter(r => r.score >= -0.5 && r.score < -0.05).length },
                  { range:'Neutral',  count: reviews.filter(r => r.score >= -0.05 && r.score <= 0.05).length },
                  { range:'Positive', count: reviews.filter(r => r.score > 0.05 && r.score <= 0.5).length },
                  { range:'Very Pos', count: reviews.filter(r => r.score > 0.5).length },
                ]} barSize={28}>
                  <XAxis dataKey="range" tick={{ fill:'var(--muted)', fontSize:10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill:'var(--muted)', fontSize:10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<TooltipBox />} />
                  <Bar dataKey="count" fill="var(--brand)" radius={[4,4,0,0]} name="Reviews" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top keywords */}
          {reviews.length > 0 && (
            <div className="card p-5">
              <p className="section-title mb-3">Top Keywords</p>
              <div className="flex flex-wrap gap-1.5">
                {(() => {
                  const freq = {}
                  reviews.forEach(r => (r.keywords || []).forEach(k => {
                    freq[k.word] = (freq[k.word] || 0) + k.count
                  }))
                  return Object.entries(freq)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 24)
                    .map(([w, c]) => (
                      <span key={w}
                        className="text-xs px-2 py-0.5 rounded-lg bg-[var(--border)] text-[var(--text2)] font-mono"
                        style={{ fontSize: `${Math.min(14, 10 + c * 0.4)}px` }}>
                        {w}
                      </span>
                    ))
                })()}
              </div>
            </div>
          )}

          {/* Trend comparison */}
          {reviews.length > 10 && (
            <div className="card p-5">
              <p className="section-title mb-2">Sentiment Trend</p>
              <p className="text-xs text-[var(--muted)] mb-4">First half vs second half of reviews</p>
              <div className="grid grid-cols-2 gap-4">
                {(() => {
                  const half = Math.floor(reviews.length / 2)
                  const first  = reviews.slice(0, half)
                  const second = reviews.slice(half)
                  const posPctFirst  = Math.round(first.filter(r => r.sentiment === 'positive').length / first.length * 100)
                  const posPctSecond = Math.round(second.filter(r => r.sentiment === 'positive').length / second.length * 100)
                  const diff = posPctSecond - posPctFirst
                  return [
                    ['First Half',  first.length,  posPctFirst,  'var(--muted)'],
                    ['Second Half', second.length, posPctSecond, diff >= 0 ? 'var(--green)' : 'var(--red)'],
                  ].map(([label, n, pct, c]) => (
                    <div key={label} className="card2 p-4">
                      <p className="label">{label}</p>
                      <p className="text-2xl font-display font-bold" style={{ color: c }}>{pct}%</p>
                      <p className="text-xs text-[var(--muted)] mt-0.5">positive · {n} reviews</p>
                    </div>
                  ))
                })()}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── REVIEWS ── */}
      {tab === 'Reviews' && (
        <div className="space-y-3">
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
              <input className="input pl-9 text-sm" placeholder="Search reviews..."
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="input w-36 text-sm" value={sentF} onChange={e => setSentF(e.target.value)}>
              <option value="">All sentiments</option>
              <option value="positive">Positive</option>
              <option value="negative">Negative</option>
              <option value="neutral">Neutral</option>
            </select>
          </div>
          <p className="text-xs text-[var(--muted)]">{filtered.length} of {reviews.length} reviews</p>
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {filtered.map((r, i) => <ReviewCard key={r.id || i} review={r} />)}
          </div>
        </div>
      )}

      {/* ── ASPECTS ── */}
      {tab === 'Aspects' && (
        <div className="space-y-5">
          <div className="card p-5">
            <p className="section-title mb-2">Aspect-Level Sentiment Analysis</p>
            <p className="text-xs text-[var(--muted)] mb-4">
              How customers feel about each dimension of the product or service
            </p>
            {aspData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={aspData} barSize={14}>
                    <XAxis dataKey="name" tick={{ fill:'var(--muted)', fontSize:10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill:'var(--muted)', fontSize:10 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<TooltipBox />} />
                    <Bar dataKey="positive" fill="var(--green)" radius={[3,3,0,0]} name="Positive" />
                    <Bar dataKey="negative" fill="var(--red)"   radius={[3,3,0,0]} name="Negative" />
                    <Bar dataKey="neutral"  fill="var(--brand)" radius={[3,3,0,0]} name="Neutral" />
                  </BarChart>
                </ResponsiveContainer>
                <div className="flex gap-5 mt-3 justify-center">
                  {[['Positive','var(--green)'],['Negative','var(--red)'],['Neutral','var(--brand)']].map(([n,c]) => (
                    <div key={n} className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-sm" style={{ background: c }} />
                      <span className="text-xs text-[var(--muted)]">{n}</span>
                    </div>
                  ))}
                </div>

                {/* Aspect breakdown table */}
                <div className="mt-5 space-y-2">
                  {aspData.map(a => {
                    const tot = (a.positive + a.negative + a.neutral) || 1
                    return (
                      <div key={a.name} className="card2 p-3 flex items-center gap-3">
                        <span className="text-xs font-medium text-[var(--text)] w-28 capitalize">{a.name}</span>
                        <div className="flex-1 flex h-2 rounded-full overflow-hidden bg-[var(--border)]">
                          <div style={{ width:`${a.positive/tot*100}%`, background:'var(--green)' }} />
                          <div style={{ width:`${a.negative/tot*100}%`, background:'var(--red)' }} />
                          <div style={{ width:`${a.neutral/tot*100}%`,  background:'var(--brand)' }} />
                        </div>
                        <span className="text-[10px] text-[var(--muted)] w-12 text-right font-mono">{tot} refs</span>
                      </div>
                    )
                  })}
                </div>
              </>
            ) : (
              <p className="text-sm text-[var(--muted)] text-center py-10">
                No aspect data detected — reviews may be too short or generic
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── EMOTIONS ── */}
      {tab === 'Emotions' && (
        <div className="card p-5">
          <p className="section-title mb-2">Emotion Profile</p>
          <p className="text-xs text-[var(--muted)] mb-5">Aggregated emotional tone across all reviews</p>
          {emotionData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={emotionData} barSize={36}>
                  <XAxis dataKey="name" tick={{ fill:'var(--muted)', fontSize:11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill:'var(--muted)', fontSize:11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<TooltipBox />} />
                  <Bar dataKey="value" fill="var(--brand)" radius={[4,4,0,0]} name="Intensity" />
                </BarChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
                {emotionData.slice(0, 8).map(e => (
                  <div key={e.name} className="card2 p-3 text-center">
                    <p className="text-lg font-display font-bold text-[var(--brand)]">{e.value.toFixed(1)}</p>
                    <p className="text-xs text-[var(--muted)] mt-0.5 capitalize">{e.name}</p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-[var(--muted)] text-center py-10">No emotion data detected in this session</p>
          )}
        </div>
      )}

      {/* ── AUTHENTICITY ── */}
      {tab === 'Authenticity' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              ['Genuine',        'var(--green)',  authCounts['genuine']],
              ['Likely Genuine', 'var(--brand)',  authCounts['likely genuine']],
              ['Suspicious',     'var(--amber)',  authCounts['suspicious']],
              ['Likely Fake',    'var(--red)',    authCounts['likely fake']],
            ].map(([label, c, count]) => (
              <div key={label} className="card p-4 text-center">
                <p className="text-2xl font-display font-bold" style={{ color: c }}>{count}</p>
                <p className="text-xs text-[var(--muted)] mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {authCounts['suspicious'] + authCounts['likely fake'] > 0 && (
            <div className="card p-5">
              <p className="section-title mb-4">Flagged Reviews</p>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {reviews
                  .filter(r => ['suspicious', 'likely fake'].includes(r.authenticity_label))
                  .map((r, i) => (
                    <div key={i} className="p-3 bg-[var(--red)]/5 rounded-xl border border-[var(--red)]/15">
                      <div className="flex items-center gap-2 mb-2">
                        <AuthBadge label={r.authenticity_label} />
                        <span className="text-xs text-[var(--muted)] font-mono">
                          confidence: {(r.authenticity_score * 100).toFixed(0)}%
                        </span>
                      </div>
                      <p className="text-xs text-[var(--text2)] leading-relaxed">{r.text}</p>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {authCounts['suspicious'] + authCounts['likely fake'] === 0 && (
            <div className="card p-8 text-center">
              <p className="text-sm font-medium text-[var(--green)]">No suspicious reviews detected in this session</p>
              <p className="text-xs text-[var(--muted)] mt-1">All reviews passed the authenticity check</p>
            </div>
          )}
        </div>
      )}

      {/* ── AI CHAT ── */}
      {tab === 'AI Chat' && (() => { if(msgs.length===0) { const pos=Math.round((session?.positive_count||0)/(session?.total_reviews||1)*100); setTimeout(()=>setMsgs([{role:'ai',text:`Hi! I'm your NestInsights AI. I've analyzed "${session?.name||'this session'}" — ${session?.total_reviews||0} reviews, ${pos}% positive. What would you like to know?`}]),50) } return null })()}
      {tab === 'AI Chat' && (
        <div className="card p-5 flex flex-col" style={{ height: '520px' }}>
          <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1">
            {msgs.length === 0 && (
              <div className="text-center py-8">
                <div className="flex gap-1 justify-center">
                  {[0,1,2].map(i=><div key={i} className="w-2 h-2 rounded-full bg-[var(--brand)] animate-bounce" style={{animationDelay:`${i*0.15}s`}}/>)}
                </div>
              </div>
            )}
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[82%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'text-white rounded-br-sm'
                    : 'bg-[var(--card2)] text-[var(--text)] border border-[var(--border2)] rounded-bl-sm'
                }`} style={m.role === 'user' ? { background:'var(--grad-brand)' } : {}}>
                  {m.text}
                </div>
              </div>
            ))}
            {chatLoad && (
              <div className="flex justify-start">
                <div className="px-4 py-2.5 rounded-2xl bg-[var(--card2)] border border-[var(--border2)] text-xs text-[var(--muted)] flex items-center gap-2">
                  <div className="flex gap-1">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="w-1.5 h-1.5 rounded-full bg-[var(--muted)] animate-bounce"
                        style={{ animationDelay:`${i * 0.15}s` }} />
                    ))}
                  </div>
                  Analyzing...
                </div>
              </div>
            )}
            <div ref={chatRef} />
          </div>
          <div className="flex gap-2 border-t border-[var(--border)] pt-3">
            <input className="input flex-1 text-sm" placeholder="Ask about this session..."
              value={chatIn} onChange={e => setChatIn(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendChat()} />
            <button onClick={sendChat} disabled={chatLoad || !chatIn.trim()}
              className="btn-primary px-4 disabled:opacity-40">
              <Send size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ── RESPONSE HUB ── */}
      {tab === 'Response Hub' && (
        <div className="space-y-3">
          <div className="card2 p-3 border border-[var(--border2)] rounded-xl">
            <p className="text-xs text-[var(--text2)]">
              Generate professional customer responses for negative reviews. Click the generate button on any review below.
            </p>
          </div>
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {reviews.filter(r => r.sentiment === 'negative').slice(0, 25).map((r, i) => (
              <ResponseHubCard key={i} review={r} />
            ))}
            {reviews.filter(r => r.sentiment === 'negative').length === 0 && (
              <div className="card p-10 text-center">
                <p className="text-sm font-medium text-[var(--green)]">No negative reviews in this session</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function ReviewCard({ review: r }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="card2 p-4 space-y-2">
      <div className="flex items-start gap-2 flex-wrap">
        <SentBadge s={r.sentiment} />
        <AuthBadge label={r.authenticity_label || 'genuine'} />
        {r.language && r.language !== 'en' && (
          <span className="badge badge-blue text-xs">{r.language.toUpperCase()}</span>
        )}
        {r.rating > 0 && (
          <span className="text-xs text-[var(--amber)] font-mono">{''.repeat(Math.round(r.rating))}</span>
        )}
        <span className="text-xs text-[var(--muted)] ml-auto font-mono">{r.score?.toFixed(3)}</span>
      </div>
      <p className="text-sm text-[var(--text)] leading-relaxed">{r.text}</p>
      {r.translated_text && (
        <p className="text-xs text-[var(--muted)] italic border-l-2 border-[var(--brand)]/30 pl-2">
          {r.translated_text}
        </p>
      )}
      <ScoreBar value={r.score || 0} />
      <button onClick={() => setOpen(o => !o)}
        className="text-xs text-[var(--muted)] hover:text-[var(--text)] transition-colors">
        {open ? 'Less detail' : 'More detail'}
      </button>
      {open && (
        <div className="space-y-2 pt-2 border-t border-[var(--border)]">
          {Object.keys(r.emotions || {}).length > 0 && (
            <div className="flex flex-wrap gap-1">
              {Object.entries(r.emotions).map(([e, v]) => (
                <span key={e} className="badge badge-blue text-[10px] capitalize">
                  {e} {(v * 100).toFixed(0)}%
                </span>
              ))}
            </div>
          )}
          {r.topics?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {r.topics.map(tp => <span key={tp} className="badge badge-neu text-[10px]">{tp}</span>)}
            </div>
          )}
          {r.response_suggestion && (
            <div className="p-2.5 bg-[var(--brand)]/5 rounded-lg border border-[var(--brand)]/15">
              <p className="text-xs text-[var(--muted)] mb-1">Suggested response template:</p>
              <p className="text-xs text-[var(--text2)]">{r.response_suggestion}</p>
            </div>
          )}
          <p className="text-[10px] text-[var(--dim)] font-mono break-all">SHA-256: {r.hash_value}</p>
        </div>
      )}
    </div>
  )
}

function ResponseHubCard({ review: r }) {
  const [aiResp,  setAiResp]  = useState('')
  const [loading, setLoad]    = useState(false)
  const [copied,  setCopied]  = useState(false)

  const gen = async () => {
    setLoad(true)
    try {
      const res = await AI.genResp(r.text, r.sentiment)
      setAiResp(res.data.response)
    } catch { toast.error('Generation failed') }
    finally { setLoad(false) }
  }

  const copy = () => {
    navigator.clipboard.writeText(aiResp)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="card2 p-4 space-y-3">
      <div className="flex items-start gap-2 flex-wrap">
        <SentBadge s={r.sentiment} />
        <span className="text-xs text-[var(--muted)] ml-auto font-mono">{r.score?.toFixed(3)}</span>
      </div>
      <p className="text-sm text-[var(--text2)] leading-relaxed">{r.text}</p>
      {!aiResp ? (
        <button onClick={gen} disabled={loading} className="btn-secondary text-xs">
          {loading
            ? <><div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />Generating...</>
            : 'Generate AI Response'
          }
        </button>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-[var(--brand)]">AI Response</p>
            <button onClick={copy} className="btn-ghost text-xs">
              {copied ? <><Check size={11} />Copied</> : <><Copy size={11} />Copy</>}
            </button>
          </div>
          <p className="text-sm text-[var(--text)] bg-[var(--brand)]/5 p-3 rounded-xl border border-[var(--brand)]/15 leading-relaxed">
            {aiResp}
          </p>
        </div>
      )}
    </div>
  )
}
