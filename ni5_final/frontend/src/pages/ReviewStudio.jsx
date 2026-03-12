import { useState, useEffect, useRef } from 'react'
import {
  Sparkles, Wand2, Copy, Check, RefreshCw, Target, Zap,
  Star, MessageSquare, Globe, Shield, BarChart2, Download,
  ChevronRight, AlertCircle, CheckCircle, Plus, Trash2,
  Upload, FileText, Brain, TrendingUp, Eye, Edit3,
  ArrowRight, Award, Clock, Users, ThumbsUp, ThumbsDown
} from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Sessions } from '../utils/api'

const TONES = [
  { id:'professional', label:'Professional', color:'#0ea5e9', desc:'Formal, brand-aligned, polished' },
  { id:'friendly',     label:'Friendly',     color:'#34D399', desc:'Warm, approachable, personal' },
  { id:'empathetic',   label:'Empathetic',   color:'#a78bfa', desc:'Caring, emotionally aware' },
  { id:'concise',      label:'Concise',      color:'#fbbf24', desc:'Brief, direct, no fluff' },
  { id:'apologetic',   label:'Apologetic',   color:'#f87171', desc:'Sincere, accountable, humble' },
]

const INDUSTRIES = [
  'ecommerce','saas','hospitality','healthcare','restaurant',
  'retail','finance','logistics','education','telecom'
]

const BRAND_PRESETS = [
  { name:'Luxury Brand',   emoji:'💎', voice:'Sophisticated, gracious, always elevated. Never apologize directly — express that our standards fell short.' },
  { name:'Tech Startup',   emoji:'🚀', voice:'Casual, energetic, solutions-focused. Use "Hey!" openings. Mention our engineering team fixing things fast.' },
  { name:'Healthcare',     emoji:'🏥', voice:'Empathetic, careful, warm and reassuring. Always recommend professional consultation when relevant.' },
  { name:'E-commerce',     emoji:'🛒', voice:'Friendly, fast-acting. Proactively mention our 30-day refund policy and free returns.' },
  { name:'Restaurant',     emoji:'🍽️', voice:'Warm, food-passionate, inviting. Always invite them back with a personal touch.' },
  { name:'Finance',        emoji:'🏦', voice:'Trustworthy, precise, regulatory-aware. Never make promises about financial outcomes.' },
]

const LANGS = [
  {code:'es',name:'Spanish'},   {code:'fr',name:'French'},    {code:'de',name:'German'},
  {code:'ar',name:'Arabic'},    {code:'ur',name:'Urdu'},      {code:'hi',name:'Hindi'},
  {code:'zh',name:'Chinese'},   {code:'ja',name:'Japanese'},  {code:'pt',name:'Portuguese'},
  {code:'it',name:'Italian'},   {code:'ru',name:'Russian'},   {code:'tr',name:'Turkish'},
  {code:'ko',name:'Korean'},    {code:'nl',name:'Dutch'},     {code:'pl',name:'Polish'},
  {code:'sv',name:'Swedish'},   {code:'da',name:'Danish'},    {code:'fi',name:'Finnish'},
  {code:'no',name:'Norwegian'}, {code:'cs',name:'Czech'},
]

const FEATURES = [
  { id:'bulk',      icon:Zap,          label:'Bulk Reply Generator',  sub:'Generate replies for all session reviews at once', color:'#0ea5e9' },
  { id:'coach',     icon:Target,       label:'Response Coach',        sub:'Paste your draft — get scored & AI-improved',    color:'#34d399' },
  { id:'brand',     icon:Shield,       label:'Brand Voice Studio',    sub:'Train AI with your exact personality',           color:'#a78bfa' },
  { id:'template',  icon:Star,         label:'Industry Templates',    sub:'AI crafts industry-specific expert replies',     color:'#fbbf24' },
  { id:'multilang', icon:Globe,        label:'Multi-Language Engine', sub:'Translate replies to 20+ languages instantly',   color:'#f97316' },
  { id:'score',     icon:BarChart2,    label:'Quality Scorer',        sub:'Score & benchmark your reply before publishing', color:'#ec4899' },
  { id:'sentiment', icon:Brain,        label:'Review Analyzer',       sub:'Deep-analyze any review for insights & intent',  color:'#14b8a6' },
  { id:'abtest',    icon:TrendingUp,   label:'A/B Reply Tester',      sub:'Generate 3 reply variants, see which is best',   color:'#8b5cf6' },
]

// ── Shared Helpers ───────────────────────────────────────────────
function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false)
  const doCopy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success('Copied!')
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button onClick={doCopy} className="btn-ghost p-1.5 flex items-center gap-1 text-xs">
      {copied ? <Check size={12} className="text-[var(--green)]"/> : <Copy size={12}/>}
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

function ScoreBar({ label, value, max = 10 }) {
  const v = value || 0
  const c = v >= 8 ? 'var(--green)' : v >= 6 ? 'var(--amber)' : 'var(--red)'
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between">
        <span className="text-xs text-[var(--text2)]">{label}</span>
        <span className="text-xs font-bold font-mono" style={{color:c}}>{v}/{max}</span>
      </div>
      <div className="h-2 bg-[var(--border)] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{width:`${(v/max)*100}%`, background:c}}/>
      </div>
    </div>
  )
}

function BigScore({ value, label }) {
  const c = value >= 8 ? 'var(--green)' : value >= 6 ? '#f59e0b' : 'var(--red)'
  const label2 = value >= 8 ? 'Excellent' : value >= 6 ? 'Good' : 'Needs Work'
  return (
    <div className="text-center p-4 card rounded-xl">
      <div className="text-5xl font-display font-bold" style={{color:c}}>{value || '—'}</div>
      <div className="text-xs text-[var(--muted)] mt-1">{label}</div>
      <div className="text-xs font-semibold mt-1" style={{color:c}}>{value ? label2 : ''}</div>
    </div>
  )
}

function ReplyCard({ review, reply, sentiment, score, onCopy, editable }) {
  const [text, setText] = useState(reply)
  const [editing, setEditing] = useState(false)
  const sentColor = sentiment === 'positive' ? 'var(--green)' : sentiment === 'negative' ? 'var(--red)' : 'var(--amber)'

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{background:sentColor}}>{sentiment}</span>
        {score && <span className="text-[10px] text-[var(--muted)]">Quality: <strong>{score}/10</strong></span>}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="p-3 bg-[var(--bg)] rounded-xl border border-[var(--border)]">
          <p className="text-[10px] text-[var(--muted)] font-semibold uppercase tracking-wider mb-2">Customer Review</p>
          <p className="text-sm text-[var(--text2)] leading-relaxed">{review}</p>
        </div>
        <div className="relative p-3 rounded-xl border border-[var(--brand)]/30 bg-[var(--brand)]/5">
          <p className="text-[10px] text-[var(--brand)] font-semibold uppercase tracking-wider mb-2">AI Reply</p>
          {editing ? (
            <textarea className="input text-sm w-full resize-none" rows={4} value={text} onChange={e => setText(e.target.value)}/>
          ) : (
            <p className="text-sm text-[var(--text)] leading-relaxed pr-8">{text}</p>
          )}
          <div className="absolute top-2 right-2 flex gap-1">
            {editable && <button onClick={() => setEditing(e => !e)} className="btn-ghost p-1.5"><Edit3 size={11}/></button>}
            <CopyBtn text={text}/>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Feature Panels ───────────────────────────────────────────────

function BulkPanel({ sessions, tone, brandVoice }) {
  const [selSession, setSelSession] = useState('')
  const [reviews, setReviews] = useState([])
  const [manualReviews, setManualReviews] = useState('')
  const [useManual, setUseManual] = useState(false)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState([])
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (selSession) {
      Sessions.get(selSession).then(r => setReviews(r.data?.reviews || [])).catch(() => {})
    } else setReviews([])
  }, [selSession])

  const reviewCount = useManual
    ? manualReviews.split('\n').filter(l => l.trim()).length
    : (reviews.length || 5)

  const generate = async () => {
    setLoading(true); setResults([]); setProgress(0)
    let src
    if (useManual) {
      src = manualReviews.split('\n').filter(l => l.trim()).map(t => ({ text: t.trim(), sentiment: 'neutral' }))
    } else if (selSession && reviews.length) {
      src = reviews.slice(0, 15)
    } else {
      src = [
        { text: 'Product arrived damaged, customer service was completely unhelpful.', sentiment: 'negative' },
        { text: 'Absolutely love this! Exceeded all my expectations. Fast delivery too.', sentiment: 'positive' },
        { text: 'Product is okay, delivery was a bit slow but works fine.', sentiment: 'neutral' },
        { text: 'Terrible — waited 3 weeks, zero tracking updates. Never again.', sentiment: 'negative' },
        { text: 'Amazing quality for the price. Will definitely order again!', sentiment: 'positive' },
      ]
    }
    // Simulate progress
    const interval = setInterval(() => setProgress(p => Math.min(p + 8, 90)), 200)
    try {
      const r = await axios.post('/api/studio/bulk-reply', {
        reviews: src.map(r => ({ text: r.text, sentiment: r.sentiment })),
        tone, brand_voice: brandVoice
      })
      setResults(r.data.replies || [])
      toast.success(`✅ ${r.data.count} unique replies generated!`)
    } catch { toast.error('Generation failed — check backend is running') }
    clearInterval(interval); setProgress(100)
    setTimeout(() => setProgress(0), 800)
    setLoading(false)
  }

  const exportCSV = () => {
    const csv = 'Review,Sentiment,AI Reply,Quality Score\n' + results.map(r =>
      `"${(r.review||'').replace(/"/g,'""')}","${r.sentiment}","${(r.reply||'').replace(/"/g,'""')}","${r.quality_score||8}"`
    ).join('\n')
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv],{type:'text/csv'})); a.download='bulk_replies.csv'; a.click()
  }

  return (
    <div className="space-y-5">
      {/* Config */}
      <div className="card p-5 space-y-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <p className="font-semibold text-[var(--text)]">Bulk Reply Generator</p>
            <p className="text-xs text-[var(--muted)] mt-0.5">Generate polished, unique replies for every review in one click</p>
          </div>
          <div className="flex gap-2">
            {results.length > 0 && <button onClick={exportCSV} className="btn-secondary text-xs flex items-center gap-1"><Download size={12}/>Export CSV</button>}
            <button onClick={generate} disabled={loading} className="btn-primary text-xs flex items-center gap-1">
              {loading ? <RefreshCw size={12} className="animate-spin"/> : <Zap size={12}/>}
              {loading ? 'Generating...' : `Generate ${reviewCount} Replies`}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <div className="flex gap-3 mb-3">
              <button onClick={() => setUseManual(false)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${!useManual?'text-white border-transparent':'border-[var(--border)] text-[var(--muted)]'}`}
                style={!useManual?{background:'var(--grad)'}:{}}>Session Reviews</button>
              <button onClick={() => setUseManual(true)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${useManual?'text-white border-transparent':'border-[var(--border)] text-[var(--muted)]'}`}
                style={useManual?{background:'var(--grad)'}:{}}>Paste Reviews Manually</button>
            </div>
            {!useManual ? (
              <div className="space-y-2">
                <select className="input text-sm w-full" value={selSession} onChange={e => setSelSession(e.target.value)}>
                  <option value="">📋 Use 5 built-in sample reviews (demo)</option>
                  {sessions.map(s => <option key={s.session_id} value={s.session_id}>📁 {s.name} ({s.total_reviews} reviews)</option>)}
                </select>
                {reviews.length > 0 && (
                  <p className="text-xs text-[var(--green)] flex items-center gap-1">
                    <CheckCircle size={11}/> {reviews.length} reviews loaded — will process up to 15
                  </p>
                )}
              </div>
            ) : (
              <div>
                <textarea className="input text-sm w-full resize-none" rows={5}
                  placeholder={"Paste one review per line:\nThe product quality was terrible\nFast delivery and great packaging\nAverage product, nothing special"}
                  value={manualReviews} onChange={e => setManualReviews(e.target.value)}/>
                <p className="text-[10px] text-[var(--muted)] mt-1">{manualReviews.split('\n').filter(l=>l.trim()).length} reviews detected</p>
              </div>
            )}
          </div>
          <div className="space-y-3">
            <div>
              <label className="label">Brand Voice <span className="text-[var(--muted)]">(optional)</span></label>
              <textarea className="input text-xs resize-none" rows={4}
                placeholder="e.g. always mention our 30-day guarantee, warm and professional..."
                defaultValue={brandVoice} id="bv-bulk"/>
            </div>
          </div>
        </div>

        {progress > 0 && progress < 100 && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-[var(--muted)]">
              <span>Generating unique replies...</span><span>{progress}%</span>
            </div>
            <div className="h-2 bg-[var(--border)] rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{width:`${progress}%`, background:'var(--grad)'}}/>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      {results.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-[var(--text)]">{results.length} Replies Generated</p>
            <div className="flex gap-2 text-xs text-[var(--muted)]">
              <span className="text-[var(--green)]">✅ {results.filter(r=>r.sentiment==='positive').length} positive</span>
              <span className="text-[var(--red)]">❌ {results.filter(r=>r.sentiment==='negative').length} negative</span>
              <span className="text-[var(--amber)]">➖ {results.filter(r=>r.sentiment==='neutral').length} neutral</span>
            </div>
          </div>
          {results.map((r, i) => <ReplyCard key={i} {...r} editable/>)}
        </div>
      ) : !loading && (
        <div className="card p-12 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto" style={{background:'var(--grad)'}}><Wand2 size={22} className="text-white"/></div>
          <p className="font-semibold text-[var(--text)]">Ready to generate</p>
          <p className="text-xs text-[var(--muted)]">Each reply is uniquely crafted based on the specific review content, tone &amp; brand voice</p>
        </div>
      )}
    </div>
  )
}

function CoachPanel({ tone }) {
  const [review, setReview] = useState('')
  const [reply, setReply] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [improved, setImproved] = useState('')

  const run = async () => {
    if (!review.trim() || !reply.trim()) { toast.error('Fill in both fields first'); return }
    setLoading(true); setResult(null)
    try {
      const r = await axios.post('/api/studio/coach-reply', { review, reply, tone })
      setResult(r.data)
      setImproved(r.data.improved || '')
    } catch { toast.error('Coach failed') }
    setLoading(false)
  }

  const charCount = (text, good, warn) => {
    const c = text.length
    return c > good ? (c > warn ? 'text-[var(--red)]' : 'text-[var(--amber)]') : 'text-[var(--muted)]'
  }

  return (
    <div className="space-y-5">
      <div className="card p-5 space-y-4">
        <div>
          <p className="font-semibold text-[var(--text)]">Response Coach</p>
          <p className="text-xs text-[var(--muted)] mt-0.5">Write your reply to any customer review — our AI grades it across 5 dimensions and gives you an improved version</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="label flex items-center justify-between">
              Customer Review
              <span className={`text-[10px] font-mono ${charCount(review, 300, 600)}`}>{review.length} chars</span>
            </label>
            <textarea className="input text-sm resize-none" rows={6}
              placeholder="Paste the customer's exact review here..."
              value={review} onChange={e => setReview(e.target.value)}/>
            <div className="flex gap-2 text-[10px]">
              {['Short positive review','Angry complaint','Mixed feedback'].map(sample => (
                <button key={sample} onClick={() => {
                  const samples = {
                    'Short positive review': 'Great product! Arrived fast and works perfectly. Will order again.',
                    'Angry complaint': 'This is absolutely TERRIBLE. Item broke after 2 days, customer service ignored me for a week. Complete waste of money!',
                    'Mixed feedback': 'The product quality is decent but delivery took 2 weeks when 3-5 days was promised. Packaging was also damaged.',
                  }
                  setReview(samples[sample])
                }} className="px-2 py-1 bg-[var(--border)] rounded text-[var(--muted)] hover:text-[var(--text)] transition-all">{sample}</button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <label className="label flex items-center justify-between">
              Your Draft Reply
              <span className={`text-[10px] font-mono ${charCount(reply, 400, 800)}`}>{reply.length} chars</span>
            </label>
            <textarea className="input text-sm resize-none" rows={6}
              placeholder="Write your reply here to get it graded and improved..."
              value={reply} onChange={e => setReply(e.target.value)}/>
            <p className="text-[10px] text-[var(--muted)]">💡 Tip: 100-300 chars is optimal for customer review replies</p>
          </div>
        </div>
        <button onClick={run} disabled={loading} className="btn-primary text-sm flex items-center gap-2">
          {loading ? <RefreshCw size={14} className="animate-spin"/> : <Target size={14}/>}
          {loading ? 'Analyzing your reply...' : 'Get AI Coaching & Improvement'}
        </button>
      </div>

      {result && (
        <div className="space-y-4">
          {/* Score grid */}
          <div className="grid grid-cols-3 gap-3">
            <BigScore value={result.score} label="Overall Score"/>
            <BigScore value={result.empathy} label="Empathy"/>
            <BigScore value={result.professionalism} label="Professionalism"/>
          </div>

          {/* Detailed breakdown */}
          <div className="card p-5 space-y-4">
            <p className="font-semibold text-[var(--text)]">Detailed Breakdown</p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {[
                ['Overall Score', result.score],
                ['Empathy', result.empathy],
                ['Professionalism', result.professionalism],
                ['Resolution Focus', result.resolution || 6],
                ['Tone Accuracy', result.tone_match || 7],
                ['Clarity', result.clarity || 7],
              ].map(([l,v]) => <ScoreBar key={l} label={l} value={v}/>)}
            </div>
          </div>

          {/* Feedback */}
          <div className="card p-4 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{background:(result.score||0)>=7?'var(--green)20':'var(--amber)20'}}>
              {(result.score||0)>=7
                ? <CheckCircle size={14} className="text-[var(--green)]"/>
                : <AlertCircle size={14} className="text-[var(--amber)]"/>}
            </div>
            <div>
              <p className="text-xs font-semibold text-[var(--text)] mb-1">Coach Feedback</p>
              <p className="text-sm text-[var(--text2)] leading-relaxed">{result.feedback}</p>
            </div>
          </div>

          {/* Improved version */}
          {improved && (
            <div className="card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-[var(--text)] flex items-center gap-2">
                  <Sparkles size={14} className="text-[var(--brand)]"/> AI-Improved Version
                </p>
                <CopyBtn text={improved}/>
              </div>
              <div className="p-4 rounded-xl border border-[var(--brand)]/25 bg-[var(--brand)]/5">
                <p className="text-sm text-[var(--text)] leading-relaxed">{improved}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-[var(--muted)]">
                  <span className="text-[var(--green)]">↑</span> More empathetic opening
                </div>
                <div className="flex items-center gap-1.5 text-[var(--muted)]">
                  <span className="text-[var(--green)]">↑</span> Clear resolution path
                </div>
                <div className="flex items-center gap-1.5 text-[var(--muted)]">
                  <span className="text-[var(--green)]">↑</span> Brand-aligned tone
                </div>
                <div className="flex items-center gap-1.5 text-[var(--muted)]">
                  <span className="text-[var(--green)]">↑</span> Professional closing
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function BrandPanel({ brandVoice, setBrandVoice, tone }) {
  const [testReview, setTestReview] = useState('')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  const preview = async () => {
    if (!testReview.trim()) { toast.error('Enter a test review'); return }
    setLoading(true); setResult('')
    try {
      const r = await axios.post('/api/studio/template-reply', { review: testReview, category: 'ecommerce', tone, brand_voice: brandVoice })
      setResult(r.data.reply || '')
    } catch { toast.error('Preview failed') }
    setLoading(false)
  }

  return (
    <div className="space-y-5">
      <div className="card p-5 space-y-4">
        <div>
          <p className="font-semibold text-[var(--text)]">Brand Voice Studio</p>
          <p className="text-xs text-[var(--muted)] mt-0.5">Define your brand's exact personality. Every AI reply across all tools will match it automatically.</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="space-y-4">
            <div>
              <label className="label">Your Brand Voice Definition</label>
              <textarea className="input text-sm resize-none" rows={6}
                placeholder="Describe your brand in detail:&#10;• Tone (warm/formal/energetic)&#10;• Things to always mention (guarantees, policies)&#10;• Words/phrases to avoid&#10;• Signature sign-off&#10;• Industry-specific rules"
                value={brandVoice} onChange={e => setBrandVoice(e.target.value)}/>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[10px] text-[var(--muted)]">{brandVoice.length} chars</span>
                {brandVoice && (
                  <span className="text-[10px] text-[var(--green)] flex items-center gap-1">
                    <CheckCircle size={9}/> Brand voice active across all tools
                  </span>
                )}
              </div>
            </div>

            <div>
              <label className="label">Quick Presets</label>
              <div className="grid grid-cols-2 gap-2">
                {BRAND_PRESETS.map(p => (
                  <button key={p.name} onClick={() => { setBrandVoice(p.voice); setSaved(true); setTimeout(()=>setSaved(false),2000) }}
                    className="p-3 rounded-xl text-left border border-[var(--border)] hover:border-[var(--brand)]/40 hover:bg-[var(--card2)] transition-all">
                    <p className="text-xs font-semibold text-[var(--text)]">{p.emoji} {p.name}</p>
                    <p className="text-[10px] text-[var(--muted)] mt-0.5 leading-tight line-clamp-2">{p.voice}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="label">Test Your Brand Voice</label>
              <textarea className="input text-sm resize-none" rows={4}
                placeholder="Paste any customer review to preview how your brand voice sounds..."
                value={testReview} onChange={e => setTestReview(e.target.value)}/>
            </div>
            <button onClick={preview} disabled={loading || !brandVoice} className="btn-primary text-xs w-full flex items-center justify-center gap-2">
              {loading ? <RefreshCw size={12} className="animate-spin"/> : <Eye size={12}/>}
              {loading ? 'Generating preview...' : 'Preview Reply with Brand Voice'}
            </button>
            {!brandVoice && <p className="text-[10px] text-[var(--amber)] flex items-center gap-1"><AlertCircle size={10}/>Define your brand voice first</p>}
            {result && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-[var(--text)]">Brand Voice Preview</p>
                  <CopyBtn text={result}/>
                </div>
                <div className="p-3 rounded-xl border border-[var(--brand)]/20 bg-[var(--brand)]/5">
                  <p className="text-sm text-[var(--text)] leading-relaxed">{result}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {brandVoice && (
        <div className="card p-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-[var(--green)]/15">
            <CheckCircle size={14} className="text-[var(--green)]"/>
          </div>
          <div>
            <p className="text-xs font-semibold text-[var(--text)]">Brand Voice Active</p>
            <p className="text-xs text-[var(--muted)]">Applied automatically to: Bulk Replies, Industry Templates, and Brand Voice previews</p>
          </div>
        </div>
      )}
    </div>
  )
}

function TemplatePanel({ tone, brandVoice, sessions }) {
  const [category, setCategory] = useState('ecommerce')
  const [review, setReview] = useState('')
  const [selSession, setSelSession] = useState('')
  const [sessionReviews, setSessionReviews] = useState([])
  const [selReview, setSelReview] = useState(null)
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionLoading, setSessionLoading] = useState(false)

  useEffect(() => {
    if (selSession) {
      setSessionLoading(true)
      Sessions.get(selSession).then(r => {
        setSessionReviews(r.data?.reviews || [])
        setSessionLoading(false)
      }).catch(() => setSessionLoading(false))
    } else setSessionReviews([])
  }, [selSession])

  const generate = async (reviewText = null) => {
    const text = reviewText || review
    if (!text.trim()) { toast.error('Enter or select a review'); return }
    setLoading(true); setResult('')
    try {
      const r = await axios.post('/api/studio/template-reply', {
        review: text, category, tone, brand_voice: brandVoice
      })
      setResult(r.data.reply || '')
    } catch { toast.error('Generation failed') }
    setLoading(false)
  }

  const INDUSTRY_INFO = {
    ecommerce:    { emoji:'🛒', hint:'Mention shipping policy, refund guarantee' },
    saas:         { emoji:'💻', hint:'Reference your support team, SLA, roadmap' },
    hospitality:  { emoji:'🏨', hint:'Invite them back, mention guest services' },
    healthcare:   { emoji:'🏥', hint:'Empathetic, always suggest professional help' },
    restaurant:   { emoji:'🍽️', hint:'Passionate, invite them back, mention chef' },
    retail:       { emoji:'🏪', hint:'In-store help, manager escalation path' },
    finance:      { emoji:'🏦', hint:'Regulatory-aware, trustworthy, precise' },
    logistics:    { emoji:'📦', hint:'Tracking, carrier partnerships, SLAs' },
    education:    { emoji:'🎓', hint:'Supportive, outcomes-focused, academic' },
    telecom:      { emoji:'📡', hint:'Technical clarity, escalation process' },
  }

  return (
    <div className="space-y-5">
      <div className="card p-5 space-y-4">
        <div>
          <p className="font-semibold text-[var(--text)]">Industry Templates</p>
          <p className="text-xs text-[var(--muted)] mt-0.5">AI generates industry-expert replies with compliance norms, best practices, and your brand voice</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          <div className="lg:col-span-2 space-y-3">
            <div>
              <label className="label">Industry</label>
              <div className="grid grid-cols-2 gap-1.5">
                {INDUSTRIES.map(ind => (
                  <button key={ind} onClick={() => setCategory(ind)}
                    className={`text-xs px-2 py-2 rounded-lg border text-left transition-all ${category===ind?'text-white border-transparent':'border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]'}`}
                    style={category===ind?{background:'var(--grad)'}:{}}>
                    {INDUSTRY_INFO[ind]?.emoji} {ind.charAt(0).toUpperCase()+ind.slice(1)}
                  </button>
                ))}
              </div>
              {INDUSTRY_INFO[category] && (
                <p className="text-[10px] text-[var(--brand)] mt-1.5 flex items-center gap-1">
                  <Sparkles size={9}/> {INDUSTRY_INFO[category].hint}
                </p>
              )}
            </div>

            <div>
              <label className="label">Load from Session</label>
              <select className="input text-sm w-full" value={selSession} onChange={e=>setSelSession(e.target.value)}>
                <option value="">— Manual input —</option>
                {sessions.map(s=><option key={s.session_id} value={s.session_id}>{s.name}</option>)}
              </select>
            </div>

            {!selSession && (
              <div>
                <label className="label">Review Text</label>
                <textarea className="input text-sm resize-none" rows={5}
                  placeholder="Paste customer review..."
                  value={review} onChange={e=>setReview(e.target.value)}/>
                <button onClick={()=>generate()} disabled={loading} className="btn-primary text-xs w-full mt-2 flex items-center justify-center gap-2">
                  {loading?<RefreshCw size={12} className="animate-spin"/>:<Wand2 size={12}/>}
                  {loading?'Generating...':'Generate Industry Reply'}
                </button>
              </div>
            )}
          </div>

          <div className="lg:col-span-3 space-y-3">
            {selSession ? (
              sessionLoading ? (
                <div className="text-center py-8 text-[var(--muted)]">
                  <RefreshCw size={18} className="animate-spin mx-auto mb-2"/>
                  <p className="text-xs">Loading session reviews...</p>
                </div>
              ) : sessionReviews.length > 0 ? (
                <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                  <p className="text-xs font-semibold text-[var(--text)] mb-2">{sessionReviews.length} reviews — click to generate reply</p>
                  {sessionReviews.map((r, i) => (
                    <div key={i} className="space-y-2">
                      <div className="p-3 rounded-xl border border-[var(--border)] hover:border-[var(--brand)]/30 cursor-pointer transition-all bg-[var(--bg)]"
                        onClick={() => { setSelReview(i); generate(r.text) }}>
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium text-white ${r.sentiment==='positive'?'bg-[var(--green)]':r.sentiment==='negative'?'bg-[var(--red)]':'bg-[var(--amber)]'}`}>{r.sentiment}</span>
                          <span className="text-[9px] text-[var(--muted)] flex items-center gap-1"><Wand2 size={8}/> Generate reply</span>
                        </div>
                        <p className="text-xs text-[var(--text2)] line-clamp-2">{r.text}</p>
                      </div>
                      {selReview === i && result && !loading && (
                        <div className="relative p-3 rounded-xl border border-[var(--brand)]/25 bg-[var(--brand)]/5 ml-4">
                          <p className="text-[10px] text-[var(--brand)] font-semibold mb-1">↳ AI Reply ({category})</p>
                          <p className="text-xs text-[var(--text)] leading-relaxed pr-8">{result}</p>
                          <div className="absolute top-2 right-2"><CopyBtn text={result}/></div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-[var(--muted)] text-sm">No reviews in this session</div>
              )
            ) : result ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-[var(--text)]">Generated Reply — {category.charAt(0).toUpperCase()+category.slice(1)}</p>
                  <CopyBtn text={result}/>
                </div>
                <div className="p-4 rounded-xl border border-[var(--brand)]/20 bg-[var(--brand)]/5 min-h-[120px]">
                  <p className="text-sm text-[var(--text)] leading-relaxed">{result}</p>
                </div>
                <button onClick={()=>generate()} className="btn-ghost text-xs flex items-center gap-1">
                  <RefreshCw size={11}/> Regenerate
                </button>
              </div>
            ) : (
              <div className="h-48 flex flex-col items-center justify-center text-center rounded-xl border border-[var(--border)] bg-[var(--bg)]">
                <MessageSquare size={28} className="text-[var(--muted)] mb-2"/>
                <p className="text-sm text-[var(--muted)]">Select an industry & paste a review</p>
                <p className="text-xs text-[var(--dim)] mt-1">or load from a session</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function MultiLangPanel({ tone }) {
  const [engReply, setEngReply] = useState('')
  const [selectedLangs, setSelectedLangs] = useState(['Spanish', 'French', 'Arabic'])
  const [results, setResults] = useState({})
  const [loading, setLoading] = useState({})
  const [genAll, setGenAll] = useState(false)

  const translate = async (lang) => {
    if (!engReply.trim()) { toast.error('Enter your English reply first'); return }
    setLoading(l => ({...l, [lang]: true}))
    try {
      const r = await axios.post('/api/studio/translate-reply', { reply: engReply, target_language: lang })
      setResults(res => ({...res, [lang]: r.data.translated || ''}))
    } catch { toast.error(`Failed to translate to ${lang}`) }
    setLoading(l => ({...l, [lang]: false}))
  }

  const translateAll = async () => {
    if (!engReply.trim()) { toast.error('Enter your English reply first'); return }
    setGenAll(true)
    for (const lang of selectedLangs) {
      await translate(lang)
    }
    setGenAll(false)
    toast.success(`Translated to ${selectedLangs.length} languages!`)
  }

  const toggleLang = (name) => {
    setSelectedLangs(l => l.includes(name) ? l.filter(x=>x!==name) : [...l, name])
  }

  return (
    <div className="space-y-5">
      <div className="card p-5 space-y-4">
        <div>
          <p className="font-semibold text-[var(--text)]">Multi-Language Reply Engine</p>
          <p className="text-xs text-[var(--muted)] mt-0.5">Write your reply once in English — instantly publish to 20 languages for global customers</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-1 space-y-3">
            <div>
              <label className="label">English Reply</label>
              <textarea className="input text-sm resize-none" rows={5}
                placeholder="Write your customer reply in English here..."
                value={engReply} onChange={e => setEngReply(e.target.value)}/>
              <p className="text-[10px] text-[var(--muted)] mt-1">{engReply.length} chars</p>
            </div>
            <div>
              <label className="label mb-2 flex items-center justify-between">
                Target Languages
                <span className="text-[9px] text-[var(--muted)]">{selectedLangs.length} selected</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {LANGS.map(l => (
                  <button key={l.name} onClick={() => toggleLang(l.name)}
                    className={`text-[10px] px-2 py-1 rounded-lg border transition-all ${selectedLangs.includes(l.name)?'text-white border-transparent':'border-[var(--border)] text-[var(--muted)]'}`}
                    style={selectedLangs.includes(l.name)?{background:'var(--grad)'}:{}}>
                    {l.name}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={translateAll} disabled={genAll || !engReply || selectedLangs.length===0}
              className="btn-primary text-xs w-full flex items-center justify-center gap-2">
              {genAll ? <RefreshCw size={12} className="animate-spin"/> : <Globe size={12}/>}
              {genAll ? 'Translating...' : `Translate to All ${selectedLangs.length} Languages`}
            </button>
          </div>

          <div className="lg:col-span-2 space-y-3 max-h-[480px] overflow-y-auto pr-1">
            {selectedLangs.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-[var(--muted)] text-sm">Select languages on the left</div>
            ) : selectedLangs.map(lang => (
              <div key={lang} className="card p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-[var(--text)]">🌐 {lang}</p>
                  <div className="flex items-center gap-2">
                    {results[lang] && <CopyBtn text={results[lang]}/>}
                    <button onClick={() => translate(lang)} disabled={loading[lang]}
                      className="btn-ghost p-1.5 text-[10px] flex items-center gap-1">
                      {loading[lang] ? <RefreshCw size={10} className="animate-spin"/> : <Zap size={10}/>}
                      {loading[lang] ? 'Translating...' : 'Translate'}
                    </button>
                  </div>
                </div>
                {results[lang] ? (
                  <p className="text-sm text-[var(--text)] leading-relaxed">{results[lang]}</p>
                ) : (
                  <p className="text-xs text-[var(--dim)] italic">Click Translate or Translate All above</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function ScorePanel({ sessions }) {
  const [reviewText, setReviewText] = useState('')
  const [replyText, setReplyText] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [selSession, setSelSession] = useState('')
  const [sessionReviews, setSessionReviews] = useState([])
  const [picked, setPicked] = useState(null)

  useEffect(() => {
    if (selSession) Sessions.get(selSession).then(r => setSessionReviews(r.data?.reviews||[])).catch(()=>{})
    else setSessionReviews([])
  }, [selSession])

  const score = async () => {
    if (!reviewText.trim() || !replyText.trim()) { toast.error('Both fields required'); return }
    setLoading(true); setResult(null)
    try {
      const r = await axios.post('/api/studio/score-reply', { review: reviewText, reply: replyText })
      setResult(r.data)
    } catch { toast.error('Scoring failed') }
    setLoading(false)
  }

  const verdict_color = result ? (result.overall >= 8 ? 'var(--green)' : result.overall >= 6 ? 'var(--amber)' : 'var(--red)') : null

  return (
    <div className="space-y-5">
      <div className="card p-5 space-y-4">
        <div>
          <p className="font-semibold text-[var(--text)]">Reply Quality Scorer</p>
          <p className="text-xs text-[var(--muted)] mt-0.5">Benchmark your reply across 5 dimensions. Know the score before you publish.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <label className="label flex items-center justify-between">
                Customer Review
                <div className="flex items-center gap-2">
                  <select className="input text-[10px] py-0.5 px-2" value={selSession} onChange={e=>{setSelSession(e.target.value);setPicked(null)}}>
                    <option value="">Manual input</option>
                    {sessions.map(s=><option key={s.session_id} value={s.session_id}>{s.name}</option>)}
                  </select>
                </div>
              </label>
              {selSession && sessionReviews.length > 0 ? (
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {sessionReviews.slice(0,10).map((r,i) => (
                    <div key={i} onClick={() => { setPicked(i); setReviewText(r.text) }}
                      className={`p-2 rounded-lg border cursor-pointer text-xs transition-all ${picked===i?'border-[var(--brand)] bg-[var(--brand)]/5':'border-[var(--border)] hover:border-[var(--brand)]/30'}`}>
                      <span className={`text-[9px] font-medium mr-1 ${r.sentiment==='positive'?'text-[var(--green)]':r.sentiment==='negative'?'text-[var(--red)]':'text-[var(--amber)]'}`}>{r.sentiment}</span>
                      {r.text.slice(0,80)}...
                    </div>
                  ))}
                </div>
              ) : (
                <textarea className="input text-sm resize-none" rows={5}
                  placeholder="Paste the original customer review..."
                  value={reviewText} onChange={e => setReviewText(e.target.value)}/>
              )}
            </div>
          </div>

          <div>
            <label className="label">Your Reply to Score</label>
            <textarea className="input text-sm resize-none" rows={5}
              placeholder="Paste the reply you want scored..."
              value={replyText} onChange={e => setReplyText(e.target.value)}/>
            <div className="mt-2 space-y-1 text-[10px] text-[var(--muted)]">
              <p>💡 Best replies: empathetic opener + specific acknowledgment + clear resolution + friendly close</p>
            </div>
          </div>
        </div>

        <button onClick={score} disabled={loading} className="btn-primary text-sm flex items-center gap-2">
          {loading ? <RefreshCw size={14} className="animate-spin"/> : <BarChart2 size={14}/>}
          {loading ? 'Scoring...' : 'Score My Reply'}
        </button>
      </div>

      {result && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="card p-5 space-y-4">
            <div className="text-center pb-3 border-b border-[var(--border)]">
              <div className="text-6xl font-display font-bold" style={{color:verdict_color}}>{result.overall}</div>
              <div className="text-sm text-[var(--muted)] mt-1">out of 10</div>
              <div className="text-sm font-semibold mt-1" style={{color:verdict_color}}>
                {result.overall >= 8 ? '⭐ Excellent — ready to publish!' : result.overall >= 6 ? '👍 Good — minor improvements recommended' : '⚠️ Needs revision before publishing'}
              </div>
            </div>
            <div className="space-y-3">
              {[
                ['Empathy', result.empathy],
                ['Clarity', result.clarity],
                ['Professionalism', result.professionalism],
                ['Resolution Quality', result.resolution],
                ['Tone Match', result.tone_match],
              ].map(([l,v]) => <ScoreBar key={l} label={l} value={v||6}/>)}
            </div>
          </div>
          <div className="card p-5 space-y-4">
            <p className="font-semibold text-[var(--text)]">Verdict & Recommendations</p>
            <div className="p-4 rounded-xl border" style={{borderColor:`${verdict_color}40`, background:`${verdict_color}08`}}>
              <p className="text-sm text-[var(--text)] leading-relaxed">{result.verdict || 'Reply is adequate but could use more empathy and clearer resolution.'}</p>
            </div>
            <div className="space-y-2">
              {(result.overall||0) < 10 && [
                { check: (result.empathy||0) < 7,          text: 'Add a more empathetic opening that acknowledges feelings' },
                { check: (result.resolution||0) < 7,       text: 'Offer a concrete next step or resolution path' },
                { check: (result.clarity||0) < 7,          text: 'Use shorter sentences and clearer language' },
                { check: (result.professionalism||0) < 7,  text: 'Maintain a consistent professional tone throughout' },
                { check: (result.tone_match||0) < 7,       text: 'Match the tone to the sentiment of the review' },
              ].filter(r=>r.check).slice(0,3).map((rec,i) => (
                <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-[var(--bg)]">
                  <ChevronRight size={12} className="text-[var(--brand)] flex-shrink-0 mt-0.5"/>
                  <p className="text-xs text-[var(--text2)]">{rec.text}</p>
                </div>
              ))}
              {(result.overall||0) >= 8 && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[var(--green)]/5 border border-[var(--green)]/20">
                  <CheckCircle size={13} className="text-[var(--green)] flex-shrink-0"/>
                  <p className="text-xs text-[var(--text2)]">This reply meets professional standards — safe to publish</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SentimentAnalyzerPanel({ sessions }) {
  const [text, setText] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [selSession, setSelSession] = useState('')
  const [sessionReviews, setSessionReviews] = useState([])

  useEffect(() => {
    if (selSession) Sessions.get(selSession).then(r => setSessionReviews(r.data?.reviews||[])).catch(()=>{})
    else setSessionReviews([])
  }, [selSession])

  const analyze = async (reviewText = null) => {
    const t = reviewText || text
    if (!t.trim()) { toast.error('Enter a review to analyze'); return }
    setLoading(true); setResult(null)
    try {
      const r = await axios.post('/api/studio/analyze-review', { text: t })
      setResult(r.data)
    } catch { toast.error('Analysis failed') }
    setLoading(false)
  }

  const EMOTION_EMOJIS = { joy:'😊', anger:'😠', fear:'😨', sadness:'😢', surprise:'😲', disgust:'🤢', trust:'🤝', anticipation:'🤩' }
  const EMOTION_COLORS = { joy:'#facc15', anger:'#ef4444', fear:'#8b5cf6', sadness:'#60a5fa', surprise:'#f97316', disgust:'#84cc16', trust:'#10b981', anticipation:'#ec4899' }

  return (
    <div className="space-y-5">
      <div className="card p-5 space-y-4">
        <div>
          <p className="font-semibold text-[var(--text)]">Deep Review Analyzer</p>
          <p className="text-xs text-[var(--muted)] mt-0.5">Full analysis: sentiment, emotions, aspects, authenticity, helpfulness score — any single review</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <label className="label flex items-center justify-between">
                Review to Analyze
                <select className="input text-[10px] py-0.5 px-2" value={selSession} onChange={e=>setSelSession(e.target.value)}>
                  <option value="">Manual input</option>
                  {sessions.map(s=><option key={s.session_id} value={s.session_id}>{s.name}</option>)}
                </select>
              </label>
              <textarea className="input text-sm resize-none" rows={5}
                placeholder="Paste any customer review for deep analysis..."
                value={text} onChange={e => setText(e.target.value)}/>
            </div>
            <button onClick={() => analyze()} disabled={loading} className="btn-primary text-sm w-full flex items-center justify-center gap-2">
              {loading ? <RefreshCw size={14} className="animate-spin"/> : <Brain size={14}/>}
              {loading ? 'Analyzing...' : 'Deep Analyze Review'}
            </button>
          </div>

          {selSession && sessionReviews.length > 0 && (
            <div className="space-y-2 max-h-[240px] overflow-y-auto">
              <p className="text-xs font-semibold text-[var(--text)]">Click a review to analyze:</p>
              {sessionReviews.slice(0,12).map((r,i) => (
                <div key={i} onClick={() => { setText(r.text); analyze(r.text) }}
                  className="p-2.5 rounded-lg border border-[var(--border)] hover:border-[var(--brand)]/30 cursor-pointer text-xs text-[var(--text2)] transition-all hover:bg-[var(--card2)]">
                  <span className={`text-[9px] font-medium mr-1.5 ${r.sentiment==='positive'?'text-[var(--green)]':r.sentiment==='negative'?'text-[var(--red)]':'text-[var(--amber)]'}`}>{r.sentiment}</span>
                  {r.text.slice(0,90)}{r.text.length>90?'...':''}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {result && (
        <div className="space-y-4">
          {/* Sentiment headline */}
          <div className="grid grid-cols-3 gap-3">
            <div className="card p-4 text-center">
              <div className="text-3xl font-display font-bold" style={{color:result.sentiment==='positive'?'var(--green)':result.sentiment==='negative'?'var(--red)':'var(--amber)'}}>
                {result.sentiment==='positive'?'😊':result.sentiment==='negative'?'😠':'😐'}
              </div>
              <div className="text-xs text-[var(--muted)] mt-1 capitalize font-semibold">{result.sentiment}</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-3xl font-display font-bold" style={{color:'var(--brand)'}}>
                {result.score !== undefined ? (result.score * 100).toFixed(0) : '—'}%
              </div>
              <div className="text-xs text-[var(--muted)] mt-1">Confidence</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-3xl font-display font-bold" style={{color:result.authenticity?.label==='Authentic'?'var(--green)':'var(--amber)'}}>
                {result.authenticity?.label==='Authentic'?'✅':'⚠️'}
              </div>
              <div className="text-xs text-[var(--muted)] mt-1">{result.authenticity?.label || 'Unknown'}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Emotions */}
            {result.emotions && Object.keys(result.emotions).length > 0 && (
              <div className="card p-4 space-y-3">
                <p className="text-xs font-semibold text-[var(--text)]">Emotion Breakdown</p>
                <div className="space-y-2">
                  {Object.entries(result.emotions).sort((a,b)=>b[1]-a[1]).map(([emotion, score]) => (
                    <div key={emotion} className="flex items-center gap-2">
                      <span className="text-base w-5">{EMOTION_EMOJIS[emotion] || '•'}</span>
                      <span className="text-xs text-[var(--muted)] capitalize w-20">{emotion}</span>
                      <div className="flex-1 h-2 bg-[var(--border)] rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{width:`${Math.round(score*100)}%`, background:EMOTION_COLORS[emotion]||'var(--brand)'}}/>
                      </div>
                      <span className="text-[10px] font-mono text-[var(--muted)] w-7">{Math.round(score*100)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Aspects */}
            {result.aspects && Object.keys(result.aspects).length > 0 && (
              <div className="card p-4 space-y-3">
                <p className="text-xs font-semibold text-[var(--text)]">Aspect Scores</p>
                <div className="space-y-2">
                  {Object.entries(result.aspects).map(([aspect, val]) => {
                    const num = typeof val === 'object' ? (val.score || 0) : val
                    const c = num > 0 ? 'var(--green)' : num < 0 ? 'var(--red)' : 'var(--muted)'
                    return (
                      <div key={aspect} className="flex items-center justify-between">
                        <span className="text-xs text-[var(--text2)] capitalize">{aspect}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{width:`${Math.abs(num)*100}%`, background:c}}/>
                          </div>
                          <span className="text-[10px] font-mono w-12 text-right" style={{color:c}}>
                            {num > 0 ? '+' : ''}{(num * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Authenticity detail */}
          {result.authenticity && (
            <div className="card p-4 space-y-2">
              <p className="text-xs font-semibold text-[var(--text)]">Authenticity Analysis</p>
              <div className="flex items-center gap-3">
                <div className={`text-xs px-3 py-1.5 rounded-lg font-semibold text-white ${result.authenticity.label==='Authentic'?'bg-[var(--green)]':'bg-[var(--amber)]'}`}>
                  {result.authenticity.label}
                </div>
                <p className="text-xs text-[var(--muted)]">Confidence: {((result.authenticity.confidence||0.5)*100).toFixed(0)}%</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ABTestPanel({ tone, brandVoice }) {
  const [review, setReview] = useState('')
  const [variants, setVariants] = useState([])
  const [loading, setLoading] = useState(false)
  const [winner, setWinner] = useState(null)
  const [scores, setScores] = useState({})

  const VARIANT_TONES = [
    { id:'professional', label:'Professional 💼', color:'#0ea5e9' },
    { id:'friendly',     label:'Friendly 😊',     color:'#34d399' },
    { id:'empathetic',   label:'Empathetic 💙',   color:'#a78bfa' },
  ]

  const generate = async () => {
    if (!review.trim()) { toast.error('Enter a review to test'); return }
    setLoading(true); setVariants([]); setWinner(null); setScores({})
    try {
      const r = await axios.post('/api/studio/abtest', {
        review,
        brand_voice: brandVoice,
        tones: VARIANT_TONES.map(t => t.id)
      })
      const rawVariants = r.data.variants || []
      const winnerTone = r.data.winner_tone
      const vars = rawVariants.map(v => {
        const toneInfo = VARIANT_TONES.find(t => t.id === v.tone) || VARIANT_TONES[0]
        return { tone: v.tone, label: toneInfo.label, color: toneInfo.color, reply: v.reply }
      })
      setVariants(vars)
      const newScores = {}
      rawVariants.forEach(v => { newScores[v.tone] = v.overall || 7 })
      setScores(newScores)
      setWinner(winnerTone)
      toast.success('A/B test complete! All 3 variants scored — winner highlighted.')
    } catch { toast.error('A/B test failed') }
    setLoading(false)
  }

  return (
    <div className="space-y-5">
      <div className="card p-5 space-y-4">
        <div>
          <p className="font-semibold text-[var(--text)]">A/B Reply Tester</p>
          <p className="text-xs text-[var(--muted)] mt-0.5">Generates 3 reply variants (Professional / Friendly / Empathetic) and auto-scores them to find the winner</p>
        </div>

        <div className="space-y-3">
          <label className="label">Customer Review to Test</label>
          <textarea className="input text-sm resize-none" rows={4}
            placeholder="Paste any customer review — we'll generate 3 different reply styles and score them..."
            value={review} onChange={e => setReview(e.target.value)}/>
          <div className="flex gap-2">
            {['Great product, fast delivery!', 'Item broken, no response from support.', 'Average quality, expected better.'].map(s => (
              <button key={s} onClick={() => setReview(s)} className="text-[10px] px-2 py-1 bg-[var(--border)] rounded text-[var(--muted)] hover:text-[var(--text)] transition-all">{s.slice(0,28)}...</button>
            ))}
          </div>
          <button onClick={generate} disabled={loading || !review}
            className="btn-primary text-sm flex items-center gap-2">
            {loading ? <RefreshCw size={14} className="animate-spin"/> : <TrendingUp size={14}/>}
            {loading ? 'Running A/B Test...' : 'Run A/B Test — Generate 3 Variants'}
          </button>
        </div>
      </div>

      {variants.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-[var(--text)]">A/B Results</p>
            {winner && <span className="text-xs text-[var(--green)] font-medium flex items-center gap-1"><Award size={12}/>Winner: {VARIANT_TONES.find(t=>t.id===winner)?.label}</span>}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {variants.map((v, i) => (
              <div key={i} className={`card p-4 space-y-3 transition-all ${winner === v.tone ? 'ring-2 ring-[var(--green)]' : ''}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{background:v.color}}>{v.label}</span>
                    {winner === v.tone && <span className="text-[10px] text-[var(--green)] font-bold flex items-center gap-0.5"><Award size={10}/> WINNER</span>}
                  </div>
                  {scores[v.tone] && (
                    <span className="text-sm font-bold font-mono" style={{color:scores[v.tone]>=8?'var(--green)':scores[v.tone]>=6?'var(--amber)':'var(--red)'}}>
                      {scores[v.tone]}/10
                    </span>
                  )}
                </div>
                <p className="text-sm text-[var(--text)] leading-relaxed">{v.reply}</p>
                <CopyBtn text={v.reply}/>
                {scores[v.tone] && (
                  <div className="h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{width:`${scores[v.tone]*10}%`, background:v.color}}/>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main Component ───────────────────────────────────────────────
export default function ReviewStudio() {
  const [feature, setFeature] = useState('bulk')
  const [tone, setTone] = useState('professional')
  const [brandVoice, setBrandVoice] = useState('')
  const [sessions, setSessions] = useState([])

  useEffect(() => {
    Sessions.list({}).then(r => setSessions(r.data?.sessions || [])).catch(() => {})
  }, [])

  const ActivePanel = {
    bulk:      () => <BulkPanel sessions={sessions} tone={tone} brandVoice={brandVoice}/>,
    coach:     () => <CoachPanel tone={tone}/>,
    brand:     () => <BrandPanel brandVoice={brandVoice} setBrandVoice={setBrandVoice} tone={tone}/>,
    template:  () => <TemplatePanel tone={tone} brandVoice={brandVoice} sessions={sessions}/>,
    multilang: () => <MultiLangPanel tone={tone}/>,
    score:     () => <ScorePanel sessions={sessions}/>,
    sentiment: () => <SentimentAnalyzerPanel sessions={sessions}/>,
    abtest:    () => <ABTestPanel tone={tone} brandVoice={brandVoice}/>,
  }[feature] || (() => null)

  return (
    <div className="p-6 lg:p-8 space-y-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{background:'var(--grad)'}}>
          <Sparkles size={18} className="text-white"/>
        </div>
        <div>
          <h1 className="page-title">AI Review Studio</h1>
          <p className="text-sm text-[var(--text2)] mt-0.5">
            8-tool live AI workspace — every tool connects to your real sessions &amp; generates unique AI responses
            {sessions.length > 0 && <span className="ml-2 text-[var(--green)] text-xs">• {sessions.length} sessions loaded</span>}
          </p>
        </div>
      </div>

      {/* Feature tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        {FEATURES.map(({ id, icon: Icon, label, sub, color }) => (
          <button key={id} onClick={() => setFeature(id)}
            className={`p-3 rounded-xl border text-left transition-all ${feature===id?'border-transparent text-white':'border-[var(--border)] hover:border-[var(--brand)]/30 hover:bg-[var(--card2)]'}`}
            style={feature===id?{background:color}:{}}>
            <Icon size={15} className={`mb-1.5 ${feature===id?'text-white':'text-[var(--muted)]'}`}/>
            <p className={`text-[11px] font-semibold leading-tight ${feature===id?'text-white':'text-[var(--text2)]'}`}>{label}</p>
            <p className="text-[9px] mt-0.5 leading-tight hidden sm:block" style={{color: feature===id?'rgba(255,255,255,0.75)':'var(--dim)'}}>{sub}</p>
          </button>
        ))}
      </div>

      {/* Global tone bar */}
      <div className="card p-3 flex flex-wrap gap-3 items-center">
        <span className="text-xs text-[var(--muted)] font-medium">Global Tone:</span>
        <div className="flex gap-1.5 flex-wrap flex-1">
          {TONES.map(t => (
            <button key={t.id} onClick={() => setTone(t.id)} title={t.desc}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-all font-medium ${tone===t.id?'text-white border-transparent':'border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]'}`}
              style={tone===t.id?{background:t.color}:{}}>
              {t.label}
            </button>
          ))}
        </div>
        {brandVoice && (
          <span className="text-[10px] text-[var(--green)] flex items-center gap-1">
            <Shield size={10}/> Brand Voice Active
          </span>
        )}
      </div>

      {/* Active panel */}
      <ActivePanel/>
    </div>
  )
}
