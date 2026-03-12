import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { LayoutDashboard, MessageSquare, ThumbsUp, AlertTriangle, Ticket, ShieldAlert, ArrowRight, TrendingUp, Clock } from 'lucide-react'
import { Dashboard as DashAPI } from '../utils/api'
import { StatCard, TooltipBox, Skel } from '../components/UI'
import { useApp } from '../contexts/AppContext'
import { t } from '../i18n'

const COLORS = ['#3EE892','#FF5C7A','#7C6FFF','#FFB23F','#3BA5FF']

export default function Dashboard() {
  const { language } = useApp()
  const [data, setData] = useState(null)

  useEffect(() => {
    DashAPI.stats().then(r => setData(r.data)).catch(() => {})
  }, [])

  if (!data) return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="h-8 skeleton w-48 rounded" />
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {[...Array(6)].map((_,i)=><Skel key={i} className="h-24 rounded-xl"/>)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Skel className="h-64 rounded-xl lg:col-span-2"/>
        <Skel className="h-64 rounded-xl"/>
      </div>
    </div>
  )

  const totRev  = data.total_reviews || 1
  const negPct  = Math.round(data.total_negative / totRev * 100)

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="page-title">{t(language,'nav.dashboard')}</h1>
        <p className="text-sm text-[var(--text2)] mt-1">Platform-wide analytics overview</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {[
          {title:'Sessions',     value:data.total_sessions,    color:'var(--brand)',icon:LayoutDashboard},
          {title:'Reviews',      value:data.total_reviews,     color:'var(--green)',icon:MessageSquare},
          {title:'Positive',     value:`${data.positive_pct}%`,color:'var(--green)',icon:ThumbsUp},
          {title:'Negative',     value:`${negPct}%`,            color:'var(--red)',  icon:AlertTriangle},
          {title:'Tickets',      value:data.total_tickets,     color:'var(--amber)',icon:Ticket},
          {title:'Fake Reviews', value:data.fake_review_count, color:'var(--red)',  icon:ShieldAlert},
        ].map((s,i)=>(
          <motion.div key={s.title} initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:i*.05}}>
            <StatCard {...s}/>
          </motion.div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline */}
        <div className="card p-5 lg:col-span-2">
          <p className="section-title mb-4">Review Volume — Last 14 Days</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data.timeline}>
              <XAxis dataKey="date" tick={{fill:'var(--muted)',fontSize:9}} axisLine={false} tickLine={false} tickFormatter={d=>d.slice(5)}/>
              <YAxis tick={{fill:'var(--muted)',fontSize:9}} axisLine={false} tickLine={false}/>
              <Tooltip content={<TooltipBox/>}/>
              <Line type="monotone" dataKey="positive" stroke="var(--green)" strokeWidth={2} dot={false} name="Positive"/>
              <Line type="monotone" dataKey="negative" stroke="var(--red)"   strokeWidth={2} dot={false} name="Negative"/>
              <Line type="monotone" dataKey="total"    stroke="var(--brand)" strokeWidth={1.5} dot={false} strokeDasharray="4 2" name="Total"/>
            </LineChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-3">
            {[['Positive','var(--green)'],['Negative','var(--red)'],['Total','var(--brand)']].map(([n,c])=>(
              <div key={n} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{background:c}}/>
                <span className="text-xs text-[var(--muted)]">{n}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sentiment donut */}
        <div className="card p-5">
          <p className="section-title mb-3">Sentiment Split</p>
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie data={[
                {name:'Positive',value:data.total_positive},
                {name:'Negative',value:data.total_negative},
                {name:'Neutral', value:Math.max(0,data.total_reviews-data.total_positive-data.total_negative)},
              ]} cx="50%" cy="50%" innerRadius={42} outerRadius={65} paddingAngle={3} dataKey="value">
                {COLORS.map((c,i)=><Cell key={i} fill={c}/>)}
              </Pie>
              <Tooltip content={<TooltipBox/>}/>
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-3">
            {[['Positive',data.total_positive,'var(--green)'],['Negative',data.total_negative,'var(--red)'],['Neutral',Math.max(0,data.total_reviews-data.total_positive-data.total_negative),'var(--brand)']].map(([n,v,c])=>(
              <div key={n} className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{background:c}}/>
                <span className="text-[var(--text2)] flex-1">{n}</span>
                <span className="font-medium text-[var(--text)]">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent sessions */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="section-title">Recent Sessions</p>
            <Link to="/history" className="btn-ghost text-xs"><ArrowRight size={12}/>View all</Link>
          </div>
          <div className="space-y-2">
            {data.recent_sessions?.length > 0 ? data.recent_sessions.map(s=>{
              const total = s.total_reviews||1
              const pos   = Math.round(s.positive_count/total*100)
              const neg   = Math.round(s.negative_count/total*100)
              return (
                <Link key={s.session_id} to={`/history/${s.session_id}`}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--border)] transition-all group">
                  <div className="w-8 h-8 rounded-lg bg-[var(--brand)]/10 flex items-center justify-center flex-shrink-0">
                    <MessageSquare size={13} className="text-[var(--brand)]"/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text)] truncate">{s.name||s.session_id}</p>
                    <p className="text-xs text-[var(--muted)]">{s.total_reviews} reviews · {pos}% positive</p>
                  </div>
                  <div className="flex h-1.5 w-16 rounded-full overflow-hidden bg-[var(--border)] flex-shrink-0">
                    <div style={{width:`${pos}%`,background:'var(--green)'}}/>
                    <div style={{width:`${neg}%`,background:'var(--red)'}}/>
                  </div>
                </Link>
              )
            }) : (
              <div className="text-center py-8">
                <Clock size={24} className="text-[var(--dim)] mx-auto mb-2"/>
                <p className="text-sm text-[var(--muted)]">No sessions yet — start analyzing!</p>
              </div>
            )}
          </div>
        </div>

        {/* Top topics + language dist */}
        <div className="space-y-4">
          <div className="card p-5">
            <p className="section-title mb-3">Top Topics</p>
            <div className="space-y-2.5">
              {Object.entries(data.top_topics||{}).slice(0,6).map(([topic,count])=>{
                const max = Object.values(data.top_topics)[0]||1
                return (
                  <div key={topic} className="flex items-center gap-3">
                    <span className="text-xs text-[var(--text2)] w-32 truncate">{topic}</span>
                    <div className="flex-1 h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-[var(--brand)] to-[var(--green)]"
                        style={{width:`${Math.round(count/max*100)}%`}}/>
                    </div>
                    <span className="text-xs text-[var(--text)] w-5 text-right font-medium">{count}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {data.language_distribution?.length > 1 && (
            <div className="card p-5">
              <p className="section-title mb-3">Language Distribution</p>
              <div className="flex flex-wrap gap-2">
                {data.language_distribution.slice(0,8).map(l=>(
                  <div key={l.lang} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--border)]">
                    <span className="text-xs font-mono text-[var(--brand)]">{l.lang}</span>
                    <span className="text-xs text-[var(--muted)]">{l.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
