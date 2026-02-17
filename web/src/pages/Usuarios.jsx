import { useQuery } from '@tanstack/react-query';
import { useApi } from '../hooks/useApi';

export default function Usuarios() {
  const api = useApi();

  const { data: usuarios = [], isLoading } = useQuery({
    queryKey: ['usuarios'],
    queryFn: () => api.get('/usuarios')
  });

  if (isLoading) return <p>Cargando usuarios...</p>;

  return (
    <div>
      <h1 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Usuarios</h1>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Teléfono</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id}>
                <td>{u.nombre}</td>
                <td>{u.email}</td>
                <td>
                  <span className={`badge badge-${u.rol === 'ADMIN' ? 'info' : 'warning'}`}>
                    {u.rol}
                  </span>
                </td>
                <td>{u.telefono || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
