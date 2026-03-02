-- Migración manual para Productos Catálogo (ejecutar si prisma migrate falla)
-- Desde backend/: sqlite3 prisma/dev.db < prisma/migrations/manual_productos_catalogo.sql
-- O si dev.db está en backend/: sqlite3 dev.db < prisma/migrations/manual_productos_catalogo.sql

CREATE TABLE IF NOT EXISTS "Marca" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    CONSTRAINT "Marca_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "Empresa" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "ProductoCatalogo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "base_serial" TEXT NOT NULL,
    "visual_excel_path" TEXT,
    "visual_pdf_path" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "marca_id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    CONSTRAINT "ProductoCatalogo_marca_id_fkey" FOREIGN KEY ("marca_id") REFERENCES "Marca" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProductoCatalogo_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "Empresa" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProductoCatalogo_marca_id_base_serial_key" UNIQUE ("marca_id", "base_serial")
);

CREATE INDEX IF NOT EXISTS "Marca_empresa_id_idx" ON "Marca"("empresa_id");
CREATE INDEX IF NOT EXISTS "ProductoCatalogo_marca_id_idx" ON "ProductoCatalogo"("marca_id");
CREATE INDEX IF NOT EXISTS "ProductoCatalogo_empresa_id_idx" ON "ProductoCatalogo"("empresa_id");
