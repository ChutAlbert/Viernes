import { Platform } from 'react-native';
import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import * as BackgroundFetch from 'expo-background-fetch';
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

async function postLocation(deviceId, token) {
  const loc = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });
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
      await registerLocationTask(data.update_interval);
    }
  }
}

// Must be defined at module top level before app boots
TaskManager.defineTask(TASK_NAME, async () => {
  try {
    const deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (!deviceId || !token) return BackgroundFetch.BackgroundFetchResult.NoData;
    await postLocation(deviceId, token);
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export async function registerLocationTask(intervalMinutes = 15) {
  try {
    const fg = await Location.requestForegroundPermissionsAsync();
    if (fg.status !== 'granted') return false;
    const bg = await Location.requestBackgroundPermissionsAsync();
    if (bg.status !== 'granted') return false;

    const isReg = await TaskManager.isTaskRegisteredAsync(TASK_NAME);
    if (isReg) await BackgroundFetch.unregisterTaskAsync(TASK_NAME);

    await BackgroundFetch.registerTaskAsync(TASK_NAME, {
      minimumInterval: intervalMinutes * 60,
      stopOnTerminate: false,
      startOnBoot: true,
    });
    await AsyncStorage.setItem(INTERVAL_KEY, String(intervalMinutes));
    return true;
  } catch {
    return false;
  }
}

export async function unregisterLocationTask() {
  try {
    const isReg = await TaskManager.isTaskRegisteredAsync(TASK_NAME);
    if (isReg) await BackgroundFetch.unregisterTaskAsync(TASK_NAME);
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
