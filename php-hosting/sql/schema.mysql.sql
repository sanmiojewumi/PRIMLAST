-- PrimeFlow MySQL schema (Bluehost). Import in phpMyAdmin after creating the database.

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS users (
  id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('client','operations_officer','compliance_officer','admin','supervisor') NOT NULL,
  status ENUM('active','pending') DEFAULT 'active',
  permissions TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS applications (
  id INT NOT NULL AUTO_INCREMENT,
  client_id INT NOT NULL,
  service_type VARCHAR(64) NOT NULL,
  status VARCHAR(32) DEFAULT 'submitted',
  assigned_to INT NULL,
  details TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_applications_client (client_id),
  KEY idx_applications_assigned (assigned_to),
  CONSTRAINT applications_client_fk FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT applications_assigned_fk FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS documents (
  id INT NOT NULL AUTO_INCREMENT,
  application_id INT NOT NULL,
  user_id INT NOT NULL,
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(128) NOT NULL,
  size INT NOT NULL,
  is_approved TINYINT DEFAULT 0,
  kind VARCHAR(32) DEFAULT 'file',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_documents_app (application_id),
  KEY idx_documents_user (user_id),
  CONSTRAINT documents_app_fk FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
  CONSTRAINT documents_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS messages (
  id INT NOT NULL AUTO_INCREMENT,
  sender_id INT NOT NULL,
  receiver_id INT NOT NULL,
  application_id INT NOT NULL,
  message_text TEXT NOT NULL,
  file_url TEXT,
  filename VARCHAR(255),
  is_read TINYINT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_messages_app (application_id),
  KEY idx_messages_unread (receiver_id, is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS audit_logs (
  id INT NOT NULL AUTO_INCREMENT,
  user_id INT NULL,
  action VARCHAR(128) NOT NULL,
  details TEXT NOT NULL,
  ip_address VARCHAR(64),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_audit_logs_user (user_id),
  KEY idx_audit_logs_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS profiles (
  user_id INT NOT NULL,
  phone VARCHAR(64),
  company_name VARCHAR(255),
  address TEXT,
  profile_bio TEXT,
  avatar_url TEXT,
  state VARCHAR(128),
  lga VARCHAR(128),
  PRIMARY KEY (user_id),
  CONSTRAINT profiles_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS notifications (
  id INT NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read TINYINT DEFAULT 0,
  link_type VARCHAR(64),
  link_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT notifications_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS verification_codes (
  email VARCHAR(255) NOT NULL,
  code VARCHAR(16) NOT NULL,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(64) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS compliance_items (
  id INT NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  item_key VARCHAR(64) NOT NULL,
  title VARCHAR(255) NOT NULL,
  agency VARCHAR(128) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'not_registered',
  due_date VARCHAR(64),
  details TEXT,
  priority VARCHAR(16) DEFAULT 'medium',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_compliance_user (user_id),
  CONSTRAINT compliance_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS signatures (
  id INT NOT NULL AUTO_INCREMENT,
  application_id INT NOT NULL,
  user_id INT NOT NULL,
  document_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_signatures_app (application_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS invoices (
  id INT NOT NULL AUTO_INCREMENT,
  application_id INT NULL,
  client_id INT NOT NULL,
  doc_type ENUM('invoice','receipt') NOT NULL,
  generation_mode ENUM('automated','manual') NOT NULL,
  number VARCHAR(64) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  tax DECIMAL(12,2) DEFAULT 0,
  currency VARCHAR(8) DEFAULT 'NGN',
  description TEXT,
  line_items TEXT,
  status VARCHAR(32) DEFAULT 'issued',
  issued_by INT,
  payment_status VARCHAR(32) DEFAULT 'unpaid',
  payment_method VARCHAR(64),
  payment_reference VARCHAR(128),
  paid_at VARCHAR(64),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY number (number),
  KEY idx_invoices_client (client_id),
  KEY idx_invoices_app (application_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS billing_settings (
  id INT NOT NULL,
  auto_invoice_on_complete TINYINT DEFAULT 0,
  bank_name VARCHAR(128),
  bank_account_name VARCHAR(255),
  bank_account_number VARCHAR(64),
  gateway_enabled TINYINT DEFAULT 0,
  paystack_public_key TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO billing_settings (id, auto_invoice_on_complete) VALUES (1, 0);

SET FOREIGN_KEY_CHECKS = 1;
