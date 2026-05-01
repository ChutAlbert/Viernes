import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, FlatList, StyleSheet,
  TextInput, Modal, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { Screen } from '../../components/Screen';
import { viernesApi } from '../../lib/api/viernes';
import { colors, typography, spacing, radius } from '../../lib/theme';

const PRIORITY = {
  high:   { label: 'Alta',  color: colors.red,    bg: colors.redBg },
  medium: { label: 'Media', color: colors.yellow,  bg: colors.yellowBg },
  low:    { label: 'Baja',  color: colors.green,   bg: colors.greenBg },
};

function TaskCard({ task, onComplete, onDelete }) {
  const p = PRIORITY[task.priority] || PRIORITY.medium;
  return (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <TouchableOpacity style={styles.circle} onPress={() => onComplete(task.id)} activeOpacity={0.7} />
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{task.title}</Text>
          {task.description ? <Text style={styles.desc} numberOfLines={2}>{task.description}</Text> : null}
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
    </View>
  );
}

function AddModal({ visible, onClose, onAdd }) {
  const [title, setTitle]       = useState('');
  const [desc, setDesc]         = useState('');
  const [priority, setPriority] = useState('medium');

  const reset = () => { setTitle(''); setDesc(''); setPriority('medium'); };

  const submit = async () => {
    if (!title.trim()) return;
    await onAdd({ title: title.trim(), description: desc.trim(), priority });
    reset();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>Nueva tarea</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Título *"
            placeholderTextColor={colors.text4}
          />
          <TextInput
            style={[styles.input, styles.inputMulti]}
            value={desc}
            onChangeText={setDesc}
            placeholder="Descripción (opcional)"
            placeholderTextColor={colors.text4}
            multiline
            numberOfLines={3}
          />
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
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => { reset(); onClose(); }} activeOpacity={0.7}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addBtn} onPress={submit} activeOpacity={0.85}>
              <Text style={styles.addText}>Agregar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function TareasScreen() {
  const [tasks, setTasks]       = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showAdd, setShowAdd]   = useState(false);

  const load = useCallback(() => viernesApi.listTasks().then(setTasks).catch(() => {}), []);

  useEffect(() => { load(); }, []);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleComplete = async (id) => {
    try {
      await viernesApi.toggleTaskComplete(id);
      setTasks((prev) => prev.map((t) => t.id === id ? { ...t, completed: !t.completed } : t));
    } catch {}
  };

  const handleDelete = (id) => {
    Alert.alert('Eliminar tarea', '¿Eliminar esta tarea?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
        try { await viernesApi.deleteTask(id); setTasks((prev) => prev.filter((t) => t.id !== id)); } catch {}
      }},
    ]);
  };

  const handleAdd = async (payload) => {
    try {
      const t = await viernesApi.createTask(payload);
      setTasks((prev) => [t, ...prev]);
    } catch {}
  };

  const pending   = tasks.filter((t) => !t.completed);
  const completed = tasks.filter((t) => t.completed);

  return (
    <Screen padded={false}>
      <FlatList
        data={pending}
        keyExtractor={(t) => String(t.id)}
        contentContainerStyle={styles.list}
        onRefresh={onRefresh}
        refreshing={refreshing}
        renderItem={({ item }) => (
          <TaskCard task={item} onComplete={handleComplete} onDelete={handleDelete} />
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
      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setShowAdd(true)} activeOpacity={0.85}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
      <AddModal visible={showAdd} onClose={() => setShowAdd(false)} onAdd={handleAdd} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list:          { padding: spacing.lg, gap: spacing.sm, paddingBottom: 90 },
  sectionLabel:  { color: colors.text4, fontSize: typography.xs, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.sm },
  card:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  cardDone:      { opacity: 0.5 },
  cardLeft:      { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
  cardRight:     { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  circle:        { width: 18, height: 18, borderRadius: radius.full, borderWidth: 2, borderColor: colors.borderMed },
  title:         { color: colors.text, fontSize: typography.sm, fontWeight: '500' },
  titleDone:     { color: colors.text4, fontSize: typography.sm, textDecorationLine: 'line-through' },
  desc:          { color: colors.text3, fontSize: typography.xs, marginTop: 2 },
  badge:         { paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.sm },
  badgeText:     { fontSize: 10, fontWeight: '600' },
  del:           { color: colors.text4, fontSize: typography.sm, padding: 4 },
  empty:         { color: colors.text4, textAlign: 'center', marginTop: spacing.xxl, fontSize: typography.base },
  fab:           { position: 'absolute', bottom: spacing.xl, right: spacing.xl, width: 52, height: 52, borderRadius: radius.full, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', elevation: 6, shadowColor: colors.accent, shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  fabText:       { color: '#fff', fontSize: 28, lineHeight: 32, fontWeight: '300' },
  overlay:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modal:         { backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.xl, gap: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  modalTitle:    { color: colors.text, fontSize: typography.lg, fontWeight: '600', marginBottom: spacing.sm },
  input:         { backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.borderMed, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, color: colors.text, fontSize: typography.base },
  inputMulti:    { height: 80, textAlignVertical: 'top' },
  priorityRow:   { flexDirection: 'row', gap: spacing.sm },
  priorityBtn:   { flex: 1, paddingVertical: spacing.sm, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, alignItems: 'center', backgroundColor: colors.hover },
  priorityBtnText:{ color: colors.text3, fontSize: typography.xs, fontWeight: '600' },
  modalActions:  { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  cancelBtn:     { flex: 1, paddingVertical: 12, borderRadius: radius.md, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  cancelText:    { color: colors.text3, fontSize: typography.base },
  addBtn:        { flex: 1, paddingVertical: 12, borderRadius: radius.md, alignItems: 'center', backgroundColor: colors.accent },
  addText:       { color: '#fff', fontSize: typography.base, fontWeight: '600' },
});
