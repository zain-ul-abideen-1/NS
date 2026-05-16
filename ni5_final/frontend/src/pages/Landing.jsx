import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useInView, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import {
  Brain, Globe, TrendingUp, MessageSquare, Target, Zap, LineChart, Bell,
  Star, ArrowRight, CheckCircle2, ChevronDown, Sparkles, Play,
  BarChart3, Shield, Users, Building2, Award, Layers,
  ArrowUpRight, Menu, X, ChevronRight
} from 'lucide-react'

/* ─── Poppins font injected via style tag ───────────────────────── */
const FONT_URL = 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap'

/* ─── Design tokens (isolated from app theme) ───────────────────── */
const C = {
  blue:    '#1078c2',
  blueDk:  '#0a5a99',
  blueLt:  '#e8f3fc',
  green:   '#59d12a',
  greenDk: '#3aab12',
  greenLt: '#edfae4',
  white:   '#ffffff',
  offWhite:'#f7fafd',
  gray50:  '#f0f4f8',
  gray100: '#e2eaf3',
  gray300: '#b0c4d8',
  gray500: '#6b8aa8',
  gray700: '#2d4a63',
  dark:    '#0c1a28',
}

/* ─── Data ──────────────────────────────────────────────────────── */
const FEATURES = [
  { icon:Brain,        color:C.blue,  bg:C.blueLt,  title:'AI Sentiment Engine',     body:'State-of-the-art NLP models trained on 50M+ reviews classify sentiment, emotion and intent in real time.' },
  { icon:Globe,        color:C.green, bg:C.greenLt, title:'Global Intelligence',      body:'Aggregate reviews from any country, language or platform. 140+ sources, one unified feed.' },
  { icon:TrendingUp,   color:C.blue,  bg:C.blueLt,  title:'Trend Detection',          body:'Surface emerging issues or viral praise before they explode. Anomaly alerts fire the moment patterns shift.' },
  { icon:MessageSquare,color:C.green, bg:C.greenLt, title:'Review Studio',            body:'AI-drafted responses that sound human. Schedule, approve and publish across every channel at once.' },
  { icon:Target,       color:C.blue,  bg:C.blueLt,  title:'Brand Health Score',       body:'One composite metric combining sentiment, volume, velocity and competitive context — updated hourly.' },
  { icon:Zap,          color:C.green, bg:C.greenLt, title:'Auto Ticketing',           body:'Convert negative reviews into support tickets with priority scores, routing rules and resolution hints.' },
  { icon:BarChart3,    color:C.blue,  bg:C.blueLt,  title:'BI Hub',                   body:'Pre-built dashboards, cohort analysis and white-label PDF exports your clients will actually read.' },
  { icon:Bell,         color:C.green, bg:C.greenLt, title:'Watchlist Alerts',         body:'Pin any brand, keyword or competitor. Get notified the instant their trajectory changes.' },
]

const STEPS = [
  { n:'01', icon:Layers,   title:'Connect your sources',      body:'Drop a URL, upload a CSV or hit our API. We normalise data from 140+ review platforms in under 60 seconds.' },
  { n:'02', icon:Brain,    title:'AI processes everything',   body:'Sentiment, topic clustering, anomaly detection, competitor benchmarking — all running automatically in the background.' },
  { n:'03', icon:ArrowUpRight, title:'Act on real insights', body:'Your dashboard fills with clear signals. Respond, export, alert or integrate — decisions backed by data, not gut feel.' },
]

const STATS = [
  { value:'2.4M+', sub:'Reviews analysed daily',      icon:BarChart3 },
  { value:'140+',  sub:'Supported review platforms',  icon:Globe },
  { value:'98.2%', sub:'Sentiment accuracy rate',     icon:Award },
  { value:'< 2s',  sub:'Average processing time',     icon:Zap },
]

const PLANS = [
  {
    name:'Starter', price:'$0', period:'forever', featured:false,
    tag: null,
    sub:'For indie founders and solo researchers.',
    cta:'Get started free', ctaLink:'/register',
    items:['500 reviews / month','3 tracked brands','Core sentiment analysis','Basic dashboard','Community support'],
  },
  {
    name:'Pro', price:'$49', period:'/month', featured:true,
    tag:'Most Popular',
    sub:'For growing teams who need depth and speed.',
    cta:'Start 14-day trial', ctaLink:'/register',
    items:['50 000 reviews / month','Unlimited brands','All AI features + BI Hub','Ticket engine & routing','Priority support & SLA'],
  },
  {
    name:'Enterprise', price:'Custom', period:'', featured:false,
    tag: null,
    sub:'Tailored for organisations with complex needs.',
    cta:'Talk to sales', ctaLink:'/register',
    items:['Unlimited everything','White-label reports','SSO, audit logs, RBAC','Dedicated success manager','Custom integrations & API'],
  },
]

const TESTIMONIALS = [
  { name:'Sarah K.',   role:'Head of CX · Retailco',    stars:5, text:'NestInsights slashed our review-response time by 70%. The AI suggestions genuinely sound like my team wrote them.' },
  { name:'Ahmed R.',   role:'Product Manager · Techify', stars:5, text:'The trend detection caught a packaging complaint wave 3 days before it went viral. Saved us a complete PR nightmare.' },
  { name:'Priya M.',   role:'Founder · DineLocal',       stars:5, text:'I went from drowning in reviews to a clean weekly action list. The brand health score alone is worth the subscription.' },
  { name:'Carlos V.',  role:'CX Director · ShopBrand',   stars:5, text:'We benchmarked six tools. NestInsights had the highest accuracy AND the most intuitive dashboard. Easy choice.' },
]

const LOGOS = ['Shopify','Airbnb','Stripe','Notion','Linear','Vercel']

/* ─── Helpers ──────────────────────────────────────────────────── */
const P = { fontFamily:"'Poppins', sans-serif" }
const fadeUp = { hidden:{opacity:0,y:36}, show:{opacity:1,y:0,transition:{duration:.6,ease:[.22,1,.36,1]}} }
const stagger = (delay=0) => ({ show:{ transition:{ staggerChildren:.1, delayChildren:delay } } })

function InView({ children, delay=0, ...rest }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once:true, margin:'-80px' })
  return (
    <motion.div ref={ref} variants={fadeUp} initial="hidden" animate={inView?'show':'hidden'}
      transition={{ delay }} {...rest}>
      {children}
    </motion.div>
  )
}

/* ─── Animated counter ─────────────────────────────────────────── */
function Counter({ value }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once:true })
  const num = parseFloat(value.replace(/[^0-9.]/g,''))
  const suffix = value.replace(/[0-9.]/g,'')
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!inView) return
    let start = 0
    const end = num
    const duration = 1800
    const step = 16
    const inc = end / (duration / step)
    const timer = setInterval(() => {
      start += inc
      if (start >= end) { setCount(end); clearInterval(timer) }
      else setCount(start)
    }, step)
    return () => clearInterval(timer)
  }, [inView, num])

  const display = num % 1 === 0 ? Math.round(count).toLocaleString() : count.toFixed(1)
  return <span ref={ref}>{display}{suffix}</span>
}

/* ─── Ticker / marquee ─────────────────────────────────────────── */
function Ticker() {
  const words = ['Sentiment Analysis','Brand Health','Review Intelligence','AI Responses','Trend Detection','Competitor Benchmarking','Ticket Automation','Global Insights']
  return (
    <div style={{ overflow:'hidden', whiteSpace:'nowrap', borderTop:`1px solid ${C.gray100}`, borderBottom:`1px solid ${C.gray100}`, padding:'14px 0', background:C.offWhite }}>
      <motion.div animate={{ x:['0%','-50%'] }} transition={{ duration:22, repeat:Infinity, ease:'linear' }}
        style={{ display:'inline-flex', gap:0 }}>
        {[...words,...words].map((w,i) => (
          <span key={i} style={{ ...P, display:'inline-flex', alignItems:'center', gap:16, padding:'0 32px', fontSize:13, fontWeight:600, color:C.gray500, letterSpacing:'.02em', textTransform:'uppercase' }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background: i%3===0?C.blue:C.green, display:'inline-block' }} />
            {w}
          </span>
        ))}
      </motion.div>
    </div>
  )
}

/* ─── Floating particles ───────────────────────────────────────── */
function Particles() {
  const dots = Array.from({length:14},(_,i)=>({
    x: 5+i*7, y:10+((i*37)%80),
    size: 4+((i*3)%10),
    dur: 3+i%4,
    color: i%2===0?C.blue:C.green,
    delay: i*.3
  }))
  return (
    <div style={{ position:'absolute',inset:0,pointerEvents:'none',overflow:'hidden' }}>
      {dots.map((d,i)=>(
        <motion.div key={i}
          style={{ position:'absolute', left:`${d.x}%`, top:`${d.y}%`, width:d.size, height:d.size, borderRadius:'50%', background:d.color, opacity:.15 }}
          animate={{ y:[0,-18,0], opacity:[.1,.25,.1] }}
          transition={{ duration:d.dur, repeat:Infinity, delay:d.delay, ease:'easeInOut' }}
        />
      ))}
    </div>
  )
}

/* ─── Navbar ────────────────────────────────────────────────────── */
function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const links = [
    { label:'Features',    href:'#features' },
    { label:'How It Works',href:'#how-it-works' },
    { label:'Pricing',     href:'#pricing' },
    { label:'Testimonials',href:'#testimonials' },
  ]

  return (
    <header style={{
      position:'fixed', top:0, left:0, right:0, zIndex:200,
      background: scrolled ? 'rgba(255,255,255,.97)' : 'transparent',
      backdropFilter: scrolled ? 'blur(16px)' : 'none',
      borderBottom: scrolled ? `1px solid ${C.gray100}` : '1px solid transparent',
      transition:'all .3s ease',
    }}>
      <div style={{ maxWidth:1200, margin:'0 auto', padding:'0 24px', display:'flex', alignItems:'center', height:68, gap:32 }}>

        {/* Logo */}
        <Link to="/" style={{ display:'flex', alignItems:'center', gap:10, textDecoration:'none', flexShrink:0 }}>
          <div style={{ width:38, height:38, borderRadius:11, background:`linear-gradient(135deg,${C.blue},${C.green})`, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:`0 4px 16px ${C.blue}44` }}>
            <span style={{ ...P, color:'#fff', fontWeight:800, fontSize:17 }}>N</span>
          </div>
          <span style={{ ...P, fontWeight:800, fontSize:19, color:C.dark, letterSpacing:'-.025em' }}>
            Nest<span style={{ color:C.blue }}>Insights</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav style={{ flex:1, display:'flex', justifyContent:'center', gap:4 }}>
          {links.map(l => (
            <a key={l.label} href={l.href} style={{ ...P, padding:'7px 16px', borderRadius:8, fontSize:14, fontWeight:500, color:C.gray500, textDecoration:'none', transition:'all .15s' }}
              onMouseEnter={e=>{e.currentTarget.style.color=C.dark;e.currentTarget.style.background=C.gray50}}
              onMouseLeave={e=>{e.currentTarget.style.color=C.gray500;e.currentTarget.style.background='transparent'}}
            >{l.label}</a>
          ))}
        </nav>

        {/* CTAs desktop */}
        <div style={{ display:'flex', gap:10, alignItems:'center', flexShrink:0 }}>
          <Link to="/login" style={{ ...P, padding:'8px 20px', borderRadius:9, fontSize:14, fontWeight:500, color:C.blue, textDecoration:'none', border:`1.5px solid ${C.blue}`, transition:'all .15s' }}
            onMouseEnter={e=>{e.currentTarget.style.background=C.blueLt}}
            onMouseLeave={e=>{e.currentTarget.style.background='transparent'}}
          >Log in</Link>
          <Link to="/register" style={{ ...P, padding:'8px 20px', borderRadius:9, fontSize:14, fontWeight:700, color:'#fff', textDecoration:'none', background:`linear-gradient(135deg,${C.blue},${C.blueDk})`, boxShadow:`0 4px 14px ${C.blue}44`, transition:'all .2s' }}
            onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-1px)';e.currentTarget.style.boxShadow=`0 8px 22px ${C.blue}55`}}
            onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow=`0 4px 14px ${C.blue}44`}}
          >Get started free</Link>
        </div>

        {/* Mobile burger */}
        <button onClick={()=>setMenuOpen(o=>!o)} style={{ display:'none', background:'none', border:'none', cursor:'pointer', color:C.gray700, padding:4 }} className="mobile-burger">
          {menuOpen ? <X size={22}/> : <Menu size={22}/>}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}}
            style={{ background:'#fff', borderTop:`1px solid ${C.gray100}`, overflow:'hidden' }}>
            <div style={{ padding:'16px 24px', display:'flex', flexDirection:'column', gap:8 }}>
              {links.map(l=>(
                <a key={l.label} href={l.href} onClick={()=>setMenuOpen(false)}
                  style={{ ...P, fontSize:15, fontWeight:500, color:C.gray700, textDecoration:'none', padding:'10px 0', borderBottom:`1px solid ${C.gray50}` }}
                >{l.label}</a>
              ))}
              <div style={{ display:'flex', gap:10, marginTop:8 }}>
                <Link to="/login" style={{ ...P, flex:1, textAlign:'center', padding:'10px', borderRadius:9, fontSize:14, fontWeight:600, color:C.blue, textDecoration:'none', border:`1.5px solid ${C.blue}` }}>Log in</Link>
                <Link to="/register" style={{ ...P, flex:1, textAlign:'center', padding:'10px', borderRadius:9, fontSize:14, fontWeight:700, color:'#fff', textDecoration:'none', background:`linear-gradient(135deg,${C.blue},${C.blueDk})` }}>Sign up free</Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @media (max-width:768px) {
          .mobile-burger { display:flex !important; }
          nav { display:none !important; }
          header > div > div:last-child { display:none !important; }
        }
      `}</style>
    </header>
  )
}

/* ─── Hero ──────────────────────────────────────────────────────── */
function Hero() {
  const { scrollY } = useScroll()
  const y = useTransform(scrollY, [0,600], [0,80])

  return (
    <section style={{ minHeight:'100vh', display:'flex', alignItems:'center', background:'#fff', position:'relative', overflow:'hidden', paddingTop:68 }}>
      <Particles />

      {/* Radial blobs */}
      <div style={{ position:'absolute', top:-200, right:-200, width:700, height:700, borderRadius:'50%', background:`radial-gradient(circle,${C.blue}10 0%,transparent 65%)`, pointerEvents:'none' }}/>
      <div style={{ position:'absolute', bottom:-150, left:-100, width:500, height:500, borderRadius:'50%', background:`radial-gradient(circle,${C.green}0c 0%,transparent 70%)`, pointerEvents:'none' }}/>

      {/* Dot-grid overlay */}
      <div style={{ position:'absolute', inset:0, pointerEvents:'none', backgroundImage:`radial-gradient(${C.gray300} 1px, transparent 1px)`, backgroundSize:'32px 32px', opacity:.35 }}/>

      <motion.div style={{ y, maxWidth:1200, margin:'0 auto', padding:'96px 24px 80px', position:'relative', zIndex:1, width:'100%' }}>
        <motion.div variants={stagger(.1)} initial="hidden" animate="show"
          style={{ display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center', gap:28 }}>

          {/* Badge pill */}
          <motion.div variants={fadeUp}>
            <motion.span
              animate={{ boxShadow:['0 0 0 0 rgba(16,120,194,0)','0 0 0 8px rgba(16,120,194,0)'] }}
              transition={{ duration:2, repeat:Infinity }}
              style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'7px 18px', borderRadius:999, background:`linear-gradient(135deg,${C.blueLt},${C.greenLt})`, border:`1px solid ${C.blue}33`, ...P, fontSize:13, fontWeight:600, color:C.blue }}>
              <Sparkles size={14} style={{ color:C.green }} />
              AI-powered review intelligence · 2.4M+ reviews/day
            </motion.span>
          </motion.div>

          {/* H1 */}
          <motion.h1 variants={fadeUp} style={{ ...P, fontWeight:800, fontSize:'clamp(2.6rem,6.5vw,4.6rem)', lineHeight:1.08, letterSpacing:'-.03em', color:C.dark, maxWidth:860 }}>
            Turn customer reviews into{' '}
            <span style={{ position:'relative', display:'inline-block' }}>
              <span style={{ background:`linear-gradient(135deg,${C.blue},${C.green})`, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
                your sharpest edge
              </span>
              <motion.span style={{ position:'absolute', bottom:4, left:0, right:0, height:4, borderRadius:4, background:`linear-gradient(90deg,${C.blue},${C.green})`, transformOrigin:'left' }}
                initial={{ scaleX:0 }} animate={{ scaleX:1 }} transition={{ delay:.9, duration:.7, ease:[.22,1,.36,1] }} />
            </span>
          </motion.h1>

          {/* Subheading */}
          <motion.p variants={fadeUp} style={{ ...P, fontSize:'clamp(1rem,2.2vw,1.22rem)', color:C.gray500, maxWidth:580, lineHeight:1.75, fontWeight:400 }}>
            NestInsights uses advanced AI to analyse millions of reviews, revealing sentiment trends, brand health signals and competitor gaps — so you act fast and grow faster.
          </motion.p>

          {/* CTA row */}
          <motion.div variants={fadeUp} style={{ display:'flex', gap:14, flexWrap:'wrap', justifyContent:'center' }}>
            <Link to="/register" style={{ display:'inline-flex', alignItems:'center', gap:9, padding:'15px 32px', borderRadius:12, ...P, fontSize:15, fontWeight:700, color:'#fff', textDecoration:'none', background:`linear-gradient(135deg,${C.blue},${C.blueDk})`, boxShadow:`0 8px 28px ${C.blue}44`, transition:'all .2s' }}
              onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow=`0 14px 36px ${C.blue}55`}}
              onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow=`0 8px 28px ${C.blue}44`}}>
              Start for free <ArrowRight size={17}/>
            </Link>
            <a href="#how-it-works" style={{ display:'inline-flex', alignItems:'center', gap:9, padding:'15px 32px', borderRadius:12, ...P, fontSize:15, fontWeight:600, color:C.blue, textDecoration:'none', background:'#fff', border:`1.5px solid ${C.gray100}`, transition:'all .2s', boxShadow:'0 2px 12px rgba(0,0,0,.06)' }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=C.blue;e.currentTarget.style.background=C.blueLt}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=C.gray100;e.currentTarget.style.background='#fff'}}>
              <Play size={15} style={{ fill:C.blue }} /> See how it works
            </a>
          </motion.div>

          {/* Trust checks */}
          <motion.div variants={fadeUp} style={{ display:'flex', flexWrap:'wrap', gap:'8px 24px', justifyContent:'center' }}>
            {['No credit card required','Free plan always available','Live in under 2 minutes'].map(t=>(
              <span key={t} style={{ display:'inline-flex', alignItems:'center', gap:6, ...P, fontSize:13, fontWeight:500, color:C.gray500 }}>
                <CheckCircle2 size={14} style={{ color:C.green, flexShrink:0 }}/> {t}
              </span>
            ))}
          </motion.div>

          {/* Dashboard mockup */}
          <motion.div variants={fadeUp}
            style={{ width:'100%', maxWidth:980, marginTop:8, borderRadius:22, overflow:'hidden', boxShadow:`0 40px 100px ${C.blue}1a, 0 0 0 1px ${C.blue}18`, background:C.gray50, border:`1px solid ${C.gray100}` }}>
            {/* Browser chrome */}
            <div style={{ background:C.gray100, padding:'11px 18px', borderBottom:`1px solid ${C.gray100}`, display:'flex', alignItems:'center', gap:8 }}>
              {['#f87171','#fbbf24','#59d12a'].map(c=><span key={c} style={{ width:13,height:13,borderRadius:'50%',background:c,display:'inline-block'}}/>)}
              <div style={{ flex:1, background:'#fff', borderRadius:7, padding:'5px 14px', marginLeft:10, ...P, fontSize:12, color:C.gray300, border:`1px solid ${C.gray100}` }}>
                app.nestinsights.io/dashboard
              </div>
            </div>
            {/* Metric cards */}
            <div style={{ padding:'24px 24px 16px', display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14 }}>
              {[
                {label:'Brand Health',    val:'84',    unit:'/100', color:C.blue,  up:'+4.2%'},
                {label:'Sentiment Score', val:'76%',   unit:'',     color:C.green, up:'+1.8%'},
                {label:'Reviews / Week',  val:'1,248', unit:'',     color:C.blue,  up:'+12%'},
                {label:'Open Tickets',    val:'23',    unit:'',     color:'#f59e0b',up:'-5'},
              ].map(s=>(
                <div key={s.label} style={{ background:'#fff', borderRadius:14, padding:'18px 16px', border:`1px solid ${C.gray100}` }}>
                  <p style={{ ...P, fontSize:11, color:C.gray300, fontWeight:600, textTransform:'uppercase', letterSpacing:'.08em', marginBottom:8 }}>{s.label}</p>
                  <p style={{ ...P, fontWeight:800, fontSize:28, color:s.color, lineHeight:1 }}>{s.val}<span style={{ fontSize:13, color:C.gray300 }}>{s.unit}</span></p>
                  <p style={{ ...P, fontSize:11, color:s.up.startsWith('+')?C.green:'#f59e0b', marginTop:6, fontWeight:600 }}>↑ {s.up} vs last week</p>
                </div>
              ))}
            </div>
            {/* Chart row */}
            <div style={{ padding:'0 24px 24px', display:'grid', gridTemplateColumns:'2fr 1fr', gap:14 }}>
              <div style={{ background:'#fff', borderRadius:14, padding:20, border:`1px solid ${C.gray100}` }}>
                <p style={{ ...P, fontSize:12, color:C.gray300, fontWeight:600, marginBottom:14 }}>Sentiment trend — 30 days</p>
                <svg width="100%" height={80} viewBox="0 0 500 80" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="lg1" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor={C.blue}/><stop offset="100%" stopColor={C.green}/>
                    </linearGradient>
                    <linearGradient id="lg2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={C.blue} stopOpacity=".18"/>
                      <stop offset="100%" stopColor={C.blue} stopOpacity="0"/>
                    </linearGradient>
                  </defs>
                  <polyline points="0,65 50,58 100,52 150,60 200,38 250,28 300,34 350,18 400,20 450,12 500,8" fill="none" stroke="url(#lg1)" strokeWidth="3" strokeLinecap="round"/>
                  <polyline points="0,65 50,58 100,52 150,60 200,38 250,28 300,34 350,18 400,20 450,12 500,8 500,80 0,80" fill="url(#lg2)"/>
                </svg>
              </div>
              <div style={{ background:'#fff', borderRadius:14, padding:20, border:`1px solid ${C.gray100}` }}>
                <p style={{ ...P, fontSize:12, color:C.gray300, fontWeight:600, marginBottom:14 }}>Top topics</p>
                {[['Delivery speed',72,C.green],['Product quality',65,C.blue],['Support',48,'#f59e0b']].map(([t,w,c])=>(
                  <div key={t} style={{ marginBottom:10 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                      <span style={{ ...P, fontSize:11, color:C.gray500 }}>{t}</span>
                      <span style={{ ...P, fontSize:11, fontWeight:700, color:c }}>{w}%</span>
                    </div>
                    <div style={{ height:5, background:C.gray50, borderRadius:4 }}>
                      <motion.div initial={{ width:0 }} animate={{ width:`${w}%` }} transition={{ duration:1.2, delay:.5, ease:'easeOut' }}
                        style={{ height:5, background:c, borderRadius:4, opacity:.75 }}/>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

        </motion.div>
      </motion.div>

      {/* Scroll cue */}
      <motion.a href="#logos" animate={{ y:[0,8,0] }} transition={{ duration:2, repeat:Infinity }}
        style={{ position:'absolute', bottom:28, left:'50%', transform:'translateX(-50%)', color:C.gray300, display:'flex', flexDirection:'column', alignItems:'center', gap:4, textDecoration:'none', ...P, fontSize:11 }}>
        <span style={{ color:C.gray500 }}>Explore</span>
        <ChevronDown size={20}/>
      </motion.a>
    </section>
  )
}

/* ─── Logo strip ────────────────────────────────────────────────── */
function Logos() {
  return (
    <section id="logos" style={{ background:C.offWhite, padding:'52px 24px' }}>
      <div style={{ maxWidth:1200, margin:'0 auto', textAlign:'center' }}>
        <InView><p style={{ ...P, fontSize:13, fontWeight:600, color:C.gray300, textTransform:'uppercase', letterSpacing:'.1em', marginBottom:32 }}>Trusted by teams at</p></InView>
        <div style={{ display:'flex', justifyContent:'center', alignItems:'center', flexWrap:'wrap', gap:'16px 40px' }}>
          {LOGOS.map((l,i)=>(
            <InView key={l} delay={i*.06}>
              <span style={{ ...P, fontSize:18, fontWeight:700, color:C.gray300, letterSpacing:'-.02em' }}>{l}</span>
            </InView>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── Stats bar ─────────────────────────────────────────────────── */
function Stats() {
  return (
    <section style={{ background:`linear-gradient(135deg,${C.blue},${C.blueDk})`, padding:'64px 24px', position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(rgba(255,255,255,.06) 1px,transparent 1px)', backgroundSize:'24px 24px', pointerEvents:'none' }}/>
      <div style={{ maxWidth:1200, margin:'0 auto', display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:0 }}>
        {STATS.map((s,i)=>(
          <InView key={s.sub} delay={i*.1} style={{ textAlign:'center', padding:'0 20px', borderRight: i<3 ? '1px solid rgba(255,255,255,.14)' : 'none' }}>
            <s.icon size={26} style={{ color:'rgba(255,255,255,.55)', marginBottom:12 }}/>
            <p style={{ ...P, fontWeight:800, fontSize:'2.6rem', color:'#fff', lineHeight:1, marginBottom:6 }}><Counter value={s.value}/></p>
            <p style={{ ...P, fontSize:13, color:'rgba(255,255,255,.65)', fontWeight:500 }}>{s.sub}</p>
          </InView>
        ))}
      </div>
    </section>
  )
}

/* ─── Ticker ────────────────────────────────────────────────────── */

/* ─── Features ──────────────────────────────────────────────────── */
function Features() {
  return (
    <section id="features" style={{ background:'#fff', padding:'112px 24px' }}>
      <div style={{ maxWidth:1200, margin:'0 auto' }}>
        <InView style={{ textAlign:'center', marginBottom:72 }}>
          <span style={{ ...P, display:'inline-block', padding:'5px 16px', borderRadius:999, background:C.blueLt, border:`1px solid ${C.blue}28`, fontSize:12, fontWeight:700, color:C.blue, marginBottom:18, textTransform:'uppercase', letterSpacing:'.06em' }}>Platform Features</span>
          <h2 style={{ ...P, fontWeight:800, fontSize:'clamp(1.9rem,4vw,3rem)', color:C.dark, letterSpacing:'-.025em', marginBottom:16, lineHeight:1.15 }}>
            Eight modules. One intelligence layer.
          </h2>
          <p style={{ ...P, fontSize:16, color:C.gray500, maxWidth:500, margin:'0 auto', lineHeight:1.75 }}>
            Everything you need to turn unstructured feedback into clear competitive advantage.
          </p>
        </InView>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(270px,1fr))', gap:24 }}>
          {FEATURES.map((f,i)=>(
            <InView key={f.title} delay={(i%4)*.07}>
              <motion.div whileHover={{ y:-6, boxShadow:`0 16px 48px ${C.blue}14` }}
                style={{ background:'#fff', borderRadius:18, padding:30, border:`1px solid ${C.gray100}`, transition:'border-color .2s', cursor:'default', height:'100%' }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=f.color+'44'}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor=C.gray100}}>
                <div style={{ width:52, height:52, borderRadius:14, background:f.bg, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:18 }}>
                  <f.icon size={24} style={{ color:f.color }}/>
                </div>
                <h3 style={{ ...P, fontWeight:700, fontSize:16, color:C.dark, marginBottom:10 }}>{f.title}</h3>
                <p style={{ ...P, fontSize:14, color:C.gray500, lineHeight:1.7 }}>{f.body}</p>
              </motion.div>
            </InView>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── How it works ──────────────────────────────────────────────── */
function HowItWorks() {
  return (
    <section id="how-it-works" style={{ background:C.offWhite, padding:'112px 24px' }}>
      <div style={{ maxWidth:1200, margin:'0 auto' }}>
        <InView style={{ textAlign:'center', marginBottom:80 }}>
          <span style={{ ...P, display:'inline-block', padding:'5px 16px', borderRadius:999, background:C.greenLt, border:`1px solid ${C.green}40`, fontSize:12, fontWeight:700, color:C.greenDk, marginBottom:18, textTransform:'uppercase', letterSpacing:'.06em' }}>How It Works</span>
          <h2 style={{ ...P, fontWeight:800, fontSize:'clamp(1.9rem,4vw,3rem)', color:C.dark, letterSpacing:'-.025em', lineHeight:1.15 }}>
            Insights in <span style={{ color:C.green }}>three steps</span>
          </h2>
        </InView>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:40, position:'relative' }}>
          {/* Connector */}
          <div style={{ position:'absolute', top:44, left:'17%', right:'17%', height:2, background:`linear-gradient(90deg,${C.blue},${C.green})`, opacity:.2, pointerEvents:'none' }}/>

          {STEPS.map((s,i)=>(
            <InView key={s.n} delay={i*.15} style={{ textAlign:'center', zIndex:1, position:'relative' }}>
              <motion.div whileHover={{ scale:1.05 }}
                style={{ width:88, height:88, borderRadius:'50%', background:`linear-gradient(135deg,${C.blue},${C.green})`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 28px', boxShadow:`0 10px 30px ${C.blue}33` }}>
                <span style={{ ...P, fontWeight:900, fontSize:22, color:'#fff' }}>{s.n}</span>
              </motion.div>
              <h3 style={{ ...P, fontWeight:700, fontSize:19, color:C.dark, marginBottom:14 }}>{s.title}</h3>
              <p style={{ ...P, fontSize:14, color:C.gray500, lineHeight:1.75, maxWidth:280, margin:'0 auto' }}>{s.body}</p>
            </InView>
          ))}
        </div>

        {/* CTA under steps */}
        <InView style={{ textAlign:'center', marginTop:64 }}>
          <Link to="/register" style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'14px 32px', borderRadius:12, ...P, fontSize:15, fontWeight:700, color:'#fff', textDecoration:'none', background:`linear-gradient(135deg,${C.blue},${C.blueDk})`, boxShadow:`0 8px 24px ${C.blue}40` }}>
            Try it now — it's free <ArrowRight size={16}/>
          </Link>
        </InView>
      </div>
    </section>
  )
}

/* ─── Testimonials ──────────────────────────────────────────────── */
function Testimonials() {
  const [active, setActive] = useState(0)
  useEffect(() => {
    const t = setInterval(()=>setActive(a=>(a+1)%TESTIMONIALS.length), 4500)
    return ()=>clearInterval(t)
  }, [])

  return (
    <section id="testimonials" style={{ background:'#fff', padding:'112px 24px', overflow:'hidden' }}>
      <div style={{ maxWidth:1200, margin:'0 auto' }}>
        <InView style={{ textAlign:'center', marginBottom:64 }}>
          <h2 style={{ ...P, fontWeight:800, fontSize:'clamp(1.9rem,4vw,3rem)', color:C.dark, letterSpacing:'-.025em', marginBottom:12 }}>
            Loved by teams who care
          </h2>
          <p style={{ ...P, fontSize:15, color:C.gray500 }}>Join thousands of companies already growing with NestInsights.</p>
        </InView>

        {/* Card grid */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:24 }}>
          {TESTIMONIALS.map((t,i)=>(
            <InView key={t.name} delay={i*.08}>
              <motion.div whileHover={{ y:-4, boxShadow:`0 16px 48px ${C.blue}10` }}
                style={{ background: active===i ? `linear-gradient(135deg,${C.blueLt},${C.greenLt})` : '#fff', borderRadius:18, padding:32, border:`1px solid ${C.gray100}`, transition:'all .3s', borderColor: active===i ? C.blue+'33' : C.gray100 }}>
                <div style={{ display:'flex', gap:3, marginBottom:16 }}>
                  {[...Array(t.stars)].map((_,j)=><Star key={j} size={15} style={{ fill:'#f59e0b', color:'#f59e0b' }}/>)}
                </div>
                <p style={{ ...P, fontSize:15, color:C.gray700, lineHeight:1.75, marginBottom:24, fontStyle:'italic' }}>"{t.text}"</p>
                <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                  <div style={{ width:44, height:44, borderRadius:'50%', background:`linear-gradient(135deg,${C.blue},${C.green})`, display:'flex', alignItems:'center', justifyContent:'center', ...P, fontWeight:800, color:'#fff', fontSize:17, flexShrink:0 }}>{t.name[0]}</div>
                  <div>
                    <p style={{ ...P, fontWeight:700, fontSize:14, color:C.dark }}>{t.name}</p>
                    <p style={{ ...P, fontSize:12, color:C.gray300 }}>{t.role}</p>
                  </div>
                </div>
              </motion.div>
            </InView>
          ))}
        </div>

        {/* Dot nav */}
        <div style={{ display:'flex', justifyContent:'center', gap:8, marginTop:32 }}>
          {TESTIMONIALS.map((_,i)=>(
            <button key={i} onClick={()=>setActive(i)}
              style={{ width: active===i?24:8, height:8, borderRadius:4, background: active===i?C.blue:C.gray100, border:'none', cursor:'pointer', transition:'all .3s', padding:0 }}/>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── Pricing ───────────────────────────────────────────────────── */
function Pricing() {
  return (
    <section id="pricing" style={{ background:C.offWhite, padding:'112px 24px' }}>
      <div style={{ maxWidth:1200, margin:'0 auto' }}>
        <InView style={{ textAlign:'center', marginBottom:72 }}>
          <span style={{ ...P, display:'inline-block', padding:'5px 16px', borderRadius:999, background:C.blueLt, border:`1px solid ${C.blue}28`, fontSize:12, fontWeight:700, color:C.blue, marginBottom:18, textTransform:'uppercase', letterSpacing:'.06em' }}>Pricing</span>
          <h2 style={{ ...P, fontWeight:800, fontSize:'clamp(1.9rem,4vw,3rem)', color:C.dark, letterSpacing:'-.025em', marginBottom:12 }}>Simple, transparent pricing</h2>
          <p style={{ ...P, fontSize:15, color:C.gray500 }}>Start free. Scale when you're ready. No lock-in.</p>
        </InView>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:24, alignItems:'start' }}>
          {PLANS.map((p,i)=>(
            <InView key={p.name} delay={i*.1}>
              <div style={{
                background: p.featured ? `linear-gradient(160deg,${C.blue} 0%,${C.blueDk} 100%)` : '#fff',
                borderRadius:22, padding:'38px 30px',
                border: p.featured ? 'none' : `1px solid ${C.gray100}`,
                boxShadow: p.featured ? `0 24px 64px ${C.blue}40` : 'none',
                transform: p.featured ? 'scale(1.04)' : 'none',
                position:'relative', zIndex: p.featured ? 2 : 1,
              }}>
                {p.tag && (
                  <span style={{ position:'absolute', top:-14, left:'50%', transform:'translateX(-50%)', ...P, background:`linear-gradient(135deg,${C.green},${C.greenDk})`, color:'#fff', padding:'5px 18px', borderRadius:999, fontSize:12, fontWeight:700, boxShadow:`0 4px 14px ${C.green}44`, whiteSpace:'nowrap' }}>{p.tag}</span>
                )}
                <p style={{ ...P, fontWeight:600, fontSize:14, color: p.featured?'rgba(255,255,255,.7)':C.gray500, marginBottom:10 }}>{p.name}</p>
                <div style={{ display:'flex', alignItems:'baseline', gap:4, marginBottom:10 }}>
                  <span style={{ ...P, fontWeight:800, fontSize:42, color: p.featured?'#fff':C.dark, lineHeight:1 }}>{p.price}</span>
                  {p.period && <span style={{ ...P, fontSize:14, color: p.featured?'rgba(255,255,255,.55)':C.gray300 }}>{p.period}</span>}
                </div>
                <p style={{ ...P, fontSize:14, color: p.featured?'rgba(255,255,255,.65)':C.gray500, marginBottom:28, lineHeight:1.65 }}>{p.sub}</p>
                <ul style={{ listStyle:'none', marginBottom:32, display:'flex', flexDirection:'column', gap:13 }}>
                  {p.items.map(item=>(
                    <li key={item} style={{ display:'flex', gap:10, alignItems:'flex-start', ...P, fontSize:14, color: p.featured?'rgba(255,255,255,.85)':C.gray700 }}>
                      <CheckCircle2 size={16} style={{ color:C.green, flexShrink:0, marginTop:1 }}/> {item}
                    </li>
                  ))}
                </ul>
                <Link to={p.ctaLink} style={{ display:'block', textAlign:'center', padding:'13px', borderRadius:11, ...P, fontSize:14, fontWeight:700, textDecoration:'none', background: p.featured?'#fff':`linear-gradient(135deg,${C.blue},${C.blueDk})`, color: p.featured?C.blue:'#fff', transition:'all .2s', boxShadow: p.featured?'none':`0 4px 14px ${C.blue}33` }}
                  onMouseEnter={e=>{e.currentTarget.style.opacity='.9';e.currentTarget.style.transform='translateY(-1px)'}}
                  onMouseLeave={e=>{e.currentTarget.style.opacity='1';e.currentTarget.style.transform='none'}}
                >{p.cta}</Link>
              </div>
            </InView>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── Final CTA ─────────────────────────────────────────────────── */
function FinalCTA() {
  return (
    <section style={{ background:'#fff', padding:'80px 24px' }}>
      <div style={{ maxWidth:900, margin:'0 auto' }}>
        <InView>
          <div style={{ background:`linear-gradient(135deg,${C.blue},${C.blueDk})`, borderRadius:28, padding:'80px 48px', textAlign:'center', position:'relative', overflow:'hidden', boxShadow:`0 32px 80px ${C.blue}30` }}>
            <div style={{ position:'absolute', top:-80, right:-80, width:300, height:300, borderRadius:'50%', background:`${C.green}18` }}/>
            <div style={{ position:'absolute', bottom:-60, left:-60, width:220, height:220, borderRadius:'50%', background:'rgba(255,255,255,.06)' }}/>
            <div style={{ position:'relative', zIndex:1 }}>
              <motion.span animate={{ scale:[1,1.06,1] }} transition={{ duration:3, repeat:Infinity }}
                style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'6px 16px', borderRadius:999, background:`${C.green}28`, border:`1px solid ${C.green}50`, ...P, fontSize:12, fontWeight:700, color:C.green, marginBottom:24 }}>
                <Sparkles size={13}/> Free to start · No card required
              </motion.span>
              <h2 style={{ ...P, fontWeight:800, fontSize:'clamp(2rem,4.5vw,3rem)', color:'#fff', letterSpacing:'-.025em', marginBottom:18, lineHeight:1.15 }}>
                Ready to unlock your<br/>review intelligence?
              </h2>
              <p style={{ ...P, fontSize:16, color:'rgba(255,255,255,.7)', marginBottom:40, lineHeight:1.75, maxWidth:520, margin:'0 auto 40px' }}>
                Sign up in 30 seconds, connect your first brand, and watch AI insights flow in within minutes.
              </p>
              <div style={{ display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap' }}>
                <Link to="/register" style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'15px 36px', borderRadius:13, ...P, fontSize:15, fontWeight:700, color:C.blue, textDecoration:'none', background:'#fff', boxShadow:'0 4px 20px rgba(0,0,0,.18)', transition:'all .2s' }}
                  onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 10px 32px rgba(0,0,0,.24)'}}
                  onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='0 4px 20px rgba(0,0,0,.18)'}}>
                  Create free account <ArrowRight size={16}/>
                </Link>
                <Link to="/login" style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'15px 36px', borderRadius:13, ...P, fontSize:15, fontWeight:600, color:'#fff', textDecoration:'none', border:'1.5px solid rgba(255,255,255,.35)', transition:'all .2s' }}
                  onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,.1)'}}
                  onMouseLeave={e=>{e.currentTarget.style.background='transparent'}}>
                  Log in to dashboard
                </Link>
              </div>
            </div>
          </div>
        </InView>
      </div>
    </section>
  )
}

/* ─── Footer ────────────────────────────────────────────────────── */
function Footer() {
  return (
    <footer style={{ background:C.dark, padding:'72px 24px 36px' }}>
      <div style={{ maxWidth:1200, margin:'0 auto' }}>
        <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr', gap:48, marginBottom:56, paddingBottom:56, borderBottom:'1px solid rgba(255,255,255,.07)' }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:18 }}>
              <div style={{ width:34, height:34, borderRadius:9, background:`linear-gradient(135deg,${C.blue},${C.green})`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <span style={{ ...P, color:'#fff', fontWeight:800, fontSize:15 }}>N</span>
              </div>
              <span style={{ ...P, fontWeight:800, fontSize:17, color:'#fff' }}>NestInsights</span>
            </div>
            <p style={{ ...P, fontSize:14, color:'rgba(255,255,255,.38)', lineHeight:1.75, maxWidth:240 }}>
              AI-powered review intelligence that helps modern brands grow through customer understanding.
            </p>
          </div>
          {[
            { title:'Product',  links:['Features','How it works','Pricing','Changelog','Status'] },
            { title:'Company',  links:['About','Blog','Careers','Press kit','Legal'] },
            { title:'Support',  links:['Documentation','Help centre','API reference','Community','Contact'] },
          ].map(col=>(
            <div key={col.title}>
              <p style={{ ...P, fontWeight:700, fontSize:12, color:'rgba(255,255,255,.6)', marginBottom:18, textTransform:'uppercase', letterSpacing:'.08em' }}>{col.title}</p>
              {col.links.map(l=>(
                <a key={l} href="#" style={{ display:'block', ...P, fontSize:14, color:'rgba(255,255,255,.35)', textDecoration:'none', marginBottom:11, transition:'color .15s' }}
                  onMouseEnter={e=>{e.target.style.color='rgba(255,255,255,.75)'}}
                  onMouseLeave={e=>{e.target.style.color='rgba(255,255,255,.35)'}}>{l}</a>
              ))}
            </div>
          ))}
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
          <p style={{ ...P, fontSize:13, color:'rgba(255,255,255,.25)' }}>© 2025 NestInsights. All rights reserved.</p>
          <div style={{ display:'flex', gap:20 }}>
            {['Privacy','Terms','Cookies'].map(l=>(
              <a key={l} href="#" style={{ ...P, fontSize:13, color:'rgba(255,255,255,.25)', textDecoration:'none' }}>{l}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}

/* ─── Root export ───────────────────────────────────────────────── */
export default function Landing() {
  // Inject Poppins and ensure white bg (isolated from the app's dark theme)
  useEffect(() => {
    const link = document.createElement('link')
    link.rel  = 'stylesheet'
    link.href = FONT_URL
    document.head.appendChild(link)

    const prev = document.body.style.cssText
    document.body.style.background = '#ffffff'
    document.documentElement.classList.remove('dark')

    return () => {
      document.body.style.cssText = prev
    }
  }, [])

  return (
    <div style={{ fontFamily:"'Poppins','DM Sans',sans-serif", background:'#ffffff', color:C.dark, overflowX:'hidden' }}>
      <Navbar />
      <Hero />
      <Ticker />
      <Logos />
      <Stats />
      <Features />
      <HowItWorks />
      <Testimonials />
      <Pricing />
      <FinalCTA />
      <Footer />

      {/* Responsive grid fix */}
      <style>{`
        @media (max-width: 900px) {
          #stats-grid    { grid-template-columns: repeat(2,1fr) !important; }
          #pricing-grid  { grid-template-columns: 1fr !important; }
          #how-grid      { grid-template-columns: 1fr !important; }
          #testi-grid    { grid-template-columns: 1fr !important; }
          #footer-grid   { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 600px) {
          #stats-grid    { grid-template-columns: 1fr !important; }
          #footer-grid   { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}