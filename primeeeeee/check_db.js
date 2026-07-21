const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '..', '..', '..', '..', '..', 'Desktop', 'PRIMEFLOW', 'server', 'primeflow.db');
console.log('Checking database at:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
    process.exit(1);
  }
});

db.all("SELECT type, name, tbl_name, sql FROM sqlite_master", [], (err, rows) => {
  if (err) {
    console.error('Error querying sqlite_master:', err);
    process.exit(1);
  }

  console.log('Found', rows.length, 'objects in database.');
  const broken = rows.filter(r => r.sql && r.sql.includes('users_old'));
  if (broken.length > 0) {
    console.log('Broken objects referencing users_old:');
    console.log(JSON.stringify(broken, null, 2));
  } else {
    console.log('No objects reference users_old directly.');
  }

  // Let's also check if there is an integrity check error or compile error on triggers
  db.all("PRAGMA integrity_check", [], (err2, integrity) => {
    if (err2) {
      console.error('Integrity check error:', err2);
    } else {
      console.log('Integrity check results:', integrity);
    }
    db.close();
  });
});
