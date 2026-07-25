import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  TextInput, Modal, KeyboardAvoidingView, Platform, Alert, Linking,
} from 'react-native';
import { Screen } from '../../components/Screen';
import { viernesApi } from '../../lib/api/viernes';
import { useTheme, useStyles, typography, spacing, radius } from '../../lib/theme';

const PLAT_COLOR = {
  instagram: '#e1306c',
  facebook:  '#1877f2',
  twitter:   '#1da1f2',
  x:         '#000000',
  tiktok:    '#69c9d0',
  linkedin:  '#0a66c2',
  youtube:   '#ff0000',
};

function RedCard({ red, onDelete }) {
  const { colors } = useTheme();
  const styles = useStyles(makeStyles);
  const color = PLAT_COLOR[red.plataforma?.toLowerCase()] || colors.accentText;

  return (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <View style={[styles.platDot, { backgroundColor: color }]} />
        <View>
          <Text style={styles.plat}>{red.plataforma}</Text>
          <Text style={styles.handle} numberOfLines={1}>{red.usuario || red.url || ''}</Text>
          {red.seguidores != null && (
            <Text style={styles.followers}>{red.seguidores.toLocaleString('es-MX')} seguidores</Text>
          )}
        </View>
      </View>
      <View style={styles.cardActions}>
        {red.url && (
          <TouchableOpacity onPress={() => Linking.openURL(red.url)} activeOpacity={0.7}>
            <Text style={styles.openLink}>↗</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={() => onDelete(red.id)} activeOpacity={0.7}>
          <Text style={styles.del}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function AddModal({ visible, onClose, onAdd }) {
  const { colors } = useTheme();
  const styles = useStyles(makeStyles);
  const [plataforma, setPlataforma] = useState('');
  const [usuario, setUsuario]       = useState('');
  const [url, setUrl]               = useState('');
  const reset = () => { setPlataforma(''); setUsuario(''); setUrl(''); };

  const submit = async () => {
    if (!plataforma.trim()) return;
    await onAdd({ plataforma: plataforma.trim(), usuario: usuario.trim(), url: url.trim() });
    reset(); onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>Nueva red social</Text>
          {[
            { label: 'Plataforma *', value: plataforma, set: setPlataforma, placeholder: 'Instagram, Facebook…' },
            { label: 'Usuario / Handle', value: usuario, set: setUsuario, placeholder: '@sodigic' },
            { label: 'URL del perfil', value: url, set: setUrl, placeholder: 'https://…' },
          ].map(({ label, value, set, placeholder }) => (
            <View key={label} style={styles.field}>
              <Text style={styles.fieldLabel}>{label}</Text>
              <TextInput
                style={styles.input}
                value={value}
                onChangeText={set}
                placeholder={placeholder}
                placeholderTextColor={colors.text4}
                autoCapitalize="none"
              />
            </View>
          ))}
          <View style={styles.actions}>
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

export default function RedesScreen() {
  const styles = useStyles(makeStyles);
  const [redes, setRedes]           = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showAdd, setShowAdd]       = useState(false);

  const load = useCallback(() => viernesApi.listRedes().then(setRedes).catch(() => {}), []);
  useEffect(() => { load(); }, []);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleDelete = (id) => {
    Alert.alert('Eliminar red', '¿Eliminar esta red social?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
        try { await viernesApi.deleteRed(id); setRedes((p) => p.filter((r) => r.id !== id)); } catch {}
      }},
    ]);
  };

  const handleAdd = async (payload) => {
    try {
      const r = await viernesApi.createRed(payload);
      setRedes((p) => [r, ...p]);
    } catch {}
  };

  return (
    <Screen padded={false}>
      <FlatList
        data={redes}
        keyExtractor={(r) => String(r.id)}
        onRefresh={onRefresh}
        refreshing={refreshing}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => <RedCard red={item} onDelete={handleDelete} />}
        ListEmptyComponent={<Text style={styles.empty}>Sin redes sociales configuradas</Text>}
      />
      <TouchableOpacity style={styles.fab} onPress={() => setShowAdd(true)} activeOpacity={0.85}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
      <AddModal visible={showAdd} onClose={() => setShowAdd(false)} onAdd={handleAdd} />
    </Screen>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  list:       { padding: spacing.lg, gap: spacing.sm, paddingBottom: 90 },
  card:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  cardLeft:   { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
  platDot:    { width: 10, height: 10, borderRadius: 5 },
  plat:       { color: colors.text, fontSize: typography.sm, fontWeight: '600', textTransform: 'capitalize' },
  handle:     { color: colors.text3, fontSize: typography.xs, marginTop: 1 },
  followers:  { color: colors.text4, fontSize: 11, marginTop: 1 },
  cardActions:{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  openLink:   { color: colors.accentText, fontSize: typography.lg, padding: 4 },
  del:        { color: colors.text4, fontSize: typography.base, padding: 4 },
  empty:      { color: colors.text4, textAlign: 'center', marginTop: spacing.xxl, fontSize: typography.base },
  fab:        { position: 'absolute', bottom: spacing.xl, right: spacing.xl, width: 52, height: 52, borderRadius: radius.full, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', elevation: 6 },
  fabText:    { color: '#fff', fontSize: 28, lineHeight: 32, fontWeight: '300' },
  overlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modal:      { backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.xl, gap: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  modalTitle: { color: colors.text, fontSize: typography.lg, fontWeight: '600' },
  field:      { gap: 6 },
  fieldLabel: { color: colors.text3, fontSize: typography.xs, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8 },
  input:      { backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.borderMed, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, color: colors.text, fontSize: typography.base },
  actions:    { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  cancelBtn:  { flex: 1, paddingVertical: 12, borderRadius: radius.md, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  cancelText: { color: colors.text3, fontSize: typography.base },
  addBtn:     { flex: 1, paddingVertical: 12, borderRadius: radius.md, alignItems: 'center', backgroundColor: colors.accent },
  addText:    { color: '#fff', fontSize: typography.base, fontWeight: '600' },
});
