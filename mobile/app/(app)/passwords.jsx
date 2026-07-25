import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  TextInput, Modal, KeyboardAvoidingView, Platform, Alert, Clipboard,
} from 'react-native';
import { Screen } from '../../components/Screen';
import { viernesApi } from '../../lib/api/viernes';
import { useTheme, useStyles, typography, spacing, radius } from '../../lib/theme';

function VaultEntry({ entry, onCopy, onDelete }) {
  const styles = useStyles(makeStyles);
  const [showPass, setShowPass] = useState(false);

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.cardIcon}>
          <Text style={styles.cardIconText}>{(entry.nombre || entry.service || '?')[0].toUpperCase()}</Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardName}>{entry.nombre || entry.service}</Text>
          <Text style={styles.cardUser}>{entry.usuario || entry.username || entry.email || ''}</Text>
        </View>
        <View style={styles.cardActions}>
          <TouchableOpacity onPress={() => onCopy(entry.contrasena || entry.password)} activeOpacity={0.7}>
            <Text style={styles.copyBtn}>⎘</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onDelete(entry.id)} activeOpacity={0.7}>
            <Text style={styles.del}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>
      {(entry.contrasena || entry.password) && (
        <TouchableOpacity style={styles.passRow} onPress={() => setShowPass(!showPass)} activeOpacity={0.7}>
          <Text style={styles.passText}>
            {showPass ? (entry.contrasena || entry.password) : '••••••••••••'}
          </Text>
          <Text style={styles.eyeBtn}>{showPass ? '👁' : '👁‍🗨'}</Text>
        </TouchableOpacity>
      )}
      {entry.notas && <Text style={styles.notes} numberOfLines={2}>{entry.notas}</Text>}
    </View>
  );
}

function AddModal({ visible, onClose, onAdd }) {
  const { colors } = useTheme();
  const styles = useStyles(makeStyles);
  const [nombre, setNombre]   = useState('');
  const [usuario, setUsuario] = useState('');
  const [pass, setPass]       = useState('');
  const [notas, setNotas]     = useState('');
  const reset = () => { setNombre(''); setUsuario(''); setPass(''); setNotas(''); };

  const submit = async () => {
    if (!nombre.trim()) return;
    await onAdd({ nombre: nombre.trim(), usuario: usuario.trim(), contrasena: pass, notas: notas.trim() });
    reset(); onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>Nueva contraseña</Text>
          {[
            { label: 'Servicio *', value: nombre, set: setNombre, placeholder: 'Google, GitHub…' },
            { label: 'Usuario / Email', value: usuario, set: setUsuario, placeholder: 'usuario@email.com' },
            { label: 'Contraseña', value: pass, set: setPass, placeholder: '••••••••', secure: true },
            { label: 'Notas', value: notas, set: setNotas, placeholder: 'Notas opcionales' },
          ].map(({ label, value, set, placeholder, secure }) => (
            <View key={label} style={styles.field}>
              <Text style={styles.fieldLabel}>{label}</Text>
              <TextInput
                style={styles.input}
                value={value}
                onChangeText={set}
                placeholder={placeholder}
                placeholderTextColor={colors.text4}
                secureTextEntry={secure}
                autoCapitalize="none"
              />
            </View>
          ))}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => { reset(); onClose(); }} activeOpacity={0.7}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addBtn} onPress={submit} activeOpacity={0.85}>
              <Text style={styles.addText}>Guardar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function PasswordsScreen() {
  const { colors } = useTheme();
  const styles = useStyles(makeStyles);
  const [entries, setEntries]       = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showAdd, setShowAdd]       = useState(false);
  const [search, setSearch]         = useState('');
  const [filtered, setFiltered]     = useState([]);

  const load = useCallback(() =>
    viernesApi.listVaultEntries().then((d) => { setEntries(d); setFiltered(d); }).catch(() => {}),
  []);

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(q ? entries.filter((e) => (e.nombre || e.service || '').toLowerCase().includes(q)) : entries);
  }, [search, entries]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleCopy = (pass) => {
    if (!pass) return;
    Clipboard.setString(pass);
    Alert.alert('Copiado', 'Contraseña copiada al portapapeles');
  };

  const handleDelete = (id) => {
    Alert.alert('Eliminar', '¿Eliminar esta contraseña?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
        try { await viernesApi.deleteVaultEntry(id); setEntries((p) => p.filter((e) => e.id !== id)); } catch {}
      }},
    ]);
  };

  const handleAdd = async (payload) => {
    try {
      const entry = await viernesApi.createVaultEntry(payload);
      setEntries((p) => [entry, ...p]);
    } catch {}
  };

  return (
    <Screen padded={false}>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar…"
          placeholderTextColor={colors.text4}
          autoCapitalize="none"
        />
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(e) => String(e.id)}
        onRefresh={onRefresh}
        refreshing={refreshing}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <VaultEntry entry={item} onCopy={handleCopy} onDelete={handleDelete} />
        )}
        ListEmptyComponent={<Text style={styles.empty}>Sin contraseñas guardadas</Text>}
      />
      <TouchableOpacity style={styles.fab} onPress={() => setShowAdd(true)} activeOpacity={0.85}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
      <AddModal visible={showAdd} onClose={() => setShowAdd(false)} onAdd={handleAdd} />
    </Screen>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  searchRow:   { padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  searchInput: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderMed, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, color: colors.text, fontSize: typography.sm },
  list:        { padding: spacing.lg, gap: spacing.sm, paddingBottom: 90 },
  card:        { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border, gap: spacing.sm },
  cardTop:     { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  cardIcon:    { width: 36, height: 36, borderRadius: radius.md, backgroundColor: colors.accentBg, alignItems: 'center', justifyContent: 'center' },
  cardIconText:{ color: colors.accentText, fontSize: typography.base, fontWeight: '700' },
  cardInfo:    { flex: 1 },
  cardName:    { color: colors.text, fontSize: typography.sm, fontWeight: '600' },
  cardUser:    { color: colors.text3, fontSize: typography.xs, marginTop: 2 },
  cardActions: { flexDirection: 'row', gap: spacing.sm },
  copyBtn:     { color: colors.accentText, fontSize: typography.lg, padding: 4 },
  del:         { color: colors.text4, fontSize: typography.base, padding: 4 },
  passRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.hover, borderRadius: radius.sm, padding: spacing.sm },
  passText:    { color: colors.text2, fontSize: typography.sm, fontFamily: 'monospace', flex: 1 },
  eyeBtn:      { fontSize: typography.base },
  notes:       { color: colors.text4, fontSize: typography.xs },
  empty:       { color: colors.text4, textAlign: 'center', marginTop: spacing.xxl, fontSize: typography.base },
  fab:         { position: 'absolute', bottom: spacing.xl, right: spacing.xl, width: 52, height: 52, borderRadius: radius.full, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', elevation: 6 },
  fabText:     { color: '#fff', fontSize: 28, lineHeight: 32, fontWeight: '300' },
  overlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modal:       { backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.xl, gap: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  modalTitle:  { color: colors.text, fontSize: typography.lg, fontWeight: '600' },
  field:       { gap: 6 },
  fieldLabel:  { color: colors.text3, fontSize: typography.xs, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8 },
  input:       { backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.borderMed, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, color: colors.text, fontSize: typography.base },
  actions:     { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  cancelBtn:   { flex: 1, paddingVertical: 12, borderRadius: radius.md, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  cancelText:  { color: colors.text3, fontSize: typography.base },
  addBtn:      { flex: 1, paddingVertical: 12, borderRadius: radius.md, alignItems: 'center', backgroundColor: colors.accent },
  addText:     { color: '#fff', fontSize: typography.base, fontWeight: '600' },
});
