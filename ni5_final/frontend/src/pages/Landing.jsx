import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  BarChart3, Brain, Globe, Shield, Zap, TrendingUp,
  Star, ArrowRight, CheckCircle2, MessageSquare,
  ChevronDown, Sparkles, Target, LineChart, Bell,
  Users, Building2, Layers, Play
} from 'lucide-react'

/* ─── Animation helpers ─────────────────────────────────────────── */
const fadeUp   = { hidden:{opacity:0,y:32}, show:{opacity:1,y:0} }
const stagger  = { show:{ transition:{ staggerChildren:.1 } } }

/* ─── Data ──────────────────────────────────────────────────────── */
const NAV_LINKS = ['Features','How It Works','Pricing','About']

const FEATURES = [
  { icon: Brain,       color:'#1078c2', label:'AI Sentiment Analysis',   desc:'Deep NLP models classify reviews, tickets and free text — positive, negative, neutral — in milliseconds.' },
  { icon: Globe,       color:'#59d12a', label:'Global Intelligence',     desc:'Aggregate and benchmark review data from any country, language or platform in one unified feed.' },
  { icon: TrendingUp,  color:'#1078c2', label:'Trend Detection',         desc:'Spot emerging product issues or praise trends before they become viral moments.' },
  { icon: MessageSquare,color:'#59d12a',label:'Review Studio',           desc:'Draft, refine and schedule AI-assisted responses to customer reviews at scale.' },
  { icon: Target,      color:'#1078c2', label:'Brand Health Score',      desc:'A single composite metric combining sentiment, volume, velocity and competitor benchmarks.' },
  { icon: Zap,         color:'#59d12a', label:'Smart Tickets',           desc:'Auto-generate support tickets with priority scoring, routing rules and resolution suggestions.' },
  { icon: LineChart,   color:'#1078c2', label:'BI Hub',                  desc:'Pre-built dashboards with exportable charts, cohort analysis and white-label reporting.' },
  { icon: Bell,        color:'#59d12a', label:'Watchlist Alerts',        desc:'Get notified the moment a competitor spikes in reviews or your brand health dips below threshold.' },
]

const STEPS = [
  { n:'01', title:'Connect your sources',   desc:'Paste a URL, upload a CSV or connect via our API. We scrape and normalise data from 50+ review platforms instantly.' },
  { n:'02', title:'AI does the heavy lifting', desc:'Our ML pipeline runs sentiment, topic extraction, anomaly detection and competitive benchmarking — all automatically.' },
  { n:'03', title:'Act on real insights',   desc:'View your dashboard, export reports, respond to reviews, or fire off alerts. Decisions backed by data, not gut feel.' },
]

const STATS = [
  { value:'2.4M+', label:'Reviews analysed daily' },
  { value:'140+',  label:'Supported platforms' },
  { value:'98.2%', label:'Sentiment accuracy' },
  { value:'< 2s',  label:'Average processing time' },
]

const PLANS = [
  {
    name:'Starter', price:'$0', period:'forever', highlight:false,
    desc:'Perfect for indie founders and solo researchers.',
    cta:'Get started free',
    features:['500 reviews / month','3 tracked brands','Sentiment analysis','Basic dashboard','Email support'],
  },
  {
    name:'Pro', price:'$49', period:'/month', highlight:true,
    desc:'For growing teams who need depth and speed.',
    cta:'Start 14-day trial',
    features:['50 000 reviews / month','Unlimited brands','All AI features','BI Hub & exports','Ticket engine','Priority support'],
  },
  {
    name:'Enterprise', price:'Custom', period:'', highlight:false,
    desc:'Tailored for large organisations with complex needs.',
    cta:'Talk to sales',
    features:['Unlimited reviews','White-label reports','SSO & audit logs','Dedicated CSM','SLA guarantee','Custom integrations'],
  },
]

const TESTIMONIALS = [
  { name:'Sarah K.',  role:'Head of CX, Retailco',   text:'NestInsights cut our review-response time by 70%. The AI suggestions are scarily good.' },
  { name:'Ahmed R.',  role:'Product Manager, Techify', text:'The trend detection caught a packaging complaint spike 3 days before it went viral. Saved us a PR nightmare.' },
  { name:'Priya M.',  role:'Founder, DineLocal',       text:'I went from drowning in reviews to having a clear weekly action list. Absolutely love it.' },
]

/* ─── Sub-components ─────────────────────────────────────────────── */

function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header style={{
      position:'fixed', top:0, left:0, right:0, zIndex:100,
      background: scrolled ? 'rgba(255,255,255,0.95)' : 'transparent',
      backdropFilter: scrolled ? 'blur(12px)' : 'none',
      borderBottom: scrolled ? '1px solid #e8edf3' : '1px solid transparent',
      transition:'all .3s ease',
    }}>
      <div style={{maxWidth:1160,margin:'0 auto',padding:'0 24px',display:'flex',alignItems:'center',height:64,gap:32}}>

        {/* Logo */}
        <Link to="/" style={{display:'flex',alignItems:'center',gap:10,textDecoration:'none',flexShrink:0}}>
          <div style={{
            width:36,height:36,borderRadius:10,
            background:'linear-gradient(135deg,#1078c2,#59d12a)',
            display:'flex',alignItems:'center',justifyContent:'center',
            boxShadow:'0 4px 14px rgba(16,120,194,0.35)',
          }}>
            <span style={{color:'#fff',fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:16}}>N</span>
          </div>
          <span style={{fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:18,color:'#0a1628',letterSpacing:'-.02em'}}>
            Nest<span style={{color:'#1078c2'}}>Insights</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav style={{display:'flex',gap:4,flex:1,justifyContent:'center'}}>
          {NAV_LINKS.map(l => (
            <a key={l} href={`#${l.toLowerCase().replace(' ','-')}`}
              style={{
                padding:'6px 14px',borderRadius:8,fontSize:14,fontWeight:500,
                color:'#4a6880',textDecoration:'none',transition:'all .15s',
              }}
              onMouseEnter={e=>{e.target.style.color='#0a1628';e.target.style.background='#f0f5fb'}}
              onMouseLeave={e=>{e.target.style.color='#4a6880';e.target.style.background='transparent'}}
            >{l}</a>
          ))}
        </nav>

        {/* CTA buttons */}
        <div style={{display:'flex',gap:10,alignItems:'center',flexShrink:0}}>
          <Link to="/login" style={{
            padding:'7px 18px',borderRadius:8,fontSize:14,fontWeight:500,
            color:'#1078c2',textDecoration:'none',
            border:'1.5px solid #1078c2',transition:'all .15s',
          }}
            onMouseEnter={e=>{e.currentTarget.style.background='#f0f7ff'}}
            onMouseLeave={e=>{e.currentTarget.style.background='transparent'}}
          >Log in</Link>
          <Link to="/register" style={{
            padding:'7px 18px',borderRadius:8,fontSize:14,fontWeight:600,
            color:'#fff',textDecoration:'none',
            background:'linear-gradient(135deg,#1078c2,#1a8fd1)',
            boxShadow:'0 4px 12px rgba(16,120,194,0.3)',transition:'all .2s',
          }}
            onMouseEnter={e=>{e.currentTarget.style.boxShadow='0 6px 20px rgba(16,120,194,0.45)';e.currentTarget.style.transform='translateY(-1px)'}}
            onMouseLeave={e=>{e.currentTarget.style.boxShadow='0 4px 12px rgba(16,120,194,0.3)';e.currentTarget.style.transform='none'}}
          >Get started free</Link>
        </div>
      </div>
    </header>
  )
}

function Hero() {
  return (
    <section style={{
      minHeight:'100vh',display:'flex',alignItems:'center',
      background:'#ffffff',
      position:'relative',overflow:'hidden',
      paddingTop:80,
    }}>
      {/* Background blobs */}
      <div style={{position:'absolute',top:-120,right:-180,width:600,height:600,borderRadius:'50%',background:'radial-gradient(circle,rgba(16,120,194,0.08) 0%,transparent 70%)',pointerEvents:'none'}} />
      <div style={{position:'absolute',bottom:-100,left:-150,width:500,height:500,borderRadius:'50%',background:'radial-gradient(circle,rgba(89,209,42,0.07) 0%,transparent 70%)',pointerEvents:'none'}} />
      {/* Grid overlay */}
      <div style={{
        position:'absolute',inset:0,pointerEvents:'none',
        backgroundImage:'linear-gradient(#e8edf3 1px,transparent 1px),linear-gradient(90deg,#e8edf3 1px,transparent 1px)',
        backgroundSize:'60px 60px',opacity:.3,
      }} />

      <div style={{maxWidth:1160,margin:'0 auto',padding:'80px 24px',position:'relative',zIndex:1,width:'100%'}}>
        <motion.div variants={stagger} initial="hidden" animate="show"
          style={{display:'flex',flexDirection:'column',alignItems:'center',textAlign:'center',gap:24}}>

          {/* Badge */}
          <motion.div variants={fadeUp}>
            <span style={{
              display:'inline-flex',alignItems:'center',gap:8,
              padding:'6px 16px',borderRadius:999,
              background:'linear-gradient(135deg,rgba(16,120,194,.08),rgba(89,209,42,.08))',
              border:'1px solid rgba(16,120,194,.2)',
              fontSize:13,fontWeight:600,color:'#1078c2',
            }}>
              <Sparkles size={14} />
              AI-powered review intelligence platform
            </span>
          </motion.div>

          {/* H1 */}
          <motion.h1 variants={fadeUp} style={{
            fontFamily:'Syne,sans-serif',fontWeight:800,
            fontSize:'clamp(2.4rem,6vw,4.2rem)',
            lineHeight:1.1,letterSpacing:'-.03em',
            color:'#0a1628',maxWidth:780,
          }}>
            Turn customer reviews into{' '}
            <span style={{
              background:'linear-gradient(135deg,#1078c2,#59d12a)',
              WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',
            }}>
              your sharpest advantage
            </span>
          </motion.h1>

          {/* Sub */}
          <motion.p variants={fadeUp} style={{
            fontSize:'clamp(1rem,2vw,1.2rem)',
            color:'#4a6880',maxWidth:560,lineHeight:1.7,
          }}>
            NestInsights analyses millions of reviews with AI to reveal sentiment trends, competitor gaps and brand health signals — so you can act fast and grow faster.
          </motion.p>

          {/* CTAs */}
          <motion.div variants={fadeUp} style={{display:'flex',gap:14,flexWrap:'wrap',justifyContent:'center'}}>
            <Link to="/register" style={{
              display:'inline-flex',alignItems:'center',gap:8,
              padding:'14px 28px',borderRadius:12,fontSize:15,fontWeight:700,
              color:'#fff',textDecoration:'none',
              background:'linear-gradient(135deg,#1078c2,#1a8fd1)',
              boxShadow:'0 6px 24px rgba(16,120,194,0.35)',transition:'all .2s',
            }}
              onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 10px 32px rgba(16,120,194,.45)'}}
              onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='0 6px 24px rgba(16,120,194,.35)'}}
            >
              Start for free <ArrowRight size={16} />
            </Link>
            <a href="#how-it-works" style={{
              display:'inline-flex',alignItems:'center',gap:8,
              padding:'14px 28px',borderRadius:12,fontSize:15,fontWeight:600,
              color:'#1078c2',textDecoration:'none',
              background:'#fff',border:'1.5px solid #d0e4f5',transition:'all .2s',
            }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor='#1078c2';e.currentTarget.style.background='#f0f7ff'}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor='#d0e4f5';e.currentTarget.style.background='#fff'}}
            >
              <Play size={15} style={{fill:'#1078c2'}} /> See how it works
            </a>
          </motion.div>

          {/* Trust line */}
          <motion.p variants={fadeUp} style={{fontSize:13,color:'#8aabca',display:'flex',alignItems:'center',gap:6}}>
            <CheckCircle2 size={14} style={{color:'#59d12a'}} /> No credit card required &nbsp;·&nbsp;
            <CheckCircle2 size={14} style={{color:'#59d12a'}} /> Free plan always available &nbsp;·&nbsp;
            <CheckCircle2 size={14} style={{color:'#59d12a'}} /> Setup in under 2 minutes
          </motion.p>

          {/* Dashboard preview mockup */}
          <motion.div variants={fadeUp} style={{
            marginTop:16,width:'100%',maxWidth:900,
            borderRadius:20,overflow:'hidden',
            boxShadow:'0 32px 80px rgba(16,120,194,.15), 0 0 0 1px rgba(16,120,194,.1)',
            background:'#f4f8fd',border:'1px solid #d8e8f5',
          }}>
            {/* Fake browser bar */}
            <div style={{background:'#eaf1f9',padding:'10px 16px',borderBottom:'1px solid #d8e8f5',display:'flex',alignItems:'center',gap:8}}>
              <span style={{width:12,height:12,borderRadius:'50%',background:'#f87171',display:'inline-block'}} />
              <span style={{width:12,height:12,borderRadius:'50%',background:'#fbbf24',display:'inline-block'}} />
              <span style={{width:12,height:12,borderRadius:'50%',background:'#59d12a',display:'inline-block'}} />
              <div style={{flex:1,background:'#fff',borderRadius:6,padding:'4px 12px',marginLeft:8,fontSize:12,color:'#8aabca',border:'1px solid #d8e8f5'}}>
                app.nestinsights.io/dashboard
              </div>
            </div>
            {/* Mock dashboard content */}
            <div style={{padding:24,display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16}}>
              {[
                {label:'Brand Health',value:'84',unit:'/100',color:'#1078c2',up:true},
                {label:'Sentiment Score',value:'76%',unit:'',color:'#59d12a',up:true},
                {label:'Reviews This Week',value:'1,248',unit:'',color:'#1078c2',up:true},
                {label:'Open Tickets',value:'23',unit:'',color:'#f59e0b',up:false},
              ].map(s => (
                <div key={s.label} style={{background:'#fff',borderRadius:12,padding:'16px',border:'1px solid #e0ecf7'}}>
                  <p style={{fontSize:11,color:'#8aabca',fontWeight:600,textTransform:'uppercase',letterSpacing:'.08em',marginBottom:6}}>{s.label}</p>
                  <p style={{fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:26,color:s.color}}>{s.value}<span style={{fontSize:13,color:'#aac0d4'}}>{s.unit}</span></p>
                  <p style={{fontSize:11,color:s.up?'#59d12a':'#f87171',marginTop:4,fontWeight:600}}>{s.up?'↑ +4.2%':'↓ -2 from last week'}</p>
                </div>
              ))}
            </div>
            <div style={{padding:'0 24px 24px',display:'grid',gridTemplateColumns:'2fr 1fr',gap:16}}>
              {/* Fake chart */}
              <div style={{background:'#fff',borderRadius:12,padding:'16px',border:'1px solid #e0ecf7',height:120,display:'flex',flexDirection:'column',justifyContent:'space-between'}}>
                <p style={{fontSize:12,color:'#8aabca',fontWeight:600}}>Sentiment trend — last 30 days</p>
                <svg width="100%" height={70} viewBox="0 0 400 70">
                  <polyline points="0,55 40,48 80,42 120,50 160,30 200,22 240,28 280,15 320,18 360,10 400,8"
                    fill="none" stroke="url(#g)" strokeWidth={3} strokeLinecap="round" />
                  <polyline points="0,55 40,48 80,42 120,50 160,30 200,22 240,28 280,15 320,18 360,10 400,8 400,70 0,70"
                    fill="url(#gfill)" />
                  <defs>
                    <linearGradient id="g" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#1078c2"/>
                      <stop offset="100%" stopColor="#59d12a"/>
                    </linearGradient>
                    <linearGradient id="gfill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1078c2" stopOpacity=".15"/>
                      <stop offset="100%" stopColor="#1078c2" stopOpacity="0"/>
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              {/* Fake top topics */}
              <div style={{background:'#fff',borderRadius:12,padding:'16px',border:'1px solid #e0ecf7',height:120}}>
                <p style={{fontSize:12,color:'#8aabca',fontWeight:600,marginBottom:10}}>Top topics</p>
                {[['Delivery speed','#59d12a',72],['Product quality','#1078c2',65],['Customer support','#f59e0b',48]].map(([t,c,w])=>(
                  <div key={t} style={{marginBottom:7}}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
                      <span style={{fontSize:11,color:'#4a6880'}}>{t}</span>
                      <span style={{fontSize:11,fontWeight:600,color:c}}>{w}%</span>
                    </div>
                    <div style={{height:4,background:'#f0f5fb',borderRadius:4}}>
                      <div style={{height:4,width:`${w}%`,background:c,borderRadius:4,opacity:.7}} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll cue */}
      <a href="#stats" style={{position:'absolute',bottom:28,left:'50%',transform:'translateX(-50%)',color:'#c0d4e8',animation:'bounce 2s infinite',display:'flex',flexDirection:'column',alignItems:'center',gap:4,textDecoration:'none',fontSize:11}}>
        <span style={{color:'#8aabca'}}>Scroll to explore</span>
        <ChevronDown size={20} />
      </a>
      <style>{`@keyframes bounce{0%,100%{transform:translateX(-50%) translateY(0)}50%{transform:translateX(-50%) translateY(6px)}}`}</style>
    </section>
  )
}

function Stats() {
  return (
    <section id="stats" style={{background:'linear-gradient(135deg,#1078c2,#0d65ad)',padding:'56px 24px'}}>
      <div style={{maxWidth:1160,margin:'0 auto',display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:0,textAlign:'center'}}>
        {STATS.map((s,i)=>(
          <motion.div key={s.label}
            initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:i*.1}}
            style={{padding:'0 24px',borderRight:i<STATS.length-1?'1px solid rgba(255,255,255,.15)':undefined}}>
            <p style={{fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:'2.4rem',color:'#fff',lineHeight:1}}>{s.value}</p>
            <p style={{fontSize:14,color:'rgba(255,255,255,.7)',marginTop:6,fontWeight:500}}>{s.label}</p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

function Features() {
  return (
    <section id="features" style={{background:'#f8fbff',padding:'100px 24px'}}>
      <div style={{maxWidth:1160,margin:'0 auto'}}>
        <motion.div initial={{opacity:0,y:24}} whileInView={{opacity:1,y:0}} viewport={{once:true}}
          style={{textAlign:'center',marginBottom:64}}>
          <span style={{display:'inline-block',padding:'4px 14px',borderRadius:999,background:'rgba(16,120,194,.08)',border:'1px solid rgba(16,120,194,.15)',fontSize:12,fontWeight:700,color:'#1078c2',marginBottom:16,letterSpacing:'.05em',textTransform:'uppercase'}}>
            Platform features
          </span>
          <h2 style={{fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:'clamp(1.8rem,4vw,2.8rem)',color:'#0a1628',letterSpacing:'-.02em',marginBottom:16}}>
            Everything you need to master{' '}
            <span style={{color:'#1078c2'}}>customer intelligence</span>
          </h2>
          <p style={{fontSize:16,color:'#4a6880',maxWidth:520,margin:'0 auto',lineHeight:1.7}}>
            Eight powerful modules working together so you never miss a signal.
          </p>
        </motion.div>

        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:24}}>
          {FEATURES.map((f,i)=>(
            <motion.div key={f.label}
              initial={{opacity:0,y:24}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:(i%4)*.08}}
              style={{
                background:'#fff',borderRadius:16,padding:28,
                border:'1px solid #e0ecf7',
                transition:'all .2s',cursor:'default',
              }}
              whileHover={{y:-4,boxShadow:'0 12px 40px rgba(16,120,194,.1)',borderColor:'#b8d8f5'}}
            >
              <div style={{
                width:48,height:48,borderRadius:12,
                background:`${f.color}14`,
                display:'flex',alignItems:'center',justifyContent:'center',
                marginBottom:16,
              }}>
                <f.icon size={22} style={{color:f.color}} />
              </div>
              <h3 style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:16,color:'#0a1628',marginBottom:8}}>{f.label}</h3>
              <p style={{fontSize:14,color:'#4a6880',lineHeight:1.65}}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function HowItWorks() {
  return (
    <section id="how-it-works" style={{background:'#ffffff',padding:'100px 24px'}}>
      <div style={{maxWidth:1160,margin:'0 auto'}}>
        <motion.div initial={{opacity:0,y:24}} whileInView={{opacity:1,y:0}} viewport={{once:true}}
          style={{textAlign:'center',marginBottom:72}}>
          <span style={{display:'inline-block',padding:'4px 14px',borderRadius:999,background:'rgba(89,209,42,.08)',border:'1px solid rgba(89,209,42,.2)',fontSize:12,fontWeight:700,color:'#3a9a12',marginBottom:16,letterSpacing:'.05em',textTransform:'uppercase'}}>
            How it works
          </span>
          <h2 style={{fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:'clamp(1.8rem,4vw,2.8rem)',color:'#0a1628',letterSpacing:'-.02em'}}>
            Live insights in{' '}
            <span style={{color:'#59d12a'}}>three simple steps</span>
          </h2>
        </motion.div>

        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:40,position:'relative'}}>
          {/* connector line */}
          <div style={{position:'absolute',top:36,left:'16.5%',right:'16.5%',height:2,background:'linear-gradient(90deg,#1078c2,#59d12a)',opacity:.25,zIndex:0}} />
          {STEPS.map((s,i)=>(
            <motion.div key={s.n}
              initial={{opacity:0,y:28}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:i*.15}}
              style={{textAlign:'center',position:'relative',zIndex:1}}>
              <div style={{
                width:72,height:72,borderRadius:'50%',
                background:'linear-gradient(135deg,#1078c2,#59d12a)',
                display:'flex',alignItems:'center',justifyContent:'center',
                margin:'0 auto 24px',
                boxShadow:'0 8px 24px rgba(16,120,194,.25)',
              }}>
                <span style={{fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:20,color:'#fff'}}>{s.n}</span>
              </div>
              <h3 style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:18,color:'#0a1628',marginBottom:12}}>{s.title}</h3>
              <p style={{fontSize:14,color:'#4a6880',lineHeight:1.7,maxWidth:260,margin:'0 auto'}}>{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Testimonials() {
  return (
    <section style={{background:'#f8fbff',padding:'100px 24px'}}>
      <div style={{maxWidth:1160,margin:'0 auto'}}>
        <motion.div initial={{opacity:0,y:24}} whileInView={{opacity:1,y:0}} viewport={{once:true}}
          style={{textAlign:'center',marginBottom:64}}>
          <h2 style={{fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:'clamp(1.8rem,4vw,2.6rem)',color:'#0a1628',letterSpacing:'-.02em',marginBottom:12}}>
            Loved by teams who care about customers
          </h2>
          <p style={{fontSize:15,color:'#4a6880'}}>Join thousands of companies already using NestInsights.</p>
        </motion.div>

        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:24}}>
          {TESTIMONIALS.map((t,i)=>(
            <motion.div key={t.name}
              initial={{opacity:0,y:24}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:i*.1}}
              style={{background:'#fff',borderRadius:16,padding:28,border:'1px solid #e0ecf7'}}>
              <div style={{display:'flex',gap:4,marginBottom:16}}>
                {[...Array(5)].map((_,j)=><Star key={j} size={14} style={{fill:'#f59e0b',color:'#f59e0b'}} />)}
              </div>
              <p style={{fontSize:14,color:'#4a6880',lineHeight:1.7,marginBottom:20,fontStyle:'italic'}}>"{t.text}"</p>
              <div style={{display:'flex',alignItems:'center',gap:12}}>
                <div style={{
                  width:40,height:40,borderRadius:'50%',
                  background:'linear-gradient(135deg,#1078c2,#59d12a)',
                  display:'flex',alignItems:'center',justifyContent:'center',
                  fontFamily:'Syne,sans-serif',fontWeight:700,color:'#fff',fontSize:15,
                }}>
                  {t.name[0]}
                </div>
                <div>
                  <p style={{fontWeight:600,fontSize:14,color:'#0a1628'}}>{t.name}</p>
                  <p style={{fontSize:12,color:'#8aabca'}}>{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Pricing() {
  return (
    <section id="pricing" style={{background:'#ffffff',padding:'100px 24px'}}>
      <div style={{maxWidth:1160,margin:'0 auto'}}>
        <motion.div initial={{opacity:0,y:24}} whileInView={{opacity:1,y:0}} viewport={{once:true}}
          style={{textAlign:'center',marginBottom:64}}>
          <span style={{display:'inline-block',padding:'4px 14px',borderRadius:999,background:'rgba(16,120,194,.08)',border:'1px solid rgba(16,120,194,.15)',fontSize:12,fontWeight:700,color:'#1078c2',marginBottom:16,letterSpacing:'.05em',textTransform:'uppercase'}}>
            Pricing
          </span>
          <h2 style={{fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:'clamp(1.8rem,4vw,2.8rem)',color:'#0a1628',letterSpacing:'-.02em',marginBottom:12}}>
            Simple, transparent pricing
          </h2>
          <p style={{fontSize:15,color:'#4a6880'}}>Start free. Upgrade when you're ready. Cancel anytime.</p>
        </motion.div>

        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:24,alignItems:'start'}}>
          {PLANS.map((p,i)=>(
            <motion.div key={p.name}
              initial={{opacity:0,y:24}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:i*.1}}
              style={{
                background: p.highlight ? 'linear-gradient(160deg,#1078c2 0%,#0d65ad 100%)' : '#fff',
                borderRadius:20,padding:'36px 28px',
                border: p.highlight ? 'none' : '1px solid #e0ecf7',
                boxShadow: p.highlight ? '0 20px 60px rgba(16,120,194,.3)' : 'none',
                transform: p.highlight ? 'scale(1.04)' : 'none',
                position:'relative',
              }}>
              {p.highlight && (
                <span style={{
                  position:'absolute',top:-14,left:'50%',transform:'translateX(-50%)',
                  background:'linear-gradient(135deg,#59d12a,#3a9a12)',
                  color:'#fff',padding:'4px 16px',borderRadius:999,fontSize:12,fontWeight:700,
                  boxShadow:'0 4px 12px rgba(89,209,42,.3)',
                }}>Most Popular</span>
              )}
              <p style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:18,color:p.highlight?'rgba(255,255,255,.8)':'#4a6880',marginBottom:8}}>{p.name}</p>
              <div style={{display:'flex',alignItems:'baseline',gap:4,marginBottom:8}}>
                <span style={{fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:40,color:p.highlight?'#fff':'#0a1628'}}>{p.price}</span>
                <span style={{fontSize:14,color:p.highlight?'rgba(255,255,255,.6)':'#8aabca'}}>{p.period}</span>
              </div>
              <p style={{fontSize:14,color:p.highlight?'rgba(255,255,255,.7)':'#4a6880',marginBottom:28,lineHeight:1.6}}>{p.desc}</p>
              <ul style={{listStyle:'none',marginBottom:32,display:'flex',flexDirection:'column',gap:12}}>
                {p.features.map(f=>(
                  <li key={f} style={{display:'flex',gap:10,alignItems:'flex-start',fontSize:14,color:p.highlight?'rgba(255,255,255,.85)':'#4a6880'}}>
                    <CheckCircle2 size={16} style={{color:p.highlight?'#59d12a':'#59d12a',flexShrink:0,marginTop:1}} />
                    {f}
                  </li>
                ))}
              </ul>
              <Link to="/register" style={{
                display:'block',textAlign:'center',
                padding:'12px',borderRadius:10,fontSize:14,fontWeight:600,
                textDecoration:'none',
                background: p.highlight ? '#fff' : 'linear-gradient(135deg,#1078c2,#1a8fd1)',
                color: p.highlight ? '#1078c2' : '#fff',
                transition:'all .2s',
              }}
                onMouseEnter={e=>{e.currentTarget.style.opacity='.9';e.currentTarget.style.transform='translateY(-1px)'}}
                onMouseLeave={e=>{e.currentTarget.style.opacity='1';e.currentTarget.style.transform='none'}}
              >{p.cta}</Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function CTA() {
  return (
    <section style={{background:'#f8fbff',padding:'100px 24px'}}>
      <div style={{maxWidth:760,margin:'0 auto',textAlign:'center'}}>
        <motion.div initial={{opacity:0,y:24}} whileInView={{opacity:1,y:0}} viewport={{once:true}}
          style={{
            background:'linear-gradient(135deg,#1078c2,#0d65ad)',
            borderRadius:24,padding:'64px 40px',
            boxShadow:'0 24px 80px rgba(16,120,194,.25)',
            position:'relative',overflow:'hidden',
          }}>
          <div style={{position:'absolute',top:-60,right:-60,width:240,height:240,borderRadius:'50%',background:'rgba(89,209,42,.12)'}} />
          <div style={{position:'absolute',bottom:-40,left:-40,width:180,height:180,borderRadius:'50%',background:'rgba(255,255,255,.06)'}} />
          <div style={{position:'relative',zIndex:1}}>
            <span style={{display:'inline-flex',alignItems:'center',gap:6,padding:'5px 14px',borderRadius:999,background:'rgba(89,209,42,.2)',border:'1px solid rgba(89,209,42,.3)',fontSize:12,fontWeight:700,color:'#59d12a',marginBottom:20}}>
              <Sparkles size={13} /> Free to start
            </span>
            <h2 style={{fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:'clamp(1.8rem,4vw,2.6rem)',color:'#fff',letterSpacing:'-.02em',marginBottom:16,lineHeight:1.2}}>
              Ready to unlock your review intelligence?
            </h2>
            <p style={{fontSize:16,color:'rgba(255,255,255,.75)',marginBottom:36,lineHeight:1.7}}>
              Sign up in 30 seconds, connect your first brand, and see AI insights flowing within minutes.
            </p>
            <div style={{display:'flex',gap:14,justifyContent:'center',flexWrap:'wrap'}}>
              <Link to="/register" style={{
                display:'inline-flex',alignItems:'center',gap:8,
                padding:'14px 32px',borderRadius:12,fontSize:15,fontWeight:700,
                color:'#1078c2',textDecoration:'none',background:'#fff',
                boxShadow:'0 4px 20px rgba(0,0,0,.15)',transition:'all .2s',
              }}
                onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 8px 30px rgba(0,0,0,.2)'}}
                onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='0 4px 20px rgba(0,0,0,.15)'}}
              >
                Create your free account <ArrowRight size={16} />
              </Link>
              <Link to="/login" style={{
                display:'inline-flex',alignItems:'center',gap:8,
                padding:'14px 32px',borderRadius:12,fontSize:15,fontWeight:600,
                color:'#fff',textDecoration:'none',
                border:'1.5px solid rgba(255,255,255,.35)',transition:'all .2s',
              }}
                onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,.1)'}}
                onMouseLeave={e=>{e.currentTarget.style.background='transparent'}}
              >
                Log in to dashboard
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer style={{background:'#0a1628',padding:'60px 24px 32px'}}>
      <div style={{maxWidth:1160,margin:'0 auto'}}>
        <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr 1fr',gap:48,marginBottom:48,paddingBottom:48,borderBottom:'1px solid rgba(255,255,255,.08)'}}>
          {/* Brand col */}
          <div>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
              <div style={{width:32,height:32,borderRadius:8,background:'linear-gradient(135deg,#1078c2,#59d12a)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <span style={{color:'#fff',fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:14}}>N</span>
              </div>
              <span style={{fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:16,color:'#fff'}}>NestInsights</span>
            </div>
            <p style={{fontSize:14,color:'rgba(255,255,255,.45)',lineHeight:1.7,maxWidth:260}}>
              AI-powered review intelligence that helps modern brands grow through customer understanding.
            </p>
          </div>
          {/* Link cols */}
          {[
            { title:'Product',  links:['Features','How it works','Pricing','Changelog'] },
            { title:'Company',  links:['About','Blog','Careers','Press'] },
            { title:'Support',  links:['Documentation','Help centre','Status','Contact us'] },
          ].map(col=>(
            <div key={col.title}>
              <p style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:13,color:'rgba(255,255,255,.7)',marginBottom:16,textTransform:'uppercase',letterSpacing:'.06em'}}>{col.title}</p>
              {col.links.map(l=>(
                <a key={l} href="#" style={{display:'block',fontSize:14,color:'rgba(255,255,255,.4)',textDecoration:'none',marginBottom:10,transition:'color .15s'}}
                  onMouseEnter={e=>{e.target.style.color='rgba(255,255,255,.8)'}}
                  onMouseLeave={e=>{e.target.style.color='rgba(255,255,255,.4)'}}
                >{l}</a>
              ))}
            </div>
          ))}
        </div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <p style={{fontSize:13,color:'rgba(255,255,255,.3)'}}>© 2025 NestInsights. All rights reserved.</p>
          <div style={{display:'flex',gap:16}}>
            {['Privacy','Terms','Cookies'].map(l=>(
              <a key={l} href="#" style={{fontSize:13,color:'rgba(255,255,255,.3)',textDecoration:'none'}}>{l}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}

/* ─── Main export ────────────────────────────────────────────────── */
export default function Landing() {
  // Force white background for landing page body
  useEffect(() => {
    document.body.style.background = '#ffffff'
    return () => { document.body.style.background = '' }
  }, [])

  return (
    <div style={{fontFamily:'DM Sans,sans-serif',background:'#ffffff',color:'#0a1628'}}>
      <Navbar />
      <Hero />
      <Stats />
      <Features />
      <HowItWorks />
      <Testimonials />
      <Pricing />
      <CTA />
      <Footer />
    </div>
  )
}

