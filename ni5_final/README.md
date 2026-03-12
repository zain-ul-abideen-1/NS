# NestInsights v5.0 — Multilingual Consumer Intelligence Platform
**FYP — BS Software Engineering, University of Lahore**
Muhammad Abdul Rafay (70158138) · Zain-ul-abideen (70158131)
Supervisor: Miss Anam Ahsan · BSSE-7A

---

## 🚀 Quick Start

### Backend (Port 5000)
```bash
cd backend
pip install -r requirements.txt
python main.py
```
→ API at http://localhost:5000
→ Docs at http://localhost:5000/docs

### Frontend (Port 4000)
```bash
cd frontend
npm install
npm run dev
```
→ App at http://localhost:4000

### Default Login
- Username: `admin`
- Password: `admin123`

---

## ⚙️ Configuration (backend/.env)
```
SECRET_KEY=your-secret-here
ANTHROPIC_API_KEY=sk-ant-...    # For AI Chat & Deep Insights
SCRAPER_API_KEY=your-key-here   # From scraperapi.com (free: 1000/mo)
PORT=5000
```

---

## 📦 14 Professional Features

| # | Feature | Description |
|---|---------|-------------|
| 1 | **Multi-Source Scraping** | ScraperAPI + direct fallback, works on Trustpilot, Amazon, Yelp, G2, etc. |
| 2 | **VADER+TextBlob Ensemble** | 65/35 weighted sentiment with confidence scoring |
| 3 | **8 Emotion Detection** | Joy, Anger, Fear, Sadness, Surprise, Disgust, Trust, Anticipation |
| 4 | **8 Aspect Analysis** | Quality, Price, Delivery, Service, Usability, Performance, Appearance, Durability |
| 5 | **Review Authenticity Detector** | 6-signal fake review detection with confidence label |
| 6 | **Helpfulness Scoring** | Rates review usefulness for buyers |
| 7 | **Ticket Classifier** | 8 categories, 4 priorities, SLA, escalation flag |
| 8 | **AI Response Generator** | Claude AI or rule-based customer response templates |
| 9 | **Multilingual Support** | Auto-detect + translate 50+ languages, UI in EN/UR/DE/PA |
| 10 | **Session Compare** | Side-by-side analysis of up to 5 sessions with winner |
| 11 | **Watchlist** | Monitor URLs with configurable alert thresholds |
| 12 | **Hash Verification** | SHA-256 integrity verification for all reviews |
| 13 | **Export to CSV** | Download full session data with all features |
| 14 | **AI Chat per Session** | Claude-powered Q&A about any session |

---

## 🏗️ Tech Stack

**Backend:** FastAPI · SQLite · VADER+TextBlob · BeautifulSoup · ScraperAPI · Anthropic Claude API · pandas

**Frontend:** React 18 · Vite · Tailwind CSS · Framer Motion · Recharts · React Router

---

## 📡 API Endpoints (25+)
- `POST /api/auth/register` · `POST /api/auth/login`
- `POST /api/analyze/url` · `POST /api/analyze/dataset` · `POST /api/analyze/batch` · `POST /api/analyze/text`
- `GET /api/sessions` · `GET /api/sessions/{id}` · `DELETE /api/sessions/{id}`
- `POST /api/ai/chat` · `POST /api/ai/generate-response`
- `POST /api/compare` · `GET /api/trends/keywords` · `GET /api/dashboard/stats`
- `POST /api/tickets/analyze` · `POST /api/tickets/batch` · `POST /api/tickets/upload`
- `GET /api/tickets/sessions` · `GET /api/tickets/{id}`
- `GET /api/export/{id}/csv` · `POST /api/verify/hash`
- `GET /api/watchlist` · `POST /api/watchlist`
- `GET /api/alerts` · `PUT /api/auth/profile`
