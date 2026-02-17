import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

router.get('/', async (req, res) => {
  const { hoy } = req.query;
  const usuario = await prisma.usuario.findUnique({
    where: { id: req.userId },
    include: { empresa: true }
  });

  if (!usuario?.empresaId) {
    return res.json([]);
  }

  const where = { empresaId: usuario.empresaId };
  if (hoy === 'true') {
    where.estado = 'EN_CURSO';
  }

  const obras = await prisma.obra.findMany({
    where,
    include: {
      presupuestos: { take: 1, orderBy: { createdAt: 'desc' } },
      partesTrabajo: { include: { asignado: true } }
    },
    orderBy: { updatedAt: 'desc' }
  });

  res.json(obras);
});

router.get('/:id', async (req, res) => {
  const obra = await prisma.obra.findFirst({
    where: { id: req.params.id },
    include: {
      presupuestos: true,
      partesTrabajo: { include: { asignado: true, gastosMaterial: true } },
      facturas: true
    }
  });

  if (!obra) return res.status(404).json({ error: 'Obra no encontrada' });
  res.json(obra);
});

router.post('/', async (req, res) => {
  const usuario = await prisma.usuario.findUnique({
    where: { id: req.userId }
  });
  if (!usuario?.empresaId) {
    return res.status(400).json({ error: 'Usuario sin empresa' });
  }

  const obra = await prisma.obra.create({
    data: {
      ...req.body,
      empresaId: usuario.empresaId
    }
  });
  res.status(201).json(obra);
});

router.patch('/:id', async (req, res) => {
  const obra = await prisma.obra.update({
    where: { id: req.params.id },
    data: req.body
  });
  res.json(obra);
});

export default router;
