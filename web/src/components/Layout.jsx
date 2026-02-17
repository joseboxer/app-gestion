import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <div style={{ padding: '0 1.5rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700 }}>App Gestión</h1>
          <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', marginTop: '0.25rem' }}>
            Panel de Administración
          </p>
        </div>
        <nav style={{ marginTop: '1rem' }}>
          <ul className="sidebar-nav">
            <li><NavLink to="/" end>Dashboard</NavLink></li>
            <li><NavLink to="/obras">Obras</NavLink></li>
            <li><NavLink to="/presupuestos">Presupuestos</NavLink></li>
            <li><NavLink to="/partes">Partes de Trabajo</NavLink></li>
            <li><NavLink to="/facturas">Facturación</NavLink></li>
            <li><NavLink to="/usuarios">Usuarios</NavLink></li>
          </ul>
        </nav>
        <div style={{ padding: '1.5rem', marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)' }}>{user?.nombre}</p>
          <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>{user?.rol}</p>
          <button
            className="btn btn-secondary"
            onClick={handleLogout}
            style={{ marginTop: '0.75rem', width: '100%' }}
          >
            Cerrar sesión
          </button>
        </div>
      </aside>
      <main className="main">
        {children}
      </main>
    </div>
  );
}
