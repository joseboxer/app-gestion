import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useApi } from '../hooks/useApi';

export default function Dashboard() {
  const api = useApi();

  const { data: obras = [] } = useQuery({
    queryKey: ['obras'],
    queryFn: () => api.get('/obras')
  });

  const { data: facturas = [] } = useQuery({
    queryKey: ['facturas'],
    queryFn: () => api.get('/facturas')
  });

  const { data: partes = [] } = useQuery({
    queryKey: ['partes'],
    queryFn: () => api.get('/partes')
  });

  const pendientes = facturas.filter(f => f.estado === 'PENDIENTE' || f.estado === 'ENVIADA');
  const cobradas = facturas.filter(f => f.estado === 'PAGADA' || f.estado === 'PARCIAL');

  return (
    <div>
      <h1 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Dashboard</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="card">
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Obras en curso</p>
          <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary)' }}>
            {obras.filter(o => o.estado === 'EN_CURSO').length}
          </p>
        </div>
        <div className="card">
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Partes pendientes</p>
          <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--warning)' }}>
            {partes.filter(p => p.estado !== 'COMPLETADO').length}
          </p>
        </div>
        <div className="card">
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Por cobrar</p>
          <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--error)' }}>
            {pendientes.length}
          </p>
        </div>
        <div className="card">
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Facturas cobradas</p>
          <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--success)' }}>
            {cobradas.length}
          </p>
        </div>
      </div>

      <div className="card">
        <h2 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Obras recientes</h2>
        <table>
          <thead>
            <tr>
              <th>Obra</th>
              <th>Cliente</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {obras.slice(0, 5).map((obra) => (
              <tr key={obra.id}>
                <td>{obra.nombre}</td>
                <td>{obra.cliente}</td>
                <td>
                  <span className={`badge badge-${obra.estado === 'EN_CURSO' ? 'info' : obra.estado === 'COMPLETADA' ? 'success' : 'warning'}`}>
                    {obra.estado}
                  </span>
                </td>
                <td><Link to={`/obras?id=${obra.id}`}>Ver</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
