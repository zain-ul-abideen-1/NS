import { useState } from 'react'
import { Shield, Check, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { Verify } from '../utils/api'
import { PageHeader } from '../components/UI'

export default function HashVerify() {
  const [text, setText] = useState('')
  const [hash, setHash] = useState('')
  const [result, setResult] = useState(null)

  const verify = async () => {
    if (!text.trim()) { toast.error('Enter text'); return }
    const r = await Verify.hash(text.trim(), hash.trim()).catch(()=>null)
    if (r) setResult(r.data)
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <PageHeader title="Hash Verification" subtitle="Verify SHA-256 integrity of any review text"/>
      <div className="max-w-2xl space-y-4">
        <div className="card p-5 space-y-4">
          <div>
            <label className="label">Review Text</label>
            <textarea className="input min-h-28 resize-y" placeholder="Paste the review text to verify…"
              value={text} onChange={e=>{setText(e.target.value);setResult(null)}}/>
          </div>
          <div>
            <label className="label">Expected Hash (optional)</label>
            <input className="input font-mono text-xs" placeholder="SHA-256 hash to compare against…"
              value={hash} onChange={e=>{setHash(e.target.value);setResult(null)}}/>
          </div>
          <button onClick={verify} disabled={!text.trim()} className="btn-primary disabled:opacity-50">
            <Shield size={14}/>Compute & Verify
          </button>
        </div>

        {result && (
          <div className="card p-5 space-y-3">
            <div>
              <p className="label">SHA-256 Hash</p>
              <p className="text-xs font-mono text-[var(--brand)] break-all bg-[var(--card2)] p-3 rounded-xl border border-[var(--border2)]">{result.computed}</p>
            </div>
            {hash && (
              <div className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-medium ${
                result.match ? 'bg-[var(--green)]/8 border-[var(--green)]/20 text-[var(--green)]' : 'bg-[var(--red)]/8 border-[var(--red)]/20 text-[var(--red)]'
              }`}>
                {result.match?<Check size={16}/>:<X size={16}/>}
                {result.match ? ' Hash matches — text is unmodified' : ' Hash mismatch — text may have been altered'}
              </div>
            )}
          </div>
        )}

        <div className="card p-4 text-xs text-[var(--muted)] space-y-1">
          <p className="font-medium text-[var(--text)]">About Hash Verification</p>
          <p>Every review analyzed by NestInsights is assigned a SHA-256 cryptographic hash. If you need to prove that a review has not been tampered with since analysis, paste the original text and the stored hash — they must match exactly.</p>
        </div>
      </div>
    </div>
  )
}
