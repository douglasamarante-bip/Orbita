CREATE TABLE scheduler_locks (
  id INTEGER PRIMARY KEY,
  token TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE UNIQUE INDEX idx_users_single_agency ON users(role) WHERE role='agency';
