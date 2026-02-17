import { useQuery } from '@tanstack/react-query';
import { useApi } from '../hooks/useApi';

export default function Facturas() {
  const api = useApi();

  const { data: facturas = [], isLoading } = useQuery({
    queryKey: ['facturas'],
    queryFn: () => api.get('/facturas')
  });

  const estadoColor = (e) => {
    if (e === 'PAGADA') return 'success';
    if (e === 'PENDIENTE' || e === 'ENVIADA') return 'error';
    return 'warning';
  };

  if (isLoading) return <p>Cargando facturas...</p>;

  return (
    <div>
      <h1 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Facturación</h1>

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
            {facturas.map((f) => (
              <tr key={f.id}>
                <td>{f.numero}</td>
                <td>{f.obra?.nombre}</td>
                <td>{f.total.toFixed(2)} €</td>
                <td>
                  <span className={`badge badge-${estadoColor(f.estado)}`}>
                    {f.estado}
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
