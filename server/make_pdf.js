const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

function generatePDF(outputPath) {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  const writeStream = fs.createWriteStream(outputPath);
  doc.pipe(writeStream);

  // Header Banner
  doc.rect(40, 40, 515, 60).fill('#D71920');
  doc.fillColor('#FFFFFF').fontSize(20).font('Helvetica-Bold').text('PRIMEFLOW CONSULTING SERVICES', 55, 52);
  doc.fontSize(12).font('Helvetica').text('Database Architecture & Replication Guide', 55, 76);

  doc.moveDown(3);
  doc.fillColor('#1E293B');

  // Metadata
  doc.fontSize(10).font('Helvetica-Bold').text('Generated Date: ', 40, 115, { continued: true });
  doc.font('Helvetica').text(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }));
  doc.font('Helvetica-Bold').text('System Engine: ', { continued: true });
  doc.font('Helvetica').text('SQLite 3 (WAL Mode Enabled)');
  doc.font('Helvetica-Bold').text('SQL Configuration File: ', { continued: true });
  doc.font('Helvetica').text('server/primeflow_database_setup.sql');

  doc.moveDown(1.5);

  // Section 1: Overview & Location
  doc.fontSize(14).font('Helvetica-Bold').fillColor('#D71920').text('1. Database Overview & File Paths');
  doc.moveDown(0.5);
  doc.fontSize(10).font('Helvetica').fillColor('#334155').text(
    'PrimeFlow uses an SQLite 3 relational database with Write-Ahead Logging (WAL) for high reliability, zero-configuration setup, and high concurrency.'
  );
  doc.moveDown(0.5);
  
  doc.font('Helvetica-Bold').text('File Locations Across Environments:');
  doc.font('Helvetica').text('  • Local Development: server/primeflow.db (plus primeflow.db-wal & primeflow.db-shm)');
  doc.font('Helvetica').text('  • Cloud / Render Server: /var/data/primeflow.db (Persistent Storage)');
  doc.font('Helvetica').text('  • Vercel / Serverless Environment: /tmp/primeflow.db');

  doc.moveDown(1.5);

  // Section 2: Accessing & Inspecting Database
  doc.fontSize(14).font('Helvetica-Bold').fillColor('#D71920').text('2. How to Access and Inspect the Database');
  doc.moveDown(0.5);
  doc.fontSize(10).font('Helvetica-Bold').fillColor('#1E293B').text('Command Line (SQLite CLI):');
  doc.font('Helvetica').fillColor('#334155').text('  $ sqlite3 server/primeflow.db');
  doc.text('  SQLite> .tables                            -- List all database tables');
  doc.text('  SQLite> .schema users                      -- Display table DDL schema');
  doc.text('  SQLite> SELECT id, name, email, role FROM users; -- Query registered users');

  doc.moveDown(0.8);
  doc.font('Helvetica-Bold').fillColor('#1E293B').text('Graphical User Interfaces (GUI Tools):');
  doc.font('Helvetica').fillColor('#334155').text('  • DB Browser for SQLite (Free Open Source - sqlitebrowser.org)');
  doc.font('Helvetica').text('  • VS Code Extension: "SQLite Viewer" or "vscode-sqlite"');
  doc.font('Helvetica').text('  • DBeaver / Beekeeper Studio / TablePlus');

  doc.moveDown(1.5);

  // Section 3: Tables Overview
  doc.fontSize(14).font('Helvetica-Bold').fillColor('#D71920').text('3. Database Tables & Default Seed Accounts');
  doc.moveDown(0.5);
  doc.fontSize(10).font('Helvetica-Bold').fillColor('#1E293B').text('Core Tables Summary:');
  doc.font('Helvetica').fillColor('#334155').text('  1. users               - User accounts, roles (client, admin, ops, compliance, supervisor)');
  doc.font('Helvetica').text('  2. applications        - Client business filings (CAC Incorporation, BN, Compliance, etc.)');
  doc.font('Helvetica').text('  3. documents           - Uploaded identity docs, CAC certificates, file approval status');
  doc.font('Helvetica').text('  4. messages            - Consultation chat history between clients and staff officers');
  doc.font('Helvetica').text('  5. audit_logs          - Security action logs, IP addresses, system audit trails');
  doc.font('Helvetica').text('  6. profiles            - Company details, addresses, phone numbers, state/LGA');
  doc.font('Helvetica').text('  7. notifications       - Real-time in-app alerts and notifications');
  doc.font('Helvetica').text('  8. verification_codes  - OTP email registration codes');
  doc.font('Helvetica').text('  9. compliance_items    - SCUML, Pencom, ITF, TCC, NSITF corporate compliance items');

  doc.moveDown(0.8);
  doc.font('Helvetica-Bold').fillColor('#1E293B').text('Default Seeded Accounts:');
  doc.font('Helvetica').fillColor('#334155').text('  • System Admin:         admin@primeflow.com       (Password: admin123)');
  doc.font('Helvetica').text('  • Operations Officer:   ops@primeflow.com         (Password: ops123)');
  doc.font('Helvetica').text('  • Compliance Officer:   compliance@primeflow.com  (Password: compliance123)');
  doc.font('Helvetica').text('  • Corporate Client:     client@primeflow.com      (Password: client123)');

  doc.addPage();

  // Page 2: Replication Instructions
  doc.rect(40, 40, 515, 40).fill('#1E293B');
  doc.fillColor('#FFFFFF').fontSize(16).font('Helvetica-Bold').text('DATABASE REPLICATION GUIDE', 55, 52);

  doc.moveDown(2.5);
  doc.fillColor('#1E293B');

  doc.fontSize(14).font('Helvetica-Bold').fillColor('#D71920').text('4. Step-by-Step Database Replication Instructions');
  doc.moveDown(0.8);

  doc.fontSize(11).font('Helvetica-Bold').fillColor('#1E293B').text('Method A: Automatic Re-initialization & Seeding (Simplest)');
  doc.fontSize(10).font('Helvetica').fillColor('#334155').text(
    '1. Stop the backend Node server.\n' +
    '2. Delete primeflow.db, primeflow.db-wal, and primeflow.db-shm from the server/ directory:\n' +
    '   $ rm server/primeflow.db*\n' +
    '3. Restart the server: $ cd server && npm run dev\n' +
    '4. The server automatically initializes all tables, indexes, and seeds test accounts.'
  );

  doc.moveDown(1.2);
  doc.fontSize(11).font('Helvetica-Bold').fillColor('#1E293B').text('Method B: Manual SQL Execution via .SQL File');
  doc.fontSize(10).font('Helvetica').fillColor('#334155').text(
    '1. Execute the standalone SQL file:\n' +
    '   $ sqlite3 server/primeflow.db < server/primeflow_database_setup.sql\n' +
    '2. This creates all 9 tables, 10 performance indexes, and seeds initial system users.'
  );

  doc.moveDown(1.2);
  doc.fontSize(11).font('Helvetica-Bold').fillColor('#1E293B').text('Method C: Data Backup & Clone via SQL Dump');
  doc.fontSize(10).font('Helvetica').fillColor('#334155').text(
    'To create an exact duplicate of an active database including all client records:\n' +
    '1. Export dump: $ sqlite3 server/primeflow.db .dump > backup_dump.sql\n' +
    '2. Import dump: $ sqlite3 server/replicated_primeflow.db < backup_dump.sql'
  );

  doc.moveDown(1.2);
  doc.fontSize(11).font('Helvetica-Bold').fillColor('#1E293B').text('Method D: Production PostgreSQL / MySQL Migration');
  doc.fontSize(10).font('Helvetica').fillColor('#334155').text(
    '1. Datatype Conversions:\n' +
    '   - INTEGER PRIMARY KEY AUTOINCREMENT -> SERIAL PRIMARY KEY\n' +
    '   - TEXT -> TEXT / VARCHAR\n' +
    '   - TIMESTAMP DEFAULT CURRENT_TIMESTAMP -> TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP\n' +
    '2. Run DDL queries on target server (Supabase / AWS RDS / Neon Postgres).'
  );

  doc.moveDown(2);
  doc.fontSize(9).font('Helvetica-Oblique').fillColor('#64748B').text(
    'PrimeFlow Consulting Services Platform — Official Database Documentation',
    { align: 'center' }
  );

  doc.end();

  return new Promise((resolve, reject) => {
    writeStream.on('finish', resolve);
    writeStream.on('error', reject);
  });
}

async function run() {
  const p1 = path.resolve(__dirname, 'PrimeFlow_Database_Documentation_and_Replication_Guide.pdf');
  const p2 = path.resolve('C:\\Users\\Rhythm Plug\\.gemini\\antigravity\\brain\\966a05e4-177d-422e-b87a-d7c7141fd1cd', 'PrimeFlow_Database_Documentation_and_Replication_Guide.pdf');

  await generatePDF(p1);
  await generatePDF(p2);
  console.log('PDF documents generated successfully!');
}

run().catch(console.error);
