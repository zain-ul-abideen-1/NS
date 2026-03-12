import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Download, Brain, RefreshCw, ChevronDown, ChevronRight, AlertTriangle, Clock, Zap } from 'lucide-react'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import toast from 'react-hot-toast'
import axios from 'axios'
import { Tickets as TicketAPI } from '../utils/api'
import { PriBadge, SentBadge, UrgencyBar, TooltipBox, Skel } from '../components/UI'

const CAT_COLORS = {
  'Technical Issue':    '#6C63FF',
  'Billing / Payment':  '#FBBF24',
  'Refund / Return':    '#FF6584',
  'Delivery / Shipping':'#43E97B',
  'Account / Login':    '#8B85FF',
  'Feature Request':    '#6EE7B7',
  'Complaint / Abuse':  '#F87171',
  'Spam / Irrelevant':  '#94A3B8',
}
const PRI_COLORS = { critical:'var(--red)', high:'var(--amber)', medium:'var(--brand)', low:'var(--green)' }

function slaLabel(hours) {
  if (!hours) return '24 hours'
  if (hours <= 1)  return '< 1 hour'
  if (hours <= 4)  return `${hours} hours`
  if (hours <= 24) return `${hours} hours (same day)`
  if (hours <= 72) return `${Math.floor(hours/24)} business days`
  return '1 week'
}

export default function TicketDetail() {
  const { id } = useParams()
  const [data,    setData]    = useState(null)
  const [tab,     setTab]     = useState('overview')
  const [filter,  setFilter]  = useState('')
  const [search,  setSearch]  = useState('')
  const [expanded,setExpanded]= useState({})
  const [aiText,  setAiText]  = useState('')
  const [aiLoading,setAiLoad] = useState(false)

  useEffect(() => {
    TicketAPI.get(id)
      .then(r => {
        setData(r.data)
        setAiText(r.data?.session?.ai_insight || '')
      })
      .catch(() => toast.error('Failed to load ticket session'))
  }, [id])

  if (!data) return (
    <div className="p-8 space-y-4">
      {[...Array(4)].map((_,i) => <Skel key={i} className="h-24 rounded-xl" />)}
    </div>
  )

  const { session: s, tickets } = data

  // Filter + search
  let filtered = tickets || []
  if (filter) filtered = filtered.filter(t => t.category === filter)
  if (search)  filtered = filtered.filter(t => t.text?.toLowerCase().includes(search.toLowerCase()))
  // Sort by urgency desc
  filtered = [...filtered].sort((a,b) => (b.urgency_score||0) - (a.urgency_score||0))

  const catData  = Object.entries(s.category_breakdown || {}).map(([name,value]) => ({ name, value }))
  const priData  = Object.entries(s.priority_breakdown || {}).map(([name,value]) => ({ name, value }))
  const sentData = Object.entries(s.sentiment_breakdown|| {}).map(([name,value]) => ({ name, value }))

  const expCsv = async () => {
    try {
      const r = await TicketAPI.export(id)
      const url = URL.createObjectURL(new Blob([r.data]))
      const a = document.createElement('a')
      a.href = url; a.download = `tickets_${id}.csv`; a.click()
    } catch { toast.error('Export failed') }
  }

  const regenInsight = async () => {
    setAiLoad(true)
    try {
      // Call tickets batch again with existing data to regenerate insight
      const r = await axios.post('/api/ai/ticket-insight', {
        session_id: id,
        stats: {
          total: s.total_tickets,
          critical_count: s.critical_count || 0,
          high_count: s.high_count || 0,
          escalate_count: s.escalate_count || 0,
          avg_urgency: s.avg_urgency || 0,
          top_category: s.top_category || '',
          category_breakdown: s.category_breakdown || {},
          needs_attention: (s.critical_count||0) + (s.high_count||0),
          critical_pct: s.total_tickets ? ((s.critical_count||0)/s.total_tickets*100).toFixed(1) : 0,
          escalate_pct: s.total_tickets ? ((s.escalate_count||0)/s.total_tickets*100).toFixed(1) : 0,
        }
      })
      setAiText(r.data.insight)
      toast.success('AI insight generated')
    } catch {
      toast.error('Could not generate insight')
    } finally {
      setAiLoad(false)
    }
  }

  const toggleExpand = (i) => setExpanded(e => ({ ...e, [i]: !e[i] }))

  return (
    <div className="p-6 lg:p-8 space-y-5">

      {/* Header */}
      <div className="flex items-start gap-3 flex-wrap">
        <Link to="/tickets" className="btn-ghost p-2 mt-1"><ArrowLeft size={15}/></Link>
        <div className="flex-1 min-w-0">
          <h1 className="page-title truncate">{s.name}</h1>
          <p className="text-sm text-[var(--text2)] mt-0.5">
            {s.total_tickets} tickets · {new Date(s.created_at).toLocaleDateString()}
          </p>
        </div>
        <button onClick={expCsv} className="btn-secondary text-xs">
          <Download size={13}/>Export CSV
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          [s.total_tickets,                                            'Total Tickets',   'var(--brand)'],
          [s.critical_count || 0,                                      'Critical',        'var(--red)'],
          [s.escalate_count ?? 0,                                      'Escalate',        'var(--amber)'],
          [((s.avg_urgency||0)*100).toFixed(0)+'%',                   'Avg Urgency',     'var(--text)'],
        ].map(([v,l,c]) => (
          <div key={l} className="card p-4 text-center">
            <p className="text-2xl font-display font-bold" style={{color:c}}>{v}</p>
            <p className="text-xs text-[var(--muted)] mt-0.5">{l}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 flex-wrap">
        {[
          ['overview', 'Overview'],
          ['tickets',  `Tickets (${tickets?.length || 0})`],
          ['insights', 'AI Insights'],
        ].map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`tab-btn ${tab===k ? 'tab-active' : ''}`}>
            {label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {tab === 'overview' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

            {/* Category */}
            <div className="card p-5">
              <p className="section-title mb-4">By Category</p>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={catData} cx="50%" cy="50%" innerRadius={40} outerRadius={70}
                    paddingAngle={2} dataKey="value">
                    {catData.map((e,i) => <Cell key={i} fill={CAT_COLORS[e.name] || '#6C63FF'} />)}
                  </Pie>
                  <Tooltip content={<TooltipBox />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {catData.map(c => (
                  <div key={c.name} className="flex items-center gap-2 text-xs">
                    <div className="w-2 h-2 rounded-sm flex-shrink-0"
                      style={{background: CAT_COLORS[c.name]||'#6C63FF'}} />
                    <span className="text-[var(--text2)] flex-1 truncate">{c.name}</span>
                    <span className="text-[var(--text)] font-medium">{c.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Priority */}
            <div className="card p-5">
              <p className="section-title mb-4">By Priority</p>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={priData} barSize={32}>
                  <XAxis dataKey="name" tick={{fill:'var(--muted)',fontSize:10}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fill:'var(--muted)',fontSize:10}} axisLine={false} tickLine={false}/>
                  <Tooltip content={<TooltipBox />} />
                  <Bar dataKey="value" radius={[4,4,0,0]} name="Count">
                    {priData.map((e,i) => <Cell key={i} fill={PRI_COLORS[e.name]||'var(--brand)'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Sentiment */}
            <div className="card p-5">
              <p className="section-title mb-4">By Sentiment</p>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={sentData} barSize={32}>
                  <XAxis dataKey="name" tick={{fill:'var(--muted)',fontSize:10}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fill:'var(--muted)',fontSize:10}} axisLine={false} tickLine={false}/>
                  <Tooltip content={<TooltipBox />} />
                  <Bar dataKey="value" radius={[4,4,0,0]} name="Count">
                    {sentData.map((e,i) => (
                      <Cell key={i}
                        fill={e.name==='positive'?'var(--green)':e.name==='negative'?'var(--red)':'var(--brand)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* SLA Summary */}
          <div className="card p-5">
            <p className="section-title mb-3">SLA Response Time Distribution</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                ['Critical (< 1hr)',  tickets.filter(t=>(t.sla_hours||24)<=1).length,                    'var(--red)'],
                ['Urgent (2–4hrs)',   tickets.filter(t=>(t.sla_hours||24)>1&&(t.sla_hours||24)<=4).length,'var(--amber)'],
                ['Same Day',         tickets.filter(t=>(t.sla_hours||24)>4&&(t.sla_hours||24)<=24).length,'var(--brand)'],
                ['Multi-Day',        tickets.filter(t=>(t.sla_hours||24)>24).length,                      'var(--muted)'],
              ].map(([l,v,c]) => (
                <div key={l} className="card2 p-3 text-center">
                  <p className="text-xl font-display font-bold" style={{color:c}}>{v}</p>
                  <p className="text-xs text-[var(--muted)]">{l}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Top category callout */}
          {s.top_category && (
            <div className="card p-4 flex items-center gap-3">
              <Zap size={16} className="text-[var(--amber)] flex-shrink-0" />
              <p className="text-sm text-[var(--text2)]">
                Most common category: <span className="font-semibold text-[var(--text)]">{s.top_category}</span>
                {' '} — consider creating a self-service FAQ to reduce volume.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── TICKETS LIST ── */}
      {tab === 'tickets' && (
        <div className="space-y-3">

          {/* Filters */}
          <div className="flex gap-2 flex-wrap items-center">
            <select className="input w-48 text-sm"
              value={filter} onChange={e => setFilter(e.target.value)}>
              <option value="">All categories</option>
              {Object.keys(s.category_breakdown||{}).map(c =>
                <option key={c} value={c}>{c}</option>
              )}
            </select>
            <input
              className="input flex-1 min-w-[180px] text-sm"
              placeholder="Search tickets..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <p className="text-xs text-[var(--muted)]">
              {filtered.length} / {tickets.length} tickets
            </p>
          </div>

          {filtered.length === 0 ? (
            <div className="card p-10 text-center">
              <p className="text-sm text-[var(--muted)]">
                {tickets.length === 0
                  ? 'No tickets found in this session. This may be a display issue — try deleting the DB and re-uploading.'
                  : 'No tickets match your filter.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
              {filtered.map((t, i) => (
                <div key={t.ticket_id || i} className="card p-4 space-y-3">

                  {/* Top row */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <PriBadge p={t.priority} />
                    <span className="badge badge-gray text-[11px]">{t.category}</span>
                    <SentBadge s={t.sentiment} />
                    {t.escalate === 1 && (
                      <span className="badge badge-neg text-[11px] flex items-center gap-1">
                        <AlertTriangle size={9} /> ESCALATE
                      </span>
                    )}
                    {t.language && t.language !== 'en' && (
                      <span className="badge badge-blue text-[11px]">{t.language.toUpperCase()}</span>
                    )}
                    <span className="ml-auto flex items-center gap-1 text-[11px] text-[var(--muted)]">
                      <Clock size={10} />
                      {t.sla_label || slaLabel(t.sla_hours)}
                    </span>
                  </div>

                  {/* Text */}
                  <p className="text-sm text-[var(--text)] leading-relaxed">{t.text}</p>

                  {/* Urgency bar */}
                  <UrgencyBar value={t.urgency_score || 0} />

                  {/* Suggested action */}
                  {t.suggested_action && (
                    <div className="p-2.5 bg-[var(--amber)]/5 rounded-lg border border-[var(--amber)]/20">
                      <p className="text-xs text-[var(--text2)]">{t.suggested_action}</p>
                    </div>
                  )}

                  {/* Suggested response — collapsible */}
                  {t.suggested_response && (
                    <div>
                      <button
                        onClick={() => toggleExpand(i)}
                        className="flex items-center gap-1 text-xs text-[var(--brand)] hover:underline">
                        {expanded[i] ? <ChevronDown size={12}/> : <ChevronRight size={12}/>}
                        View suggested response
                      </button>
                      {expanded[i] && (
                        <pre className="mt-2 text-xs text-[var(--text2)] whitespace-pre-wrap font-sans
                          leading-relaxed p-3 bg-[var(--brand)]/5 rounded-lg border border-[var(--brand)]/15">
                          {t.suggested_response}
                        </pre>
                      )}
                    </div>
                  )}

                  {/* Keywords */}
                  {t.keywords?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {t.keywords.slice(0,6).map(k => (
                        <span key={k.word} className="text-[10px] px-1.5 py-0.5 bg-[var(--border)]
                          text-[var(--muted)] rounded font-mono">
                          {k.word}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── AI INSIGHTS ── */}
      {tab === 'insights' && (
        <div className="space-y-5">

          {/* AI Insight Block */}
          <div className="card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{background:'var(--grad)'}}>
                  <Brain size={13} className="text-white" />
                </div>
                <p className="section-title">AI Support Intelligence</p>
              </div>
              <button onClick={regenInsight} disabled={aiLoading}
                className="btn-ghost text-xs flex items-center gap-1">
                <RefreshCw size={12} className={aiLoading ? 'animate-spin' : ''} />
                {aiLoading ? 'Generating...' : 'Regenerate'}
              </button>
            </div>

            {aiText ? (
              <div className="ai-insight-block">
                <p className="text-sm text-[var(--text2)] leading-relaxed">{aiText}</p>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-4 bg-[var(--card2)] rounded-xl border border-[var(--border2)]">
                <Brain size={16} className="text-[var(--muted)] flex-shrink-0" />
                <p className="text-sm text-[var(--muted)]">
                  No AI insight yet. Click <strong className="text-[var(--text)]">Regenerate</strong> to generate one.
                  Make sure <span className="font-mono text-[var(--brand)]">ANTHROPIC_API_KEY</span> is set in backend/.env.
                </p>
              </div>
            )}
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              ['Top Category',    s.top_category || '—',                                        'var(--brand)'],
              ['Escalation Rate', ((s.escalate_count||0)/Math.max(s.total_tickets,1)*100).toFixed(1)+'%', 'var(--red)'],
              ['Critical Rate',   ((s.critical_count||0)/Math.max(s.total_tickets,1)*100).toFixed(1)+'%', 'var(--amber)'],
              ['Avg Urgency',     ((s.avg_urgency||0)*100).toFixed(0)+'%',                      'var(--text)'],
            ].map(([l,v,c]) => (
              <div key={l} className="card p-4 text-center">
                <p className="text-xl font-display font-bold truncate" style={{color:c}}>{v}</p>
                <p className="text-xs text-[var(--muted)] mt-0.5">{l}</p>
              </div>
            ))}
          </div>

          {/* Recommended Actions */}
          <div className="card p-5 space-y-3">
            <p className="section-title">Recommended Actions</p>
            <div className="space-y-2">
              {(s.critical_count||0) > 0 && (
                <div className="flex items-start gap-2.5 p-3 bg-[var(--red)]/5 rounded-lg border border-[var(--red)]/15">
                  <AlertTriangle size={13} className="text-[var(--red)] flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-[var(--text2)]">
                    <strong className="text-[var(--text)]">{s.critical_count} critical ticket{s.critical_count>1?'s':''}</strong> require
                    immediate response — SLA is under 1 hour.
                  </p>
                </div>
              )}
              {Object.entries(s.category_breakdown||{}).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([cat,n]) => (
                <div key={cat} className="flex items-start gap-2.5 p-3 bg-[var(--card2)] rounded-lg border border-[var(--border2)]">
                  <Zap size={13} className="text-[var(--amber)] flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-[var(--text2)]">
                    <strong className="text-[var(--text)]">{n} {cat}</strong> tickets —
                    {cat === 'Billing / Payment' && ' verify payment gateway logs and check for duplicate charges.'}
                    {cat === 'Technical Issue'   && ' check error logs and notify engineering team.'}
                    {cat === 'Delivery / Shipping'&&' contact logistics partner and update tracking info.'}
                    {cat === 'Account / Login'   && ' check auth service status and reset stuck accounts.'}
                    {cat === 'Refund / Return'   && ' process pending refunds and update return policy FAQs.'}
                    {cat === 'Feature Request'   && ' log in product backlog and share with product team.'}
                    {cat === 'Complaint / Abuse' && ' escalate to senior management within 1 hour.'}
                    {cat === 'Spam / Irrelevant' && ' add spam filters to the ticket intake form.'}
                    {!['Billing / Payment','Technical Issue','Delivery / Shipping','Account / Login',
                       'Refund / Return','Feature Request','Complaint / Abuse','Spam / Irrelevant']
                       .includes(cat) && ' review and assign to appropriate team.'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
