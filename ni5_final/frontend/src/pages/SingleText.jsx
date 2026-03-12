import { useState } from 'react'
import { motion } from 'framer-motion'
import { Loader2, Sparkles, Copy, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { Analyze as AnalyzeAPI, AI } from '../utils/api'
import { SentBadge, ScoreBar, AuthBadge, PageHeader } from '../components/UI'

const EXAMPLES = [
  {label:'Positive ', text:'Absolutely fantastic product! I was skeptical at first but it exceeded all expectations. Build quality is premium, delivery was next-day, and the customer service team resolved my query instantly. Highly recommended!'},
  {label:'Negative ', text:'Complete waste of money. The item broke after just 2 days of normal use. Customer service was rude, refused to process my refund, and hung up the phone. Never buying from this company again.'},
  {label:'Mixed ',    text:'The product itself is decent quality for the price, but the delivery took 3 weeks instead of the promised 3-5 days. Packaging was also damaged. Would consider buying again if they fix their logistics.'},
  {label:'Arabic ',   text:'منتج رائع جداً! الجودة ممتازة والتوصيل كان سريعاً. أنصح به بشدة لكل من يبحث عن قيمة مقابل المال.'},
]

export default function SingleText() {
  const [text, setText]     = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoad]  = useState(false)
  const [aiResp, setAiResp] = useState('')
  const [aiLoad, setAiLoad] = useState(false)
  const [copied, setCopied] = useState(false)

  const analyze = async () => {
    if (!text.trim()) { toast.error('Enter some text'); return }
    setLoad(true); setResult(null); setAiResp('')
    try {
      const r = await AnalyzeAPI.text(text.trim())
      setResult(r.data.analysis)
    } catch { toast.error('Analysis failed') }
    finally { setLoad(false) }
  }

  const genAiResponse = async () => {
    if (!result) return
    setAiLoad(true)
    try {
      const r = await AI.genResp(result.text, result.sentiment)
      setAiResp(r.data.response)
    } catch { toast.error('Failed to generate response') }
    finally { setAiLoad(false) }
  }

  const copyResp = () => { navigator.clipboard.writeText(aiResp); setCopied(true); setTimeout(()=>setCopied(false),2e3) }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <PageHeader title="Single Text Analyzer" subtitle="Deep real-time analysis of any review, comment, or feedback"/>
      <div className="max-w-2xl space-y-4">
        <div className="card p-5 space-y-4">
          <div>
            <label className="label">Review / Comment Text</label>
            <textarea className="input min-h-32 resize-y" placeholder="Paste any review, feedback, or comment here…"
              value={text} onChange={e=>setText(e.target.value)}
              onKeyDown={e=>e.ctrlKey&&e.key==='Enter'&&analyze()}/>
            <p className="text-xs text-[var(--muted)] mt-1">Ctrl+Enter to analyze</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-[var(--muted)] self-center">Examples:</span>
            {EXAMPLES.map(ex=>(
              <button key={ex.label} onClick={()=>{setText(ex.text);setResult(null);setAiResp('')}}
                className="text-xs px-2.5 py-1 rounded-lg bg-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] transition-all">
                {ex.label}
              </button>
            ))}
          </div>
          <button onClick={analyze} disabled={loading||!text.trim()} className="btn-primary disabled:opacity-50">
            {loading?<><Loader2 size={14} className="animate-spin"/>Analyzing…</>:<><Sparkles size={14}/>Deep Analyze</>}
          </button>
        </div>

        {result && (
          <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} className="space-y-4">
            {/* Header badges */}
            <div className="card p-5 space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <SentBadge s={result.sentiment}/>
                <AuthBadge label={result.authenticity_label||'genuine'}/>
                {result.language && result.language!=='en' && (
                  <span className="badge badge-blue"> {result.language}</span>
                )}
                {result.spam_score>0.5 && <span className="badge badge-amb">️ Spam risk</span>}
              </div>
              {result.translated_text && (
                <div className="p-3 bg-[var(--card2)] rounded-xl border border-[var(--border2)]">
                  <p className="text-xs text-[var(--muted)] mb-1">Auto-translated:</p>
                  <p className="text-sm text-[var(--text)] italic">{result.translated_text}</p>
                </div>
              )}
              <ScoreBar value={result.score||0} showLabel height="h-2"/>

              {/* Score grid */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  ['Positive',`${(result.positive_prob*100).toFixed(1)}%`,'var(--green)'],
                  ['Negative',`${(result.negative_prob*100).toFixed(1)}%`,'var(--red)'],
                  ['Neutral', `${(result.neutral_prob*100).toFixed(1)}%`, 'var(--brand)'],
                ].map(([l,v,c])=>(
                  <div key={l} className="card2 p-3 text-center">
                    <p className="text-lg font-display font-bold" style={{color:c}}>{v}</p>
                    <p className="text-xs text-[var(--muted)]">{l}</p>
                  </div>
                ))}
              </div>

              {/* Metrics grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  ['Confidence',`${(result.confidence*100).toFixed(0)}%`,'var(--text)'],
                  ['Helpfulness',result.helpfulness_label,result.helpfulness_score>0.65?'var(--green)':result.helpfulness_score>0.35?'var(--amber)':'var(--red)'],
                  ['Subjectivity',`${(result.subjectivity*100).toFixed(0)}%`,'var(--text)'],
                  ['VADER Score',result.vader_compound?.toFixed(4),'var(--text)'],
                  ['Auth Score',`${(result.authenticity_score*100).toFixed(0)}%`,result.authenticity_score>0.7?'var(--green)':'var(--red)'],
                  ['Spam Risk',result.spam_score>0.5?' High':result.spam_score>0.25?' Med':' Low','var(--text)'],
                ].map(([l,v,c])=>(
                  <div key={l} className="card2 p-3">
                    <p className="label">{l}</p>
                    <p className="text-sm font-medium font-mono" style={{color:c}}>{v}</p>
                  </div>
                ))}
              </div>

              {/* Emotions */}
              {Object.keys(result.emotions||{}).length>0 && (
                <div>
                  <p className="label">Detected Emotions</p>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(result.emotions).map(([e,v])=>(
                      <span key={e} className="badge badge-blue capitalize">{e} {(v*100).toFixed(0)}%</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Topics */}
              {result.topics?.length>0 && (
                <div>
                  <p className="label">Topics</p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.topics.map(tp=><span key={tp} className="badge badge-neu">{tp}</span>)}
                  </div>
                </div>
              )}

              {/* Keywords */}
              {result.keywords?.length>0 && (
                <div>
                  <p className="label">Keywords</p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.keywords.slice(0,12).map(k=>(
                      <span key={k.word} className="text-xs px-2 py-0.5 rounded-lg bg-[var(--border)] text-[var(--text2)] font-mono">{k.word}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Hash */}
              <div className="pt-3 border-t border-[var(--border)]">
                <p className="label">SHA-256 Integrity Hash</p>
                <p className="text-xs font-mono text-[var(--muted)] break-all">{result.hash_value}</p>
              </div>
            </div>

            {/* AI Response Generator */}
            <div className="card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <p className="section-title flex items-center gap-2"><Sparkles size={14} className="text-[var(--brand)]"/>AI Response Generator</p>
                <button onClick={genAiResponse} disabled={aiLoad} className="btn-secondary text-xs">
                  {aiLoad?<Loader2 size={12} className="animate-spin"/>:'Generate Response'}
                </button>
              </div>
              {result.response_suggestion && !aiResp && (
                <div>
                  <p className="label">Template Response</p>
                  <p className="text-sm text-[var(--text2)] leading-relaxed bg-[var(--card2)] p-3 rounded-xl border border-[var(--border2)]">{result.response_suggestion}</p>
                </div>
              )}
              {aiResp && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="label">AI-Generated Response</p>
                    <button onClick={copyResp} className="btn-ghost text-xs">
                      {copied?<><Check size={11}/>Copied</>:<><Copy size={11}/>Copy</>}
                    </button>
                  </div>
                  <p className="text-sm text-[var(--text)] leading-relaxed bg-[var(--brand)]/5 p-3 rounded-xl border border-[var(--brand)]/15">{aiResp}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
