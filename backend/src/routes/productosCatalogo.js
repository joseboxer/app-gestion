import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

const CATALOG_BASE = process.env.PRODUCTOS_CATALOG_PATH || path.join(process.cwd(), 'uploads', 'productos-catalogo');

function sanitizeDirName(str) {
  return String(str || '')
    .replace(/[<>:"/\\|?*]/g, '_')
    .trim() || 'sin_nombre';
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'application/pdf'
    ];
    if (allowed.includes(file.mimetype) || file.originalname?.match(/\.(xlsx?|pdf)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos Excel (.xlsx, .xls) y PDF'));
    }
  }
});

router.use(authMiddleware);

router.get('/', async (req, res) => {
  const usuario = await prisma.usuario.findUnique({
    where: { id: req.userId }
  });
  if (!usuario?.empresaId) return res.json([]);

  const productos = await prisma.productoCatalogo.findMany({
    where: { empresaId: usuario.empresaId },
    include: { marca: true },
    orderBy: [{ marca: { nombre: 'asc' } }, { baseSerial: 'asc' }]
  });
  res.json(productos);
});

router.post('/sync-rma', async (req, res) => {
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: req.userId }
    });
    if (!usuario?.empresaId) {
      return res.status(400).json({ error: 'Usuario sin empresa asignada' });
    }

    if (!fs.existsSync(CATALOG_BASE) || !fs.statSync(CATALOG_BASE).isDirectory()) {
      return res.json({ synced: 0, skipped: 0, message: 'Directorio de catálogo no existe' });
    }

    const marcas = await prisma.marca.findMany({
      where: { empresaId: usuario.empresaId }
    });

    // Mapa por nombre saneado para enlazar carpeta->marca
    const marcaMap = new Map(
      marcas.map((m) => [sanitizeDirName(m.nombre), m])
    );

    let synced = 0;
    let skipped = 0;

    const marcaDirs = fs.readdirSync(CATALOG_BASE, { withFileTypes: true }).filter((d) => d.isDirectory());
    for (const marcaDir of marcaDirs) {
      const marca = marcaMap.get(marcaDir.name);
      if (!marca) {
        skipped += 1;
        continue;
      }

      const marcaPath = path.join(CATALOG_BASE, marcaDir.name);
      const serialDirs = fs.readdirSync(marcaPath, { withFileTypes: true }).filter((d) => d.isDirectory());
      for (const serialDir of serialDirs) {
        const serialPath = path.join(marcaPath, serialDir.name);
        const files = fs.readdirSync(serialPath, { withFileTypes: true }).filter((f) => f.isFile());

        const excel = files.find((f) => /\.(xlsx|xls)$/i.test(f.name));
        const pdf = files.find((f) => /\.pdf$/i.test(f.name));

        if (!excel && !pdf) {
          skipped += 1;
          continue;
        }

        const visualExcelPath = excel
          ? path.join(marcaDir.name, serialDir.name, excel.name).replace(/\\/g, '/')
          : null;
        const visualPdfPath = pdf
          ? path.join(marcaDir.name, serialDir.name, pdf.name).replace(/\\/g, '/')
          : null;

        const updateData = {};
        if (visualExcelPath) updateData.visualExcelPath = visualExcelPath;
        if (visualPdfPath) updateData.visualPdfPath = visualPdfPath;

        await prisma.productoCatalogo.upsert({
          where: {
            marcaId_baseSerial: { marcaId: marca.id, baseSerial: serialDir.name }
          },
          create: {
            baseSerial: serialDir.name,
            visualExcelPath,
            visualPdfPath,
            marcaId: marca.id,
            empresaId: usuario.empresaId
          },
          update: updateData
        });
        synced += 1;
      }
    }

    return res.json({ synced, skipped });
  } catch (err) {
    console.error('Error sincronizando lista RMA:', err);
    return res.status(500).json({ error: err.message || 'Error al sincronizar lista RMA' });
  }
});

router.post('/add-visual', upload.fields([
  { name: 'excel', maxCount: 1 },
  { name: 'pdf', maxCount: 1 }
]), async (req, res) => {
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: req.userId }
    });
    if (!usuario?.empresaId) {
      return res.status(400).json({ error: 'Usuario sin empresa asignada' });
    }

    const { marcaId, baseSerial } = req.body;
    if (!marcaId || !baseSerial || !String(baseSerial).trim()) {
      return res.status(400).json({ error: 'Marca y número de serie base son obligatorios' });
    }

    const marca = await prisma.marca.findFirst({
      where: { id: marcaId, empresaId: usuario.empresaId }
    });
    if (!marca) {
      return res.status(400).json({ error: 'Marca no encontrada' });
    }

    const excelFile = req.files?.excel?.[0];
    const pdfFile = req.files?.pdf?.[0];

    if (!excelFile) {
      return res.status(400).json({ error: 'El archivo Excel del visual es obligatorio' });
    }

    const marcaNombreSanitized = sanitizeDirName(marca.nombre);
    const baseSerialSanitized = sanitizeDirName(baseSerial);
    const dir = path.join(CATALOG_BASE, marcaNombreSanitized, baseSerialSanitized);
    fs.mkdirSync(dir, { recursive: true });

    const excelExt = path.extname(excelFile.originalname) || '.xlsx';
    const excelFilename = `visual${excelExt}`;
    const excelPath = path.join(dir, excelFilename);
    fs.writeFileSync(excelPath, excelFile.buffer);
    const visualExcelPath = path.join(marcaNombreSanitized, baseSerialSanitized, excelFilename).replace(/\\/g, '/');

    let visualPdfPath = null;
    if (pdfFile) {
      const pdfExt = path.extname(pdfFile.originalname) || '.pdf';
      const pdfFilename = `visual${pdfExt}`;
      const pdfPath = path.join(dir, pdfFilename);
      fs.writeFileSync(pdfPath, pdfFile.buffer);
      visualPdfPath = path.join(marcaNombreSanitized, baseSerialSanitized, pdfFilename).replace(/\\/g, '/');
    }

    const producto = await prisma.productoCatalogo.upsert({
      where: {
        marcaId_baseSerial: { marcaId, baseSerial: baseSerialSanitized }
      },
      create: {
        baseSerial: baseSerialSanitized,
        visualExcelPath,
        visualPdfPath,
        marcaId,
        empresaId: usuario.empresaId
      },
      update: {
        visualExcelPath,
        visualPdfPath
      },
      include: { marca: true }
    });

    res.json(producto);
  } catch (err) {
    console.error('Error añadiendo visual:', err);
    res.status(500).json({ error: err.message || 'Error al añadir visual' });
  }
});

router.get('/archivo', (req, res) => {
  const relPath = req.query.path;
  if (!relPath || relPath.includes('..') || path.isAbsolute(relPath)) {
    return res.status(400).json({ error: 'Ruta inválida' });
  }
  const fullPath = path.join(CATALOG_BASE, relPath);
  if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isFile()) {
    return res.status(404).json({ error: 'Archivo no encontrado' });
  }
  res.sendFile(path.resolve(fullPath));
});

export default router;
