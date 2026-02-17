/**
 * Configuración para despliegue en subcarpeta.
 * En producción con base /app-gestion/, la API está en /app-gestion/api
 */
const basePath = import.meta.env.BASE_URL || '/';
export const API_BASE = basePath === '/' ? '/api' : basePath.replace(/\/$/, '') + '/api';
