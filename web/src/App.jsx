import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Obras from './pages/Obras';
import Presupuestos from './pages/Presupuestos';
import Partes from './pages/Partes';
import Facturas from './pages/Facturas';
import Usuarios from './pages/Usuarios';
import ProductosCatalogo from './pages/ProductosCatalogo';

function ProtectedRoute({ children }) {
  const { token, loading } = useAuth();
  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Cargando...</div>;
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/obras" element={<Obras />} />
                <Route path="/presupuestos" element={<Presupuestos />} />
                <Route path="/partes" element={<Partes />} />
                <Route path="/facturas" element={<Facturas />} />
                <Route path="/usuarios" element={<Usuarios />} />
                <Route path="/productos-catalogo" element={<ProductosCatalogo />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
