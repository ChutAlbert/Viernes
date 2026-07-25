import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  TextInput, Modal, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { Screen } from '../../components/Screen';
import { viernesApi } from '../../lib/api/viernes';
import { useTheme, useStyles, typography, spacing, radius } from '../../lib/theme';

function ItemRow({ item, onDelete }) {
  const { colors } = useTheme();
  const styles = useStyles(makeStyles);
  const pct = item.cantidad_minima > 0
    ? Math.min(100, (item.cantidad_actual / item.cantidad_minima) * 100)
    : 100;
  const low = item.cantidad_actual <= item.cantidad_minima;
  const barColor = low ? colors.red : colors.green;

  return (
    <View style={styles.row}>
      <View style={styles.rowTop}>
        <Text style={styles.nombre}>{item.nombre}</Text>
        <View style={styles.rowRight}>
          <Text style={[styles.cantidad, low && styles.cantidadLow]}>
            {item.cantidad_actual} {item.unidad}
          </Text>
          <TouchableOpacity onPress={() => onDelete(item.id)} activeOpacity={0.7}>
            <Text style={styles.del}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.barBg}>
        <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: barColor }]} />
      </View>
      <Text style={styles.meta}>
        Mínimo: {item.cantidad_minima} {item.unidad}
        {item.proveedor ? ` · ${item.proveedor}` : ''}
      </Text>
    </View>
  );
}

function AddModal({ visible, onClose, onAdd }) {
  const { colors } = useTheme();
  const styles = useStyles(makeStyles);
  const [nombre, setNombre]   = useState('');
  const [cantidad, setCantidad] = useState('');
  const [minima, setMinima]   = useState('');
  const [unidad, setUnidad]   = useState('');

  const reset = () => { setNombre(''); setCantidad(''); setMinima(''); setUnidad(''); };

  const submit = async () => {
    if (!nombre.trim()) return;
    await onAdd({
      nombre:           nombre.trim(),
      cantidad_actual:  parseFloat(cantidad) || 0,
      cantidad_minima:  parseFloat(minima) || 0,
      unidad:           unidad.trim() || 'pza',
    });
    reset();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>Nuevo material</Text>
          {[
            { label: 'Nombre *', value: nombre, set: setNombre, placeholder: 'PLA Blanco' },
            { label: 'Cantidad actual', value: cantidad, set: setCantidad, placeholder: '0', keyboard: 'numeric' },
            { label: 'Cantidad mínima', value: minima, set: setMinima, placeholder: '0', keyboard: 'numeric' },
            { label: 'Unidad', value: unidad, set: setUnidad, placeholder: 'kg, pza, m…' },
          ].map(({ label, value, set, placeholder, keyboard }) => (
            <View key={label} style={styles.field}>
              <Text style={styles.fieldLabel}>{label}</Text>
              <TextInput
                style={styles.input}
                value={value}
                onChangeText={set}
                placeholder={placeholder}
                placeholderTextColor={colors.text4}
                keyboardType={keyboard || 'default'}
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

export default function InventarioScreen() {
  const styles = useStyles(makeStyles);
  const [items, setItems]         = useState([]);
  const [alertas, setAlertas]     = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showAdd, setShowAdd]     = useState(false);

  const load = useCallback(async () => {
    const [it, al] = await Promise.allSettled([
      viernesApi.listInventarioItems(),
      viernesApi.getInventarioAlertas(),
    ]);
    if (it.status === 'fulfilled') setItems(it.value);
    if (al.status === 'fulfilled') setAlertas(al.value);
  }, []);

  useEffect(() => { load(); }, []);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleDelete = (id) => {
    Alert.alert('Eliminar material', '¿Eliminar este material?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
        try { await viernesApi.deleteInventarioItem(id); setItems((p) => p.filter((i) => i.id !== id)); } catch {}
      }},
    ]);
  };

  const handleAdd = async (payload) => {
    try {
      const item = await viernesApi.createInventarioItem(payload);
      setItems((p) => [item, ...p]);
    } catch {}
  };

  return (
    <Screen padded={false}>
      <FlatList
        data={items}
        keyExtractor={(i) => String(i.id)}
        onRefresh={onRefresh}
        refreshing={refreshing}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => <ItemRow item={item} onDelete={handleDelete} />}
        ListHeaderComponent={
          alertas.length > 0 ? (
            <View style={styles.alertBanner}>
              <Text style={styles.alertText}>⚠ {alertas.length} material{alertas.length > 1 ? 'es' : ''} con stock bajo</Text>
            </View>
          ) : null
        }
        ListEmptyComponent={<Text style={styles.empty}>Sin materiales en inventario</Text>}
      />
      <TouchableOpacity style={styles.fab} onPress={() => setShowAdd(true)} activeOpacity={0.85}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
      <AddModal visible={showAdd} onClose={() => setShowAdd(false)} onAdd={handleAdd} />
    </Screen>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  list:         { padding: spacing.lg, gap: spacing.sm, paddingBottom: 90 },
  alertBanner:  { backgroundColor: colors.yellowBg, borderWidth: 1, borderColor: '#f59e0b44', borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md },
  alertText:    { color: colors.yellow, fontSize: typography.sm, fontWeight: '600' },
  row:          { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border, gap: 6 },
  rowTop:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowRight:     { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  nombre:       { color: colors.text, fontSize: typography.sm, fontWeight: '600', flex: 1 },
  cantidad:     { color: colors.text2, fontSize: typography.sm, fontWeight: '600' },
  cantidadLow:  { color: colors.red },
  barBg:        { height: 4, backgroundColor: colors.border, borderRadius: 2, overflow: 'hidden' },
  barFill:      { height: '100%', borderRadius: 2 },
  meta:         { color: colors.text4, fontSize: 11 },
  del:          { color: colors.text4, fontSize: typography.base, padding: 4 },
  empty:        { color: colors.text4, textAlign: 'center', marginTop: spacing.xxl, fontSize: typography.base },
  fab:          { position: 'absolute', bottom: spacing.xl, right: spacing.xl, width: 52, height: 52, borderRadius: radius.full, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', elevation: 6 },
  fabText:      { color: '#fff', fontSize: 28, lineHeight: 32, fontWeight: '300' },
  overlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modal:        { backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.xl, gap: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  modalTitle:   { color: colors.text, fontSize: typography.lg, fontWeight: '600' },
  field:        { gap: 6 },
  fieldLabel:   { color: colors.text3, fontSize: typography.xs, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8 },
  input:        { backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.borderMed, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, color: colors.text, fontSize: typography.base },
  actions:      { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  cancelBtn:    { flex: 1, paddingVertical: 12, borderRadius: radius.md, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  cancelText:   { color: colors.text3, fontSize: typography.base },
  addBtn:       { flex: 1, paddingVertical: 12, borderRadius: radius.md, alignItems: 'center', backgroundColor: colors.accent },
  addText:      { color: '#fff', fontSize: typography.base, fontWeight: '600' },
});
