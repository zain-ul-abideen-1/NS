import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Database, RefreshCw, Trash2, Search, ChevronDown, ChevronUp } from 'lucide-react'
import toast from 'react-hot-toast'
import axios from 'axios'
import { useApp } from '../contexts/AppContext'
import { PageHeader, Skel } from '../components/UI'
import { useNavigate } from 'react-router-dom'

const TABLES = ['users','sessions','reviews','ticket_sessions','support_tickets','watchlist','alerts']

export default function DatabaseAdmin() {
  const { user, token } = useApp()
  const navigate = useNavigate()
  const [table,    setTable]   = useState('sessions')
  const [rows,     setRows]    = useState([])
  const [columns,  setColumns] = useState([])
  const [stats,    setStats]   = useState({})
  const [loading,  setLoad]    = useState(false)
  const [search,   setSearch]  = useState('')
  const [sortCol,  setSortCol] = useState('')
  const [sortAsc,  setSortAsc] = useState(false)
  const [page,     setPage]    = useState(0)
  const PAGE_SIZE = 25

  // Redirect if not admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      toast.error('Admin access required')
      navigate('/')
    }
  }, [user])

  useEffect(() => { fetchStats() }, [])
  useEffect(() => { fetchTable(); setPage(0); setSearch('') }, [table])

  const fetchStats = async () => {
    try {
      const r = await axios.get('/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setStats(r.data)
    } catch { /* fallback */ }
  }

  const fetchTable = async () => {
    setLoad(true)
    try {
      const r = await axios.get(`/api/admin/table/${table}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setRows(r.data.rows || [])
      setColumns(r.data.columns || [])
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to load table')
    } finally { setLoad(false) }
  }

  const deleteRow = async (pk) => {
    if (!confirm('Delete this row?')) return
    try {
      await axios.delete(`/api/admin/table/${table}/${pk}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      toast.success('Row deleted')
      fetchTable()
    } catch { toast.error('Delete failed') }
  }

  // Filter + sort
  const filtered = rows.filter(row =>
    !search || Object.values(row).some(v =>
      String(v).toLowerCase().includes(search.toLowerCase())
    )
  )
  const sorted = sortCol
    ? [...filtered].sort((a, b) => {
        const av = a[sortCol], bv = b[sortCol]
        if (typeof av === 'number') return sortAsc ? av - bv : bv - av
        return sortAsc ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av))
      })
    : filtered

  const paginated = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE)

  const sortBy = (col) => {
    if (sortCol === col) setSortAsc(a => !a)
    else { setSortCol(col); setSortAsc(true) }
  }

  // Auto-detect primary key col
  const pkCol = columns.includes('id') ? 'id'
    : columns.includes('session_id') ? 'session_id'
    : columns.includes('ticket_id') ? 'ticket_id'
    : columns[0]

  // Truncate long cell values
  const display = (v) => {
    const s = String(v ?? '')
    if (s.length > 80) return s.slice(0, 80) + '...'
    return s
  }

  const tableStats = {
    users:           stats.total_users,
    sessions:        stats.total_sessions,
    reviews:         stats.total_reviews,
    ticket_sessions: stats.total_ticket_sessions,
    support_tickets: stats.total_tickets,
    watchlist:       stats.total_watchlist,
    alerts:          stats.total_alerts,
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <PageHeader
        title="Database"
        subtitle="Admin access — view and manage all platform data"
      />

      {/* Table stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {TABLES.map(t => (
          <button key={t} onClick={() => setTable(t)}
            className={`card p-3 text-center transition-all ${
              table === t ? 'border-[var(--brand)] bg-[var(--brand)]/8' : 'hover:border-[var(--brand)]/30'
            }`}>
            <p className="text-lg font-display font-bold" style={{ color: table === t ? 'var(--brand)' : 'var(--text)' }}>
              {tableStats[t] ?? '—'}
            </p>
            <p className="text-[10px] text-[var(--muted)] mt-0.5 font-mono truncate">{t}</p>
          </button>
        ))}
      </div>

      {/* Table viewer */}
      <div className="card overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-3 p-4 border-b border-[var(--border)] flex-wrap">
          <div className="flex items-center gap-2">
            <Database size={14} className="text-[var(--brand)]" />
            <p className="text-sm font-mono font-semibold text-[var(--text)]">{table}</p>
            <span className="badge badge-gray text-[10px]">{sorted.length} rows</span>
          </div>
          <div className="relative flex-1 min-w-48">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
            <input className="input pl-8 text-xs py-1.5" placeholder="Search all columns..."
              value={search} onChange={e => { setSearch(e.target.value); setPage(0) }} />
          </div>
          <button onClick={fetchTable} className="btn-ghost text-xs">
            <RefreshCw size={12} />Refresh
          </button>
        </div>

        {/* Table */}
        {loading ? (
          <div className="p-6 space-y-2">
            {[...Array(8)].map((_, i) => <Skel key={i} className="h-8 rounded" />)}
          </div>
        ) : paginated.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm text-[var(--muted)]">No rows found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--card2)]">
                  {columns.map(col => (
                    <th key={col} onClick={() => sortBy(col)}
                      className="px-3 py-2.5 text-left font-semibold text-[var(--muted)] uppercase tracking-wider text-[10px] cursor-pointer hover:text-[var(--text)] whitespace-nowrap select-none">
                      <div className="flex items-center gap-1">
                        {col}
                        {sortCol === col && (
                          sortAsc ? <ChevronUp size={10} /> : <ChevronDown size={10} />
                        )}
                      </div>
                    </th>
                  ))}
                  <th className="px-3 py-2.5 w-10" />
                </tr>
              </thead>
              <tbody>
                {paginated.map((row, i) => (
                  <motion.tr key={i}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.01 }}
                    className="border-b border-[var(--border)] hover:bg-[var(--border)] transition-colors group">
                    {columns.map(col => (
                      <td key={col} className="px-3 py-2 text-[var(--text2)] font-mono max-w-xs">
                        {col === 'hashed_password' ? '••••••••' : (
                          <span title={String(row[col] ?? '')} className="block truncate">
                            {display(row[col])}
                          </span>
                        )}
                      </td>
                    ))}
                    <td className="px-3 py-2">
                      {table !== 'reviews' && (
                        <button
                          onClick={() => deleteRow(row[pkCol])}
                          className="opacity-0 group-hover:opacity-100 text-[var(--muted)] hover:text-[var(--red)] transition-all">
                          <Trash2 size={12} />
                        </button>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-3 border-t border-[var(--border)]">
            <p className="text-xs text-[var(--muted)]">
              Page {page + 1} of {totalPages} · {sorted.length} total
            </p>
            <div className="flex gap-1">
              <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
                className="btn-ghost text-xs disabled:opacity-30">Previous</button>
              <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}
                className="btn-ghost text-xs disabled:opacity-30">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
