import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, adminOnly } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

router.use(authMiddleware);
router.use(adminOnly);

router.get('/', async (req, res) => {
  const usuario = await prisma.usuario.findUnique({
    where: { id: req.userId }
  });
  if (!usuario?.empresaId) return res.json([]);

  const usuarios = await prisma.usuario.findMany({
    where: { empresaId: usuario.empresaId, activo: true },
    select: { id: true, nombre: true, email: true, rol: true, telefono: true }
  });
  res.json(usuarios);
});

router.post('/', async (req, res) => {
  const { email, password, nombre, rol, telefono } = req.body;
  const usuario = await prisma.usuario.findUnique({
    where: { id: req.userId }
  });
  if (!usuario?.empresaId) {
    return res.status(400).json({ error: 'Usuario sin empresa' });
  }

  const hash = await bcrypt.hash(password || '123456', 10);
  const nuevo = await prisma.usuario.create({
    data: {
      email,
      password: hash,
      nombre,
      rol: rol || 'OPERARIO',
      telefono,
      empresaId: usuario.empresaId
    },
    select: { id: true, nombre: true, email: true, rol: true }
  });
  res.status(201).json(nuevo);
});

export default router;
