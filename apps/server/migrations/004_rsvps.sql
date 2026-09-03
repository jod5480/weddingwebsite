-- 004_rsvps.sql — wedding RSVP responses table (libsql / SQLite dialect)
CREATE TABLE IF NOT EXISTS rsvps (
  id        TEXT PRIMARY KEY,
  name      TEXT NOT NULL,
  contact   TEXT NOT NULL,
  attending TEXT NOT NULL DEFAULT 'yes',
  guests    INTEGER NOT NULL DEFAULT 1,
  meal      TEXT NOT NULL DEFAULT 'non-vegetarian',
  message   TEXT,
  createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_rsvps_createdAt ON rsvps (createdAt);
CREATE INDEX IF NOT EXISTS idx_rsvps_contact ON rsvps (contact);
