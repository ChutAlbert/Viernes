import { Platform } from 'react-native';
import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TASK_NAME = 'VIERNES_LOCATION';
const DEVICE_ID_KEY = 'viernes_device_id';
const INTERVAL_KEY = 'viernes_location_interval';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.100:8000';
const TOKEN_KEY = 'viernes_token';

function genId() {
  return 'dev-' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export async function getOrCreateDeviceId() {
  let id = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = genId();
    await AsyncStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

async function postLocation(deviceId, token, coords = null) {
  const loc = coords
    ? { coords }
    : await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  const deviceName = Platform.OS === 'android' ? 'Android' : 'iOS';
  const res = await fetch(`${API_BASE}/locations/update`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      device_id: deviceId,
      device_name: deviceName,
      lat: loc.coords.latitude,
      lng: loc.coords.longitude,
      accuracy: loc.coords.accuracy,
    }),
  });
  const data = await res.json();
  // Reschedule if server changed update_interval
  if (data.update_interval) {
    const stored = await AsyncStorage.getItem(INTERVAL_KEY);
    if (String(data.update_interval) !== stored) {
      // Reprogramar puede fallar sin permisos; el reporte en primer plano no debe caerse por eso
      try { await registerLocationTask(data.update_interval); } catch {}
    }
  }
}

// Reporta la ubicacion con la app abierta. Solo necesita permiso de primer
// plano, asi que funciona incluso sin el permiso de segundo plano concedido.
export async function reportLocationNow() {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return false;
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (!token) return false;
    await postLocation(await getOrCreateDeviceId(), token);
    return true;
  } catch {
    return false;
  }
}

// Debe definirse al cargar el modulo, antes de que arranque la app.
// Con startLocationUpdatesAsync el sistema nos entrega las ubicaciones.
TaskManager.defineTask(TASK_NAME, async ({ data, error }) => {
  if (error) return;
  try {
    const deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (!deviceId || !token) return;
    const ultima = data?.locations?.[data.locations.length - 1];
    await postLocation(deviceId, token, ultima?.coords ?? null);
  } catch {
    // sin red o token vencido: se reintenta en la siguiente actualizacion
  }
});

export async function registerLocationTask(intervalMinutes = 15) {
  try {
    const fg = await Location.requestForegroundPermissionsAsync();
    if (fg.status !== 'granted') return false;
    const bg = await Location.requestBackgroundPermissionsAsync();
    if (bg.status !== 'granted') return false;

    if (await Location.hasStartedLocationUpdatesAsync(TASK_NAME)) {
      await Location.stopLocationUpdatesAsync(TASK_NAME);
    }

    const ms = intervalMinutes * 60 * 1000;
    await Location.startLocationUpdatesAsync(TASK_NAME, {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: ms,
      distanceInterval: 50,
      deferredUpdatesInterval: ms,
      pausesUpdatesAutomatically: false,
      showsBackgroundLocationIndicator: true,
      // Android exige notificacion visible para seguir con la app cerrada
      foregroundService: {
        notificationTitle: 'Viernes',
        notificationBody: 'Compartiendo ubicacion',
        notificationColor: '#7c3aed',
      },
    });
    await AsyncStorage.setItem(INTERVAL_KEY, String(intervalMinutes));
    return true;
  } catch {
    return false;
  }
}

export async function unregisterLocationTask() {
  try {
    if (await Location.hasStartedLocationUpdatesAsync(TASK_NAME)) {
      await Location.stopLocationUpdatesAsync(TASK_NAME);
    }
  } catch {}
}

export async function sendLocationNow() {
  try {
    const deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (!deviceId || !token) return false;
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return false;
    await postLocation(deviceId, token);
    return true;
  } catch {
    return false;
  }
}

export async function checkAndRefreshIfNeeded() {
  try {
    const deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (!deviceId || !token) return;
    const res = await fetch(`${API_BASE}/locations/${deviceId}/needs-refresh`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.needs_refresh) await sendLocationNow();
  } catch {}
}
