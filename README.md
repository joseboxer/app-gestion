# App Gestión

Ecosistema de gestión para empresas de reformas, fontanería y electricidad. **Regla de oro:** tan fácil de usar que un operario de 55 años con el móvil lleno de polvo pueda usarla con un solo dedo.

## Arquitectura

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Panel Web     │     │   API REST      │     │   App Móvil     │
│   (React)       │────▶│   (Node.js)     │◀────│   (Expo)        │
│   Para el jefe  │     │   + Socket.io   │     │   Para operarios│
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                │
                                ▼
                        ┌─────────────────┐
                        │   PostgreSQL    │
                        │   (Prisma ORM)   │
                        └─────────────────┘
```

## Módulos

| Módulo | Descripción |
|--------|-------------|
| **Presupuestos in situ** | Partidas predefinidas, +/-, margen, IVA, PDF, firma en pantalla |
| **Partes de trabajo** | Asignar tareas, ver dirección (Maps), registrar materiales, fotos antes/después |
| **Fichaje** | Iniciar/finalizar jornada y obra. Control de rentabilidad por obra |
| **Facturación** | Convertir presupuesto firmado en factura en 1 clic. Estados: Pagada/Pendiente/Abono |
| **Panel del jefe** | Dashboard, calendario, cobros, stock |

## Estructura del proyecto

```
app-gestion/
├── backend/          # API + base de datos
│   ├── prisma/       # Schema y migraciones
│   └── src/          # Rutas, middleware
├── web/              # Panel Web (React + Vite)
├── mobile/           # App Móvil (Expo)
└── README.md
```

## Requisitos

- Node.js 18+
- PostgreSQL
- (Opcional) Cuenta Expo para probar en dispositivo real

## Instalación

```bash
# Clonar e instalar
cd app-gestion
npm install

# Configurar backend
cp backend/.env.example backend/.env
# Editar backend/.env con DATABASE_URL y JWT_SECRET

# Crear base de datos
cd backend && npx prisma migrate dev
npx prisma db seed

# Instalar dependencias de cada app
npm install -w backend
npm install -w web
npm install -w mobile
```

## Ejecución

```bash
# Terminal 1: API
npm run dev:api

# Terminal 2: Panel Web
npm run dev:web

# Terminal 3: App Móvil
npm run dev:mobile
```

- **Panel Web:** http://localhost:3000
- **API:** http://localhost:4000
- **App Móvil:** Escanear QR con Expo Go

## Usuarios de prueba (tras seed)

| Rol | Email | Contraseña |
|-----|-------|------------|
| Admin (jefe) | admin@reformasgarcia.es | admin123 |
| Operario | carlos@reformasgarcia.es | operario123 |

## API - Endpoints principales

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | /api/auth/login | Login |
| GET | /api/obras | Listar obras |
| GET | /api/partes?hoy=true | Partes del operario |
| POST | /api/partes | Crear parte (asignar) |
| PATCH | /api/partes/:id | Actualizar parte |
| POST | /api/fichaje | Registrar fichaje |
| GET | /api/presupuestos | Listar presupuestos |
| POST | /api/facturas/desde-presupuesto/:id | Generar factura |

## App Móvil - Diseño operario

- **Botones grandes** (min 48px altura)
- **Un solo dedo** - sin gestos complejos
- **Fichaje** - Iniciar/Finalizar jornada
- **Tareas** - Lista de partes asignados
- **Cómo llegar** - Abre Google Maps
- **Iniciar/Finalizar** trabajo en obra

Para probar en dispositivo físico: cambiar `API_URL` en `mobile/App.js` por la IP de tu ordenador (ej: `http://192.168.1.100:4000/api`).

## Próximos pasos

- [ ] Generador de presupuestos con partidas y PDF
- [ ] Firma digital en tablet
- [ ] Fotos antes/después en partes
- [ ] Registro de materiales gastados
- [ ] Sincronización offline (SQLite local)
- [ ] Notificaciones push (FCM)
- [ ] Stock y alertas de materiales
