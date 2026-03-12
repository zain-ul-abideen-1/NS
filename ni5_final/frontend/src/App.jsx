import { Routes, Route, Navigate } from 'react-router-dom'
import { useApp } from './contexts/AppContext'
import Layout from './components/Layout'

import Login    from './pages/Login'
import Register from './pages/Register'

import Dashboard     from './pages/Dashboard'
import Analyze       from './pages/Analyze'
import SingleText    from './pages/SingleText'
import History       from './pages/History'
import SessionDetail from './pages/SessionDetail'
import Compare       from './pages/Compare'
import Trends        from './pages/Trends'
import Tickets       from './pages/Tickets'
import TicketDetail  from './pages/TicketDetail'
import HashVerify    from './pages/HashVerify'
import Watchlist     from './pages/Watchlist'
import Profile       from './pages/Profile'
import DatabaseAdmin from './pages/DatabaseAdmin'
import Insights     from './pages/Insights'
import ReviewStudio       from './pages/ReviewStudio'
import BIHub              from './pages/BIHub'
import GlobalIntelligence from './pages/GlobalIntelligence'
import BrandHealth from './pages/BrandHealth'
import Benchmark from './pages/Benchmark'

function Guard({ children }) {
  const { token, loading } = useApp()
  if (loading) return (
    <div className="h-screen bg-[var(--bg)] flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center mx-auto"
          style={{ background:'var(--grad-brand)' }}>
          <span className="text-white font-display font-bold">N</span>
        </div>
        <p className="text-sm text-[var(--muted)]">Loading...</p>
      </div>
    </div>
  )
  if (!token) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login"    element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<Guard><Layout /></Guard>}>
        <Route index                  element={<Dashboard />} />
        <Route path="analyze"         element={<Analyze />} />
        <Route path="text"            element={<SingleText />} />
        <Route path="history"         element={<History />} />
        <Route path="history/:id"     element={<SessionDetail />} />
        <Route path="compare"         element={<Compare />} />
        <Route path="trends"          element={<Trends />} />
        <Route path="tickets"         element={<Tickets />} />
        <Route path="tickets/:id"     element={<TicketDetail />} />
        <Route path="verify"          element={<HashVerify />} />
        <Route path="watchlist"       element={<Watchlist />} />
        <Route path="profile"         element={<Profile />} />
        <Route path="database"        element={<DatabaseAdmin />} />
        <Route path="insights/:id"    element={<Insights />} />
        <Route path="studio"            element={<ReviewStudio />} />
        <Route path="bi"                element={<BIHub />} />
        <Route path="global"            element={<GlobalIntelligence />} />
        <Route path="*"               element={<Navigate to="/" />} />
      </Route>
    </Routes>
  )
}
