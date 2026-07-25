import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, FlatList, StyleSheet,
  TextInput, Modal, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { Screen } from '../../components/Screen';
import { viernesApi } from '../../lib/api/viernes';
import { useTheme, useStyles, typography, spacing, radius } from '../../lib/theme';

function NoteCard({ note, onPress, onDelete }) {
  const styles = useStyles(makeStyles);
  const date = note.updated_at
    ? new Date(note.updated_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })
    : '';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} onLongPress={() => onDelete(note.id)} activeOpacity={0.8}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle} numberOfLines={1}>{note.title || 'Sin título'}</Text>
        <Text style={styles.cardDate}>{date}</Text>
      </View>
      {note.content ? (
        <Text style={styles.cardContent} numberOfLines={3}>{note.content}</Text>
      ) : null}
    </TouchableOpacity>
  );
}

function NoteModal({ visible, note, onClose, onSave }) {
  const { colors } = useTheme();
  const styles = useStyles(makeStyles);
  const [title, setTitle]   = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    if (note) { setTitle(note.title || ''); setContent(note.content || ''); }
    else      { setTitle(''); setContent(''); }
  }, [note, visible]);

  const submit = async () => {
    if (!title.trim() && !content.trim()) return;
    await onSave({ title: title.trim(), content: content.trim() });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: colors.bg }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose} style={styles.modalBack} activeOpacity={0.7}>
            <Text style={styles.modalBackText}>← Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={submit} activeOpacity={0.7}>
            <Text style={styles.modalSave}>Guardar</Text>
          </TouchableOpacity>
        </View>
        <TextInput
          style={styles.noteTitleInput}
          value={title}
          onChangeText={setTitle}
          placeholder="Título"
          placeholderTextColor={colors.text4}
        />
        <TextInput
          style={styles.noteBody}
          value={content}
          onChangeText={setContent}
          placeholder="Escribe tu nota…"
          placeholderTextColor={colors.text4}
          multiline
          textAlignVertical="top"
        />
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function NotasScreen() {
  const styles = useStyles(makeStyles);
  const [notes, setNotes]         = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingNote, setEditingNote]   = useState(null);

  const load = useCallback(() => viernesApi.listNotes().then(setNotes).catch(() => {}), []);
  useEffect(() => { load(); }, []);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const openNew  = () => { setEditingNote(null); setModalVisible(true); };
  const openEdit = (n) => { setEditingNote(n); setModalVisible(true); };

  const handleSave = async (payload) => {
    try {
      if (editingNote) {
        const updated = await viernesApi.updateNote(editingNote.id, payload);
        setNotes((prev) => prev.map((n) => n.id === editingNote.id ? updated : n));
      } else {
        const created = await viernesApi.createNote(payload);
        setNotes((prev) => [created, ...prev]);
      }
    } catch {}
  };

  const handleDelete = (id) => {
    Alert.alert('Eliminar nota', '¿Eliminar esta nota?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
        try { await viernesApi.deleteNote(id); setNotes((prev) => prev.filter((n) => n.id !== id)); } catch {}
      }},
    ]);
  };

  return (
    <Screen padded={false}>
      <FlatList
        data={notes}
        numColumns={2}
        columnWrapperStyle={styles.row}
        keyExtractor={(n) => String(n.id)}
        contentContainerStyle={styles.list}
        onRefresh={onRefresh}
        refreshing={refreshing}
        renderItem={({ item }) => (
          <NoteCard note={item} onPress={() => openEdit(item)} onDelete={handleDelete} />
        )}
        ListEmptyComponent={<Text style={styles.empty}>Sin notas — toca + para agregar</Text>}
      />
      <TouchableOpacity style={styles.fab} onPress={openNew} activeOpacity={0.85}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
      <NoteModal
        visible={modalVisible}
        note={editingNote}
        onClose={() => setModalVisible(false)}
        onSave={handleSave}
      />
    </Screen>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  list:           { padding: spacing.md, paddingBottom: 90 },
  row:            { gap: spacing.sm, marginBottom: spacing.sm },
  card:           { flex: 1, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border, minHeight: 100 },
  cardHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm },
  cardTitle:      { color: colors.text, fontSize: typography.sm, fontWeight: '600', flex: 1 },
  cardDate:       { color: colors.text4, fontSize: 10, marginLeft: 4 },
  cardContent:    { color: colors.text3, fontSize: typography.xs, lineHeight: 18 },
  empty:          { color: colors.text4, textAlign: 'center', marginTop: spacing.xxl, fontSize: typography.base },
  fab:            { position: 'absolute', bottom: spacing.xl, right: spacing.xl, width: 52, height: 52, borderRadius: radius.full, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', elevation: 6 },
  fabText:        { color: '#fff', fontSize: 28, lineHeight: 32, fontWeight: '300' },
  modalHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalBack:      {},
  modalBackText:  { color: colors.text3, fontSize: typography.base },
  modalSave:      { color: colors.accentText, fontSize: typography.base, fontWeight: '600' },
  noteTitleInput: { fontSize: typography.xl, fontWeight: '600', color: colors.text, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  noteBody:       { flex: 1, fontSize: typography.base, color: colors.text2, padding: spacing.lg, lineHeight: 24 },
});
