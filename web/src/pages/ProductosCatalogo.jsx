import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../hooks/useAuth';
import { API_BASE } from '../config';

export default function ProductosCatalogo() {
  const api = useApi();
  const { getHeaders } = useAuth();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [marcaId, setMarcaId] = useState('');
  const [baseSerial, setBaseSerial] = useState('');
  const [excelFile, setExcelFile] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);
  const [nuevaMarca, setNuevaMarca] = useState('');
  const [ultimaSyncRma, setUltimaSyncRma] = useState(null);

  const { data: marcas = [], isLoading: loadingMarcas } = useQuery({
    queryKey: ['marcas'],
    queryFn: () => api.get('/marcas')
  });

  const { data: productos = [], isLoading: loadingProductos } = useQuery({
    queryKey: ['productos-catalogo'],
    queryFn: () => api.get('/productos-catalogo')
  });

  const addVisualMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append('marcaId', marcaId);
      formData.append('marcaNombre', marcas.find(m => m.id === marcaId)?.nombre || '');
      formData.append('baseSerial', baseSerial.trim());
      if (excelFile) formData.append('excel', excelFile);
      if (pdfFile) formData.append('pdf', pdfFile);
      return api.postFormData('/productos-catalogo/add-visual', formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos-catalogo'] });
      setModalOpen(false);
      resetForm();
    }
  });

  const createMarcaMutation = useMutation({
    mutationFn: (nombre) => api.post('/marcas', { nombre }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marcas'] });
      setNuevaMarca('');
    }
  });

  const syncRmaMutation = useMutation({
    mutationFn: () => api.post('/productos-catalogo/sync-rma', {}),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['productos-catalogo'] });
      setUltimaSyncRma(new Date());
      alert(`Sincronización completada. Sincronizados: ${result?.synced ?? 0}. Omitidos: ${result?.skipped ?? 0}.`);
    },
    onError: (err) => {
      alert(err?.message || 'Error al sincronizar la lista RMA');
    }
  });

  const resetForm = () => {
    setMarcaId('');
    setBaseSerial('');
    setExcelFile(null);
    setPdfFile(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!marcaId || !baseSerial.trim()) {
      alert('Marca y número de serie base son obligatorios');
      return;
    }
    if (!excelFile) {
      alert('El archivo Excel del visual es obligatorio');
      return;
    }
    addVisualMutation.mutate();
  };

  const abrirArchivo = async (relPath) => {
    if (!relPath) return;
    const url = `${API_BASE}/productos-catalogo/archivo?path=${encodeURIComponent(relPath)}`;
    const res = await fetch(url, { headers: getHeaders() });
    if (!res.ok) throw new Error('Error al abrir archivo');
    const blob = await res.blob();
    const objUrl = URL.createObjectURL(blob);
    window.open(objUrl, '_blank');
    setTimeout(() => URL.revokeObjectURL(objUrl), 10000);
  };

  const isLoading = loadingMarcas || loadingProductos;

  if (isLoading) return <p>Cargando...</p>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', margin: 0 }}>Productos Catálogo</h1>
          <p style={{ margin: '0.35rem 0 0', fontSize: '0.875rem', color: 'var(--secondary)', opacity: 0.85 }}>
            Última sincronización RMA:{' '}
            {ultimaSyncRma
              ? ultimaSyncRma.toLocaleString('es-ES')
              : 'Aún no sincronizado'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => syncRmaMutation.mutate()}
            disabled={syncRmaMutation.isPending}
          >
            {syncRmaMutation.isPending ? 'Sincronizando RMA...' : 'Sincronizar lista RMA'}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setModalOpen(true)}
          >
            Añadir visual manualmente
          </button>
        </div>
      </div>

      <div className="card">
        {productos.length === 0 ? (
          <p style={{ color: 'var(--secondary)', opacity: 0.8 }}>
            No hay productos en el catálogo. Añade un visual manualmente para crear el primer producto.
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Marca</th>
                <th>Nº serie base</th>
                <th>Visual Excel</th>
                <th>Visual PDF</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {productos.map((p) => (
                <tr key={p.id}>
                  <td>{p.marca?.nombre ?? '-'}</td>
                  <td>{p.baseSerial}</td>
                  <td>
                    {p.visualExcelPath ? (
                      <button type="button" className="btn btn-link" style={{ padding: 0 }} onClick={() => abrirArchivo(p.visualExcelPath)}>
                        Abrir Excel
                      </button>
                    ) : '-'}
                  </td>
                  <td>
                    {p.visualPdfPath ? (
                      <button type="button" className="btn btn-link" style={{ padding: 0 }} onClick={() => abrirArchivo(p.visualPdfPath)}>
                        Abrir PDF
                      </button>
                    ) : '-'}
                  </td>
                  <td>{p.createdAt ? new Date(p.createdAt).toLocaleDateString('es-ES') : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginBottom: '1rem' }}>Añadir visual manualmente</h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--secondary)', opacity: 0.8, marginBottom: '1rem' }}>
              El directorio padre del visual será el número de serie base. Formato: Excel (obligatorio), PDF (opcional).
            </p>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 500 }}>Marca</label>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <select
                    value={marcaId}
                    onChange={(e) => setMarcaId(e.target.value)}
                    required
                    style={{ flex: 1, minWidth: 180, padding: '0.5rem', borderRadius: 8, border: '1px solid #ccc' }}
                  >
                    <option value="">Seleccionar marca...</option>
                    {marcas.map((m) => (
                      <option key={m.id} value={m.id}>{m.nombre}</option>
                    ))}
                  </select>
                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    <input
                      type="text"
                      placeholder="Nueva marca"
                      value={nuevaMarca}
                      onChange={(e) => setNuevaMarca(e.target.value)}
                      style={{ padding: '0.5rem', borderRadius: 8, border: '1px solid #ccc', width: 140 }}
                    />
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => nuevaMarca.trim() && createMarcaMutation.mutate(nuevaMarca.trim())}
                      disabled={!nuevaMarca.trim() || createMarcaMutation.isPending}
                    >
                      Crear
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 500 }}>Nº serie base (directorio padre)</label>
                <input
                  type="text"
                  value={baseSerial}
                  onChange={(e) => setBaseSerial(e.target.value)}
                  placeholder="Ej: ABC123"
                  required
                  style={{ width: '100%', padding: '0.5rem', borderRadius: 8, border: '1px solid #ccc' }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 500 }}>Visual Excel *</label>
                <input
                  type="file"
                  accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                  onChange={(e) => setExcelFile(e.target.files?.[0] || null)}
                  required
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 500 }}>Visual PDF (opcional)</label>
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={addVisualMutation.isPending}
                >
                  {addVisualMutation.isPending ? 'Subiendo...' : 'Añadir visual'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .modal {
          background: var(--card);
          border-radius: 12px;
          padding: 1.5rem;
          max-width: 480px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
        }
      `}</style>
    </div>
  );
}
