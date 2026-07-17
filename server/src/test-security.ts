import app from './index';
import { getDb } from './db';
import bcrypt from 'bcryptjs';

const TEST_PORT = 5001;
const BASE_URL = `http://localhost:${TEST_PORT}`;

// Quick sleep helper
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function runSecurityTests() {
  console.log('\n==================================================');
  console.log('   PRIMEFLOW AUTOMATED SECURITY TEST SUITE');
  console.log('==================================================');

  // Let the database bootstrap complete
  await sleep(2000);

  // Initialize test variables
  let clientToken = '';
  let adminToken = '';
  let serverInstance: any;

  try {
    // 0. Start Server on test port
    serverInstance = app.listen(TEST_PORT, () => {
      console.log(`[TEST SERVER] Running security checks on ${BASE_URL}...`);
    });

    // Login to get tokens for RBAC tests
    // Client token
    const clientLogin = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'client@primeflow.com', password: 'client123' })
    });
    const clientData = await clientLogin.json() as any;
    clientToken = clientData.token;

    // Admin token
    const adminLogin = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@primeflow.com', password: 'admin123' })
    });
    const adminData = await adminLogin.json() as any;
    adminToken = adminData.token;

    let testResults = {
      sqlInjection: false,
      authBypass: false,
      rbacValidation: false,
      fileUploadSecurity: false,
      rateLimiting: false
    };

    // TEST 1: SQL Injection (Authentication Bypass attempt)
    console.log('\n[TEST 1] Testing SQL Injection vulnerability...');
    const sqliResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: "' OR '1'='1",
        password: "' OR '1'='1"
      })
    });
    
    // It should fail with 401 Unauthorized (since it uses parameterized queries)
    if (sqliResponse.status === 401) {
      console.log('  -> PASS: SQL Injection attempt rejected (401 Unauthorized).');
      testResults.sqlInjection = true;
    } else {
      console.log(`  -> FAIL: SQL Injection returned status ${sqliResponse.status}`);
    }

    // TEST 2: Auth Bypass (Requesting protected route without JWT)
    console.log('\n[TEST 2] Testing Authentication Bypass protection...');
    const bypassResponse = await fetch(`${BASE_URL}/api/services/applications`);
    if (bypassResponse.status === 401) {
      console.log('  -> PASS: Protected route rejected unauthorized request (401).');
      testResults.authBypass = true;
    } else {
      console.log(`  -> FAIL: Protected route allowed access without token: ${bypassResponse.status}`);
    }

    // TEST 3: RBAC (Role-Based Access Control) Enforcement
    console.log('\n[TEST 3] Testing Role-Based Access Control (Client accessing Admin route)...');
    const rbacResponse = await fetch(`${BASE_URL}/api/admin/users`, {
      headers: { 'Authorization': `Bearer ${clientToken}` }
    });
    if (rbacResponse.status === 403) {
      console.log('  -> PASS: Client role successfully restricted from accessing Admin endpoint (403 Forbidden).');
      testResults.rbacValidation = true;
    } else {
      console.log(`  -> FAIL: Client allowed access to Admin endpoint: ${rbacResponse.status}`);
    }

    // TEST 4: File Upload Security
    console.log('\n[TEST 4] Testing File Upload Security (Uploading JS executable as document)...');
    
    const formData = new FormData();
    const mockFileBlob = new Blob(['console.log("malicious shell code")'], { type: 'application/javascript' });
    formData.append('file', mockFileBlob, 'hacker_shell.js');
    formData.append('application_id', '1');

    const uploadResponse = await fetch(`${BASE_URL}/api/documents/upload`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${clientToken}` },
      body: formData
    });

    if (uploadResponse.status === 400) {
      const uploadData = await uploadResponse.json() as any;
      console.log(`  -> PASS: Malicious file extension rejected. Error message: "${uploadData.error}"`);
      testResults.fileUploadSecurity = true;
    } else {
      console.log(`  -> FAIL: Server allowed uploading of invalid file extension. Status: ${uploadResponse.status}`);
    }

    // TEST 5: Rate Limiting
    console.log('\n[TEST 5] Testing API Rate Limiting protection...');
    console.log('  Flooding auth/login endpoint with 35 sequential requests...');
    let rateLimitKickedIn = false;
    
    for (let i = 0; i < 35; i++) {
      const floodResponse = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'nonexistent@primeflow.com', password: 'wrong' })
      });
      
      if (floodResponse.status === 429) {
        rateLimitKickedIn = true;
        break;
      }
      // Small pause to prevent connection pooling errors, but fast enough to trigger rate limit
      await sleep(10); 
    }

    if (rateLimitKickedIn) {
      console.log('  -> PASS: Rate limiter successfully triggered (429 Too Many Requests).');
      testResults.rateLimiting = true;
    } else {
      console.log('  -> FAIL: Flood request successfully completed 35 requests without rate limiting.');
    }

    // PRINT SUMMARY CERTIFICATE
    console.log('\n==================================================');
    console.log('            SECURITY AUDIT SUMMARY REPORT');
    console.log('==================================================');
    console.log(`1. SQL Injection Protection:      ${testResults.sqlInjection ? '✓ PASSED' : '✗ FAILED'}`);
    console.log(`2. Authentication Bypass:         ${testResults.authBypass ? '✓ PASSED' : '✗ FAILED'}`);
    console.log(`3. Role-Based Access Control:     ${testResults.rbacValidation ? '✓ PASSED' : '✗ FAILED'}`);
    console.log(`4. Malicious File Upload:         ${testResults.fileUploadSecurity ? '✓ PASSED' : '✗ FAILED'}`);
    console.log(`5. Brute Force Rate Limiter:      ${testResults.rateLimiting ? '✓ PASSED' : '✗ FAILED'}`);
    console.log('==================================================');

    const allPassed = Object.values(testResults).every(v => v === true);
    if (allPassed) {
      console.log('STATUS: ALL CONTROLS ACTIVE & STABLE. SECURITY AUDIT SECURED.\n');
      process.exit(0);
    } else {
      console.log('STATUS: WARNING! ONE OR MORE SECURITY AUDITS FAILED.\n');
      process.exit(1);
    }
  } catch (error) {
    console.error('Test execution error:', error);
    process.exit(1);
  } finally {
    if (serverInstance) {
      serverInstance.close();
    }
  }
}

runSecurityTests();
