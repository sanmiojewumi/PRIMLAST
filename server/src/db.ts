import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';

const dbPath = path.resolve(__dirname, '..', process.env.DATABASE_PATH || 'primeflow.db');

let dbInstance: Database | null = null;

export async function getDb(): Promise<Database> {
  if (dbInstance) {
    return dbInstance;
  }

  // Open database connection
  dbInstance = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  // Enable foreign keys
  await dbInstance.run('PRAGMA foreign_keys = ON');

  // Initialize schema if tables don't exist
  await initializeDatabase(dbInstance);

  return dbInstance;
}

async function initializeDatabase(db: Database) {
  // Enable Write-Ahead Logging (WAL) and foreign keys for high reliability and concurrency
  try {
    await db.exec("PRAGMA journal_mode = WAL;");
    await db.exec("PRAGMA foreign_keys = ON;");
  } catch (e) {}

  // Recreate users table if 'supervisor' is not in the check constraint
  try {
    const tableInfo = await db.get("SELECT sql FROM sqlite_master WHERE type='table' AND name='users'");
    if (tableInfo && tableInfo.sql && !tableInfo.sql.includes('supervisor')) {
      console.log("Migrating users table check constraint for supervisor role...");
      await db.exec("PRAGMA foreign_keys=OFF;");
      await db.exec("ALTER TABLE users RENAME TO users_old;");
      await db.exec(`CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT CHECK(role IN ('client', 'operations_officer', 'compliance_officer', 'admin', 'supervisor')) NOT NULL,
        status TEXT CHECK(status IN ('active', 'pending')) DEFAULT 'active',
        permissions TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`);
      await db.exec("INSERT INTO users (id, name, email, password_hash, role, status, created_at) SELECT id, name, email, password_hash, role, status, created_at FROM users_old;");
      await db.exec("DROP TABLE users_old;");
      await db.exec("PRAGMA foreign_keys=ON;");
      console.log("Migration completed.");
    } else {
      // Ensure permissions column exists
      try {
        await db.exec("ALTER TABLE users ADD COLUMN permissions TEXT");
      } catch (e) {}
    }

    // Recreate applications table if status CHECK constraint doesn't include action_required
    const appTableInfo = await db.get("SELECT sql FROM sqlite_master WHERE type='table' AND name='applications'");
    if (appTableInfo && appTableInfo.sql && !appTableInfo.sql.includes('action_required')) {
      console.log("Migrating applications table check constraint for action_required & in_progress status...");
      await db.exec("PRAGMA foreign_keys=OFF;");
      await db.exec("ALTER TABLE applications RENAME TO applications_old;");
      await db.exec(`CREATE TABLE applications (
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
      );`);
      await db.exec("INSERT INTO applications SELECT * FROM applications_old;");
      await db.exec("DROP TABLE applications_old;");
      await db.exec("PRAGMA foreign_keys=ON;");
      console.log("Applications table migration completed.");
    }

    // Ensure messages columns exist for file sharing in chat
    try {
      await db.exec("ALTER TABLE messages ADD COLUMN file_url TEXT");
    } catch (e) {}
    try {
      await db.exec("ALTER TABLE messages ADD COLUMN filename TEXT");
    } catch (e) {}
    try {
      await db.exec("ALTER TABLE messages ADD COLUMN is_read INTEGER DEFAULT 0");
    } catch (e) {}
    try {
      await db.exec("ALTER TABLE profiles ADD COLUMN state TEXT");
    } catch (e) {}
    try {
      await db.exec("ALTER TABLE profiles ADD COLUMN lga TEXT");
    } catch (e) {}
  } catch (err) {
    console.error("Migration warning:", err);
  }

  const schemaPath = path.resolve(__dirname, '..', 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  
  // SQLite multiple statements execution is supported via exec
  await db.exec(schemaSql);

  // Check if we already have users. If not, seed the database with mock data.
  const userCount = await db.get<{ count: number }>('SELECT COUNT(*) as count FROM users');
  if (userCount && userCount.count === 0) {
    console.log('Database empty. Seeding mock data...');
    await seedDatabase(db);
  }
}

async function seedDatabase(db: Database) {
  // Hash passwords
  const salt = await bcrypt.genSalt(10);
  const adminHash = await bcrypt.hash('admin123', salt);
  const opsHash = await bcrypt.hash('ops123', salt);
  const compHash = await bcrypt.hash('compliance123', salt);
  const clientHash = await bcrypt.hash('client123', salt);

  // Seed Initial System Users
  await db.run(
    'INSERT INTO users (name, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?)',
    ['System Administrator', 'admin@primeflow.com', adminHash, 'admin', 'active']
  );
  await db.run(
    'INSERT INTO users (name, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?)',
    ['Fatima Ibrahim', 'ops@primeflow.com', opsHash, 'operations_officer', 'active']
  );
  await db.run(
    'INSERT INTO users (name, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?)',
    ['Chinedu Okafor', 'compliance@primeflow.com', compHash, 'compliance_officer', 'active']
  );
  await db.run(
    'INSERT INTO users (name, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?)',
    ['Babajide Sowande', 'client@primeflow.com', clientHash, 'client', 'active']
  );

  const adminUser = await db.get<{ id: number }>('SELECT id FROM users WHERE email = ?', ['admin@primeflow.com']);
  if (adminUser) {
    await db.run(
      'INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
      [adminUser.id, 'DATABASE_SEED', 'System initialized.', '127.0.0.1']
    );
  }
  console.log('Database initialization completed.');
}

export async function sendNotificationEmail(db: any, userId: number, title: string, messageText: string) {
  try {
    const user = await db.get('SELECT name, email FROM users WHERE id = ?', [userId]);
    if (!user) return;

    const emailData = {
      to: user.email,
      toName: user.name,
      subject: `[PrimeFlow Alert] ${title}`,
      body: `Dear ${user.name},\n\nThis is an alert from PrimeFlow Admin:\n\n${messageText}\n\nBest regards,\nPrimeFlow Team`,
      timestamp: new Date().toISOString()
    };

    const mailboxPath = path.resolve(__dirname, '..', 'mock_mailbox.json');
    let currentMailbox: any[] = [];
    if (fs.existsSync(mailboxPath)) {
      try {
        currentMailbox = JSON.parse(fs.readFileSync(mailboxPath, 'utf8'));
      } catch (e) {
        currentMailbox = [];
      }
    }
    currentMailbox.push(emailData);
    fs.writeFileSync(mailboxPath, JSON.stringify(currentMailbox, null, 2), 'utf8');
    console.log(`[EMAIL SENT] To: ${user.email} | Subject: ${emailData.subject}`);
  } catch (err) {
    console.error('Failed to send notification email simulation:', err);
  }
}
