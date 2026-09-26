-- Event ids the sample receiver (POST /webhooks/receiver) has processed.
-- Status webhooks are delivered at least once, so the receiver skips an id
-- it has already seen. A real receiver keeps this table in its own database.
-- Unlike 0001 and 0002, this table belongs to the example, not to k-msg.
CREATE TABLE IF NOT EXISTS sample_receiver_events (
  event_id TEXT PRIMARY KEY,
  received_at INTEGER NOT NULL
);
