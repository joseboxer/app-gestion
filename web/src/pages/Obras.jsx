import { useQuery } from '@tanstack/react-query';
import { useApi } from '../hooks/useApi';

export default function Obras() {
  const api = useApi();

  const { data: obras = [], isLoading } = useQuery({
    queryKey: ['obras'],
    queryFn: () => api.get('/obras')
  });

  if (isLoading) return <p>Cargando obras...</p>;

  return (
    <div>
      <h1 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Obras</h1>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Dirección</th>
              <th>Cliente</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {obras.map((obra) => (
              <tr key={obra.id}>
                <td>{obra.nombre}</td>
                <td>{obra.direccion}</td>
                <td>{obra.cliente}</td>
                <td>
                  <span className={`badge badge-${obra.estado === 'EN_CURSO' ? 'info' : obra.estado === 'COMPLETADA' ? 'success' : 'warning'}`}>
                    {obra.estado}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
