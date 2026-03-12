import { useState } from 'react'
import axios from 'axios'
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis } from 'recharts'
import { Target, TrendingUp, TrendingDown, RefreshCw, ArrowUp, ArrowDown, Minus, Trophy, AlertCircle, Zap, Download } from 'lucide-react'
import toast from 'react-hot-toast'

const INDUSTRIES = [
  { id:'ecommerce',    label:'E-Commerce',     emoji:'🛒' },
  { id:'saas',         label:'SaaS/Software',  emoji:'💻' },
  { id:'hospitality',  label:'Hospitality',    emoji:'🏨' },
  { id:'healthcare',   label:'Healthcare',     emoji:'🏥' },
  { id:'restaurant',   label:'Restaurant',     emoji:'🍽️' },
  { id:'retail',       label:'Retail',         emoji:'🏪' },
  { id:'finance',      label:'Finance',        emoji:'🏦' },
  { id:'logistics',    label:'Logistics',      emoji:'📦' },
  { id:'education',    label:'Education',      emoji:'🎓' },
  { id:'telecom',      label:'Telecom',        emoji:'📡' },
]

function PercentileBar({ label, value, yourValue, industryValue, unit = '%', higherBetter = true }) {
  const gap = yourValue - industryValue
  const ahead = higherBetter ? gap >= 0 : gap <= 0
  return (
    <div className="space-y-2 p-4 card rounded-xl">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-[var(--text)]">{label}</p>
        <div className="flex items-center gap-1.5">
          {ahead
            ? <span className="text-[10px] text-[var(--green)] flex items-center gap-0.5 font-medium"><ArrowUp size={9}/>+{Math.abs(gap).toFixed(1)}{unit} ahead</span>
            : <span className="text-[10px] text-[var(--red)] flex items-center gap-0.5 font-medium"><ArrowDown size={9}/>{Math.abs(gap).toFixed(1)}{unit} behind</span>
          }
        </div>
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-[var(--brand)] w-14 font-medium">You</span>
          <div className="flex-1 h-4 bg-[var(--border)] rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{width:`${Math.min(100,Math.max(0,yourValue))}%`, background:'var(--grad)'}}/>
          </div>
          <span className="text-xs font-bold font-mono w-12 text-right text-[var(--text)]">{yourValue.toFixed(1)}{unit}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-[var(--muted)] w-14">Industry</span>
          <div className="flex-1 h-4 bg-[var(--border)] rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{width:`${Math.min(100,Math.max(0,industryValue))}%`, background:'var(--muted)'}}/>
          </div>
          <span className="text-xs font-mono w-12 text-right text-[var(--muted)]">{industryValue}{unit}</span>
        </div>
      </div>
    </div>
  )
}

function PercentileRing({ value, label }) {
  const r = 32
  const circ = 2 * Math.PI * r
  const offset = circ - (value / 100) * circ
  const color = value >= 75 ? '#10b981' : value >= 50 ? '#0ea5e9' : value >= 25 ? '#f59e0b' : '#ef4444'
  return (
    <div className="text-center">
      <svg width={80} height={80} className="mx-auto">
        <circle cx={40} cy={40} r={r} fill="none" stroke="var(--border)" strokeWidth={7}/>
        <circle cx={40} cy={40} r={r} fill="none" stroke={color} strokeWidth={7}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          transform="rotate(-90 40 40)" style={{transition:'stroke-dashoffset 1s ease'}}/>
        <text x={40} y={37} textAnchor="middle" fill={color} fontSize={14} fontWeight="bold">{value}</text>
        <text x={40} y={51} textAnchor="middle" fill="var(--muted)" fontSize={9}>%ile</text>
      </svg>
      <p className="text-[10px] text-[var(--muted)] mt-1">{label}</p>
    </div>
  )
}

export default function Benchmark() {
  const [industry, setIndustry] = useState('ecommerce')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)

  const run = async () => {
    setLoading(true); setData(null)
    try {
      const r = await axios.post('/api/benchmark', { industry })
      setData(r.data)
      toast.success('Benchmark complete!')
    } catch {
      toast.error('Benchmark failed — analyze some sessions first')
    }
    setLoading(false)
  }

  const exportReport = () => {
    if (!data) return
    const ind = INDUSTRIES.find(i => i.id === industry)
    const report = `NESTINSIGHTS COMPETITIVE BENCHMARK REPORT\n${'='.repeat(55)}\nIndustry: ${ind?.label || industry}\nGenerated: ${new Date().toLocaleString()}\n\nYOUR PERFORMANCE\n${'-'.repeat(35)}\nPositive Sentiment: ${data.your_metrics.positive_pct}%\nNegative Sentiment: ${data.your_metrics.negative_pct}%\nNPS Equivalent: ${data.your_metrics.nps_equivalent}\nAverage Score: ${data.your_metrics.avg_score}\nTotal Reviews: ${data.your_metrics.total_reviews}\nFake Rate: ${data.your_metrics.fake_rate}%\n\nINDUSTRY BENCHMARKS\n${'-'.repeat(35)}\nIndustry Average Positive: ${data.industry_benchmarks.avg_positive}%\nIndustry Average NPS: ${data.industry_benchmarks.avg_nps}\nAverage Response Rate: ${data.industry_benchmarks.avg_response_rate}%\nIndustry Leader: ${data.industry_benchmarks.leader}\nTop Pain Point: ${data.industry_benchmarks.top_pain_point}\n\nYOUR PERCENTILES\n${'-'.repeat(35)}\nOverall: ${data.percentiles.overall}th percentile\nSentiment: ${data.percentiles.sentiment}th percentile\nNPS: ${data.percentiles.nps}th percentile\nAuthenticity: ${data.percentiles.authenticity}th percentile\n\nGAPS\n${'-'.repeat(35)}\nSentiment Gap: ${data.gaps.sentiment_gap > 0 ? '+' : ''}${data.gaps.sentiment_gap}%\nNPS Gap: ${data.gaps.nps_gap > 0 ? '+' : ''}${data.gaps.nps_gap}\n\nEXECUTIVE ANALYSIS\n${'-'.repeat(35)}\n${data.analysis}\n`
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([report], {type:'text/plain'}))
    a.download = `benchmark_${industry}_${new Date().toISOString().slice(0,10)}.txt`
    a.click()
    toast.success('Report exported!')
  }

  const chartData = data ? [
    { name: 'Positive %', you: data.your_metrics.positive_pct, industry: data.industry_benchmarks.avg_positive },
    { name: 'NPS', you: Math.max(0, data.your_metrics.nps_equivalent + 50), industry: data.industry_benchmarks.avg_nps + 50 },
    { name: 'Authenticity', you: Math.max(0, 100 - data.your_metrics.fake_rate * 5), industry: 88 },
  ] : []

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background:'var(--grad)'}}>
          <Target size={18} className="text-white"/>
        </div>
        <div>
          <h1 className="page-title">Competitive Benchmark Engine</h1>
          <p className="text-sm text-[var(--text2)] mt-0.5">Compare your review performance against industry standards. Know exactly where you stand vs competitors.</p>
        </div>
      </div>

      {/* Industry selector */}
      <div className="card p-5 space-y-4">
        <p className="text-sm font-semibold text-[var(--text)]">Select Your Industry</p>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {INDUSTRIES.map(ind => (
            <button key={ind.id} onClick={() => setIndustry(ind.id)}
              className={`p-3 rounded-xl border text-left transition-all ${industry===ind.id?'text-white border-transparent':'border-[var(--border)] hover:border-[var(--brand)]/30 hover:bg-[var(--card2)]'}`}
              style={industry===ind.id?{background:'var(--grad)'}:{}}>
              <span className="text-xl block mb-1">{ind.emoji}</span>
              <p className={`text-[11px] font-semibold ${industry===ind.id?'text-white':'text-[var(--text)]'}`}>{ind.label}</p>
            </button>
          ))}
        </div>
        <button onClick={run} disabled={loading} className="btn-primary flex items-center gap-2 text-sm">
          {loading ? <RefreshCw size={14} className="animate-spin"/> : <Target size={14}/>}
          {loading ? 'Running Benchmark Analysis...' : 'Run Competitive Benchmark'}
        </button>
        <p className="text-xs text-[var(--muted)]">Benchmarks use industry-standard data from 10,000+ company analyses. Your sessions are compared against verified peer averages.</p>
      </div>

      {data && (
        <div className="space-y-5">
          {/* Overall percentile banner */}
          <div className="rounded-2xl p-6 text-white" style={{background:'var(--grad)'}}>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-white/70 text-sm">Overall Industry Percentile</p>
                <p className="text-6xl font-display font-bold mt-1">{data.percentiles.overall}<span className="text-3xl">th</span></p>
                <p className="text-white/80 mt-1 font-medium">
                  {data.percentiles.overall >= 75 ? '🏆 Top Quartile — Elite Performance' :
                   data.percentiles.overall >= 50 ? '📈 Above Average — Keep Pushing' :
                   data.percentiles.overall >= 25 ? '⚠️ Below Average — Needs Focus' :
                   '🔴 Bottom Quartile — Urgent Action Required'}
                </p>
                <p className="text-white/60 text-xs mt-0.5">vs {INDUSTRIES.find(i=>i.id===industry)?.label} industry · {data.sessions_analyzed} sessions analyzed</p>
              </div>
              <div className="flex gap-6">
                <PercentileRing value={data.percentiles.sentiment} label="Sentiment"/>
                <PercentileRing value={data.percentiles.nps} label="NPS"/>
                <PercentileRing value={data.percentiles.authenticity} label="Authenticity"/>
              </div>
              <div className="flex gap-2">
                <button onClick={exportReport} className="px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-medium flex items-center gap-1 transition-all"><Download size={11}/>Export</button>
              </div>
            </div>
          </div>

          {/* Metric comparisons */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <PercentileBar label="Positive Sentiment" yourValue={data.your_metrics.positive_pct} industryValue={data.industry_benchmarks.avg_positive}/>
            <PercentileBar label="Net Promoter Score" yourValue={data.your_metrics.nps_equivalent} industryValue={data.industry_benchmarks.avg_nps}/>
            <PercentileBar label="Fake Review Rate" yourValue={data.your_metrics.fake_rate} industryValue={10} unit="%" higherBetter={false}/>
          </div>

          {/* Chart + industry info */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="card p-5">
              <p className="section-title mb-4">You vs Industry Average</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false}/>
                  <XAxis dataKey="name" tick={{fontSize:10, fill:'var(--muted)'}}/>
                  <YAxis tick={{fontSize:9, fill:'var(--muted)'}} domain={[0,110]}/>
                  <Tooltip contentStyle={{background:'var(--card)',border:'1px solid var(--border)',fontSize:11}}/>
                  <Bar dataKey="you" name="You" fill="var(--brand)" radius={[4,4,0,0]} barSize={22}/>
                  <Bar dataKey="industry" name="Industry Avg" fill="var(--border)" radius={[4,4,0,0]} barSize={22}/>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="card p-5 space-y-4">
              <p className="section-title">Industry Intelligence</p>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg)] border border-[var(--border)]">
                  <Trophy size={16} className="text-[var(--amber)] flex-shrink-0"/>
                  <div>
                    <p className="text-xs font-semibold text-[var(--text)]">Industry Leader</p>
                    <p className="text-xs text-[var(--muted)]">{data.industry_benchmarks.leader} — sets the benchmark for {INDUSTRIES.find(i=>i.id===industry)?.label}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg)] border border-[var(--border)]">
                  <AlertCircle size={16} className="text-[var(--red)] flex-shrink-0"/>
                  <div>
                    <p className="text-xs font-semibold text-[var(--text)]">Top Industry Pain Point</p>
                    <p className="text-xs text-[var(--muted)]">"{data.industry_benchmarks.top_pain_point}" — most common complaint in your sector</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg)] border border-[var(--border)]">
                  <TrendingUp size={16} className="text-[var(--green)] flex-shrink-0"/>
                  <div>
                    <p className="text-xs font-semibold text-[var(--text)]">Industry Response Rate</p>
                    <p className="text-xs text-[var(--muted)]">Top performers respond to {data.industry_benchmarks.avg_response_rate}% of reviews within 24 hours</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="p-2.5 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-center">
                    <p className="text-[9px] text-[var(--muted)]">Sentiment Gap</p>
                    <p className="text-sm font-bold mt-0.5" style={{color:data.gaps.sentiment_gap>=0?'var(--green)':'var(--red)'}}>
                      {data.gaps.sentiment_gap>0?'+':''}{data.gaps.sentiment_gap}%
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-center">
                    <p className="text-[9px] text-[var(--muted)]">NPS Gap</p>
                    <p className="text-sm font-bold mt-0.5" style={{color:data.gaps.nps_gap>=0?'var(--green)':'var(--red)'}}>
                      {data.gaps.nps_gap>0?'+':''}{data.gaps.nps_gap}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* AI Analysis */}
          <div className="card p-5 space-y-3">
            <p className="section-title flex items-center gap-2"><Zap size={13} className="text-[var(--brand)]"/>AI Competitive Analysis</p>
            <div className="text-sm text-[var(--text2)] leading-relaxed whitespace-pre-wrap">{data.analysis}</div>
          </div>
        </div>
      )}

      {!data && !loading && (
        <div className="card p-14 text-center space-y-3">
          <Target size={36} className="text-[var(--muted)] mx-auto"/>
          <p className="font-semibold text-[var(--text)]">Select your industry and run benchmark</p>
          <p className="text-xs text-[var(--muted)] max-w-sm mx-auto">We'll compare your review performance against verified industry averages and show you exactly where you stand among peers.</p>
        </div>
      )}
    </div>
  )
}
