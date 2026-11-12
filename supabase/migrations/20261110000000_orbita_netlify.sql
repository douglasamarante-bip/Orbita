CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL,
  created TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_single_agency
  ON users(role) WHERE role = 'agency';

CREATE TABLE IF NOT EXISTS brands (
  id TEXT PRIMARY KEY,
  owner TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL DEFAULT '',
  color TEXT NOT NULL DEFAULT '#c2f970',
  created TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_brands_owner ON brands(owner);
CREATE INDEX IF NOT EXISTS idx_brands_email ON brands(email);

CREATE TABLE IF NOT EXISTS assets (
  id TEXT PRIMARY KEY,
  brand_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  size INTEGER NOT NULL,
  share_key TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  brand_id TEXT NOT NULL REFERENCES brands(id),
  title TEXT NOT NULL,
  caption TEXT NOT NULL,
  platform TEXT NOT NULL,
  format TEXT NOT NULL,
  media TEXT NOT NULL DEFAULT '[]',
  scheduled_at TEXT NOT NULL,
  status TEXT NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1,
  feedback TEXT NOT NULL DEFAULT '',
  history TEXT NOT NULL DEFAULT '[]',
  remote_id TEXT,
  container_id TEXT,
  error TEXT,
  poll_question TEXT,
  poll_option_a TEXT,
  poll_option_b TEXT,
  created TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_posts_brand ON posts(brand_id);
CREATE INDEX IF NOT EXISTS idx_posts_due ON posts(status, scheduled_at);

CREATE TABLE IF NOT EXISTS connections (
  id TEXT PRIMARY KEY,
  brand_id TEXT NOT NULL REFERENCES brands(id),
  provider TEXT NOT NULL,
  account_id TEXT NOT NULL,
  name TEXT NOT NULL,
  token TEXT NOT NULL,
  refresh_token TEXT,
  expires BIGINT,
  updated TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_connections_brand_provider
  ON connections(brand_id, provider);

CREATE TABLE IF NOT EXISTS oauth (
  state TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  brand_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  expires BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS metrics (
  id TEXT PRIMARY KEY,
  brand_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  day TEXT NOT NULL,
  followers INTEGER,
  reach INTEGER,
  views INTEGER,
  interactions INTEGER,
  post_metrics TEXT NOT NULL DEFAULT '[]'
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_metrics_day
  ON metrics(brand_id, provider, day);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  expires BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

CREATE TABLE IF NOT EXISTS invitations (
  token_hash TEXT PRIMARY KEY,
  brand_id TEXT NOT NULL REFERENCES brands(id),
  email TEXT NOT NULL,
  expires BIGINT NOT NULL,
  used INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS auth_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL,
  until BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS integration_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS scheduler_locks (
  id INTEGER PRIMARY KEY,
  token TEXT NOT NULL,
  expires_at BIGINT NOT NULL
);


ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oauth ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduler_locks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_settings ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE
  public.users,
  public.brands,
  public.assets,
  public.posts,
  public.connections,
  public.oauth,
  public.metrics,
  public.sessions,
  public.invitations,
  public.auth_limits,
  public.scheduler_locks,
  public.integration_settings
FROM anon, authenticated;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'orbita-media',
  'orbita-media',
  false,
  52428800,
  ARRAY['image/jpeg', 'image/png', 'video/mp4']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  public = false,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;
