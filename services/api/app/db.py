import os
import psycopg2
from psycopg2.extras import RealDictCursor

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://brain:brain123@localhost:5432/companybrain")

DDL = """
CREATE TABLE IF NOT EXISTS users(
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE IF NOT EXISTS documents(
  id SERIAL PRIMARY KEY,
  filename TEXT NOT NULL,
  object_key TEXT NOT NULL,
  size_bytes BIGINT DEFAULT 0,
  mime TEXT DEFAULT '',
  doc_type TEXT DEFAULT 'umum',
  uploaded_by INT REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE IF NOT EXISTS audit_logs(
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  action TEXT NOT NULL,
  detail TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE IF NOT EXISTS document_chunks(
  id SERIAL PRIMARY KEY,
  document_id INT REFERENCES documents(id) ON DELETE CASCADE,
  chunk_index INT NOT NULL DEFAULT 0,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(document_id, chunk_index)
);
CREATE TABLE IF NOT EXISTS chat_logs(
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  backend TEXT DEFAULT '',
  mode TEXT DEFAULT '',
  hits JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE IF NOT EXISTS feedback(
  id SERIAL PRIMARY KEY,
  chat_id INT REFERENCES chat_logs(id) ON DELETE SET NULL,
  user_id INT REFERENCES users(id),
  rating INT NOT NULL CHECK (rating IN (-1, 1)),
  comment TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);
"""

def get_conn():
    return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)

def init_db():
    conn = get_conn()
    conn.autocommit = True
    cur = conn.cursor()
    cur.execute(DDL)
    # seed admin
    admin_user = os.getenv("SEED_ADMIN_USER", "admin")
    admin_pass = os.getenv("SEED_ADMIN_PASSWORD", "admin123")
    cur.execute("SELECT id FROM users WHERE username=%s", (admin_user,))
    if not cur.fetchone():
        from .auth import hash_password
        cur.execute(
            "INSERT INTO users(username,password_hash,role) VALUES(%s,%s,'admin')",
            (admin_user, hash_password(admin_pass)),
        )
    cur.close()
    conn.close()
