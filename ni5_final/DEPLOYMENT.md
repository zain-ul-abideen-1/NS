# NestInsights v5.0 — Deployment Guide

---

## Option 1: Local / VPS (Recommended for demo)

### Backend
```bash
cd backend
pip install -r requirements.txt
python main.py
```
Runs at http://localhost:5000

### Frontend
```bash
cd frontend
npm install
npm run build
npm run preview   # serves production build locally
```

---

## Option 2: Vercel (Frontend) + Render (Backend)

### Step 1 — Deploy backend on Render (free tier)
1. Go to https://render.com and sign up
2. New > Web Service > Connect your GitHub repo
3. Set:
   - Root Directory: `ni5/backend`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `python main.py`
4. Add Environment Variables in Render dashboard:
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   SCRAPE_DO_TOKEN=22d8ddb3799d41d083e7edd240e7920464223f4ed25
   SECRET_KEY=your-random-secret
   PORT=10000
   ```
5. Note your Render URL: `https://nestinsights-backend.onrender.com`

### Step 2 — Update frontend API base URL
Edit `ni5/frontend/src/utils/api.js`:
Change the axios baseURL to your Render URL.
Or set `VITE_API_URL` environment variable in Vercel.

### Step 3 — Deploy frontend on Vercel
1. Go to https://vercel.com and sign up
2. New Project > Import your GitHub repo
3. Set:
   - Root Directory: `ni5/frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Add Environment Variable:
   ```
   VITE_API_URL=https://your-render-backend.onrender.com
   ```
5. Deploy — Vercel gives you a `.vercel.app` URL instantly

---

## Option 3: Railway (Full stack, easiest)

1. Go to https://railway.app
2. New Project > Deploy from GitHub
3. Add two services: one for backend, one for frontend
4. Railway auto-detects Python and Node.js
5. Add environment variables per service
6. Both services get public URLs

---

## Option 4: Docker (For server deployment)

### Backend Dockerfile (create as `ni5/backend/Dockerfile`):
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["python", "main.py"]
```

### Frontend Dockerfile (create as `ni5/frontend/Dockerfile`):
```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json .
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
```

---

## Notes

- SQLite database is stored as `nestinsights_v5.db` in the backend folder
- For production, consider migrating to PostgreSQL (change `sqlite3` to `psycopg2` in `database.py`)
- The free tier of Render spins down after 15 minutes of inactivity — first request after sleep takes ~30 seconds
- Vercel free tier is more than sufficient for a demo or FYP presentation
- Default admin credentials: `admin` / `admin123` — change immediately in production

