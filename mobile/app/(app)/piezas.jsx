import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, Switch, ScrollView,
  ActivityIndicator, TextInput, Alert, Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Screen } from '../../components/Screen';
import { viernesApi } from '../../lib/api/viernes';
import { useTheme, useStyles, typography, spacing, radius } from '../../lib/theme';

// Desde la fusion, una "pieza" es un catalogo_producto: puede estar publicada
// en el sitio, marcada como vendida, o ninguna de las dos (borrador).
function PiezaCard({ pieza, onDelete, onEditar }) {
  const { colors } = useTheme();
  const styles = useStyles(makeStyles);
  const precio = pieza.precio_desde;
  return (
    <TouchableOpacity style={styles.card} onPress={() => onEditar(pieza.id)} activeOpacity={0.75}>
      <View style={styles.cardTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{pieza.nombre}</Text>
          {pieza.persona ? (
            <Text style={styles.desc} numberOfLines={1}>Para: {pieza.persona}</Text>
          ) : null}
        </View>
        <TouchableOpacity onPress={() => onDelete(pieza.id)} activeOpacity={0.7}>
          <Text style={styles.del}>Eliminar</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tags}>
        {pieza.publicado ? (
          <View style={[styles.tag, { backgroundColor: colors.greenBg }]}>
            <Text style={[styles.tagText, { color: colors.green }]}>Publicada</Text>
          </View>
        ) : (
          <View style={[styles.tag, { backgroundColor: colors.yellowBg }]}>
            <Text style={[styles.tagText, { color: colors.yellow }]}>Borrador</Text>
          </View>
        )}

        {pieza.es_vendida ? (
          <View style={[styles.tag, { backgroundColor: colors.accentBg }]}>
            <Text style={[styles.tagText, { color: colors.accentText }]}>
              {pieza.tipo_venta === 'encargo' ? 'Encargo' : 'Vendida'}
            </Text>
          </View>
        ) : null}

        {pieza.permite_multicolor ? (
          <View style={styles.tag}>
            <Text style={styles.tagText}>Multicolor</Text>
          </View>
        ) : null}

        {precio != null ? (
          <View style={[styles.tag, { backgroundColor: colors.accentBg }]}>
            <Text style={[styles.tagText, { color: colors.accentText }]}>${precio}</Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}


// Editor rapido: nombre, descripcion y estado. Fotos, archivo 3D y calculo
// se quedan en el dashboard, no son para hacerse desde el telefono.
function EditorModal({ piezaId, onClose, onGuardado }) {
  const { colors } = useTheme();
  const styles = useStyles(makeStyles);
  const [p, setP] = useState(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (piezaId == null) { setP(null); return; }
    viernesApi.getPieza(piezaId).then(setP).catch(() => {
      Alert.alert('Error', 'No se pudo cargar la pieza.');
      onClose();
    });
  }, [piezaId]);

  const set = (k) => (v) => setP((x) => ({ ...x, [k]: v }));

  const guardar = async () => {
    if (!p?.nombre?.trim()) { Alert.alert('Falta el nombre', 'La pieza necesita un nombre.'); return; }
    setGuardando(true);
    try {
      // PUT reemplaza el registro: mandamos el objeto completo que trajimos
      await viernesApi.updatePieza(p.id, { ...p, nombre: p.nombre.trim() });
      onGuardado();
      onClose();
    } catch {
      Alert.alert('Error', 'No se pudo guardar.');
    } finally { setGuardando(false); }
  };

  return (
    <Modal visible={piezaId != null} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.overlay}>
        <View style={styles.modal}>
          {!p ? (
            <ActivityIndicator color={colors.accent} style={{ paddingVertical: spacing.xl }} />
          ) : (
            <ScrollView contentContainerStyle={{ gap: spacing.md }} keyboardShouldPersistTaps="handled">
              <Text style={styles.modalTitle}>Editar pieza</Text>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Nombre</Text>
                <TextInput style={styles.input} value={p.nombre ?? ''} onChangeText={set('nombre')} />
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Descripción</Text>
                <TextInput style={[styles.input, { height: 90, textAlignVertical: 'top' }]} multiline
                  value={p.descripcion ?? ''} onChangeText={set('descripcion')} />
              </View>

              {[
                ['publicado', 'Publicar en catálogo', 'Visible en el sitio de Sodigic.'],
                ['es_vendida', 'Marcar como vendida', 'Se registra como pieza vendida.'],
                ['ver_3d', 'Ver en 3D', 'Muestra el visor del modelo en el sitio.'],
                ['permite_multicolor', 'Permite multicolor', null],
              ].map(([k, label, hint]) => (
                <View key={k} style={styles.switchRow}>
                  <View style={{ flex: 1, paddingRight: spacing.md }}>
                    <Text style={styles.switchLabel}>{label}</Text>
                    {hint ? <Text style={styles.switchHint}>{hint}</Text> : null}
                  </View>
                  <Switch value={p[k] !== false && !!p[k]} onValueChange={set(k)}
                    trackColor={{ true: colors.accent }} />
                </View>
              ))}

              {p.es_vendida ? (
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Persona</Text>
                  <TextInput style={styles.input} value={p.persona ?? ''} onChangeText={set('persona')}
                    placeholder="¿Para quién?" placeholderTextColor={colors.text4} />
                </View>
              ) : null}

              <View style={styles.actions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                  <Text style={styles.cancelText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.addBtn} onPress={guardar} disabled={guardando}>
                  <Text style={styles.addText}>{guardando ? 'Guardando…' : 'Guardar'}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function PiezasScreen() {
  const { colors } = useTheme();
  const styles = useStyles(makeStyles);
  const [piezas, setPiezas]       = useState([]);
  const [filtered, setFiltered]   = useState([]);
  const [search, setSearch]       = useState('');
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editando, setEditando] = useState(null);

  const load = useCallback(async () => {
    try {
      const data = await viernesApi.listPiezas();
      setPiezas(data);
      setFiltered(data);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(q ? piezas.filter((p) => p.nombre?.toLowerCase().includes(q)) : piezas);
  }, [search, piezas]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleDelete = (id) => {
    Alert.alert('Eliminar pieza', '¿Eliminar esta pieza 3D?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
        try { await viernesApi.deletePieza(id); setPiezas((p) => p.filter((i) => i.id !== id)); } catch {}
      }},
    ]);
  };

  return (
    <Screen padded={false}>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar pieza…"
          placeholderTextColor={colors.text4}
        />
      </View>
      {loading ? (
        <View style={styles.center}><ActivityIndicator color={colors.accentText} /></View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(p) => String(p.id)}
          onRefresh={onRefresh}
          refreshing={refreshing}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <PiezaCard pieza={item} onDelete={handleDelete} onEditar={setEditando} />}
          ListEmptyComponent={<Text style={styles.empty}>Sin piezas 3D</Text>}
        />
      )}
      <EditorModal
        piezaId={editando}
        onClose={() => setEditando(null)}
        onGuardado={load}
      />
    </Screen>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  overlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modal:       { backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.xl, maxHeight: '88%', borderTopWidth: 1, borderTopColor: colors.border },
  modalTitle:  { color: colors.text, fontSize: typography.lg, fontWeight: '600' },
  field:       { gap: 6 },
  fieldLabel:  { color: colors.text3, fontSize: typography.xs, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8 },
  input:       { backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.borderMed, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, color: colors.text, fontSize: typography.base },
  switchRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  switchLabel: { color: colors.text, fontSize: typography.base, fontWeight: '500' },
  switchHint:  { color: colors.text4, fontSize: typography.xs, marginTop: 1 },
  actions:     { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  cancelBtn:   { flex: 1, paddingVertical: 12, borderRadius: radius.md, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  cancelText:  { color: colors.text3, fontSize: typography.base },
  addBtn:      { flex: 1, paddingVertical: 12, borderRadius: radius.md, alignItems: 'center', backgroundColor: colors.accent },
  addText:     { color: '#fff', fontSize: typography.base, fontWeight: '600' },
  searchRow:   { padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  searchInput: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderMed, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, color: colors.text, fontSize: typography.sm },
  list:        { padding: spacing.lg, gap: spacing.sm, paddingBottom: spacing.xxl },
  center:      { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card:        { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border, gap: spacing.sm },
  cardTop:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  name:        { color: colors.text, fontSize: typography.base, fontWeight: '600' },
  desc:        { color: colors.text3, fontSize: typography.xs, marginTop: 3, lineHeight: 17 },
  del:         { color: colors.text4, fontSize: typography.base, padding: 4 },
  tags:        { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag:         { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.sm, backgroundColor: colors.hover },
  tagText:     { color: colors.text3, fontSize: 11, fontWeight: '500' },
  empty:       { color: colors.text4, textAlign: 'center', marginTop: spacing.xxl, fontSize: typography.base },
});
