import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Loader2, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { Auth } from '../utils/api'
import { useApp } from '../contexts/AppContext'
import { t } from '../i18n'

export default function Register() {
  const { login, language } = useApp()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username:'', email:'', password:'' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    setError('')
    if (!form.username||!form.email||!form.password) { setError('All fields required'); return }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return }
    setLoading(true)
    try {
      const r = await Auth.register(form.username, form.email, form.password)
      login(r.data.token, r.data)
      toast.success('Account created!')
      navigate('/')
    } catch(e) {
      setError(e.response?.data?.detail || 'Registration failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen auth-bg flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full opacity-20"
          style={{background:'radial-gradient(circle, var(--brand) 0%, transparent 70%)'}} />
      </div>
      <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className="w-full max-w-sm relative">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--brand3)] to-[var(--brand)] flex items-center justify-center mx-auto mb-4 shadow-xl" style={{boxShadow:'0 0 32px var(--glow)'}}>
            <span className="text-white font-display font-bold text-2xl">N</span>
          </div>
          <h1 className="text-2xl font-display font-bold text-[var(--text)]">{t(language,'reg.title')}</h1>
          <p className="text-sm text-[var(--text2)] mt-1">{t(language,'reg.sub')}</p>
        </div>
        <div className="card p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-[var(--red)]/10 border border-[var(--red)]/20 rounded-xl text-sm text-[var(--red)]">
              <AlertCircle size={14} className="flex-shrink-0"/>{error}
            </div>
          )}
          {[
            {key:'username',label:t(language,'reg.user'),  type:'text',    ph:'johndoe'},
            {key:'email',   label:t(language,'reg.email'), type:'email',   ph:'you@email.com'},
            {key:'password',label:t(language,'reg.pass'),  type:'password',ph:'••••••••'},
          ].map(f=>(
            <div key={f.key}>
              <label className="label">{f.label}</label>
              <input className="input" type={f.type} placeholder={f.ph}
                value={form[f.key]} onChange={e=>setForm(x=>({...x,[f.key]:e.target.value}))}
                onKeyDown={e=>e.key==='Enter'&&submit()} />
            </div>
          ))}
          <button onClick={submit} disabled={loading} className="btn-primary w-full justify-center py-2.5">
            {loading?<Loader2 size={14} className="animate-spin"/>:t(language,'reg.btn')}
          </button>
        </div>
        <p className="text-center text-sm text-[var(--muted)] mt-4">
          {t(language,'reg.hasAcc')}{' '}
          <Link to="/login" className="text-[var(--brand)] hover:underline font-medium">{t(language,'reg.login')}</Link>
        </p>
      </motion.div>
    </div>
  )
}
