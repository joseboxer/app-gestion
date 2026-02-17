import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

router.post('/', async (req, res) => {
  const { tipo, obraId, latitud, longitud } = req.body;
  const fichaje = await prisma.fichaje.create({
    data: {
      tipo,
      usuarioId: req.userId,
      obraId: obraId || null,
      latitud,
      longitud
    }
  });
  res.status(201).json(fichaje);
});

router.get('/resumen', async (req, res) => {
  const { obraId, desde, hasta } = req.query;
  const where = { usuarioId: req.userId };
  if (obraId) where.obraId = obraId;
  if (desde) where.timestamp = { gte: new Date(desde) };
  if (hasta) where.timestamp = { ...where.timestamp, lte: new Date(hasta) };

  const fichajes = await prisma.fichaje.findMany({
    where,
    include: { obra: true },
    orderBy: { timestamp: 'desc' }
  });
  res.json(fichajes);
});

export default router;
