-- PlentyOfSharing — run this once in your Neon project's SQL Editor
-- (Neon console → your project → SQL Editor → paste and run).

CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS participants (
  id SERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (event_id, name)
);

CREATE TABLE IF NOT EXISTS items (
  id SERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount_mills BIGINT NOT NULL,
  payer_id INTEGER NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS item_splits (
  item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  participant_id INTEGER NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  PRIMARY KEY (item_id, participant_id)
);

CREATE INDEX IF NOT EXISTS idx_participants_event ON participants(event_id);
CREATE INDEX IF NOT EXISTS idx_items_event ON items(event_id);
CREATE INDEX IF NOT EXISTS idx_item_splits_item ON item_splits(item_id);
