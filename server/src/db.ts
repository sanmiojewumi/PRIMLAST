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

  let schemaPath = path.resolve(__dirname, '..', 'schema.sql');
  if (!fs.existsSync(schemaPath)) {
    schemaPath = path.resolve(__dirname, 'schema.sql');
  }
  if (!fs.existsSync(schemaPath)) {
    schemaPath = path.resolve(process.cwd(), 'schema.sql');
  }
  if (!fs.existsSync(schemaPath)) {
    schemaPath = path.resolve(process.cwd(), 'server', 'schema.sql');
  }
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  
  // SQLite multiple statements execution is supported via exec
  await db.exec(schemaSql);

  // Always seed missing default users
  await seedDatabase(db);
}

async function seedDatabase(db: Database) {
  // Hash passwords
  const salt = await bcrypt.genSalt(10);
  const adminHash = await bcrypt.hash('admin123', salt);
  const opsHash = await bcrypt.hash('ops123', salt);
  const compHash = await bcrypt.hash('compliance123', salt);
  const clientHash = await bcrypt.hash('client123', salt);

  // Seed default accounts if they do not exist
  const adminExists = await db.get('SELECT id FROM users WHERE LOWER(email) = ?', ['admin@primeflow.com']);
  if (!adminExists) {
    await db.run(
      'INSERT INTO users (name, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?)',
      ['System Administrator', 'admin@primeflow.com', adminHash, 'admin', 'active']
    );
  }

  const opsExists = await db.get('SELECT id FROM users WHERE LOWER(email) = ?', ['ops@primeflow.com']);
  if (!opsExists) {
    await db.run(
      'INSERT INTO users (name, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?)',
      ['Fatima Ibrahim', 'ops@primeflow.com', opsHash, 'operations_officer', 'active']
    );
  }

  const compExists = await db.get('SELECT id FROM users WHERE LOWER(email) = ?', ['compliance@primeflow.com']);
  if (!compExists) {
    await db.run(
      'INSERT INTO users (name, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?)',
      ['Chinedu Okafor', 'compliance@primeflow.com', compHash, 'compliance_officer', 'active']
    );
  }

  const clientExists = await db.get('SELECT id FROM users WHERE LOWER(email) = ?', ['client@primeflow.com']);
  if (!clientExists) {
    await db.run(
      'INSERT INTO users (name, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?)',
      ['Babajide Sowande', 'client@primeflow.com', clientHash, 'client', 'active']
    );
  }

  // Retrieve user IDs for referencing
  const adminUser = await db.get<{ id: number }>('SELECT id FROM users WHERE email = ?', ['admin@primeflow.com']);
  const opsUser = await db.get<{ id: number }>('SELECT id FROM users WHERE email = ?', ['ops@primeflow.com']);
  const compUser = await db.get<{ id: number }>('SELECT id FROM users WHERE email = ?', ['compliance@primeflow.com']);
  const clientUser = await db.get<{ id: number }>('SELECT id FROM users WHERE email = ?', ['client@primeflow.com']);

  if (!adminUser || !opsUser || !compUser || !clientUser) return;

  // Seed Applications
  // Application 1: Company Incorporation (In Progress)
  const incDetails = JSON.stringify({
    proposedNames: ['PrimeTech Solutions Ltd', 'PrimeTech Digital Hub Ltd'],
    shareCapital: '1,000,000',
    directors: [
      { name: 'Babajide Sowande', address: 'Abuja, Nigeria', phone: '08012345678' }
    ],
    natureOfBusiness: 'Information Technology Services'
  });
  await db.run(
    'INSERT INTO applications (client_id, service_type, status, assigned_to, details) VALUES (?, ?, ?, ?, ?)',
    [clientUser.id, 'company_incorporation', 'processing', opsUser.id, incDetails]
  );

  // Application 2: Business Registration (Submitted)
  const regDetails = JSON.stringify({
    proposedNames: ['Aso Rock Ventures', 'Abuja Spice Catering'],
    natureOfBusiness: 'Catering and Event Planning',
    proprietors: [
      { name: 'Babajide Sowande', address: 'Wuse II, Abuja', phone: '08012345678' }
    ]
  });
  await db.run(
    'INSERT INTO applications (client_id, service_type, status, details) VALUES (?, ?, ?, ?)',
    [clientUser.id, 'business_registration', 'submitted', regDetails]
  );

  // Application 3: Compliance Services (Additional Info Required)
  const compDetails = JSON.stringify({
    taxIdentificationNumber: '12345678-0001',
    permitType: 'SCUML Registration',
    currentStatus: 'Awaiting Document Upload'
  });
  await db.run(
    'INSERT INTO applications (client_id, service_type, status, assigned_to, details) VALUES (?, ?, ?, ?, ?)',
    [clientUser.id, 'compliance', 'add_info_required', compUser.id, compDetails]
  );

  // Get application IDs for message seeds
  const app1 = await db.get<{ id: number }>('SELECT id FROM applications WHERE service_type = ? AND status = ?', ['company_incorporation', 'processing']);
  const app3 = await db.get<{ id: number }>('SELECT id FROM applications WHERE service_type = ? AND status = ?', ['compliance', 'add_info_required']);

  if (app1) {
    // Seed Messages
    await db.run(
      'INSERT INTO messages (sender_id, receiver_id, application_id, message_text) VALUES (?, ?, ?, ?)',
      [clientUser.id, opsUser.id, app1.id, 'Hello Fatima, I have submitted the proposed names. When can I expect feedback?']
    );
    await db.run(
      'INSERT INTO messages (sender_id, receiver_id, application_id, message_text) VALUES (?, ?, ?, ?)',
      [opsUser.id, clientUser.id, app1.id, 'Hello Babajide, I am currently reviewing the name availability with the Corporate Affairs Commission (CAC). I will update you as soon as we get a response.']
    );
  }

  if (app3) {
    await db.run(
      'INSERT INTO messages (sender_id, receiver_id, application_id, message_text) VALUES (?, ?, ?, ?)',
      [compUser.id, clientUser.id, app3.id, 'Please upload a clear copy of your valid ID (National ID or Passport) to proceed with SCUML compliance registration.']
    );
  }

  // Seed Audit Logs
  await db.run(
    'INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
    [adminUser.id, 'DATABASE_SEED', 'Successfully seeded mock users and projects in Abuja, Nigeria database.', '127.0.0.1']
  );
  console.log('Seeding completed.');
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
