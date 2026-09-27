-- =============================================================================
-- PRIMEFLOW CONSULTING SERVICES PLATFORM DATABASE CONFIGURATION (.SQL)
-- Target RDBMS: SQLite 3 / PostgreSQL Compatible Schema
-- Project: PRIMEFLOW Platform
-- Generated: 2026-08-23
-- =============================================================================

PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

-- -----------------------------------------------------------------------------
-- 1. USERS TABLE
-- -----------------------------------------------------------------------------
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

-- -----------------------------------------------------------------------------
-- 2. APPLICATIONS TABLE
-- -----------------------------------------------------------------------------
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
  details TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
);

-- -----------------------------------------------------------------------------
-- 3. DOCUMENTS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  application_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  filename TEXT NOT NULL,
  original_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size INTEGER NOT NULL,
  is_approved INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- -----------------------------------------------------------------------------
-- 4. MESSAGES TABLE
-- -----------------------------------------------------------------------------
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

-- -----------------------------------------------------------------------------
-- 5. AUDIT LOGS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  action TEXT NOT NULL,
  details TEXT NOT NULL,
  ip_address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- -----------------------------------------------------------------------------
-- 6. PROFILES TABLE
-- -----------------------------------------------------------------------------
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

-- -----------------------------------------------------------------------------
-- 7. NOTIFICATIONS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- -----------------------------------------------------------------------------
-- 8. VERIFICATION CODES TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS verification_codes (
  email TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  phone TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 9. COMPLIANCE ITEMS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS compliance_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  item_key TEXT NOT NULL,
  title TEXT NOT NULL,
  agency TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'not_registered',
  due_date TEXT,
  details TEXT,
  priority TEXT DEFAULT 'medium',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =============================================================================
-- PERFORMANCE INDEXES
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_applications_client ON applications(client_id);
CREATE INDEX IF NOT EXISTS idx_applications_assigned ON applications(assigned_to);
CREATE INDEX IF NOT EXISTS idx_documents_app ON documents(application_id);
CREATE INDEX IF NOT EXISTS idx_documents_user ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_app ON messages(application_id);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(receiver_id, is_read);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);

-- =============================================================================
-- INITIAL DEFAULT DATA SEEDING
-- Default Seed Passwords:
-- admin@primeflow.com       -> admin123
-- ops@primeflow.com         -> ops123
-- compliance@primeflow.com  -> compliance123
-- client@primeflow.com      -> client123
-- =============================================================================

INSERT OR IGNORE INTO users (id, name, email, password_hash, role, status) VALUES
(1, 'System Administrator', 'admin@primeflow.com', '$2a$10$tZ925N6yW9Gg3J0BqY8B1O8K9z8q5gW9Gg3J0BqY8B1O8K9z8q5gW', 'admin', 'active'),
(2, 'Fatima Ibrahim', 'ops@primeflow.com', '$2a$10$tZ925N6yW9Gg3J0BqY8B1O8K9z8q5gW9Gg3J0BqY8B1O8K9z8q5gW', 'operations_officer', 'active'),
(3, 'Chinedu Okafor', 'compliance@primeflow.com', '$2a$10$tZ925N6yW9Gg3J0BqY8B1O8K9z8q5gW9Gg3J0BqY8B1O8K9z8q5gW', 'compliance_officer', 'active'),
(4, 'Babajide Sowande', 'client@primeflow.com', '$2a$10$tZ925N6yW9Gg3J0BqY8B1O8K9z8q5gW9Gg3J0BqY8B1O8K9z8q5gW', 'client', 'active');

INSERT OR IGNORE INTO profiles (user_id, phone, company_name, address, profile_bio, state, lga) VALUES
(1, '+2347072928256', 'PrimeFlow Consulting Services', 'Suite 29, Ejimuz Plaza, Aso Savings Road, Kubwa, Abuja', 'System Administrator Account', 'FCT (Abuja)', 'Municipal Area Council (AMAC)'),
(4, '+2348031234567', 'PrimeFlow Test Enterprise', 'Plot 12, Commercial District, Victoria Island, Lagos', 'Corporate Client Account', 'Lagos', 'Eti Osa');

INSERT OR IGNORE INTO audit_logs (user_id, action, details, ip_address) VALUES
(1, 'DATABASE_SEED', 'Initial schema creation and seed completed.', '127.0.0.1');

-- =============================================================================
-- END OF PRIMEFLOW DATABASE CONFIGURATION SQL SCRIPT
-- =============================================================================
