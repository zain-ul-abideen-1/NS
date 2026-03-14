import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Send, Loader2, Bot, User, Sparkles, Trash2,
  Plus, Minus, RefreshCw, ChevronDown, Zap
} from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

const SUGGESTIONS = [
  "What are the trending electronics products this month?",
  "Search for top selling health products right now",
  "Analyze my review sessions and suggest improvements",
  "Add 5 trending tech products to Global Intelligence",
  "What are customers complaining about most?",
  "Find trending products in food & grocery category",
  "Replace Global Intelligence with fashion trend products",
  "Show me high margin products to stock right now",
]

export default function GroqAssistant({ onClose }) {
  const [messages, setMessages]   = useState([
    {
      role: 'assistant',
      content: "Hey! I'm your NestInsights AI Assistant powered by Groq (Llama 3.1).\n\nI have full knowledge of your platform — your review sessions, tickets, and Global Intelligence feed.\n\nYou can ask me to:\n• 🔍 Search for trending products in any category\n• ➕ Add products to your Global Intelligence\n• 🗑️ Remove or replace existing products\n• 📊 Analyze your review data\n• 💡 Get business recommendations\n\nWhat would you like to explore?",
      timestamp: new Date(),
    }
  ])
  const [input, setInput]         = useState('')
  const [loading, setLoading]     = useState(false)
  const [actionLog, setActionLog] = useState([])
  const bottomRef                 = useRef(null)
  const inputRef                  = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const send = async (text) => {
    const msg = text || input.trim()
    if (!msg || loading) return
    setInput('')

    const userMsg = { role: 'user', content: msg, timestamp: new Date() }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }))
      const res = await axios.post('/api/groq-assistant', {
        message: msg,
        history,
      })

      const { reply, action } = res.data

      // Show action notification
      if (action) {
        const type = action.action
        if (type === 'add_products') {
          const count = action.products?.length || 0
          toast.success(`✅ Added ${count} product${count !== 1 ? 's' : ''} to Global Intelligence`)
          setActionLog(prev => [...prev, { type: 'add', count, time: new Date() }])
        } else if (type === 'remove_products') {
          const count = action.ids?.length || 0
          toast.success(`🗑️ Removed ${count} product${count !== 1 ? 's' : ''} from Global Intelligence`)
          setActionLog(prev => [...prev, { type: 'remove', count, time: new Date() }])
        } else if (type === 'replace_products') {
          const count = action.products?.length || 0
          toast.success(`🔄 Replaced Global Intelligence with ${count} new products`)
          setActionLog(prev => [...prev, { type: 'replace', count, time: new Date() }])
        }
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: reply,
        action,
        timestamp: new Date(),
      }])
    } catch (e) {
      toast.error('Failed to get response')
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '⚠️ Could not connect to Groq. Make sure GROQ_API_KEY is set in Railway.',
        timestamp: new Date(),
      }])
    } finally {
      setLoading(false)
    }
  }

  const clearChat = () => {
    setMessages([{
      role: 'assistant',
      content: "Chat cleared. How can I help you?",
      timestamp: new Date(),
    }])
    setActionLog([])
  }

  const formatTime = (d) => d?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  const renderContent = (content) => {
    // Convert markdown-ish to styled text
    return content.split('\n').map((line, i) => {
      if (line.startsWith('• ') || line.startsWith('- ')) {
        return <div key={i} className="flex gap-2 mt-1"><span className="text-[var(--brand)] mt-0.5">•</span><span>{line.slice(2)}</span></div>
      }
      if (line.match(/^\d+\./)) {
        return <div key={i} className="flex gap-2 mt-1"><span className="text-[var(--brand)] font-mono text-xs mt-0.5">{line.match(/^\d+/)[0]}.</span><span>{line.replace(/^\d+\.\s*/, '')}</span></div>
      }
      if (line.trim() === '') return <div key={i} className="h-2" />
      return <p key={i} className={i === 0 ? '' : 'mt-1'}>{line}</p>
    })
  }

  return (
    <motion.div
      initial={{ x: 340, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 340, opacity: 0 }}
      transition={{ type: 'spring', damping: 28, stiffness: 220 }}
      className="fixed right-0 top-0 h-full w-[360px] bg-[var(--card)] border-l border-[var(--border)] flex flex-col z-40 shadow-2xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-[var(--border)] flex-shrink-0"
        style={{ background: 'var(--grad-brand)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
            <Zap size={16} className="text-white" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-none">Groq Assistant</p>
            <p className="text-white/70 text-[10px] mt-0.5">Llama 3.1 · Full system access</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={clearChat} title="Clear chat"
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all">
            <Trash2 size={14} />
          </button>
          <button onClick={onClose}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Action log */}
      {actionLog.length > 0 && (
        <div className="px-3 py-2 border-b border-[var(--border)] bg-[var(--card2)] flex-shrink-0">
          <p className="text-[10px] text-[var(--muted)] font-medium uppercase tracking-wider mb-1">Recent Actions</p>
          <div className="space-y-1">
            {actionLog.slice(-3).map((a, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                {a.type === 'add'     && <span className="text-emerald-400">+{a.count} products added</span>}
                {a.type === 'remove'  && <span className="text-red-400">-{a.count} products removed</span>}
                {a.type === 'replace' && <span className="text-blue-400">↺ replaced with {a.count} products</span>}
                <span className="text-[var(--muted)]">{formatTime(a.time)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        <AnimatePresence initial={false}>
          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              {/* Avatar */}
              <div className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                msg.role === 'user'
                  ? 'bg-[var(--brand)]/20'
                  : 'bg-gradient-to-br from-purple-500/20 to-blue-500/20'
              }`}>
                {msg.role === 'user'
                  ? <User size={13} className="text-[var(--brand)]" />
                  : <Bot size={13} className="text-purple-400" />}
              </div>

              {/* Bubble */}
              <div className={`max-w-[78%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                <div className={`px-3 py-2.5 rounded-2xl text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-[var(--brand)] text-white rounded-tr-sm'
                    : 'bg-[var(--card2)] border border-[var(--border)] text-[var(--text)] rounded-tl-sm'
                }`}>
                  {renderContent(msg.content)}
                </div>

                {/* Action badge */}
                {msg.action && (
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <Sparkles size={10} className="text-emerald-400" />
                    <span className="text-[10px] text-emerald-400 font-medium">
                      {msg.action.action === 'add_products' && `Added ${msg.action.products?.length} products to Global Intelligence`}
                      {msg.action.action === 'remove_products' && `Removed ${msg.action.ids?.length} products`}
                      {msg.action.action === 'replace_products' && `Replaced with ${msg.action.products?.length} new products`}
                    </span>
                  </div>
                )}

                <span className="text-[9px] text-[var(--muted)] px-1">{formatTime(msg.timestamp)}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Loading */}
        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex gap-2.5 items-start">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center flex-shrink-0">
              <Bot size={13} className="text-purple-400" />
            </div>
            <div className="px-3 py-2.5 rounded-2xl rounded-tl-sm bg-[var(--card2)] border border-[var(--border)]">
              <div className="flex gap-1 items-center">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--brand)] animate-bounce" style={{animationDelay:'0ms'}}/>
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--brand)] animate-bounce" style={{animationDelay:'150ms'}}/>
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--brand)] animate-bounce" style={{animationDelay:'300ms'}}/>
              </div>
            </div>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 1 && (
        <div className="px-3 pb-2 flex-shrink-0">
          <p className="text-[10px] text-[var(--muted)] mb-1.5 font-medium uppercase tracking-wider">Try asking...</p>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTIONS.slice(0, 4).map((s, i) => (
              <button key={i} onClick={() => send(s)}
                className="text-[10px] px-2.5 py-1.5 rounded-lg border border-[var(--border)] text-[var(--text2)] hover:border-[var(--brand)]/40 hover:text-[var(--brand)] transition-all bg-[var(--card2)] text-left">
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-3 pb-4 pt-2 border-t border-[var(--border)] flex-shrink-0">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                send()
              }
            }}
            placeholder="Ask anything about your data..."
            rows={1}
            className="flex-1 input text-xs resize-none py-2.5 min-h-[38px] max-h-[100px]"
            style={{ lineHeight: '1.5' }}
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || loading}
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-40"
            style={{ background: 'var(--grad-brand)' }}
          >
            {loading ? <Loader2 size={14} className="text-white animate-spin" /> : <Send size={14} className="text-white" />}
          </button>
        </div>
        <p className="text-[10px] text-[var(--muted)] mt-1.5 text-center">
          Enter to send · Shift+Enter for new line · Groq Llama 3.1
        </p>
      </div>
    </motion.div>
  )
}
