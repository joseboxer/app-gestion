/**
 * App Gestión - App Móvil para Operarios
 * Regla de oro: tan fácil que un operario de 55 años con el móvil lleno de polvo
 * pueda usarla con un solo dedo. Botones enormes.
 */
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Linking,
  ActivityIndicator
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';

// En dispositivo físico: cambiar a tu IP (ej: http://192.168.1.100:4000/api)
const API_URL = 'http://localhost:4000/api';

const TOKEN_KEY = 'app-gestion-token';

export default function App() {
  const [screen, setScreen] = useState('login');
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [partes, setPartes] = useState([]);
  const [parteSeleccionado, setParteSeleccionado] = useState(null);

  useEffect(() => {
    AsyncStorage.getItem(TOKEN_KEY).then((t) => {
      if (t) {
        setToken(t);
        setScreen('home');
        cargarPartes(t);
      }
    });
  }, []);

  const api = async (path, options = {}) => {
    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers
      }
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Error');
    return data;
  };

  const cargarPartes = async (t) => {
    try {
      const data = await fetch(`${API_URL}/partes?hoy=true`, {
        headers: { Authorization: `Bearer ${t || token}` }
      }).then((r) => r.json());
      setPartes(data);
    } catch (e) {
      setPartes([]);
    }
  };

  const login = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al entrar');
      await AsyncStorage.setItem(TOKEN_KEY, data.token);
      setToken(data.token);
      setScreen('home');
      cargarPartes(data.token);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setScreen('login');
    setPartes([]);
    setParteSeleccionado(null);
  };

  const abrirMaps = (direccion) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(direccion)}`;
    Linking.openURL(url);
  };

  const iniciarParte = async () => {
    setLoading(true);
    try {
      await api(`/partes/${parteSeleccionado.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ estado: 'EN_CURSO' })
      });
      await api('/fichaje', {
        method: 'POST',
        body: JSON.stringify({ tipo: 'INICIO_OBRA', obraId: parteSeleccionado.obraId })
      });
      setParteSeleccionado((p) => ({ ...p, estado: 'EN_CURSO' }));
      setPartes((prev) => prev.map((p) => (p.id === parteSeleccionado.id ? { ...p, estado: 'EN_CURSO' } : p)));
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const finalizarParte = async () => {
    setLoading(true);
    try {
      await api(`/partes/${parteSeleccionado.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ estado: 'COMPLETADO', completadoAt: new Date().toISOString() })
      });
      await api('/fichaje', {
        method: 'POST',
        body: JSON.stringify({ tipo: 'FIN_OBRA', obraId: parteSeleccionado.obraId })
      });
      setParteSeleccionado(null);
      cargarPartes();
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const ficharJornada = async (tipo) => {
    setLoading(true);
    try {
      await api('/fichaje', { method: 'POST', body: JSON.stringify({ tipo }) });
      Alert.alert('OK', tipo === 'INICIO_JORNADA' ? 'Jornada iniciada' : 'Jornada finalizada');
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  // --- LOGIN ---
  if (screen === 'login') {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.card}>
          <Text style={styles.title}>App Gestión</Text>
          <Text style={styles.subtitle}>Operarios</Text>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Contraseña"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <TouchableOpacity style={styles.bigButton} onPress={login} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.bigButtonText}>ENTRAR</Text>}
          </TouchableOpacity>
          <Text style={styles.hint}>Demo: carlos@reformasgarcia.es / operario123</Text>
        </View>
      </View>
    );
  }

  // --- DETALLE PARTE ---
  if (parteSeleccionado) {
    const p = parteSeleccionado;
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity style={styles.backBtn} onPress={() => setParteSeleccionado(null)}>
            <Text style={styles.backBtnText}>← Volver</Text>
          </TouchableOpacity>
          <Text style={styles.parteTitle}>{p.titulo}</Text>
          <Text style={styles.parteDesc}>{p.descripcion || p.obra?.nombre}</Text>
          <TouchableOpacity style={styles.bigButton} onPress={() => abrirMaps(p.direccion)}>
            <Text style={styles.bigButtonText}>📍 CÓMO LLEGAR</Text>
          </TouchableOpacity>
          {p.estado === 'PENDIENTE' && (
            <TouchableOpacity style={[styles.bigButton, styles.btnGreen]} onPress={iniciarParte} disabled={loading}>
              <Text style={styles.bigButtonText}>▶ INICIAR TRABAJO</Text>
            </TouchableOpacity>
          )}
          {p.estado === 'EN_CURSO' && (
            <TouchableOpacity style={[styles.bigButton, styles.btnRed]} onPress={finalizarParte} disabled={loading}>
              <Text style={styles.bigButtonText}>■ FINALIZAR</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
    );
  }

  // --- HOME ---
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Mis tareas</Text>
        <TouchableOpacity style={styles.fichajeBtn} onPress={() => ficharJornada('INICIO_JORNADA')} disabled={loading}>
          <Text style={styles.fichajeBtnText}>Iniciar jornada</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.fichajeBtn, styles.fichajeBtnOut]} onPress={() => ficharJornada('FIN_JORNADA')} disabled={loading}>
          <Text style={styles.fichajeBtnTextOut}>Finalizar jornada</Text>
        </TouchableOpacity>
        {partes.length === 0 ? (
          <Text style={styles.empty}>No hay tareas hoy</Text>
        ) : (
          partes.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={styles.parteCard}
              onPress={() => setParteSeleccionado(p)}
              activeOpacity={0.7}
            >
              <Text style={styles.parteCardTitle}>{p.titulo}</Text>
              <Text style={styles.parteCardDir}>{p.direccion}</Text>
              <View style={[styles.badge, p.estado === 'COMPLETADO' && styles.badgeDone]}>
                <Text style={styles.badgeText}>{p.estado}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutBtnText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f8',
    paddingTop: 48,
    paddingHorizontal: 20
  },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%'
  },
  title: { fontSize: 28, fontWeight: '700', color: '#0f172a', marginBottom: 4 },
  subtitle: { fontSize: 16, color: '#64748b', marginBottom: 24 },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    marginBottom: 12
  },
  error: { color: '#dc2626', marginBottom: 12 },
  bigButton: {
    backgroundColor: '#0d9488',
    paddingVertical: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
    minHeight: 64
  },
  bigButtonText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  btnGreen: { backgroundColor: '#16a34a' },
  btnRed: { backgroundColor: '#dc2626' },
  hint: { fontSize: 12, color: '#94a3b8', marginTop: 16, textAlign: 'center' },
  backBtn: { marginBottom: 16 },
  backBtnText: { fontSize: 18, color: '#0d9488', fontWeight: '600' },
  parteTitle: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
  parteDesc: { fontSize: 16, color: '#64748b', marginBottom: 24 },
  fichajeBtn: {
    backgroundColor: '#0d9488',
    paddingVertical: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 12,
    minHeight: 56
  },
  fichajeBtnText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  fichajeBtnOut: { backgroundColor: '#e2e8f0' },
  fichajeBtnTextOut: { color: '#475569', fontSize: 18, fontWeight: '600' },
  empty: { fontSize: 16, color: '#94a3b8', textAlign: 'center', marginTop: 24 },
  parteCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  parteCardTitle: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
  parteCardDir: { fontSize: 14, color: '#64748b' },
  badge: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#fef3c7'
  },
  badgeDone: { backgroundColor: '#dcfce7' },
  badgeText: { fontSize: 12, fontWeight: '600', color: '#475569' },
  logoutBtn: { marginTop: 32, alignItems: 'center' },
  logoutBtnText: { fontSize: 16, color: '#94a3b8' }
});
