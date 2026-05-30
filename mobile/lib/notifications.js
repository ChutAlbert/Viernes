/**
 * Servicio de notificaciones locales para tareas.
 * Usa expo-notifications para programar recordatorios en el dispositivo.
 * Los identificadores se guardan en AsyncStorage para poder cancelarlos.
 */
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuración global — qué hacer cuando llega una notificación con la app abierta
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const NOTIF_KEY_PREFIX = 'viernes_notif_';

// Claves de storage para los IDs de cada recordatorio de una tarea
function keysFor(taskId) {
  return {
    h12:    `${NOTIF_KEY_PREFIX}12h_${taskId}`,
    m30:    `${NOTIF_KEY_PREFIX}30m_${taskId}`,
    m10:    `${NOTIF_KEY_PREFIX}10m_${taskId}`,
    custom: `${NOTIF_KEY_PREFIX}custom_${taskId}`,
  };
}

// ── Permisos ──────────────────────────────────────────────────────────────────
export async function requestNotificationPermission() {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function hasNotificationPermission() {
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}

// ── Cancelar ──────────────────────────────────────────────────────────────────
async function cancelStoredNotif(storageKey) {
  try {
    const id = await AsyncStorage.getItem(storageKey);
    if (id) {
      await Notifications.cancelScheduledNotificationAsync(id);
      await AsyncStorage.removeItem(storageKey);
    }
  } catch {}
}

export async function cancelTaskNotifications(taskId) {
  const keys = keysFor(taskId);
  await Promise.all(Object.values(keys).map(cancelStoredNotif));
}

// ── Programar ─────────────────────────────────────────────────────────────────
async function scheduleOne(title, body, triggerDate, storageKey) {
  if (triggerDate.getTime() <= Date.now()) return; // ya pasó, no programar
  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: 'default' },
      trigger:  { type: 'date', date: triggerDate },
    });
    await AsyncStorage.setItem(storageKey, id);
  } catch (e) {
    console.warn('[notifications] error al programar:', e?.message);
  }
}

/**
 * Programa todas las notificaciones que correspondan para una tarea.
 * Si la tarea no tiene reminders_enabled o no tiene due_date+due_time, no hace nada.
 * Cancela primero los recordatorios previos del mismo taskId.
 */
export async function scheduleTaskNotifications(task) {
  const {
    id, title,
    due_date, due_time,
    reminders_enabled,
    reminder_12h, reminder_30m, reminder_10m,
    reminder_custom_minutes,
  } = task;

  // Cancela recordatorios anteriores siempre
  await cancelTaskNotifications(id);

  if (!reminders_enabled || !due_date || !due_time) return;

  const [year, month, day]   = due_date.split('-').map(Number);
  const [hours, minutes] = due_time.split(':').map(Number);
  const dueMs = new Date(year, month - 1, day, hours, minutes, 0, 0).getTime();

  const keys = keysFor(id);

  if (reminder_12h) {
    await scheduleOne(
      '⏰ Tarea en 12 horas',
      `"${title}" vence a las ${due_time}`,
      new Date(dueMs - 12 * 60 * 60 * 1000),
      keys.h12,
    );
  }
  if (reminder_30m) {
    await scheduleOne(
      '⏰ Tarea en 30 minutos',
      `"${title}" vence pronto`,
      new Date(dueMs - 30 * 60 * 1000),
      keys.m30,
    );
  }
  if (reminder_10m) {
    await scheduleOne(
      '🔔 Tarea en 10 minutos',
      `"${title}" vence muy pronto`,
      new Date(dueMs - 10 * 60 * 1000),
      keys.m10,
    );
  }
  if (reminder_custom_minutes) {
    await scheduleOne(
      `⏰ Tarea en ${reminder_custom_minutes} min`,
      `"${title}" vence pronto`,
      new Date(dueMs - reminder_custom_minutes * 60 * 1000),
      keys.custom,
    );
  }
}
