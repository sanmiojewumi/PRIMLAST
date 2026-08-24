-- Schema for PrimeFlow Consulting Services Platform

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT CHECK(role IN ('client', 'operations_officer', 'compliance_officer', 'admin', 'supervisor')) NOT NULL,
  status TEXT CHECK(status IN ('active', 'pending')) DEFAULT 'active',
  permissions TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL,
  service_type TEXT CHECK(service_type IN (
    'company_incorporation', 
    'business_registration', 
    'incorporated_trustee', 
    'annual_returns', 
    'post_incorporation', 
    'compliance',
    'other_services'
  )) NOT NULL,
  status TEXT CHECK(status IN (
    'submitted', 
    'under_review', 
    'add_info_required', 
    'action_required', 
    'in_progress', 
    'processing', 
    'approved', 
    'completed', 
    'rejected', 
    'pending'
  )) DEFAULT 'submitted',
  assigned_to INTEGER,
  details TEXT NOT NULL, -- JSON string storing service-specific questionnaire data
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  application_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  filename TEXT NOT NULL,
  original_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size INTEGER NOT NULL,
  is_approved INTEGER DEFAULT 0, -- 0 for pending/not approved, 1 for approved
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sender_id INTEGER NOT NULL,
  receiver_id INTEGER NOT NULL,
  application_id INTEGER NOT NULL,
  message_text TEXT NOT NULL,
  file_url TEXT,
  filename TEXT,
  is_read INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sender_id) REFERENCES users(id),
  FOREIGN KEY (receiver_id) REFERENCES users(id),
  FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  action TEXT NOT NULL,
  details TEXT NOT NULL,
  ip_address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Index creation for speed, performance and database query perfection
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_applications_client ON applications(client_id);
CREATE INDEX IF NOT EXISTS idx_applications_assigned ON applications(assigned_to);
CREATE INDEX IF NOT EXISTS idx_documents_app ON documents(application_id);
CREATE INDEX IF NOT EXISTS idx_documents_user ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_app ON messages(application_id);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(receiver_id, is_read);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

CREATE TABLE IF NOT EXISTS profiles (
  user_id INTEGER PRIMARY KEY,
  phone TEXT,
  company_name TEXT,
  address TEXT,
  profile_bio TEXT,
  avatar_url TEXT,
  state TEXT,
  lga TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read INTEGER DEFAULT 0,
  link_type TEXT,
  link_id INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS verification_codes (
  email TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  phone TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Compliance tracking per user
CREATE TABLE IF NOT EXISTS compliance_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  item_key TEXT NOT NULL,           -- e.g. 'cac', 'firs', 'scuml'
  title TEXT NOT NULL,
  agency TEXT NOT NULL,
  status TEXT CHECK(status IN ('compliant','due_soon','overdue','not_registered','pending')) NOT NULL DEFAULT 'not_registered',
  due_date TEXT,                    -- human-readable date string
  details TEXT,
  priority TEXT CHECK(priority IN ('high','medium','low')) DEFAULT 'medium',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_compliance_user ON compliance_items(user_id);

CREATE TABLE IF NOT EXISTS signatures (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  application_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  document_id INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS invoices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  application_id INTEGER,
  client_id INTEGER NOT NULL,
  doc_type TEXT CHECK(doc_type IN ('invoice','receipt')) NOT NULL,
  generation_mode TEXT CHECK(generation_mode IN ('automated','manual')) NOT NULL,
  number TEXT NOT NULL UNIQUE,
  amount REAL NOT NULL,
  tax REAL DEFAULT 0,
  currency TEXT DEFAULT 'NGN',
  description TEXT,
  line_items TEXT,
  status TEXT DEFAULT 'issued',
  issued_by INTEGER,
  payment_status TEXT DEFAULT 'unpaid',
  payment_method TEXT,
  payment_reference TEXT,
  paid_at TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE SET NULL,
  FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS billing_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  auto_invoice_on_complete INTEGER DEFAULT 0,
  bank_name TEXT,
  bank_account_name TEXT,
  bank_account_number TEXT,
  gateway_enabled INTEGER DEFAULT 0,
  paystack_public_key TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO billing_settings (id, auto_invoice_on_complete) VALUES (1, 0);

CREATE INDEX IF NOT EXISTS idx_invoices_client ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_app ON invoices(application_id);
CREATE INDEX IF NOT EXISTS idx_signatures_app ON signatures(application_id);


