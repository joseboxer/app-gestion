import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  let empresa = await prisma.empresa.findFirst({
    where: { nombre: 'Reformas García' }
  });
  if (!empresa) {
    empresa = await prisma.empresa.create({
      data: {
        nombre: 'Reformas García',
        cif: 'B12345678',
        direccion: 'Calle Sevilla 1',
        telefono: '954123456',
        email: 'info@reformasgarcia.es'
      }
    });
  }

  const hash = await bcrypt.hash('admin123', 10);
  let admin = await prisma.usuario.findUnique({
    where: { email: 'admin@reformasgarcia.es' }
  });
  if (!admin) {
    admin = await prisma.usuario.create({
      data: {
        email: 'admin@reformasgarcia.es',
        password: hash,
        nombre: 'Juan García',
        rol: 'ADMIN',
        telefono: '666111222',
        empresaId: empresa.id
      }
    });
  }

  const hashOp = await bcrypt.hash('operario123', 10);
  let operario = await prisma.usuario.findUnique({
    where: { email: 'carlos@reformasgarcia.es' }
  });
  if (!operario) {
    operario = await prisma.usuario.create({
      data: {
        email: 'carlos@reformasgarcia.es',
        password: hashOp,
        nombre: 'Carlos López',
        rol: 'OPERARIO',
        telefono: '666333444',
        empresaId: empresa.id
      }
    });
  }

  const obraCount = await prisma.obra.count({ where: { empresaId: empresa.id } });
  if (obraCount === 0) {
    await prisma.obra.create({
      data: {
        nombre: 'Reforma Piso Triana',
        direccion: 'Calle Betis 12, Sevilla',
        latitud: 37.3891,
        longitud: -5.9845,
        cliente: 'María García',
        telefonoCliente: '666555666',
        estado: 'EN_CURSO',
        empresaId: empresa.id
      }
    });
  }

  const partidasCount = await prisma.partida.count({ where: { empresaId: empresa.id } });
  if (partidasCount === 0) {
    await prisma.partida.createMany({
      data: [
        { codigo: 'PL001', nombre: 'Punto de luz completo', precioUnit: 45, unidad: 'ud', empresaId: empresa.id },
        { codigo: 'PL002', nombre: 'Metro cuadrado pladur', precioUnit: 28, unidad: 'm²', empresaId: empresa.id },
        { codigo: 'F001', nombre: 'Inodoro modelo estándar', precioUnit: 180, unidad: 'ud', empresaId: empresa.id },
        { codigo: 'F002', nombre: 'Metro tubería PVC', precioUnit: 12, unidad: 'm', empresaId: empresa.id }
      ]
    });
  }

  console.log('✅ Seed completado:', { admin: admin.email, operario: operario.email });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
