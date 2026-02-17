import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

router.get('/', async (req, res) => {
  const { obraId } = req.query;
  const where = obraId ? { obraId } : {};

  const presupuestos = await prisma.presupuesto.findMany({
    where,
    include: { obra: true, lineas: true },
    orderBy: { createdAt: 'desc' }
  });
  res.json(presupuestos);
});

router.post('/', async (req, res) => {
  const { obraId, titulo, margen, iva, lineas } = req.body;

  const count = await prisma.presupuesto.count();
  const numero = `PRE-${String(count + 1).padStart(4, '0')}`;

  const presupuesto = await prisma.presupuesto.create({
    data: {
      numero,
      obraId,
      titulo: titulo || null,
      margen: margen ?? 0,
      iva: iva ?? 21,
      lineas: lineas?.length
        ? {
            create: lineas.map((l, i) => ({
              cantidad: l.cantidad,
              precioUnit: l.precioUnit,
              descripcion: l.descripcion || null,
              orden: i,
              partidaId: l.partidaId || null
            }))
          }
        : undefined
    },
    include: { lineas: true, obra: true }
  });

  // Calcular total
  const total = presupuesto.lineas.reduce(
    (sum, l) => sum + l.cantidad * l.precioUnit * (1 + (presupuesto.margen / 100)),
    0
  );
  const totalConIva = total * (1 + presupuesto.iva / 100);

  await prisma.presupuesto.update({
    where: { id: presupuesto.id },
    data: { total: totalConIva }
  });

  res.status(201).json({ ...presupuesto, total: totalConIva });
});

router.post('/:id/firmar', async (req, res) => {
  const { firmaBase64 } = req.body;
  const presupuesto = await prisma.presupuesto.update({
    where: { id: req.params.id },
    data: {
      firmaBase64,
      fechaFirma: new Date(),
      estado: 'FIRMADO'
    },
    include: { obra: true, lineas: true }
  });
  res.json(presupuesto);
});

export default router;
