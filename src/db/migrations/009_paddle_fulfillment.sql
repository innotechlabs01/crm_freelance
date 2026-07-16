-- Customers table (mirrors Paddle customer state)
CREATE TABLE IF NOT EXISTS customers (
  customer_id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE,
  email TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Subscriptions table (mirrors Paddle subscription state)
CREATE TABLE IF NOT EXISTS paddle_subscriptions (
  subscription_id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES customers(customer_id),
  user_id TEXT NOT NULL,
  status TEXT NOT NULL,
  price_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  scheduled_change_action TEXT,
  scheduled_change_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Index for fast lookups by user_id
CREATE INDEX IF NOT EXISTS idx_paddle_subscriptions_user_id ON paddle_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_paddle_subscriptions_customer_id ON paddle_subscriptions(customer_id);
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);
