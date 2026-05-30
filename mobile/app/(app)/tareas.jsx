import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, FlatList, StyleSheet,
  TextInput, Modal, KeyboardAvoidingView, Platform, Alert,
  Switch, ScrollView, ActivityIndicator,
} from 'react-native';
import { Screen } from '../../components/Screen';
import { viernesApi } from '../../lib/api/viernes';
import {
  requestNotificationPermission,
  hasNotificationPermission,
  scheduleTaskNotifications,
  cancelTaskNotifications,
} from '../../lib/notifications';
import { colors, typography, spacing, radius } from '../../lib/theme';

const PRIORITY = {
  high:   { label: 'Alta',  color: colors.red,    bg: colors.redBg },
  medium: { label: 'Media', color: colors.yellow,  bg: colors.yellowBg },
  low:    { label: 'Baja',  color: colors.green,   bg: colors.greenBg },
};

// ── Reminder row ──────────────────────────────────────────────────────────────
function ReminderRow({ label, value, onToggle }) {
  return (
    <View style={styles.remRow}>
      <Text style={styles.remLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.border, true: colors.accent }}
        thumbColor="#fff"
        ios_backgroundColor={colors.border}
      />
    </View>
  );
}

// ── Task card ─────────────────────────────────────────────────────────────────
function TaskCard({ task, onComplete, onDelete, onEdit }) {
  const p = PRIORITY[task.priority] || PRIORITY.medium;
  return (
    <TouchableOpacity
      style={styles.card}
      onLongPress={() => onEdit(task)}
      activeOpacity={0.95}
    >
      <View style={styles.cardLeft}>
        <TouchableOpacity style={styles.circle} onPress={() => onComplete(task.id)} activeOpacity={0.7} />
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{task.title}</Text>
          {task.description ? <Text style={styles.desc} numberOfLines={2}>{task.description}</Text> : null}
          {(task.due_date || task.reminders_enabled) && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
              {task.due_date && (
                <Text style={styles.dateBadge}>
                  📅 {task.due_date}{task.due_time ? ` ${task.due_time}` : ''}
                </Text>
              )}
              {task.reminders_enabled && (
                <Text style={[styles.dateBadge, { color: colors.accent }]}>🔔</Text>
              )}
            </View>
          )}
        </View>
      </View>
      <View style={styles.cardRight}>
        <View style={[styles.badge, { backgroundColor: p.bg }]}>
          <Text style={[styles.badgeText, { color: p.color }]}>{p.label}</Text>
        </View>
        <TouchableOpacity onPress={() => onDelete(task.id)} activeOpacity={0.7}>
          <Text style={styles.del}>✕</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

// ── Add / Edit Modal ──────────────────────────────────────────────────────────
function TaskModal({ visible, task, onClose, onSave }) {
  const isEdit = !!task;

  const [title,    setTitle]    = useState(task?.title       || '');
  const [desc,     setDesc]     = useState(task?.description || '');
  const [priority, setPriority] = useState(task?.priority    || 'medium');
  const [dueDate,  setDueDate]  = useState(task?.due_date    || '');
  const [dueTime,  setDueTime]  = useState(task?.due_time    || '');
  const [saving,   setSaving]   = useState(false);

  const [remEnabled, setRemEnabled] = useState(task?.reminders_enabled ?? false);
  const [rem12h,  setRem12h]  = useState(task?.reminder_12h  ?? true);
  const [rem30m,  setRem30m]  = useState(task?.reminder_30m  ?? true);
  const [rem10m,  setRem10m]  = useState(task?.reminder_10m  ?? true);
  const [remCustom, setRemCustom] = useState(
    task?.reminder_custom_minutes ? String(task.reminder_custom_minutes) : ''
  );

  // Reset cuando se abre con una tarea diferente
  useEffect(() => {
    setTitle(task?.title || '');
    setDesc(task?.description || '');
    setPriority(task?.priority || 'medium');
    setDueDate(task?.due_date || '');
    setDueTime(task?.due_time || '');
    setRemEnabled(task?.reminders_enabled ?? false);
    setRem12h(task?.reminder_12h  ?? true);
    setRem30m(task?.reminder_30m  ?? true);
    setRem10m(task?.reminder_10m  ?? true);
    setRemCustom(task?.reminder_custom_minutes ? String(task.reminder_custom_minutes) : '');
    setSaving(false);
  }, [task, visible]);

  const submit = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const payload = {
        title:       title.trim(),
        description: desc.trim(),
        priority,
        due_date:    dueDate.trim() || null,
        due_time:    dueTime.trim() || null,
        completed:   task?.completed || false,
        reminders_enabled:       remEnabled,
        reminder_12h:            rem12h,
        reminder_30m:            rem30m,
        reminder_10m:            rem10m,
        reminder_custom_minutes: remCustom ? parseInt(remCustom) : null,
      };
      const saved = isEdit
        ? await viernesApi.updateTask(task.id, payload)
        : await viernesApi.createTask(payload);
      await scheduleTaskNotifications(saved);
      onSave(saved);
      onClose();
    } catch (e) {
      Alert.alert('Error', e.message || 'No se pudo guardar la tarea');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>{isEdit ? 'Editar tarea' : 'Nueva tarea'}</Text>

          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 440 }}>
            {/* Título */}
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Título *"
              placeholderTextColor={colors.text4}
            />

            {/* Descripción */}
            <TextInput
              style={[styles.input, styles.inputMulti]}
              value={desc}
              onChangeText={setDesc}
              placeholder="Descripción (opcional)"
              placeholderTextColor={colors.text4}
              multiline
              numberOfLines={3}
            />

            {/* Prioridad */}
            <View style={styles.priorityRow}>
              {Object.entries(PRIORITY).map(([key, p]) => (
                <TouchableOpacity
                  key={key}
                  style={[styles.priorityBtn, priority === key && { backgroundColor: p.bg, borderColor: p.color }]}
                  onPress={() => setPriority(key)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.priorityBtnText, priority === key && { color: p.color }]}>{p.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Fecha + Hora */}
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={dueDate}
                onChangeText={setDueDate}
                placeholder="Fecha AAAA-MM-DD"
                placeholderTextColor={colors.text4}
                keyboardType="numbers-and-punctuation"
                autoCorrect={false}
              />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={dueTime}
                onChangeText={setDueTime}
                placeholder="Hora HH:MM"
                placeholderTextColor={colors.text4}
                keyboardType="numbers-and-punctuation"
                autoCorrect={false}
              />
            </View>

            {/* ── Recordatorios ── */}
            <View style={styles.remSection}>
              <View style={styles.remHeader}>
                <Text style={[styles.remLabel, { fontWeight: '600', color: colors.text2 }]}>
                  🔔 Recordatorios
                </Text>
                <Switch
                  value={remEnabled}
                  onValueChange={setRemEnabled}
                  trackColor={{ false: colors.border, true: colors.accent }}
                  thumbColor="#fff"
                  ios_backgroundColor={colors.border}
                />
              </View>

              {remEnabled && (
                <View style={styles.remOptions}>
                  {(!dueDate || !dueTime) && (
                    <Text style={styles.remWarning}>
                      ⚠ Necesitas fecha y hora para programar recordatorios
                    </Text>
                  )}
                  <ReminderRow label="12 horas antes" value={rem12h} onToggle={setRem12h} />
                  <ReminderRow label="30 minutos antes" value={rem30m} onToggle={setRem30m} />
                  <ReminderRow label="10 minutos antes" value={rem10m} onToggle={setRem10m} />

                  {/* Personalizado */}
                  <View style={[styles.remRow, { gap: spacing.sm }]}>
                    <Text style={[styles.remLabel, { flex: 1 }]}>Personalizado (min)</Text>
                    <TextInput
                      style={[styles.input, { width: 72, marginBottom: 0, textAlign: 'center' }]}
                      value={remCustom}
                      onChangeText={setRemCustom}
                      placeholder="ej. 60"
                      placeholderTextColor={colors.text4}
                      keyboardType="number-pad"
                    />
                  </View>
                </View>
              )}
            </View>
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.7}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.addBtn, (!title.trim() || saving) && { opacity: 0.5 }]}
              onPress={submit}
              disabled={!title.trim() || saving}
              activeOpacity={0.85}
            >
              {saving
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.addText}>{isEdit ? 'Guardar' : 'Agregar'}</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function TareasScreen() {
  const [tasks,      setTasks]      = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [showModal,  setShowModal]  = useState(false);
  const [editTask,   setEditTask]   = useState(null); // null = crear, task = editar
  const [notifOk,    setNotifOk]    = useState(false);

  // Pide permiso de notificaciones al entrar
  useEffect(() => {
    hasNotificationPermission().then(setNotifOk);
  }, []);

  const handleRequestNotif = async () => {
    const granted = await requestNotificationPermission();
    setNotifOk(granted);
    if (!granted) Alert.alert('Notificaciones', 'No se otorgó el permiso. Puedes activarlo desde la configuración del sistema.');
  };

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await viernesApi.listTasks();
      setTasks(data);
    } catch (e) {
      setError(e.message || 'No se pudo cargar las tareas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleComplete = async (id) => {
    try {
      const updated = await viernesApi.toggleTaskComplete(id);
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
      if (updated.completed) {
        cancelTaskNotifications(id);
      } else {
        scheduleTaskNotifications(updated);
      }
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  const handleDelete = (id) => {
    Alert.alert('Eliminar tarea', '¿Eliminar esta tarea?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive', onPress: async () => {
          try {
            await viernesApi.deleteTask(id);
            cancelTaskNotifications(id);
            setTasks((prev) => prev.filter((t) => t.id !== id));
          } catch (e) {
            Alert.alert('Error', e.message);
          }
        },
      },
    ]);
  };

  const openCreate = () => { setEditTask(null); setShowModal(true); };
  const openEdit   = (task) => { setEditTask(task); setShowModal(true); };

  const handleSave = (saved) => {
    if (editTask) {
      setTasks((prev) => prev.map((t) => (t.id === saved.id ? saved : t)));
    } else {
      setTasks((prev) => [saved, ...prev]);
    }
    setShowModal(false);
    setEditTask(null);
  };

  const pending   = tasks.filter((t) => !t.completed);
  const completed = tasks.filter((t) => t.completed);

  return (
    <Screen padded={false}>
      {/* Banner de permisos de notificación */}
      {!notifOk && (
        <TouchableOpacity style={styles.notifBanner} onPress={handleRequestNotif} activeOpacity={0.85}>
          <Text style={styles.notifBannerText}>🔔 Activa notificaciones para recordatorios de tareas</Text>
        </TouchableOpacity>
      )}

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      ) : error ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl }}>
          <Text style={{ color: colors.red, textAlign: 'center', marginBottom: spacing.md }}>{error}</Text>
          <TouchableOpacity style={styles.addBtn} onPress={load} activeOpacity={0.85}>
            <Text style={styles.addText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={pending}
          keyExtractor={(t) => String(t.id)}
          contentContainerStyle={styles.list}
          onRefresh={onRefresh}
          refreshing={refreshing}
          renderItem={({ item }) => (
            <TaskCard
              task={item}
              onComplete={handleComplete}
              onDelete={handleDelete}
              onEdit={openEdit}
            />
          )}
          ListHeaderComponent={
            <Text style={styles.sectionLabel}>
              Pendientes ({pending.length})
            </Text>
          }
          ListFooterComponent={
            completed.length > 0 ? (
              <View>
                <Text style={[styles.sectionLabel, { marginTop: spacing.xl }]}>Completadas ({completed.length})</Text>
                {completed.map((t) => (
                  <View key={t.id} style={[styles.card, styles.cardDone]}>
                    <Text style={styles.titleDone}>{t.title}</Text>
                  </View>
                ))}
              </View>
            ) : null
          }
          ListEmptyComponent={
            <Text style={styles.empty}>Sin tareas pendientes ✓</Text>
          }
        />
      )}

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={openCreate} activeOpacity={0.85}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <TaskModal
        visible={showModal}
        task={editTask}
        onClose={() => { setShowModal(false); setEditTask(null); }}
        onSave={handleSave}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list:             { padding: spacing.lg, gap: spacing.sm, paddingBottom: 90 },
  sectionLabel:     { color: colors.text4, fontSize: typography.xs, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.sm },
  card:             { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  cardDone:         { opacity: 0.5 },
  cardLeft:         { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
  cardRight:        { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  circle:           { width: 18, height: 18, borderRadius: radius.full, borderWidth: 2, borderColor: colors.borderMed },
  title:            { color: colors.text, fontSize: typography.sm, fontWeight: '500' },
  titleDone:        { color: colors.text4, fontSize: typography.sm, textDecorationLine: 'line-through' },
  desc:             { color: colors.text3, fontSize: typography.xs, marginTop: 2 },
  dateBadge:        { color: colors.text4, fontSize: 11 },
  badge:            { paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.sm },
  badgeText:        { fontSize: 10, fontWeight: '600' },
  del:              { color: colors.text4, fontSize: typography.sm, padding: 4 },
  empty:            { color: colors.text4, textAlign: 'center', marginTop: spacing.xxl, fontSize: typography.base },

  notifBanner:      { backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  notifBannerText:  { color: colors.accent, fontSize: typography.xs, textAlign: 'center' },

  fab:              { position: 'absolute', bottom: spacing.xl, right: spacing.xl, width: 52, height: 52, borderRadius: radius.full, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', elevation: 6, shadowColor: colors.accent, shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  fabText:          { color: '#fff', fontSize: 28, lineHeight: 32, fontWeight: '300' },

  overlay:          { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modal:            { backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.xl, gap: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, paddingBottom: Platform.OS === 'ios' ? 34 : spacing.xl },
  modalTitle:       { color: colors.text, fontSize: typography.lg, fontWeight: '600', marginBottom: spacing.sm },
  input:            { backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.borderMed, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, color: colors.text, fontSize: typography.base, marginBottom: spacing.sm },
  inputMulti:       { height: 72, textAlignVertical: 'top' },
  priorityRow:      { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  priorityBtn:      { flex: 1, paddingVertical: spacing.sm, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, alignItems: 'center', backgroundColor: colors.hover },
  priorityBtnText:  { color: colors.text3, fontSize: typography.xs, fontWeight: '600' },
  modalActions:     { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  cancelBtn:        { flex: 1, paddingVertical: 12, borderRadius: radius.md, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  cancelText:       { color: colors.text3, fontSize: typography.base },
  addBtn:           { flex: 1, paddingVertical: 12, borderRadius: radius.md, alignItems: 'center', backgroundColor: colors.accent },
  addText:          { color: '#fff', fontSize: typography.base, fontWeight: '600' },

  // recordatorios
  remSection:       { backgroundColor: colors.bg, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', marginBottom: spacing.sm },
  remHeader:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  remOptions:       { borderTopWidth: 1, borderTopColor: colors.border, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.sm },
  remRow:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 2 },
  remLabel:         { color: colors.text3, fontSize: typography.xs },
  remWarning:       { color: colors.yellow, fontSize: typography.xs, marginBottom: 4 },
});
