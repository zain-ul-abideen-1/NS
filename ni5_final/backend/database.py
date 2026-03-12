import sqlite3, hashlib, os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), "nestinsights_v5.db")

SCHEMA = [
"""CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    hashed_password TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    theme TEXT DEFAULT 'dark',
    language TEXT DEFAULT 'en',
    avatar_color TEXT DEFAULT '#6C63FF',
    company TEXT DEFAULT '',
    bio TEXT DEFAULT '',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    last_login TEXT,
    is_active INTEGER DEFAULT 1
)""",
"""CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT UNIQUE NOT NULL,
    user_id INTEGER,
    name TEXT,
    source_type TEXT,
    source_url TEXT,
    source_file TEXT,
    total_reviews INTEGER DEFAULT 0,
    positive_count INTEGER DEFAULT 0,
    negative_count INTEGER DEFAULT 0,
    neutral_count INTEGER DEFAULT 0,
    avg_score REAL DEFAULT 0,
    avg_helpfulness REAL DEFAULT 0,
    avg_authenticity REAL DEFAULT 1,
    fake_count INTEGER DEFAULT 0,
    ai_summary TEXT,
    tags TEXT DEFAULT '[]',
    status TEXT DEFAULT 'completed',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
)""",
"""CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT,
    text TEXT,
    original_text TEXT,
    author TEXT DEFAULT '',
    rating REAL DEFAULT 0,
    date TEXT DEFAULT '',
    product TEXT DEFAULT '',
    source_url TEXT DEFAULT '',
    language TEXT DEFAULT 'en',
    translated_text TEXT DEFAULT '',
    sentiment TEXT,
    score REAL DEFAULT 0,
    confidence REAL DEFAULT 0,
    positive_prob REAL DEFAULT 0,
    negative_prob REAL DEFAULT 0,
    neutral_prob REAL DEFAULT 0,
    subjectivity REAL DEFAULT 0,
    helpfulness_score REAL DEFAULT 0,
    helpfulness_label TEXT DEFAULT '',
    emotions TEXT DEFAULT '{}',
    keywords TEXT DEFAULT '[]',
    aspects TEXT DEFAULT '{}',
    topics TEXT DEFAULT '[]',
    spam_score REAL DEFAULT 0,
    authenticity_score REAL DEFAULT 1,
    authenticity_label TEXT DEFAULT 'genuine',
    response_suggestion TEXT DEFAULT '',
    hash_value TEXT DEFAULT '',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
)""",
"""CREATE TABLE IF NOT EXISTS ticket_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT UNIQUE NOT NULL,
    user_id INTEGER,
    name TEXT,
    total_tickets INTEGER DEFAULT 0,
    critical_count INTEGER DEFAULT 0,
    high_count INTEGER DEFAULT 0,
    escalate_count INTEGER DEFAULT 0,
    top_category TEXT DEFAULT '',
    avg_urgency REAL DEFAULT 0,
    category_breakdown TEXT DEFAULT '{}',
    priority_breakdown TEXT DEFAULT '{}',
    sentiment_breakdown TEXT DEFAULT '{}',
    ai_insight TEXT DEFAULT '',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
)""",
"""CREATE TABLE IF NOT EXISTS support_tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id TEXT UNIQUE NOT NULL,
    session_id TEXT,
    user_id INTEGER,
    text TEXT,
    original_text TEXT,
    language TEXT DEFAULT 'en',
    translated_text TEXT DEFAULT '',
    category TEXT,
    subcategory TEXT DEFAULT '',
    priority TEXT DEFAULT 'medium',
    sentiment TEXT DEFAULT 'neutral',
    score REAL DEFAULT 0,
    urgency_score REAL DEFAULT 0,
    sla_hours INTEGER DEFAULT 24,
    sla_label TEXT DEFAULT '',
    resolution_time_estimate TEXT DEFAULT '',
    suggested_action TEXT DEFAULT '',
    suggested_response TEXT DEFAULT '',
    keywords TEXT DEFAULT '[]',
    entities TEXT DEFAULT '[]',
    escalate INTEGER DEFAULT 0,
    hash_value TEXT DEFAULT '',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
)""",
"""CREATE TABLE IF NOT EXISTS watchlist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    name TEXT,
    url TEXT,
    last_checked TEXT,
    last_score REAL DEFAULT 0,
    last_sentiment TEXT DEFAULT '',
    alert_threshold REAL DEFAULT -0.2,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
)""",
"""CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    watchlist_id INTEGER,
    message TEXT,
    severity TEXT DEFAULT 'info',
    is_read INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
)""",
"""CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    report_id TEXT UNIQUE NOT NULL,
    user_id INTEGER,
    name TEXT,
    session_ids TEXT DEFAULT '[]',
    content TEXT DEFAULT '{}',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
)""",
]

def init_db():
    conn = sqlite3.connect(DB_PATH)
    for stmt in SCHEMA:
        try:
            conn.execute(stmt)
        except Exception:
            pass
    # Migrate existing DB — add columns that may not exist yet
    migrations = [
        "ALTER TABLE ticket_sessions ADD COLUMN escalate_count INTEGER DEFAULT 0",
        "ALTER TABLE ticket_sessions ADD COLUMN top_category TEXT DEFAULT ''",
        "ALTER TABLE sessions ADD COLUMN avg_authenticity REAL DEFAULT 1.0",
        "ALTER TABLE sessions ADD COLUMN neutral_count INTEGER DEFAULT 0",
        "ALTER TABLE support_tickets ADD COLUMN sla_hours INTEGER DEFAULT 24",
        "ALTER TABLE support_tickets ADD COLUMN sla_label TEXT DEFAULT ''",
    ]
    for m in migrations:
        try:    conn.execute(m)
        except: pass  # Column already exists — ignore

    # seed admin safely - never crash on re-run
    from passlib.context import CryptContext
    pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")
    try:
        existing = conn.execute("SELECT id FROM users WHERE username='admin'").fetchone()
        if not existing:
            conn.execute(
                "INSERT INTO users (username,email,hashed_password,role) VALUES (?,?,?,?)",
                ("admin","admin@nestinsights.com", pwd.hash("admin123"), "admin")
            )
    except Exception:
        pass
    conn.commit()
    conn.close()

def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def hash_text(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()
