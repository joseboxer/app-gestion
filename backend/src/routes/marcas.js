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

  const marcas = await prisma.marca.findMany({
    where: { empresaId: usuario.empresaId },
    orderBy: { nombre: 'asc' }
  });
  res.json(marcas);
});

router.post('/', async (req, res) => {
  const usuario = await prisma.usuario.findUnique({
    where: { id: req.userId }
  });
  if (!usuario?.empresaId) {
    return res.status(400).json({ error: 'Usuario sin empresa asignada' });
  }

  const { nombre } = req.body;
  if (!nombre || !String(nombre).trim()) {
    return res.status(400).json({ error: 'El nombre de la marca es obligatorio' });
  }

  const marca = await prisma.marca.create({
    data: {
      nombre: String(nombre).trim(),
      empresaId: usuario.empresaId
    }
  });
  res.json(marca);
});

export default router;
