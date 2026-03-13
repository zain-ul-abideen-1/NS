import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { applyLanguage, initTranslation } from '../i18n'

const Ctx = createContext(null)

export function AppProvider({ children }) {
  const [user,    setUser]     = useState(null)
  const [token,   setToken]    = useState(() => localStorage.getItem('ni5_token') || '')
  const [theme,   setThemeRaw] = useState(() => localStorage.getItem('ni5_theme') || 'dark')
  const [lang,    setLangRaw]  = useState(() => localStorage.getItem('ni5_lang')  || 'en')
  const [loading, setLoading]  = useState(true)
  const [alerts,  setAlerts]   = useState([])

  // Bootstrap Google Translate on app start
  useEffect(() => { initTranslation() }, [])

  // Apply theme class
  useEffect(() => {
    const html = document.documentElement
    if (theme === 'light') { html.classList.add('light');  html.classList.remove('dark') }
    else                   { html.classList.add('dark');   html.classList.remove('light') }
  }, [theme])

  // Apply RTL direction for Urdu/Arabic on mount/change (no translation trigger)
  useEffect(() => {
    document.documentElement.dir = (lang === 'ur' || lang === 'ar') ? 'rtl' : 'ltr'
    document.documentElement.lang = lang
  }, [lang])

  // Axios auth header
  useEffect(() => {
    if (token) axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    else delete axios.defaults.headers.common['Authorization']
  }, [token])

  // Restore session
  useEffect(() => {
    if (!token) { setLoading(false); return }
    axios.get('/api/auth/me')
      .then(r => {
        setUser(r.data)
        if (r.data.theme)    applyTheme(r.data.theme)
        if (r.data.language) applyLang(r.data.language)
      })
      .catch(() => {
        localStorage.removeItem('ni5_token')
        setToken('')
      })
      .finally(() => setLoading(false))
  }, [])

  const applyTheme = (t) => {
    setThemeRaw(t)
    localStorage.setItem('ni5_theme', t)
  }
  const applyLang = (l) => {
    setLangRaw(l)
    localStorage.setItem('ni5_lang', l)
  }

  const login = useCallback((tokenVal, userData) => {
    localStorage.setItem('ni5_token', tokenVal)
    setToken(tokenVal)
    setUser(userData)
    if (userData.theme)    applyTheme(userData.theme)
    if (userData.language) applyLang(userData.language)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('ni5_token')
    setToken('')
    setUser(null)
  }, [])

  const setTheme = useCallback((t) => {
    applyTheme(t)
    axios.put('/api/auth/profile', { theme: t }).catch(() => {})
  }, [])

  const setLanguage = useCallback((l) => {
    applyLang(l)
    applyLanguage(l)   // trigger Google Translate — only on explicit user click
    axios.put('/api/auth/profile', { language: l }).catch(() => {})
  }, [])

  return (
    <Ctx.Provider value={{
      user, token, theme, language: lang, loading, alerts,
      login, logout, setTheme, setLanguage, setUser,
    }}>
      {children}
    </Ctx.Provider>
  )
}

export const useApp = () => useContext(Ctx)