import { Router } from 'express';
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

  const facturas = await prisma.factura.findMany({
    where: { obra: { empresaId: usuario.empresaId } },
    include: { obra: true },
    orderBy: { createdAt: 'desc' }
  });
  res.json(facturas);
});

router.post('/desde-presupuesto/:presupuestoId', async (req, res) => {
  const presupuesto = await prisma.presupuesto.findUnique({
    where: { id: req.params.presupuestoId },
    include: { obra: true, lineas: true }
  });
  if (!presupuesto || presupuesto.estado !== 'FIRMADO') {
    return res.status(400).json({ error: 'Presupuesto no válido' });
  }

  const count = await prisma.factura.count();
  const numero = `2026-${String(count + 1).padStart(3, '0')}`;

  const factura = await prisma.factura.create({
    data: {
      numero,
      total: presupuesto.total,
      obraId: presupuesto.obraId,
      presupuestoId: presupuesto.id,
      estado: 'ENVIADA'
    }
  });

  await prisma.obra.update({
    where: { id: presupuesto.obraId },
    data: { estado: 'FACTURADA' }
  });

  res.status(201).json(factura);
});

router.patch('/:id/estado', async (req, res) => {
  const { estado } = req.body;
  const factura = await prisma.factura.update({
    where: { id: req.params.id },
    data: {
      estado,
      fechaPago: estado === 'PAGADA' ? new Date() : undefined
    }
  });
  res.json(factura);
});

export default router;
