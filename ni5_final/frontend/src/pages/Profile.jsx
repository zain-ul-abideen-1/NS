import { useState } from 'react'
import { Sun, Moon, Save, User, Building2, FileText, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { Auth } from '../utils/api'
import { useApp } from '../contexts/AppContext'
import { LANGS, t } from '../i18n'
import { PageHeader } from '../components/UI'

export default function Profile() {
  const { user, setUser, theme, setTheme, language, setLanguage } = useApp()
  const [form, setForm] = useState({ company: user?.company||'', bio: user?.bio||'' })
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    try {
      await Auth.profile(form)
      setUser(u=>({...u,...form}))
      toast.success('Profile saved!')
    } catch { toast.error('Save failed') }
    finally { setSaving(false) }
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <PageHeader title="Profile & Settings" subtitle="Manage your account and preferences"/>
      <div className="max-w-2xl space-y-5">

        {/* User info */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--brand)] to-[var(--red)] flex items-center justify-center text-2xl font-display font-bold text-white shadow-lg">
              {user?.username?.[0]?.toUpperCase()}
            </div>
            <div>
              <p className="font-display font-bold text-lg text-[var(--text)]">{user?.username}</p>
              <p className="text-sm text-[var(--text2)]">{user?.email}</p>
              <span className="badge badge-blue text-xs mt-1">{user?.role}</span>
            </div>
          </div>
          <div className="divider"/>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label flex items-center gap-1"><Building2 size={11}/>Company</label>
              <input className="input" placeholder="Your organization…" value={form.company} onChange={e=>setForm(f=>({...f,company:e.target.value}))}/>
            </div>
            <div>
              <label className="label flex items-center gap-1"><FileText size={11}/>Bio</label>
              <input className="input" placeholder="Short bio…" value={form.bio} onChange={e=>setForm(f=>({...f,bio:e.target.value}))}/>
            </div>
          </div>
          <button onClick={save} disabled={saving} className="btn-primary">
            {saving?<Loader2 size={13} className="animate-spin"/>:<Save size={13}/>}
            {saving?'Saving…':'Save Profile'}
          </button>
        </div>

        {/* Theme */}
        <div className="card p-5 space-y-3">
          <p className="section-title">Appearance</p>
          <div className="flex gap-3">
            {[['dark','Dark Mode',Moon,'var(--brand)'],['light','Light Mode',Sun,'var(--amber)']].map(([val,label,Icon,c])=>(
              <button key={val} onClick={()=>setTheme(val)}
                className={`flex-1 flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                  theme===val ? 'border-[var(--brand)] bg-[var(--brand)]/8' : 'border-[var(--border)] hover:border-[var(--border2)]'
                }`}>
                <Icon size={18} style={{color:c}}/>
                <div className="text-left">
                  <p className="text-sm font-medium text-[var(--text)]">{label}</p>
                  <p className="text-xs text-[var(--muted)]">{val==='dark'?'Easy on eyes':'Bright & clear'}</p>
                </div>
                {theme===val && <div className="ml-auto w-2 h-2 rounded-full bg-[var(--brand)]"/>}
              </button>
            ))}
          </div>
        </div>

        {/* Language */}
        <div className="card p-5 space-y-3">
          <p className="section-title">Language / زبان / Sprache / ਭਾਸ਼ਾ</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {LANGS.map(l=>(
              <button key={l.code} onClick={()=>setLanguage(l.code)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  language===l.code ? 'border-[var(--brand)] bg-[var(--brand)]/8' : 'border-[var(--border)] hover:border-[var(--border2)]'
                }`}>
                <span className="text-2xl">{l.flag}</span>
                <span className="text-xs font-medium text-[var(--text)]">{l.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="card p-5 space-y-3">
          <p className="section-title">Account Info</p>
          <div className="grid grid-cols-2 gap-3 text-xs">
            {[
              ['Member since', new Date(user?.created_at||Date.now()).toLocaleDateString()],
              ['Last login',   user?.last_login ? new Date(user.last_login).toLocaleDateString() : 'Now'],
              ['Role',         user?.role || 'user'],
              ['Language',     language],
            ].map(([l,v])=>(
              <div key={l} className="card2 p-3">
                <p className="label">{l}</p>
                <p className="text-sm font-medium text-[var(--text)]">{v}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
