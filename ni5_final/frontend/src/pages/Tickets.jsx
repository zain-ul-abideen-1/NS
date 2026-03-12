import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { Loader2, Upload, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react'
import toast from 'react-hot-toast'
import { Tickets as TicketAPI } from '../utils/api'
import { PriBadge, SentBadge, PageHeader, UrgencyBar } from '../components/UI'

const CAT_GUIDE = [
  { cat:'Technical Issue',     color:'#6C63FF', desc:'Bugs, crashes, login errors, performance issues' },
  { cat:'Billing / Payment',   color:'#FBBF24', desc:'Overcharges, payment failures, invoice disputes' },
  { cat:'Refund / Return',     color:'#F87171', desc:'Return requests, refunds, damaged or wrong items' },
  { cat:'Delivery / Shipping', color:'#34D399', desc:'Late delivery, missing packages, tracking issues' },
  { cat:'Account / Login',     color:'#A78BFA', desc:'Password reset, locked accounts, 2FA issues' },
  { cat:'Feature Request',     color:'#6EE7B7', desc:'Product suggestions, improvement ideas' },
  { cat:'Complaint / Abuse',   color:'#F87171', desc:'Policy violations, staff conduct, escalations' },
  { cat:'Spam / Irrelevant',   color:'#94A3B8', desc:'Spam, test submissions, wrong department' },
]

export default function Tickets() {
  const navigate   = useNavigate()
  const [tab,      setTab]    = useState('single')
  const [text,     setText]   = useState('')
  const [name,     setName]   = useState('')
  const [texts,    setTexts]  = useState('')
  const [file,     setFile]   = useState(null)
  const [cols,     setCols]   = useState(null)
  const [textCol,  setTextCol]= useState('')
  const [loading,  setLoad]   = useState(false)
  const [single,   setSingle] = useState(null)
  const [showResp, setShowResp] = useState(false)

  // Detect columns when file is dropped
  const onDrop = useCallback(async (accepted) => {
    const f = accepted[0]; if (!f) return
    setFile(f); setCols(null); setTextCol('')
    // Read columns
    const form = new FormData(); form.append('file', f)
    try {
      const r = await (await import('../utils/api')).Analyze.columns(form)
      setCols(r.data)
      setTextCol(r.data.suggested_text_col || '')
    } catch { /* column detection optional */ }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/*': ['.csv', '.txt'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/json': ['.json'],
    }
  })

  const run = async () => {
    setLoad(true); setSingle(null)
    try {
      if (tab === 'single') {
        if (!text.trim()) { toast.error('Enter ticket text'); return }
        const r = await TicketAPI.analyze(text.trim(), name)
        setSingle(r.data.ticket)
      } else if (tab === 'batch') {
        const lines = texts.split('\n').map(l => l.trim()).filter(Boolean)
        if (!lines.length) { toast.error('Enter at least one ticket'); return }
        const r = await TicketAPI.batch(lines, name)
        toast.success(`${r.data.results.length} tickets classified`)
        navigate(`/tickets/${r.data.session_id}`)
      } else {
        if (!file) { toast.error('Select a file to upload'); return }
        const form = new FormData()
        form.append('file', file)
        if (textCol) form.append('text_col', textCol)
        if (name)    form.append('session_name', name)
        const r = await TicketAPI.upload(form)
        toast.success(`${r.data.count} tickets classified`)
        navigate(`/tickets/${r.data.session_id}`)
      }
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Classification failed')
    } finally { setLoad(false) }
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <PageHeader
        title="Support Ticket Intelligence"
        subtitle="Classify, prioritize, and generate responses for customer support tickets at scale"
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left — input area */}
        <div className="xl:col-span-2 space-y-4">
          {/* Mode tabs */}
          <div className="flex gap-1 p-1 bg-[var(--card)] rounded-xl border border-[var(--border)]">
            {[
              { k:'single',  l:'Single Ticket'   },
              { k:'batch',   l:'Batch Input'      },
              { k:'upload',  l:'CSV / File Upload'},
            ].map(t => (
              <button key={t.k} onClick={() => { setTab(t.k); setSingle(null) }}
                className={`tab-btn flex-1 text-sm ${tab === t.k ? 'tab-active' : ''}`}>{t.l}</button>
            ))}
          </div>

          <div className="card p-5 space-y-4">
            <div>
              <label className="label">Session Name</label>
              <input className="input" placeholder="e.g. December 2024 Support Tickets"
                value={name} onChange={e => setName(e.target.value)} />
            </div>

            {/* Single */}
            {tab === 'single' && (
              <div className="space-y-3">
                <div>
                  <label className="label">Ticket Text</label>
                  <textarea className="input min-h-32 resize-y"
                    placeholder="Paste the full support ticket message here..."
                    value={text} onChange={e => setText(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <p className="label">Quick Examples</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      'I was charged twice for my order and need an immediate refund.',
                      'The app keeps crashing every time I try to upload a file.',
                      'My package was supposed to arrive 2 weeks ago. Still nothing.',
                      'I cannot log in — my account appears to be locked.',
                      'Please add dark mode to the dashboard. It would help a lot.',
                    ].map(ex => (
                      <button key={ex} onClick={() => setText(ex)}
                        className="text-xs px-2.5 py-1 bg-[var(--border)] text-[var(--muted)] rounded-lg hover:text-[var(--text)] hover:bg-[var(--border2)] transition-all text-left">
                        {ex.slice(0, 38)}...
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Batch */}
            {tab === 'batch' && (
              <div>
                <label className="label">Tickets — one per line</label>
                <textarea className="input min-h-44 resize-y font-mono text-xs leading-relaxed"
                  placeholder={"My payment was declined but money was deducted from my account\nThe app crashes on Android 13 when opening attachments\nI need to return a damaged item received last week\nWhen will dark mode be available on mobile?"}
                  value={texts} onChange={e => setTexts(e.target.value)} />
                <p className="text-xs text-[var(--muted)] mt-1.5">
                  {texts.split('\n').filter(l => l.trim()).length} ticket(s) entered
                </p>
              </div>
            )}

            {/* Upload */}
            {tab === 'upload' && (
              <div className="space-y-4">
                <div {...getRootProps()} className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  isDragActive
                    ? 'border-[var(--brand)] bg-[var(--brand)]/5'
                    : 'border-[var(--border)] hover:border-[var(--brand)]/40 hover:bg-[var(--brand)]/3'
                }`}>
                  <input {...getInputProps()} />
                  <Upload size={22} className="text-[var(--muted)] mx-auto mb-2" />
                  {file
                    ? <p className="text-sm font-medium text-[var(--brand)]">{file.name}</p>
                    : <>
                        <p className="text-sm font-medium text-[var(--text)]">Drop your ticket file here</p>
                        <p className="text-xs text-[var(--muted)] mt-1">Supports CSV, Excel (.xlsx), JSON, TXT — up to 500 rows</p>
                      </>
                  }
                </div>

                {/* Column picker — always shown when file is loaded */}
                {file && (
                  <div>
                    <label className="label">
                      {cols ? `Text column — ${cols.rows} rows detected` : 'Text column name (leave blank for auto-detect)'}
                    </label>
                    {cols?.columns ? (
                      <div className="flex flex-wrap gap-2">
                        {cols.columns.map(c => (
                          <button key={c} onClick={() => setTextCol(c)}
                            className={`px-3 py-1 rounded-lg text-xs font-mono border transition-all ${
                              textCol === c
                                ? 'border-[var(--brand)] bg-[var(--brand)]/10 text-[var(--brand)]'
                                : 'border-[var(--border)] text-[var(--muted)] hover:border-[var(--brand)]/40'
                            }`}>{c}</button>
                        ))}
                      </div>
                    ) : (
                      <input className="input font-mono text-sm"
                        placeholder="e.g. ticket_text, message, body"
                        value={textCol} onChange={e => setTextCol(e.target.value)} />
                    )}
                    <p className="text-xs text-[var(--muted)] mt-1.5">
                      Select the column containing the ticket text. If left blank, the system will auto-detect.
                    </p>
                  </div>
                )}
              </div>
            )}

            <button onClick={run} disabled={loading} className="btn-primary w-full justify-center py-2.5 text-sm disabled:opacity-40">
              {loading
                ? <><Loader2 size={15} className="animate-spin" />Classifying tickets...</>
                : 'Classify Tickets'
              }
            </button>
          </div>

          {/* Single result */}
          {single && <SingleResult ticket={single} />}
        </div>

        {/* Right — guide + history */}
        <div className="space-y-4">
          <CategoryGuide />
          <TicketHistory />
        </div>
      </div>
    </div>
  )
}

function SingleResult({ ticket: t }) {
  const [showResp, setShowResp] = useState(false)

  const priColors = { critical:'var(--red)', high:'var(--amber)', medium:'var(--brand)', low:'var(--green)' }

  return (
    <div className="card p-5 space-y-5">
      {/* Header */}
      <div className="flex items-start gap-3 flex-wrap">
        <div>
          <h3 className="font-display font-bold text-base text-[var(--text)]">{t.category}</h3>
          {t.subcategory && <p className="text-xs text-[var(--muted)] mt-0.5">{t.subcategory}</p>}
        </div>
        <div className="flex items-center gap-2 flex-wrap ml-auto">
          <PriBadge p={t.priority} />
          <SentBadge s={t.sentiment} />
          {t.escalate === 1 && (
            <span className="badge pri-critical font-semibold">Escalate Immediately</span>
          )}
        </div>
      </div>

      <div className="divider" />

      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card2 p-3">
          <p className="label">Urgency</p>
          <UrgencyBar value={t.urgency_score || 0} />
        </div>
        <div className="card2 p-3">
          <p className="label">SLA Target</p>
          <p className="text-sm font-semibold text-[var(--text)]">{t.sla_label}</p>
        </div>
        <div className="card2 p-3">
          <p className="label">Sentiment Score</p>
          <p className="text-sm font-mono" style={{ color: t.score >= 0 ? 'var(--green)' : 'var(--red)' }}>
            {t.score >= 0 ? '+' : ''}{t.score?.toFixed(4)}
          </p>
        </div>
        <div className="card2 p-3">
          <p className="label">Language</p>
          <p className="text-sm font-medium text-[var(--text)]">{t.language?.toUpperCase() || 'EN'}</p>
        </div>
      </div>

      {/* Recommended action */}
      <div>
        <p className="label">Recommended Action</p>
        <div className="p-3 bg-[var(--amber)]/8 border border-[var(--amber)]/20 rounded-xl">
          <p className="text-sm text-[var(--text)] leading-relaxed">{t.suggested_action}</p>
        </div>
      </div>

      {/* Extracted entities */}
      {t.entities?.length > 0 && (
        <div>
          <p className="label">Extracted Entities</p>
          <div className="flex flex-wrap gap-2">
            {t.entities.flatMap(e => e.values.map(v => (
              <span key={v} className="badge badge-blue font-mono">{e.type}: {v}</span>
            )))}
          </div>
        </div>
      )}

      {/* Keywords */}
      {t.keywords?.length > 0 && (
        <div>
          <p className="label">Keywords</p>
          <div className="flex flex-wrap gap-1.5">
            {t.keywords.slice(0, 10).map(k => (
              <span key={k.word} className="text-xs px-2 py-0.5 rounded-lg bg-[var(--border)] text-[var(--text2)] font-mono">{k.word}</span>
            ))}
          </div>
        </div>
      )}

      {/* Suggested response — collapsible */}
      {t.suggested_response && (
        <div>
          <button
            onClick={() => setShowResp(s => !s)}
            className="flex items-center gap-2 text-sm font-medium text-[var(--brand)] hover:text-[var(--brand2)] transition-colors">
            {showResp ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {showResp ? 'Hide suggested response' : 'View suggested customer response'}
          </button>
          {showResp && (
            <pre className="mt-3 text-xs text-[var(--text2)] whitespace-pre-wrap font-sans leading-relaxed p-4 bg-[var(--brand)]/5 rounded-xl border border-[var(--brand)]/15">
              {t.suggested_response}
            </pre>
          )}
        </div>
      )}

      {/* Hash */}
      <div className="pt-2 border-t border-[var(--border)]">
        <p className="label">Integrity Hash</p>
        <p className="text-[10px] font-mono text-[var(--dim)] break-all">{t.hash_value}</p>
      </div>
    </div>
  )
}

function CategoryGuide() {
  return (
    <div className="card p-4">
      <p className="section-title mb-3">Category Reference</p>
      <div className="space-y-2">
        {CAT_GUIDE.map(c => (
          <div key={c.cat} className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-[var(--border)] transition-all">
            <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ background: c.color }} />
            <div>
              <p className="text-xs font-semibold text-[var(--text)]">{c.cat}</p>
              <p className="text-[10px] text-[var(--muted)] leading-relaxed">{c.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function TicketHistory() {
  const [sessions, setSessions] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    TicketAPI.sessions().then(r => setSessions(r.data.sessions || [])).catch(() => {})
  }, [])

  if (!sessions.length) return null

  return (
    <div className="card p-4">
      <p className="section-title mb-3">Recent Sessions</p>
      <div className="space-y-1.5">
        {sessions.slice(0, 6).map(s => (
          <button key={s.session_id} onClick={() => navigate(`/tickets/${s.session_id}`)}
            className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-[var(--border)] transition-all text-left">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-[var(--text)] truncate">{s.name}</p>
              <p className="text-[10px] text-[var(--muted)]">
                {s.total_tickets} tickets
                {s.critical_count > 0 && <span className="text-[var(--red)] ml-1">· {s.critical_count} critical</span>}
              </p>
            </div>
            <ArrowRight size={12} className="text-[var(--muted)] flex-shrink-0" />
          </button>
        ))}
      </div>
    </div>
  )
}
