import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import path from 'path';
import fs from 'fs';
import { getDb } from '../db';
import { AuthRequest, authenticateJWT } from '../middleware/auth';
import { uploadSecure } from '../middleware/upload';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'primeflow_super_secure_jwt_secret_key_2026_abuja';
const UPLOADS_DIR = path.resolve(__dirname, '..', '..', 'uploads');

// Helper to log audit actions
async function logAudit(userId: number | null, action: string, details: string, ip: string | undefined) {
  try {
    const db = await getDb();
    await db.run(
      'INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
      [userId, action, details, ip || 'unknown']
    );
  } catch (err) {
    console.error('Failed to log audit:', err);
  }
}

// REGISTER
router.post('/register', async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
     res.status(400).json({ error: 'Name, email, and password are required' });
     return;
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
     res.status(400).json({ error: 'Invalid email format' });
     return;
  }

  // Password length restriction
  if (password.length < 8) {
     res.status(400).json({ error: 'Password must be at least 8 characters long' });
     return;
  }

  // Limit registration roles to prevent privilege escalation
  const signupRole = 'client';

  try {
    const db = await getDb();

    // Check if user exists
    const existingUser = await db.get('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser) {
       res.status(409).json({ error: 'User with this email already exists' });
       return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Save user
    const result = await db.run(
      'INSERT INTO users (name, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?)',
      [name, email, passwordHash, signupRole, 'active']
    );

    const userId = result.lastID;
    
    // Seed blank profile row
    await db.run('INSERT INTO profiles (user_id, phone, company_name, address, profile_bio) VALUES (?, ?, ?, ?, ?)', [userId, '', '', '', '']);
    
    // Generate JWT token
    const token = jwt.sign(
      { id: userId, email, role: signupRole, name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    await logAudit(userId ?? null, 'USER_REGISTER', `Created account with role: ${signupRole}`, req.ip);

     res.status(201).json({
      token,
      user: { id: userId, name, email, role: signupRole }
    });
  } catch (err: any) {
    console.error('Registration error:', err);
     res.status(500).json({ error: 'Internal server error' });
  }
});

// REGISTER REQUEST (OTP generation)
router.post('/register-request', async (req, res) => {
  const { name, email, password, phone } = req.body;

  if (!name || !email || !password || !phone) {
     res.status(400).json({ error: 'Name, email, password, and phone number are required' });
     return;
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
     res.status(400).json({ error: 'Invalid email format' });
     return;
  }

  // Password length restriction
  if (password.length < 8) {
     res.status(400).json({ error: 'Password must be at least 8 characters long' });
     return;
  }

  try {
    const db = await getDb();

    // Check if user exists already in users table
    const existingUser = await db.get('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser) {
       res.status(409).json({ error: 'User with this email already exists' });
       return;
    }

    // Generate random 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert or replace in verification_codes table
    await db.run(
      'INSERT OR REPLACE INTO verification_codes (email, code, name, password_hash, phone) VALUES (?, ?, ?, ?, ?)',
      [email, code, name, passwordHash, phone]
    );

    // Log action
    await logAudit(null, 'OTP_REQUEST', `Generated OTP code for ${email}`, req.ip);

    // Return successfully, including the simulated code in response for demo preview!
     res.status(200).json({
      message: 'Verification code generated',
      code // For preview simulation
    });
  } catch (err) {
    console.error(err);
     res.status(500).json({ error: 'Internal server error' });
  }
});

// REGISTER VERIFY (OTP verification and account activation)
router.post('/register-verify', async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
     res.status(400).json({ error: 'Email and verification code are required' });
     return;
  }

  try {
    const db = await getDb();

    // Fetch the code
    const record = await db.get('SELECT * FROM verification_codes WHERE email = ?', [email]);
    if (!record) {
       res.status(400).json({ error: 'Verification code expired or not found. Please register again.' });
       return;
    }

    if (record.code !== code.trim()) {
       res.status(400).json({ error: 'Invalid verification code. Please check and try again.' });
       return;
    }

    // Create the user
    const result = await db.run(
      'INSERT INTO users (name, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?)',
      [record.name, record.email, record.password_hash, 'client', 'active']
    );

    const userId = result.lastID;

    // Seed profile row with phone number
    await db.run(
      'INSERT INTO profiles (user_id, phone, company_name, address, profile_bio) VALUES (?, ?, ?, ?, ?)',
      [userId, record.phone, '', '', '']
    );

    // Generate JWT token
    const token = jwt.sign(
      { id: userId, email: record.email, role: 'client', name: record.name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Clean up verification code
    await db.run('DELETE FROM verification_codes WHERE email = ?', [email]);

    await logAudit(userId || null, 'USER_REGISTER_CONFIRMED', `Email and phone verified successfully for ${email}`, req.ip);

     res.status(201).json({
      token,
      user: { id: userId, name: record.name, email: record.email, role: 'client' }
    });
  } catch (err) {
    console.error(err);
     res.status(500).json({ error: 'Internal server error' });
  }
});

// REGISTER STAFF (Admin and authorized Supervisors)
router.post('/register-staff', authenticateJWT as any, async (req: AuthRequest, res) => {
  let hasAccess = false;
  if (req.user) {
    if (req.user.role === 'admin') {
      hasAccess = true;
    } else if (req.user.role === 'supervisor') {
      let parsedPerms: any = {};
      try {
        const perms = req.user.permissions;
        parsedPerms = typeof perms === 'string' ? JSON.parse(perms) : perms;
      } catch (e) {}
      if (parsedPerms && parsedPerms.can_create_staff === true) {
        hasAccess = true;
      }
    }
  }

  if (!hasAccess) {
     res.status(403).json({ error: 'Forbidden: Insufficient privileges to create staff' });
     return;
  }

  const { name, email, password, role, permissions } = req.body;

  if (!name || !email || !password || !role) {
     res.status(400).json({ error: 'Name, email, password, and role are required' });
     return;
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
     res.status(400).json({ error: 'Invalid email format' });
     return;
  }

  // Password length restriction
  if (password.length < 8) {
     res.status(400).json({ error: 'Password must be at least 8 characters long' });
     return;
  }

  // Valid staff roles check
  if (!['operations_officer', 'compliance_officer', 'admin', 'supervisor'].includes(role)) {
     res.status(400).json({ error: 'Invalid staff role' });
     return;
  }

  try {
     const db = await getDb();

     // Check if user exists
     const existingUser = await db.get('SELECT id FROM users WHERE email = ?', [email]);
     if (existingUser) {
        res.status(409).json({ error: 'User with this email already exists' });
        return;
     }

     const salt = await bcrypt.genSalt(10);
     const passwordHash = await bcrypt.hash(password, salt);

     // Insert staff user
     const result = await db.run(
       'INSERT INTO users (name, email, password_hash, role, status, permissions) VALUES (?, ?, ?, ?, ?, ?)',
       [name, email, passwordHash, role, 'active', permissions ? JSON.stringify(permissions) : null]
     );

     const newUserId = result.lastID;
     
     // Seed blank profile row
     await db.run('INSERT INTO profiles (user_id, phone, company_name, address, profile_bio) VALUES (?, ?, ?, ?, ?)', [newUserId, '', '', '', '']);

     await logAudit(req.user!.id, 'STAFF_CREATION', `Admin created staff user ${email} with role ${role}`, req.ip);

      res.status(201).json({ message: 'Staff user created successfully', userId: newUserId });
  } catch (err) {
     console.error(err);
      res.status(500).json({ error: 'Internal server error' });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
     res.status(400).json({ error: 'Email and password are required' });
     return;
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const cleanPassword = String(password).trim();

  try {
    const db = await getDb();

    // Fetch user (case-insensitive)
    const user = await db.get<any>(
      'SELECT id, name, email, password_hash, role, status, permissions FROM users WHERE LOWER(email) = ?',
      [cleanEmail]
    );

    if (!user) {
      // Avoid enumerating email existence for maximum security. Use generic messages.
      await logAudit(null, 'LOGIN_FAILED', `Failed login attempt for email: ${cleanEmail}`, req.ip);
       res.status(401).json({ error: 'Invalid email or password' });
       return;
    }

    // Verify status
    if (user.status !== 'active') {
       res.status(403).json({ error: 'Your account is suspended or pending approval' });
       return;
    }

    // Verify password
    const match = await bcrypt.compare(cleanPassword, user.password_hash);
    if (!match) {
      await logAudit(user.id, 'LOGIN_FAILED', `Invalid password entered`, req.ip);
       res.status(401).json({ error: 'Invalid email or password' });
       return;
    }

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name, permissions: user.permissions },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    await logAudit(user.id, 'LOGIN_SUCCESS', `User successfully authenticated`, req.ip);

     res.status(200).json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, permissions: user.permissions ? JSON.parse(user.permissions) : null }
    });
  } catch (err: any) {
    console.error('Login error:', err);
     res.status(500).json({ error: 'Internal server error' });
  }
});

// GET CURRENT USER PROFILE
router.get('/me', authenticateJWT as any, async (req: AuthRequest, res) => {
  if (!req.user) {
     res.status(401).json({ error: 'Unauthorized' });
     return;
  }
  
  try {
    const db = await getDb();
    const user = await db.get<any>('SELECT id, name, email, role, status, permissions, created_at FROM users WHERE id = ?', [req.user.id]);
    if (user) {
      user.permissions = user.permissions ? JSON.parse(user.permissions) : null;
    }
     res.status(200).json(user);
  } catch (err) {
     res.status(500).json({ error: 'Internal server error' });
  }
});

// PASSWORD RESET
router.post('/reset-password', async (req, res) => {
  const { email, newPassword } = req.body;

  if (!email || !newPassword) {
     res.status(400).json({ error: 'Email and new password are required' });
     return;
  }

  if (newPassword.length < 8) {
     res.status(400).json({ error: 'Password must be at least 8 characters long' });
     return;
  }

  try {
    const db = await getDb();
    const user = await db.get<any>('SELECT id FROM users WHERE email = ?', [email]);
    
    if (!user) {
      // Silent output or generic success for email security, but let's send response
       res.status(200).json({ message: 'If the email exists, password update instruction succeeded.' });
       return;
    }

    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);

    await db.run('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, user.id]);
    await logAudit(user.id, 'PASSWORD_RESET', 'User reset password successfully', req.ip);

     res.status(200).json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error(err);
     res.status(500).json({ error: 'Internal server error' });
  }
});

// GET USER PROFILE
router.get('/profile/:userId', authenticateJWT as any, async (req: AuthRequest, res) => {
  if (!req.user) {
     res.status(401).json({ error: 'Unauthorized' });
     return;
  }
  
  const userId = parseInt(req.params.userId as string);
  try {
    const db = await getDb();
    
    // Get user details
    const user = await db.get('SELECT name, email, role, status FROM users WHERE id = ?', [userId]);
    if (!user) {
       res.status(404).json({ error: 'User not found' });
       return;
    }
    
    let profile = await db.get('SELECT * FROM profiles WHERE user_id = ?', [userId]);
    if (!profile) {
      profile = {
        user_id: userId,
        phone: '',
        company_name: '',
        address: '',
        profile_bio: '',
        avatar_url: '',
        state: '',
        lga: ''
      };
    } else {
      // Map avatar_url to the endpoint
      if (profile.avatar_url) {
        profile.avatar_url = `/api/auth/avatar/${userId}`;
      }
    }
    
     res.status(200).json({
      user: {
        id: userId,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      },
      profile
    });
  } catch (err) {
     res.status(500).json({ error: 'Internal server error' });
  }
});

// CREATE/UPDATE PROFILE DETAILS
router.post('/profile/:userId', authenticateJWT as any, async (req: AuthRequest, res) => {
  if (!req.user) {
     res.status(401).json({ error: 'Unauthorized' });
     return;
  }
  
  const userId = parseInt(req.params.userId as string);
  const { phone, company_name, address, profile_bio, name, state, lga } = req.body;
  
  // Auth check: Only system administrators can modify text profile fields
  if (req.user.role !== 'admin') {
     res.status(403).json({ error: 'Forbidden: Only system administrators can modify profile text details' });
     return;
  }
  
  try {
    const db = await getDb();
    
    // Check if user exists
    const userExists = await db.get('SELECT id FROM users WHERE id = ?', [userId]);
    if (!userExists) {
       res.status(404).json({ error: 'User not found' });
       return;
    }
    
    // Update name in users table if changed
    if (name) {
      await db.run('UPDATE users SET name = ? WHERE id = ?', [name, userId]);
    }
    
    // Ensure profile row exists
    const profile = await db.get('SELECT user_id FROM profiles WHERE user_id = ?', [userId]);
    if (!profile) {
      await db.run(
        'INSERT INTO profiles (user_id, phone, company_name, address, profile_bio, state, lga) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [userId, phone || '', company_name || '', address || '', profile_bio || '', state || '', lga || '']
      );
    } else {
      await db.run(
        'UPDATE profiles SET phone = ?, company_name = ?, address = ?, profile_bio = ?, state = ?, lga = ? WHERE user_id = ?',
        [phone || '', company_name || '', address || '', profile_bio || '', state || '', lga || '', userId]
      );
    }
    
    await logAudit(req.user.id, 'PROFILE_UPDATE', `Updated profile details for user ID ${userId}`, req.ip);
     res.status(200).json({ message: 'Profile updated successfully' });
  } catch (err) {
     res.status(500).json({ error: 'Internal server error' });
  }
});

// UPLOAD PROFILE AVATAR
router.post('/profile/:userId/avatar', authenticateJWT as any, (req, res, next) => {
  uploadSecure.single('file')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
}, async (req: AuthRequest, res) => {
  if (!req.user) {
     res.status(401).json({ error: 'Unauthorized' });
     return;
  }
  
  const userId = parseInt(req.params.userId as string);
  const file = req.file;
  
  if (!file) {
     res.status(400).json({ error: 'No file uploaded' });
     return;
  }
  
  // Auth check: Clients can only upload their own avatar, admins can upload anyone's
  if (req.user.role !== 'admin' && req.user.id !== userId) {
    if (file && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
     res.status(403).json({ error: 'Forbidden: You cannot upload an avatar for this user' });
     return;
  }
  
  try {
    const db = await getDb();
    
    // Ensure profile row exists
    const profile = await db.get('SELECT user_id FROM profiles WHERE user_id = ?', [userId]);
    if (!profile) {
      await db.run('INSERT INTO profiles (user_id, avatar_url) VALUES (?, ?)', [userId, file.filename]);
    } else {
      // Delete old avatar if it exists
      const oldProfile = await db.get('SELECT avatar_url FROM profiles WHERE user_id = ?', [userId]);
      if (oldProfile && oldProfile.avatar_url) {
        const oldPath = path.resolve(UPLOADS_DIR, oldProfile.avatar_url);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      await db.run('UPDATE profiles SET avatar_url = ? WHERE user_id = ?', [file.filename, userId]);
    }
    
    await logAudit(req.user.id, 'PROFILE_AVATAR_UPLOAD', `Uploaded avatar picture for user ID ${userId}`, req.ip);
     res.status(200).json({ avatar_url: `/api/auth/avatar/${userId}`, message: 'Avatar updated successfully' });
  } catch (err) {
    console.error(err);
    if (file && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
     res.status(500).json({ error: 'Internal server error' });
  }
});

// GET PROFILE AVATAR IMAGE FILE DIRECTLY (Safe/Direct streaming)
router.get('/avatar/:userId', async (req, res) => {
  const userId = parseInt(req.params.userId as string);
  try {
    const db = await getDb();
    const profile = await db.get('SELECT avatar_url FROM profiles WHERE user_id = ?', [userId]);
    if (!profile || !profile.avatar_url) {
       res.redirect('https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150');
       return;
    }
    
    const filePath = path.resolve(UPLOADS_DIR, profile.avatar_url);
    if (!fs.existsSync(filePath)) {
       res.redirect('https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150');
       return;
    }
    
    res.sendFile(filePath);
  } catch (err) {
     res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
