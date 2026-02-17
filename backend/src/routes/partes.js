import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

// Obtener partes del operario asignado o todos
router.get('/', async (req, res) => {
  const { hoy, asignadoId } = req.query;
  const where = {};

  if (req.userRol === 'OPERARIO') {
    where.asignadoId = req.userId;
  } else if (asignadoId) {
    where.asignadoId = asignadoId;
  }

  if (hoy === 'true') {
    where.estado = { in: ['PENDIENTE', 'EN_CURSO'] };
  }

  const partes = await prisma.parteTrabajo.findMany({
    where,
    include: {
      obra: true,
      asignado: { select: { id: true, nombre: true, telefono: true } },
      gastosMaterial: true
    },
    orderBy: { createdAt: 'desc' }
  });

  res.json(partes);
});

router.post('/', async (req, res) => {
  const { asignadoId, ...data } = req.body;
  const parte = await prisma.parteTrabajo.create({
    data: {
      ...data,
      asignadoId: asignadoId || null
    },
    include: { obra: true, asignado: true }
  });

  // Notificar al operario vía WebSocket
  const io = req.app.get('io');
  if (asignadoId && io) {
    io.to(`user:${asignadoId}`).emit('parte-asignado', parte);
  }

  res.status(201).json(parte);
});

router.patch('/:id', async (req, res) => {
  const parte = await prisma.parteTrabajo.update({
    where: { id: req.params.id },
    data: req.body,
    include: { obra: true, asignado: true, gastosMaterial: true }
  });
  res.json(parte);
});

router.post('/:id/material', async (req, res) => {
  const { nombre, cantidad, unidad, precioUnit, notas } = req.body;
  const gasto = await prisma.gastoMaterial.create({
    data: {
      parteId: req.params.id,
      operarioId: req.userId,
      nombre,
      cantidad,
      unidad: unidad || 'ud',
      precioUnit,
      notas
    }
  });
  res.status(201).json(gasto);
});

export default router;
