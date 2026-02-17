import { useQuery } from '@tanstack/react-query';
import { useApi } from '../hooks/useApi';

export default function Partes() {
  const api = useApi();

  const { data: partes = [], isLoading } = useQuery({
    queryKey: ['partes'],
    queryFn: () => api.get('/partes')
  });

  if (isLoading) return <p>Cargando partes de trabajo...</p>;

  return (
    <div>
      <h1 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Partes de Trabajo</h1>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Título</th>
              <th>Obra</th>
              <th>Asignado</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {partes.map((p) => (
              <tr key={p.id}>
                <td>{p.titulo}</td>
                <td>{p.obra?.nombre}</td>
                <td>{p.asignado?.nombre || '-'}</td>
                <td>
                  <span className={`badge badge-${p.estado === 'COMPLETADO' ? 'success' : p.estado === 'EN_CURSO' ? 'info' : 'warning'}`}>
                    {p.estado}
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
