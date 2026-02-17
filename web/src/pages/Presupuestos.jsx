import { useQuery } from '@tanstack/react-query';
import { useApi } from '../hooks/useApi';

export default function Presupuestos() {
  const api = useApi();

  const { data: presupuestos = [], isLoading } = useQuery({
    queryKey: ['presupuestos'],
    queryFn: () => api.get('/presupuestos')
  });

  if (isLoading) return <p>Cargando presupuestos...</p>;

  return (
    <div>
      <h1 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Presupuestos</h1>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Número</th>
              <th>Obra</th>
              <th>Total</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {presupuestos.map((p) => (
              <tr key={p.id}>
                <td>{p.numero}</td>
                <td>{p.obra?.nombre}</td>
                <td>{p.total ? `${p.total.toFixed(2)} €` : '-'}</td>
                <td>
                  <span className={`badge badge-${p.estado === 'FIRMADO' ? 'success' : p.estado === 'BORRADOR' ? 'warning' : 'info'}`}>
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
