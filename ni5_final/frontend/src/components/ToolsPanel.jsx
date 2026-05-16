import { useState, useEffect, useRef } from 'react'
import {
  X, Calculator, DollarSign, TrendingUp, Star, Plug, StickyNote,
  Target, BarChart2, AlertCircle, Clock, Globe2, Zap,
  Users, MessageSquare, PieChart, Bell, Plus, Minus,
  CheckCircle, ArrowUpRight, ArrowDownRight, RefreshCw,
  Download, Trash2, Edit3, ChevronDown, Save, Mail,
  FileText, Hash, Shuffle, Type, Link, Lock, Palette,
  BarChart, Image, Calendar, Sigma, BookOpen, Code2,
  Timer, Percent, Database, ClipboardList
} from 'lucide-react'
import { Sessions, AI } from '../utils/api'
import axios from 'axios'

// ─── Helpers ─────────────────────────────────────────────────────
const useLocalStore = (key, init) => {
  const [v, setV] = useState(() => {
    try { const s = localStorage.getItem('ni_tool_'+key); return s ? JSON.parse(s) : init }
    catch { return init }
  })
  const save = (val) => { setV(val); try { localStorage.setItem('ni_tool_'+key, JSON.stringify(val)) } catch {} }
  return [v, save]
}
function Card({ children, className='' }) {
  return <div className={`bg-[var(--bg)] rounded-xl p-4 border border-[var(--border)] ${className}`}>{children}</div>
}
function Label({ children }) { return <p className="text-xs font-semibold text-[var(--text)] mb-2">{children}</p> }
function Muted({ children }) { return <p className="text-xs text-[var(--muted)]">{children}</p> }

// ─── TOOL 1: Advanced Calculator ─────────────────────────────────
function AdvancedCalc() {
  const [display, setDisplay] = useState('0')
  const [history, setHistory] = useLocalStore('calc_hist', [])
  const [prev, setPrev] = useState(null)
  const [op, setOp] = useState(null)
  const [fresh, setFresh] = useState(true)
  const [mode, setMode] = useState('basic')
  const press = (key) => {
    if (key==='C'){setDisplay('0');setPrev(null);setOp(null);setFresh(true);return}
    if (key==='⌫'){setDisplay(d=>d.length>1?d.slice(0,-1):'0');return}
    if (['+','-','×','÷'].includes(key)){setPrev(parseFloat(display));setOp(key);setFresh(true);return}
    if (key==='='){
      if(prev===null||!op)return
      const a=prev,b=parseFloat(display)
      const res=op==='+'?a+b:op==='-'?a-b:op==='×'?a*b:b!==0?a/b:'Err'
      const expr=`${a} ${op} ${b} = ${typeof res==='number'?parseFloat(res.toFixed(8)):res}`
      setHistory(h=>[{expr,time:new Date().toLocaleTimeString()},...h.slice(0,19)])
      setDisplay(typeof res==='number'?String(parseFloat(res.toFixed(8))):'Err')
      setPrev(null);setOp(null);setFresh(true);return
    }
    if(key==='%'){setDisplay(d=>String(parseFloat(d)/100));return}
    if(key==='√'){setDisplay(d=>String(Math.sqrt(parseFloat(d)).toFixed(6)));return}
    if(key==='x²'){setDisplay(d=>String(Math.pow(parseFloat(d),2)));return}
    if(key==='1/x'){setDisplay(d=>parseFloat(d)!==0?String(1/parseFloat(d)):'Err');return}
    if(key==='±'){setDisplay(d=>d.startsWith('-')?d.slice(1):'-'+d);return}
    if(key==='sin'){setDisplay(d=>String(Math.sin(parseFloat(d)*Math.PI/180).toFixed(6)));return}
    if(key==='cos'){setDisplay(d=>String(Math.cos(parseFloat(d)*Math.PI/180).toFixed(6)));return}
    if(key==='tan'){setDisplay(d=>String(Math.tan(parseFloat(d)*Math.PI/180).toFixed(6)));return}
    if(key==='log'){setDisplay(d=>String(Math.log10(parseFloat(d)).toFixed(6)));return}
    if(key==='ln'){setDisplay(d=>String(Math.log(parseFloat(d)).toFixed(6)));return}
    if(key==='.'&&display.includes('.'))return
    setDisplay(d=>fresh||d==='0'?(key==='.'?'0.':key):d+key)
    setFresh(false)
  }
  const BASIC=[['C','⌫','%','÷'],['7','8','9','×'],['4','5','6','-'],['1','2','3','+'],['.','0','±','=']]
  const SCI=[['sin','cos','tan','C'],['log','ln','√','÷'],['7','8','9','×'],['4','5','6','-'],['1','2','3','+'],['.','0','x²','=']]
  const KEYS=mode==='sci'?SCI:BASIC
  const isOp=k=>['+','-','×','÷','='].includes(k)
  const isAct=k=>['C','⌫','√','x²','1/x','sin','cos','tan','log','ln'].includes(k)
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
      <div className="space-y-4">
        <div className="flex gap-2 mb-2">
          {['basic','sci'].map(m=>(
            <button key={m} onClick={()=>setMode(m)} className={`text-xs px-3 py-1 rounded-lg border transition-all ${mode===m?'text-white border-transparent':'border-[var(--border)] text-[var(--muted)]'}`} style={mode===m?{background:'var(--grad)'}:{}}>{m==='basic'?'Standard':'Scientific'}</button>
          ))}
        </div>
        <Card>{op&&prev!==null&&<p className="text-xs text-[var(--muted)] font-mono text-right mb-1">{prev} {op}</p>}<p className="text-4xl font-mono font-bold text-[var(--text)] text-right truncate">{display}</p></Card>
        <div className={`grid gap-1.5 ${mode==='sci'?'grid-cols-4':'grid-cols-4'}`}>
          {KEYS.flat().map((k,i)=>(
            <button key={i} onClick={()=>press(k)} className={`rounded-xl py-3 text-sm font-semibold transition-all active:scale-95 ${k==='='?'text-white':isOp(k)?'bg-[var(--brand)]/15 text-[var(--brand)] hover:bg-[var(--brand)]/25':isAct(k)?'bg-[var(--red)]/15 text-[var(--red)] hover:bg-[var(--red)]/25':'bg-[var(--card)] border border-[var(--border)] text-[var(--text)] hover:bg-[var(--card2)]'}`} style={k==='='?{background:'var(--grad)'}:{}}>{k}</button>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between"><Label>History</Label>{history.length>0&&<button onClick={()=>setHistory([])} className="text-[10px] text-[var(--muted)] hover:text-[var(--red)] flex items-center gap-1"><Trash2 size={9}/>Clear</button>}</div>
        <div className="space-y-2 max-h-80 overflow-y-auto">{history.length===0?<Muted>No calculations yet</Muted>:history.map((h,i)=>(<div key={i} className="flex justify-between items-center p-2.5 rounded-lg bg-[var(--card)] border border-[var(--border)]"><span className="text-xs font-mono text-[var(--text)]">{h.expr}</span><span className="text-[10px] text-[var(--muted)]">{h.time}</span></div>))}</div>
      </div>
    </div>
  )
}

// ─── TOOL 2: Business Metrics ─────────────────────────────────────
function ROITool() {
  const [tab, setTab] = useState('roi')
  const [inv, setInv] = useState(''); const [ret, setRet] = useState('')
  const [satisfied, setSat] = useState(''); const [total, setTotal] = useState('')
  const [mktSpend, setMktSpend] = useState(''); const [newCusts, setNewCusts] = useState('')
  const [avgOrder, setAvgOrder] = useState(''); const [freq, setFreq] = useState(''); const [lifespan, setLifespan] = useState('')
  const roi = inv&&ret?((parseFloat(ret)-parseFloat(inv))/parseFloat(inv)*100).toFixed(1):null
  const csat = satisfied&&total?((parseInt(satisfied)/parseInt(total))*100).toFixed(1):null
  const cac = mktSpend&&newCusts?(parseFloat(mktSpend)/parseInt(newCusts)).toFixed(2):null
  const ltv = avgOrder&&freq&&lifespan?(parseFloat(avgOrder)*parseFloat(freq)*parseFloat(lifespan)).toFixed(0):null
  const TABS=[{id:'roi',label:'ROI'},{id:'csat',label:'CSAT'},{id:'cac',label:'CAC'},{id:'ltv',label:'LTV'}]
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div className="flex gap-1.5 flex-wrap">{TABS.map(t=>(<button key={t.id} onClick={()=>setTab(t.id)} className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${tab===t.id?'text-white border-transparent':'border-[var(--border)] text-[var(--muted)]'}`} style={tab===t.id?{background:'var(--grad)'}:{}}>{t.label}</button>))}</div>
        {tab==='roi'&&<Card className="space-y-3"><Label>Return On Investment</Label><div><label className="text-[10px] text-[var(--muted)]">Investment ($)</label><input className="input text-sm mt-1 w-full" type="number" placeholder="10000" value={inv} onChange={e=>setInv(e.target.value)}/></div><div><label className="text-[10px] text-[var(--muted)]">Total Return ($)</label><input className="input text-sm mt-1 w-full" type="number" placeholder="15000" value={ret} onChange={e=>setRet(e.target.value)}/></div></Card>}
        {tab==='csat'&&<Card className="space-y-3"><Label>CSAT Score</Label><div><label className="text-[10px] text-[var(--muted)]">Satisfied Customers</label><input className="input text-sm mt-1 w-full" type="number" value={satisfied} onChange={e=>setSat(e.target.value)}/></div><div><label className="text-[10px] text-[var(--muted)]">Total Surveyed</label><input className="input text-sm mt-1 w-full" type="number" value={total} onChange={e=>setTotal(e.target.value)}/></div></Card>}
        {tab==='cac'&&<Card className="space-y-3"><Label>Customer Acquisition Cost</Label><div><label className="text-[10px] text-[var(--muted)]">Marketing Spend ($)</label><input className="input text-sm mt-1 w-full" type="number" value={mktSpend} onChange={e=>setMktSpend(e.target.value)}/></div><div><label className="text-[10px] text-[var(--muted)]">New Customers</label><input className="input text-sm mt-1 w-full" type="number" value={newCusts} onChange={e=>setNewCusts(e.target.value)}/></div></Card>}
        {tab==='ltv'&&<Card className="space-y-3"><Label>Customer Lifetime Value</Label><div><label className="text-[10px] text-[var(--muted)]">Avg Order ($)</label><input className="input text-sm mt-1 w-full" type="number" value={avgOrder} onChange={e=>setAvgOrder(e.target.value)}/></div><div><label className="text-[10px] text-[var(--muted)]">Purchases/Year</label><input className="input text-sm mt-1 w-full" type="number" value={freq} onChange={e=>setFreq(e.target.value)}/></div><div><label className="text-[10px] text-[var(--muted)]">Lifespan (years)</label><input className="input text-sm mt-1 w-full" type="number" value={lifespan} onChange={e=>setLifespan(e.target.value)}/></div></Card>}
      </div>
      <div className="flex items-center justify-center">
        {tab==='roi'&&roi!==null&&(<div className="space-y-4 w-full"><div className="rounded-2xl p-6 text-center" style={{background:'var(--grad)'}}><p className="text-white/70 text-sm">ROI</p><p className="text-6xl font-display font-bold text-white mt-1">{roi}%</p><p className="text-white/70 text-sm mt-1">{parseFloat(roi)>0?'Profitable ✅':'Loss ❌'}</p></div><div className="grid grid-cols-2 gap-3"><Card className="text-center"><p className="text-[10px] text-[var(--muted)]">Net Profit</p><p className="text-xl font-bold text-[var(--green)] mt-1">${(parseFloat(ret)-parseFloat(inv)).toLocaleString()}</p></Card><Card className="text-center"><p className="text-[10px] text-[var(--muted)]">Multiplier</p><p className="text-xl font-bold text-[var(--brand)] mt-1">{(parseFloat(ret)/parseFloat(inv)).toFixed(2)}x</p></Card></div></div>)}
        {tab==='csat'&&csat!==null&&(<div className="rounded-2xl p-6 text-center w-full" style={{background:'var(--grad)'}}><p className="text-white/70 text-sm">CSAT Score</p><p className="text-6xl font-display font-bold text-white mt-1">{csat}%</p><p className="text-white/70 text-sm mt-1">{parseFloat(csat)>=90?'World Class 🏆':parseFloat(csat)>=75?'Good 👍':'Needs Improvement ⚠️'}</p></div>)}
        {tab==='cac'&&cac!==null&&(<div className="rounded-2xl p-6 text-center w-full" style={{background:'var(--grad)'}}><p className="text-white/70 text-sm">Cost per Customer</p><p className="text-5xl font-display font-bold text-white mt-1">${cac}</p></div>)}
        {tab==='ltv'&&ltv!==null&&(<div className="rounded-2xl p-6 text-center w-full" style={{background:'var(--grad)'}}><p className="text-white/70 text-sm">Lifetime Value</p><p className="text-5xl font-display font-bold text-white mt-1">${parseInt(ltv).toLocaleString()}</p></div>)}
        {((tab==='roi'&&!roi)||(tab==='csat'&&!csat)||(tab==='cac'&&!cac)||(tab==='ltv'&&!ltv))&&(<div className="text-center space-y-2"><div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto bg-[var(--border)]"><DollarSign size={24} className="text-[var(--muted)]"/></div><Muted>Fill in the fields to see your result</Muted></div>)}
      </div>
    </div>
  )
}

// ─── TOOL 3: Budget Tracker ───────────────────────────────────────
function BudgetTool() {
  const [items, setItems] = useLocalStore('budget', [{id:1,label:'Marketing',budget:5000,spent:3200,color:'#0ea5e9'},{id:2,label:'Support',budget:2000,spent:1800,color:'#34d399'},{id:3,label:'Tech Tools',budget:1500,spent:950,color:'#a78bfa'},{id:4,label:'Ops',budget:3000,spent:2400,color:'#f59e0b'}])
  const [newLabel,setNewLabel]=useState(''); const [newBudget,setNewBudget]=useState(''); const [editing,setEditing]=useState(null)
  const total=items.reduce((s,i)=>s+i.budget,0); const spent=items.reduce((s,i)=>s+i.spent,0); const remaining=total-spent; const pctUsed=total>0?Math.round(spent/total*100):0
  const COLORS=['#0ea5e9','#34d399','#a78bfa','#f59e0b','#f97316','#ec4899','#ef4444','#14b8a6']
  const add=()=>{if(!newLabel||!newBudget)return;setItems([...items,{id:Date.now(),label:newLabel,budget:parseFloat(newBudget),spent:0,color:COLORS[items.length%COLORS.length]}]);setNewLabel('');setNewBudget('')}
  const updateSpent=(id,v)=>setItems(items.map(i=>i.id===id?{...i,spent:parseFloat(v)||0}:i))
  const remove=(id)=>setItems(items.filter(i=>i.id!==id))
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <Card><div className="grid grid-cols-3 gap-3 mb-4">{[{label:'Total',val:`$${total.toLocaleString()}`,c:'var(--text)'},{label:'Spent',val:`$${spent.toLocaleString()}`,c:pctUsed>90?'var(--red)':'var(--amber)'},{label:'Remaining',val:`$${remaining.toLocaleString()}`,c:remaining<0?'var(--red)':'var(--green)'}].map(k=>(<div key={k.label} className="text-center"><p className="text-[10px] text-[var(--muted)]">{k.label}</p><p className="text-lg font-bold mt-0.5" style={{color:k.c}}>{k.val}</p></div>))}</div><div className="space-y-1"><div className="flex justify-between text-xs"><span className="text-[var(--muted)]">Budget Used</span><span className="font-bold" style={{color:pctUsed>90?'var(--red)':pctUsed>70?'var(--amber)':'var(--green)'}}>{pctUsed}%</span></div><div className="h-3 bg-[var(--border)] rounded-full overflow-hidden"><div className="h-full rounded-full transition-all" style={{width:`${Math.min(pctUsed,100)}%`,background:pctUsed>90?'var(--red)':pctUsed>70?'var(--amber)':'var(--green)'}}/></div></div></Card>
        <div className="space-y-2 max-h-64 overflow-y-auto">{items.map(item=>{const pct=item.budget>0?Math.min(item.spent/item.budget*100,100):0;const over=item.spent>item.budget;return(<Card key={item.id} className="space-y-2"><div className="flex justify-between items-center"><div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{background:item.color}}/><span className="text-sm font-medium text-[var(--text)]">{item.label}</span></div><div className="flex items-center gap-2">{over&&<span className="text-[9px] text-white px-1.5 py-0.5 rounded bg-[var(--red)]">OVER</span>}<button onClick={()=>setEditing(editing===item.id?null:item.id)} className="text-[var(--muted)] hover:text-[var(--text)]"><Edit3 size={11}/></button><button onClick={()=>remove(item.id)} className="text-[var(--muted)] hover:text-[var(--red)]"><Trash2 size={11}/></button></div></div><div className="flex items-center gap-2"><div className="flex-1 h-2 bg-[var(--border)] rounded-full overflow-hidden"><div className="h-full rounded-full transition-all" style={{width:`${pct}%`,background:over?'var(--red)':item.color}}/></div><span className="text-[10px] font-mono text-[var(--muted)]">${item.spent.toLocaleString()}/${item.budget.toLocaleString()}</span></div>{editing===item.id&&(<input className="input text-xs flex-1" type="number" placeholder="Spent so far" defaultValue={item.spent} onBlur={e=>updateSpent(item.id,e.target.value)}/>)}</Card>)})}</div>
        <div className="flex gap-2"><input className="input text-sm flex-1" placeholder="Category" value={newLabel} onChange={e=>setNewLabel(e.target.value)}/><input className="input text-sm w-28" placeholder="Budget $" type="number" value={newBudget} onChange={e=>setNewBudget(e.target.value)}/><button onClick={add} className="btn-primary px-3"><Plus size={14}/></button></div>
      </div>
      <div className="space-y-3"><Label>Breakdown</Label>{[...items].sort((a,b)=>b.spent-a.spent).map((item)=>(<div key={item.id} className="space-y-1"><div className="flex justify-between text-xs"><span style={{color:item.color}} className="font-medium">{item.label}</span><span className="text-[var(--muted)]">{item.budget>0?Math.round(item.spent/item.budget*100):0}%</span></div><div className="h-4 bg-[var(--border)] rounded-full overflow-hidden"><div className="h-full rounded-full flex items-center" style={{width:`${item.budget>0?Math.min(item.spent/item.budget*100,100):0}%`,background:item.color,minWidth:item.spent>0?'2rem':0}}><span className="text-[9px] font-bold text-white px-1.5 truncate">${item.spent.toLocaleString()}</span></div></div></div>))}<Card className="mt-4"><p className="text-xs font-semibold text-[var(--text)] mb-2">Alerts</p>{items.filter(i=>i.spent>i.budget).map(i=>(<p key={i.id} className="text-xs text-[var(--red)] flex items-center gap-1 mb-1"><AlertCircle size={10}/> {i.label} over by ${(i.spent-i.budget).toLocaleString()}</p>))}{items.every(i=>i.spent<=i.budget)&&<p className="text-xs text-[var(--green)] flex items-center gap-1"><CheckCircle size={10}/> All within budget</p>}</Card></div>
    </div>
  )
}

// ─── TOOL 4: Session Dashboard ────────────────────────────────────
function SessionDashboard() {
  const [sessions,setSessions]=useState([]); const [loading,setLoading]=useState(true); const [selected,setSelected]=useState(null); const [detail,setDetail]=useState(null); const [detailLoad,setDetailLoad]=useState(false)
  useEffect(()=>{Sessions.list({}).then(r=>{setSessions(r.data?.sessions||[]);setLoading(false)}).catch(()=>setLoading(false))},[])
  const loadDetail=async(id)=>{if(selected===id){setSelected(null);setDetail(null);return};setSelected(id);setDetailLoad(true);try{const r=await Sessions.get(id);setDetail(r.data)}catch{};setDetailLoad(false)}
  if(loading)return<div className="flex items-center justify-center h-40"><RefreshCw size={18} className="animate-spin text-[var(--muted)]"/></div>
  if(sessions.length===0)return<div className="text-center py-12"><Muted>No sessions yet. Analyze some reviews first.</Muted></div>
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
        <Label>{sessions.length} Sessions</Label>
        {sessions.map(s=>{const pos=s.positive_pct||0,neg=s.negative_pct||0,c=pos>60?'var(--green)':neg>50?'var(--red)':'var(--amber)';return(<div key={s.session_id} onClick={()=>loadDetail(s.session_id)} className={`card p-4 cursor-pointer transition-all hover:border-[var(--brand)]/30 border-2 ${selected===s.session_id?'border-[var(--brand)]/50':'border-transparent'}`}><div className="flex justify-between items-start mb-2"><div><p className="text-sm font-semibold text-[var(--text)]">{s.name}</p><p className="text-[10px] text-[var(--muted)]">{s.total_reviews} reviews · {new Date(s.created_at).toLocaleDateString()}</p></div><span className="text-sm font-bold" style={{color:c}}>{pos}%</span></div><div className="h-2 bg-[var(--border)] rounded-full overflow-hidden flex"><div className="h-full bg-[var(--green)]" style={{width:`${pos}%`}}/><div className="h-full bg-[var(--amber)]" style={{width:`${s.neutral_pct||0}%`}}/><div className="h-full bg-[var(--red)]" style={{width:`${neg}%`}}/></div></div>)})}
      </div>
      <div>{detailLoad&&<div className="flex items-center justify-center h-40"><RefreshCw size={18} className="animate-spin text-[var(--muted)]"/></div>}{detail&&!detailLoad&&(<div className="space-y-4"><Label>Deep Dive — {detail.name}</Label><div className="grid grid-cols-2 gap-3">{[{label:'Total Reviews',val:detail.total_reviews||0},{label:'Avg Score',val:((detail.avg_score||0)*100).toFixed(0)+'%'},{label:'Fake Flagged',val:(detail.fake_count||0)+'',alert:detail.fake_count>2},{label:'Helpfulness',val:((detail.avg_helpfulness||0.5)*100).toFixed(0)+'%'}].map(k=>(<Card key={k.label} className="text-center"><p className="text-[10px] text-[var(--muted)]">{k.label}</p><p className="text-xl font-bold mt-1" style={{color:k.alert?'var(--red)':'var(--text)'}}>{k.val}</p></Card>))}</div>{detail.top_keywords?.length>0&&(<Card><p className="text-xs font-semibold text-[var(--text)] mb-2">Keywords</p><div className="flex flex-wrap gap-1.5">{detail.top_keywords.slice(0,12).map((k,i)=>(<span key={i} className="text-[10px] px-2 py-0.5 rounded-full border border-[var(--border)] text-[var(--text2)]">{k.word} <span className="text-[var(--muted)]">×{k.count}</span></span>))}</div></Card>)}{detail.ai_insights&&(<Card><p className="text-xs font-semibold text-[var(--text)] mb-2">AI Insights</p><p className="text-xs text-[var(--text2)] leading-relaxed">{detail.ai_insights}</p></Card>)}</div>)}{!selected&&!detailLoad&&<div className="flex flex-col items-center justify-center h-48 text-center"><BarChart2 size={24} className="text-[var(--muted)] mb-2"/><Muted>Click a session to see analytics</Muted></div>}</div>
    </div>
  )
}

// ─── TOOL 5: Store Connect ────────────────────────────────────────
function StoreTool() {
  const [tab, setTab] = useState('shopify')
  const INTEGRATIONS = {
    shopify:{name:'Shopify',icon:'🛍️',color:'#95BF47',method:'OAuth 2.0',steps:[{num:1,title:'Install NestInsights App',detail:'Shopify App Store → Search "NestInsights" → Install. Grants OAuth2 read access to reviews.'},{num:2,title:'Grant Permissions',detail:'Accept: read_products, read_reviews. Industry-standard OAuth2 — no password sharing.'},{num:3,title:'Set Webhook',detail:'Shopify Admin → Settings → Notifications → Webhooks → Add: Event "New product review" → URL: https://yourapp.nestinsights.com/webhooks/shopify'},{num:4,title:'Verify Connection',detail:'A test review fires. Check Analyze tab — appears within 30 seconds.'}],apiNote:'Shopify REST Admin API v2024-01',freeApiKey:'Partner App is free. Production requires Shopify plan ($29+/mo).'},
    woo:{name:'WooCommerce',icon:'🛒',color:'#7F54B3',method:'REST API',steps:[{num:1,title:'Generate API Keys',detail:'WP Admin → WooCommerce → Settings → Advanced → REST API → Add Key. Set permissions to "Read".'},{num:2,title:'Add Keys',detail:'Paste Consumer Key and Secret into NestInsights Settings → Integrations → WooCommerce.'},{num:3,title:'Set Webhook',detail:'WP Admin → WooCommerce → Webhooks → Add → Topic: "Review created" → URL: .../webhooks/woo'},{num:4,title:'Test',detail:'Post a test review. Should appear in NestInsights within 60 seconds.'}],apiNote:'WooCommerce REST API v3',freeApiKey:'Free with any WooCommerce installation.'},
    trustpilot:{name:'Trustpilot',icon:'⭐',color:'#00B67A',method:'Business API',steps:[{num:1,title:'Create Business Account',detail:'Sign up at business.trustpilot.com. Verify your domain.'},{num:2,title:'Apply for API Access',detail:'support.trustpilot.com → Apply for API key. Approved in 1-3 business days.'},{num:3,title:'Enter API Key',detail:'Paste API Key from Trustpilot → Integrations → API into NestInsights Settings.'},{num:4,title:'Set Business Unit ID',detail:'Find your ID in Trustpilot URL and add it to NestInsights.'}],apiNote:'Trustpilot Business API v1. Rate limit: 1000 req/day (free).',freeApiKey:'Free tier: 1,000 API calls/day.'},
    amazon:{name:'Amazon',icon:'📦',color:'#FF9900',method:'SP-API',steps:[{num:1,title:'Register as Developer',detail:'sellercentral.amazon.com → Apps → Develop Apps → Register.'},{num:2,title:'Create SP-API App',detail:'Developer Console → Create App → Selling Partner API → Request Reviews API scope.'},{num:3,title:'OAuth Authorization',detail:'Amazon LWA OAuth2 flow. Generate refresh tokens. NestInsights handles refresh automatically.'},{num:4,title:'Configure',detail:'Enter Client ID, Client Secret, and Refresh Token. Select marketplace region.'}],apiNote:'Amazon SP-API Reviews endpoint. Requires active seller account.',freeApiKey:'Free for registered sellers.'},
    google:{name:'Google Reviews',icon:'🔍',color:'#4285F4',method:'GMB API',steps:[{num:1,title:'Enable GMB API',detail:'console.cloud.google.com → Enable "My Business Reviews API".'},{num:2,title:'Create OAuth Credentials',detail:'APIs & Services → Credentials → OAuth Client ID → Web Application.'},{num:3,title:'Places API',detail:'Enable Places API → Create API Key → Restrict to Places API only.'},{num:4,title:'Connect',detail:'Enter Client ID/Secret and Places API Key. Authenticate Google account.'}],apiNote:'Google My Business API free for verified businesses.',freeApiKey:'$200/month free credit (~4K requests/mo).'},
  }
  const active=INTEGRATIONS[tab]
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="space-y-2"><Label>Platforms</Label>{Object.entries(INTEGRATIONS).map(([key,val])=>(<button key={key} onClick={()=>setTab(key)} className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${tab===key?'border-transparent text-white':'border-[var(--border)] hover:border-[var(--brand)]/30'}`} style={tab===key?{background:val.color}:{}}><span className="text-xl">{val.icon}</span><div><p className={`text-xs font-semibold ${tab===key?'text-white':'text-[var(--text)]'}`}>{val.name}</p><p className={`text-[9px] ${tab===key?'text-white/70':'text-[var(--muted)]'}`}>{val.method}</p></div></button>))}</div>
      <div className="lg:col-span-3 space-y-4"><div className="flex items-center gap-3"><span className="text-2xl">{active.icon}</span><div><p className="text-base font-bold text-[var(--text)]">{active.name} Integration</p><span className="text-[10px] px-2 py-0.5 rounded font-medium text-white" style={{background:active.color}}>{active.method}</span></div></div><div className="space-y-3">{active.steps.map(step=>(<Card key={step.num} className="flex gap-3"><div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white" style={{background:active.color}}>{step.num}</div><div><p className="text-xs font-semibold text-[var(--text)]">{step.title}</p><p className="text-xs text-[var(--muted)] mt-1 leading-relaxed">{step.detail}</p></div></Card>))}</div><Card className="border-[var(--brand)]/20 bg-[var(--brand)]/5"><p className="text-xs font-semibold text-[var(--brand)]">📖 API Note</p><p className="text-xs text-[var(--muted)] mt-1">{active.apiNote}</p></Card><Card className="border-[var(--green)]/20 bg-[var(--green)]/5"><p className="text-xs font-semibold text-[var(--green)]">💰 Free tier</p><p className="text-xs text-[var(--muted)] mt-1">{active.freeApiKey}</p></Card></div>
    </div>
  )
}

// ─── TOOL 6: Smart Notes ─────────────────────────────────────────
function NotesTool() {
  const [notes,setNotes]=useLocalStore('notes',[{id:1,title:'Action Items',content:'• Follow up on negative reviews\n• Respond to Trustpilot complaints\n• Review Q4 strategy',pinned:true,color:'#0ea5e9'}])
  const [newTitle,setNewTitle]=useState(''); const [newContent,setNewContent]=useState(''); const [editing,setEditing]=useState(null); const [searchQ,setSearchQ]=useState('')
  const add=()=>{if(!newTitle.trim())return;const COLORS=['#0ea5e9','#34d399','#a78bfa','#f59e0b','#f97316','#ec4899'];setNotes([...notes,{id:Date.now(),title:newTitle,content:newContent,pinned:false,color:COLORS[notes.length%COLORS.length]}]);setNewTitle('');setNewContent('')}
  const remove=(id)=>setNotes(notes.filter(n=>n.id!==id)); const updateNote=(id,field,val)=>setNotes(notes.map(n=>n.id===id?{...n,[field]:val}:n)); const pin=(id)=>setNotes(notes.map(n=>n.id===id?{...n,pinned:!n.pinned}:n))
  const filtered=notes.filter(n=>!searchQ||n.title.toLowerCase().includes(searchQ.toLowerCase())||n.content.toLowerCase().includes(searchQ.toLowerCase()))
  const sorted=[...filtered.filter(n=>n.pinned),...filtered.filter(n=>!n.pinned)]
  const exportAll=()=>{const txt=notes.map(n=>`# ${n.title}\n${n.content}`).join('\n\n---\n\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([txt],{type:'text/plain'}));a.download='notes.txt';a.click()}
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-3"><div className="flex items-center justify-between"><Label>{notes.length} Notes</Label><button onClick={exportAll} className="text-[10px] text-[var(--muted)] hover:text-[var(--text)] flex items-center gap-1"><Download size={10}/>Export</button></div><input className="input text-sm w-full" placeholder="Search notes..." value={searchQ} onChange={e=>setSearchQ(e.target.value)}/><div className="space-y-2 max-h-80 overflow-y-auto pr-1">{sorted.map(n=>(<div key={n.id} className="rounded-xl border border-[var(--border)] overflow-hidden"><div className="flex items-center gap-2 px-3 py-2" style={{background:n.color+'20',borderBottom:`2px solid ${n.color}40`}}><div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{background:n.color}}/>{editing===n.id?(<input className="flex-1 text-xs font-semibold bg-transparent border-none outline-none text-[var(--text)]" value={n.title} onChange={e=>updateNote(n.id,'title',e.target.value)}/>):(<p className="flex-1 text-xs font-semibold text-[var(--text)]">{n.title}</p>)}<div className="flex gap-1"><button onClick={()=>pin(n.id)} className={`text-[10px] ${n.pinned?'text-[var(--amber)]':'text-[var(--dim)]'}`}>📌</button><button onClick={()=>setEditing(editing===n.id?null:n.id)} className="text-[var(--muted)] hover:text-[var(--text)]"><Edit3 size={10}/></button><button onClick={()=>remove(n.id)} className="text-[var(--muted)] hover:text-[var(--red)]"><Trash2 size={10}/></button></div></div><div className="p-3">{editing===n.id?(<textarea className="input text-xs w-full resize-none" rows={4} value={n.content} onChange={e=>updateNote(n.id,'content',e.target.value)}/>):(<p className="text-xs text-[var(--text2)] whitespace-pre-line leading-relaxed">{n.content}</p>)}</div></div>))}</div></div>
      <div className="space-y-3"><Label>New Note</Label><input className="input text-sm w-full" placeholder="Title..." value={newTitle} onChange={e=>setNewTitle(e.target.value)}/><textarea className="input text-sm resize-none w-full" rows={6} placeholder="Content..." value={newContent} onChange={e=>setNewContent(e.target.value)}/><button onClick={add} disabled={!newTitle.trim()} className="btn-primary text-sm w-full flex items-center justify-center gap-2"><Plus size={14}/>Add Note</button></div>
    </div>
  )
}

// ─── TOOL 7: NPS & Score Converter ───────────────────────────────
function NPSTool() {
  const [tab,setTab]=useState('nps'); const [p,setP]=useState(''); const [pa,setPa]=useState(''); const [d,setD]=useState(''); const [score,setScore]=useState('')
  const pi=parseInt(p)||0,pai=parseInt(pa)||0,di=parseInt(d)||0,tot=pi+pai+di
  const nps=tot>0?Math.round((pi/tot-di/tot)*100):null
  const npsLabel=nps===null?'':nps>=70?'World Class 🏆':nps>=50?'Excellent ⭐':nps>=30?'Good 👍':nps>=0?'Needs Work ⚠️':'Critical 🔴'
  const v=parseFloat(score); const isV=!isNaN(v)&&v>=-1&&v<=1
  const pct=isV?Math.round((v+1)/2*100):null; const stars=isV?Math.round(((v+1)/2)*4+1):null
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4"><div className="flex gap-2">{['nps','converter'].map(t=>(<button key={t} onClick={()=>setTab(t)} className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${tab===t?'text-white border-transparent':'border-[var(--border)] text-[var(--muted)]'}`} style={tab===t?{background:'var(--grad)'}:{}}>{t==='nps'?'NPS Calculator':'Score Converter'}</button>))}</div>
        {tab==='nps'&&(<div className="space-y-3">{[{label:'Promoters (9-10)',val:p,set:setP,c:'var(--green)'},{label:'Passives (7-8)',val:pa,set:setPa,c:'var(--amber)'},{label:'Detractors (0-6)',val:d,set:setD,c:'var(--red)'}].map(x=>(<div key={x.label}><label className="text-xs font-medium" style={{color:x.c}}>{x.label}</label><input className="input text-sm mt-1 w-full" type="number" min="0" placeholder="0" value={x.val} onChange={e=>x.set(e.target.value)}/></div>))}</div>)}
        {tab==='converter'&&(<div className="space-y-3"><Muted>Convert VADER score (-1 to +1)</Muted><input className="input text-sm w-full" type="number" step="0.01" min="-1" max="1" placeholder="e.g. 0.45" value={score} onChange={e=>setScore(e.target.value)}/>{isV&&<div className="h-3 bg-[var(--border)] rounded-full overflow-hidden"><div className="h-full rounded-full" style={{width:`${pct}%`,background:v>=0.2?'var(--green)':v>=-0.2?'var(--amber)':'var(--red)'}}/></div>}</div>)}
      </div>
      <div className="flex items-center justify-center">
        {tab==='nps'&&nps!==null&&(<div className="space-y-4 w-full"><div className="rounded-2xl p-6 text-center" style={{background:'var(--grad)'}}><p className="text-white/70 text-sm">Net Promoter Score</p><p className="text-6xl font-display font-bold text-white mt-1">{nps>0?'+':''}{nps}</p><p className="text-white/80 text-sm mt-1 font-medium">{npsLabel}</p></div></div>)}
        {tab==='converter'&&isV&&(<div className="grid grid-cols-2 gap-3 w-full">{[{label:'Score %',val:`${pct}%`},{label:'Stars',val:`${stars}/5 ⭐`},{label:'Raw',val:score},{label:'Direction',val:v>0?'↑ Positive':'↓ Negative'}].map(k=>(<Card key={k.label} className="text-center"><p className="text-[10px] text-[var(--muted)]">{k.label}</p><p className="text-xl font-bold mt-1 text-[var(--text)]">{k.val}</p></Card>))}</div>)}
        {((tab==='nps'&&nps===null)||(tab==='converter'&&!isV))&&(<div className="text-center space-y-2"><Users size={28} className="text-[var(--muted)] mx-auto"/><Muted>Fill in the fields to see results</Muted></div>)}
      </div>
    </div>
  )
}

// ─── TOOL 8: Competitor Tracker ───────────────────────────────────
function CompetitorTool() {
  const [comps,setComps]=useLocalStore('competitors',[{id:1,name:'Your Brand',sentiment:81,reviews:1800,rating:4.5,trend:5,note:''},{id:2,name:'CompA',sentiment:72,reviews:4210,rating:4.1,trend:3,note:''},{id:3,name:'CompB',sentiment:58,reviews:2100,rating:3.7,trend:-2,note:''}])
  const [newName,setNewName]=useState('')
  const add=()=>{if(!newName.trim())return;setComps([...comps,{id:Date.now(),name:newName.trim(),sentiment:65,reviews:0,rating:4.0,trend:0,note:''}]);setNewName('')}
  const update=(id,field,val)=>setComps(comps.map(c=>c.id===id?{...c,[field]:typeof val==='string'&&['sentiment','reviews','trend'].includes(field)?parseFloat(val)||0:val}:c))
  const remove=(id)=>setComps(comps.filter(c=>c.id!==id))
  const best=Math.max(...comps.map(c=>c.sentiment)); const you=comps[0]
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-3"><Label>Competitor Tracker</Label><div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">{comps.map((c,i)=>(<Card key={c.id} className={`space-y-3 ${i===0?'border-[var(--brand)]/40':''}`}><div className="flex items-center justify-between"><div className="flex items-center gap-2">{i===0&&<span className="text-[9px] text-white px-1.5 py-0.5 rounded bg-[var(--brand)] font-bold">YOU</span>}<input className="text-sm font-semibold bg-transparent text-[var(--text)] border-none outline-none w-28" value={c.name} onChange={e=>update(c.id,'name',e.target.value)}/></div><div className="flex items-center gap-2"><span className={`text-xs font-bold ${c.trend>=0?'text-[var(--green)]':'text-[var(--red)]'}`}>{c.trend>=0?'↑':'↓'}{Math.abs(c.trend)}%</span>{i>0&&<button onClick={()=>remove(c.id)} className="text-[var(--dim)] hover:text-[var(--red)]"><Trash2 size={10}/></button>}</div></div><div className="grid grid-cols-3 gap-2">{[{label:'Sentiment',field:'sentiment',val:c.sentiment},{label:'Reviews',field:'reviews',val:c.reviews},{label:'Trend %',field:'trend',val:c.trend}].map(f=>(<div key={f.field}><p className="text-[9px] text-[var(--muted)]">{f.label}</p><input className="input text-xs w-full mt-0.5" type="number" value={f.val} onChange={e=>update(c.id,f.field,e.target.value)}/></div>))}</div><div className="flex items-center gap-2"><div className="flex-1 h-2.5 bg-[var(--border)] rounded-full overflow-hidden"><div className="h-full rounded-full" style={{width:`${c.sentiment}%`,background:c.sentiment===best?'var(--green)':'var(--grad)'}}/></div><span className="text-xs font-mono font-bold w-8 text-right" style={{color:c.sentiment===best?'var(--green)':'var(--text)'}}>{c.sentiment}%</span></div></Card>))}</div><div className="flex gap-2"><input className="input text-sm flex-1" placeholder="Add competitor..." value={newName} onChange={e=>setNewName(e.target.value)} onKeyDown={e=>e.key==='Enter'&&add()}/><button onClick={add} className="btn-primary px-3"><Plus size={14}/></button></div></div>
      <div className="space-y-4"><Label>Rankings</Label>{[...comps].sort((a,b)=>b.sentiment-a.sentiment).map((c,i)=>(<div key={c.id} className="flex items-center gap-3 p-3 rounded-xl" style={{background:i===0?'var(--green)30':i===1?'var(--amber)20':'var(--border)'}}><span className="text-lg font-bold text-[var(--muted)] w-5">{i+1}</span><div className="flex-1"><p className="text-sm font-semibold text-[var(--text)]">{c.name}</p><p className="text-[10px] text-[var(--muted)]">{c.reviews.toLocaleString()} reviews</p></div><p className="text-base font-bold" style={{color:i===0?'var(--green)':i===1?'var(--amber)':'var(--muted)'}}>{c.sentiment}%</p></div>))}{you&&<Card><p className="text-xs font-semibold text-[var(--text)] mb-2">Your Position</p>{you.sentiment===best?<p className="text-xs text-[var(--green)] flex items-center gap-1"><CheckCircle size={11}/>🏆 Leading! Maintain quality.</p>:<p className="text-xs text-[var(--amber)] flex items-center gap-1"><AlertCircle size={11}/>Gap of {(best-you.sentiment).toFixed(0)}% to leader.</p>}</Card>}</div>
    </div>
  )
}

// ─── TOOL 9: Velocity & Alerts ────────────────────────────────────
function VelocityTool() {
  const [alerts,setAlerts]=useLocalStore('alerts',[{id:1,metric:'Sentiment Drop',threshold:10,window:'24h',active:true},{id:2,metric:'Negative Surge',threshold:30,window:'1h',active:true},{id:3,metric:'Review Flood',threshold:50,window:'6h',active:false},{id:4,metric:'Rating Below',threshold:3.5,window:'7d',active:true}])
  const [daily,setDaily]=useState(''); const [avg,setAvg]=useState(''); const [newMetric,setNewMetric]=useState(''); const [newThreshold,setNewThreshold]=useState('')
  const d=parseFloat(daily),a=parseFloat(avg); const vel=d&&a?((d-a)/a*100).toFixed(1):null; const trend=vel!==null?parseFloat(vel):null
  const STATE=[{min:20,label:'Viral 🔥',c:'#f97316'},{min:10,label:'Surging 📈',c:'var(--green)'},{min:0,label:'Growing ✅',c:'#84cc16'},{min:-10,label:'Slowing ⚠️',c:'var(--amber)'},{min:-999,label:'Declining 📉',c:'var(--red)'}]
  const state=trend!==null?STATE.find(s=>trend>=s.min):null
  const toggle=(id)=>setAlerts(alerts.map(a=>a.id===id?{...a,active:!a.active}:a))
  const addAlert=()=>{if(!newMetric||!newThreshold)return;setAlerts([...alerts,{id:Date.now(),metric:newMetric,threshold:parseFloat(newThreshold),window:'24h',active:true}]);setNewMetric('');setNewThreshold('')}
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-5"><Label>Velocity Meter</Label><div className="grid grid-cols-2 gap-3"><div><label className="text-xs text-[var(--muted)]">Today's Reviews</label><input className="input text-sm mt-1 w-full" type="number" placeholder="45" value={daily} onChange={e=>setDaily(e.target.value)}/></div><div><label className="text-xs text-[var(--muted)]">Daily Average</label><input className="input text-sm mt-1 w-full" type="number" placeholder="30" value={avg} onChange={e=>setAvg(e.target.value)}/></div></div>{state&&(<Card className="text-center space-y-2" style={{borderColor:`${state.c}40`}}><p className="text-3xl">{state.label.split(' ')[1]}</p><p className="text-3xl font-bold" style={{color:state.c}}>{trend>=0?'+':''}{vel}%</p><p className="text-sm font-semibold" style={{color:state.c}}>{state.label.split(' ')[0]} momentum</p></Card>)}</div>
      <div className="space-y-4"><div className="flex items-center justify-between"><Label>Alert Rules</Label><span className="text-[10px] text-[var(--green)]">{alerts.filter(a=>a.active).length} active</span></div><div className="space-y-2 max-h-60 overflow-y-auto">{alerts.map(a=>(<Card key={a.id} className={`transition-all ${a.active?'border-[var(--brand)]/30':''}`}><div className="flex items-center justify-between"><div><p className="text-xs font-semibold text-[var(--text)]">{a.metric}</p><p className="text-[10px] text-[var(--muted)]">≥{a.threshold} in {a.window}</p></div><button onClick={()=>toggle(a.id)} className="w-10 h-5 rounded-full relative transition-all" style={{background:a.active?'var(--brand)':'var(--border)'}}><div className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all" style={{left:a.active?'calc(100% - 18px)':'2px'}}/></button></div></Card>))}</div><div className="flex gap-2"><input className="input text-xs flex-1" placeholder="Metric name" value={newMetric} onChange={e=>setNewMetric(e.target.value)}/><input className="input text-xs w-20" placeholder="Threshold" type="number" value={newThreshold} onChange={e=>setNewThreshold(e.target.value)}/><button onClick={addAlert} className="btn-primary px-2"><Plus size={12}/></button></div></div>
    </div>
  )
}

// ─── TOOL 10: Source Blender ──────────────────────────────────────
function SourceBlender() {
  const [sources,setSources]=useLocalStore('sources',[{id:1,name:'Trustpilot',weight:40,reviews:1240,avg:4.2,trend:2},{id:2,name:'Amazon',weight:30,reviews:3100,avg:3.9,trend:-1},{id:3,name:'Yelp',weight:20,reviews:540,avg:4.5,trend:3},{id:4,name:'G2',weight:10,reviews:210,avg:4.7,trend:1}])
  const [newName,setNewName]=useState('')
  const totalW=sources.reduce((s,x)=>s+x.weight,0); const blended=sources.length>0?sources.reduce((acc,s)=>acc+(s.avg*(s.weight/totalW)),0).toFixed(2):0
  const totalR=sources.reduce((s,x)=>s+x.reviews,0); const weightedTrend=sources.length>0?(sources.reduce((acc,s)=>acc+(s.trend*(s.weight/totalW)),0)).toFixed(1):0
  const update=(id,field,val)=>setSources(sources.map(s=>s.id===id?{...s,[field]:parseFloat(val)||0}:s))
  const remove=(id)=>setSources(sources.filter(s=>s.id!==id))
  const add=()=>{if(!newName.trim())return;setSources([...sources,{id:Date.now(),name:newName.trim(),weight:10,reviews:0,avg:4.0,trend:0}]);setNewName('')}
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4"><Label>Source Configuration</Label><div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">{sources.map(s=>(<Card key={s.id} className="space-y-3"><div className="flex items-center justify-between"><p className="text-sm font-semibold text-[var(--text)]">{s.name}</p><button onClick={()=>remove(s.id)} className="text-[var(--dim)] hover:text-[var(--red)]"><Trash2 size={10}/></button></div><div className="grid grid-cols-3 gap-2">{[{label:'Weight %',field:'weight',val:s.weight},{label:'Avg Rating',field:'avg',val:s.avg},{label:'Trend %',field:'trend',val:s.trend}].map(f=>(<div key={f.field}><p className="text-[9px] text-[var(--muted)]">{f.label}</p><input className="input text-xs w-full mt-0.5" type="number" step={f.field==='avg'?'0.1':'1'} value={f.val} onChange={e=>update(s.id,f.field,e.target.value)}/></div>))}</div><div className="flex items-center gap-2"><div className="flex-1 h-1.5 bg-[var(--border)] rounded-full overflow-hidden"><div className="h-full rounded-full" style={{width:`${totalW>0?s.weight/totalW*100:0}%`,background:'var(--grad)'}}/></div><span className="text-[10px] font-mono text-[var(--muted)]">{totalW>0?Math.round(s.weight/totalW*100):0}%</span></div></Card>))}</div><div className="flex gap-2"><input className="input text-sm flex-1" placeholder="Add source..." value={newName} onChange={e=>setNewName(e.target.value)}/><button onClick={add} className="btn-primary px-3"><Plus size={14}/></button></div></div>
      <div className="space-y-4"><Label>Blended Score</Label><div className="rounded-2xl p-6 text-center space-y-2" style={{background:'var(--grad)'}}><p className="text-white/70 text-sm">Weighted Average Rating</p><p className="text-6xl font-display font-bold text-white">⭐ {blended}</p><p className="text-white/70 text-sm">{totalR.toLocaleString()} total reviews</p><span className={`text-xs font-semibold ${parseFloat(weightedTrend)>=0?'text-green-300':'text-red-300'}`}>{parseFloat(weightedTrend)>=0?'↑':'↓'}{Math.abs(weightedTrend)}% trend</span></div>{[...sources].sort((a,b)=>b.avg-a.avg).map((s,i)=>(<div key={s.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-[var(--bg)] border border-[var(--border)]"><span className="text-sm font-bold text-[var(--muted)] w-4">{i+1}</span><div className="flex-1"><p className="text-xs font-medium text-[var(--text)]">{s.name}</p><p className="text-[9px] text-[var(--muted)]">{s.reviews.toLocaleString()} reviews</p></div><div className="text-right"><p className="text-sm font-bold text-[var(--text)]">⭐{s.avg}</p><p className="text-[9px]" style={{color:s.trend>=0?'var(--green)':'var(--red)'}}>{s.trend>=0?'↑':'↓'}{Math.abs(s.trend)}%</p></div></div>))}</div>
    </div>
  )
}

// ─── TOOL 11: AI Review Reply Generator ──────────────────────────
function AIReplyTool() {
  const [reviewText, setReviewText] = useState('')
  const [sentiment, setSentiment] = useState('positive')
  const [tone, setTone] = useState('professional')
  const [reply, setReply] = useState('')
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useLocalStore('saved_replies', [])

  const generate = async () => {
    if (!reviewText.trim()) return
    setLoading(true)
    try {
      const r = await AI.genResp(reviewText, sentiment)
      setReply(r.data?.response || r.data?.reply || 'No response generated.')
    } catch {
      // Fallback local generation
      const templates = {
        positive: `Thank you so much for your wonderful review! We're thrilled to hear about your positive experience. Your feedback means the world to our team and motivates us to continue delivering exceptional service. We look forward to serving you again soon!`,
        negative: `Thank you for sharing your feedback. We sincerely apologize for the experience you had — this is not the standard we hold ourselves to. We'd love the opportunity to make this right. Please reach out to us directly at support@yourcompany.com so we can resolve this personally.`,
        neutral:  `Thank you for taking the time to leave a review. We appreciate your honest feedback and are always looking for ways to improve. If there's anything specific we can do better, we'd love to hear from you directly.`,
      }
      setReply(templates[sentiment] || templates.neutral)
    }
    setLoading(false)
  }

  const saveReply = () => {
    if (!reply) return
    setSaved([{id:Date.now(), review: reviewText.slice(0,60)+'...', reply, sentiment, time: new Date().toLocaleTimeString()}, ...saved.slice(0,9)])
  }

  const copyReply = () => { navigator.clipboard.writeText(reply).catch(()=>{}) }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <Label>Review Text</Label>
        <textarea className="input text-sm w-full resize-none" rows={5} placeholder="Paste customer review here..." value={reviewText} onChange={e=>setReviewText(e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-xs text-[var(--muted)]">Sentiment</label><select className="input text-sm mt-1 w-full" value={sentiment} onChange={e=>setSentiment(e.target.value)}><option value="positive">Positive</option><option value="negative">Negative</option><option value="neutral">Neutral</option></select></div>
          <div><label className="text-xs text-[var(--muted)]">Reply Tone</label><select className="input text-sm mt-1 w-full" value={tone} onChange={e=>setTone(e.target.value)}><option value="professional">Professional</option><option value="friendly">Friendly</option><option value="apologetic">Apologetic</option><option value="enthusiastic">Enthusiastic</option></select></div>
        </div>
        <button onClick={generate} disabled={loading||!reviewText.trim()} className="btn-primary w-full justify-center">
          {loading?<><RefreshCw size={14} className="animate-spin"/>Generating...</>:<><Sparkles size={14}/>Generate AI Reply</>}
        </button>
        {reply && (
          <Card className="space-y-3">
            <div className="flex items-center justify-between"><Label>Generated Reply</Label><div className="flex gap-2"><button onClick={copyReply} className="btn-ghost text-[10px]">Copy</button><button onClick={saveReply} className="btn-ghost text-[10px]"><Save size={10}/>Save</button></div></div>
            <p className="text-sm text-[var(--text2)] leading-relaxed">{reply}</p>
          </Card>
        )}
      </div>
      <div className="space-y-3">
        <Label>Saved Replies ({saved.length})</Label>
        {saved.length===0?<Muted>No saved replies yet</Muted>:saved.map(s=>(<Card key={s.id} className="space-y-2"><div className="flex justify-between"><p className="text-[10px] text-[var(--muted)] truncate">{s.review}</p><span className="text-[9px] text-[var(--dim)]">{s.time}</span></div><p className="text-xs text-[var(--text2)] leading-relaxed line-clamp-3">{s.reply}</p><button onClick={()=>navigator.clipboard.writeText(s.reply).catch(()=>{})} className="text-[10px] text-[var(--brand)] hover:underline">Copy reply</button></Card>))}
      </div>
    </div>
  )
}

// ─── TOOL 12: Text Utilities ─────────────────────────────────────
function TextUtilTool() {
  const [input, setInput] = useState('')
  const [tab, setTab] = useState('stats')
  const words = input.trim() ? input.trim().split(/\s+/) : []
  const sentences = input.split(/[.!?]+/).filter(s=>s.trim().length>0)
  const chars = input.length; const charNoSpace = input.replace(/\s/g,'').length
  const readTime = Math.max(1,Math.round(words.length/200))
  const freq = words.reduce((acc,w)=>{const k=w.toLowerCase().replace(/[^a-z]/g,'');if(k.length>2)acc[k]=(acc[k]||0)+1;return acc},{})
  const topWords = Object.entries(freq).sort((a,b)=>b[1]-a[1]).slice(0,10)
  const [result, setResult] = useState('')

  const transforms = {
    UPPERCASE: v=>v.toUpperCase(),
    lowercase: v=>v.toLowerCase(),
    'Title Case': v=>v.replace(/\w\S*/g,t=>t[0].toUpperCase()+t.slice(1).toLowerCase()),
    'Sentence case': v=>v.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g,c=>c.toUpperCase()),
    Reverse: v=>v.split('').reverse().join(''),
    'Remove extra spaces': v=>v.replace(/\s+/g,' ').trim(),
    'Remove line breaks': v=>v.replace(/\n/g,' '),
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-3">
        <Label>Input Text</Label>
        <textarea className="input text-sm w-full resize-none" rows={8} placeholder="Paste or type any text..." value={input} onChange={e=>setInput(e.target.value)}/>
        <div className="flex gap-1 flex-wrap">{['stats','transform','keywords'].map(t=>(<button key={t} onClick={()=>setTab(t)} className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${tab===t?'text-white border-transparent':'border-[var(--border)] text-[var(--muted)]'}`} style={tab===t?{background:'var(--grad)'}:{}}>{t.charAt(0).toUpperCase()+t.slice(1)}</button>))}</div>
      </div>
      <div className="space-y-3">
        {tab==='stats'&&(<div className="space-y-3"><div className="grid grid-cols-2 gap-3">{[{label:'Words',val:words.length},{label:'Characters',val:chars},{label:'Chars (no spaces)',val:charNoSpace},{label:'Sentences',val:sentences.length},{label:'Paragraphs',val:input.split(/\n\n+/).filter(p=>p.trim()).length},{label:'Read time',val:`~${readTime} min`}].map(s=>(<Card key={s.label} className="text-center"><p className="text-[10px] text-[var(--muted)]">{s.label}</p><p className="text-xl font-bold text-[var(--text)] mt-1">{s.val}</p></Card>))}</div></div>)}
        {tab==='transform'&&(<div className="space-y-3"><Label>Apply transformation</Label>{Object.entries(transforms).map(([name,fn])=>(<button key={name} onClick={()=>setResult(fn(input))} className="w-full text-left p-2.5 rounded-lg border border-[var(--border)] text-xs text-[var(--text)] hover:border-[var(--brand)]/40 hover:bg-[var(--card2)] transition-all">{name}</button>))}{result&&<Card><div className="flex justify-between mb-1"><p className="text-[10px] text-[var(--muted)]">Result</p><button onClick={()=>navigator.clipboard.writeText(result).catch(()=>{})} className="text-[10px] text-[var(--brand)]">Copy</button></div><p className="text-xs text-[var(--text2)] whitespace-pre-wrap">{result.slice(0,300)}{result.length>300?'...':''}</p></Card>}</div>)}
        {tab==='keywords'&&(<div className="space-y-3"><Label>Top Keywords</Label>{topWords.length===0?<Muted>Type text to see keywords</Muted>:topWords.map(([w,c])=>(<div key={w} className="flex items-center gap-3"><span className="text-xs text-[var(--text)] w-24 truncate font-medium">{w}</span><div className="flex-1 h-2 bg-[var(--border)] rounded-full overflow-hidden"><div className="h-full rounded-full" style={{width:`${c/topWords[0][1]*100}%`,background:'var(--grad)'}}/></div><span className="text-xs font-mono text-[var(--muted)] w-6 text-right">{c}</span></div>))}</div>)}
      </div>
    </div>
  )
}

// ─── TOOL 13: Password & Hash Generator ──────────────────────────
function PasswordTool() {
  const [tab, setTab] = useState('password')
  const [len, setLen] = useState(16)
  const [opts, setOpts] = useState({upper:true,lower:true,numbers:true,symbols:true})
  const [password, setPassword] = useState('')
  const [hashInput, setHashInput] = useState('')
  const [hashResult, setHashResult] = useState('')
  const [strength, setStrength] = useState('')

  const chars = (opts.upper?'ABCDEFGHIJKLMNOPQRSTUVWXYZ':'')+(opts.lower?'abcdefghijklmnopqrstuvwxyz':'')+(opts.numbers?'0123456789':'')+(opts.symbols?'!@#$%^&*()-_=+[]{}|;:,.<>?':'')

  const generate = () => {
    if(!chars.length)return
    let pwd = ''
    for(let i=0;i<len;i++) pwd+=chars[Math.floor(Math.random()*chars.length)]
    setPassword(pwd)
    const s = (opts.upper?1:0)+(opts.lower?1:0)+(opts.numbers?1:0)+(opts.symbols?1:0)
    setStrength(len>=20&&s>=4?'Very Strong':len>=16&&s>=3?'Strong':len>=12&&s>=2?'Medium':'Weak')
  }

  const hashText = async () => {
    if(!hashInput)return
    try {
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(hashInput))
      setHashResult(Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join(''))
    } catch { setHashResult('SHA-256 not available in this context') }
  }

  const sColor = {Weak:'var(--red)',Medium:'var(--amber)',Strong:'var(--green)','Very Strong':'var(--brand)'}

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4"><div className="flex gap-2">{['password','hash'].map(t=>(<button key={t} onClick={()=>setTab(t)} className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${tab===t?'text-white border-transparent':'border-[var(--border)] text-[var(--muted)]'}`} style={tab===t?{background:'var(--grad)'}:{}}>{t==='password'?'Password Generator':'Hash Generator'}</button>))}</div>
        {tab==='password'&&(<>
          <div><label className="text-xs text-[var(--muted)]">Length: {len}</label><input type="range" min={8} max={64} value={len} onChange={e=>setLen(+e.target.value)} className="w-full mt-2 accent-[var(--brand)]"/></div>
          <div className="grid grid-cols-2 gap-2">{Object.entries(opts).map(([k,v])=>(<button key={k} onClick={()=>setOpts(o=>({...o,[k]:!v}))} className={`text-xs p-2 rounded-lg border transition-all ${v?'text-white border-transparent':'border-[var(--border)] text-[var(--muted)]'}`} style={v?{background:'var(--grad)'}:{}}>{k.charAt(0).toUpperCase()+k.slice(1)}</button>))}</div>
          <button onClick={generate} className="btn-primary w-full justify-center"><Shuffle size={14}/>Generate Password</button>
        </>)}
        {tab==='hash'&&(<>
          <textarea className="input text-sm w-full resize-none" rows={4} placeholder="Text to hash..." value={hashInput} onChange={e=>setHashInput(e.target.value)}/>
          <button onClick={hashText} disabled={!hashInput} className="btn-primary w-full justify-center"><Hash size={14}/>Generate SHA-256 Hash</button>
        </>)}
      </div>
      <div className="space-y-4">
        {tab==='password'&&password&&(<><Card><p className="text-[10px] text-[var(--muted)] mb-2">Generated Password</p><p className="font-mono text-sm text-[var(--text)] break-all mb-3">{password}</p><div className="flex items-center justify-between"><span className="text-xs font-bold" style={{color:sColor[strength]||'var(--text)'}}>{strength}</span><button onClick={()=>navigator.clipboard.writeText(password).catch(()=>{})} className="btn-ghost text-xs">Copy</button></div></Card><div className="h-2 bg-[var(--border)] rounded-full overflow-hidden"><div className="h-full rounded-full transition-all" style={{width:strength==='Weak'?'25%':strength==='Medium'?'50%':strength==='Strong'?'75%':'100%',background:sColor[strength]||'var(--brand)'}}/></div></>)}
        {tab==='hash'&&hashResult&&(<Card><p className="text-[10px] text-[var(--muted)] mb-2">SHA-256 Hash</p><p className="font-mono text-xs text-[var(--text)] break-all mb-3">{hashResult}</p><button onClick={()=>navigator.clipboard.writeText(hashResult).catch(()=>{})} className="btn-ghost text-xs">Copy hash</button></Card>)}
        {((tab==='password'&&!password)||(tab==='hash'&&!hashResult))&&(<div className="flex flex-col items-center justify-center h-40 text-center"><Lock size={28} className="text-[var(--muted)] mb-2"/><Muted>Configure and generate above</Muted></div>)}
      </div>
    </div>
  )
}

// ─── TOOL 14: Color Palette Generator ────────────────────────────
function ColorTool() {
  const [base, setBase] = useState('#1078c2')
  const [palette, setPalette] = useState([])
  const [saved, setSaved] = useLocalStore('palettes', [])

  const hexToRgb = h => { const r=parseInt(h.slice(1,3),16),g=parseInt(h.slice(3,5),16),b=parseInt(h.slice(5,7),16);return{r,g,b} }
  const rgbToHex = (r,g,b) => '#'+[r,g,b].map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join('')
  const lighten = (h,p) => { const {r,g,b}=hexToRgb(h);return rgbToHex(r+(255-r)*p,g+(255-g)*p,b+(255-b)*p) }
  const darken  = (h,p) => { const {r,g,b}=hexToRgb(h);return rgbToHex(r*(1-p),g*(1-p),b*(1-p)) }

  const generate = () => {
    const shades = [lighten(base,.7),lighten(base,.5),lighten(base,.3),base,darken(base,.2),darken(base,.4),darken(base,.6)]
    setPalette(shades)
  }

  useEffect(()=>{generate()},[base])

  const savePalette = () => setSaved([{id:Date.now(),colors:palette,base},...saved.slice(0,4)])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div><Label>Base Color</Label><div className="flex items-center gap-3"><input type="color" value={base} onChange={e=>setBase(e.target.value)} className="w-16 h-10 rounded-lg cursor-pointer border border-[var(--border)]"/><input className="input text-sm flex-1 font-mono" value={base} onChange={e=>{if(/^#[0-9a-fA-F]{6}$/.test(e.target.value))setBase(e.target.value);else setBase(e.target.value)}} placeholder="#1078c2"/></div></div>
        {palette.length>0&&(<div className="space-y-2"><div className="flex justify-between items-center mb-1"><Label>Generated Palette</Label><button onClick={savePalette} className="btn-ghost text-xs"><Save size={10}/>Save</button></div>{palette.map((c,i)=>(<div key={i} className="flex items-center gap-3 p-2.5 rounded-lg border border-[var(--border)] cursor-pointer hover:bg-[var(--card2)]" onClick={()=>navigator.clipboard.writeText(c).catch(()=>{})}><div className="w-10 h-7 rounded-md" style={{background:c}}/><span className="font-mono text-xs text-[var(--text)]">{c}</span><span className="text-[10px] text-[var(--muted)] ml-auto">{i===3?'Base':i<3?`+${(3-i)*20}% lighter`:` ${(i-3)*20}% darker`}</span></div>))}</div>)}
      </div>
      <div className="space-y-3"><Label>Saved Palettes</Label>{saved.length===0?<Muted>No saved palettes</Muted>:saved.map(p=>(<Card key={p.id} className="space-y-2"><p className="text-[10px] text-[var(--muted)]">Base: {p.base}</p><div className="flex gap-1">{p.colors.map((c,i)=>(<div key={i} className="flex-1 h-8 rounded-md cursor-pointer" style={{background:c}} onClick={()=>navigator.clipboard.writeText(c).catch(()=>{})} title={c}/>))}</div></Card>))}</div>
    </div>
  )
}

// ─── TOOL 15: Stopwatch & Timer ───────────────────────────────────
function TimerTool() {
  const [tab,setTab]=useState('stopwatch')
  const [sw,setSw]=useState(0); const [swRun,setSwRun]=useState(false); const [laps,setLaps]=useState([])
  const [timerMin,setTimerMin]=useState('5'); const [timerSec,setTimerSec]=useState('0'); const [remaining,setRemaining]=useState(null); const [timerRun,setTimerRun]=useState(false)
  const swRef=useRef(null); const timerRef=useRef(null); const startRef=useRef(null)

  useEffect(()=>{
    if(swRun){startRef.current=Date.now()-sw;swRef.current=setInterval(()=>setSw(Date.now()-startRef.current),50)}
    else clearInterval(swRef.current)
    return()=>clearInterval(swRef.current)
  },[swRun])

  useEffect(()=>{
    if(timerRun&&remaining>0){timerRef.current=setInterval(()=>setRemaining(r=>r>0?r-1:0),1000)}
    else{clearInterval(timerRef.current);if(remaining===0&&timerRun){setTimerRun(false)}}
    return()=>clearInterval(timerRef.current)
  },[timerRun,remaining])

  const fmt=ms=>{const t=Math.floor(ms/1000);const h=Math.floor(t/3600);const m=Math.floor((t%3600)/60);const s=t%60;return`${h?h+':':''}${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}.${String(Math.floor((ms%1000)/10)).padStart(2,'0')}`}
  const fmtTimer=s=>`${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`
  const startTimer=()=>{const total=(parseInt(timerMin)||0)*60+(parseInt(timerSec)||0);if(total>0){setRemaining(total);setTimerRun(true)}}
  const pct=remaining!==null?remaining/((parseInt(timerMin)||0)*60+(parseInt(timerSec)||0)+0.001)*100:100

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4"><div className="flex gap-2">{['stopwatch','timer'].map(t=>(<button key={t} onClick={()=>setTab(t)} className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${tab===t?'text-white border-transparent':'border-[var(--border)] text-[var(--muted)]'}`} style={tab===t?{background:'var(--grad)'}:{}}>{t.charAt(0).toUpperCase()+t.slice(1)}</button>))}</div>
        {tab==='stopwatch'&&(<><Card className="text-center"><p className="text-5xl font-mono font-bold text-[var(--text)]">{fmt(sw)}</p></Card><div className="flex gap-2"><button onClick={()=>setSwRun(r=>!r)} className={`btn-primary flex-1 justify-center ${swRun?'bg-red-500':''}`}>{swRun?'Pause':'Start'}</button><button onClick={()=>{if(swRun)setLaps(l=>[{time:fmt(sw),id:Date.now()},...l])}} disabled={!swRun} className="btn-secondary flex-1 justify-center">Lap</button><button onClick={()=>{setSwRun(false);setSw(0);setLaps([])}} className="btn-secondary flex-1 justify-center">Reset</button></div></>)}
        {tab==='timer'&&(<><div className="grid grid-cols-2 gap-3"><div><label className="text-xs text-[var(--muted)]">Minutes</label><input className="input text-sm mt-1 w-full" type="number" min="0" value={timerMin} onChange={e=>setTimerMin(e.target.value)}/></div><div><label className="text-xs text-[var(--muted)]">Seconds</label><input className="input text-sm mt-1 w-full" type="number" min="0" max="59" value={timerSec} onChange={e=>setTimerSec(e.target.value)}/></div></div>{remaining!==null&&(<><Card className="text-center"><p className="text-5xl font-mono font-bold" style={{color:remaining<10?'var(--red)':'var(--text)'}}>{fmtTimer(remaining)}</p></Card><div className="h-3 bg-[var(--border)] rounded-full overflow-hidden"><div className="h-full rounded-full transition-all" style={{width:`${pct}%`,background:remaining<10?'var(--red)':'var(--grad)'}}/></div></>)}<div className="flex gap-2">{!timerRun?<button onClick={startTimer} className="btn-primary flex-1 justify-center">Start</button>:<button onClick={()=>setTimerRun(false)} className="btn-primary flex-1 justify-center">Pause</button>}<button onClick={()=>{setTimerRun(false);setRemaining(null)}} className="btn-secondary flex-1 justify-center">Reset</button></div></>)}
      </div>
      <div className="space-y-3"><Label>Laps</Label>{laps.length===0?<Muted>No laps recorded</Muted>:laps.map((l,i)=>(<div key={l.id} className="flex items-center justify-between p-2.5 rounded-lg border border-[var(--border)]"><span className="text-xs text-[var(--muted)]">Lap {laps.length-i}</span><span className="text-xs font-mono font-bold text-[var(--text)]">{l.time}</span></div>))}</div>
    </div>
  )
}

// ─── TOOL 16: Review Batch Importer ──────────────────────────────
function BatchImporter() {
  const [text, setText] = useState('')
  const [parsed, setParsed] = useState([])
  const [tab, setTab] = useState('paste')

  const parse = () => {
    const lines = text.split('\n').map(l=>l.trim()).filter(Boolean)
    setParsed(lines.map((l,i)=>({id:i,text:l,chars:l.length,words:l.split(/\s+/).length})))
  }

  const sample = `Great product, very happy with my purchase!\nThe delivery was slow but item quality is excellent.\nTerrible experience, packaging was damaged on arrival.\nAbsolutely love this! Will definitely buy again.\nNot what I expected based on the description.`

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div className="flex gap-2">{['paste','sample'].map(t=>(<button key={t} onClick={()=>setTab(t)} className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${tab===t?'text-white border-transparent':'border-[var(--border)] text-[var(--muted)]'}`} style={tab===t?{background:'var(--grad)'}:{}}>{t.charAt(0).toUpperCase()+t.slice(1)}</button>))}</div>
        {tab==='paste'&&(<><textarea className="input text-sm w-full resize-none" rows={8} placeholder="Paste reviews — one per line..." value={text} onChange={e=>setText(e.target.value)}/><button onClick={parse} disabled={!text.trim()} className="btn-primary w-full justify-center"><Database size={14}/>Parse Reviews</button></>)}
        {tab==='sample'&&(<><p className="text-xs text-[var(--muted)] leading-relaxed">{sample}</p><button onClick={()=>{setText(sample);setParsed(sample.split('\n').map((l,i)=>({id:i,text:l,chars:l.length,words:l.split(/\s+/).length})));setTab('paste')}} className="btn-primary w-full justify-center">Load Sample</button></>)}
      </div>
      <div className="space-y-3">
        <Label>{parsed.length} Reviews Parsed</Label>
        {parsed.length===0?<Muted>Parse reviews to preview them here</Muted>:(<><div className="grid grid-cols-3 gap-2 mb-3">{[{l:'Total',v:parsed.length},{l:'Avg Words',v:parsed.length?Math.round(parsed.reduce((s,r)=>s+r.words,0)/parsed.length):0},{l:'Total Chars',v:parsed.reduce((s,r)=>s+r.chars,0)}].map(s=>(<Card key={s.l} className="text-center"><p className="text-[10px] text-[var(--muted)]">{s.l}</p><p className="text-lg font-bold text-[var(--text)] mt-1">{s.v}</p></Card>))}</div><div className="space-y-2 max-h-72 overflow-y-auto">{parsed.map((r,i)=>(<div key={r.id} className="p-2.5 rounded-lg border border-[var(--border)] hover:bg-[var(--card2)]"><div className="flex justify-between mb-1"><span className="text-[10px] text-[var(--muted)] font-mono">#{i+1}</span><span className="text-[10px] text-[var(--dim)]">{r.words}w · {r.chars}ch</span></div><p className="text-xs text-[var(--text2)]">{r.text}</p></div>))}</div></>)}
      </div>
    </div>
  )
}

// ─── TOOL 17: Goal & KPI Tracker ─────────────────────────────────
function GoalTracker() {
  const [goals,setGoals]=useLocalStore('goals',[{id:1,name:'Monthly Reviews',target:500,current:312,unit:'reviews',color:'#0ea5e9'},{id:2,name:'Sentiment Score',target:80,current:74,unit:'%',color:'#34d399'},{id:3,name:'Avg Rating',target:4.5,current:4.2,unit:'stars',color:'#f59e0b'},{id:4,name:'Response Rate',target:95,current:87,unit:'%',color:'#a78bfa'}])
  const [newName,setNewName]=useState(''); const [newTarget,setNewTarget]=useState(''); const [newUnit,setNewUnit]=useState('')
  const add=()=>{if(!newName||!newTarget)return;const COLORS=['#0ea5e9','#34d399','#a78bfa','#f59e0b','#f97316','#ec4899'];setGoals([...goals,{id:Date.now(),name:newName,target:parseFloat(newTarget),current:0,unit:newUnit||'',color:COLORS[goals.length%COLORS.length]}]);setNewName('');setNewTarget('');setNewUnit('')}
  const update=(id,field,val)=>setGoals(goals.map(g=>g.id===id?{...g,[field]:parseFloat(val)||0}:g))
  const remove=(id)=>setGoals(goals.filter(g=>g.id!==id))
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-3"><Label>KPI Goals</Label><div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">{goals.map(g=>{const pct=Math.min(g.current/g.target*100,100);const done=g.current>=g.target;return(<Card key={g.id} className="space-y-3"><div className="flex items-center justify-between"><div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{background:g.color}}/><p className="text-sm font-semibold text-[var(--text)]">{g.name}</p></div><div className="flex items-center gap-2">{done&&<span className="text-[9px] text-white px-1.5 py-0.5 rounded bg-[var(--green)]">✅ DONE</span>}<button onClick={()=>remove(g.id)} className="text-[var(--dim)] hover:text-[var(--red)]"><Trash2 size={10}/></button></div></div><div className="grid grid-cols-2 gap-2"><div><label className="text-[9px] text-[var(--muted)]">Current</label><input className="input text-xs w-full mt-0.5" type="number" value={g.current} onChange={e=>update(g.id,'current',e.target.value)}/></div><div><label className="text-[9px] text-[var(--muted)]">Target</label><input className="input text-xs w-full mt-0.5" type="number" value={g.target} onChange={e=>update(g.id,'target',e.target.value)}/></div></div><div className="flex items-center gap-2"><div className="flex-1 h-3 bg-[var(--border)] rounded-full overflow-hidden"><div className="h-full rounded-full transition-all" style={{width:`${pct}%`,background:done?'var(--green)':g.color}}/></div><span className="text-[10px] font-bold" style={{color:done?'var(--green)':g.color}}>{pct.toFixed(0)}%</span></div><p className="text-[10px] text-[var(--muted)]">{g.current} / {g.target} {g.unit}</p></Card>)})}
        </div><div className="grid grid-cols-3 gap-2"><input className="input text-xs" placeholder="Goal name" value={newName} onChange={e=>setNewName(e.target.value)}/><input className="input text-xs" placeholder="Target" type="number" value={newTarget} onChange={e=>setNewTarget(e.target.value)}/><input className="input text-xs" placeholder="Unit" value={newUnit} onChange={e=>setNewUnit(e.target.value)}/></div><button onClick={add} disabled={!newName||!newTarget} className="btn-primary w-full justify-center"><Plus size={14}/>Add Goal</button></div>
      <div className="space-y-4"><Label>Summary</Label><div className="grid grid-cols-2 gap-3">{[{label:'Total Goals',val:goals.length},{label:'Completed',val:goals.filter(g=>g.current>=g.target).length},{label:'In Progress',val:goals.filter(g=>g.current>0&&g.current<g.target).length},{label:'Not Started',val:goals.filter(g=>g.current===0).length}].map(s=>(<Card key={s.label} className="text-center"><p className="text-[10px] text-[var(--muted)]">{s.label}</p><p className="text-2xl font-bold text-[var(--text)] mt-1">{s.val}</p></Card>))}</div><Card><p className="text-xs font-semibold text-[var(--text)] mb-3">Progress Overview</p>{goals.map(g=>(<div key={g.id} className="flex items-center gap-2 mb-2"><span className="text-[10px] text-[var(--muted)] w-24 truncate">{g.name}</span><div className="flex-1 h-2 bg-[var(--border)] rounded-full overflow-hidden"><div className="h-full rounded-full" style={{width:`${Math.min(g.current/g.target*100,100)}%`,background:g.color}}/></div><span className="text-[10px] font-bold" style={{color:g.color}}>{(g.current/g.target*100).toFixed(0)}%</span></div>))}</Card></div>
    </div>
  )
}

// ─── TOOL 18: Sentiment Breakdown Calculator ──────────────────────
function SentimentCalc() {
  const [reviews,setReviews]=useLocalStore('sent_reviews',[])
  const [input,setInput]=useState(''); const [sentiment,setSentiment]=useState('positive'); const [loading,setLoading]=useState(false)
  const pos=reviews.filter(r=>r.s==='positive').length; const neg=reviews.filter(r=>r.s==='negative').length; const neu=reviews.filter(r=>r.s==='neutral').length; const total=reviews.length
  const add=()=>{if(!input.trim())return;setReviews([{id:Date.now(),text:input.slice(0,80),s:sentiment},...reviews.slice(0,49)]);setInput('')}
  const clear=()=>setReviews([])
  const score=total>0?Math.round((pos-neg)/total*100):0
  const nps=total>0?Math.round((pos/total-neg/total)*100):0
  const BAR=[{label:'Positive',val:pos,c:'var(--green)'},{label:'Neutral',val:neu,c:'var(--amber)'},{label:'Negative',val:neg,c:'var(--red)'}]
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <Label>Manual Sentiment Entry</Label>
        <textarea className="input text-sm w-full resize-none" rows={4} placeholder="Enter review text..." value={input} onChange={e=>setInput(e.target.value)}/>
        <div className="flex gap-2">{['positive','neutral','negative'].map(s=>(<button key={s} onClick={()=>setSentiment(s)} className={`flex-1 text-xs py-2 rounded-lg border transition-all ${sentiment===s?'text-white border-transparent':'border-[var(--border)] text-[var(--muted)]'}`} style={sentiment===s?{background:s==='positive'?'var(--green)':s==='negative'?'var(--red)':'var(--amber)'}:{}}>{s.charAt(0).toUpperCase()+s.slice(1)}</button>))}</div>
        <button onClick={add} disabled={!input.trim()} className="btn-primary w-full justify-center"><Plus size={14}/>Add Review</button>
        <div className="space-y-2 max-h-48 overflow-y-auto">{reviews.map(r=>(<div key={r.id} className="flex items-center gap-2 p-2 rounded-lg border border-[var(--border)]"><div className="w-2 h-2 rounded-full flex-shrink-0" style={{background:r.s==='positive'?'var(--green)':r.s==='negative'?'var(--red)':'var(--amber)'}}/><p className="text-xs text-[var(--text2)] flex-1 truncate">{r.text}</p></div>))}</div>
      </div>
      <div className="space-y-4">
        <div className="flex justify-between"><Label>Live Analytics ({total} reviews)</Label>{total>0&&<button onClick={clear} className="text-[10px] text-[var(--muted)] hover:text-[var(--red)]">Clear all</button>}</div>
        {total===0?<Muted>Add reviews to see analytics</Muted>:(<>
          <div className="rounded-2xl p-5 text-center" style={{background:'var(--grad)'}}><p className="text-white/70 text-sm">Sentiment Score</p><p className="text-5xl font-display font-bold text-white">{score>0?'+':''}{score}</p><p className="text-white/70 text-xs mt-1">NPS equivalent: {nps>0?'+':''}{nps}</p></div>
          <div className="space-y-3">{BAR.map(b=>(<div key={b.label}><div className="flex justify-between text-xs mb-1"><span style={{color:b.c}} className="font-medium">{b.label}</span><span className="text-[var(--muted)]">{b.val} ({total>0?(b.val/total*100).toFixed(0):0}%)</span></div><div className="h-3 bg-[var(--border)] rounded-full overflow-hidden"><div className="h-full rounded-full transition-all" style={{width:`${total>0?b.val/total*100:0}%`,background:b.c}}/></div></div>))}
          </div>
        </>)}
      </div>
    </div>
  )
}

// ─── TOOL 19: URL Shortener / Link Manager ────────────────────────
function LinkManagerTool() {
  const [links,setLinks]=useLocalStore('links',[{id:1,label:'Dashboard Report Q4',url:'https://app.nestinsights.io/sessions/abc123',clicks:14,created:'2025-01-15'},{id:2,label:'Brand Health Export',url:'https://app.nestinsights.io/brand-health',clicks:7,created:'2025-01-18'}])
  const [newLabel,setNewLabel]=useState(''); const [newUrl,setNewUrl]=useState(''); const [copied,setCopied]=useState(null)
  const add=()=>{if(!newLabel.trim()||!newUrl.trim())return;setLinks([...links,{id:Date.now(),label:newLabel,url:newUrl,clicks:0,created:new Date().toISOString().split('T')[0]}]);setNewLabel('');setNewUrl('')}
  const remove=(id)=>setLinks(links.filter(l=>l.id!==id))
  const click=(id)=>{setLinks(links.map(l=>l.id===id?{...l,clicks:(l.clicks||0)+1}:l));navigator.clipboard.writeText(links.find(l=>l.id===id)?.url||'').catch(()=>{});setCopied(id);setTimeout(()=>setCopied(null),1500)}
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4"><Label>Saved Links ({links.length})</Label><div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">{links.map(l=>(<Card key={l.id} className="space-y-2"><div className="flex items-start justify-between"><div className="flex-1 min-w-0"><p className="text-sm font-semibold text-[var(--text)] truncate">{l.label}</p><p className="text-[10px] text-[var(--muted)] truncate">{l.url}</p></div><button onClick={()=>remove(l.id)} className="text-[var(--dim)] hover:text-[var(--red)] ml-2 flex-shrink-0"><Trash2 size={10}/></button></div><div className="flex items-center justify-between"><span className="text-[10px] text-[var(--muted)]">{l.clicks} clicks · {l.created}</span><button onClick={()=>click(l.id)} className={`text-xs px-3 py-1 rounded-lg transition-all ${copied===l.id?'bg-[var(--green)] text-white':'border border-[var(--border)] text-[var(--muted)] hover:border-[var(--brand)]'}`}>{copied===l.id?'Copied!':'Copy'}</button></div></Card>))}{links.length===0&&<Muted>No links saved yet</Muted>}</div></div>
      <div className="space-y-4"><Label>Add New Link</Label><input className="input text-sm w-full" placeholder="Label / Description" value={newLabel} onChange={e=>setNewLabel(e.target.value)}/><input className="input text-sm w-full" placeholder="Full URL" value={newUrl} onChange={e=>setNewUrl(e.target.value)}/><button onClick={add} disabled={!newLabel.trim()||!newUrl.trim()} className="btn-primary w-full justify-center"><Plus size={14}/>Add Link</button><Card><Label>Quick Stats</Label><div className="grid grid-cols-2 gap-3">{[{l:'Total Links',v:links.length},{l:'Total Clicks',v:links.reduce((s,l)=>s+(l.clicks||0),0)}].map(s=>(<div key={s.l} className="text-center"><p className="text-[10px] text-[var(--muted)]">{s.l}</p><p className="text-2xl font-bold text-[var(--text)] mt-1">{s.v}</p></div>))}</div></Card></div>
    </div>
  )
}

// ─── TOOL 20: Report Builder ──────────────────────────────────────
function ReportBuilder() {
  const [title,setTitle]=useLocalStore('report_title','Weekly Insights Report')
  const [sections,setSections]=useLocalStore('report_sections',[{id:1,heading:'Executive Summary',content:'This week we analysed 450 new reviews across 3 brands. Overall sentiment improved by +4.2% vs last week.',type:'text'},{id:2,heading:'Top Metrics',content:'Brand Health: 84/100 | Sentiment: 76% positive | Tickets: 23 open',type:'metrics'},{id:3,heading:'Key Findings',content:'• Delivery speed mentioned positively in 62% of reviews\n• Packaging complaints spiked on Thursday (+18%)\n• Competitor A sentiment dropped to 68% (down from 75%)',type:'text'}])
  const [newHeading,setNewHeading]=useState(''); const [newContent,setNewContent]=useState('')
  const add=()=>{if(!newHeading.trim())return;setSections([...sections,{id:Date.now(),heading:newHeading,content:newContent,type:'text'}]);setNewHeading('');setNewContent('')}
  const remove=(id)=>setSections(sections.filter(s=>s.id!==id))
  const update=(id,field,val)=>setSections(sections.map(s=>s.id===id?{...s,[field]:val}:s))
  const exportReport=()=>{
    const now=new Date().toLocaleDateString()
    const html=`<!DOCTYPE html><html><head><title>${title}</title><style>body{font-family:sans-serif;max-width:800px;margin:40px auto;padding:0 24px;color:#1a1a2e}h1{color:#1078c2;border-bottom:2px solid #1078c2;padding-bottom:8px}h2{color:#333;margin-top:32px}p,pre{line-height:1.6;white-space:pre-wrap}footer{margin-top:40px;color:#888;font-size:12px;border-top:1px solid #eee;padding-top:12px}</style></head><body><h1>${title}</h1><p style="color:#888">Generated: ${now} · NestInsights</p>${sections.map(s=>`<h2>${s.heading}</h2><p>${s.content}</p>`).join('')}<footer>Generated by NestInsights Report Builder</footer></body></html>`
    const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([html],{type:'text/html'}));a.download='report.html';a.click()
  }
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4"><div className="flex items-center justify-between"><Label>Report Sections</Label><button onClick={exportReport} className="btn-ghost text-xs flex items-center gap-1"><Download size={11}/>Export HTML</button></div><div><label className="text-xs text-[var(--muted)]">Report Title</label><input className="input text-sm mt-1 w-full font-semibold" value={title} onChange={e=>setTitle(e.target.value)}/></div><div className="space-y-3 max-h-72 overflow-y-auto pr-1">{sections.map((s,i)=>(<Card key={s.id} className="space-y-2"><div className="flex items-center justify-between"><input className="text-xs font-bold bg-transparent text-[var(--brand)] border-none outline-none flex-1" value={s.heading} onChange={e=>update(s.id,'heading',e.target.value)}/><button onClick={()=>remove(s.id)} className="text-[var(--dim)] hover:text-[var(--red)]"><Trash2 size={10}/></button></div><textarea className="input text-xs w-full resize-none" rows={3} value={s.content} onChange={e=>update(s.id,'content',e.target.value)}/></Card>))}</div><div className="space-y-2"><input className="input text-sm w-full" placeholder="Section heading..." value={newHeading} onChange={e=>setNewHeading(e.target.value)}/><textarea className="input text-sm w-full resize-none" rows={3} placeholder="Section content..." value={newContent} onChange={e=>setNewContent(e.target.value)}/><button onClick={add} disabled={!newHeading.trim()} className="btn-primary w-full justify-center"><Plus size={14}/>Add Section</button></div></div>
      <div className="space-y-4"><Label>Live Preview</Label><div className="rounded-xl border border-[var(--border)] p-5 max-h-[540px] overflow-y-auto bg-[var(--bg)]"><h1 className="text-lg font-bold text-[var(--brand)] pb-3 border-b border-[var(--border)] mb-4">{title}</h1>{sections.map(s=>(<div key={s.id} className="mb-5"><h2 className="text-sm font-bold text-[var(--text)] mb-2">{s.heading}</h2><p className="text-xs text-[var(--text2)] leading-relaxed whitespace-pre-line">{s.content}</p></div>))}<p className="text-[10px] text-[var(--dim)] border-t border-[var(--border)] pt-3">Generated by NestInsights · {new Date().toLocaleDateString()}</p></div></div>
    </div>
  )
}

// ─── TOOLS REGISTRY ──────────────────────────────────────────────
const TOOLS = [
  { id:'calc',      icon:Calculator,    label:'Calculator',           component:AdvancedCalc   },
  { id:'roi',       icon:DollarSign,    label:'Business Metrics',     component:ROITool        },
  { id:'budget',    icon:TrendingUp,    label:'Budget Tracker',       component:BudgetTool     },
  { id:'sessions',  icon:BarChart2,     label:'Session Dashboard',    component:SessionDashboard},
  { id:'store',     icon:Plug,          label:'Store Connect',        component:StoreTool      },
  { id:'notes',     icon:StickyNote,    label:'Smart Notes',          component:NotesTool      },
  { id:'nps',       icon:Users,         label:'NPS Calculator',       component:NPSTool        },
  { id:'compete',   icon:Target,        label:'Competitor Tracker',   component:CompetitorTool },
  { id:'velocity',  icon:Zap,           label:'Velocity & Alerts',    component:VelocityTool   },
  { id:'sources',   icon:Globe2,        label:'Source Blender',       component:SourceBlender  },
  { id:'aireply',   icon:MessageSquare, label:'AI Reply Generator',   component:AIReplyTool    },
  { id:'textutil',  icon:Type,          label:'Text Utilities',       component:TextUtilTool   },
  { id:'password',  icon:Lock,          label:'Password & Hash',      component:PasswordTool   },
  { id:'color',     icon:Palette,       label:'Color Palette',        component:ColorTool      },
  { id:'timer',     icon:Timer,         label:'Stopwatch & Timer',    component:TimerTool      },
  { id:'importer',  icon:Database,      label:'Batch Importer',       component:BatchImporter  },
  { id:'goals',     icon:ClipboardList, label:'Goal Tracker',         component:GoalTracker    },
  { id:'sentcalc',  icon:Percent,       label:'Sentiment Calculator', component:SentimentCalc  },
  { id:'links',     icon:Link,          label:'Link Manager',         component:LinkManagerTool},
  { id:'report',    icon:FileText,      label:'Report Builder',       component:ReportBuilder  },
]

// ─── MAIN PANEL ───────────────────────────────────────────────────
export default function ToolsPanel({ onClose }) {
  const [active, setActive] = useState('calc')
  const ActiveComp = TOOLS.find(t => t.id === active)?.component || AdvancedCalc
  const activeInfo = TOOLS.find(t => t.id === active)

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[var(--bg)]">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-4 bg-[var(--card)] border-b border-[var(--border)] flex-shrink-0">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{background:'var(--grad)'}}>
          {activeInfo && <activeInfo.icon size={15} className="text-white"/>}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-display font-bold text-[var(--text)]">{activeInfo?.label}</p>
          <p className="text-[10px] text-[var(--muted)]">Company Tools · {TOOLS.length} tools available</p>
        </div>
        <button onClick={onClose} className="btn-ghost p-2 text-[var(--muted)] hover:text-[var(--red)] transition-colors">
          <X size={18}/>
        </button>
      </div>

      {/* Tool tabs — scrollable */}
      <div className="flex gap-1 px-6 py-3 bg-[var(--card)] border-b border-[var(--border)] overflow-x-auto flex-shrink-0 scrollbar-hide">
        {TOOLS.map(({ id, icon: Icon, label }) => (
          <button key={id} onClick={() => setActive(id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg whitespace-nowrap text-xs font-medium transition-all flex-shrink-0 ${active === id ? 'text-white' : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--border)]'}`}
            style={active === id ? {background:'var(--grad)'} : {}}>
            <Icon size={13}/>{label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 lg:p-8">
        <ActiveComp/>
      </div>
    </div>
  )
}

// Sparkles import needed for AIReplyTool
import { Sparkles } from 'lucide-react'