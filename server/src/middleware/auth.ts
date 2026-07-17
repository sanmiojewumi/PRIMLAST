import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'primeflow_super_secure_jwt_secret_key_2026_abuja';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: 'client' | 'operations_officer' | 'compliance_officer' | 'admin' | 'supervisor';
    name: string;
    permissions?: any;
  };
}

export function authenticateJWT(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(' ')[1]; // Format: Bearer <token>

    if (!token) {
       res.status(401).json({ error: 'Authentication token missing' });
       return;
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
         res.status(403).json({ error: 'Token is invalid or expired' });
         return;
      }
      req.user = decoded as AuthRequest['user'];
      next();
    });
  } else {
     res.status(401).json({ error: 'Authorization header missing' });
     return;
  }
}

export function requireRole(allowedRoles: ('client' | 'operations_officer' | 'compliance_officer' | 'admin' | 'supervisor')[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
       res.status(401).json({ error: 'Unauthorized: User authentication required' });
       return;
    }

    if (!allowedRoles.includes(req.user.role)) {
       res.status(403).json({ error: 'Forbidden: Insufficient privileges for this operation' });
       return;
    }

    next();
  };
}

export function requirePermission(permissionName: string) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
       res.status(401).json({ error: 'Unauthorized: User authentication required' });
       return;
    }

    if (req.user.role === 'admin') {
      next();
      return;
    }

    if (req.user.role === 'supervisor') {
      let parsedPerms: any = {};
      try {
        const perms = req.user.permissions;
        parsedPerms = typeof perms === 'string' ? JSON.parse(perms) : perms;
      } catch (e) {}

      if (parsedPerms && parsedPerms[permissionName] === true) {
        next();
        return;
      }
    }

    res.status(403).json({ error: 'Forbidden: Insufficient privileges or missing supervisor grant' });
  };
}
