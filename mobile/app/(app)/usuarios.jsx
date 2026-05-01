import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  TextInput, Modal, Switch, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useSelector } from 'react-redux';
import { Screen } from '../../components/Screen';
import { viernesApi } from '../../lib/api/viernes';
import { colors, typography, spacing, radius } from '../../lib/theme';

const ROLE_COLOR = {
  super_admin: { text: colors.accentText, bg: colors.accentBg },
  admin:       { text: colors.cyan,       bg: colors.cyanBg },
  user:        { text: colors.text3,      bg: colors.hover },
};

function UserCard({ user, onDelete, onToggle }) {
  const r = ROLE_COLOR[user.role] || ROLE_COLOR.user;
  const initials = (user.name || user.email || '?').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View>
        <View style={styles.info}>
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.email}>{user.email}</Text>
          <View style={[styles.roleBadge, { backgroundColor: r.bg }]}>
            <Text style={[styles.roleText, { color: r.text }]}>{user.role}</Text>
          </View>
        </View>
      </View>
      <View style={styles.cardRight}>
        <Switch
          value={user.is_active}
          onValueChange={() => onToggle(user)}
          trackColor={{ false: colors.border, true: colors.accent }}
          thumbColor={user.is_active ? '#fff' : colors.text4}
          style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }}
        />
        <TouchableOpacity onPress={() => onDelete(user.id)} activeOpacity={0.7}>
          <Text style={styles.del}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function AddModal({ visible, onClose, onAdd }) {
  const [email, setEmail]     = useState('');
  const [name, setName]       = useState('');
  const [pass, setPass]       = useState('');
  const [role, setRole]       = useState('user');
  const reset = () => { setEmail(''); setName(''); setPass(''); setRole('user'); };

  const submit = async () => {
    if (!email.trim() || !pass.trim()) return;
    await onAdd({ email: email.trim(), name: name.trim(), password: pass, role });
    reset(); onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>Nuevo usuario</Text>
          {[
            { label: 'Nombre', value: name, set: setName, placeholder: 'Nombre completo' },
            { label: 'Correo *', value: email, set: setEmail, placeholder: 'correo@ejemplo.com', keyboard: 'email-address' },
            { label: 'Contraseña *', value: pass, set: setPass, placeholder: '••••••••', secure: true },
          ].map(({ label, value, set, placeholder, keyboard, secure }) => (
            <View key={label} style={styles.field}>
              <Text style={styles.fieldLabel}>{label}</Text>
              <TextInput
                style={styles.input}
                value={value}
                onChangeText={set}
                placeholder={placeholder}
                placeholderTextColor={colors.text4}
                keyboardType={keyboard || 'default'}
                secureTextEntry={secure}
                autoCapitalize="none"
              />
            </View>
          ))}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Rol</Text>
            <View style={styles.roleRow}>
              {['user', 'admin', 'super_admin'].map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.roleBtn, role === r && styles.roleBtnActive]}
                  onPress={() => setRole(r)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.roleBtnText, role === r && styles.roleBtnTextActive]}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => { reset(); onClose(); }} activeOpacity={0.7}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addBtn} onPress={submit} activeOpacity={0.85}>
              <Text style={styles.addText}>Crear</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function UsuariosScreen() {
  const currentUser = useSelector((s) => s.auth.user);
  const [users, setUsers]           = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showAdd, setShowAdd]       = useState(false);

  const load = useCallback(() => viernesApi.listUsers().then(setUsers).catch(() => {}), []);
  useEffect(() => { load(); }, []);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleDelete = (id) => {
    if (id === currentUser?.id) return Alert.alert('Error', 'No puedes eliminar tu propio usuario');
    Alert.alert('Eliminar usuario', '¿Eliminar este usuario?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
        try { await viernesApi.deleteUser(id); setUsers((p) => p.filter((u) => u.id !== id)); } catch {}
      }},
    ]);
  };

  const handleToggle = async (user) => {
    try {
      const updated = await viernesApi.updateUser(user.id, { is_active: !user.is_active });
      setUsers((p) => p.map((u) => u.id === user.id ? { ...u, ...updated } : u));
    } catch {}
  };

  const handleAdd = async (payload) => {
    try {
      const u = await viernesApi.createUser(payload);
      setUsers((p) => [u, ...p]);
    } catch {}
  };

  return (
    <Screen padded={false}>
      <FlatList
        data={users}
        keyExtractor={(u) => String(u.id)}
        onRefresh={onRefresh}
        refreshing={refreshing}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <UserCard user={item} onDelete={handleDelete} onToggle={handleToggle} />
        )}
        ListEmptyComponent={<Text style={styles.empty}>Sin usuarios</Text>}
      />
      <TouchableOpacity style={styles.fab} onPress={() => setShowAdd(true)} activeOpacity={0.85}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
      <AddModal visible={showAdd} onClose={() => setShowAdd(false)} onAdd={handleAdd} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list:           { padding: spacing.lg, gap: spacing.sm, paddingBottom: 90 },
  card:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  cardLeft:       { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
  avatar:         { width: 38, height: 38, borderRadius: radius.full, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  avatarText:     { color: '#fff', fontWeight: '700', fontSize: typography.sm },
  info:           { flex: 1, gap: 3 },
  name:           { color: colors.text, fontSize: typography.sm, fontWeight: '600' },
  email:          { color: colors.text3, fontSize: typography.xs },
  roleBadge:      { alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.sm },
  roleText:       { fontSize: 10, fontWeight: '600' },
  cardRight:      { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  del:            { color: colors.text4, fontSize: typography.base, padding: 4 },
  empty:          { color: colors.text4, textAlign: 'center', marginTop: spacing.xxl, fontSize: typography.base },
  fab:            { position: 'absolute', bottom: spacing.xl, right: spacing.xl, width: 52, height: 52, borderRadius: radius.full, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', elevation: 6 },
  fabText:        { color: '#fff', fontSize: 28, lineHeight: 32, fontWeight: '300' },
  overlay:        { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modal:          { backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.xl, gap: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  modalTitle:     { color: colors.text, fontSize: typography.lg, fontWeight: '600' },
  field:          { gap: 6 },
  fieldLabel:     { color: colors.text3, fontSize: typography.xs, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8 },
  input:          { backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.borderMed, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, color: colors.text, fontSize: typography.base },
  roleRow:        { flexDirection: 'row', gap: spacing.sm },
  roleBtn:        { flex: 1, paddingVertical: spacing.sm, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, alignItems: 'center', backgroundColor: colors.hover },
  roleBtnActive:  { backgroundColor: colors.accentBg, borderColor: colors.accent },
  roleBtnText:    { color: colors.text3, fontSize: 11, fontWeight: '600' },
  roleBtnTextActive:{ color: colors.accentText },
  actions:        { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  cancelBtn:      { flex: 1, paddingVertical: 12, borderRadius: radius.md, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  cancelText:     { color: colors.text3, fontSize: typography.base },
  addBtn:         { flex: 1, paddingVertical: 12, borderRadius: radius.md, alignItems: 'center', backgroundColor: colors.accent },
  addText:        { color: '#fff', fontSize: typography.base, fontWeight: '600' },
});
