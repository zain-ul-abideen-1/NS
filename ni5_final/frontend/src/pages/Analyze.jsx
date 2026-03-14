import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { Loader2, Link2, Upload, List, Info, AlertCircle, CheckCircle2, Brain, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'
import { Analyze as AnalyzeAPI } from '../utils/api'
import { PageHeader } from '../components/UI'
import { useApp } from '../contexts/AppContext'

const MODELS = [
  {
    id: 'nlptown/bert-base-multilingual-uncased-sentiment',
    short: 'BERT Reviews',
    label: 'BERT Product Reviews',
    desc: 'Trained on Amazon, Yelp & TripAdvisor reviews. Best for product sentiment.',
    badge: 'RECOMMENDED',
    badgeColor: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10',
    color: 'var(--brand)',
  },
  {
    id: 'ni_exclusive',
    short: 'NI Exclusive',
    label: 'Exclusive NI Model',
    desc: 'NestInsights proprietary model. Advanced reasoning with deep context understanding.',
    badge: 'EXCLUSIVE',
    badgeColor: 'text-pink-400 border-pink-400/30 bg-pink-400/10',
    color: '#f472b6',
  },
  {
    id: 'cardiffnlp/twitter-roberta-base-sentiment-latest',
    short: 'RoBERTa',
    label: 'RoBERTa Sentiment',
    desc: 'Fast & cached. Trained on 124M texts. Excellent general accuracy.',
    badge: 'FASTEST',
    badgeColor: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10',
    color: '#facc15',
  },
  {
    id: 'siebert/sentiment-roberta-large-english',
    short: 'RoBERTa Large',
    label: 'RoBERTa Large English',
    desc: 'Highest accuracy large model. Best for complex English reviews.',
    badge: 'HIGHEST ACCURACY',
    badgeColor: 'text-purple-400 border-purple-400/30 bg-purple-400/10',
    color: '#a78bfa',
  },
  {
    id: 'tabularisai/multilingual-sentiment-analysis',
    short: 'Tabular Multi',
    label: 'Multilingual Sentiment',
    desc: 'Very Positive / Positive / Neutral / Negative / Very Negative scale.',
    badge: '5-LEVEL SCALE',
    badgeColor: 'text-orange-400 border-orange-400/30 bg-orange-400/10',
    color: '#fb923c',
  },
]

export default function Analyze() {
  const { language } = useApp()
  const navigate = useNavigate()
  const [tab, setTab]             = useState('url')
  const [url, setUrl]             = useState('')
  const [name, setName]           = useState('')
  const [texts, setTexts]         = useState('')
  const [file, setFile]           = useState(null)
  const [cols, setCols]           = useState(null)
  const [textCol, setTextCol]     = useState('')
  const [loading, setLoading]     = useState(false)
  const [msg, setMsg]             = useState(null)
  const [selectedModel, setSelectedModel] = useState(MODELS[0].id)
  const [modelOpen, setModelOpen] = useState(false)

  const activeModel = MODELS.find(m => m.id === selectedModel) || MODELS[0]

  const onDrop = useCallback(async (files) => {
    const f = files[0]; if (!f) return
    setFile(f); setCols(null); setTextCol('')
    const form = new FormData(); form.append('file', f)
    try {
      const r = await AnalyzeAPI.columns(form)
      setCols(r.data)
      setTextCol(r.data.suggested_text_col || '')
    } catch { toast.error('Could not detect columns') }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/*':['.csv','.txt'], 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':['.xlsx'], 'application/json':['.json'] }
  })

  const run = async () => {
    setLoading(true); setMsg(null)
    try {
      if (tab === 'url') {
        if (!url.trim()) { toast.error('Enter a URL'); return }
        const r = await AnalyzeAPI.url(url.trim(), name, selectedModel)
        if (!r.data.scraped) { setMsg({ type:'error', text:r.data.message }); return }
        toast.success(r.data.message)
        navigate(`/history/${r.data.session_id}`)
      } else if (tab === 'batch') {
        const lines = texts.split('\n').map(l=>l.trim()).filter(Boolean)
        if (!lines.length) { toast.error('Enter some text'); return }
        const r = await AnalyzeAPI.batch(lines, name, selectedModel)
        navigate(`/history/${r.data.session_id}`)
      } else {
        if (!file) { toast.error('Upload a file'); return }
        const form = new FormData()
        form.append('file', file)
        form.append('hf_model', selectedModel)
        if (textCol) form.append('text_col', textCol)
        if (name)    form.append('session_name', name)
        const r = await AnalyzeAPI.dataset(form)
        navigate(`/history/${r.data.session_id}`)
      }
    } catch(e) {
      toast.error(e.response?.data?.detail || 'Analysis failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <PageHeader title="Analyze Reviews" subtitle="URL scraping · Dataset upload · Batch text input"/>
      <div className="max-w-2xl space-y-4">

        {/* Model Selector */}
        <div className="card p-4 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Brain size={14} style={{color: activeModel.color}}/>
            <span className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">AI Sentiment Model</span>
          </div>

          {/* 5 Model Buttons */}
          <div className="grid grid-cols-5 gap-2">
            {MODELS.map(m => (
              <button
                key={m.id}
                onClick={() => setSelectedModel(m.id)}
                title={m.label}
                className={`relative flex flex-col items-center gap-1.5 p-2.5 rounded-xl border text-center transition-all duration-200 ${
                  selectedModel === m.id
                    ? 'border-[var(--brand)] bg-[var(--brand)]/8 shadow-sm'
                    : 'border-[var(--border)] hover:border-[var(--brand)]/40 bg-[var(--card2)]'
                }`}
                style={selectedModel === m.id ? {borderColor: m.color, background: m.color + '12'} : {}}
              >
                {/* Active dot */}
                {selectedModel === m.id && (
                  <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full" style={{background: m.color}}/>
                )}
                {/* Model icon */}
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
                  style={{
                    background: selectedModel === m.id ? m.color + '22' : 'var(--card)',
                    color: selectedModel === m.id ? m.color : 'var(--muted)',
                    border: `1px solid ${selectedModel === m.id ? m.color + '40' : 'var(--border)'}`,
                  }}>
                  {m.short.slice(0,2)}
                </div>
                <span className="text-[9px] font-medium leading-tight text-[var(--text2)] line-clamp-2"
                  style={selectedModel === m.id ? {color: m.color} : {}}>
                  {m.short}
                </span>
              </button>
            ))}
          </div>

          {/* Selected Model Info */}
          <div className="flex items-start gap-3 p-3 rounded-xl border"
            style={{borderColor: activeModel.color + '30', background: activeModel.color + '08'}}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{background: activeModel.color + '20', color: activeModel.color}}>
              AI
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-[var(--text)]">{activeModel.label}</span>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${activeModel.badgeColor}`}>
                  {activeModel.badge}
                </span>
              </div>
              <p className="text-xs text-[var(--muted)] mt-0.5">{activeModel.desc}</p>
              <p className="text-[10px] text-[var(--muted)]/60 mt-1 font-mono truncate">{activeModel.id}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-[var(--card)] rounded-xl border border-[var(--border)]">
          {[{k:'url',label:'🔗 URL Scrape'},{k:'dataset',label:'📂 Dataset'},{k:'batch',label:'📋 Batch'}].map(tb=>(
            <button key={tb.k} onClick={()=>setTab(tb.k)}
              className={`tab-btn flex-1 ${tab===tb.k?'tab-active':''}`}>{tb.label}</button>
          ))}
        </div>

        <div className="card p-5 space-y-4">
          <div>
            <label className="label">Session Name (optional)</label>
            <input className="input" placeholder="e.g. iPhone 15 Pro Reviews — Amazon" value={name} onChange={e=>setName(e.target.value)}/>
          </div>

          {tab==='url' && (
            <div className="space-y-3">
              <div>
                <label className="label">Review Page URL</label>
                <input className="input font-mono text-xs" placeholder="https://www.trustpilot.com/review/example.com"
                  value={url} onChange={e=>setUrl(e.target.value)} onKeyDown={e=>e.key==='Enter'&&run()}/>
              </div>
              <div className="p-3 bg-[var(--card2)] rounded-xl border border-[var(--border2)] text-xs space-y-1.5">
                <p className="flex items-center gap-1.5 text-[var(--text)] font-medium"><Info size={12}/>Scraper Info</p>
                <p className="text-[var(--text2)]">✅ Works natively: Trustpilot, G2, Capterra, Yelp, any site with JSON-LD structured data</p>
                <p className="text-[var(--text2)]">🔑 Add <span className="font-mono text-[var(--brand)]">SCRAPER_API_KEY</span> in backend/.env for Amazon, Daraz, and bot-protected sites</p>
                <p className="text-[var(--muted)]">Get free key at scraperapi.com (1000 free requests/month)</p>
              </div>
            </div>
          )}

          {tab==='dataset' && (
            <div className="space-y-3">
              <div {...getRootProps()} className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                isDragActive ? 'border-[var(--brand)] bg-[var(--brand)]/5' : 'border-[var(--border)] hover:border-[var(--brand)]/40'
              }`}>
                <input {...getInputProps()}/>
                <Upload size={24} className="text-[var(--muted)] mx-auto mb-2"/>
                {file ? <p className="text-sm text-[var(--brand)] font-medium">{file.name}</p>
                      : <><p className="text-sm text-[var(--text)]">Drop CSV / Excel / JSON / TXT</p><p className="text-xs text-[var(--muted)] mt-1">Up to 500 rows analyzed</p></>}
              </div>
              {cols && (
                <div>
                  <label className="label">Text column ({cols.rows} rows)</label>
                  <div className="flex flex-wrap gap-2">
                    {cols.columns.map(c=>(
                      <button key={c} onClick={()=>setTextCol(c)}
                        className={`px-3 py-1 rounded-lg text-xs font-mono border transition-all ${
                          textCol===c ? 'border-[var(--brand)] bg-[var(--brand)]/10 text-[var(--brand)]' : 'border-[var(--border)] text-[var(--muted)] hover:border-[var(--brand)]/40'
                        }`}>{c}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {tab==='batch' && (
            <div>
              <label className="label">Reviews — one per line</label>
              <textarea className="input min-h-40 resize-y font-mono text-xs leading-relaxed"
                placeholder={"Great product, fast delivery!\nTerrible quality, broke after a week.\nDecent value for money, nothing special."}
                value={texts} onChange={e=>setTexts(e.target.value)}/>
              <p className="text-xs text-[var(--muted)] mt-1">{texts.split('\n').filter(l=>l.trim()).length} review(s)</p>
            </div>
          )}

          {msg && (
            <div className={`flex items-start gap-2 p-3 rounded-xl text-sm ${
              msg.type==='error' ? 'bg-[var(--red)]/8 border border-[var(--red)]/20 text-[var(--red)]'
                                : 'bg-[var(--green)]/8 border border-[var(--green)]/20 text-[var(--green)]'
            }`}>
              {msg.type==='error' ? <AlertCircle size={14} className="flex-shrink-0 mt-0.5"/> : <CheckCircle2 size={14} className="flex-shrink-0 mt-0.5"/>}
              <p className="leading-relaxed">{msg.text}</p>
            </div>
          )}

          <button onClick={run} disabled={loading} className="btn-primary w-full justify-center py-3 text-base"
            style={{'--btn-color': activeModel.color}}>
            {loading
              ? <><Loader2 size={15} className="animate-spin"/>Analyzing with {activeModel.short}…</>
              : <>✨ Analyze with {activeModel.short}</>}
          </button>
        </div>
      </div>
    </div>
  )
}