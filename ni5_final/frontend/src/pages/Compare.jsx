import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts'
import { GitCompare, Trophy, TrendingDown, TrendingUp, Minus, Brain } from 'lucide-react'
import toast from 'react-hot-toast'
import { Sessions, Compare as CompareAPI } from '../utils/api'
import { PageHeader, TooltipBox, Skel, ScoreBar } from '../components/UI'

const COLORS = ['#38BDF8','#34D399','#FBBF24','#F87171','#A78BFA']

export default function Compare() {
  const [sessions, setSessions] = useState([])
  const [selected, setSelected] = useState([])
  const [result,   setResult]   = useState(null)
  const [loading,  setLoad]     = useState(false)
  const [sesLoad,  setSesLoad]  = useState(true)

  useEffect(() => {
    Sessions.list({ limit: 50 })
      .then(r => setSessions(r.data.sessions || []))
      .catch(() => toast.error('Could not load sessions'))
      .finally(() => setSesLoad(false))
  }, [])

  const toggle = id => {
    if (selected.includes(id)) setSelected(s => s.filter(x => x !== id))
    else if (selected.length < 5) setSelected(s => [...s, id])
    else toast.error('Maximum 5 sessions')
  }

  const run = async () => {
    if (selected.length < 2) { toast.error('Select at least 2 sessions'); return }
    setLoad(true)
    try {
      const r = await CompareAPI.run(selected)
      setResult(r.data)
    } catch { toast.error('Comparison failed') }
    finally { setLoad(false) }
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <PageHeader
        title="Session Comparison"
        subtitle="Side-by-side intelligence analysis — compare up to 5 review sessions"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Selector */}
        <div className="card p-4 space-y-3">
          <p className="section-title">
            Select Sessions{' '}
            <span className="text-[var(--muted)] font-normal text-xs">({selected.length}/5)</span>
          </p>

          {sesLoad ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => <Skel key={i} className="h-12 rounded-xl" />)}
            </div>
          ) : sessions.length === 0 ? (
            <p className="text-sm text-[var(--muted)] py-4 text-center">
              No sessions yet. Run some analyses first.
            </p>
          ) : (
            <div className="space-y-1.5 max-h-[460px] overflow-y-auto pr-0.5">
              {sessions.map((s, i) => {
                const isSelected = selected.includes(s.session_id)
                const idx = selected.indexOf(s.session_id)
                return (
                  <label key={s.session_id}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all select-none ${
                      isSelected
                        ? 'bg-[var(--brand)]/8 border border-[var(--brand)]/25'
                        : 'hover:bg-[var(--border)] border border-transparent'
                    }`}>
                    <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 text-xs font-bold transition-all ${
                      isSelected ? 'text-white' : 'border border-[var(--border2)]'
                    }`} style={isSelected ? { background: COLORS[idx] } : {}}>
                      {isSelected ? idx + 1 : ''}
                    </div>
                    <input type="checkbox" className="hidden" checked={isSelected} onChange={() => toggle(s.session_id)} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-[var(--text)] truncate">{s.name || s.session_id}</p>
                      <p className="text-[10px] text-[var(--muted)] mt-0.5">
                        {s.total_reviews} reviews · {s.source_type}
                      </p>
                    </div>
                    <div className="text-xs font-mono text-[var(--text2)] flex-shrink-0">
                      {s.avg_score >= 0 ? '+' : ''}{s.avg_score?.toFixed(2)}
                    </div>
                  </label>
                )
              })}
            </div>
          )}

          <button onClick={run} disabled={loading || selected.length < 2}
            className="btn-primary w-full justify-center disabled:opacity-40">
            {loading
              ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Analyzing...</>
              : <><GitCompare size={14} />Compare Sessions</>
            }
          </button>
        </div>

        {/* Results */}
        <div className="lg:col-span-2 space-y-5">
          {!result ? (
            <div className="card p-12 text-center">
              <GitCompare size={36} className="text-[var(--dim)] mx-auto mb-4" />
              <p className="font-display font-semibold text-[var(--text)]">Select sessions to compare</p>
              <p className="text-sm text-[var(--muted)] mt-1">Choose 2–5 sessions, then click Compare Sessions</p>
            </div>
          ) : (
            <>
              {/* Winner */}
              <div className="card p-4 flex items-center gap-3"
                style={{ borderColor:'var(--green)', background:'rgba(52,211,153,.04)' }}>
                <Trophy size={18} className="text-[var(--green)] flex-shrink-0" />
                <div>
                  <p className="text-xs text-[var(--muted)] uppercase tracking-wide font-medium">Best Performing Session</p>
                  <p className="text-sm font-bold text-[var(--green)] mt-0.5">{result.winner}</p>
                </div>
              </div>

              {/* Score cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {result.comparison.map((c, i) => {
                  const tcolor = c.avg_score > 0.2 ? 'var(--green)' : c.avg_score < -0.2 ? 'var(--red)' : 'var(--muted)'
                  const TrendIcon = c.avg_score > 0.2 ? TrendingUp : c.avg_score < -0.2 ? TrendingDown : Minus
                  return (
                    <div key={c.session_id}
                      className={`card2 p-4 space-y-3 ${c.winner ? 'ring-1 ring-[var(--green)]/40' : ''}`}>
                      <div className="flex items-start gap-2">
                        <div className="w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0" style={{ background: COLORS[i] }} />
                        <p className="text-xs font-semibold text-[var(--text)] leading-snug flex-1">
                          {c.name?.slice(0, 26)}{c.name?.length > 26 ? '...' : ''}
                        </p>
                        {c.winner && <span className="badge badge-pos text-[10px]">Top</span>}
                      </div>

                      <div className="grid grid-cols-3 gap-1 text-center">
                        <div>
                          <p className="text-sm font-bold" style={{ color:'var(--green)' }}>{c.positive_pct}%</p>
                          <p className="text-[10px] text-[var(--muted)]">Positive</p>
                        </div>
                        <div>
                          <p className="text-sm font-bold" style={{ color:'var(--red)' }}>{c.negative_pct}%</p>
                          <p className="text-[10px] text-[var(--muted)]">Negative</p>
                        </div>
                        <div className="flex flex-col items-center">
                          <TrendIcon size={13} style={{ color: tcolor }} />
                          <p className="text-sm font-bold font-mono" style={{ color: tcolor }}>
                            {c.avg_score?.toFixed(3)}
                          </p>
                          <p className="text-[10px] text-[var(--muted)]">Score</p>
                        </div>
                      </div>

                      <div className="flex h-2 rounded-full overflow-hidden bg-[var(--border)]">
                        <div style={{ width:`${c.positive_pct}%`, background:'var(--green)' }} />
                        <div style={{ width:`${c.negative_pct}%`, background:'var(--red)' }} />
                      </div>

                      <div className="flex justify-between text-[10px] text-[var(--muted)]">
                        <span>{c.total_reviews} reviews</span>
                        <span>{c.fake_count || 0} flagged</span>
                        <span>auth {Math.round((c.avg_authenticity || 1) * 100)}%</span>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="card p-5">
                  <p className="section-title mb-4">Sentiment Breakdown</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={result.comparison.map((c, i) => ({
                      name:     c.name?.split(' ').slice(0, 2).join(' '),
                      Positive: c.positive_pct,
                      Negative: c.negative_pct,
                      Neutral:  c.neutral_pct,
                    }))}>
                      <XAxis dataKey="name" tick={{ fill:'var(--muted)', fontSize:10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill:'var(--muted)', fontSize:10 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<TooltipBox />} />
                      <Bar dataKey="Positive" fill="var(--green)" radius={[3,3,0,0]} />
                      <Bar dataKey="Negative" fill="var(--red)"   radius={[3,3,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="card p-5">
                  <p className="section-title mb-4">Average Sentiment Score</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={result.comparison.map((c, i) => ({
                      name: c.name?.split(' ').slice(0, 2).join(' '),
                      Score: c.avg_score,
                    }))}>
                      <XAxis dataKey="name" tick={{ fill:'var(--muted)', fontSize:10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill:'var(--muted)', fontSize:10 }} axisLine={false} tickLine={false} domain={[-1, 1]} />
                      <Tooltip content={<TooltipBox />} />
                      <Bar dataKey="Score" radius={[4,4,0,0]}>
                        {result.comparison.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Authenticity + fake reviews */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="card p-5">
                  <p className="section-title mb-4">Review Authenticity</p>
                  <div className="space-y-3">
                    {result.comparison.map((c, i) => (
                      <div key={c.session_id} className="space-y-1">
                        <div className="flex items-center gap-2 text-xs">
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLORS[i] }} />
                          <span className="text-[var(--text)] truncate flex-1">{c.name?.slice(0, 22)}</span>
                          <span className="text-[var(--muted)]">{Math.round((c.avg_authenticity || 1) * 100)}%</span>
                        </div>
                        <div className="h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
                          <div className="h-full rounded-full"
                            style={{ width:`${Math.round((c.avg_authenticity||1)*100)}%`, background:COLORS[i] }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card p-5">
                  <p className="section-title mb-4">Fake Review Detection</p>
                  <div className="space-y-3">
                    {result.comparison.map((c, i) => {
                      const pct = c.total_reviews > 0
                        ? Math.round((c.fake_count || 0) / c.total_reviews * 100) : 0
                      return (
                        <div key={c.session_id} className="space-y-1">
                          <div className="flex items-center gap-2 text-xs">
                            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLORS[i] }} />
                            <span className="text-[var(--text)] truncate flex-1">{c.name?.slice(0, 22)}</span>
                            <span style={{ color: pct > 15 ? 'var(--red)' : pct > 5 ? 'var(--amber)' : 'var(--green)' }}>
                              {pct}% flagged
                            </span>
                          </div>
                          <div className="h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
                            <div className="h-full rounded-full"
                              style={{
                                width:`${pct}%`,
                                background: pct > 15 ? 'var(--red)' : pct > 5 ? 'var(--amber)' : 'var(--green)',
                              }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* AI Deep Comparison Analysis */}
              {result.ai_analysis && (
                <div className="card p-5 space-y-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: 'var(--grad-brand)' }}>
                      <Brain size={13} className="text-white" />
                    </div>
                    <p className="section-title">Deep Comparison Analysis</p>
                  </div>
                  <div className="bg-[var(--card2)] border border-[var(--border2)] rounded-xl p-4">
                    <p className="text-sm text-[var(--text2)] leading-relaxed whitespace-pre-line">
                      {result.ai_analysis}
                    </p>
                  </div>

                  {/* Ranked table */}
                  <div>
                    <p className="label mb-2">Session Rankings</p>
                    <div className="space-y-1.5">
                      {[...result.comparison]
                        .sort((a, b) => b.avg_score - a.avg_score)
                        .map((c, i) => (
                          <div key={c.session_id}
                            className="flex items-center gap-3 p-2.5 rounded-xl bg-[var(--card2)] border border-[var(--border2)]">
                            <span className="text-xs font-bold font-mono w-5 text-center"
                              style={{ color: i === 0 ? 'var(--green)' : 'var(--muted)' }}>
                              #{i + 1}
                            </span>
                            <span className="text-xs font-medium text-[var(--text)] flex-1 truncate">{c.name}</span>
                            <span className="text-xs font-mono"
                              style={{ color: c.avg_score >= 0 ? 'var(--green)' : 'var(--red)' }}>
                              {c.avg_score >= 0 ? '+' : ''}{c.avg_score?.toFixed(3)}
                            </span>
                            <span className="text-[10px] text-[var(--muted)]">{c.positive_pct}% pos</span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
