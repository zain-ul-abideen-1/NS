import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { Auth } from '../utils/api'
import { useApp } from '../contexts/AppContext'
import { t } from '../i18n'

export default function Login() {
  const { login, language } = useApp()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username:'', password:'' })
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    setError('')
    if (!form.username || !form.password) { setError('Please fill in all fields'); return }
    setLoading(true)
    try {
      const r = await Auth.login(form.username, form.password)
      login(r.data.token, r.data)
      toast.success(`Welcome back, ${r.data.username}!`)
      navigate('/')
    } catch(e) {
      setError(e.response?.data?.detail || 'Invalid username or password')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen auth-bg flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full opacity-20"
          style={{background:'radial-gradient(circle, var(--brand) 0%, transparent 70%)'}} />
      </div>
      <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:.4}}
        className="w-full max-w-sm relative">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--brand3)] to-[var(--brand)] flex items-center justify-center mx-auto mb-4 shadow-xl" style={{boxShadow:'0 0 32px var(--glow)'}}>
            <span className="text-white font-display font-bold text-2xl">N</span>
          </div>
          <h1 className="text-2xl font-display font-bold text-[var(--text)]">{t(language,'login.title')}</h1>
          <p className="text-sm text-[var(--text2)] mt-1">{t(language,'login.sub')}</p>
        </div>

        <div className="card p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-[var(--red)]/10 border border-[var(--red)]/20 rounded-xl text-sm text-[var(--red)]">
              <AlertCircle size={14} className="flex-shrink-0" />{error}
            </div>
          )}
          <div>
            <label className="label">{t(language,'login.user')}</label>
            <input className="input" placeholder="admin" value={form.username}
              onChange={e=>setForm(f=>({...f,username:e.target.value}))}
              onKeyDown={e=>e.key==='Enter'&&submit()} />
          </div>
          <div>
            <label className="label">{t(language,'login.pass')}</label>
            <div className="relative">
              <input className="input pr-10" type={show?'text':'password'} placeholder="••••••••"
                value={form.password}
                onChange={e=>setForm(f=>({...f,password:e.target.value}))}
                onKeyDown={e=>e.key==='Enter'&&submit()} />
              <button type="button" onClick={()=>setShow(s=>!s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--text)]">
                {show?<EyeOff size={15}/>:<Eye size={15}/>}
              </button>
            </div>
          </div>
          <button onClick={submit} disabled={loading} className="btn-primary w-full justify-center py-2.5">
            {loading?<><Loader2 size={14} className="animate-spin"/>{t(language,'common.loading')}</>:t(language,'login.btn')}
          </button>
        </div>

        <p className="text-center text-sm text-[var(--muted)] mt-4">
          {t(language,'login.noAcc')}{' '}
          <Link to="/register" className="text-[var(--brand)] hover:underline font-medium">{t(language,'login.reg')}</Link>
        </p>
        <p className="text-center text-xs text-[var(--dim)] mt-3 font-mono">Default: admin / admin123</p>
      </motion.div>
    </div>
  )
}
