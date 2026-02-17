import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

router.get('/', async (req, res) => {
  const usuario = await prisma.usuario.findUnique({
    where: { id: req.userId }
  });
  if (!usuario?.empresaId) return res.json([]);

  const partidas = await prisma.partida.findMany({
    where: { empresaId: usuario.empresaId, activo: true }
  });
  res.json(partidas);
});

router.post('/', async (req, res) => {
  const usuario = await prisma.usuario.findUnique({
    where: { id: req.userId }
  });
  if (!usuario?.empresaId) {
    return res.status(400).json({ error: 'Usuario sin empresa' });
  }

  const partida = await prisma.partida.create({
    data: { ...req.body, empresaId: usuario.empresaId }
  });
  res.status(201).json(partida);
});

export default router;
