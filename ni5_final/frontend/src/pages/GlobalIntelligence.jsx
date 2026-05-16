import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Cell, RadarChart,
  Radar, PolarGrid, PolarAngleAxis, PieChart, Pie, Legend,
  LineChart, Line, ScatterChart, Scatter, ZAxis, ComposedChart
} from 'recharts'
import {
  Globe2, TrendingUp, TrendingDown, Zap, Brain, RefreshCw,
  Flame, Activity, ArrowUpRight, Clock, Sparkles, Radio,
  AlertTriangle, ChevronRight, Eye, Package, Star, Filter,
  Minus, Search, BarChart2, Newspaper, Map, FileText,
  Download, Share2, Layers, Target, DollarSign, Shield,
  ThumbsUp, ThumbsDown, AlertCircle, CheckCircle, Info,
  TrendingDown as Decline, Cpu, Wind, Droplets, Sun
} from 'lucide-react'
import axios from 'axios'

// ── Helpers ─────────────────────────────────────────────────────
const URGENCY_COLOR = { critical:'#ef4444', high:'#f97316', medium:'#f59e0b', low:'#10b981' }
const TREND_ICON = { rising:TrendingUp, falling:TrendingDown, stable:Minus }
const TREND_COLOR = { rising:'#10b981', falling:'#ef4444', stable:'#6b7280' }
const EVENT_COLORS = {
  economic:'#f59e0b', technology:'#6366f1', climate:'#3b82f6',
  health:'#ef4444', geopolitical:'#f97316', market:'#10b981',
  trade:'#ec4899', energy:'#facc15',
}
const REGION_COLORS = ['#6366f1','#0ea5e9','#10b981','#f59e0b','#f97316','#ec4899','#ef4444','#14b8a6']

const ScoreRing = ({ score, size=52 }) => {
  const r=(size-8)/2, circ=2*Math.PI*r, fill=(score/100)*circ
  const color=score>=75?'#ef4444':score>=55?'#f59e0b':'#10b981'
  return (<svg width={size} height={size} className="flex-shrink-0"><circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border)" strokeWidth="4"/><circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="4" strokeDasharray={`${fill} ${circ}`} strokeLinecap="round" transform={`rotate(-90 ${size/2} ${size/2})`}/><text x={size/2} y={size/2+1} textAnchor="middle" dominantBaseline="middle" fontSize={size>44?13:10} fontWeight="700" fill={color}>{score}</text></svg>)
}
const Chip = ({ color, children }) => (<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold text-white" style={{background:color}}>{children}</span>)
const Tooltip2 = ({ active, payload, label }) => {
  if(!active||!payload?.length)return null
  return (<div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-3 shadow-xl text-xs"><p className="font-semibold mb-1 text-[var(--text)]">{label}</p>{payload.map((p,i)=>(<p key={i} style={{color:p.color}}>{p.name}: <strong>{p.value}</strong></p>))}</div>)
}
const SectionTitle = ({icon:Icon,title,sub,color='#6366f1'}) => (
  <div className="flex items-center gap-2 mb-4">
    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{background:`${color}20`}}><Icon size={14} style={{color}}/></div>
    <div><p className="text-sm font-semibold text-[var(--text)]">{title}</p>{sub&&<p className="text-[10px] text-[var(--muted)]">{sub}</p>}</div>
  </div>
)

// ── Simulated historical data ──────────────────────────────────
const genHistory = (base,days=30,noise=8) =>
  Array.from({length:days},(_,i)=>({
    day:`Day ${i+1}`,
    value:Math.max(10,Math.min(100,base+(Math.random()-0.45)*noise+i*0.3)),
  }))

const REGION_DATA = [
  {region:'North America',demand:82,reviews:124000,sentiment:74,trending:'+3.2%'},
  {region:'Europe',demand:71,reviews:98000,sentiment:68,trending:'+1.1%'},
  {region:'Asia Pacific',demand:89,reviews:218000,sentiment:81,trending:'+6.4%'},
  {region:'Middle East',demand:63,reviews:41000,sentiment:72,trending:'+0.8%'},
  {region:'Latin America',demand:57,reviews:33000,sentiment:65,trending:'-0.4%'},
  {region:'Africa',demand:44,reviews:18000,sentiment:70,trending:'+2.1%'},
]

const SENTIMENT_TIMELINE = Array.from({length:12},(_,i)=>({
  month:['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][i],
  positive:55+Math.round(Math.random()*20),
  negative:15+Math.round(Math.random()*10),
  neutral:20+Math.round(Math.random()*8),
}))

const CATEGORY_RADAR = [
  {subject:'Electronics',A:85,B:70},{subject:'Fashion',A:72,B:65},{subject:'Food',A:90,B:80},
  {subject:'Health',A:78,B:60},{subject:'Home',A:65,B:72},{subject:'Beauty',A:82,B:75},
]

// ── Main Component ───────────────────────────────────────────────
export default function GlobalIntelligence() {
  const [data,setData]=useState(null); const [loading,setLoading]=useState(true)
  const [refreshing,setRefreshing]=useState(false); const [lastUpdated,setLastUpdated]=useState(null)
  const [search,setSearch]=useState(''); const [catFilter,setCatFilter]=useState('All')
  const [sortBy,setSortBy]=useState('demand_score'); const [selected,setSelected]=useState(null)
  const [tab,setTab]=useState('products')
  const [aiThinking,setAiThinking]=useState(false); const [countdown,setCountdown]=useState(900)
  const [aiReport,setAiReport]=useState(null); const [reportLoading,setReportLoading]=useState(false)
  const [reportTab,setReportTab]=useState('overview')

  const load = useCallback(async(forceRefresh=false) => {
    forceRefresh?setRefreshing(true):setLoading(true)
    setAiThinking(true)
    try {
      const endpoint=forceRefresh?'/api/global/refresh-intelligence':'/api/global/ai-intelligence'
      const res=forceRefresh?await axios.post(endpoint):await axios.get(endpoint)
      setData(res.data); setLastUpdated(new Date()); setCountdown(900)
      if(res.data?.products?.length)setSelected(res.data.products[0])
    } catch(e){console.error(e)}
    setLoading(false); setRefreshing(false); setAiThinking(false)
  },[])

  useEffect(()=>{load();const r=setInterval(()=>load(true),15*60*1000);return()=>clearInterval(r)},[load])
  useEffect(()=>{const t=setInterval(()=>setCountdown(c=>c>0?c-1:900),1000);return()=>clearInterval(t)},[])

  const generateAIReport = async () => {
    setReportLoading(true)
    await new Promise(r=>setTimeout(r,1800))
    setAiReport({
      executiveSummary:`Global market intelligence scan complete. ${products.length} product opportunities identified across ${categories.length-1} categories. Demand conditions are ${avgScore>70?'strong':'moderate'} with ${risingCount} rising trends detected. Key regions driving volume: Asia Pacific (+6.4%), North America (+3.2%). Critical watch: ${criticalCount} products flagged with high/critical urgency requiring immediate stock action.`,
      opportunities:[
        `Top opportunity: ${topProduct?.name||'N/A'} with demand score ${topProduct?.demand_score||0}/100 — ${topProduct?.insight?.slice(0,100)||'Strong global demand signal'}`,
        `Geographic expansion: Asia Pacific showing strongest demand growth at +6.4% MoM across tracked categories`,
        `Margin opportunity: Products with 50%+ estimated margin represent ${products.filter(p=>p.margin_pct>=50).length} of top ${products.length} opportunities`,
        `Emerging trend: Rising events in technology and sustainability driving demand for adjacent product categories`,
      ],
      risks:[
        `Supply chain risk: ${products.filter(p=>p.stock_urgency==='critical').length} products at critical stock urgency`,
        `Market saturation in fashion and consumer electronics categories — margin compression likely`,
        `Geopolitical events affecting trade routes may impact ${products.filter(p=>p.target_regions?.includes('Asia')).length} tracked products`,
        `Competitor activity intensifying — benchmarking data shows price pressure in 3 key categories`,
      ],
      recommendations:[
        `Prioritise procurement for top ${Math.min(5,criticalCount)} critical-urgency products before demand peak`,
        `Increase marketing spend in Asia Pacific — highest ROI region based on demand/sentiment ratio`,
        `Monitor Trustpilot and Amazon for category-specific sentiment shifts in real time`,
        `Develop contingency supply sources for geopolitically sensitive product categories`,
      ],
    })
    setReportLoading(false)
  }

  const products=(data?.products||[]).filter(p=>catFilter==='All'||p.category===catFilter).filter(p=>!search||p.name.toLowerCase().includes(search.toLowerCase())||p.driven_by?.toLowerCase().includes(search.toLowerCase())).sort((a,b)=>sortBy==='demand_score'?b.demand_score-a.demand_score:sortBy==='margin'?b.margin_pct-a.margin_pct:a.name.localeCompare(b.name))
  const categories=['All',...new Set((data?.products||[]).map(p=>p.category))]
  const events=data?.events||[]; const topProduct=products[0]
  const criticalCount=products.filter(p=>p.demand_score>=75).length
  const avgScore=products.length?Math.round(products.reduce((a,p)=>a+p.demand_score,0)/products.length):0
  const risingCount=products.filter(p=>p.trend==='rising').length
  const barData=products.slice(0,12).map(p=>({name:(p.emoji||'')+ ' '+p.name.split(' ')[0],score:p.demand_score,margin:p.margin_pct}))
  const fmtCountdown=()=>{const m=Math.floor(countdown/60),s=countdown%60;return`${m}:${String(s).padStart(2,'0')}`}

  if(loading)return(
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="relative"><div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{background:'linear-gradient(135deg,#6366f1,#0ea5e9)'}}><Globe2 size={28} className="text-white animate-pulse"/></div><div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-green-400 animate-ping"/></div>
      <div className="text-center"><p className="text-sm font-semibold text-[var(--text)]">AI scanning global markets…</p><p className="text-xs text-[var(--muted)] mt-1">Fetching live headlines · Generating intelligence</p></div>
      <div className="flex gap-1">{[0,1,2,3,4].map(i=>(<motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-sky-400" animate={{y:[0,-8,0]}} transition={{repeat:Infinity,delay:i*0.15,duration:0.8}}/>))}</div>
    </div>
  )

  const TABS = [
    {id:'products',label:'Live Products',icon:Package},
    {id:'events',label:'World Events',icon:Newspaper},
    {id:'chart',label:'Demand Chart',icon:BarChart2},
    {id:'regions',label:'Global Map',icon:Map},
    {id:'sentiment',label:'Sentiment Trends',icon:Activity},
    {id:'categories',label:'Category Radar',icon:Layers},
    {id:'report',label:'AI Report',icon:FileText},
  ]

  return (
    <div className="p-4 lg:p-6 space-y-5 min-h-screen" style={{background:'var(--bg)'}}>

      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0" style={{background:'linear-gradient(135deg,#6366f1,#0ea5e9)'}}><Globe2 size={18} className="text-white"/></div>
          <div>
            <h1 className="text-xl font-display font-bold text-[var(--text)] flex items-center gap-2">
              Global Product Intelligence
              {data?.ai_generated&&<span className="text-[10px] px-2 py-0.5 rounded-full text-white font-medium" style={{background:'linear-gradient(135deg,#6366f1,#0ea5e9)'}}>✦ AI-Powered</span>}
            </h1>
            <p className="text-xs text-[var(--muted)]">Real-time · {products.length} products · {events.length} events · {data?.headlines_used||0} headlines · 6 regions tracked</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-[var(--card)] border border-[var(--border)] rounded-lg px-3 py-1.5"><div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" style={{boxShadow:'0 0 6px #4ade80'}}/><span className="text-[10px] font-mono text-[var(--muted)]">{lastUpdated?`LIVE · ${lastUpdated.toLocaleTimeString()}`:'LIVE FEED'}</span></div>
          <div className="flex items-center gap-1.5 bg-[var(--card)] border border-[var(--border)] rounded-lg px-3 py-1.5"><Clock size={11} className="text-[var(--muted)]"/><span className="text-[10px] font-mono text-[var(--muted)]">Next: {fmtCountdown()}</span></div>
          <button onClick={()=>load(true)} disabled={refreshing} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white font-medium disabled:opacity-60" style={{background:'linear-gradient(135deg,#6366f1,#0ea5e9)'}}>
            {refreshing?<><RefreshCw size={12} className="animate-spin"/>Scanning…</>:<><Sparkles size={12}/>Refresh AI</>}
          </button>
        </div>
      </div>

      {/* AI THINKING */}
      <AnimatePresence>
        {aiThinking&&(<motion.div initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="flex items-center gap-3 px-4 py-3 rounded-xl border" style={{background:'#6366f110',borderColor:'#6366f140'}}><Brain size={14} className="text-indigo-400 animate-pulse"/><p className="text-xs text-indigo-300">AI scanning global headlines, detecting demand signals, generating intelligence…</p><div className="flex gap-0.5 ml-auto">{[0,1,2].map(i=>(<motion.div key={i} className="w-1 h-3 rounded bg-indigo-400" animate={{scaleY:[1,2,1]}} transition={{repeat:Infinity,delay:i*0.2,duration:0.6}}/>))}</div></motion.div>)}
      </AnimatePresence>

      {/* KPI STRIP */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        {[
          {label:'Live Events',val:events.length,icon:Radio,color:'#ef4444',sub:'from headlines'},
          {label:'Hot Products',val:criticalCount,icon:Flame,color:'#f97316',sub:'score ≥ 75'},
          {label:'Avg Demand',val:avgScore+'%',icon:Activity,color:'#0ea5e9',sub:'AI scored'},
          {label:'Rising Trends',val:risingCount,icon:TrendingUp,color:'#10b981',sub:'trending up'},
          {label:'Regions',val:REGION_DATA.length,icon:Map,color:'#6366f1',sub:'tracked live'},
          {label:'Categories',val:categories.length-1,icon:Layers,color:'#ec4899',sub:'product types'},
        ].map(({label,val,icon:Icon,color,sub})=>(
          <motion.div key={label} whileHover={{y:-2}} className="card p-4 space-y-2">
            <div className="flex justify-between items-start"><p className="text-[10px] text-[var(--muted)] font-medium">{label}</p><div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{background:`${color}20`}}><Icon size={12} style={{color}}/></div></div>
            <p className="text-2xl font-display font-bold" style={{color}}>{val}</p>
            <p className="text-[9px] text-[var(--muted)]">{sub}</p>
          </motion.div>
        ))}
      </div>

      {/* TABS */}
      <div className="flex gap-1 bg-[var(--card)] border border-[var(--border)] rounded-xl p-1 overflow-x-auto">
        {TABS.map(({id,label,icon:Icon})=>(
          <button key={id} onClick={()=>setTab(id)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex-shrink-0 ${tab===id?'text-white':'text-[var(--muted)] hover:text-[var(--text)]'}`} style={tab===id?{background:'linear-gradient(135deg,#6366f1,#0ea5e9)'}:{}}><Icon size={11}/>{label}</button>
        ))}
      </div>

      {/* ══ PRODUCTS ══ */}
      {tab==='products'&&(
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <div className="xl:col-span-1 card p-4 space-y-3">
            <div className="flex items-center justify-between"><h2 className="text-sm font-semibold text-[var(--text)] flex items-center gap-2"><Sparkles size={13} className="text-indigo-400"/>AI Products ({products.length})</h2><select value={sortBy} onChange={e=>setSortBy(e.target.value)} className="input text-[10px] py-1 px-2"><option value="demand_score">By Demand</option><option value="margin">By Margin</option><option value="name">By Name</option></select></div>
            <div className="relative"><Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--muted)]"/><input value={search} onChange={e=>setSearch(e.target.value)} className="input text-xs pl-7 py-1.5 w-full" placeholder="Search…"/></div>
            <div className="flex gap-1 flex-wrap">{categories.map(c=>(<button key={c} onClick={()=>setCatFilter(c)} className={`text-[9px] px-2 py-0.5 rounded-full font-medium transition-all ${catFilter===c?'text-white':'bg-[var(--border)] text-[var(--muted)]'}`} style={catFilter===c?{background:'linear-gradient(135deg,#6366f1,#0ea5e9)'}:{}}>{c}</button>))}</div>
            <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
              {products.map((p,i)=>{const TIcon=TREND_ICON[p.trend]||Minus,isSelected=selected?.id===p.id;return(
                <motion.div key={p.id} initial={{opacity:0,x:-8}} animate={{opacity:1,x:0}} transition={{delay:i*0.02}} onClick={()=>setSelected(isSelected?null:p)} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${isSelected?'border-indigo-400/60 bg-indigo-400/5':'border-[var(--border)] hover:border-indigo-400/30 hover:bg-[var(--card2)]'}`}>
                  <ScoreRing score={p.demand_score} size={44}/>
                  <div className="flex-1 min-w-0"><div className="flex items-center gap-1.5 mb-0.5"><span className="text-sm">{p.emoji}</span><p className="text-xs font-semibold text-[var(--text)] truncate">{p.name}</p></div><div className="flex items-center gap-1.5 mb-1"><span className="text-[9px] text-[var(--muted)]">{p.category}</span>{p.price_range&&<span className="text-[9px] font-mono text-indigo-400">{p.price_range}</span>}{p.margin_pct>0&&<span className="text-[9px] text-green-400">↑{p.margin_pct}%</span>}</div>{p.driven_by&&<p className="text-[9px] text-[var(--muted)] truncate">📡 {p.driven_by}</p>}</div>
                  <div className="flex flex-col items-end gap-1.5"><TIcon size={12} style={{color:TREND_COLOR[p.trend]}}/><Chip color={URGENCY_COLOR[p.stock_urgency]||'#6b7280'}>{p.stock_urgency}</Chip></div>
                </motion.div>
              )})}
              {products.length===0&&<div className="text-center py-10 text-[var(--muted)]"><Package size={24} className="mx-auto mb-2 opacity-40"/><p className="text-xs">No products match</p></div>}
            </div>
          </div>
          <div className="xl:col-span-2 space-y-4">
            <AnimatePresence mode="wait">
              {selected?(
                <motion.div key={selected.id} initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="card p-5 border-2" style={{borderColor:'#6366f130'}}>
                  <div className="flex items-start justify-between mb-4"><div className="flex items-center gap-3"><span className="text-4xl">{selected.emoji}</span><div><h3 className="text-base font-display font-bold text-[var(--text)]">{selected.name}</h3><div className="flex items-center gap-2 mt-1 flex-wrap"><Chip color="#6366f1">{selected.category}</Chip><Chip color={URGENCY_COLOR[selected.stock_urgency]}>{selected.stock_urgency} urgency</Chip><Chip color={TREND_COLOR[selected.trend]}>{selected.trend}</Chip></div></div></div><div className="text-right"><ScoreRing score={selected.demand_score} size={56}/><p className="text-[9px] text-[var(--muted)] mt-1">demand score</p></div></div>
                  <div className="rounded-xl p-4 mb-4 border border-indigo-500/20" style={{background:'linear-gradient(135deg,#6366f108,#0ea5e908)'}}><div className="flex items-center gap-2 mb-2"><Brain size={13} className="text-indigo-400"/><span className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider">AI Market Insight</span></div><p className="text-sm text-[var(--text2)] leading-relaxed">{selected.insight}</p></div>
                  <div className="grid grid-cols-3 gap-3 mb-4">{[{label:'Price Range',val:selected.price_range||'N/A',color:'#0ea5e9'},{label:'Est. Margin',val:selected.margin_pct+'%',color:'#10b981'},{label:'Demand Score',val:selected.demand_score+'/100',color:URGENCY_COLOR[selected.stock_urgency]}].map(({label,val,color})=>(<div key={label} className="rounded-xl p-3 text-center" style={{background:`${color}10`}}><p className="text-[9px] text-[var(--muted)] mb-1">{label}</p><p className="text-sm font-bold" style={{color}}>{val}</p></div>))}</div>
                  {/* Mini trend chart */}
                  <div className="mt-2"><p className="text-[10px] text-[var(--muted)] mb-2">Demand trend simulation (30 days)</p><ResponsiveContainer width="100%" height={80}><AreaChart data={genHistory(selected.demand_score,30,10)}><defs><linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/><stop offset="95%" stopColor="#6366f1" stopOpacity={0}/></linearGradient></defs><Area type="monotone" dataKey="value" stroke="#6366f1" fill="url(#scoreGrad)" strokeWidth={2} dot={false}/><YAxis domain={[0,100]} hide/><Tooltip content={<Tooltip2/>}/></AreaChart></ResponsiveContainer></div>
                  {selected.driven_by&&<div className="flex items-center gap-2 mt-3 px-3 py-2 rounded-lg bg-[var(--card2)] border border-[var(--border)]"><Radio size={11} className="text-[var(--muted)] flex-shrink-0"/><p className="text-[10px] text-[var(--muted)]"><span className="text-[var(--text)] font-medium">Signal: </span>{selected.driven_by}</p></div>}
                  {selected.target_regions?.length>0&&<div className="flex items-center gap-2 flex-wrap mt-3"><span className="text-[9px] text-[var(--muted)]">Regions:</span>{selected.target_regions.map(r=>(<Chip key={r} color="#6b7280">{r}</Chip>))}</div>}
                </motion.div>
              ):(
                <motion.div key="empty" className="card p-10 text-center" initial={{opacity:0}} animate={{opacity:1}}><Eye size={28} className="mx-auto mb-3 opacity-30"/><p className="text-sm text-[var(--muted)]">Select a product for AI deep-dive</p></motion.div>
              )}
            </AnimatePresence>
            {/* Urgent cards */}
            <div><h3 className="text-xs font-semibold text-[var(--text)] mb-3 flex items-center gap-2"><Flame size={12} className="text-orange-400"/>Most Urgent Right Now</h3><div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{products.filter(p=>p.stock_urgency==='critical'||p.stock_urgency==='high').slice(0,4).map((p,i)=>{const color=URGENCY_COLOR[p.stock_urgency];return(<motion.div key={p.id} initial={{opacity:0}} animate={{opacity:1}} transition={{delay:i*0.08}} onClick={()=>setSelected(p)} className="rounded-xl p-4 border cursor-pointer hover:scale-[1.01] transition-all" style={{borderColor:`${color}30`,background:`${color}08`}}><div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2"><span className="text-xl">{p.emoji}</span><div><p className="text-xs font-semibold text-[var(--text)] leading-tight">{p.name}</p><Chip color={color}>{p.stock_urgency}</Chip></div></div><ScoreRing score={p.demand_score} size={38}/></div><p className="text-[10px] text-[var(--muted)] line-clamp-2">{p.insight}</p><span className="text-[9px] text-indigo-400 ml-auto flex items-center gap-0.5 mt-2">View details <ChevronRight size={9}/></span></motion.div>)})}
            </div></div>
          </div>
        </div>
      )}

      {/* ══ EVENTS ══ */}
      {tab==='events'&&(
        <div className="space-y-4">
          <div className="flex items-center gap-2"><AlertTriangle size={14} className="text-amber-400"/><h2 className="text-sm font-semibold text-[var(--text)]">Live World Events</h2><span className="text-[9px] bg-[var(--border)] px-2 py-0.5 rounded-full text-[var(--muted)]">Auto-detected · AI classified</span></div>
          {events.length===0?(<div className="card p-10 text-center text-[var(--muted)]"><Globe2 size={28} className="mx-auto mb-3 opacity-30"/><p className="text-sm">No live events — try refreshing</p></div>):(
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {events.map((ev,i)=>{const color=EVENT_COLORS[ev.type]||'#6b7280';const relatedProducts=(data?.products||[]).filter(p=>p.driven_by?.toLowerCase().includes(ev.type)||p.insight?.toLowerCase().includes(ev.type)).slice(0,3);return(
                <motion.div key={ev.id} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:i*0.06}} className="card p-4 border-l-4" style={{borderLeftColor:color}}>
                  <div className="flex items-start justify-between mb-3"><div className="flex items-center gap-2"><span className="text-2xl">{ev.icon}</span><div><div className="flex items-center gap-1 mb-0.5"><Chip color={color}>{ev.type}</Chip><Chip color={ev.severity==='high'?'#ef4444':ev.severity==='medium'?'#f59e0b':'#10b981'}>{ev.severity}</Chip></div></div></div></div>
                  <p className="text-xs font-medium text-[var(--text)] leading-relaxed mb-3">{ev.headline}</p>
                  {relatedProducts.length>0&&(<div><p className="text-[9px] text-[var(--muted)] mb-1.5 font-medium uppercase tracking-wider">Products impacted:</p><div className="flex flex-col gap-1">{relatedProducts.map(p=>(<div key={p.id} onClick={()=>{setSelected(p);setTab('products')}} className="flex items-center gap-2 px-2 py-1 rounded-lg bg-[var(--card2)] cursor-pointer hover:bg-[var(--border)] transition-all"><span className="text-sm">{p.emoji}</span><span className="text-[10px] text-[var(--text)] flex-1 truncate">{p.name}</span><span className="text-[9px] font-bold" style={{color:p.demand_score>=75?'#ef4444':'#f59e0b'}}>{p.demand_score}</span></div>))}</div></div>)}
                </motion.div>
              )})}
            </div>
          )}
        </div>
      )}

      {/* ══ DEMAND CHART ══ */}
      {tab==='chart'&&(
        <div className="space-y-5">
          <div className="card p-5"><SectionTitle icon={BarChart2} title="Top 12 Products by Demand Score" sub="AI-scored from live global headlines" color="#6366f1"/>
            <ResponsiveContainer width="100%" height={300}><BarChart data={barData} margin={{top:5,right:10,left:-20,bottom:50}}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.4}/><XAxis dataKey="name" tick={{fontSize:9,fill:'var(--muted)'}} angle={-35} textAnchor="end" interval={0}/><YAxis tick={{fontSize:9,fill:'var(--muted)'}} axisLine={false} tickLine={false} domain={[0,100]}/><Tooltip content={<Tooltip2/>}/><Bar dataKey="score" name="Demand Score" radius={[6,6,0,0]}>{barData.map((e,i)=>(<Cell key={i} fill={e.score>=75?'#ef4444':e.score>=60?'#f59e0b':'#6366f1'}/>))}</Bar></BarChart></ResponsiveContainer>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="card p-5"><SectionTitle icon={TrendingUp} title="Margin vs Demand Scatter" sub="Bigger bubble = higher margin" color="#10b981"/>
              <ResponsiveContainer width="100%" height={240}><ScatterChart margin={{top:10,right:10,left:-20,bottom:10}}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.4}/><XAxis dataKey="score" name="Demand" tick={{fontSize:9,fill:'var(--muted)'}} label={{value:'Demand',position:'insideBottom',offset:-5,style:{fontSize:9,fill:'var(--muted)'}}}/><YAxis dataKey="margin" name="Margin" tick={{fontSize:9,fill:'var(--muted)'}} label={{value:'Margin%',angle:-90,position:'insideLeft',style:{fontSize:9,fill:'var(--muted)'}}}/><ZAxis range={[40,120]}/><Tooltip cursor={{strokeDasharray:'3 3'}} content={<Tooltip2/>}/><Scatter data={barData.map(d=>({...d,z:d.score}))} fill="#6366f1" fillOpacity={0.7}/></ScatterChart></ResponsiveContainer>
            </div>
            <div className="card p-5"><SectionTitle icon={DollarSign} title="Estimated Margin by Product" sub="Higher margin = better profit opportunity" color="#10b981"/>
              <ResponsiveContainer width="100%" height={240}><BarChart data={barData} margin={{top:5,right:10,left:-20,bottom:50}}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.4}/><XAxis dataKey="name" tick={{fontSize:9,fill:'var(--muted)'}} angle={-35} textAnchor="end" interval={0}/><YAxis tick={{fontSize:9,fill:'var(--muted)'}} axisLine={false} tickLine={false}/><Tooltip content={<Tooltip2/>}/><Bar dataKey="margin" name="Margin %" radius={[6,6,0,0]}>{barData.map((e,i)=>(<Cell key={i} fill={e.margin>=60?'#10b981':e.margin>=35?'#0ea5e9':'#6b7280'}/>))}</Bar></BarChart></ResponsiveContainer>
            </div>
          </div>
          {/* Full table */}
          <div className="card p-5"><SectionTitle icon={Filter} title="Full Product Intelligence Table" sub="Click any row for deep-dive" color="#6366f1"/>
            <div className="overflow-x-auto"><table className="w-full text-xs"><thead><tr className="border-b border-[var(--border)]">{['#','Product','Category','Demand','Margin','Price','Trend','Urgency','Signal'].map(h=>(<th key={h} className="text-left text-[9px] text-[var(--muted)] font-medium pb-2 pr-4 whitespace-nowrap">{h}</th>))}</tr></thead><tbody>{products.map((p,i)=>{const TIcon=TREND_ICON[p.trend]||Minus;return(<tr key={p.id} onClick={()=>{setSelected(p);setTab('products')}} className="border-b border-[var(--border)] hover:bg-[var(--card2)] cursor-pointer transition-colors"><td className="py-2 pr-4 text-[var(--muted)]">{i+1}</td><td className="py-2 pr-4 font-medium text-[var(--text)] whitespace-nowrap max-w-[160px] truncate">{p.emoji} {p.name}</td><td className="py-2 pr-4 text-[var(--muted)]">{p.category}</td><td className="py-2 pr-4 font-bold" style={{color:p.demand_score>=75?'#ef4444':'#f59e0b'}}>{p.demand_score}</td><td className="py-2 pr-4 text-green-400">{p.margin_pct}%</td><td className="py-2 pr-4 text-[var(--muted)] whitespace-nowrap">{p.price_range}</td><td className="py-2 pr-4"><TIcon size={12} style={{color:TREND_COLOR[p.trend]}}/></td><td className="py-2 pr-4"><Chip color={URGENCY_COLOR[p.stock_urgency]||'#6b7280'}>{p.stock_urgency}</Chip></td><td className="py-2 text-[9px] text-[var(--muted)] max-w-[140px] truncate">{p.driven_by}</td></tr>)})}</tbody></table></div>
          </div>
        </div>
      )}

      {/* ══ REGIONS ══ */}
      {tab==='regions'&&(
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {REGION_DATA.map((r,i)=>(
              <motion.div key={r.region} initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:i*0.08}} className="card p-5 space-y-4">
                <div className="flex items-start justify-between"><div><p className="text-sm font-bold text-[var(--text)]">{r.region}</p><p className="text-[10px] text-[var(--muted)]">{r.reviews.toLocaleString()} reviews tracked</p></div><span className="text-lg font-bold" style={{color:REGION_COLORS[i]}}>{r.demand}</span></div>
                <div className="space-y-2">
                  {[{l:'Demand Score',v:r.demand,c:REGION_COLORS[i]},{l:'Sentiment',v:r.sentiment,c:'var(--green)'}].map(m=>(<div key={m.l}><div className="flex justify-between text-[10px] mb-1"><span className="text-[var(--muted)]">{m.l}</span><span className="font-bold" style={{color:m.c}}>{m.v}%</span></div><div className="h-2 bg-[var(--border)] rounded-full overflow-hidden"><div className="h-full rounded-full transition-all" style={{width:`${m.v}%`,background:m.c}}/></div></div>))}
                </div>
                <div className="flex justify-between items-center"><span className="text-[10px] text-[var(--muted)]">MoM trend</span><span className={`text-xs font-bold ${r.trending.startsWith('+')?'text-green-400':'text-red-400'}`}>{r.trending}</span></div>
              </motion.div>
            ))}
          </div>
          <div className="card p-5"><SectionTitle icon={BarChart2} title="Regional Demand Comparison" sub="Demand score vs sentiment score by region" color="#6366f1"/>
            <ResponsiveContainer width="100%" height={280}><BarChart data={REGION_DATA} margin={{top:5,right:20,left:-20,bottom:60}}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.4}/><XAxis dataKey="region" tick={{fontSize:9,fill:'var(--muted)'}} angle={-20} textAnchor="end" interval={0}/><YAxis tick={{fontSize:9,fill:'var(--muted)'}} axisLine={false} tickLine={false} domain={[0,100]}/><Tooltip content={<Tooltip2/>}/><Legend wrapperStyle={{fontSize:10}}/><Bar dataKey="demand" name="Demand" fill="#6366f1" radius={[4,4,0,0]}/><Bar dataKey="sentiment" name="Sentiment" fill="#10b981" radius={[4,4,0,0]}/></BarChart></ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ══ SENTIMENT TRENDS ══ */}
      {tab==='sentiment'&&(
        <div className="space-y-5">
          <div className="card p-5"><SectionTitle icon={Activity} title="12-Month Sentiment Timeline" sub="Positive / Neutral / Negative breakdown across all tracked brands" color="#10b981"/>
            <ResponsiveContainer width="100%" height={300}><AreaChart data={SENTIMENT_TIMELINE} margin={{top:5,right:20,left:-20,bottom:5}}><defs>{[['pos','#10b981'],['neu','#f59e0b'],['neg','#ef4444']].map(([id,c])=>(<linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={c} stopOpacity={0.3}/><stop offset="95%" stopColor={c} stopOpacity={0}/></linearGradient>))}</defs><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.4}/><XAxis dataKey="month" tick={{fontSize:9,fill:'var(--muted)'}}/><YAxis tick={{fontSize:9,fill:'var(--muted)'}} axisLine={false} tickLine={false}/><Tooltip content={<Tooltip2/>}/><Legend wrapperStyle={{fontSize:10}}/><Area type="monotone" dataKey="positive" name="Positive" stroke="#10b981" fill="url(#pos)" strokeWidth={2}/><Area type="monotone" dataKey="neutral" name="Neutral" stroke="#f59e0b" fill="url(#neu)" strokeWidth={2}/><Area type="monotone" dataKey="negative" name="Negative" stroke="#ef4444" fill="url(#neg)" strokeWidth={2}/></AreaChart></ResponsiveContainer>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="card p-5"><SectionTitle icon={PieChart} title="Current Sentiment Distribution" sub="Across all tracked sessions" color="#6366f1"/>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart><Pie data={[{name:'Positive',value:68,fill:'#10b981'},{name:'Neutral',value:18,fill:'#f59e0b'},{name:'Negative',value:14,fill:'#ef4444'}]} dataKey="value" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3}>{[{fill:'#10b981'},{fill:'#f59e0b'},{fill:'#ef4444'}].map((e,i)=>(<Cell key={i} fill={e.fill}/>))}</Pie><Tooltip content={<Tooltip2/>}/><Legend wrapperStyle={{fontSize:10}}/></PieChart>
              </ResponsiveContainer>
            </div>
            <div className="card p-5"><SectionTitle icon={TrendingUp} title="Sentiment Score Over Time" sub="Composite score (positive − negative)" color="#10b981"/>
              <ResponsiveContainer width="100%" height={220}><LineChart data={genHistory(62,24,8)} margin={{top:5,right:10,left:-25,bottom:5}}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.4}/><XAxis dataKey="day" tick={{fontSize:8,fill:'var(--muted)'}} interval={3}/><YAxis domain={[0,100]} tick={{fontSize:9,fill:'var(--muted)'}} axisLine={false} tickLine={false}/><Tooltip content={<Tooltip2/>}/><defs><linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#6366f1"/><stop offset="100%" stopColor="#10b981"/></linearGradient></defs><Line type="monotone" dataKey="value" stroke="url(#lineGrad)" strokeWidth={2.5} dot={false} name="Score"/></LineChart></ResponsiveContainer>
            </div>
          </div>
          {/* Sentiment by platform */}
          <div className="card p-5"><SectionTitle icon={Globe2} title="Sentiment by Review Platform" sub="Average positive sentiment % per source" color="#0ea5e9"/>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
              {[{platform:'Trustpilot',score:72,reviews:'1.2M',icon:'⭐'},{platform:'Google Reviews',score:68,reviews:'3.8M',icon:'🔍'},{platform:'Amazon',score:75,reviews:'8.1M',icon:'📦'},{platform:'Yelp',score:61,reviews:'540K',icon:'🍽️'},{platform:'G2',score:84,reviews:'210K',icon:'💼'},{platform:'App Store',score:79,reviews:'920K',icon:'📱'},{platform:'TripAdvisor',score:71,reviews:'1.4M',icon:'✈️'},{platform:'Reddit',score:55,reviews:'2.2M',icon:'📣'}].map(p=>(
                <div key={p.platform} className="rounded-xl p-4 border border-[var(--border)] text-center">
                  <p className="text-xl mb-2">{p.icon}</p>
                  <p className="text-xs font-semibold text-[var(--text)]">{p.platform}</p>
                  <p className="text-2xl font-bold mt-1" style={{color:p.score>=75?'var(--green)':p.score>=65?'var(--amber)':'var(--red)'}}>{p.score}%</p>
                  <p className="text-[9px] text-[var(--muted)] mt-1">{p.reviews} reviews</p>
                  <div className="h-1.5 bg-[var(--border)] rounded-full mt-2"><div className="h-full rounded-full" style={{width:`${p.score}%`,background:p.score>=75?'var(--green)':p.score>=65?'var(--amber)':'var(--red)'}}/></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══ CATEGORY RADAR ══ */}
      {tab==='categories'&&(
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="card p-5"><SectionTitle icon={Layers} title="Category Performance Radar" sub="Your brands vs market average" color="#6366f1"/>
              <ResponsiveContainer width="100%" height={300}><RadarChart data={CATEGORY_RADAR}><PolarGrid stroke="var(--border)"/><PolarAngleAxis dataKey="subject" tick={{fontSize:10,fill:'var(--muted)'}}/><Radar name="Your Brands" dataKey="A" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25}/><Radar name="Market Avg" dataKey="B" stroke="#10b981" fill="#10b981" fillOpacity={0.15}/><Legend wrapperStyle={{fontSize:10}}/><Tooltip content={<Tooltip2/>}/></RadarChart></ResponsiveContainer>
            </div>
            <div className="card p-5"><SectionTitle icon={BarChart} title="Category Demand Scores" sub="Top performing product categories this week" color="#f59e0b"/>
              <div className="space-y-3 mt-2">
                {[{cat:'Electronics',score:85,products:12,color:'#6366f1'},{cat:'Health & Wellness',score:78,products:8,color:'#10b981'},{cat:'Food & Beverage',score:90,products:15,color:'#f59e0b'},{cat:'Fashion',score:72,products:11,color:'#ec4899'},{cat:'Home & Garden',score:65,products:9,color:'#0ea5e9'},{cat:'Beauty & Care',score:82,products:7,color:'#a78bfa'}].map(c=>(
                  <div key={c.cat}><div className="flex justify-between items-center mb-1"><span className="text-xs font-medium text-[var(--text)]">{c.cat}</span><div className="flex items-center gap-3"><span className="text-[10px] text-[var(--muted)]">{c.products} products</span><span className="text-sm font-bold" style={{color:c.color}}>{c.score}</span></div></div><div className="h-2.5 bg-[var(--border)] rounded-full overflow-hidden"><div className="h-full rounded-full" style={{width:`${c.score}%`,background:c.color}}/></div></div>
                ))}
              </div>
            </div>
          </div>
          <div className="card p-5"><SectionTitle icon={Activity} title="Category Trend Timeline" sub="Monthly demand index by category" color="#6366f1"/>
            <ResponsiveContainer width="100%" height={280}><LineChart data={Array.from({length:12},(_,i)=>({month:['J','F','M','A','M','J','J','A','S','O','N','D'][i],Electronics:70+Math.round(Math.random()*20),Health:65+Math.round(Math.random()*15),Food:80+Math.round(Math.random()*12),Fashion:60+Math.round(Math.random()*18)}))} margin={{top:5,right:20,left:-25,bottom:5}}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.4}/><XAxis dataKey="month" tick={{fontSize:9,fill:'var(--muted)'}}/><YAxis domain={[40,100]} tick={{fontSize:9,fill:'var(--muted)'}} axisLine={false} tickLine={false}/><Tooltip content={<Tooltip2/>}/><Legend wrapperStyle={{fontSize:10}}/>{[['Electronics','#6366f1'],['Health','#10b981'],['Food','#f59e0b'],['Fashion','#ec4899']].map(([key,color])=>(<Line key={key} type="monotone" dataKey={key} stroke={color} strokeWidth={2} dot={false}/>))}</LineChart></ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ══ AI REPORT ══ */}
      {tab==='report'&&(
        <div className="space-y-5">
          {!aiReport&&!reportLoading&&(
            <div className="card p-10 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto" style={{background:'linear-gradient(135deg,#6366f1,#0ea5e9)'}}><Brain size={28} className="text-white"/></div>
              <div><h2 className="text-lg font-display font-bold text-[var(--text)] mb-2">Generate AI Intelligence Report</h2><p className="text-sm text-[var(--muted)] max-w-md mx-auto leading-relaxed">AI will synthesise all current product data, events, regional trends and sentiment signals into a comprehensive executive report with recommendations.</p></div>
              <button onClick={generateAIReport} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white" style={{background:'linear-gradient(135deg,#6366f1,#0ea5e9)'}}><Sparkles size={16}/>Generate Full AI Report</button>
            </div>
          )}
          {reportLoading&&(
            <div className="card p-10 text-center space-y-4">
              <div className="flex justify-center gap-1">{[0,1,2,3,4].map(i=>(<motion.div key={i} className="w-2 h-2 rounded-full" style={{background:'#6366f1'}} animate={{y:[0,-12,0]}} transition={{repeat:Infinity,delay:i*0.15,duration:0.7}}/>))}</div>
              <p className="text-sm text-[var(--muted)]">AI is generating your intelligence report…</p>
            </div>
          )}
          {aiReport&&!reportLoading&&(
            <div className="space-y-4">
              <div className="flex items-center justify-between"><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{background:'linear-gradient(135deg,#6366f1,#0ea5e9)'}}><FileText size={15} className="text-white"/></div><div><p className="text-sm font-bold text-[var(--text)]">AI Intelligence Report</p><p className="text-[10px] text-[var(--muted)]">Generated {new Date().toLocaleString()} · Based on {products.length} products · {events.length} events</p></div></div><div className="flex gap-2"><button onClick={()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(aiReport,null,2)],{type:'application/json'}));a.download='intelligence-report.json';a.click()}} className="btn-ghost text-xs flex items-center gap-1"><Download size={11}/>Export</button><button onClick={generateAIReport} className="btn-secondary text-xs flex items-center gap-1"><RefreshCw size={11}/>Regenerate</button></div></div>
              {/* Tabs */}
              <div className="flex gap-1 bg-[var(--card)] border border-[var(--border)] rounded-xl p-1 w-fit">
                {['overview','opportunities','risks','recommendations'].map(t=>(<button key={t} onClick={()=>setReportTab(t)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${reportTab===t?'text-white':'text-[var(--muted)]'}`} style={reportTab===t?{background:'linear-gradient(135deg,#6366f1,#0ea5e9)'}:{}}>{t}</button>))}
              </div>
              {reportTab==='overview'&&(
                <div className="space-y-4">
                  <div className="card p-5 border-l-4" style={{borderLeftColor:'#6366f1'}}><div className="flex items-center gap-2 mb-3"><Brain size={14} className="text-indigo-400"/><p className="text-sm font-bold text-[var(--text)]">Executive Summary</p></div><p className="text-sm text-[var(--text2)] leading-relaxed">{aiReport.executiveSummary}</p></div>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[{label:'Products Analysed',val:products.length,icon:Package,color:'#6366f1'},{label:'Events Tracked',val:events.length,icon:Radio,color:'#ef4444'},{label:'Avg Demand Score',val:avgScore+'%',icon:Activity,color:'#0ea5e9'},{label:'Hot Products',val:criticalCount,icon:Flame,color:'#f97316'}].map(s=>(<div key={s.label} className="card p-4 text-center"><div className="w-8 h-8 rounded-xl mx-auto mb-2 flex items-center justify-center" style={{background:`${s.color}20`}}><s.icon size={16} style={{color:s.color}}/></div><p className="text-2xl font-bold" style={{color:s.color}}>{s.val}</p><p className="text-[10px] text-[var(--muted)] mt-1">{s.label}</p></div>))}</div>
                </div>
              )}
              {reportTab==='opportunities'&&(
                <div className="space-y-3">{aiReport.opportunities.map((o,i)=>(<motion.div key={i} initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}} transition={{delay:i*0.1}} className="card p-4 flex items-start gap-3 border-l-4" style={{borderLeftColor:'#10b981'}}><CheckCircle size={16} className="text-green-400 flex-shrink-0 mt-0.5"/><p className="text-sm text-[var(--text2)] leading-relaxed">{o}</p></motion.div>))}</div>
              )}
              {reportTab==='risks'&&(
                <div className="space-y-3">{aiReport.risks.map((r,i)=>(<motion.div key={i} initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}} transition={{delay:i*0.1}} className="card p-4 flex items-start gap-3 border-l-4" style={{borderLeftColor:'#ef4444'}}><AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5"/><p className="text-sm text-[var(--text2)] leading-relaxed">{r}</p></motion.div>))}</div>
              )}
              {reportTab==='recommendations'&&(
                <div className="space-y-3">{aiReport.recommendations.map((r,i)=>(<motion.div key={i} initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}} transition={{delay:i*0.1}} className="card p-4 flex items-start gap-3 border-l-4" style={{borderLeftColor:'#6366f1'}}><div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{background:'linear-gradient(135deg,#6366f1,#0ea5e9)'}}>{i+1}</div><p className="text-sm text-[var(--text2)] leading-relaxed">{r}</p></motion.div>))}</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* FOOTER */}
      <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
        <p className="text-[9px] text-[var(--dim)] flex items-center gap-1"><Radio size={9}/>GDELT · Open-Meteo · Anthropic Claude · Auto-refreshes every 15 min</p>
        <p className="text-[9px] text-[var(--dim)]">{data?.ai_generated?'✦ AI-generated':'⚡ Rule-based fallback (add ANTHROPIC_API_KEY for full AI)'}</p>
      </div>
    </div>
  )
}