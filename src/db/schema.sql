-- Plans table
CREATE TABLE IF NOT EXISTS plans (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  price INTEGER NOT NULL DEFAULT 0,
  lemonsqueezy_variant_id TEXT,
  paddle_price_id TEXT,
  paddle_product_id TEXT,
  max_clients INTEGER NOT NULL DEFAULT 0,
  max_invoices_per_month INTEGER NOT NULL DEFAULT 0,
  features_json TEXT NOT NULL DEFAULT '[]',
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  plan_id TEXT NOT NULL REFERENCES plans(id),
  lemonsqueezy_subscription_id TEXT UNIQUE,
  paddle_subscription_id TEXT,
  status TEXT NOT NULL DEFAULT 'trialing' CHECK(status IN ('trialing','active','past_due','canceled','expired','paused')),
  starts_at TEXT,
  ends_at TEXT,
  renewal_at TEXT,
  grace_period_ends_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Roles table
CREATE TABLE IF NOT EXISTS roles (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT
);

-- Permissions table
CREATE TABLE IF NOT EXISTS permissions (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT
);

-- Role-permissions join table
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id TEXT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- User-roles join table
CREATE TABLE IF NOT EXISTS user_roles (
  user_id TEXT NOT NULL,
  role_id TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  action TEXT NOT NULL,
  target TEXT,
  metadata TEXT NOT NULL DEFAULT '{}',
  ip_address TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Clients table
CREATE TABLE IF NOT EXISTS clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  company TEXT,
  nit TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  tax_type TEXT,
  bank TEXT,
  account_type TEXT,
  account_number TEXT,
  notes TEXT,
  total_invoiced INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  color TEXT,
  initials TEXT
);

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  client_id INTEGER,
  client_name TEXT,
  date TEXT,
  value INTEGER,
  status TEXT DEFAULT 'pending',
  concept TEXT,
  priority TEXT,
  description TEXT,
  subtotal INTEGER,
  tax_val INTEGER,
  ret_val INTEGER,
  total INTEGER
);
