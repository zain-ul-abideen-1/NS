import { useState, useEffect } from 'react'
import {
  X, Calculator, DollarSign, TrendingUp, Star, Plug, StickyNote,
  Target, BarChart2, AlertCircle, Clock, Globe2, Zap,
  Users, MessageSquare, PieChart, Bell, Plus, Minus,
  CheckCircle, ArrowUpRight, ArrowDownRight, RefreshCw,
  Download, Trash2, Edit3, ChevronDown, Save
} from 'lucide-react'
import { Sessions } from '../utils/api'
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
function ScoreBadge({ val, max=10 }) {
  const c = val/max >= .8 ? '#10b981' : val/max >= .6 ? '#f59e0b' : '#ef4444'
  return <span className="text-xs font-bold" style={{color:c}}>{val}/{max}</span>
}

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
    if(key==='.'&&display.includes('.'))return
    setDisplay(d=>fresh||d==='0'?(key==='.'?'0.':key):d+key)
    setFresh(false)
  }

  const BASIC=[['C','⌫','%','÷'],['7','8','9','×'],['4','5','6','-'],['1','2','3','+'],['.','0','±','=']]
  const SCI=[['√','x²','1/x','C'],['7','8','9','÷'],['4','5','6','×'],['1','2','3','-'],['.','0','⌫','=']]
  const KEYS=mode==='sci'?SCI:BASIC
  const isOp=k=>['+','-','×','÷','='].includes(k)
  const isAct=k=>['C','⌫','√','x²','1/x'].includes(k)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
      <div className="space-y-4">
        <div className="flex gap-2 mb-2">
          {['basic','sci'].map(m=>(
            <button key={m} onClick={()=>setMode(m)}
              className={`text-xs px-3 py-1 rounded-lg border transition-all ${mode===m?'text-white border-transparent':'border-[var(--border)] text-[var(--muted)]'}`}
              style={mode===m?{background:'var(--grad)'}:{}}>
              {m==='basic'?'Standard':'Scientific'}
            </button>
          ))}
        </div>
        <Card>
          {op&&prev!==null&&<p className="text-xs text-[var(--muted)] font-mono text-right mb-1">{prev} {op}</p>}
          <p className="text-4xl font-mono font-bold text-[var(--text)] text-right truncate">{display}</p>
        </Card>
        <div className="grid grid-cols-4 gap-1.5">
          {KEYS.flat().map((k,i)=>(
            <button key={i} onClick={()=>press(k)}
              className={`rounded-xl py-3 text-sm font-semibold transition-all active:scale-95 ${
                k==='='?'text-white col-span-1':
                isOp(k)?'bg-[var(--brand)]/15 text-[var(--brand)] hover:bg-[var(--brand)]/25':
                isAct(k)?'bg-[var(--red)]/15 text-[var(--red)] hover:bg-[var(--red)]/25':
                'bg-[var(--card)] border border-[var(--border)] text-[var(--text)] hover:bg-[var(--card2)]'
              }`}
              style={k==='='?{background:'var(--grad)'}:{}}>{k}</button>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Calculation History</Label>
          {history.length>0&&<button onClick={()=>setHistory([])} className="text-[10px] text-[var(--muted)] hover:text-[var(--red)] flex items-center gap-1"><Trash2 size={9}/>Clear</button>}
        </div>
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {history.length===0?<Muted>No calculations yet</Muted>:history.map((h,i)=>(
            <div key={i} className="flex justify-between items-center p-2.5 rounded-lg bg-[var(--card)] border border-[var(--border)]">
              <span className="text-xs font-mono text-[var(--text)]">{h.expr}</span>
              <span className="text-[10px] text-[var(--muted)]">{h.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── TOOL 2: ROI & Business Calculator ───────────────────────────
function ROITool() {
  const [tab, setTab] = useState('roi')
  // ROI
  const [inv, setInv] = useState('')
  const [ret, setRet] = useState('')
  // CSAT
  const [satisfied, setSat] = useState('')
  const [total, setTotal] = useState('')
  // CAC
  const [mktSpend, setMktSpend] = useState('')
  const [newCusts, setNewCusts] = useState('')
  // LTV
  const [avgOrder, setAvgOrder] = useState('')
  const [freq, setFreq] = useState('')
  const [lifespan, setLifespan] = useState('')

  const roi = inv&&ret?((parseFloat(ret)-parseFloat(inv))/parseFloat(inv)*100).toFixed(1):null
  const csat = satisfied&&total?((parseInt(satisfied)/parseInt(total))*100).toFixed(1):null
  const cac = mktSpend&&newCusts?(parseFloat(mktSpend)/parseInt(newCusts)).toFixed(2):null
  const ltv = avgOrder&&freq&&lifespan?(parseFloat(avgOrder)*parseFloat(freq)*parseFloat(lifespan)).toFixed(0):null

  const TABS=[{id:'roi',label:'ROI'},{id:'csat',label:'CSAT'},{id:'cac',label:'CAC'},{id:'ltv',label:'LTV'}]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div className="flex gap-1.5 flex-wrap">
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${tab===t.id?'text-white border-transparent':'border-[var(--border)] text-[var(--muted)]'}`}
              style={tab===t.id?{background:'var(--grad)'}:{}}>{t.label}</button>
          ))}
        </div>

        {tab==='roi'&&(
          <Card className="space-y-3">
            <Label>Return On Investment</Label>
            <div><label className="text-[10px] text-[var(--muted)]">Total Investment ($)</label><input className="input text-sm mt-1 w-full" type="number" placeholder="10000" value={inv} onChange={e=>setInv(e.target.value)}/></div>
            <div><label className="text-[10px] text-[var(--muted)]">Total Return ($)</label><input className="input text-sm mt-1 w-full" type="number" placeholder="15000" value={ret} onChange={e=>setRet(e.target.value)}/></div>
          </Card>
        )}
        {tab==='csat'&&(
          <Card className="space-y-3">
            <Label>Customer Satisfaction Score</Label>
            <div><label className="text-[10px] text-[var(--muted)]">Satisfied Customers</label><input className="input text-sm mt-1 w-full" type="number" placeholder="850" value={satisfied} onChange={e=>setSat(e.target.value)}/></div>
            <div><label className="text-[10px] text-[var(--muted)]">Total Surveyed</label><input className="input text-sm mt-1 w-full" type="number" placeholder="1000" value={total} onChange={e=>setTotal(e.target.value)}/></div>
          </Card>
        )}
        {tab==='cac'&&(
          <Card className="space-y-3">
            <Label>Customer Acquisition Cost</Label>
            <div><label className="text-[10px] text-[var(--muted)]">Marketing Spend ($)</label><input className="input text-sm mt-1 w-full" type="number" placeholder="50000" value={mktSpend} onChange={e=>setMktSpend(e.target.value)}/></div>
            <div><label className="text-[10px] text-[var(--muted)]">New Customers</label><input className="input text-sm mt-1 w-full" type="number" placeholder="250" value={newCusts} onChange={e=>setNewCusts(e.target.value)}/></div>
          </Card>
        )}
        {tab==='ltv'&&(
          <Card className="space-y-3">
            <Label>Customer Lifetime Value</Label>
            <div><label className="text-[10px] text-[var(--muted)]">Avg Order Value ($)</label><input className="input text-sm mt-1 w-full" type="number" placeholder="120" value={avgOrder} onChange={e=>setAvgOrder(e.target.value)}/></div>
            <div><label className="text-[10px] text-[var(--muted)]">Purchases/Year</label><input className="input text-sm mt-1 w-full" type="number" placeholder="4" value={freq} onChange={e=>setFreq(e.target.value)}/></div>
            <div><label className="text-[10px] text-[var(--muted)]">Customer Lifespan (years)</label><input className="input text-sm mt-1 w-full" type="number" placeholder="3" value={lifespan} onChange={e=>setLifespan(e.target.value)}/></div>
          </Card>
        )}
      </div>

      <div className="flex items-center justify-center">
        {tab==='roi'&&roi!==null&&(
          <div className="space-y-4 w-full">
            <div className="rounded-2xl p-6 text-center" style={{background:'var(--grad)'}}>
              <p className="text-white/70 text-sm">Return on Investment</p>
              <p className="text-6xl font-display font-bold text-white mt-1">{roi}%</p>
              <p className="text-white/70 text-sm mt-1">{parseFloat(roi)>0?'Profitable ✅':'Loss ❌'}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Card className="text-center"><p className="text-[10px] text-[var(--muted)]">Net Profit</p><p className="text-xl font-bold text-[var(--green)] mt-1">${(parseFloat(ret)-parseFloat(inv)).toLocaleString()}</p></Card>
              <Card className="text-center"><p className="text-[10px] text-[var(--muted)]">Multiplier</p><p className="text-xl font-bold text-[var(--brand)] mt-1">{(parseFloat(ret)/parseFloat(inv)).toFixed(2)}x</p></Card>
            </div>
          </div>
        )}
        {tab==='csat'&&csat!==null&&(
          <div className="rounded-2xl p-6 text-center w-full" style={{background:'var(--grad)'}}>
            <p className="text-white/70 text-sm">CSAT Score</p>
            <p className="text-6xl font-display font-bold text-white mt-1">{csat}%</p>
            <p className="text-white/70 text-sm mt-1">{parseFloat(csat)>=90?'World Class 🏆':parseFloat(csat)>=75?'Good 👍':'Needs Improvement ⚠️'}</p>
          </div>
        )}
        {tab==='cac'&&cac!==null&&(
          <div className="rounded-2xl p-6 text-center w-full" style={{background:'var(--grad)'}}>
            <p className="text-white/70 text-sm">Cost per Customer</p>
            <p className="text-5xl font-display font-bold text-white mt-1">${cac}</p>
            <p className="text-white/70 text-sm mt-1">Customer Acquisition Cost</p>
          </div>
        )}
        {tab==='ltv'&&ltv!==null&&(
          <div className="rounded-2xl p-6 text-center w-full" style={{background:'var(--grad)'}}>
            <p className="text-white/70 text-sm">Lifetime Value per Customer</p>
            <p className="text-5xl font-display font-bold text-white mt-1">${parseInt(ltv).toLocaleString()}</p>
            <p className="text-white/70 text-sm mt-1">Customer Lifetime Value</p>
          </div>
        )}
        {((tab==='roi'&&!roi)||(tab==='csat'&&!csat)||(tab==='cac'&&!cac)||(tab==='ltv'&&!ltv))&&(
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto bg-[var(--border)]"><DollarSign size={24} className="text-[var(--muted)]"/></div>
            <Muted>Fill in the fields to see your result</Muted>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── TOOL 3: Budget Tracker ───────────────────────────────────────
function BudgetTool() {
  const [items, setItems] = useLocalStore('budget', [
    {id:1,label:'Marketing',budget:5000,spent:3200,color:'#0ea5e9'},
    {id:2,label:'Support',budget:2000,spent:1800,color:'#34d399'},
    {id:3,label:'Tech Tools',budget:1500,spent:950,color:'#a78bfa'},
    {id:4,label:'Ops',budget:3000,spent:2400,color:'#f59e0b'},
  ])
  const [newLabel,setNewLabel]=useState('')
  const [newBudget,setNewBudget]=useState('')
  const [editing,setEditing]=useState(null)

  const total=items.reduce((s,i)=>s+i.budget,0)
  const spent=items.reduce((s,i)=>s+i.spent,0)
  const remaining=total-spent
  const pctUsed=total>0?Math.round(spent/total*100):0

  const COLORS=['#0ea5e9','#34d399','#a78bfa','#f59e0b','#f97316','#ec4899','#ef4444','#14b8a6']

  const add=()=>{
    if(!newLabel||!newBudget)return
    setItems([...items,{id:Date.now(),label:newLabel,budget:parseFloat(newBudget),spent:0,color:COLORS[items.length%COLORS.length]}])
    setNewLabel('');setNewBudget('')
  }
  const updateSpent=(id,v)=>setItems(items.map(i=>i.id===id?{...i,spent:parseFloat(v)||0}:i))
  const remove=(id)=>setItems(items.filter(i=>i.id!==id))

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <Card>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[{label:'Total Budget',val:`$${total.toLocaleString()}`,c:'var(--text)'},{label:'Spent',val:`$${spent.toLocaleString()}`,c:pctUsed>90?'var(--red)':'var(--amber)'},{label:'Remaining',val:`$${remaining.toLocaleString()}`,c:remaining<0?'var(--red)':'var(--green)'}].map(k=>(
              <div key={k.label} className="text-center"><p className="text-[10px] text-[var(--muted)]">{k.label}</p><p className="text-lg font-bold mt-0.5" style={{color:k.c}}>{k.val}</p></div>
            ))}
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs"><span className="text-[var(--muted)]">Budget Used</span><span className="font-bold" style={{color:pctUsed>90?'var(--red)':pctUsed>70?'var(--amber)':'var(--green)'}}>{pctUsed}%</span></div>
            <div className="h-3 bg-[var(--border)] rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{width:`${Math.min(pctUsed,100)}%`,background:pctUsed>90?'var(--red)':pctUsed>70?'var(--amber)':'var(--green)'}}/>
            </div>
          </div>
        </Card>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {items.map(item=>{
            const pct=item.budget>0?Math.min(item.spent/item.budget*100,100):0
            const over=item.spent>item.budget
            return(
              <Card key={item.id} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{background:item.color}}/><span className="text-sm font-medium text-[var(--text)]">{item.label}</span></div>
                  <div className="flex items-center gap-2">
                    {over&&<span className="text-[9px] text-white px-1.5 py-0.5 rounded bg-[var(--red)]">OVER</span>}
                    <button onClick={()=>setEditing(editing===item.id?null:item.id)} className="text-[var(--muted)] hover:text-[var(--text)]"><Edit3 size={11}/></button>
                    <button onClick={()=>remove(item.id)} className="text-[var(--muted)] hover:text-[var(--red)]"><Trash2 size={11}/></button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-[var(--border)] rounded-full overflow-hidden"><div className="h-full rounded-full transition-all" style={{width:`${pct}%`,background:over?'var(--red)':item.color}}/></div>
                  <span className="text-[10px] font-mono text-[var(--muted)]">${item.spent.toLocaleString()}/${item.budget.toLocaleString()}</span>
                </div>
                {editing===item.id&&(
                  <div className="flex gap-2 mt-1">
                    <input className="input text-xs flex-1" type="number" placeholder="Spent so far" defaultValue={item.spent} onBlur={e=>updateSpent(item.id,e.target.value)}/>
                  </div>
                )}
              </Card>
            )
          })}
        </div>

        <div className="flex gap-2">
          <input className="input text-sm flex-1" placeholder="Category name" value={newLabel} onChange={e=>setNewLabel(e.target.value)}/>
          <input className="input text-sm w-28" placeholder="Budget $" type="number" value={newBudget} onChange={e=>setNewBudget(e.target.value)}/>
          <button onClick={add} className="btn-primary px-3"><Plus size={14}/></button>
        </div>
      </div>

      <div className="space-y-4">
        <Label>Spending Breakdown</Label>
        <div className="space-y-3">
          {[...items].sort((a,b)=>b.spent-a.spent).map((item,i)=>(
            <div key={item.id} className="space-y-1">
              <div className="flex justify-between text-xs"><span style={{color:item.color}} className="font-medium">{item.label}</span><span className="text-[var(--muted)]">{item.budget>0?Math.round(item.spent/item.budget*100):0}% used</span></div>
              <div className="h-4 bg-[var(--border)] rounded-full overflow-hidden relative">
                <div className="h-full rounded-full flex items-center" style={{width:`${item.budget>0?Math.min(item.spent/item.budget*100,100):0}%`,background:item.color,minWidth:item.spent>0?'2rem':0}}>
                  <span className="text-[9px] font-bold text-white px-1.5 truncate">${item.spent.toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <Card className="mt-4">
          <p className="text-xs font-semibold text-[var(--text)] mb-2">Recommendations</p>
          {items.filter(i=>i.spent>i.budget).map(i=>(
            <p key={i.id} className="text-xs text-[var(--red)] flex items-center gap-1 mb-1"><AlertCircle size={10}/> {i.label} is ${(i.spent-i.budget).toLocaleString()} over budget</p>
          ))}
          {items.filter(i=>i.spent<i.budget*0.5&&i.budget>0).map(i=>(
            <p key={i.id} className="text-xs text-[var(--amber)] flex items-center gap-1 mb-1"><Bell size={10}/> {i.label}: only {Math.round(i.spent/i.budget*100)}% utilized</p>
          ))}
          {items.every(i=>i.spent<=i.budget)&&<p className="text-xs text-[var(--green)] flex items-center gap-1"><CheckCircle size={10}/> All categories within budget</p>}
        </Card>
      </div>
    </div>
  )
}

// ─── TOOL 4: Session Sentiment Dashboard ─────────────────────────
function SessionDashboard() {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [detail, setDetail] = useState(null)
  const [detailLoad, setDetailLoad] = useState(false)

  useEffect(()=>{
    Sessions.list({}).then(r=>{setSessions(r.data?.sessions||[]);setLoading(false)}).catch(()=>setLoading(false))
  },[])

  const loadDetail = async (id) => {
    if(selected===id){setSelected(null);setDetail(null);return}
    setSelected(id);setDetailLoad(true)
    try{const r=await Sessions.get(id);setDetail(r.data)}catch{}
    setDetailLoad(false)
  }

  if(loading)return <div className="flex items-center justify-center h-40"><RefreshCw size={18} className="animate-spin text-[var(--muted)]"/></div>
  if(sessions.length===0)return <div className="text-center py-12"><Muted>No sessions yet. Analyze some reviews first.</Muted></div>

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
        <Label>{sessions.length} Sessions — click to expand</Label>
        {sessions.map(s=>{
          const pos=s.positive_pct||0, neg=s.negative_pct||0
          const c=pos>60?'var(--green)':neg>50?'var(--red)':'var(--amber)'
          return(
            <div key={s.session_id} onClick={()=>loadDetail(s.session_id)}
              className={`card p-4 cursor-pointer transition-all hover:border-[var(--brand)]/30 border-2 ${selected===s.session_id?'border-[var(--brand)]/50':'border-transparent'}`}>
              <div className="flex justify-between items-start mb-2">
                <div><p className="text-sm font-semibold text-[var(--text)]">{s.name}</p><p className="text-[10px] text-[var(--muted)]">{s.total_reviews} reviews · {new Date(s.created_at).toLocaleDateString()}</p></div>
                <span className="text-sm font-bold" style={{color:c}}>{pos}%</span>
              </div>
              <div className="h-2 bg-[var(--border)] rounded-full overflow-hidden flex">
                <div className="h-full bg-[var(--green)]" style={{width:`${pos}%`}}/>
                <div className="h-full bg-[var(--amber)]" style={{width:`${s.neutral_pct||0}%`}}/>
                <div className="h-full bg-[var(--red)]" style={{width:`${neg}%`}}/>
              </div>
              <div className="flex gap-3 mt-1 text-[9px] text-[var(--muted)]">
                <span className="text-[var(--green)]">✅ {pos}%</span>
                <span className="text-[var(--amber)]">➖ {s.neutral_pct||0}%</span>
                <span className="text-[var(--red)]">❌ {neg}%</span>
              </div>
            </div>
          )
        })}
      </div>

      <div>
        {detailLoad&&<div className="flex items-center justify-center h-40"><RefreshCw size={18} className="animate-spin text-[var(--muted)]"/></div>}
        {detail&&!detailLoad&&(
          <div className="space-y-4">
            <Label>Session Deep Dive — {detail.name||'Session'}</Label>
            <div className="grid grid-cols-2 gap-3">
              {[
                {label:'Total Reviews',val:detail.total_reviews||0},
                {label:'Avg Score',val:((detail.avg_score||0)*100).toFixed(0)+'%'},
                {label:'Fake Reviews',val:(detail.fake_count||0)+' flagged',alert:detail.fake_count>2},
                {label:'Helpfulness',val:((detail.avg_helpfulness||0.5)*100).toFixed(0)+'%'},
              ].map(k=>(
                <Card key={k.label} className="text-center">
                  <p className="text-[10px] text-[var(--muted)]">{k.label}</p>
                  <p className="text-xl font-bold mt-1" style={{color:k.alert?'var(--red)':'var(--text)'}}>{k.val}</p>
                </Card>
              ))}
            </div>
            {detail.top_keywords&&detail.top_keywords.length>0&&(
              <Card>
                <p className="text-xs font-semibold text-[var(--text)] mb-2">Top Keywords</p>
                <div className="flex flex-wrap gap-1.5">
                  {detail.top_keywords.slice(0,12).map((k,i)=>(
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded-full border border-[var(--border)] text-[var(--text2)]">{k.word} <span className="text-[var(--muted)]">×{k.count}</span></span>
                  ))}
                </div>
              </Card>
            )}
            {detail.ai_insights&&(
              <Card>
                <p className="text-xs font-semibold text-[var(--text)] mb-2">AI Insights</p>
                <p className="text-xs text-[var(--text2)] leading-relaxed">{detail.ai_insights}</p>
              </Card>
            )}
          </div>
        )}
        {!selected&&!detailLoad&&<div className="flex flex-col items-center justify-center h-48 text-center"><BarChart2 size={24} className="text-[var(--muted)] mb-2"/><Muted>Click a session to see deep analytics</Muted></div>}
      </div>
    </div>
  )
}

// ─── TOOL 5: Store Integration Guide ─────────────────────────────
function StoreTool() {
  const [tab, setTab] = useState('shopify')
  const INTEGRATIONS = {
    shopify: {
      name:'Shopify', icon:'🛍️', color:'#95BF47',
      method:'Public App (OAuth)',
      steps:[
        { num:1, title:'Install NestInsights App', detail:'Go to Shopify App Store → Search "NestInsights" → Click Install. This grants OAuth2 read access to your product reviews.' },
        { num:2, title:'Grant Review Permissions', detail:'Accept the permission request: read_products, read_reviews (Shopify Reviews API). No password sharing — industry-standard OAuth2.' },
        { num:3, title:'Set Webhook in Shopify Admin', detail:'Shopify Admin → Settings → Notifications → Webhooks → Add Webhook → Event: "New product review" → URL: https://yourapp.nestinsights.com/webhooks/shopify' },
        { num:4, title:'Verify Connection', detail:'A test review is auto-sent. Check NestInsights Analyze tab — you should see it appear within 30 seconds.' },
      ],
      apiNote:'Uses Shopify REST Admin API v2024-01. Docs: shopify.dev/docs/api/admin-rest/2024-01/resources/product-review',
      freeApiKey:'Shopify Partner App is free. Production requires Shopify plan ($29+/month).',
    },
    woo: {
      name:'WooCommerce', icon:'🛒', color:'#7F54B3',
      method:'REST API + Webhook',
      steps:[
        { num:1, title:'Generate WooCommerce API Keys', detail:'WP Admin → WooCommerce → Settings → Advanced → REST API → Add Key. Set permissions to "Read". Copy Consumer Key + Consumer Secret.' },
        { num:2, title:'Add Keys to NestInsights', detail:'In NestInsights settings, add your WooCommerce store URL, Consumer Key, and Consumer Secret. These are encrypted at rest.' },
        { num:3, title:'Set Up Auto-Sync Webhook', detail:'WP Admin → WooCommerce → Settings → Advanced → Webhooks → Add Webhook → Topic: "Review created" → Delivery URL: https://yourapp.nestinsights.com/webhooks/woo' },
        { num:4, title:'Test the Connection', detail:'Post a test product review in your WooCommerce store. It should appear in NestInsights within 60 seconds via the webhook.' },
      ],
      apiNote:'Uses WooCommerce REST API v3. Docs: woocommerce.github.io/woocommerce-rest-api-docs',
      freeApiKey:'WooCommerce REST API is free with any WooCommerce installation.',
    },
    trustpilot: {
      name:'Trustpilot', icon:'⭐', color:'#00B67A',
      method:'Trustpilot Business API',
      steps:[
        { num:1, title:'Create Trustpilot Business Account', detail:'Sign up at business.trustpilot.com. Verify your domain. You need at least the Free plan to access the Business API.' },
        { num:2, title:'Apply for API Access', detail:'Go to support.trustpilot.com/hc/en-us/articles/221577267 → Apply for API key. Business accounts get API keys within 1-3 business days.' },
        { num:3, title:'Enter API Key in NestInsights', detail:'Copy your API Key from Trustpilot Business → Integrations → API. Paste it in NestInsights Settings → Integrations → Trustpilot.' },
        { num:4, title:'Set Business Unit ID', detail:'Find your Business Unit ID in Trustpilot URL (businessunit.trustpilot.com → your profile → URL contains the ID). Add it to NestInsights.' },
      ],
      apiNote:'Uses Trustpilot Business API v1. Docs: developers.trustpilot.com. Rate limit: 1000 requests/day (free tier).',
      freeApiKey:'Free tier: 1,000 API calls/day. Paid: 10,000+/day. Apply at business.trustpilot.com.',
    },
    amazon: {
      name:'Amazon Seller', icon:'📦', color:'#FF9900',
      method:'Amazon SP-API (Selling Partner)',
      steps:[
        { num:1, title:'Register as Amazon Developer', detail:'Go to sellercentral.amazon.com → Apps & Services → Develop Apps → Register. Must be an active seller with an approved Seller Central account.' },
        { num:2, title:'Create SP-API Application', detail:'Developer Console → Create App → Select "Selling Partner API" → Request access to Reviews API scope. Amazon reviews this within 3-5 days.' },
        { num:3, title:'OAuth Authorization', detail:'Use Amazon LWA (Login with Amazon) OAuth2 flow. Generate refresh tokens. NestInsights handles the token refresh automatically once configured.' },
        { num:4, title:'Configure in NestInsights', detail:'Enter Client ID, Client Secret, and Refresh Token in NestInsights Settings. Select your marketplace region (US, EU, JP, etc.).' },
      ],
      apiNote:'Uses Amazon SP-API Reviews endpoint. Docs: developer-docs.amazon.com/sp-api. Requires active seller account.',
      freeApiKey:'Amazon SP-API is free for registered sellers. Selling plan: $0.99/item or $39.99/month.',
    },
    google: {
      name:'Google Reviews', icon:'🔍', color:'#4285F4',
      method:'Google My Business API / Places API',
      steps:[
        { num:1, title:'Enable Google My Business API', detail:'Go to console.cloud.google.com → Create Project → Enable "My Business Business Information API" → Enable "My Business Reviews API".' },
        { num:2, title:'Create OAuth 2.0 Credentials', detail:'APIs & Services → Credentials → Create Credentials → OAuth Client ID → Web Application. Add authorized redirect URI for NestInsights.' },
        { num:3, title:'Set Up Places API (for public reviews)', detail:'Enable "Places API" → Create API Key → Restrict it to Places API only. Free tier: $200/month credit (~4,000 place detail requests).' },
        { num:4, title:'Connect in NestInsights', detail:'Enter your OAuth Client ID/Secret and Places API Key. Authenticate your Google account to grant access to your Business Profile reviews.' },
      ],
      apiNote:'Google My Business API is free for business account holders. Places API: Free up to $200/month (~4K requests). Docs: developers.google.com/my-business/reference/rest',
      freeApiKey:'Google provides $200/month free credit for Places API. Business Profile API is free for verified businesses.',
    }
  }

  const active = INTEGRATIONS[tab]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="space-y-2">
        <Label>Platform Guides</Label>
        {Object.entries(INTEGRATIONS).map(([key, val]) => (
          <button key={key} onClick={()=>setTab(key)}
            className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${tab===key?'border-transparent text-white':'border-[var(--border)] hover:border-[var(--brand)]/30'}`}
            style={tab===key?{background:val.color}:{}}>
            <span className="text-xl">{val.icon}</span>
            <div>
              <p className={`text-xs font-semibold ${tab===key?'text-white':'text-[var(--text)]'}`}>{val.name}</p>
              <p className={`text-[9px] ${tab===key?'text-white/70':'text-[var(--muted)]'}`}>{val.method}</p>
            </div>
          </button>
        ))}
        <div className="mt-3 p-3 rounded-xl bg-[var(--brand)]/8 border border-[var(--brand)]/20">
          <p className="text-[10px] text-[var(--brand)] font-semibold">💡 Integration Reality</p>
          <p className="text-[9px] text-[var(--muted)] mt-1 leading-relaxed">Real integrations require API keys from each platform. All free tiers available. Follow steps below to connect.</p>
        </div>
      </div>

      <div className="lg:col-span-3 space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{active.icon}</span>
          <div>
            <p className="text-base font-bold text-[var(--text)]">{active.name} Integration</p>
            <span className="text-[10px] px-2 py-0.5 rounded font-medium text-white" style={{background:active.color}}>{active.method}</span>
          </div>
        </div>

        <div className="space-y-3">
          {active.steps.map(step => (
            <Card key={step.num} className="flex gap-3">
              <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white" style={{background:active.color}}>{step.num}</div>
              <div>
                <p className="text-xs font-semibold text-[var(--text)]">{step.title}</p>
                <p className="text-xs text-[var(--muted)] mt-1 leading-relaxed">{step.detail}</p>
              </div>
            </Card>
          ))}
        </div>

        <Card className="border-[var(--brand)]/20 bg-[var(--brand)]/5 space-y-2">
          <p className="text-xs font-semibold text-[var(--brand)]">📖 API Documentation</p>
          <p className="text-xs text-[var(--muted)]">{active.apiNote}</p>
        </Card>
        <Card className="border-[var(--green)]/20 bg-[var(--green)]/5">
          <p className="text-xs font-semibold text-[var(--green)]">💰 Free API Info</p>
          <p className="text-xs text-[var(--muted)] mt-1">{active.freeApiKey}</p>
        </Card>
      </div>
    </div>
  )
}

// ─── TOOL 6: Smart Notes ─────────────────────────────────────────
function NotesTool() {
  const [notes,setNotes]=useLocalStore('notes',[{id:1,title:'Action Items',content:'• Follow up on negative reviews\n• Respond to Trustpilot complaints\n• Review Q4 strategy',pinned:true,color:'#0ea5e9'}])
  const [newTitle,setNewTitle]=useState('')
  const [newContent,setNewContent]=useState('')
  const [editing,setEditing]=useState(null)
  const [searchQ,setSearchQ]=useState('')

  const add=()=>{
    if(!newTitle.trim())return
    const COLORS=['#0ea5e9','#34d399','#a78bfa','#f59e0b','#f97316','#ec4899']
    setNotes([...notes,{id:Date.now(),title:newTitle,content:newContent,pinned:false,color:COLORS[notes.length%COLORS.length]}])
    setNewTitle('');setNewContent('')
  }
  const remove=(id)=>setNotes(notes.filter(n=>n.id!==id))
  const updateNote=(id,field,val)=>setNotes(notes.map(n=>n.id===id?{...n,[field]:val}:n))
  const pin=(id)=>setNotes(notes.map(n=>n.id===id?{...n,pinned:!n.pinned}:n))

  const filtered=notes.filter(n=>!searchQ||n.title.toLowerCase().includes(searchQ.toLowerCase())||n.content.toLowerCase().includes(searchQ.toLowerCase()))
  const sorted=[...filtered.filter(n=>n.pinned),...filtered.filter(n=>!n.pinned)]

  const exportAll=()=>{
    const txt=notes.map(n=>`# ${n.title}\n${n.content}`).join('\n\n---\n\n')
    const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([txt],{type:'text/plain'}));a.download='notes.txt';a.click()
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>{notes.length} Notes</Label>
          <button onClick={exportAll} className="text-[10px] text-[var(--muted)] hover:text-[var(--text)] flex items-center gap-1"><Download size={10}/>Export all</button>
        </div>
        <input className="input text-sm w-full" placeholder="Search notes..." value={searchQ} onChange={e=>setSearchQ(e.target.value)}/>
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {sorted.map(n=>(
            <div key={n.id} className="rounded-xl border border-[var(--border)] overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2" style={{background:n.color+'20',borderBottom:`2px solid ${n.color}40`}}>
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{background:n.color}}/>
                {editing===n.id?(
                  <input className="flex-1 text-xs font-semibold bg-transparent border-none outline-none text-[var(--text)]" value={n.title} onChange={e=>updateNote(n.id,'title',e.target.value)}/>
                ):(
                  <p className="flex-1 text-xs font-semibold text-[var(--text)]">{n.title}</p>
                )}
                <div className="flex gap-1">
                  <button onClick={()=>pin(n.id)} className={`text-[10px] ${n.pinned?'text-[var(--amber)]':'text-[var(--dim)]'} hover:text-[var(--amber)]`}>📌</button>
                  <button onClick={()=>setEditing(editing===n.id?null:n.id)} className="text-[var(--muted)] hover:text-[var(--text)]"><Edit3 size={10}/></button>
                  <button onClick={()=>remove(n.id)} className="text-[var(--muted)] hover:text-[var(--red)]"><Trash2 size={10}/></button>
                </div>
              </div>
              <div className="p-3">
                {editing===n.id?(
                  <textarea className="input text-xs w-full resize-none" rows={4} value={n.content} onChange={e=>updateNote(n.id,'content',e.target.value)}/>
                ):(
                  <p className="text-xs text-[var(--text2)] whitespace-pre-line leading-relaxed">{n.content}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Label>Add New Note</Label>
        <input className="input text-sm w-full" placeholder="Note title..." value={newTitle} onChange={e=>setNewTitle(e.target.value)}/>
        <textarea className="input text-sm resize-none w-full" rows={6} placeholder="Note content..." value={newContent} onChange={e=>setNewContent(e.target.value)}/>
        <button onClick={add} disabled={!newTitle.trim()} className="btn-primary text-sm w-full flex items-center justify-center gap-2"><Plus size={14}/>Add Note</button>
      </div>
    </div>
  )
}

// ─── TOOL 7: NPS & Score Converter ───────────────────────────────
function NPSTool() {
  const [tab,setTab]=useState('nps')
  const [p,setP]=useState('')
  const [pa,setPa]=useState('')
  const [d,setD]=useState('')
  const [score,setScore]=useState('')

  const pi=parseInt(p)||0,pai=parseInt(pa)||0,di=parseInt(d)||0
  const tot=pi+pai+di
  const nps=tot>0?Math.round((pi/tot-di/tot)*100):null
  const npsLabel=nps===null?'':nps>=70?'World Class 🏆':nps>=50?'Excellent ⭐':nps>=30?'Good 👍':nps>=0?'Needs Work ⚠️':'Critical 🔴'
  const npsColor=nps===null?'var(--muted)':nps>=50?'var(--green)':nps>=0?'var(--amber)':'var(--red)'

  const v=parseFloat(score)
  const isV=!isNaN(v)&&v>=-1&&v<=1
  const pct=isV?Math.round((v+1)/2*100):null
  const stars=isV?Math.round(((v+1)/2)*4+1):null
  const npsEq=isV?Math.round(v*10):null
  const sentLabel=isV?(v>=0.6?'Very Positive 🟢':v>=0.2?'Positive 🟡':v>=-0.2?'Neutral ⚪':v>=-0.6?'Negative 🟠':'Very Negative 🔴'):null

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div className="flex gap-2">
          {['nps','converter'].map(t=>(
            <button key={t} onClick={()=>setTab(t)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${tab===t?'text-white border-transparent':'border-[var(--border)] text-[var(--muted)]'}`}
              style={tab===t?{background:'var(--grad)'}:{}}>{t==='nps'?'NPS Calculator':'Score Converter'}</button>
          ))}
        </div>

        {tab==='nps'&&(
          <div className="space-y-3">
            <Muted>Enter count of each group from your review data</Muted>
            {[{label:'Promoters (9-10 ⭐)',val:p,set:setP,c:'var(--green)'},{label:'Passives (7-8 ⭐)',val:pa,set:setPa,c:'var(--amber)'},{label:'Detractors (0-6 ⭐)',val:d,set:setD,c:'var(--red)'}].map(x=>(
              <div key={x.label}>
                <label className="text-xs font-medium" style={{color:x.c}}>{x.label}</label>
                <input className="input text-sm mt-1 w-full" type="number" min="0" placeholder="0" value={x.val} onChange={e=>x.set(e.target.value)}/>
              </div>
            ))}
            {tot>0&&(
              <Card>
                <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
                  <span className="text-[var(--green)]">{pi} promoters ({tot>0?Math.round(pi/tot*100):0}%)</span>
                  <span>·</span>
                  <span className="text-[var(--amber)]">{pai} passives</span>
                  <span>·</span>
                  <span className="text-[var(--red)]">{di} detractors</span>
                </div>
              </Card>
            )}
          </div>
        )}

        {tab==='converter'&&(
          <div className="space-y-3">
            <Muted>Convert VADER sentiment score (-1 to +1) to multiple formats</Muted>
            <div>
              <label className="text-xs font-medium text-[var(--text)]">VADER Score</label>
              <input className="input text-sm mt-1 w-full" type="number" step="0.01" min="-1" max="1" placeholder="e.g. 0.45" value={score} onChange={e=>setScore(e.target.value)}/>
            </div>
            {isV&&(
              <div className="h-3 bg-[var(--border)] rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{width:`${pct}%`,background:v>=0.2?'var(--green)':v>=-0.2?'var(--amber)':'var(--red)'}}/>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-center">
        {tab==='nps'&&nps!==null&&(
          <div className="space-y-4 w-full">
            <div className="rounded-2xl p-6 text-center" style={{background:'var(--grad)'}}>
              <p className="text-white/70 text-sm">Net Promoter Score</p>
              <p className="text-6xl font-display font-bold text-white mt-1">{nps>0?'+':''}{nps}</p>
              <p className="text-white/80 text-sm mt-1 font-medium">{npsLabel}</p>
              <p className="text-white/60 text-xs mt-0.5">{tot.toLocaleString()} total responses</p>
            </div>
            <div className="h-3 bg-[var(--border)] rounded-full overflow-hidden flex">
              <div className="h-full bg-[var(--green)]" style={{width:`${tot>0?pi/tot*100:0}%`}}/>
              <div className="h-full bg-[var(--amber)]" style={{width:`${tot>0?pai/tot*100:0}%`}}/>
              <div className="h-full bg-[var(--red)]" style={{width:`${tot>0?di/tot*100:0}%`}}/>
            </div>
          </div>
        )}
        {tab==='converter'&&isV&&(
          <div className="grid grid-cols-2 gap-3 w-full">
            {[
              {label:'Sentiment Label',val:sentLabel,large:true},
              {label:'% Score',val:`${pct}%`},
              {label:'Star Rating',val:`${stars}/5 ⭐`},
              {label:'NPS Equivalent',val:`${npsEq>0?'+':''}${npsEq}`},
              {label:'Raw Score',val:score},
              {label:'Direction',val:v>0?'↑ Positive':'↓ Negative'},
            ].map(k=>(
              <Card key={k.label} className={`text-center ${k.large?'col-span-2':''}`}>
                <p className="text-[10px] text-[var(--muted)]">{k.label}</p>
                <p className={`font-bold mt-1 ${k.large?'text-lg':'text-xl'} text-[var(--text)]`}>{k.val}</p>
              </Card>
            ))}
          </div>
        )}
        {((tab==='nps'&&nps===null)||(tab==='converter'&&!isV))&&(
          <div className="text-center space-y-2"><Users size={28} className="text-[var(--muted)] mx-auto"/><Muted>Fill in the fields to see results</Muted></div>
        )}
      </div>
    </div>
  )
}

// ─── TOOL 8: Competitor Tracker ───────────────────────────────────
function CompetitorTool() {
  const [comps,setComps]=useLocalStore('competitors',[
    {id:1,name:'Your Brand',sentiment:81,reviews:1800,rating:4.5,trend:5,note:''},
    {id:2,name:'CompA',sentiment:72,reviews:4210,rating:4.1,trend:3,note:''},
    {id:3,name:'CompB',sentiment:58,reviews:2100,rating:3.7,trend:-2,note:''},
  ])
  const [newName,setNewName]=useState('')

  const add=()=>{
    if(!newName.trim())return
    setComps([...comps,{id:Date.now(),name:newName.trim(),sentiment:65,reviews:0,rating:4.0,trend:0,note:''}])
    setNewName('')
  }
  const update=(id,field,val)=>setComps(comps.map(c=>c.id===id?{...c,[field]:typeof val==='string'&&['sentiment','reviews','trend'].includes(field)?parseFloat(val)||0:val}:c))
  const remove=(id)=>setComps(comps.filter(c=>c.id!==id))

  const best=Math.max(...comps.map(c=>c.sentiment))
  const you=comps[0]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-3">
        <div className="flex items-center justify-between"><Label>Competitor Sentiment Tracker</Label></div>
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
          {comps.map((c,i)=>(
            <Card key={c.id} className={`space-y-3 ${i===0?'border-[var(--brand)]/40 bg-[var(--brand)]/3':''}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {i===0&&<span className="text-[9px] text-white px-1.5 py-0.5 rounded bg-[var(--brand)] font-bold">YOU</span>}
                  <input className="text-sm font-semibold bg-transparent text-[var(--text)] border-none outline-none w-28" value={c.name} onChange={e=>update(c.id,'name',e.target.value)}/>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold ${c.trend>=0?'text-[var(--green)]':'text-[var(--red)]'}`}>{c.trend>=0?'↑':'↓'}{Math.abs(c.trend)}%</span>
                  {i>0&&<button onClick={()=>remove(c.id)} className="text-[var(--dim)] hover:text-[var(--red)]"><Trash2 size={10}/></button>}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[{label:'Sentiment %',field:'sentiment',val:c.sentiment},{label:'Reviews',field:'reviews',val:c.reviews},{label:'Trend %',field:'trend',val:c.trend}].map(f=>(
                  <div key={f.field}>
                    <p className="text-[9px] text-[var(--muted)]">{f.label}</p>
                    <input className="input text-xs w-full mt-0.5" type="number" value={f.val} onChange={e=>update(c.id,f.field,e.target.value)}/>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2.5 bg-[var(--border)] rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{width:`${c.sentiment}%`,background:c.sentiment===best?'var(--green)':'var(--grad)'}}/>
                </div>
                <span className="text-xs font-mono font-bold w-8 text-right" style={{color:c.sentiment===best?'var(--green)':'var(--text)'}}>{c.sentiment}%</span>
              </div>
            </Card>
          ))}
        </div>
        <div className="flex gap-2">
          <input className="input text-sm flex-1" placeholder="Add competitor..." value={newName} onChange={e=>setNewName(e.target.value)} onKeyDown={e=>e.key==='Enter'&&add()}/>
          <button onClick={add} className="btn-primary px-3"><Plus size={14}/></button>
        </div>
      </div>

      <div className="space-y-4">
        <Label>Analysis</Label>
        <div className="space-y-2">
          {[...comps].sort((a,b)=>b.sentiment-a.sentiment).map((c,i)=>(
            <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl" style={{background:i===0?'var(--green)30':i===1?'var(--amber)20':'var(--border)'}}>
              <span className="text-lg font-bold text-[var(--muted)] w-5">{i+1}</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-[var(--text)]">{c.name}</p>
                <p className="text-[10px] text-[var(--muted)]">{c.reviews.toLocaleString()} reviews</p>
              </div>
              <div className="text-right">
                <p className="text-base font-bold" style={{color:i===0?'var(--green)':i===1?'var(--amber)':'var(--muted)'}}>{c.sentiment}%</p>
                <p className="text-[9px]" style={{color:c.trend>=0?'var(--green)':'var(--red)'}}>{c.trend>=0?'↑':'↓'}{Math.abs(c.trend)}%</p>
              </div>
            </div>
          ))}
        </div>
        {you&&(
          <Card>
            <p className="text-xs font-semibold text-[var(--text)] mb-2">Your Position</p>
            {you.sentiment===best?(
              <p className="text-xs text-[var(--green)] flex items-center gap-1"><CheckCircle size={11}/>🏆 You're leading! Maintain with consistent response quality.</p>
            ):(
              <p className="text-xs text-[var(--amber)] flex items-center gap-1"><AlertCircle size={11}/>Gap of {(best-you.sentiment).toFixed(0)}% to leader. Focus on negative review resolution.</p>
            )}
          </Card>
        )}
      </div>
    </div>
  )
}

// ─── TOOL 9: Review Velocity & Alerts ────────────────────────────
function VelocityTool() {
  const [alerts,setAlerts]=useLocalStore('alerts',[
    {id:1,metric:'Sentiment Drop',threshold:10,window:'24h',active:true},
    {id:2,metric:'Negative Surge',threshold:30,window:'1h',active:true},
    {id:3,metric:'Review Flood',threshold:50,window:'6h',active:false},
    {id:4,metric:'Rating Below',threshold:3.5,window:'7d',active:true},
  ])
  const [daily,setDaily]=useState('')
  const [avg,setAvg]=useState('')
  const [newMetric,setNewMetric]=useState('')
  const [newThreshold,setNewThreshold]=useState('')

  const d=parseFloat(daily),a=parseFloat(avg)
  const vel=d&&a?((d-a)/a*100).toFixed(1):null
  const trend=vel!==null?parseFloat(vel):null
  const STATE=[{min:20,label:'Viral 🔥',c:'#f97316'},{min:10,label:'Surging 📈',c:'var(--green)'},{min:0,label:'Growing ✅',c:'#84cc16'},{min:-10,label:'Slowing ⚠️',c:'var(--amber)'},{min:-999,label:'Declining 📉',c:'var(--red)'}]
  const state=trend!==null?STATE.find(s=>trend>=s.min):null

  const toggle=(id)=>setAlerts(alerts.map(a=>a.id===id?{...a,active:!a.active}:a))
  const addAlert=()=>{
    if(!newMetric||!newThreshold)return
    setAlerts([...alerts,{id:Date.now(),metric:newMetric,threshold:parseFloat(newThreshold),window:'24h',active:true}])
    setNewMetric('');setNewThreshold('')
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-5">
        <div>
          <Label>Review Velocity Meter</Label>
          <Muted className="mb-3">Compare today's incoming reviews vs your daily average</Muted>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div><label className="text-xs text-[var(--muted)]">Today's Reviews</label><input className="input text-sm mt-1 w-full" type="number" placeholder="e.g. 45" value={daily} onChange={e=>setDaily(e.target.value)}/></div>
            <div><label className="text-xs text-[var(--muted)]">Daily Average</label><input className="input text-sm mt-1 w-full" type="number" placeholder="e.g. 30" value={avg} onChange={e=>setAvg(e.target.value)}/></div>
          </div>
          {state&&(
            <Card className="text-center space-y-2" style={{borderColor:`${state.c}40`}}>
              <p className="text-3xl">{state.label.split(' ')[1]}</p>
              <p className="text-3xl font-bold" style={{color:state.c}}>{trend>=0?'+':''}{vel}%</p>
              <p className="text-sm font-semibold" style={{color:state.c}}>{state.label.split(' ')[0]} momentum</p>
            </Card>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Smart Alert Rules</Label>
          <span className="text-[10px] text-[var(--green)]">{alerts.filter(a=>a.active).length} active</span>
        </div>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {alerts.map(a=>(
            <Card key={a.id} className={`transition-all ${a.active?'border-[var(--brand)]/30':''}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-[var(--text)]">{a.metric}</p>
                  <p className="text-[10px] text-[var(--muted)]">≥{a.threshold} in {a.window}</p>
                </div>
                <button onClick={()=>toggle(a.id)}
                  className="w-10 h-5 rounded-full relative transition-all"
                  style={{background:a.active?'var(--brand)':'var(--border)'}}>
                  <div className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all"
                    style={{left:a.active?'calc(100% - 18px)':'2px'}}/>
                </button>
              </div>
            </Card>
          ))}
        </div>
        <div className="flex gap-2">
          <input className="input text-xs flex-1" placeholder="Metric name" value={newMetric} onChange={e=>setNewMetric(e.target.value)}/>
          <input className="input text-xs w-20" placeholder="Threshold" type="number" value={newThreshold} onChange={e=>setNewThreshold(e.target.value)}/>
          <button onClick={addAlert} className="btn-primary px-2"><Plus size={12}/></button>
        </div>
      </div>
    </div>
  )
}

// ─── TOOL 10: Source Blender ──────────────────────────────────────
function SourceBlender() {
  const [sources,setSources]=useLocalStore('sources',[
    {id:1,name:'Trustpilot',weight:40,reviews:1240,avg:4.2,trend:2},
    {id:2,name:'Amazon',weight:30,reviews:3100,avg:3.9,trend:-1},
    {id:3,name:'Yelp',weight:20,reviews:540,avg:4.5,trend:3},
    {id:4,name:'G2',weight:10,reviews:210,avg:4.7,trend:1},
  ])
  const [newName,setNewName]=useState('')

  const totalW=sources.reduce((s,x)=>s+x.weight,0)
  const blended=sources.length>0?sources.reduce((acc,s)=>acc+(s.avg*(s.weight/totalW)),0).toFixed(2):0
  const totalR=sources.reduce((s,x)=>s+x.reviews,0)
  const weightedTrend=sources.length>0?(sources.reduce((acc,s)=>acc+(s.trend*(s.weight/totalW)),0)).toFixed(1):0

  const update=(id,field,val)=>setSources(sources.map(s=>s.id===id?{...s,[field]:parseFloat(val)||0}:s))
  const remove=(id)=>setSources(sources.filter(s=>s.id!==id))
  const add=()=>{
    if(!newName.trim())return
    setSources([...sources,{id:Date.now(),name:newName.trim(),weight:10,reviews:0,avg:4.0,trend:0}])
    setNewName('')
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <Label>Source Configuration</Label>
        <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
          {sources.map(s=>(
            <Card key={s.id} className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-[var(--text)]">{s.name}</p>
                <button onClick={()=>remove(s.id)} className="text-[var(--dim)] hover:text-[var(--red)]"><Trash2 size={10}/></button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[{label:'Weight %',field:'weight',val:s.weight},{label:'Avg Rating',field:'avg',val:s.avg},{label:'Trend %',field:'trend',val:s.trend}].map(f=>(
                  <div key={f.field}><p className="text-[9px] text-[var(--muted)]">{f.label}</p><input className="input text-xs w-full mt-0.5" type="number" step={f.field==='avg'?'0.1':'1'} value={f.val} onChange={e=>update(s.id,f.field,e.target.value)}/></div>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-[var(--border)] rounded-full overflow-hidden"><div className="h-full rounded-full" style={{width:`${totalW>0?s.weight/totalW*100:0}%`,background:'var(--grad)'}}/></div>
                <span className="text-[10px] font-mono text-[var(--muted)]">{totalW>0?Math.round(s.weight/totalW*100):0}%</span>
              </div>
            </Card>
          ))}
        </div>
        <div className="flex gap-2">
          <input className="input text-sm flex-1" placeholder="Add source..." value={newName} onChange={e=>setNewName(e.target.value)}/>
          <button onClick={add} className="btn-primary px-3"><Plus size={14}/></button>
        </div>
      </div>

      <div className="space-y-4">
        <Label>Blended Score</Label>
        <div className="rounded-2xl p-6 text-center space-y-2" style={{background:'var(--grad)'}}>
          <p className="text-white/70 text-sm">Weighted Average Rating</p>
          <p className="text-6xl font-display font-bold text-white">⭐ {blended}</p>
          <p className="text-white/70 text-sm">{totalR.toLocaleString()} total reviews</p>
          <div className="flex justify-center gap-2 mt-2">
            <span className="text-white/80 text-xs">{sources.length} sources</span>
            <span className="text-white/50">·</span>
            <span className={`text-xs font-semibold ${parseFloat(weightedTrend)>=0?'text-green-300':'text-red-300'}`}>{parseFloat(weightedTrend)>=0?'↑':'↓'}{Math.abs(weightedTrend)}% trend</span>
          </div>
        </div>
        <div className="space-y-2">
          {[...sources].sort((a,b)=>b.avg-a.avg).map((s,i)=>(
            <div key={s.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-[var(--bg)] border border-[var(--border)]">
              <span className="text-sm font-bold text-[var(--muted)] w-4">{i+1}</span>
              <div className="flex-1"><p className="text-xs font-medium text-[var(--text)]">{s.name}</p><p className="text-[9px] text-[var(--muted)]">{s.reviews.toLocaleString()} reviews</p></div>
              <div className="text-right"><p className="text-sm font-bold text-[var(--text)]">⭐{s.avg}</p><p className="text-[9px]" style={{color:s.trend>=0?'var(--green)':'var(--red)'}}>{s.trend>=0?'↑':'↓'}{Math.abs(s.trend)}%</p></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── TOOLS REGISTRY ──────────────────────────────────────────────
const TOOLS = [
  { id:'calc',      icon:Calculator,    label:'Advanced Calculator',     component:AdvancedCalc   },
  { id:'roi',       icon:DollarSign,    label:'Business Metrics',        component:ROITool        },
  { id:'budget',    icon:TrendingUp,    label:'Budget Tracker',          component:BudgetTool     },
  { id:'sessions',  icon:BarChart2,     label:'Session Dashboard',       component:SessionDashboard},
  { id:'store',     icon:Plug,          label:'Store Connect',           component:StoreTool      },
  { id:'notes',     icon:StickyNote,    label:'Smart Notes',             component:NotesTool      },
  { id:'nps',       icon:Users,         label:'NPS & Score Converter',   component:NPSTool        },
  { id:'compete',   icon:Target,        label:'Competitor Tracker',      component:CompetitorTool },
  { id:'velocity',  icon:Zap,           label:'Velocity & Alerts',       component:VelocityTool   },
  { id:'sources',   icon:Globe2,        label:'Source Blender',          component:SourceBlender  },
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

      {/* Tool tabs */}
      <div className="flex gap-1 px-6 py-3 bg-[var(--card)] border-b border-[var(--border)] overflow-x-auto flex-shrink-0">
        {TOOLS.map(({ id, icon: Icon, label }) => (
          <button key={id} onClick={() => setActive(id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg whitespace-nowrap text-xs font-medium transition-all flex-shrink-0 ${
              active === id ? 'text-white' : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--border)]'
            }`}
            style={active === id ? {background:'var(--grad)'} : {}}>
            <Icon size={13}/>
            {label}
          </button>
        ))}
      </div>

      {/* Tool content — full screen */}
      <div className="flex-1 overflow-y-auto p-6 lg:p-8">
        <ActiveComp/>
      </div>
    </div>
  )
}

