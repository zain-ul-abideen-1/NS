import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, DollarSign, BarChart2, Brain, RefreshCw,
         Target, AlertTriangle, CheckCircle, Award, Zap, Calendar,
         Download, Globe, Users, Activity, FileText, GitCompare, Search, X } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis,
         XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, Legend } from 'recharts'
import axios from 'axios'
import toast from 'react-hot-toast'
import { TooltipBox } from '../components/UI'

const TABS = [
  { id:'overview',    icon:BarChart2,   label:'BI Overview'     },
  { id:'revenue',     icon:DollarSign,  label:'Revenue Impact'  },
  { id:'forecast',    icon:TrendingUp,  label:'Forecasting'     },
  { id:'benchmark',   icon:Award,       label:'Benchmarking'    },
  { id:'report',      icon:FileText,    label:'Auto Report'     },
  { id:'competitor',  icon:GitCompare,  label:'Competitor Analysis' },
]

const KPI = ({ label, value, sub, color, icon: Icon }) => (
  <div className="card p-4 space-y-2">
    <div className="flex items-center justify-between">
      <p className="text-xs text-[var(--muted)] font-medium">{label}</p>
      {Icon && <Icon size={14} className="text-[var(--muted)]"/>}
    </div>
    <p className="text-2xl font-display font-bold" style={{color: color || 'var(--text)'}}>{value}</p>
    {sub && <p className="text-[10px] text-[var(--muted)]">{sub}</p>}
  </div>
)

export default function BIHub() {
  const [tab,        setTab]       = useState('overview')
  const [competitor,  setCompetitor] = useState(null)
  const [compLoading, setCompLoading] = useState(false)
  const [allSessions, setAllSessions] = useState([])
  const [selectedBrands, setSelectedBrands] = useState([])
  const [brandSearch,  setBrandSearch]  = useState('')
  const [overview,   setOverview]  = useState(null)
  const [revenue,    setRevenue]   = useState(null)
  const [forecast,   setForecast]  = useState(null)
  const [benchmark,  setBenchmark] = useState(null)
  const [report,     setReport]    = useState(null)
  const [loading,    setLoading]   = useState({})

  const load = async (key, url) => {
    if (loading[key]) return
    setLoading(l => ({...l, [key]: true}))
    try {
      const r = await axios.get(url)
      if (key === 'overview')   setOverview(r.data)
      if (key === 'revenue')    setRevenue(r.data)
      if (key === 'forecast')   setForecast(r.data)
      if (key === 'benchmark')  setBenchmark(r.data)
    } catch { toast.error('Failed to load ' + key) }
    finally { setLoading(l => ({...l, [key]: false})) }
  }

  const genReport = async () => {
    setLoading(l => ({...l, report: true}))
    try {
      const r = await axios.post('/api/bi/auto-report')
      setReport(r.data)
      toast.success('Report generated!')
    } catch { toast.error('Report failed') }
    finally { setLoading(l => ({...l, report: false})) }
  }

  useEffect(() => { load('overview', '/api/bi/overview') }, [])
  useEffect(() => {
    if (tab === 'revenue'   && !revenue)   load('revenue',   '/api/bi/revenue-impact')
    if (tab === 'forecast'  && !forecast)  load('forecast',  '/api/bi/forecasting')
    if (tab === 'benchmark' && !benchmark) load('benchmark', '/api/bi/competitor-benchmark')
    if (tab === 'competitor' && allSessions.length === 0) {
      axios.get('/api/sessions').then(r => setAllSessions(r.data?.sessions || r.data || [])).catch(()=>{})
    }
  }, [tab])

  const trendColor = t => t==='improving'?'var(--green)':t==='declining'?'var(--red)':'var(--brand)'
  const TrendIcon  = ({ t }) => t==='improving' ? <TrendingUp size={14} style={{color:'var(--green)'}}/> : t==='declining' ? <TrendingDown size={14} style={{color:'var(--red)'}}/> : <Activity size={14} style={{color:'var(--brand)'}}/>

  return (
    <div className="p-6 lg:p-8 space-y-5">

      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{background:'var(--grad)'}}>
          <BarChart2 size={17} className="text-white"/>
        </div>
        <div>
          <h1 className="page-title">Business Intelligence Hub</h1>
          <p className="text-sm text-[var(--text2)] mt-0.5">
            Revenue impact, sentiment forecasting, competitor benchmarking &amp; automated executive reports
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {TABS.map(({ id, icon: Icon, label }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`tab-btn flex items-center gap-1.5 ${tab===id?'tab-active':''}`}>
            <Icon size={12}/>{label}
          </button>
        ))}
      </div>

      {/* ── BI OVERVIEW ── */}
      {tab === 'overview' && (
        <div className="space-y-5">
          {loading.overview ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">{[...Array(8)].map((_,i)=><div key={i} className="card h-24 animate-pulse bg-[var(--card2)]"/>)}</div>
          ) : overview ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <KPI label="Total Sessions"  value={overview.summary.total_sessions}  color="var(--brand)"  icon={BarChart2}/>
                <KPI label="Total Reviews"   value={overview.summary.total_reviews?.toLocaleString()}   color="var(--text)"   icon={Users}/>
                <KPI label="Positive Rate"   value={overview.summary.overall_positive_pct+'%'} color="var(--green)"  icon={CheckCircle}
                  sub={`${overview.summary.overall_negative_pct}% negative`}/>
                <KPI label="Avg Sentiment"   value={overview.summary.avg_sentiment_score} color={overview.summary.avg_sentiment_score>0?'var(--green)':'var(--red)'} icon={Activity}/>
                <KPI label="Fake Review Rate" value={overview.summary.overall_fake_pct+'%'} color={overview.summary.overall_fake_pct>15?'var(--red)':'var(--muted)'} icon={AlertTriangle}/>
                <KPI label="Total Tickets"   value={overview.summary.total_tickets}   color="var(--amber)"  icon={Target}/>
                <KPI label="Critical Tickets" value={overview.summary.critical_tickets} color="var(--red)"  icon={AlertTriangle}/>
                <KPI label="Trend"           value={overview.summary.sentiment_trend?.charAt(0).toUpperCase()+overview.summary.sentiment_trend?.slice(1)}
                  color={trendColor(overview.summary.sentiment_trend)} icon={TrendingUp}/>
              </div>

              {/* Monthly chart */}
              {overview.monthly_chart?.length > 0 && (
                <div className="card p-5">
                  <p className="section-title mb-4">Monthly Review Volume &amp; Sentiment</p>
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={overview.monthly_chart}>
                      <defs>
                        <linearGradient id="gPos" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--green)" stopOpacity={0.3}/>
                          <stop offset="100%" stopColor="var(--green)" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="gNeg" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--red)" stopOpacity={0.3}/>
                          <stop offset="100%" stopColor="var(--red)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false}/>
                      <XAxis dataKey="month" tick={{fill:'var(--muted)',fontSize:10}} axisLine={false} tickLine={false}/>
                      <YAxis tick={{fill:'var(--muted)',fontSize:10}} axisLine={false} tickLine={false}/>
                      <Tooltip content={<TooltipBox/>}/>
                      <Area type="monotone" dataKey="positive" stroke="var(--green)" fill="url(#gPos)" name="Positive" strokeWidth={2}/>
                      <Area type="monotone" dataKey="negative" stroke="var(--red)"   fill="url(#gNeg)" name="Negative" strokeWidth={2}/>
                      <Legend wrapperStyle={{fontSize:11}}/>
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Recent sessions table */}
              {overview.recent_sessions?.length > 0 && (
                <div className="card p-5">
                  <p className="section-title mb-4">Recent Sessions Performance</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[var(--border)]">
                          {['Session','Reviews','Positive %','Avg Score','Date'].map(h=>(
                            <th key={h} className="text-left text-[10px] text-[var(--muted)] font-semibold uppercase tracking-wider pb-2 pr-4">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border)]">
                        {overview.recent_sessions.map((s,i) => (
                          <tr key={i}>
                            <td className="py-2.5 pr-4 font-medium text-[var(--text)] text-xs max-w-[160px] truncate">{s.name}</td>
                            <td className="py-2.5 pr-4 text-xs text-[var(--text2)]">{s.total?.toLocaleString()}</td>
                            <td className="py-2.5 pr-4">
                              <span className="text-xs font-medium" style={{color:s.positive_pct>=60?'var(--green)':s.positive_pct>=40?'var(--amber)':'var(--red)'}}>{s.positive_pct}%</span>
                            </td>
                            <td className="py-2.5 pr-4 text-xs font-mono" style={{color:s.avg_score>0?'var(--green)':'var(--red)'}}>{s.avg_score}</td>
                            <td className="py-2.5 text-xs text-[var(--muted)]">{s.created_at?.slice(0,10)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="card p-10 text-center">
              <p className="text-sm text-[var(--muted)]">No session data found. Analyze some reviews first.</p>
            </div>
          )}
        </div>
      )}

      {/* ── REVENUE IMPACT ── */}
      {tab === 'revenue' && (
        <div className="space-y-5">
          {loading.revenue ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{[...Array(6)].map((_,i)=><div key={i} className="card h-24 animate-pulse bg-[var(--card2)]"/>)}</div>
          ) : revenue ? (
            <>
              <div className="card p-4 flex items-start gap-2 border border-[var(--amber)]/30 bg-[var(--amber)]/5">
                <AlertTriangle size={14} className="text-[var(--amber)] flex-shrink-0 mt-0.5"/>
                <p className="text-xs text-[var(--text2)]">{revenue.methodology}</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <KPI label="Revenue at Risk" value={`$${Number(revenue.revenue_at_risk_usd).toLocaleString()}`}
                  color="var(--red)" icon={DollarSign} sub="From negative reviews"/>
                <KPI label="Purchase Lift" value={revenue.purchase_lift_pct+'%'} color="var(--green)" icon={TrendingUp}
                  sub="From positive sentiment"/>
                <KPI label="Estimated NPS" value={revenue.estimated_nps} color={revenue.estimated_nps>30?'var(--green)':revenue.estimated_nps>0?'var(--amber)':'var(--red)'}
                  icon={Target} sub="Net Promoter Score"/>
                <KPI label="Churn Risk" value={revenue.churn_risk_pct+'%'} color={revenue.churn_risk_pct>40?'var(--red)':revenue.churn_risk_pct>20?'var(--amber)':'var(--green)'}
                  icon={AlertTriangle} sub={revenue.churn_risk_pct>40?'High':'Low-Medium'}/>
                <KPI label="Retention Score" value={revenue.retention_score+'%'} color="var(--brand)" icon={Users}/>
                <KPI label="Negative Reviews" value={revenue.negative_review_count?.toLocaleString()}
                  color="var(--muted)" icon={Activity} sub={`of ${revenue.total_reviews?.toLocaleString()} total`}/>
              </div>

              {/* Revenue breakdown visual */}
              <div className="card p-5">
                <p className="section-title mb-4">Revenue Impact Breakdown</p>
                <div className="space-y-3">
                  {[
                    ['Negative Review Impact',  revenue.churn_risk_pct,        'var(--red)',   revenue.churn_risk_pct+'% churn risk'],
                    ['Positive Review Benefit', revenue.purchase_lift_pct/18*100, 'var(--green)', revenue.purchase_lift_pct+'% purchase lift'],
                    ['Retention Health',        revenue.retention_score,        'var(--brand)', revenue.retention_score+'% retention score'],
                  ].map(([label, val, color, sublabel]) => (
                    <div key={label} className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-[var(--text2)]">{label}</span>
                        <span className="font-medium" style={{color}}>{sublabel}</span>
                      </div>
                      <div className="h-2 bg-[var(--border)] rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{width:`${Math.min(val,100)}%`,background:color}}/>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              <div className="card p-5 space-y-3">
                <p className="section-title">Strategic Recommendations</p>
                <div className="space-y-2">
                  {revenue.recommendations?.map((rec,i) => (
                    <div key={i} className="flex items-start gap-2.5 p-3 card2 rounded-xl border border-[var(--border2)]">
                      <Zap size={12} className="text-[var(--amber)] flex-shrink-0 mt-0.5"/>
                      <p className="text-xs text-[var(--text2)]">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="card p-10 text-center"><p className="text-sm text-[var(--muted)]">No data available.</p></div>
          )}
        </div>
      )}

      {/* ── FORECASTING ── */}
      {tab === 'forecast' && (
        <div className="space-y-5">
          <button onClick={() => load('forecast', '/api/bi/forecasting')} className="btn-secondary text-xs flex items-center gap-1">
            <RefreshCw size={12} className={loading.forecast?'animate-spin':''}/>Refresh Forecast
          </button>
          {loading.forecast ? (
            <div className="card h-64 animate-pulse bg-[var(--card2)]"/>
          ) : forecast ? (
            <>
              {forecast.status === 'insufficient_data' ? (
                <div className="card p-10 text-center space-y-3">
                  <Activity size={32} className="text-[var(--muted)] mx-auto"/>
                  <p className="text-sm font-semibold text-[var(--text)]">Not enough data to forecast</p>
                  <p className="text-xs text-[var(--muted)]">{forecast.message}</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    <KPI label="Trend Direction" value={forecast.trend_direction?.charAt(0).toUpperCase()+forecast.trend_direction?.slice(1)}
                      color={trendColor(forecast.trend_direction)} icon={TrendingUp}/>
                    <KPI label="Slope" value={forecast.trend_slope > 0 ? '+'+forecast.trend_slope : forecast.trend_slope}
                      color={forecast.trend_slope>0?'var(--green)':'var(--red)'} sub="score/period"/>
                    <KPI label="Confidence" value={forecast.confidence?.charAt(0).toUpperCase()+forecast.confidence?.slice(1)}
                      color={forecast.confidence==='high'?'var(--green)':forecast.confidence==='medium'?'var(--amber)':'var(--muted)'}
                      sub={`${forecast.historical?.length} sessions`}/>
                  </div>

                  <div className="card p-5">
                    <p className="section-title mb-1">Sentiment Score Forecast</p>
                    <p className="text-xs text-[var(--muted)] mb-4">{forecast.insight}</p>
                    <ResponsiveContainer width="100%" height={240}>
                      <LineChart data={[...(forecast.historical||[]), ...(forecast.forecast||[])]}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false}/>
                        <XAxis dataKey="index" tick={{fill:'var(--muted)',fontSize:10}} axisLine={false} tickLine={false}/>
                        <YAxis tick={{fill:'var(--muted)',fontSize:10}} axisLine={false} tickLine={false} domain={['auto','auto']}/>
                        <Tooltip content={<TooltipBox/>}/>
                        <Line type="monotone" dataKey="score" stroke="var(--brand)" strokeWidth={2.5}
                          dot={(props) => {
                            const isForecast = props.index >= (forecast.historical?.length||0)
                            return <circle key={props.key} cx={props.cx} cy={props.cy} r={4}
                              fill={isForecast?'var(--amber)':'var(--brand)'}
                              stroke={isForecast?'var(--amber)':'var(--brand)'} strokeWidth={2}/>
                          }}
                          strokeDasharray={(d) => ''}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                    <div className="flex gap-4 mt-2 justify-end">
                      <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-[var(--brand)] rounded"/><span className="text-[10px] text-[var(--muted)]">Historical</span></div>
                      <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[var(--amber)]"/><span className="text-[10px] text-[var(--muted)]">Forecast</span></div>
                    </div>
                  </div>

                  {forecast.volume_forecast?.length > 0 && (
                    <div className="card p-5">
                      <p className="section-title mb-4">Projected Review Volume (Next 3 Periods)</p>
                      <div className="grid grid-cols-3 gap-3">
                        {forecast.volume_forecast.map((v,i) => (
                          <div key={i} className="card2 p-4 text-center border border-[var(--border2)] rounded-xl">
                            <p className="text-2xl font-display font-bold text-[var(--amber)]">{v?.toLocaleString()}</p>
                            <p className="text-xs text-[var(--muted)] mt-0.5">Forecast Period +{i+1}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          ) : null}
        </div>
      )}

      {/* ── BENCHMARKING ── */}
      {tab === 'benchmark' && (
        <div className="space-y-5">
          {loading.benchmark ? (
            <div className="space-y-3">{[...Array(4)].map((_,i)=><div key={i} className="card h-16 animate-pulse bg-[var(--card2)]"/>)}</div>
          ) : benchmark ? (
            <>
              {benchmark.winner && (
                <div className="card p-4 flex items-center gap-3 border border-[var(--green)]/30 bg-[var(--green)]/5">
                  <Award size={16} className="text-[var(--green)] flex-shrink-0"/>
                  <p className="text-sm text-[var(--text)]">
                    Top performer: <strong className="text-[var(--green)]">{benchmark.winner}</strong>
                  </p>
                </div>
              )}

              {benchmark.sessions?.length > 0 && (
                <>
                  <div className="card p-5">
                    <p className="section-title mb-4">Session Sentiment Comparison</p>
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={benchmark.sessions} layout="vertical" barSize={14}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false}/>
                        <XAxis type="number" tick={{fill:'var(--muted)',fontSize:10}} axisLine={false} tickLine={false}/>
                        <YAxis type="category" dataKey="name" tick={{fill:'var(--muted)',fontSize:10}} axisLine={false} tickLine={false} width={100}/>
                        <Tooltip content={<TooltipBox/>}/>
                        <Bar dataKey="positive_pct" name="Positive %" radius={[0,4,4,0]} fill="var(--green)"/>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="card p-5">
                    <p className="section-title mb-4">All Sessions — Full Comparison</p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-[var(--border)]">
                            {['Rank','Session','Sentiment Score','Positive','Negative','Fake %'].map(h=>(
                              <th key={h} className="text-left text-[10px] text-[var(--muted)] font-semibold uppercase tracking-wider pb-2 pr-4">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                          {benchmark.sessions.map((s,i) => (
                            <tr key={i} className={i===0?'bg-[var(--green)]/3':''}>
                              <td className="py-2.5 pr-4 text-xs font-bold text-[var(--muted)]">#{i+1}</td>
                              <td className="py-2.5 pr-4 text-xs font-medium text-[var(--text)] max-w-[140px] truncate">{s.name}</td>
                              <td className="py-2.5 pr-4 text-xs font-mono font-bold" style={{color:s.score>0?'var(--green)':'var(--red)'}}>{s.score}</td>
                              <td className="py-2.5 pr-4 text-xs text-[var(--green)] font-medium">{s.positive_pct}%</td>
                              <td className="py-2.5 pr-4 text-xs text-[var(--red)] font-medium">{s.negative_pct}%</td>
                              <td className="py-2.5 text-xs" style={{color:s.fake_pct>15?'var(--red)':'var(--muted)'}}>{s.fake_pct}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {benchmark.insights?.length > 0 && (
                    <div className="card p-5 space-y-3">
                      <p className="section-title">Key Insights</p>
                      {benchmark.insights.map((ins,i) => (
                        <div key={i} className="flex items-start gap-2.5 p-3 card2 rounded-xl border border-[var(--border2)]">
                          <CheckCircle size={12} className="text-[var(--green)] flex-shrink-0 mt-0.5"/>
                          <p className="text-xs text-[var(--text2)]">{ins}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </>
          ) : null}
        </div>
      )}


      {/* ── COMPETITOR ANALYSIS ── */}
      {tab === 'competitor' && (
        <div className="space-y-5">

          {/* Session picker */}
          <div className="card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="section-title">Competitor Analysis</p>
                <p className="text-xs text-[var(--muted)] mt-0.5">Select 2–6 sessions representing different brands of the same product to compare head-to-head</p>
              </div>
              {selectedBrands.length >= 2 && (
                <button
                  onClick={async () => {
                    setCompLoading(true); setCompetitor(null)
                    try {
                      const r = await axios.post('/api/bi/competitor-analysis', { session_ids: selectedBrands })
                      setCompetitor(r.data)
                    } catch { toast.error('Analysis failed') }
                    setCompLoading(false)
                  }}
                  className="btn-primary text-xs flex items-center gap-1.5 flex-shrink-0"
                >
                  {compLoading ? <RefreshCw size={12} className="animate-spin"/> : <GitCompare size={12}/>}
                  {compLoading ? 'Analyzing...' : 'Compare Brands'}
                </button>
              )}
            </div>

            {/* Search */}
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"/>
              <input
                value={brandSearch} onChange={e => setBrandSearch(e.target.value)}
                placeholder="Search sessions..."
                className="input pl-8 text-xs w-full"
              />
            </div>

            {/* Session list */}
            <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto pr-1">
              {allSessions
                .filter(s => !brandSearch || s.name?.toLowerCase().includes(brandSearch.toLowerCase()))
                .map(s => {
                  const selected = selectedBrands.includes(s.session_id)
                  return (
                    <div
                      key={s.session_id}
                      onClick={() => {
                        if (selected) setSelectedBrands(prev => prev.filter(id => id !== s.session_id))
                        else if (selectedBrands.length < 6) setSelectedBrands(prev => [...prev, s.session_id])
                        else toast.error('Max 6 brands')
                      }}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                        selected
                          ? 'border-[var(--brand)]/60 bg-[var(--brand)]/8'
                          : 'border-[var(--border)] hover:border-[var(--border2)] bg-[var(--card2)]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${selected ? 'border-[var(--brand)] bg-[var(--brand)]' : 'border-[var(--border)]'}`}>
                          {selected && <CheckCircle size={10} className="text-white"/>}
                        </div>
                        <div>
                          <p className="text-xs font-medium text-[var(--text)] truncate max-w-[200px]">{s.name}</p>
                          <p className="text-[10px] text-[var(--muted)]">{s.total_reviews} reviews · score {s.avg_score?.toFixed ? s.avg_score.toFixed(3) : s.avg_score}</p>
                        </div>
                      </div>
                      {selected && <X size={12} className="text-[var(--muted)] flex-shrink-0"/>}
                    </div>
                  )
                })}
              {allSessions.length === 0 && (
                <p className="text-xs text-[var(--muted)] text-center py-6">No sessions found. Analyze some URLs first.</p>
              )}
            </div>

            {selectedBrands.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] text-[var(--muted)] font-medium uppercase tracking-wider">Selected:</span>
                {allSessions.filter(s => selectedBrands.includes(s.session_id)).map(s => (
                  <span key={s.session_id} className="text-[10px] px-2 py-1 rounded-lg bg-[var(--brand)]/15 text-[var(--brand)] font-medium">{s.name}</span>
                ))}
              </div>
            )}
          </div>

          {/* Loading */}
          {compLoading && (
            <div className="space-y-3">{[...Array(3)].map((_,i) => <div key={i} className="card h-20 animate-pulse bg-[var(--card2)]"/>)}</div>
          )}

          {/* Results */}
          {competitor && !compLoading && (
            <div className="space-y-5">

              {/* Winner banner */}
              {competitor.winner && (
                <div className="card p-4 flex items-center gap-3 border border-[var(--green)]/40 bg-[var(--green)]/5">
                  <Award size={18} className="text-[var(--green)] flex-shrink-0"/>
                  <div>
                    <p className="text-sm font-bold text-[var(--green)]">{competitor.winner} is winning</p>
                    <p className="text-xs text-[var(--muted)] mt-0.5">Highest sentiment score among selected brands</p>
                  </div>
                </div>
              )}

              {/* AI Verdict */}
              {competitor.verdict && (
                <div className="card p-5 border border-[var(--brand)]/20 bg-[var(--brand)]/4">
                  <p className="section-title flex items-center gap-2 mb-3"><Brain size={13} className="text-[var(--brand)]"/> AI Verdict</p>
                  <p className="text-sm text-[var(--text)] leading-relaxed">{competitor.verdict}</p>
                </div>
              )}

              {/* Score cards */}
              <div className={`grid gap-4 ${competitor.brands?.length <= 3 ? 'grid-cols-' + competitor.brands.length : 'grid-cols-3'}`}>
                {competitor.brands?.map((b, i) => (
                  <div key={i} className={`card p-4 space-y-3 ${i === 0 ? 'border border-[var(--green)]/30' : ''}`}>
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-[var(--text)] truncate">{b.name}</p>
                      {i === 0 && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[var(--green)]/15 text-[var(--green)]">WINNER</span>}
                    </div>
                    <div className="text-2xl font-mono font-bold" style={{color: b.avg_score > 0 ? 'var(--green)' : 'var(--red)'}}>
                      {b.avg_score > 0 ? '+' : ''}{b.avg_score}
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px]"><span className="text-[var(--green)]">Positive</span><span className="font-mono">{b.positive_pct}%</span></div>
                      <div className="w-full bg-[var(--card2)] rounded-full h-1.5"><div className="bg-[var(--green)] h-1.5 rounded-full" style={{width: b.positive_pct + '%'}}/></div>
                      <div className="flex justify-between text-[10px]"><span className="text-[var(--red)]">Negative</span><span className="font-mono">{b.negative_pct}%</span></div>
                      <div className="w-full bg-[var(--card2)] rounded-full h-1.5"><div className="bg-[var(--red)] h-1.5 rounded-full" style={{width: b.negative_pct + '%'}}/></div>
                    </div>
                    <div className="flex justify-between text-[10px] text-[var(--muted)] pt-1 border-t border-[var(--border)]">
                      <span>{b.total_reviews} reviews</span>
                      <span style={{color: b.fake_pct > 15 ? 'var(--red)' : 'var(--muted)'}}>Fake: {b.fake_pct}%</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Radar — aspect comparison */}
              {competitor.radar?.length > 0 && (
                <div className="card p-5">
                  <p className="section-title mb-4">Aspect Breakdown — Quality · Delivery · Price · Service</p>
                  <ResponsiveContainer width="100%" height={260}>
                    <RadarChart data={competitor.radar}>
                      <PolarGrid stroke="var(--border)"/>
                      <PolarAngleAxis dataKey="aspect" tick={{fill:'var(--muted)',fontSize:11}}/>
                      {competitor.brands?.map((b, i) => (
                        <Radar key={i} name={b.name} dataKey={b.name.slice(0,20)}
                          stroke={['var(--brand)','var(--green)','#f59e0b','#ef4444','#8b5cf6','#06b6d4'][i]}
                          fill={['var(--brand)','var(--green)','#f59e0b','#ef4444','#8b5cf6','#06b6d4'][i]}
                          fillOpacity={0.12}/>
                      ))}
                      <Legend wrapperStyle={{fontSize:11}}/>
                      <Tooltip content={<TooltipBox/>}/>
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Bar comparison */}
              <div className="card p-5">
                <p className="section-title mb-4">Sentiment Score Comparison</p>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={competitor.brands} barSize={24}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false}/>
                    <XAxis dataKey="name" tick={{fill:'var(--muted)',fontSize:10}} axisLine={false} tickLine={false}/>
                    <YAxis tick={{fill:'var(--muted)',fontSize:10}} axisLine={false} tickLine={false}/>
                    <Tooltip content={<TooltipBox/>}/>
                    <Bar dataKey="positive_pct" name="Positive %" radius={[6,6,0,0]}>
                      {competitor.brands?.map((_,i) => <Cell key={i} fill={['var(--brand)','var(--green)','#f59e0b','#ef4444','#8b5cf6','#06b6d4'][i]}/>)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Keyword overlap */}
              {competitor.keyword_overlap?.length > 0 && (
                <div className="card p-5">
                  <p className="section-title mb-3">Shared Keywords Across Brands</p>
                  <p className="text-xs text-[var(--muted)] mb-3">These topics appear in reviews for multiple brands — key battleground areas</p>
                  <div className="flex flex-wrap gap-2">
                    {competitor.keyword_overlap.map((kw, i) => (
                      <span key={i} className="text-xs px-3 py-1.5 rounded-lg border border-[var(--brand)]/30 bg-[var(--brand)]/8 text-[var(--brand)] font-medium">{kw}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Full table */}
              <div className="card p-5">
                <p className="section-title mb-4">Full Brand Comparison</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--border)]">
                        {['Rank','Brand','Score','Positive','Negative','Neutral','Fake %','Reviews','Helpfulness'].map(h => (
                          <th key={h} className="text-left text-[10px] text-[var(--muted)] font-semibold uppercase tracking-wider pb-2 pr-4 whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {competitor.brands?.map((b, i) => (
                        <tr key={i} className={i === 0 ? 'bg-[var(--green)]/3' : ''}>
                          <td className="py-2.5 pr-4 text-xs font-bold text-[var(--muted)]">#{i+1}</td>
                          <td className="py-2.5 pr-4 text-xs font-semibold text-[var(--text)] max-w-[140px] truncate">{b.name}</td>
                          <td className="py-2.5 pr-4 text-xs font-mono font-bold" style={{color: b.avg_score > 0 ? 'var(--green)' : 'var(--red)'}}>{b.avg_score > 0 ? '+' : ''}{b.avg_score}</td>
                          <td className="py-2.5 pr-4 text-xs text-[var(--green)] font-medium">{b.positive_pct}%</td>
                          <td className="py-2.5 pr-4 text-xs text-[var(--red)] font-medium">{b.negative_pct}%</td>
                          <td className="py-2.5 pr-4 text-xs text-[var(--muted)]">{b.neutral_pct}%</td>
                          <td className="py-2.5 pr-4 text-xs" style={{color: b.fake_pct > 15 ? 'var(--red)' : 'var(--muted)'}}>{b.fake_pct}%</td>
                          <td className="py-2.5 pr-4 text-xs text-[var(--muted)]">{b.total_reviews}</td>
                          <td className="py-2.5 text-xs text-[var(--muted)] font-mono">{b.avg_helpfulness}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}
        </div>
      )}

      {/* ── AUTO REPORT ── */}
      {tab === 'report' && (
        <div className="space-y-5">
          <div className="card p-5 space-y-4">
            <p className="section-title">AI Executive Report Generator</p>
            <p className="text-xs text-[var(--muted)]">
              Generate a professional 4-paragraph business intelligence report from all your session data — ready for executives, stakeholders, or clients.
            </p>
            <button onClick={genReport} disabled={loading.report} className="btn-primary text-xs">
              {loading.report ? <RefreshCw size={12} className="animate-spin"/> : <Brain size={12}/>}
              {loading.report ? 'Generating report...' : 'Generate Executive Report'}
            </button>
          </div>

          {report && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <KPI label="Sessions Analyzed" value={report.sessions_analyzed} color="var(--brand)" icon={BarChart2}/>
                <KPI label="Reviews Analyzed"  value={report.reviews_analyzed?.toLocaleString()} color="var(--text)" icon={Users}/>
                <KPI label="Generated" value={report.generated_at?.slice(0,10)} color="var(--muted)" icon={Calendar}/>
              </div>
              <div className="card p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="section-title flex items-center gap-2">
                    <Brain size={13} className="text-[var(--brand)]"/> Executive Business Intelligence Report
                  </p>
                  <button onClick={() => {
                    const el = document.createElement('a')
                    el.href = URL.createObjectURL(new Blob([report.report], {type:'text/plain'}))
                    el.download = `BI_Report_${report.generated_at?.slice(0,10)}.txt`
                    el.click()
                  }} className="btn-secondary text-xs flex items-center gap-1">
                    <Download size={11}/>Export
                  </button>
                </div>
                <div className="space-y-4 p-4 bg-[var(--card2)] rounded-xl border border-[var(--border2)]">
                  {report.report?.split('\n\n').filter(Boolean).map((para, i) => (
                    <p key={i} className="text-sm text-[var(--text)] leading-relaxed">{para}</p>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}