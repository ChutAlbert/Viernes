import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, Switch,
  TextInput, Modal, KeyboardAvoidingView, Platform, Alert, Linking,
} from 'react-native';
import { Screen } from '../../components/Screen';
import { viernesApi } from '../../lib/api/viernes';
import { useTheme, useStyles, typography, spacing, radius } from '../../lib/theme';

// Mismo mapa que packages/ui/src/vue/utils/contacto.ts — mantener en sinc.
const COLOR_TIPO = {
  phone: '#22d3ee', email: '#f59e0b', whatsapp: '#22c55e',
  instagram: '#e1306c', facebook: '#1877f2', tiktok: '#ff0050',
  x: '#71717a', youtube: '#ff0000', linkedin: '#0a66c2',
  telegram: '#229ed9', other: '#818cf8',
};

const TIPOS = Object.keys(COLOR_TIPO);

function hrefDe(c) {
  if (c.contact_type === 'email') return `mailto:${c.value}`;
  if (c.contact_type === 'phone') return `tel:${c.value}`;
  if (c.contact_type === 'whatsapp') return `https://wa.me/${(c.value || '').replace(/\D/g, '')}`;
  return c.value;
}

function ContactoCard({ c, onDelete }) {
  const { colors } = useTheme();
  const styles = useStyles(makeStyles);
  return (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <View style={[styles.platDot, { backgroundColor: COLOR_TIPO[c.contact_type] || colors.accentText }]} />
        <View style={{ flex: 1 }}>
          <Text style={styles.plat}>{c.label}</Text>
          <Text style={styles.handle} numberOfLines={1}>{c.value}</Text>
          <View style={styles.chips}>
            {c.es_contacto !== false && <Text style={[styles.chip, { color: colors.accentText }]}>Contacto</Text>}
            {c.es_red ? <Text style={[styles.chip, { color: '#22c55e' }]}>Red social</Text> : null}
            {!c.is_active && <Text style={[styles.chip, { color: colors.text4 }]}>Inactivo</Text>}
          </View>
        </View>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity onPress={() => Linking.openURL(hrefDe(c))} activeOpacity={0.7}>
          <Text style={styles.openLink}>↗</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onDelete(c.id)} activeOpacity={0.7}>
          <Text style={styles.del}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function AddModal({ visible, onClose, onAdd }) {
  const { colors } = useTheme();
  const styles = useStyles(makeStyles);
  const [tipo, setTipo] = useState('whatsapp');
  const [label, setLabel] = useState('');
  const [valor, setValor] = useState('');
  const [esRed, setEsRed] = useState(false);
  const [esCon, setEsCon] = useState(true);

  const reset = () => { setTipo('whatsapp'); setLabel(''); setValor(''); setEsRed(false); setEsCon(true); };

  const submit = async () => {
    if (!label.trim() || !valor.trim()) return;
    await onAdd({
      contact_type: tipo, label: label.trim(), value: valor.trim(),
      is_active: true, areas: 'software,impresion3d',
      es_red: esRed, es_contacto: esCon, orden: 0,
    });
    reset(); onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>Nuevo contacto</Text>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Tipo</Text>
            <View style={styles.tipoRow}>
              {TIPOS.map((t) => (
                <TouchableOpacity key={t} onPress={() => setTipo(t)}
                  style={[styles.tipoBtn, tipo === t && { borderColor: COLOR_TIPO[t], backgroundColor: COLOR_TIPO[t] + '22' }]}>
                  <Text style={[styles.tipoText, tipo === t && { color: COLOR_TIPO[t] }]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Etiqueta</Text>
            <TextInput style={styles.input} value={label} onChangeText={setLabel}
              placeholder="WhatsApp MX" placeholderTextColor={colors.text4} />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Valor</Text>
            <TextInput style={styles.input} value={valor} onChangeText={setValor} autoCapitalize="none"
              placeholder="+52 442 000 0000 o https://..." placeholderTextColor={colors.text4} />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Dato de contacto</Text>
            <Switch value={esCon} onValueChange={setEsCon} trackColor={{ true: colors.accent }} />
          </View>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Red social</Text>
            <Switch value={esRed} onValueChange={setEsRed} trackColor={{ true: '#22c55e' }} />
          </View>
          <Text style={styles.hint}>WhatsApp normalmente lleva las dos.</Text>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => { reset(); onClose(); }}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addBtn} onPress={submit}>
              <Text style={styles.addText}>Agregar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function ContactosScreen() {
  const styles = useStyles(makeStyles);
  const [items, setItems] = useState([]);
  const [modal, setModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try { setItems(await viernesApi.listContactos()); } catch {}
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const add = async (payload) => {
    try { await viernesApi.createContacto(payload); await load(); }
    catch { Alert.alert('Error', 'No se pudo guardar el contacto.'); }
  };

  const remove = (id) => {
    Alert.alert('Eliminar contacto', 'Se quita del sitio web. No se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
        try { await viernesApi.deleteContacto(id); await load(); } catch {}
      }},
    ]);
  };

  return (
    <Screen padded={false}>
      <FlatList
        data={items}
        keyExtractor={(i) => String(i.id)}
        contentContainerStyle={styles.list}
        refreshing={refreshing}
        onRefresh={onRefresh}
        renderItem={({ item }) => <ContactoCard c={item} onDelete={remove} />}
        ListEmptyComponent={<Text style={styles.empty}>No hay contactos.</Text>}
      />
      <TouchableOpacity style={styles.fab} onPress={() => setModal(true)} activeOpacity={0.85}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
      <AddModal visible={modal} onClose={() => setModal(false)} onAdd={add} />
    </Screen>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  list: { padding: spacing.lg, gap: spacing.sm, paddingBottom: 90 },
  card: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
  platDot: { width: 10, height: 10, borderRadius: 5 },
  plat: { color: colors.text, fontSize: typography.sm, fontWeight: '600' },
  handle: { color: colors.text3, fontSize: typography.xs, marginTop: 1 },
  chips: { flexDirection: 'row', gap: spacing.sm, marginTop: 3 },
  chip: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  openLink: { color: colors.accentText, fontSize: typography.lg, padding: 4 },
  del: { color: colors.text4, fontSize: typography.base, padding: 4 },
  empty: { color: colors.text4, textAlign: 'center', marginTop: spacing.xxl, fontSize: typography.base },
  fab: { position: 'absolute', bottom: spacing.xl, right: spacing.xl, width: 52, height: 52, borderRadius: radius.full, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', elevation: 6 },
  fabText: { color: '#fff', fontSize: 28, lineHeight: 32, fontWeight: '300' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modal: { backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.xl, gap: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  modalTitle: { color: colors.text, fontSize: typography.lg, fontWeight: '600' },
  field: { gap: 6 },
  fieldLabel: { color: colors.text3, fontSize: typography.xs, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8 },
  input: { backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.borderMed, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, color: colors.text, fontSize: typography.base },
  tipoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tipoBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border },
  tipoText: { color: colors.text3, fontSize: typography.xs },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  switchLabel: { color: colors.text2, fontSize: typography.base },
  hint: { color: colors.text4, fontSize: typography.xs, marginTop: -4 },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: radius.md, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  cancelText: { color: colors.text3, fontSize: typography.base },
  addBtn: { flex: 1, paddingVertical: 12, borderRadius: radius.md, alignItems: 'center', backgroundColor: colors.accent },
  addText: { color: '#fff', fontSize: typography.base, fontWeight: '600' },
});
