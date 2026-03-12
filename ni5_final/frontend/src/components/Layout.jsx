import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Search, Type, Clock, GitCompare, TrendingUp,
  Ticket, Shield, User, LogOut, Sun, Moon, ChevronLeft, ChevronRight,
  Menu, Eye, Database, Sparkles, BarChart2, Wrench, Globe2
} from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { LANGS } from '../i18n'
import ToolsPanel from './ToolsPanel'

export default function Layout() {
  const { user, logout, theme, setTheme, language, setLanguage } = useApp()
  const [collapsed,   setCollapsed]   = useState(false)
  const [mobileOpen,  setMobileOpen]  = useState(false)
  const [toolsOpen,   setToolsOpen]   = useState(false)
  const navigate = useNavigate()

  const NAV_TOP = [
    { to:'/',          icon:LayoutDashboard, label:'Dashboard'   },
    { to:'/analyze',   icon:Search,          label:'Analyze'     },
    { to:'/text',      icon:Type,            label:'Single Text' },
  ]
  const NAV_MID = [
    { to:'/history',   icon:Clock,      label:'History'   },
    { to:'/compare',   icon:GitCompare, label:'Compare'   },
    { to:'/trends',    icon:TrendingUp, label:'Trends'    },
  ]
  const NAV_BOT = [
    { to:'/tickets',   icon:Ticket,    label:'Tickets'     },
    { to:'/watchlist', icon:Eye,       label:'Watchlist'   },
    { to:'/verify',    icon:Shield,    label:'Hash Verify' },
    { to:'/profile',   icon:User,      label:'Profile'     },
  ]
  const NAV_FEATURES = [
    { to:'/studio',  icon:Sparkles,  label:'Review Studio'        },
    { to:'/bi',      icon:BarChart2, label:'BI Hub'               },
    { to:'/global',  icon:Globe2,    label:'Global Intelligence'  },
  ]
  const NAV_ADMIN = user?.role === 'admin' ? [
    { to:'/database',  icon:Database, label:'Database'  },
  ] : []

  function NavItem({ to, icon:Icon, label }) {
    return (
      <NavLink to={to} end={to === '/'}
        onClick={() => setMobileOpen(false)}
        title={collapsed ? label : ''}
        className={({ isActive }) =>
          `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${collapsed ? 'justify-center' : ''} ${
            isActive
              ? 'text-white font-medium shadow-sm'
              : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--border)]'
          }`
        }
        style={({ isActive }) => isActive ? { background:'var(--grad-brand)' } : {}}>
        <Icon size={15} className="flex-shrink-0" />
        {!collapsed && <span className="truncate">{label}</span>}
      </NavLink>
    )
  }

  function Divider() {
    return <div className="h-px bg-[var(--border)] mx-2 my-1" />
  }

  function SidebarContent() {
    return (
      <div className="flex flex-col h-full select-none">
        {/* Logo */}
        <div className={`flex items-center gap-2.5 px-4 py-5 border-b border-[var(--border)] ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg"
            style={{ background:'var(--grad-brand)', boxShadow:'0 0 14px var(--glow)' }}>
            <span className="text-white font-display font-bold text-sm">N</span>
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="font-display font-bold text-[var(--text)] text-sm leading-none">NestInsights</p>
              <p className="text-[10px] text-[var(--muted)] mt-0.5 font-mono">v5.0</p>
            </div>
          )}
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
          {NAV_TOP.map(item => <NavItem key={item.to} {...item} />)}
          <Divider />
          {NAV_MID.map(item => <NavItem key={item.to} {...item} />)}
          <Divider />
          {NAV_BOT.map(item => <NavItem key={item.to} {...item} />)}
          <Divider />
          {!collapsed && (
            <p className="px-3 pt-1 text-[10px] text-[var(--dim)] uppercase tracking-widest font-semibold">AI Features</p>
          )}
          {NAV_FEATURES.map(item => <NavItem key={item.to} {...item} />)}
          {NAV_ADMIN.length > 0 && (
            <>
              <Divider />
              {!collapsed && (
                <p className="px-3 pt-1 text-[10px] text-[var(--dim)] uppercase tracking-widest font-semibold">Admin</p>
              )}
              {NAV_ADMIN.map(item => <NavItem key={item.to} {...item} />)}
            </>
          )}
        </nav>

        {/* Bottom controls */}
        <div className="px-2 py-3 space-y-1 border-t border-[var(--border)]">
          {/* Language */}
          {!collapsed && (
            <div className="flex gap-1 flex-wrap px-1 mb-2">
              {LANGS.map(l => (
                <button key={l.code} onClick={() => setLanguage(l.code)} title={l.name}
                  className={`text-[10px] px-1.5 py-0.5 rounded font-mono transition-all ${
                    language === l.code
                      ? 'text-white'
                      : 'bg-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]'
                  }`} style={language === l.code ? { background:'var(--grad-brand)' } : {}}>
                  {l.label}
                </button>
              ))}
            </div>
          )}

          {/* Tools Panel trigger */}
          <button onClick={() => setToolsOpen(t => !t)}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${collapsed ? 'justify-center' : ''} ${toolsOpen ? 'text-white' : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--border)]'}`}
            style={toolsOpen?{background:'var(--grad)'}:{}}>
            <Wrench size={14}/>
            {!collapsed && <span>Company Tools</span>}
          </button>

          {/* Theme */}
          <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--border)] transition-all ${collapsed ? 'justify-center' : ''}`}>
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
            {!collapsed && <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>

          {/* User */}
          {user && (
            <div className={`flex items-center gap-2 px-2 py-1.5 rounded-lg ${collapsed ? 'justify-center' : ''}`}>
              {!collapsed && (
                <>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ background:'var(--grad-brand)' }}>
                    {user.username?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[var(--text)] truncate">{user.username}</p>
                    <p className="text-[10px] text-[var(--muted)] truncate capitalize">{user.role}</p>
                  </div>
                </>
              )}
              <button
                onClick={() => { logout(); navigate('/login') }}
                className="text-[var(--muted)] hover:text-[var(--red)] transition-colors flex-shrink-0 p-1"
                title="Sign out">
                <LogOut size={14} />
              </button>
            </div>
          )}

          {/* Collapse — desktop only */}
          <button onClick={() => setCollapsed(c => !c)}
            className="hidden lg:flex w-full items-center justify-center gap-1.5 px-3 py-1 rounded-lg text-xs text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--border)] transition-all">
            {collapsed ? <ChevronRight size={12} /> : <><ChevronLeft size={12} /><span>Collapse</span></>}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg)]">
      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div key="overlay"
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 bg-black/60 z-20 lg:hidden"
            onClick={() => setMobileOpen(false)} />
        )}
      </AnimatePresence>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div key="drawer"
            initial={{ x:-260 }} animate={{ x:0 }} exit={{ x:-260 }}
            transition={{ type:'spring', damping:28, stiffness:220 }}
            className="fixed left-0 top-0 h-full w-60 bg-[var(--card)] border-r border-[var(--border)] z-30 lg:hidden overflow-y-auto">
            <SidebarContent />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <aside className={`hidden lg:flex flex-col flex-shrink-0 bg-[var(--card)] border-r border-[var(--border)] transition-all duration-300 overflow-hidden ${
        collapsed ? 'w-14' : 'w-56'
      }`}>
        <SidebarContent />
      </aside>

      {/* Tools Panel */}
      {toolsOpen && <ToolsPanel onClose={() => setToolsOpen(false)} />}

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile topbar */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-[var(--card)] border-b border-[var(--border)] flex-shrink-0">
          <button onClick={() => setMobileOpen(true)} className="text-[var(--muted)] p-1">
            <Menu size={20} />
          </button>
          <p className="font-display font-bold text-sm text-[var(--text)]">
            NestInsights <span className="text-[var(--muted)] text-xs">v5</span>
          </p>
          <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="text-[var(--muted)] p-1">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
