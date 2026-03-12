import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Clock, Trash2, Download, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import { Sessions, Export } from '../utils/api'
import { SentBadge, PageHeader, Skel } from '../components/UI'
import { useApp } from '../contexts/AppContext'

export default function History() {
  const { language } = useApp()
  const [sessions, setSessions] = useState([])
  const [search,   setSearch]   = useState('')
  const [filter,   setFilter]   = useState('')
  const [loading,  setLoading]  = useState(true)

  const load = () => {
    setLoading(true)
    Sessions.list({ search:search||undefined, source_type:filter||undefined })
      .then(r=>setSessions(r.data.sessions))
      .catch(()=>toast.error('Failed to load sessions'))
      .finally(()=>setLoading(false))
  }

  useEffect(()=>{ load() }, [search, filter])

  const del = async (id, e) => {
    e.preventDefault(); e.stopPropagation()
    if (!confirm('Delete this session?')) return
    await Sessions.delete(id).catch(()=>toast.error('Delete failed'))
    toast.success('Deleted'); load()
  }

  const exp = async (id, e) => {
    e.preventDefault(); e.stopPropagation()
    try {
      const r = await Export.csv(id)
      const url = URL.createObjectURL(new Blob([r.data]))
      const a = document.createElement('a'); a.href=url; a.download=`session_${id}.csv`; a.click()
      URL.revokeObjectURL(url)
    } catch { toast.error('Export failed') }
  }

  const typeColors = {url:'var(--brand)',dataset:'var(--green)',batch:'var(--amber)'}

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <PageHeader title="Analysis History" subtitle="All sessions with search, filter, and export"/>
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"/>
          <input className="input pl-9" placeholder="Search sessions…" value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        <select className="input w-40" value={filter} onChange={e=>setFilter(e.target.value)}>
          <option value="">All types</option>
          <option value="url">URL Scrape</option>
          <option value="dataset">Dataset</option>
          <option value="batch">Batch</option>
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(6)].map((_,i)=><Skel key={i} className="h-20 rounded-xl"/>)}</div>
      ) : sessions.length===0 ? (
        <div className="card p-12 text-center">
          <Clock size={32} className="text-[var(--dim)] mx-auto mb-3"/>
          <p className="font-medium text-[var(--text)]">No sessions found</p>
          <p className="text-sm text-[var(--muted)] mt-1">Run an analysis to get started</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sessions.map((s,i)=>{
            const total = s.total_reviews||1
            const pos   = Math.round(s.positive_count/total*100)
            const neg   = Math.round(s.negative_count/total*100)
            return (
              <motion.div key={s.session_id} initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} transition={{delay:i*.02}}>
                <Link to={`/history/${s.session_id}`}
                  className="card flex items-center gap-4 p-4 hover:border-[var(--brand)]/40 transition-all group block">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{background:`${typeColors[s.source_type]||'var(--brand)'}18`}}>
                    <Clock size={15} style={{color:typeColors[s.source_type]||'var(--brand)'}}/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-[var(--text)] truncate">{s.name||s.session_id}</p>
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-[var(--border)] text-[var(--muted)]">{s.source_type}</span>
                      {s.fake_count>0 && <span className="text-[10px] badge badge-neg">️ {s.fake_count} fake</span>}
                    </div>
                    <p className="text-xs text-[var(--muted)] mt-0.5">{s.total_reviews} reviews · {new Date(s.created_at).toLocaleDateString()}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex h-1.5 w-32 rounded-full overflow-hidden bg-[var(--border)]">
                        <div style={{width:`${pos}%`,background:'var(--green)'}}/>
                        <div style={{width:`${neg}%`,background:'var(--red)'}}/>
                      </div>
                      <span className="text-[10px] text-[var(--muted)]">{pos}% pos</span>
                    </div>
                  </div>
                  <div className="hidden xl:block flex-shrink-0 text-right">
                    <p className="text-[10px] font-mono text-[var(--dim)]">{s.session_id}</p>
                    <p className="text-xs text-[var(--muted)] mt-0.5">score: {s.avg_score?.toFixed(3)}</p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={e=>exp(s.session_id,e)} className="btn-ghost p-2" title="Export CSV"><Download size={13}/></button>
                    <button onClick={e=>del(s.session_id,e)} className="btn-ghost p-2 hover:text-[var(--red)]" title="Delete"><Trash2 size={13}/></button>
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
