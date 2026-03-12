import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LineChart, Line } from 'recharts'
import { TrendingUp, Brain } from 'lucide-react'
import { Trends as TrendsAPI, Dashboard as DashAPI } from '../utils/api'
import { PageHeader, Skel, TooltipBox } from '../components/UI'

const COLORS = ['#38BDF8','#34D399','#FBBF24','#F87171','#A78BFA','#60A5FA','#FB923C','#4ADE80','#F472B6','#94A3B8']

export default function Trends() {
  const [data,    setData]    = useState(null)
  const [dash,    setDash]    = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      TrendsAPI.keywords(),
      DashAPI.stats().catch(() => ({ data: {} })),
    ]).then(([tr, dr]) => {
      setData(tr.data)
      setDash(dr.data)
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="p-6 lg:p-8 space-y-5">
      <Skel className="h-9 w-64 rounded-lg" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <Skel key={i} className="h-20 rounded-xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Skel className="h-80 rounded-xl lg:col-span-2" />
        <Skel className="h-80 rounded-xl" />
      </div>
    </div>
  )

  const kws      = data?.keywords || []
  const top20    = kws.slice(0, 20)
  const max      = top20[0]?.count || 1
  const timeline = dash?.timeline || []

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <PageHeader
        title="Keyword Trends"
        subtitle={`${data?.total_reviews || 0} reviews analyzed across ${data?.total_sessions || 0} sessions`}
      />

      {kws.length === 0 ? (
        <div className="card p-12 text-center">
          <TrendingUp size={32} className="text-[var(--dim)] mx-auto mb-3" />
          <p className="font-semibold text-[var(--text)]">No trend data available yet</p>
          <p className="text-sm text-[var(--muted)] mt-1">Analyze some reviews to populate keyword trends</p>
        </div>
      ) : (
        <>
          {/* AI Trends Intelligence */}
          {data?.ai_trends && (
            <div className="card p-5 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'var(--grad-brand)' }}>
                  <Brain size={13} className="text-white" />
                </div>
                <p className="section-title">Trends Intelligence Report</p>
              </div>
              <div className="bg-[var(--card2)] border border-[var(--border2)] rounded-xl p-4">
                <p className="text-sm text-[var(--text2)] leading-relaxed whitespace-pre-line">{data.ai_trends}</p>
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              ['Unique Keywords', kws.length,                'var(--brand)'],
              ['Top Keyword',     kws[0]?.word || '—',       'var(--text)'],
              ['Top Frequency',   kws[0]?.count || 0,        'var(--green)'],
              ['Total Sessions',  data?.total_sessions || 0, 'var(--amber)'],
            ].map(([l, v, c]) => (
              <div key={l} className="card p-4 text-center">
                <p className="text-xl font-display font-bold truncate" style={{ color: c }}>{v}</p>
                <p className="text-xs text-[var(--muted)] mt-0.5">{l}</p>
              </div>
            ))}
          </div>

          {/* Volume timeline + keyword breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Horizontal bar — top 20 */}
            <div className="card p-5 lg:col-span-2">
              <p className="section-title mb-4">Top 20 Keywords by Frequency</p>
              <ResponsiveContainer width="100%" height={380}>
                <BarChart data={top20} layout="vertical" barSize={13}>
                  <XAxis type="number" tick={{ fill:'var(--muted)', fontSize:10 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="word" tick={{ fill:'var(--text2)', fontSize:11 }}
                    axisLine={false} tickLine={false} width={105} />
                  <Tooltip content={<TooltipBox />} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} name="Frequency">
                    {top20.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Right column: top 8 + legend */}
            <div className="card p-5">
              <p className="section-title mb-4">Top 8 Breakdown</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={kws.slice(0, 8)} barSize={22}>
                  <XAxis dataKey="word" tick={{ fill:'var(--muted)', fontSize:9 }}
                    axisLine={false} tickLine={false} interval={0} angle={-28} textAnchor="end" height={44} />
                  <YAxis tick={{ fill:'var(--muted)', fontSize:10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<TooltipBox />} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Count">
                    {kws.slice(0, 8).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              <div className="space-y-2.5 mt-4">
                {kws.slice(0, 8).map((k, i) => (
                  <div key={k.word} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="text-xs text-[var(--text2)] font-medium flex-1 truncate">{k.word}</span>
                    <span className="text-[10px] text-[var(--muted)] font-mono">{k.count}</span>
                    <div className="w-14 h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
                      <div className="h-full rounded-full"
                        style={{ width:`${Math.round(k.count/max*100)}%`, background:COLORS[i % COLORS.length] }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Review volume timeline */}
          {timeline.some(t => t.total > 0) && (
            <div className="card p-5">
              <p className="section-title mb-4">Review Volume — Last 14 Days</p>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={timeline}>
                  <XAxis dataKey="date" tick={{ fill:'var(--muted)', fontSize:9 }}
                    axisLine={false} tickLine={false}
                    tickFormatter={d => d.slice(5)} />
                  <YAxis tick={{ fill:'var(--muted)', fontSize:9 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<TooltipBox />} />
                  <Line type="monotone" dataKey="positive" stroke="var(--green)"  strokeWidth={2} dot={false} name="Positive" />
                  <Line type="monotone" dataKey="negative" stroke="var(--red)"    strokeWidth={2} dot={false} name="Negative" />
                  <Line type="monotone" dataKey="total"    stroke="var(--brand)"  strokeWidth={1.5} dot={false} strokeDasharray="4 2" name="Total" />
                </LineChart>
              </ResponsiveContainer>
              <div className="flex gap-5 mt-3 justify-center">
                {[['Positive','var(--green)'],['Negative','var(--red)'],['Total','var(--brand)']].map(([n, c]) => (
                  <div key={n} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
                    <span className="text-xs text-[var(--muted)]">{n}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Keyword cloud */}
          <div className="card p-5">
            <p className="section-title mb-4">Keyword Cloud</p>
            <div className="flex flex-wrap gap-x-3 gap-y-2 justify-center py-3">
              {kws.map((k, i) => {
                const size    = 11 + Math.round((k.count / max) * 18)
                const opacity = 0.45 + (k.count / max) * 0.55
                return (
                  <span key={k.word}
                    style={{ fontSize:size, opacity, color:COLORS[i % COLORS.length] }}
                    className="font-display font-bold cursor-default hover:opacity-100 transition-opacity select-none">
                    {k.word}
                  </span>
                )
              })}
            </div>
          </div>

          {/* Full keyword table */}
          <div className="card p-5">
            <p className="section-title mb-3">All Keywords <span className="text-[var(--muted)] font-normal text-xs">({kws.length} total)</span></p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
              {kws.map((k, i) => (
                <div key={k.word} className="card2 p-2.5 flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-[var(--text)] truncate">{k.word}</span>
                  <span className="text-[10px] font-mono text-[var(--muted)] flex-shrink-0 px-1.5 py-0.5 bg-[var(--border)] rounded">
                    {k.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
