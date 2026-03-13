import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  GitBranch, Globe2, Brain, Database, Shield, Users, Upload,
  Search, MessageSquare, BarChart2, Ticket, Eye, Star, Sparkles,
  TrendingUp, RefreshCw, Lock, Key, FileText, Cpu, Zap, Network,
  ChevronDown, ChevronRight, X, Code, Server, Monitor, ArrowRight,
  AlertTriangle, CheckCircle, Layers, Package, Radio
} from 'lucide-react'

// ─── Full system workflow data ────────────────────────────────────────────────
const WORKFLOW = [
  {
    id: 'auth',
    icon: Lock,
    color: '#6366f1',
    title: 'Authentication & User Management',
    subtitle: 'JWT-based login, registration, role isolation',
    overview: 'Every request to the backend passes through a JWT authentication layer. Users are completely isolated — each user only ever sees their own data. Admin has a special role that grants access to all data and admin-only pages.',
    nodes: [
      {
        label: 'Register',
        icon: Users,
        desc: 'POST /api/register',
        detail: 'User submits username + password. Password is hashed with bcrypt (cost=12). A new row is inserted in the users table with role="user". Duplicate usernames are rejected with 400.',
      },
      {
        label: 'Login',
        icon: Key,
        desc: 'POST /api/login',
        detail: 'Credentials are verified against the bcrypt hash. On success, a JWT token is issued (HS256, 12-hour expiry) containing user_id, username, role. Token is stored in localStorage on the frontend via AppContext.',
      },
      {
        label: 'JWT Guard',
        icon: Shield,
        desc: 'Depends(get_current_user)',
        detail: 'Every protected endpoint uses Depends(get_current_user). The Bearer token is decoded and verified. If invalid/expired, 401 is returned. opt_user() allows anonymous access but still decodes if token present.',
      },
      {
        label: 'Role Check',
        icon: Star,
        desc: 'user.role === "admin"',
        detail: 'Admin role grants: viewing all users\' sessions in history, full database admin panel, and the Workflow page. Regular users strictly see only their own sessions, analyses and tickets.',
      },
      {
        label: 'Data Isolation',
        icon: Database,
        desc: 'user_id FK on all tables',
        detail: 'Every session, ticket, watchlist item and alert is stored with user_id. All SELECT queries filter by user_id=? using parameterized queries. Admin bypasses the filter to see everything.',
      },
    ],
    network: [
      'Browser → POST /api/login → main.py verify_password()',
      'main.py → create_access_token(user_id, role) → JWT',
      'JWT stored in localStorage → AppContext.token',
      'Every API call: axios header Authorization: Bearer <token>',
      'FastAPI: Depends(get_current_user) → decode JWT → user dict',
      'All DB queries use WHERE user_id=? (parameterized)',
    ],
  },
  {
    id: 'analyze',
    icon: Search,
    color: '#0ea5e9',
    title: 'Review Analysis Pipeline',
    subtitle: 'URL scraping, CSV upload, single text — all feed into ML engine',
    overview: 'Three entry points all converge into the same batch_analyze() pipeline: scrape a URL, upload a CSV/Excel, or type a single review. The ML engine (TF-IDF + LinearSVC) classifies each text, then AI generates a summary.',
    nodes: [
      {
        label: 'URL Scrape',
        icon: Globe2,
        desc: 'POST /api/analyze/url',
        detail: 'scraper.py handles Amazon, Google, Trustpilot, Yelp, and generic HTML. Uses scrape.do proxy service to bypass bot protection. Returns up to 300 reviews. Each review text is deduplicated by SHA-256 hash.',
      },
      {
        label: 'CSV/Excel Upload',
        icon: Upload,
        desc: 'POST /api/analyze/dataset',
        detail: '_detect_text_col() auto-detects the best text column by picking the object-dtype column with the highest average string length. You can also manually specify text_col. Supports .csv, .xlsx, .xls with chardet encoding detection.',
      },
      {
        label: 'Single Text',
        icon: FileText,
        desc: 'POST /api/analyze/text',
        detail: 'Single review typed directly. Runs through the full ML pipeline identically to batch. Returns sentiment, score, keywords, language, translation and a one-line insight. Results shown instantly on screen.',
      },
      {
        label: 'ML Engine',
        icon: Cpu,
        desc: 'ml_engine.batch_analyze()',
        detail: 'TF-IDF (12,000 features, ngrams 1-3, sublinear_tf) + LinearSVC (C=1.5). Trained on 5,500+ labeled reviews (positive/negative/neutral). For texts under 6 words, falls back to rule-based lexical scoring. Returns: sentiment, score (−1 to +1), keywords, aspect tags.',
      },
      {
        label: 'Language Detection',
        icon: Globe2,
        desc: 'langdetect + deep-translator',
        detail: 'langdetect identifies the language of each review. If non-English, deep-translator (Google Translate backend, free) translates to English and stores both original_text and translated_text. The ML model always runs on English text.',
      },
      {
        label: 'AI Summary',
        icon: Brain,
        desc: 'ai_module.generate_insights()',
        detail: 'After batch analysis, summary_stats() computes totals. Then Claude (claude-opus-4-5) is called with the stats to generate a 3-4 sentence executive insight. Falls back to a deterministic template if no API key is set.',
      },
      {
        label: 'Session Save',
        icon: Database,
        desc: '_save_session() → SQLite',
        detail: 'Results are saved as a session row (session_id, user_id, name, source_type, stats, ai_summary) plus individual review rows in the reviews table. session_id is a 16-char UUID used for all subsequent lookups.',
      },
    ],
    network: [
      'Frontend Analyze.jsx → api.analyze.url(url) or api.analyze.dataset(file)',
      'Backend: scraper.py scrape_reviews(url) → list of text strings',
      'ml_engine.batch_analyze(texts) → [{text, sentiment, score, keywords}]',
      '_detect_lang(text) → langdetect → ISO code',
      '_try_translate(result) → deep-translator → translated_text',
      'summary_stats(results) → {positive_count, avg_score, top_keywords, ...}',
      'ai_module.generate_insights(stats, name) → Claude API → ai_summary string',
      '_save_session(conn, session_id, user_id, ..., results, ai_summary)',
      'Return: {session_id, count, results, stats, ai_summary}',
    ],
  },
  {
    id: 'ml',
    icon: Cpu,
    color: '#8b5cf6',
    title: 'ML Engine — Sentiment & Ticket Classification',
    subtitle: 'TF-IDF + SVC trained on 10,000+ samples, no cloud dependencies',
    overview: 'Two fully offline ML models run at startup. The sentiment model classifies reviews as positive/negative/neutral. The ticket model classifies support tickets into 8 categories. Both load CSV training data on boot and retrain every restart.',
    nodes: [
      {
        label: 'Sentiment Model',
        icon: Star,
        desc: 'TF-IDF + LinearSVC (C=1.5)',
        detail: 'Features: TF-IDF with 12,000 max features, ngrams (1,3), sublinear_tf=True. Classifier: SVC with linear kernel, C=1.5, probability=True, max_iter=5000. Trained on built-in samples + review_training_data.csv (5,500 rows total).',
      },
      {
        label: 'Ticket Classifier',
        icon: Ticket,
        desc: 'TF-IDF + LinearSVC (C=1.2)',
        detail: '8 categories: Technical Issue, Billing/Payment, Refund/Return, Delivery/Shipping, Account/Login, Feature Request, Complaint/Abuse, Spam. Trained on ticket_training_data.csv (5,000+ rows). Each ticket also gets urgency score and SLA hours.',
      },
      {
        label: 'CSV Training Data',
        icon: FileText,
        desc: 'review_training_data.csv + ticket_training_data.csv',
        detail: 'At startup, ml_engine._load_csv_data() checks for both CSV files next to ml_engine.py. If found, they are combined with the built-in hardcoded samples and the models are retrained. Drop in better CSVs to improve accuracy without changing code.',
      },
      {
        label: 'Lexical Fallback',
        icon: Zap,
        desc: 'Rule-based for short texts',
        detail: 'Texts under 6 words bypass ML (not enough signal). Instead, a lexical scorer counts positive/negative word hits from curated word lists. This handles short inputs like "great!" or "broken" reliably.',
      },
      {
        label: 'Fake Review Detection',
        icon: AlertTriangle,
        desc: '_detect_fake() heuristics',
        detail: 'Each review is scored for: generic phrasing patterns, repeated punctuation, suspiciously short text, all-caps, and verified purchase signals. fake_score > 0.6 flags the review. Aggregated as fake_count in session stats.',
      },
      {
        label: 'Aspect Extraction',
        icon: Layers,
        desc: 'Keyword + aspect tagging',
        detail: 'After sentiment, keywords are extracted by TF-IDF weight. Aspect tags (delivery, quality, price, service, packaging) are matched by keyword presence. These feed the Insights page aspect breakdown chart.',
      },
    ],
    network: [
      'Server startup: ml_engine.py loaded → _build_sentiment_model()',
      '_load_csv_data("review_training_data.csv") → 5500 rows',
      '_load_csv_data("ticket_training_data.csv") → 5000 rows',
      'Pipeline(TfidfVectorizer, SVC).fit(texts, labels) → model object',
      'batch_analyze(texts): for each text → _SENT_MODEL.predict_proba()',
      'If len(text.split()) < 6 → _lexical_score(text) instead',
      'batch_classify(texts): → _TICKET_MODEL.predict() + urgency_score()',
      'Models stay in memory for fast inference (no reload per request)',
    ],
  },
  {
    id: 'sessions',
    icon: Database,
    color: '#10b981',
    title: 'Sessions & History',
    subtitle: 'Every analysis is stored as a session; history is fully searchable',
    overview: 'Every analysis (URL, CSV, batch, single text) creates a session. Sessions are the core data unit — all other features (compare, trends, insights, watchlist) reference session IDs. Sessions belong to users and are strictly isolated.',
    nodes: [
      {
        label: 'Session Create',
        icon: CheckCircle,
        desc: '_save_session()',
        detail: 'Inserts into sessions table: session_id (16-char UUID), user_id (FK), name, source_type (url/dataset/batch/text), source_url, source_file, total_reviews, positive/negative/neutral counts, avg_score, top_keywords JSON, ai_summary, tags JSON, created_at.',
      },
      {
        label: 'History List',
        icon: Eye,
        desc: 'GET /api/sessions',
        detail: 'Returns sessions filtered by user_id (admin sees all). Supports search by name/URL, filter by source_type, pagination with skip/limit. Regular users only see their own rows — no cross-user leakage.',
      },
      {
        label: 'Session Detail',
        icon: FileText,
        desc: 'GET /api/sessions/{sid}',
        detail: 'Returns the session row plus all individual reviews from the reviews table. Includes: text, original_text, translated_text, language, sentiment, score, keywords, aspects, fake_score, hash_value. Used by SessionDetail.jsx for full drill-down.',
      },
      {
        label: 'Tags & Labels',
        icon: Star,
        desc: 'PUT /api/sessions/{sid}/tags',
        detail: 'Tags are stored as a JSON array on the session row. Users can label sessions (e.g. "Q1 2025", "Product Launch"). Tags are searchable and shown in History list as colored chips.',
      },
      {
        label: 'Session Delete',
        icon: X,
        desc: 'DELETE /api/sessions/{sid}',
        detail: 'Deletes the session row. Associated reviews in the reviews table are also cascade-deleted (ON DELETE CASCADE). Only the session owner (or admin) can delete.',
      },
      {
        label: 'Export CSV',
        icon: Upload,
        desc: 'GET /api/sessions/{sid}/export',
        detail: 'Streams all reviews for the session as a CSV file download. Includes all columns: text, sentiment, score, language, keywords, aspects, fake_score, hash. Useful for external analysis in Excel.',
      },
    ],
    network: [
      'Analyze completes → _save_session() writes to SQLite sessions table',
      'Also inserts N rows into reviews table (one per review)',
      'History.jsx → GET /api/sessions?search=&source_type=&skip=0&limit=50',
      'Backend: SELECT * FROM sessions WHERE user_id=? ORDER BY created_at DESC',
      'SessionDetail.jsx → GET /api/sessions/{sid} → session + reviews[]',
      'Tags: PUT /api/sessions/{sid}/tags → UPDATE sessions SET tags=?',
      'Export: GET /api/sessions/{sid}/export → StreamingResponse CSV',
    ],
  },
  {
    id: 'ai',
    icon: Brain,
    color: '#f59e0b',
    title: 'AI Features — Claude Integration',
    subtitle: 'Multi-turn chat, insights, studio tools — all powered by claude-opus-4-5',
    overview: 'Claude (claude-opus-4-5) is integrated in 6 places: session insights, AI chat per session, trend analysis, Review Studio tools, BI auto-reports, and Global Intelligence product generation. All calls go through ai_module._call_claude(). Falls back gracefully if no API key.',
    nodes: [
      {
        label: 'Session Chat',
        icon: MessageSquare,
        desc: 'POST /api/chat — multi-turn',
        detail: 'SessionDetail.jsx maintains a full conversation history array. Each message sends the complete history to the backend. ai_module.ai_chat(question, context, history) passes history as messages[] to Claude. System prompt contains session stats, top keywords, sentiment breakdown as context.',
      },
      {
        label: 'Session Insights',
        icon: Brain,
        desc: 'generate_insights(stats, name)',
        detail: 'Called after every analysis. Sends summary stats to Claude with prompt asking for 3-4 sentences of business insight. Output is stored in the ai_summary field of the session. Also used in generate_ticket_insights() for ticket sessions.',
      },
      {
        label: 'Trends AI',
        icon: TrendingUp,
        desc: 'generate_trends_insights()',
        detail: 'Called from GET /api/trends/keywords. Takes the top 60 keywords across all user sessions and asks Claude to identify macro trends and suggest actions. Shown at the top of the Trends page.',
      },
      {
        label: 'Review Studio',
        icon: Sparkles,
        desc: '5 studio endpoints',
        detail: 'POST /api/studio/bulk-reply: generate replies for multiple reviews at once. /coach-reply: score and improve a draft reply. /template-reply: industry-specific template generation. /translate-reply: translate a reply to 15 languages. /score-reply: 5-dimension quality scoring.',
      },
      {
        label: 'BI Auto Report',
        icon: BarChart2,
        desc: 'POST /api/bi/auto-report',
        detail: 'Sends all BI metrics (revenue impact, NPS estimate, churn risk, forecasting data, benchmarks) to Claude and asks for a 4-paragraph executive report. Output is a plain text report downloadable as .txt.',
      },
      {
        label: 'Global Intelligence',
        icon: Globe2,
        desc: 'GET /api/global/ai-intelligence',
        detail: 'Fetches real headlines from GDELT (free, no key). Sends them to Claude with today\'s date asking for 20 trending products with demand scores, margins, urgency and business insights. Cached 15 minutes. Falls back to rule-based if no API key.',
      },
    ],
    network: [
      'All AI calls: ai_module._call_claude(prompt, system, max_tokens)',
      '_call_claude → anthropic.Anthropic(api_key) → client.messages.create()',
      'Model: claude-opus-4-5. If API key missing → fallback string returned',
      'ai_chat(question, context, history):',
      '  system = session stats + keywords as context block',
      '  messages = [...history, {role:user, content:question}]',
      '  → Claude streams back answer → stored in frontend history state',
      'Review Studio: per-tool system prompts with brand voice injected',
      'Global Intel: GDELT headlines → Claude → JSON products array → cached',
    ],
  },
  {
    id: 'tickets',
    icon: Ticket,
    color: '#ef4444',
    title: 'Support Ticket System',
    subtitle: 'Upload CSV of customer support tickets → AI triage + auto-classification',
    overview: 'A separate pipeline from reviews. Ticket sessions classify support messages into 8 categories, assign urgency scores, SLA hours, and AI-generated suggested responses. Useful for customer service teams.',
    nodes: [
      {
        label: 'Ticket Upload',
        icon: Upload,
        desc: 'POST /api/tickets/upload',
        detail: 'Upload a CSV/Excel of customer messages. Same column detection logic as review upload. Each text goes through ticket_engine.batch_classify(). Results saved in ticket_sessions and support_tickets tables.',
      },
      {
        label: 'Classification',
        icon: Cpu,
        desc: 'ticket_engine.classify_ticket()',
        detail: 'ML model (TF-IDF + SVC, 5000 training rows) predicts: category (8 classes), subcategory, priority (critical/high/medium/low), urgency_score (0-10), escalate flag (boolean). Then rule-based pure-Python sentiment gives positive/negative/neutral.',
      },
      {
        label: 'SLA + Actions',
        icon: AlertTriangle,
        desc: 'SLA hours by category',
        detail: 'Each category has a default SLA: Technical=4h, Billing=2h, Refund=24h, Delivery=48h, Complaint=12h. suggested_action and suggested_response are generated per category using templates. Escalate=True if urgency≥8 or category is Complaint.',
      },
      {
        label: 'Ticket Sessions',
        icon: Database,
        desc: 'ticket_sessions table',
        detail: 'Session row: total_tickets, critical_count, high_count, escalate_count, top_category, avg_urgency, category_breakdown JSON, priority_breakdown JSON, sentiment_breakdown JSON, ai_insight. Also user_id for isolation.',
      },
      {
        label: 'Ticket Detail',
        icon: Eye,
        desc: 'GET /api/tickets/{sid}',
        detail: 'Returns full session + all individual tickets. Each ticket has: category, subcategory, priority, urgency_score, escalate, sla_hours, sla_label, suggested_action, suggested_response, keywords, entities, hash_value, language, translated_text.',
      },
      {
        label: 'Export',
        icon: FileText,
        desc: 'GET /api/tickets/{sid}/export',
        detail: 'Downloads all tickets as CSV with all fields. Useful for importing into helpdesk systems like Zendesk or Freshdesk.',
      },
    ],
    network: [
      'Tickets.jsx → api.tickets.upload(file, text_col) → POST /api/tickets/upload',
      'Backend: _read_file() → pd.DataFrame → _detect_text_col(df)',
      'ticket_engine.batch_classify(texts) → [{category, priority, urgency...}]',
      'ticket_engine: _TICKET_MODEL.predict() + _simple_sentiment(text)',
      'For each result: _detect_lang() + _try_translate()',
      'ticket_summary(results) → stats dict',
      'ai_module.generate_ticket_insights(stats) → Claude insight string',
      'INSERT INTO ticket_sessions + INSERT INTO support_tickets (N rows)',
      'Return {session_id, count, results, stats, ai_insight}',
    ],
  },
  {
    id: 'features',
    icon: Sparkles,
    color: '#ec4899',
    title: 'Advanced Analytics Features',
    subtitle: 'Compare, Trends, Insights, Brand Health, Benchmark, Watchlist',
    overview: 'Built on top of session data — these features cross-reference multiple sessions to extract deeper signals. All are user-scoped (each user only sees their own sessions).',
    nodes: [
      {
        label: 'Compare',
        icon: GitBranch,
        desc: 'GET /api/compare',
        detail: 'Select 2-5 sessions to compare side-by-side. Returns per-session stats, sentiment distributions, top keyword overlaps, avg score differences. Radar chart and bar chart visualizations in Compare.jsx.',
      },
      {
        label: 'Trends',
        icon: TrendingUp,
        desc: 'GET /api/trends/keywords',
        detail: 'Aggregates keywords across all user sessions to find recurring themes. Groups by month for time-series charting. Claude analyses the top keywords and returns macro trend text. Shows keyword frequency clouds.',
      },
      {
        label: 'Insights',
        icon: Layers,
        desc: 'GET /api/sessions/{sid}/aspects etc.',
        detail: 'Deep per-session analytics: aspect breakdown (delivery/quality/price/service), NPS estimate (Net Promoter Score derived from sentiment distribution), persona clustering, risk signals, keyword co-occurrence matrix, 24-hour heatmap.',
      },
      {
        label: 'Brand Health',
        icon: CheckCircle,
        desc: 'GET /api/brand-health',
        detail: 'Aggregates all user sessions into a brand health score (0-100). Shows score trends over time, top positive and negative themes, review quality score, and a health verdict (Excellent/Good/At Risk/Critical).',
      },
      {
        label: 'Benchmark',
        icon: BarChart2,
        desc: 'GET /api/benchmark',
        detail: 'Compares user\'s average sentiment score against industry averages. Pulls competitor data from scraping or manual entry. Shows gap analysis, ranking, and improvement areas. Uses recharts horizontal bar chart.',
      },
      {
        label: 'Watchlist',
        icon: Eye,
        desc: 'POST /api/watchlist',
        detail: 'Users add competitor URLs to monitor. Background jobs (triggered on re-analyze) check if sentiment dropped significantly. Alerts are created when score drops > threshold and shown in the notification bell.',
      },
      {
        label: 'Hash Verify',
        icon: Shield,
        desc: 'GET /api/verify/{hash}',
        detail: 'Every review is hashed (SHA-256) when saved. Users can submit a review text and get back its hash, then verify if it exists in the database. Proves review authenticity — if the hash matches, the review was genuinely analyzed.',
      },
    ],
    network: [
      'Compare.jsx → GET /api/compare?ids=sid1,sid2,sid3',
      'Backend: for each sid → SELECT reviews → compute stats → return array',
      'Trends → GET /api/trends/keywords → aggregate keywords across sessions',
      'Insights → 6 sub-endpoints: /nps /personas /risks /cooccurrence /heatmap /aspects',
      'Brand Health → GET /api/brand-health → aggregate all user sessions',
      'Benchmark → GET /api/benchmark → user avg vs industry lookup table',
      'Watchlist → POST /api/watchlist {url} → INSERT watchlist row',
      'Hash Verify → SHA-256(text) → SELECT reviews WHERE hash_value=?',
    ],
  },
  {
    id: 'bi',
    icon: BarChart2,
    color: '#06b6d4',
    title: 'Business Intelligence Hub',
    subtitle: 'Revenue impact, forecasting, benchmarking, auto-reports',
    overview: 'The BI Hub translates raw sentiment data into business metrics using published academic formulas (HBR, Nielsen). Revenue impact models, linear regression forecasting, competitor benchmarking, and AI executive reports.',
    nodes: [
      {
        label: 'BI Overview',
        icon: BarChart2,
        desc: 'GET /api/bi/overview',
        detail: '8 KPI metrics: total reviews, avg sentiment, review velocity, positive rate, NPS estimate, quality score, review health grade, trend direction. Also returns monthly area chart data and recent sessions table.',
      },
      {
        label: 'Revenue Impact',
        icon: TrendingUp,
        desc: 'GET /api/bi/revenue-impact',
        detail: 'Models: Revenue at Risk = negative_rate × estimated_revenue. Purchase Lift = Bazaarvoice formula (positive reviews → conversion uplift %). NPS Estimate = (positive_rate − negative_rate) × 100. Churn Risk = negative_rate × 1.4.',
      },
      {
        label: 'Forecasting',
        icon: RefreshCw,
        desc: 'GET /api/bi/forecasting',
        detail: 'Linear regression on monthly avg_score history. Extrapolates 3 periods forward. Volume projection uses past growth rate. Confidence level = R² of the regression. Shown as dashed line on AreaChart.',
      },
      {
        label: 'Benchmarking',
        icon: Globe2,
        desc: 'GET /api/bi/competitor-benchmark',
        detail: 'Compares user\'s avg sentiment against 8 hardcoded industry benchmarks (ecommerce, SaaS, healthcare, etc.). Shows your rank, gap to industry average, and top/bottom performers. Horizontal bar chart.',
      },
      {
        label: 'Auto Report',
        icon: Brain,
        desc: 'POST /api/bi/auto-report',
        detail: 'Sends all BI data to Claude and asks for a 4-paragraph executive summary. Paragraph 1: current state. Paragraph 2: key risks. Paragraph 3: opportunities. Paragraph 4: recommended actions. Downloadable as .txt.',
      },
    ],
    network: [
      'BIHub.jsx mounts → fetches all 5 BI endpoints in parallel',
      'GET /api/bi/overview → aggregate sessions for user → KPIs',
      'GET /api/bi/revenue-impact → HBR/Nielsen formulas on sentiment %',
      'GET /api/bi/forecasting → numpy polyfit on monthly scores → 3-month extrapolation',
      'GET /api/bi/competitor-benchmark → user avg vs industry lookup dict',
      'POST /api/bi/auto-report → Claude(all metrics) → 4-para text → return',
    ],
  },
  {
    id: 'global',
    icon: Globe2,
    color: '#22d3ee',
    title: 'Global Product Intelligence',
    subtitle: 'Real-time headlines → AI auto-generates trending products every 15 min',
    overview: 'Completely automated. No hardcoded products. GDELT (free, no API key) provides real current headlines. Claude analyses the headlines and generates 20 relevant products with demand scores, margins, urgency and regions. Cache refreshes every 15 minutes.',
    nodes: [
      {
        label: 'GDELT Fetch',
        icon: Radio,
        desc: 'GDELT API (free, no key)',
        detail: 'GDELT Project API returns real news articles for any keyword query. We query 4 topic categories (economy, tech, climate, health) and collect up to 3 headlines each = 12 live headlines per refresh cycle.',
      },
      {
        label: 'Event Detection',
        icon: AlertTriangle,
        desc: 'Keyword classification',
        detail: 'Each headline is classified into event type by keyword matching: economic, technology, climate, health, geopolitical, market. Severity is based on position in the results list (first 2 = high, next 2 = medium, rest = low).',
      },
      {
        label: 'AI Product Gen',
        icon: Brain,
        desc: 'Claude generates 20 products',
        detail: 'Claude is asked: "Based on these headlines, generate 20 products businesses should stock NOW." Response is structured JSON with: name, category, emoji, demand_score, price_range, margin_pct, trend, driven_by, insight, stock_urgency, target_regions.',
      },
      {
        label: 'Cache Layer',
        icon: Database,
        desc: '_gi_cache, 900s TTL',
        detail: 'Results are cached in memory for 15 minutes (900 seconds). The frontend shows a live countdown timer. POST /api/global/refresh-intelligence force-expires the cache and re-runs the full pipeline immediately.',
      },
      {
        label: 'Fallback Mode',
        icon: Zap,
        desc: 'Rule-based if no API key',
        detail: 'If ANTHROPIC_API_KEY is not set, a rule-based fallback maps detected event types to pre-defined product lists. Still uses live headlines for event detection — only the product generation falls back to rules.',
      },
    ],
    network: [
      'GET /api/global/ai-intelligence — check _gi_cache[ts] < 900s',
      'If stale: fetch GDELT headlines for 4 topic queries',
      'Classify each headline → live_events[] with type + severity',
      'If ANTHROPIC_API_KEY: prompt Claude with headlines + today\'s date',
      'Claude returns JSON array of 20 products → parse + validate each field',
      'Cache products + events in _gi_cache with current timestamp',
      'Frontend: auto-refresh every 15min via setInterval + countdown timer',
      'POST /api/global/refresh-intelligence → _gi_cache["ts"]=0 → re-run',
    ],
  },
  {
    id: 'database',
    icon: Database,
    color: '#64748b',
    title: 'Database & Infrastructure',
    subtitle: 'SQLite with WAL mode, auto-migration, full schema',
    overview: 'SQLite with WAL mode (write-ahead logging) for concurrent reads. The database is auto-initialized with all tables on startup via database.py. All queries use parameterized statements to prevent SQL injection.',
    nodes: [
      {
        label: 'SQLite + WAL',
        icon: Database,
        desc: 'nestinsights_v5.db',
        detail: 'Single-file database. WAL (Write-Ahead Logging) mode allows concurrent reads without blocking. PRAGMA journal_mode=WAL, PRAGMA cache_size=-64000 (64MB), PRAGMA foreign_keys=ON. File is in backend/ directory.',
      },
      {
        label: 'Tables',
        icon: Layers,
        desc: '8 core tables',
        detail: 'users, sessions, reviews, ticket_sessions, support_tickets, watchlist, alerts, brand_health_snapshots. All tables have user_id FK referencing users.id. Reviews/tickets have ON DELETE CASCADE from their session.',
      },
      {
        label: 'Auto Migration',
        icon: RefreshCw,
        desc: 'database.init_db()',
        detail: 'On every startup, init_db() runs CREATE TABLE IF NOT EXISTS for all tables plus ALTER TABLE IF NOT COLUMN EXISTS for any new columns. This means adding columns to the schema never breaks existing deployments.',
      },
      {
        label: 'Admin Panel',
        icon: Shield,
        desc: '/database (admin only)',
        detail: 'DatabaseAdmin.jsx lets admin query any table, see row counts, and view raw data. Uses GET /api/admin/tables and GET /api/admin/table/{name}. Only accessible to users with role="admin". 403 for anyone else.',
      },
      {
        label: 'Connection Pool',
        icon: Network,
        desc: 'get_conn() per request',
        detail: 'get_conn() opens a new SQLite connection with row_factory=sqlite3.Row (dict-like rows) and sets all PRAGMAs. Connections are opened and closed within each request handler — no pooling needed for SQLite.',
      },
    ],
    network: [
      'Startup: database.init_db() → CREATE TABLE IF NOT EXISTS (all 8 tables)',
      'Each request: conn = get_conn() → sqlite3.connect(DB_PATH)',
      'conn.row_factory = sqlite3.Row → rows accessible as dicts',
      'PRAGMA journal_mode=WAL, foreign_keys=ON',
      'All queries: conn.execute("... WHERE user_id=?", (uid,)) — parameterized',
      'conn.commit() + conn.close() at end of each handler',
      'Admin: GET /api/admin/tables → list all tables + row counts',
      'Admin: GET /api/admin/table/{name}?limit=100 → raw rows as JSON',
    ],
  },
  {
    id: 'frontend',
    icon: Monitor,
    color: '#f97316',
    title: 'Frontend Architecture',
    subtitle: 'React 18 + Vite, Tailwind, Framer Motion, Recharts',
    overview: 'Single-page React app. State managed by AppContext (user, token, theme, language). All API calls go through utils/api.js which auto-injects the Bearer token. Framer Motion for animations, Recharts for all charts, react-hot-toast for notifications.',
    nodes: [
      {
        label: 'AppContext',
        icon: Network,
        desc: 'contexts/AppContext.jsx',
        detail: 'Stores: token (from localStorage), user (decoded from /api/me), theme (dark/light → CSS vars), language (i18n). Exposes login(), logout(), setTheme(), setLanguage(). Wrapped around entire app in main.jsx.',
      },
      {
        label: 'API Layer',
        icon: Code,
        desc: 'utils/api.js (axios)',
        detail: 'axios instance with baseURL=backend URL and Authorization header auto-injected from localStorage token. Exports: api.analyze.url(), api.analyze.dataset(), api.sessions.list(), api.tickets.upload(), api.ai.chat(), etc. All returns Promises.',
      },
      {
        label: 'Routing',
        icon: GitBranch,
        desc: 'react-router-dom v6',
        detail: 'All routes wrapped in <Guard> which redirects to /login if no token. Admin-only routes (database, workflow) checked with user.role==="admin" — redirects to / if not admin. 404 → redirect to /.',
      },
      {
        label: 'Layout',
        icon: Layers,
        desc: 'components/Layout.jsx',
        detail: 'Sidebar with collapsible navigation. Sections: Main (Dashboard, Analyze, Text), Analytics (History, Compare, Trends), Tools (Tickets, Watchlist, Verify, Profile), AI Features (Review Studio, BI Hub, Global Intelligence), Admin (Database, Workflow). Company Tools sliding panel.',
      },
      {
        label: 'Theming',
        icon: Star,
        desc: 'CSS custom properties',
        detail: 'Theme is toggled by adding/removing class "dark" on <html>. All colors are CSS variables: --bg, --card, --border, --text, --muted, --green, --red, --amber, --sky. Tailwind reads these via var() references in tailwind.config.js.',
      },
      {
        label: 'i18n',
        icon: Globe2,
        desc: 'i18n.js — 5 languages',
        detail: 'Simple key-value translation object for English, Urdu, Arabic, French, Spanish. useApp().language controls active lang. t(key) function used in components for translated strings. Language selector in sidebar bottom.',
      },
    ],
    network: [
      'main.jsx → <AppContext> → <BrowserRouter> → <App>',
      'App.jsx → <Routes> → <Guard> checks token → <Layout> → <Outlet>',
      'Layout.jsx → sidebar nav + ToolsPanel + theme/language controls',
      'Every page: import api from utils/api.js',
      'api.js: axios.defaults.baseURL = BACKEND_URL',
      'axios interceptor injects: Authorization: Bearer <localStorage.token>',
      'API response → setState → re-render with recharts/framer-motion',
      'react-hot-toast: toast.success/error on API success/failure',
    ],
  },
]

// ─── Component ────────────────────────────────────────────────────────────────
export default function Workflow() {
  const [activeSection, setActiveSection] = useState(null)
  const [activeNode, setActiveNode]       = useState(null)
  const [showNetwork, setShowNetwork]     = useState(false)
  const [search, setSearch]               = useState('')

  const filtered = search
    ? WORKFLOW.filter(w =>
        w.title.toLowerCase().includes(search.toLowerCase()) ||
        w.subtitle.toLowerCase().includes(search.toLowerCase()) ||
        w.nodes.some(n => n.label.toLowerCase().includes(search.toLowerCase()))
      )
    : WORKFLOW

  const active = WORKFLOW.find(w => w.id === activeSection)

  return (
    <div className="p-4 lg:p-6 space-y-5 min-h-screen" style={{ background: 'var(--bg)' }}>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#6366f1,#0ea5e9)' }}>
            <GitBranch size={18} className="text-white"/>
          </div>
          <div>
            <h1 className="text-xl font-display font-bold text-[var(--text)] flex items-center gap-2">
              System Workflow
              <span className="text-[10px] px-2 py-0.5 rounded-full text-white font-medium"
                style={{ background: '#ef444490' }}>
                🔒 Admin Only
              </span>
            </h1>
            <p className="text-xs text-[var(--muted)]">
              Complete technical architecture · Every feature · Every network call · Every data flow
            </p>
          </div>
        </div>

        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--muted)]"/>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search features, endpoints…"
            className="input text-xs pl-7 py-1.5 w-56"/>
        </div>
      </div>

      {/* System Overview Map */}
      {!activeSection && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <p className="text-xs text-[var(--muted)] flex items-center gap-2">
            <Network size={12}/>
            Click any section to drill down into its full workflow, endpoints, and data flow
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((section, i) => {
              const Icon = section.icon
              return (
                <motion.div key={section.id}
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  whileHover={{ y: -3, scale: 1.01 }}
                  onClick={() => { setActiveSection(section.id); setActiveNode(null); setShowNetwork(false) }}
                  className="card p-4 cursor-pointer border-l-4 hover:shadow-lg transition-all"
                  style={{ borderLeftColor: section.color }}>

                  <div className="flex items-start justify-between mb-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ background: `${section.color}20` }}>
                      <Icon size={16} style={{ color: section.color }}/>
                    </div>
                    <span className="text-[9px] text-[var(--muted)] bg-[var(--border)] px-1.5 py-0.5 rounded-full">
                      {section.nodes.length} components
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-[var(--text)] mb-1 leading-tight">{section.title}</h3>
                  <p className="text-[10px] text-[var(--muted)] leading-relaxed mb-3">{section.subtitle}</p>

                  <div className="flex flex-wrap gap-1">
                    {section.nodes.slice(0, 3).map(n => (
                      <span key={n.label} className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--border)] text-[var(--muted)]">
                        {n.label}
                      </span>
                    ))}
                    {section.nodes.length > 3 && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--border)] text-[var(--muted)]">
                        +{section.nodes.length - 3} more
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 mt-3 text-[10px]" style={{ color: section.color }}>
                    <span>View workflow</span>
                    <ChevronRight size={10}/>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Full system network overview */}
          <div className="card p-5 border" style={{ borderColor: '#6366f130' }}>
            <div className="flex items-center gap-2 mb-4">
              <Network size={14} className="text-indigo-400"/>
              <h2 className="text-sm font-semibold text-[var(--text)]">Full System Network</h2>
              <span className="text-[9px] bg-[var(--border)] px-2 py-0.5 rounded-full text-[var(--muted)]">
                End-to-end data flow
              </span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-[10px]">
              {[
                {
                  title: 'Request Layer',
                  color: '#6366f1',
                  items: [
                    'Browser → React SPA (Vite, port 4000)',
                    'All API calls via axios (utils/api.js)',
                    'Auto-injects JWT Bearer token',
                    'Base URL → Railway backend (port $PORT)',
                  ]
                },
                {
                  title: 'Backend Layer',
                  color: '#0ea5e9',
                  items: [
                    'FastAPI + Uvicorn (Python 3.12+)',
                    'JWT decode on every protected route',
                    'ML models loaded in memory at startup',
                    'SQLite WAL mode (nestinsights_v5.db)',
                  ]
                },
                {
                  title: 'External Services',
                  color: '#10b981',
                  items: [
                    'Anthropic Claude API (claude-opus-4-5)',
                    'scrape.do — proxy for review scraping',
                    'GDELT — free global news headlines',
                    'Open-Meteo — free weather API',
                    'deep-translator — Google Translate backend',
                  ]
                }
              ].map(({ title, color, items }) => (
                <div key={title}>
                  <p className="font-semibold mb-2 flex items-center gap-1.5" style={{ color }}>
                    <span className="w-2 h-2 rounded-full" style={{ background: color }}/>
                    {title}
                  </p>
                  <div className="space-y-1.5">
                    {items.map(item => (
                      <div key={item} className="flex items-start gap-1.5 text-[var(--muted)]">
                        <ArrowRight size={9} className="mt-0.5 flex-shrink-0" style={{ color }}/>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Detail View */}
      <AnimatePresence>
        {active && (
          <motion.div key={active.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }} className="space-y-4">

            {/* Back + title */}
            <div className="flex items-center gap-3">
              <button onClick={() => { setActiveSection(null); setActiveNode(null) }}
                className="flex items-center gap-1.5 text-xs text-[var(--muted)] hover:text-[var(--text)] transition-colors px-3 py-1.5 rounded-lg bg-[var(--card)] border border-[var(--border)]">
                ← Back to overview
              </button>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl flex items-center justify-center"
                  style={{ background: `${active.color}20` }}>
                  <active.icon size={14} style={{ color: active.color }}/>
                </div>
                <h2 className="text-base font-display font-bold text-[var(--text)]">{active.title}</h2>
              </div>
            </div>

            {/* Overview banner */}
            <div className="rounded-xl p-4 border" style={{ borderColor: `${active.color}30`, background: `${active.color}08` }}>
              <p className="text-sm text-[var(--text2)] leading-relaxed">{active.overview}</p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              {/* Node list */}
              <div className="xl:col-span-1 card p-4">
                <h3 className="text-xs font-semibold text-[var(--text)] mb-3">Components</h3>
                <div className="space-y-2">
                  {active.nodes.map((node, i) => {
                    const NIcon = node.icon
                    const isActive = activeNode?.label === node.label
                    return (
                      <motion.div key={node.label} initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                        onClick={() => setActiveNode(isActive ? null : node)}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all
                          ${isActive
                            ? 'border-2 text-white'
                            : 'border-[var(--border)] hover:border-[var(--text)] hover:bg-[var(--card2)]'
                          }`}
                        style={isActive ? { borderColor: active.color, background: `${active.color}15` } : {}}>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: `${active.color}${isActive ? '40' : '20'}` }}>
                          <NIcon size={14} style={{ color: active.color }}/>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-[var(--text)]">{node.label}</p>
                          <p className="text-[9px] font-mono text-[var(--muted)] truncate">{node.desc}</p>
                        </div>
                        <ChevronRight size={12} className="text-[var(--dim)] flex-shrink-0"/>
                      </motion.div>
                    )
                  })}
                </div>
              </div>

              {/* Node detail + Network */}
              <div className="xl:col-span-2 space-y-4">
                <AnimatePresence mode="wait">
                  {activeNode ? (
                    <motion.div key={activeNode.label}
                      initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="card p-5 border-2"
                      style={{ borderColor: `${active.color}40` }}>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                          style={{ background: `${active.color}20` }}>
                          <activeNode.icon size={18} style={{ color: active.color }}/>
                        </div>
                        <div>
                          <h3 className="text-sm font-display font-bold text-[var(--text)]">{activeNode.label}</h3>
                          <code className="text-[10px] font-mono text-[var(--muted)]">{activeNode.desc}</code>
                        </div>
                      </div>
                      <p className="text-sm text-[var(--text2)] leading-relaxed">{activeNode.detail}</p>
                    </motion.div>
                  ) : (
                    <motion.div key="select" className="card p-8 text-center"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <Layers size={24} className="mx-auto mb-3 opacity-30"/>
                      <p className="text-sm text-[var(--muted)]">Select a component on the left to see details</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Network calls */}
                <div className="card p-4">
                  <button onClick={() => setShowNetwork(n => !n)}
                    className="w-full flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Network size={13} className="text-indigo-400"/>
                      <h3 className="text-xs font-semibold text-[var(--text)]">Network & Data Flow</h3>
                      <span className="text-[9px] bg-[var(--border)] px-1.5 py-0.5 rounded-full text-[var(--muted)]">
                        {active.network.length} steps
                      </span>
                    </div>
                    {showNetwork ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
                  </button>

                  <AnimatePresence>
                    {showNetwork && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="mt-4 space-y-2">
                          {active.network.map((step, i) => (
                            <motion.div key={i} initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                              className="flex items-start gap-3">
                              <div className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white mt-0.5"
                                style={{ background: active.color }}>
                                {i + 1}
                              </div>
                              <code className="text-[10px] text-[var(--text2)] leading-relaxed font-mono bg-[var(--card2)] px-2 py-1 rounded flex-1">
                                {step}
                              </code>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {!showNetwork && (
                    <p className="text-[9px] text-[var(--muted)] mt-2">Click to expand network trace</p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
 