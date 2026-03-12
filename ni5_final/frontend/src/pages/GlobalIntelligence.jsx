import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Cell, Legend, ScatterChart, Scatter, ZAxis
} from 'recharts'
import {
  Globe2, TrendingUp, TrendingDown, Zap, AlertTriangle, Brain,
  BarChart2, Search, RefreshCw, ChevronDown, MapPin, Clock,
  Flame, Shield, Activity, Package, Star, ArrowUpRight,
  ArrowDownRight, Minus, Info, Filter, ChevronRight, Lightbulb,
  Radio, Target, Eye, Cpu
} from 'lucide-react'

// ── Data Helpers ─────────────────────────────────────────────────
const REGIONS = ['Global','North America','Europe','Middle East','South Asia','East Asia','Africa','Latin America']

const GLOBAL_EVENTS = [
  { id:'covid', icon:'🦠', label:'COVID-19 Resurgence',      type:'health',    severity:'critical', region:'Global',      impact:'high',   color:'#ef4444' },
  { id:'iran_israel', icon:'⚔️', label:'Iran-Israel Conflict', type:'geopolitical', severity:'high',  region:'Middle East', impact:'high',   color:'#f97316' },
  { id:'ukraine', icon:'🌍',  label:'Ukraine-Russia War',    type:'geopolitical', severity:'high',  region:'Europe',      impact:'medium', color:'#f97316' },
  { id:'flood', icon:'🌊',   label:'Monsoon Flooding',       type:'climate',   severity:'medium',  region:'South Asia',  impact:'medium', color:'#60a5fa' },
  { id:'heatwave', icon:'🌡️', label:'Global Heatwave',       type:'climate',   severity:'medium',  region:'Global',      impact:'medium', color:'#facc15' },
  { id:'recession', icon:'📉', label:'Economic Slowdown',    type:'economic',  severity:'high',    region:'Global',      impact:'high',   color:'var(--sky2,#38bdf8)' },
  { id:'election', icon:'🗳️', label:'US Presidential Election',type:'political',severity:'medium',  region:'North America',impact:'low',   color:'#10b981' },
  { id:'chip_war', icon:'💻', label:'Chip Export Restrictions',type:'trade',   severity:'high',    region:'East Asia',   impact:'high',   color:'#ec4899' },
]

const PRODUCT_UNIVERSE = [
  // Health & Medical
  { id:'n95_masks',      name:'3M N95 Respirator Masks',        category:'Health',     baseScore:38, emoji:'😷', price:'$28/box', margin:'62%', stockLevel:'low',    events:['covid'],                       insight:'N95 specifically (not surgical) surge 1200% in respiratory outbreaks. Pre-position 3M supply contracts before health alerts escalate. Middle East + South Asia top demand zones.' },
  { id:'pulse_ox',       name:'Pulse Oximeters',                category:'Health',     baseScore:35, emoji:'💉', price:'$22',     margin:'55%', stockLevel:'medium', events:['covid'],                       insight:'COVID-19 triggers home monitoring demand. Sales velocity tracks exactly with hospitalization rates. Bundle with thermometers for 3x basket value.' },
  { id:'hand_sanitizer', name:'Dettol Hand Sanitizer 500ml',    category:'Health',     baseScore:42, emoji:'🧴', price:'$8',      margin:'48%', stockLevel:'high',   events:['covid'],                       insight:'Sanitizer demand has a 6-week lead time on COVID surges. Stockpile at first outbreak signals. Dettol brand commands 40% premium over generic.' },
  { id:'ibuprofen',      name:'Ibuprofen 400mg (OTC)',          category:'Health',     baseScore:55, emoji:'💊', price:'$12',     margin:'58%', stockLevel:'medium', events:['covid','heatwave'],            insight:'Dual demand driver: fever management in COVID + pain relief in heatwaves. Consistent baseline with 3x spike potential. High-margin category.' },
  { id:'water_filter',   name:'Brita Water Filter Pitcher',     category:'Health',     baseScore:40, emoji:'💧', price:'$45',     margin:'52%', stockLevel:'medium', events:['flood','heatwave'],            insight:'Flood contamination events cause 500% regional demand spikes. Lead 4-6 weeks. South Asia & Africa have structural water quality demand independent of events.' },

  // Energy & Power
  { id:'portable_gen',   name:'Honda 2200W Portable Generator',  category:'Energy',     baseScore:42, emoji:'⚡', price:'$1100',   margin:'28%', stockLevel:'low',    events:['ukraine','flood'],            insight:'Power infrastructure attacks or flood damage creates 6-18 month sustained demand. Honda premium justified — customers pay more for reliability in emergencies. Pre-order inventory before winter conflicts.' },
  { id:'solar_panel',    name:'400W Monocrystalline Solar Panel', category:'Energy',     baseScore:58, emoji:'☀️', price:'$280',    margin:'35%', stockLevel:'medium', events:['heatwave','ukraine'],         insight:'European energy crisis drove 400% solar demand. Heatwaves push cooling costs up, accelerating solar ROI math for consumers. EU subsidies magnify demand. 18-month lead time on inventory.' },
  { id:'power_bank',     name:'Anker 26800mAh Power Bank',       category:'Energy',     baseScore:62, emoji:'🔋', price:'$65',     margin:'45%', stockLevel:'medium', events:['ukraine','flood'],            insight:'Power bank demand spikes immediately during any grid disruption. Fast-moving inventory, high turns. Crisis scenarios last 2-12 weeks — plan restocking cadence accordingly.' },
  { id:'fuel_canister',  name:'20L Jerry Can Fuel Canister',     category:'Energy',     baseScore:35, emoji:'⛽', price:'$35',     margin:'40%', stockLevel:'medium', events:['iran_israel','ukraine'],      insight:'Geopolitical events in oil-producing regions trigger hoarding behavior. 3-day demand windows before regulations kick in. Middle East demand is structural, not crisis-driven.' },

  // Food & Grocery
  { id:'rice_bulk',      name:'Basmati Rice 25kg Bulk Bag',      category:'Food',       baseScore:52, emoji:'🍚', price:'$48',     margin:'32%', stockLevel:'medium', events:['ukraine','flood'],            insight:'Staple food demand is near-inelastic. Ukraine war disrupted 30% of global grain supply. Rice demand surges in South Asia during monsoon disruptions. Logistics are the bottleneck, not supply.' },
  { id:'canned_tuna',    name:'Princes Canned Tuna 6-Pack',      category:'Food',       baseScore:45, emoji:'🐟', price:'$14',     margin:'42%', stockLevel:'high',   events:['covid','recession'],          insight:'Shelf-stable protein is a recession hedge AND panic-buying staple. Tuna specifically sees 300% velocity in lockdowns. Keep 8-week inventory buffer year-round.' },
  { id:'bread_flour',    name:'Strong White Bread Flour 16kg',   category:'Food',       baseScore:48, emoji:'🌾', price:'$22',     margin:'28%', stockLevel:'medium', events:['ukraine','recession'],        insight:'Ukraine produces 12% of global wheat. Direct correlation to bread flour pricing. Home baking surged 700% in COVID lockdowns. Dual demand driver.' },
  { id:'cooking_oil',    name:'Sunflower Cooking Oil 5L',        category:'Food',       baseScore:50, emoji:'🫙', price:'$18',     margin:'30%', stockLevel:'low',    events:['ukraine','recession'],        insight:'Ukraine supplies 50% of global sunflower oil. Price increase 300% in 2022. Consumers substitute to palm oil. Position both for pricing arbitrage.' },

  // Tech & Electronics
  { id:'laptop',         name:'Lenovo IdeaPad 15" Laptop',       category:'Tech',       baseScore:65, emoji:'💻', price:'$680',    margin:'18%', stockLevel:'medium', events:['covid','chip_war'],           insight:'Chip shortage from export restrictions limits supply while demand stays constant. Each chip restriction tightening raises retail price floor 8-15%. Stock before announcements, not after.' },
  { id:'webcam',         name:'Logitech C920 HD Webcam',          category:'Tech',       baseScore:60, emoji:'📷', price:'$85',     margin:'42%', stockLevel:'high',   events:['covid'],                      insight:'Work-from-home mandates create overnight demand surges. Logitech specifically sold out globally in 2020. 4-month lead time means positioning must precede lockdown declarations.' },
  { id:'gpu',            name:'NVIDIA RTX 4060 Graphics Card',   category:'Tech',       baseScore:58, emoji:'🖥️', price:'$299',    margin:'15%', stockLevel:'low',    events:['chip_war'],                   insight:'US-China chip restrictions most directly impact NVIDIA supply chain. Price premium grows with each restriction cycle. Low margin but high volume + secondary market arbitrage.' },
  { id:'smartphone',     name:'Samsung Galaxy A55 5G',           category:'Tech',       baseScore:70, emoji:'📱', price:'$380',    margin:'22%', stockLevel:'medium', events:['chip_war'],                   insight:'Mid-range Android demand is inelastic globally. Chip restrictions create supply floor but demand stays. South Asia & Africa are volume markets — prioritize SKUs for these regions.' },

  // Apparel & Safety
  { id:'rain_jacket',    name:'Columbia Waterproof Rain Jacket', category:'Apparel',    baseScore:35, emoji:'🧥', price:'$120',    margin:'55%', stockLevel:'medium', events:['flood'],                      insight:'Monsoon season demand is predictable and regional. South/East Asia peak in June-September. Columbia brand holds premium but generic alternatives serve price-sensitive markets adequately.' },
  { id:'body_armor',     name:'Personal Safety Vest (Level II)', category:'Safety',     baseScore:30, emoji:'🛡️', price:'$180',    margin:'60%', stockLevel:'low',    events:['iran_israel','ukraine'],      insight:'Conflict proximity drives civilian safety gear demand. Israel-Iran tensions push demand in Middle East by 400%. Regulatory compliance by country is critical before stocking.' },
  { id:'first_aid_kit',  name:'Complete First Aid Kit 200-Piece',category:'Safety',     baseScore:50, emoji:'🩹', price:'$48',     margin:'65%', stockLevel:'high',   events:['covid','flood','iran_israel'], insight:'Universal crisis product. Demand correlates with ANY emergency type. High margin, compact, non-perishable. Ideal anchor product for crisis inventory strategy.' },

  // Appliances & Comfort
  { id:'air_purifier',   name:'Dyson TP07 Air Purifier',         category:'Appliances', baseScore:55, emoji:'🌀', price:'$650',    margin:'40%', stockLevel:'medium', events:['covid','heatwave'],            insight:'Air quality anxiety drives purifier demand post-COVID. Wildfire smoke from climate events also drives spikes. Dyson brand loyalty strong — consumers rarely substitute down.' },
  { id:'portable_ac',    name:'Portable Air Conditioner 12000BTU',category:'Appliances',baseScore:52, emoji:'❄️', price:'$450',    margin:'35%', stockLevel:'low',    events:['heatwave'],                   insight:'Heat emergency = AC demand surge within 48 hours. Portable units outsell window units in urban Europe & Asia (installation restrictions). Plan regional warehouse pre-positioning.' },
  { id:'water_cooler',   name:'Water Dispenser & Cooler',        category:'Appliances', baseScore:45, emoji:'🚰', price:'$180',    margin:'38%', stockLevel:'medium', events:['heatwave','flood'],           insight:'Extreme heat + flood water contamination dual-drives water cooler demand. Rental model outperforms retail in South Asia markets. Keep 6-week regional inventory buffer.' },

  // Services & Logistics
  { id:'vpn_sub',        name:'NordVPN 2-Year Subscription',     category:'Services',   baseScore:60, emoji:'🔐', price:'$89',     margin:'78%', stockLevel:'N/A',    events:['chip_war','election'],        insight:'Geopolitical tensions and internet censorship fears spike VPN subscriptions. Digital product — zero inventory risk, infinite margin. Iran-conflict drives Middle East demand surge.' },
  { id:'packaging',      name:'Corrugated Shipping Boxes (100pk)',category:'Services',   baseScore:65, emoji:'📦', price:'$85',     margin:'38%', stockLevel:'medium', events:['covid'],                      insight:'E-commerce surge from lockdowns created permanent packaging demand uplift. Supply chain disruptions raise box prices 60-80%. Pre-securing packaging contracts is competitive advantage.' },
]

const CITY_DATA = {
  'Global':        [{city:'New York',score:78},{city:'London',score:72},{city:'Dubai',score:85},{city:'Shanghai',score:68},{city:'Karachi',score:60},{city:'Lagos',score:55},{city:'São Paulo',score:63},{city:'Tokyo',score:74}],
  'North America': [{city:'New York',score:78},{city:'Los Angeles',score:75},{city:'Chicago',score:70},{city:'Toronto',score:72},{city:'Miami',score:68}],
  'Europe':        [{city:'London',score:72},{city:'Berlin',score:70},{city:'Paris',score:74},{city:'Warsaw',score:65},{city:'Istanbul',score:78}],
  'Middle East':   [{city:'Dubai',score:85},{city:'Riyadh',score:80},{city:'Tehran',score:62},{city:'Tel Aviv',score:71},{city:'Amman',score:68}],
  'South Asia':    [{city:'Karachi',score:60},{city:'Mumbai',score:65},{city:'Delhi',score:63},{city:'Dhaka',score:58},{city:'Colombo',score:62}],
  'East Asia':     [{city:'Shanghai',score:68},{city:'Tokyo',score:74},{city:'Seoul',score:76},{city:'Taipei',score:73},{city:'Singapore',score:80}],
  'Africa':        [{city:'Lagos',score:55},{city:'Cairo',score:60},{city:'Nairobi',score:58},{city:'Johannesburg',score:62},{city:'Casablanca',score:57}],
  'Latin America': [{city:'São Paulo',score:63},{city:'Buenos Aires',score:60},{city:'Mexico City',score:65},{city:'Bogotá',score:58},{city:'Lima',score:56}],
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function generateTrendData(baseScore, eventMultipliers) {
  return MONTHS.map((month, i) => {
    let val = baseScore + Math.sin(i * 0.5) * 8 + (Math.random() - 0.5) * 12
    const eventsApplied = eventMultipliers.filter((_, ei) => ei % 3 === i % 3)
    eventsApplied.forEach(m => { val *= m })
    return { month, demand: Math.max(10, Math.min(100, Math.round(val))), forecast: Math.max(10, Math.min(100, Math.round(val * (1 + (Math.random()-0.3)*0.2)))) }
  })
}

function getEventMultipliers(product, activeEvents) {
  const relevant = product.events.filter(e => activeEvents.includes(e))
  return relevant.length > 0 ? [1.4, 1.6, 1.2].slice(0, relevant.length) : [1.0]
}

function calcDemandScore(product, activeEvents) {
  const relevant = product.events.filter(e => activeEvents.includes(e))
  const boost = relevant.length * 22
  return Math.min(99, product.baseScore + boost + Math.floor(Math.random() * 8))
}

// ── Sub-components ───────────────────────────────────────────────
const Badge = ({ color, children }) => (
  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold text-white"
    style={{background: color}}>{children}</span>
)

const ScoreRing = ({ score, size = 56 }) => {
  const r = (size - 8) / 2
  const circ = 2 * Math.PI * r
  const fill = (score / 100) * circ
  const color = score >= 70 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444'
  return (
    <svg width={size} height={size} className="flex-shrink-0">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border)" strokeWidth="4"/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="4"
        strokeDasharray={`${fill} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}/>
      <text x={size/2} y={size/2+1} textAnchor="middle" dominantBaseline="middle"
        fontSize={size > 40 ? 13 : 10} fontWeight="700" fill={color}>{score}</text>
    </svg>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-3 shadow-xl text-xs">
      <p className="font-semibold text-[var(--text)] mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{color: p.color}}>{p.name}: <strong>{p.value}</strong></p>
      ))}
    </div>
  )
}

// ── Main Component ───────────────────────────────────────────────
export default function GlobalIntelligence() {
  const [activeEvents, setActiveEvents] = useState(['covid', 'iran_israel'])
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [region, setRegion] = useState('Global')
  const [searchQ, setSearchQ] = useState('')
  const [catFilter, setCatFilter] = useState('All')
  const [tab, setTab] = useState('radar')
  const [analyzing, setAnalyzing] = useState(false)
  const [pulse, setPulse] = useState(false)
  const [sortBy, setSortBy] = useState('score')
  const [liveNews, setLiveNews] = useState({})
  const [weatherAlerts, setWeatherAlerts] = useState([])
  const [liveIntensity, setLiveIntensity] = useState({})
  const [lastFetched, setLastFetched] = useState(null)
  const [fetchingLive, setFetchingLive] = useState(false)
  const [selectedEventNews, setSelectedEventNews] = useState(null)
  const [newsLoading, setNewsLoading] = useState(false)

  // Fetch real-time data from backend (which calls free APIs)
  const fetchLiveData = async () => {
    setFetchingLive(true)
    try {
      const [weatherRes, eventsRes] = await Promise.allSettled([
        fetch('/api/global/weather-events').then(r => r.json()),
        fetch('/api/global/events/live').then(r => r.json()),
      ])
      if (weatherRes.status === 'fulfilled') {
        setWeatherAlerts(weatherRes.value.alerts || [])
      }
      if (eventsRes.status === 'fulfilled') {
        const intensityMap = {}
        for (const ev of (eventsRes.value.events || [])) {
          intensityMap[ev.id] = ev.intensity
        }
        setLiveIntensity(intensityMap)
        // Auto-activate events with high live intensity
        const highIntensity = (eventsRes.value.events || []).filter(e => e.intensity > 30).map(e => e.id)
        if (highIntensity.length > 0) {
          setActiveEvents(prev => [...new Set([...prev, ...highIntensity])])
        }
      }
      setLastFetched(new Date().toLocaleTimeString())
    } catch(e) {}
    setFetchingLive(false)
    setPulse(true)
    setTimeout(() => setPulse(false), 600)
  }

  const fetchNewsForEvent = async (eventId) => {
    setNewsLoading(true); setSelectedEventNews(null)
    try {
      const r = await fetch(`/api/global/news/${eventId}`)
      const d = await r.json()
      setSelectedEventNews(d)
    } catch {}
    setNewsLoading(false)
  }

  useEffect(() => {
    fetchLiveData()
    const interval = setInterval(fetchLiveData, 15 * 60 * 1000) // refresh every 15 min
    return () => clearInterval(interval)
  }, [])

  const categories = ['All', ...new Set(PRODUCT_UNIVERSE.map(p => p.category))]

  const toggleEvent = (id) => {
    setActiveEvents(ev => ev.includes(id) ? ev.filter(e => e !== id) : [...ev, id])
    setPulse(true)
    setTimeout(() => setPulse(false), 600)
  }

  const handleAnalyze = async () => {
    setAnalyzing(true)
    await fetchLiveData()
    setAnalyzing(false)
  }

  const products = PRODUCT_UNIVERSE
    .filter(p => catFilter === 'All' || p.category === catFilter)
    .filter(p => !searchQ || p.name.toLowerCase().includes(searchQ.toLowerCase()))
    .map(p => ({ ...p, score: calcDemandScore(p, activeEvents), relevant: p.events.filter(e => activeEvents.includes(e)).length }))
    .sort((a, b) => sortBy === 'score' ? b.score - a.score : sortBy === 'relevant' ? b.relevant - a.relevant : a.name.localeCompare(b.name))

  const topProduct = products[0]
  const criticalCount = products.filter(p => p.score >= 75).length
  const avgScore = Math.round(products.reduce((a, p) => a + p.score, 0) / products.length)

  const cityData = CITY_DATA[region] || CITY_DATA['Global']
  const radarData = products.slice(0, 6).map(p => ({ product: p.name.split(' ')[0], score: p.score, base: p.baseScore }))
  const heatData = products.slice(0, 8).map(p => ({ name: p.emoji + ' ' + p.name.split(' ')[0], score: p.score, events: p.relevant, category: p.category }))

  const trendData = selectedProduct
    ? generateTrendData(selectedProduct.baseScore, getEventMultipliers(selectedProduct, activeEvents))
    : generateTrendData(topProduct?.baseScore || 50, [1.3])

  return (
    <div className="p-4 lg:p-6 space-y-5 min-h-screen" style={{background:'var(--bg)'}}>

      {/* ── PAGE HEADER ── */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{background:'linear-gradient(135deg, var(--sky,#0ea5e9), var(--sky2,#38bdf8))'}}>
              <Globe2 size={16} className="text-white"/>
            </div>
            <div>
              <h1 className="text-xl font-display font-bold text-[var(--text)]">Global Product Intelligence</h1>
              <p className="text-xs text-[var(--muted)]">Real-time demand forecasting driven by world events · {PRODUCT_UNIVERSE.length} products · {REGIONS.length} regions</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-[var(--card)] border border-[var(--border)] rounded-lg px-3 py-1.5">
            <div className={`w-2 h-2 rounded-full ${pulse ? 'bg-[var(--amber)]' : 'bg-[var(--green)]'} transition-colors`}
              style={{boxShadow: pulse ? '0 0 6px var(--amber)' : '0 0 6px var(--green)'}}/>
            <span className="text-[10px] text-[var(--muted)] font-mono">
              {lastFetched ? `LIVE · ${lastFetched}` : fetchingLive ? 'FETCHING...' : 'LIVE FEED'}
            </span>
          </div>
          <select value={region} onChange={e => setRegion(e.target.value)}
            className="input text-xs py-1.5 pr-6 bg-[var(--card)]" style={{appearance:'none'}}>
            {REGIONS.map(r => <option key={r}>{r}</option>)}
          </select>
          <button onClick={handleAnalyze}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white font-medium transition-all hover:opacity-90"
            style={{background:'linear-gradient(135deg,var(--sky,#0ea5e9),var(--sky2,#38bdf8))'}}>
            {analyzing ? <RefreshCw size={12} className="animate-spin"/> : <Brain size={12}/>}
            {analyzing ? 'Analyzing...' : 'Re-Analyze'}
          </button>
        </div>
      </div>

      {/* ── KPI STRIP ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label:'Active Events',     val: activeEvents.length,   icon:Radio,    color:'#ef4444', sub:'influencing demand'  },
          { label:'Hot Products',      val: criticalCount,          icon:Flame,    color:'#f97316', sub:'score ≥ 75'          },
          { label:'Avg Demand Score',  val: avgScore + '%',         icon:Activity, color:'var(--sky,#0ea5e9)', sub:'across all products'  },
          { label:'Top Opportunity',   val: topProduct?.emoji + ' ' + (topProduct?.name.split(' ')[0] || '—'), icon:Target, color:'#10b981', sub:'highest demand score' },
        ].map(({ label, val, icon:Icon, color, sub }) => (
          <motion.div key={label} whileHover={{y:-2}} className="card p-4 space-y-2 cursor-default">
            <div className="flex justify-between items-start">
              <p className="text-[10px] text-[var(--muted)] font-medium">{label}</p>
              <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{background:`${color}20`}}>
                <Icon size={12} style={{color}}/>
              </div>
            </div>
            <p className="text-xl font-display font-bold" style={{color}}>{val}</p>
            <p className="text-[9px] text-[var(--muted)]">{sub}</p>
          </motion.div>
        ))}
      </div>

      {/* ── LIVE WEATHER ALERTS ── */}
      {weatherAlerts.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {weatherAlerts.map((a, i) => (
            <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-white"
              style={{background: a.severity === 'high' ? '#ef4444' : '#f59e0b'}}>
              <span>{a.type === 'extreme_heat' ? '🌡️' : a.type === 'heavy_rain' ? '🌧️' : a.type === 'storm' ? '🌪️' : '❄️'}</span>
              <span>{a.city}: {a.type.replace('_',' ')} {a.value}</span>
            </div>
          ))}
          <span className="text-[10px] text-[var(--muted)] self-center">Live weather from Open-Meteo API</span>
        </div>
      )}

      {/* ── WORLD EVENTS PANEL ── */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle size={14} className="text-[var(--amber)]"/>
            <h2 className="text-sm font-semibold text-[var(--text)]">Active World Events</h2>
            <span className="text-[9px] text-[var(--muted)] bg-[var(--border)] px-1.5 py-0.5 rounded-full">Toggle to update demand</span>
          </div>
          <span className="text-[10px] text-[var(--muted)]">{activeEvents.length} / {GLOBAL_EVENTS.length} active</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {GLOBAL_EVENTS.map(ev => {
            const on = activeEvents.includes(ev.id)
            return (
              <motion.button key={ev.id} whileTap={{scale:0.95}} onClick={() => toggleEvent(ev.id)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-center transition-all cursor-pointer ${on ? 'border-transparent' : 'border-[var(--border)] opacity-50 hover:opacity-75'}`}
                style={on ? {background:`${ev.color}20`, borderColor:`${ev.color}60`} : {}}>
                <span className="text-2xl">{ev.icon}</span>
                <p className="text-[9px] font-semibold leading-tight" style={{color: on ? ev.color : 'var(--muted)'}}>{ev.label}</p>
                <div className="flex items-center gap-1">
                  <MapPin size={8} style={{color: on ? ev.color : 'var(--dim)'}}/>
                  <span className="text-[8px]" style={{color:'var(--dim)'}}>{ev.region}</span>
                </div>
                <div className={`w-4 h-2 rounded-full transition-all ${on ? 'opacity-100' : 'opacity-30'}`}
                  style={{background: ev.color}}/>
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* ── MAIN GRID ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* Products List */}
        <div className="xl:col-span-1 space-y-3">
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-[var(--text)]">Product Demand Ranking</h2>
              <select value={sortBy} onChange={e=>setSortBy(e.target.value)} className="input text-[10px] py-1 px-2">
                <option value="score">By Score</option>
                <option value="relevant">By Events</option>
                <option value="name">By Name</option>
              </select>
            </div>

            {/* Search + filter */}
            <div className="flex gap-2 mb-3">
              <div className="relative flex-1">
                <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--muted)]"/>
                <input value={searchQ} onChange={e=>setSearchQ(e.target.value)}
                  className="input text-xs pl-7 py-1.5 w-full" placeholder="Search products…"/>
              </div>
            </div>

            <div className="flex gap-1 flex-wrap mb-3">
              {categories.map(c => (
                <button key={c} onClick={() => setCatFilter(c)}
                  className={`text-[9px] px-2 py-0.5 rounded-full font-medium transition-all ${catFilter===c?'text-white':'bg-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]'}`}
                  style={catFilter===c?{background:'linear-gradient(135deg,var(--sky,#0ea5e9),var(--sky2,#38bdf8))'}:{}}>{c}</button>
              ))}
            </div>

            <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
              {products.map((p, i) => (
                <motion.div key={p.id} initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}} transition={{delay:i*0.03}}
                  onClick={() => setSelectedProduct(p === selectedProduct ? null : p)}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all hover:border-sky-400/40 ${selectedProduct?.id===p.id?'border-sky-400/60 bg-sky-400/5':'border-[var(--border)] hover:bg-[var(--card2)]'}`}>
                  <ScoreRing score={p.score} size={44}/>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 mb-0.5">
                      <span className="text-base">{p.emoji}</span>
                      <p className="text-xs font-semibold text-[var(--text)] truncate">{p.name}</p>
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[9px] text-[var(--muted)]">{p.category}</span>
                      {p.price && <span className="text-[9px] font-mono text-sky-400">{p.price}</span>}
                      {p.margin && <span className="text-[9px] text-[var(--green)]">↑{p.margin}</span>}
                    </div>
                    {p.relevant > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {p.events.filter(e => activeEvents.includes(e)).map(eid => {
                          const ev = GLOBAL_EVENTS.find(x=>x.id===eid)
                          return ev ? <span key={eid} className="text-[8px] px-1 py-0.5 rounded font-medium text-white" style={{background:ev.color+'cc'}}>{ev.icon} {ev.label.split(' ')[0]}</span> : null
                        })}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {p.score >= 75 ? <Flame size={12} className="text-[#f97316]"/> : p.score >= 55 ? <TrendingUp size={12} className="text-[var(--green)]"/> : <Minus size={12} className="text-[var(--muted)]"/>}
                    {p.stockLevel && p.stockLevel !== 'N/A' && (
                      <span className="text-[8px] px-1 rounded font-medium" style={{background:p.stockLevel==='low'?'#ef444420':p.stockLevel==='high'?'#10b98120':'#f59e0b20',color:p.stockLevel==='low'?'#ef4444':p.stockLevel==='high'?'#10b981':'#f59e0b'}}>{p.stockLevel}</span>
                    )}
                    <ChevronRight size={10} className="text-[var(--dim)]"/>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel: Charts + Insights */}
        <div className="xl:col-span-2 space-y-4">

          {/* Selected Product Deep-Dive */}
          <AnimatePresence>
            {selectedProduct && (
              <motion.div key={selectedProduct.id} initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}}
                className="card p-5 border-2" style={{borderColor:'var(--sky,#0ea5e9)50'}}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{selectedProduct.emoji}</span>
                    <div>
                      <h3 className="text-base font-display font-bold text-[var(--text)]">{selectedProduct.name}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge color="var(--sky,#0ea5e9)">{selectedProduct.category}</Badge>
                        <Badge color={selectedProduct.score>=75?'#ef4444':selectedProduct.score>=55?'#f59e0b':'#6b7280'}>
                          Score: {selectedProduct.score}
                        </Badge>
                        {selectedProduct.relevant > 0 && <Badge color="#10b981">{selectedProduct.relevant} event{selectedProduct.relevant>1?'s':''} active</Badge>}
                      </div>
                    </div>
                  </div>
                  <button onClick={()=>setSelectedProduct(null)} className="text-[var(--muted)] hover:text-[var(--text)] transition-colors text-lg">✕</button>
                </div>

                {/* AI Insight Box */}
                <div className="rounded-xl p-4 mb-4 border border-purple-500/30" style={{background:'linear-gradient(135deg,var(--sky,#0ea5e9)08,var(--sky2,#38bdf8)08)'}}>
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb size={13} className="text-sky-400"/>
                    <span className="text-[10px] font-semibold text-sky-400 uppercase tracking-wider">Deep Intelligence</span>
                  </div>
                  <p className="text-sm text-[var(--text2)] leading-relaxed">{selectedProduct.insight}</p>
                </div>

                {/* 12-Month Demand Chart */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold text-[var(--text)]">12-Month Demand Forecast</p>
                    <div className="flex gap-3 text-[9px] text-[var(--muted)]">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[var(--sky,#0ea5e9)] inline-block"/>Actual</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#10b981] inline-block"/>Forecast</span>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={180}>
                    <AreaChart data={trendData} margin={{top:5,right:10,left:-20,bottom:0}}>
                      <defs>
                        <linearGradient id="demGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--sky,#0ea5e9)" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="var(--sky,#0ea5e9)" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="frcGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.5}/>
                      <XAxis dataKey="month" tick={{fontSize:9,fill:'var(--muted)'}} axisLine={false} tickLine={false}/>
                      <YAxis tick={{fontSize:9,fill:'var(--muted)'}} axisLine={false} tickLine={false} domain={[0,100]}/>
                      <Tooltip content={<CustomTooltip/>}/>
                      <Area type="monotone" dataKey="demand" name="Demand" stroke="var(--sky,#0ea5e9)" fill="url(#demGrad)" strokeWidth={2}/>
                      <Area type="monotone" dataKey="forecast" name="Forecast" stroke="#10b981" fill="url(#frcGrad)" strokeWidth={2} strokeDasharray="4 2"/>
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* Radar Chart */}
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex gap-2 text-[9px]">
                  {['radar','bar','scatter'].map(t=>(
                    <button key={t} onClick={()=>setTab(t)}
                      className={`px-2 py-0.5 rounded-full font-medium transition-all ${tab===t?'text-white':'bg-[var(--border)] text-[var(--muted)]'}`}
                      style={tab===t?{background:'linear-gradient(135deg,var(--sky,#0ea5e9),var(--sky2,#38bdf8))'}:{}}>{t.charAt(0).toUpperCase()+t.slice(1)}</button>
                  ))}
                </div>
              </div>

              {tab === 'radar' && (
                <ResponsiveContainer width="100%" height={200}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="var(--border)"/>
                    <PolarAngleAxis dataKey="product" tick={{fontSize:9,fill:'var(--muted)'}}/>
                    <Radar name="Live Score" dataKey="score" stroke="var(--sky,#0ea5e9)" fill="var(--sky,#0ea5e9)" fillOpacity={0.25} strokeWidth={2}/>
                    <Radar name="Base" dataKey="base" stroke="#10b981" fill="#10b981" fillOpacity={0.1} strokeWidth={1} strokeDasharray="3 2"/>
                    <Tooltip content={<CustomTooltip/>}/>
                    <Legend wrapperStyle={{fontSize:9}}/>
                  </RadarChart>
                </ResponsiveContainer>
              )}

              {tab === 'bar' && (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={heatData} margin={{top:5,right:10,left:-20,bottom:20}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.5}/>
                    <XAxis dataKey="name" tick={{fontSize:8,fill:'var(--muted)'}} angle={-30} textAnchor="end" interval={0}/>
                    <YAxis tick={{fontSize:9,fill:'var(--muted)'}} axisLine={false} tickLine={false}/>
                    <Tooltip content={<CustomTooltip/>}/>
                    <Bar dataKey="score" name="Demand Score" radius={[4,4,0,0]}>
                      {heatData.map((e,i)=><Cell key={i} fill={e.score>=75?'#ef4444':e.score>=60?'#f59e0b':'var(--sky,#0ea5e9)'}/>)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}

              {tab === 'scatter' && (
                <ResponsiveContainer width="100%" height={200}>
                  <ScatterChart margin={{top:5,right:10,left:-20,bottom:5}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.5}/>
                    <XAxis type="number" dataKey="events" name="Active Events" tick={{fontSize:9,fill:'var(--muted)'}} label={{value:'Events',position:'insideBottom',offset:-5,fontSize:9,fill:'var(--muted)'}}/>
                    <YAxis type="number" dataKey="score" name="Demand Score" tick={{fontSize:9,fill:'var(--muted)'}}/>
                    <ZAxis range={[40,160]}/>
                    <Tooltip content={<CustomTooltip/>} cursor={{strokeDasharray:'3 3'}}/>
                    <Scatter data={heatData} name="Products">
                      {heatData.map((e,i)=><Cell key={i} fill={['var(--sky,#0ea5e9)','#10b981','#f59e0b','#ef4444','#ec4899','var(--sky2,#38bdf8)','#60a5fa','#34d399'][i%8]}/>)}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* City Demand Map */}
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-3">
                <MapPin size={13} className="text-sky-400"/>
                <p className="text-xs font-semibold text-[var(--text)]">City Demand Heatmap</p>
                <span className="text-[9px] text-[var(--muted)]">— {region}</span>
              </div>
              <div className="space-y-2.5">
                {cityData.map((c, i) => {
                  const eventBoost = activeEvents.length * 4
                  const score = Math.min(99, c.score + eventBoost + Math.floor(Math.random()*5))
                  const color = score >= 75 ? '#ef4444' : score >= 60 ? '#f59e0b' : '#10b981'
                  return (
                    <div key={c.city} className="flex items-center gap-3">
                      <span className="text-[10px] text-[var(--muted)] w-24 flex-shrink-0">{c.city}</span>
                      <div className="flex-1 h-2 bg-[var(--border)] rounded-full overflow-hidden">
                        <motion.div className="h-full rounded-full" style={{background:color}}
                          initial={{width:0}} animate={{width:`${score}%`}} transition={{delay:i*0.05,duration:0.6}}/>
                      </div>
                      <span className="text-[10px] font-mono font-bold w-6 text-right" style={{color}}>{score}</span>
                    </div>
                  )
                })}
              </div>
              <p className="text-[9px] text-[var(--dim)] mt-3 flex items-center gap-1">
                <Info size={9}/> Score = base demand + active event boost for region
              </p>
            </div>
          </div>

          {/* Strategic Insight Cards */}
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-4">
              <Brain size={14} className="text-sky-400"/>
              <h2 className="text-sm font-semibold text-[var(--text)]">Strategic Intelligence Feed</h2>
              <div className="flex items-center gap-1 ml-auto">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--green)] animate-pulse"/>
                <span className="text-[9px] text-[var(--muted)]">auto-updating</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {products.filter(p => p.relevant > 0).slice(0, 4).map((p, i) => {
                const urgency = p.score >= 80 ? 'URGENT' : p.score >= 65 ? 'HIGH' : 'MEDIUM'
                const urgColor = urgency==='URGENT'?'#ef4444':urgency==='HIGH'?'#f59e0b':'var(--sky,#0ea5e9)'
                return (
                  <motion.div key={p.id} initial={{opacity:0}} animate={{opacity:1}} transition={{delay:i*0.1}}
                    className="rounded-xl p-4 border cursor-pointer hover:border-purple-500/40 transition-all"
                    style={{borderColor:`${urgColor}30`,background:`${urgColor}08`}}
                    onClick={() => setSelectedProduct(p)}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{p.emoji}</span>
                        <div>
                          <p className="text-xs font-semibold text-[var(--text)]">{p.name}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="text-[8px] font-bold px-1.5 py-0.5 rounded text-white" style={{background:urgColor}}>{urgency}</span>
                            <span className="text-[9px] text-[var(--muted)]">Score: {p.score}</span>
                          </div>
                        </div>
                      </div>
                      <ScoreRing score={p.score} size={38}/>
                    </div>
                    <p className="text-[10px] text-[var(--muted)] leading-relaxed line-clamp-2">{p.insight}</p>
                    <div className="flex items-center gap-1 mt-2 flex-wrap">
                      {p.events.filter(e=>activeEvents.includes(e)).map(eid=>{
                        const ev=GLOBAL_EVENTS.find(x=>x.id===eid)
                        return ev?<span key={eid} className="text-[8px] px-1 py-0.5 rounded font-medium text-white" style={{background:ev.color+'bb'}}>{ev.icon}</span>:null
                      })}
                      <span className="text-[9px] text-sky-400 ml-auto flex items-center gap-0.5">View details <ChevronRight size={9}/></span>
                    </div>
                  </motion.div>
                )
              })}
              {products.filter(p=>p.relevant>0).length === 0 && (
                <div className="col-span-2 text-center py-8 text-[var(--muted)]">
                  <Globe2 size={28} className="mx-auto mb-2 opacity-40"/>
                  <p className="text-sm">Activate world events above to see strategic insights</p>
                </div>
              )}
            </div>
          </div>

          {/* Bottom: Event Impact Matrix */}
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-4">
              <Cpu size={14} className="text-sky-400"/>
              <h2 className="text-sm font-semibold text-[var(--text)]">Event × Product Impact Matrix</h2>
              <span className="text-[9px] text-[var(--muted)] ml-1">— which events affect which products</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[9px]">
                <thead>
                  <tr>
                    <th className="text-left text-[var(--muted)] font-medium pb-2 pr-3 min-w-[100px]">Product</th>
                    {GLOBAL_EVENTS.map(ev => (
                      <th key={ev.id} className="text-center pb-2 px-1 min-w-[36px]">
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="text-base">{ev.icon}</span>
                          <span className={`font-medium ${activeEvents.includes(ev.id)?'text-[var(--text)]':'text-[var(--dim)]'}`}>{ev.label.split(' ')[0]}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {products.slice(0,8).map(p => (
                    <tr key={p.id} className="border-t border-[var(--border)]">
                      <td className="py-2 pr-3 font-medium text-[var(--text)]">{p.emoji} {p.name.split(' ')[0]}</td>
                      {GLOBAL_EVENTS.map(ev => {
                        const affects = p.events.includes(ev.id)
                        const isOn    = activeEvents.includes(ev.id)
                        return (
                          <td key={ev.id} className="text-center py-2 px-1">
                            {affects ? (
                              <div className="flex justify-center">
                                <div className="w-4 h-4 rounded flex items-center justify-center"
                                  style={{background: isOn ? ev.color+'40' : 'var(--border)'}}>
                                  <div className="w-2 h-2 rounded-sm" style={{background: isOn ? ev.color : 'var(--dim)'}}/>
                                </div>
                              </div>
                            ) : (
                              <div className="flex justify-center">
                                <div className="w-1.5 h-1.5 rounded-full bg-[var(--border)]"/>
                              </div>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[9px] text-[var(--dim)] mt-2 flex items-center gap-1">
              <Info size={9}/> Colored squares = event actively driving that product's demand
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}
