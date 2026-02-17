import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.userId = decoded.userId;
    req.userRol = decoded.rol;
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido' });
  }
}

export function adminOnly(req, res, next) {
  if (req.userRol !== 'ADMIN') {
    return res.status(403).json({ error: 'Solo administradores' });
  }
  next();
}
