#!/bin/bash
# Ejecutar en el VPS para diagnosticar y corregir 403
# Uso: sudo bash fix-403.sh

set -e
DIR="/var/www/gofix/app-gestion"

echo "=== Diagnóstico 403 - gofix.space/app-gestion/ ==="
echo ""

echo "1. ¿Existe el directorio?"
ls -la "$DIR" || { echo "ERROR: No existe $DIR"; exit 1; }
echo ""

echo "2. ¿Hay index.html?"
ls -la "$DIR/index.html" || { echo "ERROR: Falta index.html"; exit 1; }
echo ""

echo "3. Usuario de nginx:"
ps aux | grep "nginx: worker" | head -1
echo ""

echo "4. ¿www-data puede leer index.html?"
sudo -u www-data cat "$DIR/index.html" > /dev/null && echo "OK" || echo "ERROR: Sin permisos de lectura"
echo ""

echo "5. Aplicando permisos correctos..."
chown -R www-data:www-data /var/www/gofix
chmod -R 755 /var/www/gofix
chmod 644 "$DIR"/*.html 2>/dev/null || true
chmod 644 "$DIR"/assets/* 2>/dev/null || true
echo "Hecho."
echo ""

echo "6. Permisos de directorios padres (deben ser 755 para que nginx entre):"
ls -la /var/www/
ls -la /var/www/gofix/
echo ""

echo "7. Recargar nginx..."
nginx -t && systemctl reload nginx
echo ""
echo "=== Prueba: https://gofix.space/app-gestion/ ==="
