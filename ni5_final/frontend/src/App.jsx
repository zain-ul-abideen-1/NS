import { Routes, Route, Navigate } from 'react-router-dom'
import { useApp } from './contexts/AppContext'
import Layout from './components/Layout'

import Landing   from './pages/Landing'
import Login     from './pages/Login'
import Register  from './pages/Register'

import Dashboard        from './pages/Dashboard'
import Analyze          from './pages/Analyze'
import SingleText       from './pages/SingleText'
import History          from './pages/History'
import SessionDetail    from './pages/SessionDetail'
import Compare          from './pages/Compare'
import Trends           from './pages/Trends'
import Tickets          from './pages/Tickets'
import TicketDetail     from './pages/TicketDetail'
import HashVerify       from './pages/HashVerify'
import Watchlist        from './pages/Watchlist'
import Profile          from './pages/Profile'
import DatabaseAdmin    from './pages/DatabaseAdmin'
import Insights         from './pages/Insights'
import ReviewStudio     from './pages/ReviewStudio'
import BIHub            from './pages/BIHub'
import GlobalIntelligence from './pages/GlobalIntelligence'
import BrandHealth      from './pages/BrandHealth'
import Benchmark        from './pages/Benchmark'
import Workflow         from './pages/Workflow'

/* ─── Guards ──────────────────────────────────────────────────────── */

function AdminGuard({ children }) {
  const { token, user, loading } = useApp()
  if (loading) return null
  if (!token) return <Navigate to="/login" replace />
  if (user?.role !== 'admin') return <Navigate to="/dashboard" replace />
  return children
}

function AuthGuard({ children }) {
  const { token, loading } = useApp()
  if (loading) return (
    <div style={{ height:'100vh', background:'var(--bg)', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:40, height:40, borderRadius:12, background:'var(--grad-brand)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px' }}>
          <span style={{ color:'#fff', fontFamily:'Syne,sans-serif', fontWeight:700 }}>N</span>
        </div>
        <p style={{ fontSize:13, color:'var(--muted)' }}>Loading…</p>
      </div>
    </div>
  )
  if (!token) return <Navigate to="/login" replace />
  return children
}

// Guests only — logged-in users redirect straight to dashboard
function GuestGuard({ children }) {
  const { token, loading } = useApp()
  if (loading) return null
  if (token) return <Navigate to="/dashboard" replace />
  return children
}

/* ─── App ─────────────────────────────────────────────────────────── */

export default function App() {
  return (
    <Routes>

      {/* Landing — guests only */}
      <Route path="/" element={<GuestGuard><Landing /></GuestGuard>} />

      {/* Auth pages — guests only */}
      <Route path="/login"    element={<GuestGuard><Login /></GuestGuard>} />
      <Route path="/register" element={<GuestGuard><Register /></GuestGuard>} />

      {/* Protected shell — ALL internal nav links live here as children.
          Paths are relative (no leading /) so /dashboard, /analyze etc. work
          exactly as the sidebar NavLinks already reference them.             */}
      <Route path="/" element={<AuthGuard><Layout /></AuthGuard>}>
        <Route path="dashboard"    element={<Dashboard />} />
        <Route path="analyze"      element={<Analyze />} />
        <Route path="text"         element={<SingleText />} />
        <Route path="history"      element={<History />} />
        <Route path="history/:id"  element={<SessionDetail />} />
        <Route path="compare"      element={<Compare />} />
        <Route path="trends"       element={<Trends />} />
        <Route path="tickets"      element={<Tickets />} />
        <Route path="tickets/:id"  element={<TicketDetail />} />
        <Route path="verify"       element={<HashVerify />} />
        <Route path="watchlist"    element={<Watchlist />} />
        <Route path="profile"      element={<Profile />} />
        <Route path="database"     element={<DatabaseAdmin />} />
        <Route path="insights/:id" element={<Insights />} />
        <Route path="studio"       element={<ReviewStudio />} />
        <Route path="bi"           element={<BIHub />} />
        <Route path="global"       element={<GlobalIntelligence />} />
        <Route path="brand-health" element={<BrandHealth />} />
        <Route path="benchmark"    element={<Benchmark />} />
        <Route path="workflow"     element={<AdminGuard><Workflow /></AdminGuard>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}