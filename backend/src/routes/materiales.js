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

  const materiales = await prisma.material.findMany({
    where: { empresaId: usuario.empresaId }
  });
  res.json(materiales);
});

export default router;
