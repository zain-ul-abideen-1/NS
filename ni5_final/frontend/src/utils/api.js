import axios from 'axios'

export const Auth = {
  login:    (u, p)    => axios.post('/api/auth/login',    { username: u, password: p }),
  register: (u, e, p) => axios.post('/api/auth/register', { username: u, email: e, password: p }),
  me:       ()        => axios.get('/api/auth/me'),
  profile:  (d)       => axios.put('/api/auth/profile', d),
}
export const Analyze = {
  text:    (text)        => axios.post('/api/analyze/text',    { text }),
  batch:   (texts, name) => axios.post('/api/analyze/batch',   { texts, session_name: name }),
  url:     (url, name)   => axios.post('/api/analyze/url',     { url, session_name: name }),
  dataset: (form)        => axios.post('/api/analyze/dataset', form, { headers: { 'Content-Type': 'multipart/form-data' } }),
  columns: (form)        => axios.post('/api/detect/columns',  form, { headers: { 'Content-Type': 'multipart/form-data' } }),
}
export const Sessions = {
  list:   (params)      => axios.get('/api/sessions', { params }),
  get:    (id)          => axios.get(`/api/sessions/${id}`),
  delete: (id)          => axios.delete(`/api/sessions/${id}`),
  tag:    (id, tags)    => axios.put(`/api/sessions/${id}/tags`, { tags }),
  nps:    (id)          => axios.get(`/api/sessions/${id}/nps`),
  personas: (id)        => axios.get(`/api/sessions/${id}/personas`),
  risks:  (id)          => axios.get(`/api/sessions/${id}/risks`),
  cooccurrence: (id)    => axios.get(`/api/sessions/${id}/cooccurrence`),
  heatmap: (id)         => axios.get(`/api/sessions/${id}/heatmap`),
  quality: (id)         => axios.get(`/api/sessions/${id}/quality-report`),
}
export const Tickets = {
  analyze:  (text, name, customerName) => axios.post('/api/tickets/analyze', { text, session_name: name, customer_name: customerName }),
  batch:    (texts, name)              => axios.post('/api/tickets/batch',   { texts, session_name: name }),
  upload:   (form)                     => axios.post('/api/tickets/upload',  form, { headers: { 'Content-Type': 'multipart/form-data' } }),
  sessions: (params)                   => axios.get('/api/tickets/sessions', { params }),
  get:      (id)                       => axios.get(`/api/tickets/${id}`),
  export:   (id)                       => axios.get(`/api/tickets/${id}/export`, { responseType: 'blob' }),
}
export const Compare   = { run: (ids, name) => axios.post('/api/compare', { session_ids: ids, name }) }
export const Trends    = { keywords: () => axios.get('/api/trends/keywords') }
export const Dashboard = { stats: () => axios.get('/api/dashboard/stats') }
export const AI        = {
  chat:     (session_id, message, history=[]) => axios.post('/api/ai/chat', { session_id, message, history }),
  genResp:  (review_text, sentiment) => axios.post('/api/ai/generate-response', { review_text, sentiment }),
}
export const Digest    = {
  generate: (session_ids, period) => axios.post('/api/digest/generate', { session_ids, period }),
}
export const Export    = { csv: (id) => axios.get(`/api/export/${id}/csv`, { responseType: 'blob' }) }
export const Verify    = { hash: (text, hash) => axios.post('/api/verify/hash', { text, hash }) }
export const Watchlist = {
  list:   ()              => axios.get('/api/watchlist'),
  add:    (name, url, t)  => axios.post('/api/watchlist', { name, url, alert_threshold: t }),
  delete: (id)            => axios.delete(`/api/watchlist/${id}`),
}
export const Alerts    = {
  list: () => axios.get('/api/alerts'),
  read: (id) => axios.put(`/api/alerts/${id}/read`),
}
export const Studio = {
  bulkReply:     (reviews, tone, brand_voice) => axios.post('/api/studio/bulk-reply', { reviews, tone, brand_voice }),
  coachReply:    (review, reply, tone)        => axios.post('/api/studio/coach-reply', { review, reply, tone }),
  templateReply: (review, category, tone, brand_voice) => axios.post('/api/studio/template-reply', { review, category, tone, brand_voice }),
  translate:     (reply, target_language)     => axios.post('/api/studio/translate-reply', { reply, target_language }),
  scoreReply:    (review, reply)              => axios.post('/api/studio/score-reply', { review, reply }),
  abTest:        (review, brand_voice, tones) => axios.post('/api/studio/abtest', { review, brand_voice, tones }),
  analyze:       (text)                       => axios.post('/api/studio/analyze-review', { text }),
}
export const BrandHealthAPI = {
  get:      ()      => axios.get('/api/brand-health'),
  timeline: (days)  => axios.get(`/api/brand-health/timeline?days=${days}`),
}
export const BenchmarkAPI = {
  run: (industry, session_ids) => axios.post('/api/benchmark', { industry, session_ids }),
}
export const GlobalAPI = {
  news:     (event_id) => axios.get(`/api/global/news/${event_id}`),
  liveEvents: ()       => axios.get('/api/global/events/live'),
  weather:  ()         => axios.get('/api/global/weather-events'),
}
