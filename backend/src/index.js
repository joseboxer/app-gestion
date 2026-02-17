/**
 * App Gestión - API Backend
 * Servidor REST para Panel Web y App Móvil
 */
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';

import authRoutes from './routes/auth.js';
import obrasRoutes from './routes/obras.js';
import presupuestosRoutes from './routes/presupuestos.js';
import partesRoutes from './routes/partes.js';
import usuariosRoutes from './routes/usuarios.js';
import facturasRoutes from './routes/facturas.js';
import materialesRoutes from './routes/materiales.js';
import partidasRoutes from './routes/partidas.js';
import fichajeRoutes from './routes/fichaje.js';

const app = express();
const httpServer = createServer(app);

// WebSocket para notificaciones en tiempo real
const io = new Server(httpServer, {
  cors: { origin: '*' }
});

// Guardar io para usar en rutas
app.set('io', io);

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Para fotos en base64

// Health check
app.get('/api/health', (req, res) => {
  res.json({ ok: true, version: '1.0.0' });
});

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/obras', obrasRoutes);
app.use('/api/presupuestos', presupuestosRoutes);
app.use('/api/partes', partesRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/facturas', facturasRoutes);
app.use('/api/materiales', materialesRoutes);
app.use('/api/partidas', partidasRoutes);
app.use('/api/fichaje', fichajeRoutes);

// WebSocket: notificar a operarios cuando se les asigna un parte
io.on('connection', (socket) => {
  socket.on('register', (userId) => {
    socket.join(`user:${userId}`);
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Error interno' });
});

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`🚀 API App Gestión en http://localhost:${PORT}`);
});
