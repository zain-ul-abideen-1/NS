import { useEffect, useState } from 'react'
import { Eye, Trash2, Plus, Globe } from 'lucide-react'
import toast from 'react-hot-toast'
import { Watchlist as WatchAPI } from '../utils/api'
import { PageHeader } from '../components/UI'

export default function Watchlist() {
  const [items, setItems] = useState([])
  const [form, setForm] = useState({ name:'', url:'', alert_threshold:-0.2 })
  const [loading, setLoad] = useState(false)

  const load = () => WatchAPI.list().then(r=>setItems(r.data.items||[])).catch(()=>{})
  useEffect(()=>{ load() },[])

  const add = async () => {
    if (!form.name||!form.url) { toast.error('Name and URL required'); return }
    setLoad(true)
    try {
      await WatchAPI.add(form.name, form.url, form.alert_threshold)
      toast.success('Added to watchlist')
      setForm({name:'',url:'',alert_threshold:-0.2})
      load()
    } catch { toast.error('Failed to add') }
    finally { setLoad(false) }
  }

  const del = async (id) => {
    await WatchAPI.delete(id)
    toast.success('Removed')
    load()
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <PageHeader title="Watchlist" subtitle="Monitor URLs for sentiment changes and alerts"/>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-5 space-y-4">
          <p className="section-title">Add to Watchlist</p>
          <div>
            <label className="label">Name</label>
            <input className="input" placeholder="e.g. My Product Reviews" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/>
          </div>
          <div>
            <label className="label">URL</label>
            <input className="input font-mono text-xs" placeholder="https://…" value={form.url} onChange={e=>setForm(f=>({...f,url:e.target.value}))}/>
          </div>
          <div>
            <label className="label">Alert if score drops below</label>
            <input className="input" type="number" step="0.05" min="-1" max="1" value={form.alert_threshold} onChange={e=>setForm(f=>({...f,alert_threshold:+e.target.value}))}/>
          </div>
          <button onClick={add} disabled={loading} className="btn-primary w-full justify-center"><Plus size={14}/>Add</button>
        </div>
        <div className="lg:col-span-2 space-y-3">
          {items.length===0 ? (
            <div className="card p-12 text-center"><Eye size={28} className="text-[var(--dim)] mx-auto mb-3"/><p className="text-sm text-[var(--muted)]">No URLs monitored yet</p></div>
          ) : items.map(item=>(
            <div key={item.id} className="card p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[var(--brand)]/10 flex items-center justify-center flex-shrink-0">
                <Globe size={14} className="text-[var(--brand)]"/>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--text)] truncate">{item.name}</p>
                <p className="text-xs text-[var(--muted)] truncate font-mono">{item.url}</p>
                <p className="text-xs text-[var(--muted)] mt-0.5">Alert threshold: {item.alert_threshold}</p>
              </div>
              <button onClick={()=>del(item.id)} className="btn-ghost p-2 hover:text-[var(--red)]"><Trash2 size={13}/></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
