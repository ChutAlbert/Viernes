import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, SectionList, StyleSheet, TouchableOpacity, Switch,
  TextInput, Alert,
} from 'react-native';
import { Screen } from '../../components/Screen';
import { viernesApi } from '../../lib/api/viernes';
import { useTheme, useStyles, typography, spacing, radius } from '../../lib/theme';

function FilamentoRow({ f, onToggle }) {
  const { colors } = useTheme();
  const styles = useStyles(makeStyles);
  const bajo = f.cantidad_minima != null && f.cantidad_actual != null
    && f.cantidad_actual <= f.cantidad_minima;

  return (
    <View style={styles.row}>
      <View style={[styles.dot, { backgroundColor: f.hex_codigo || colors.border }]} />
      <View style={{ flex: 1 }}>
        <Text style={styles.nombre}>{f.nombre}</Text>
        <View style={styles.meta}>
          {f.cantidad_actual != null && (
            <Text style={[styles.metaText, bajo && { color: colors.yellow }]}>
              {f.cantidad_actual}{f.unidad ? ` ${f.unidad}` : ''}
            </Text>
          )}
          {bajo && <Text style={[styles.badge, { color: colors.yellow }]}>STOCK BAJO</Text>}
        </View>
      </View>
      {/* activo = se muestra en el sitio; no depende del stock */}
      <Switch value={!!f.activo} onValueChange={() => onToggle(f)} trackColor={{ true: colors.accent }} />
    </View>
  );
}

export default function FilamentosScreen() {
  const styles = useStyles(makeStyles);
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try { setItems(await viernesApi.listFilamentos()); } catch {}
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const toggle = async (f) => {
    // optimista: si falla, recargamos y vuelve a su valor real
    setItems((prev) => prev.map((x) => (x.id === f.id ? { ...x, activo: !x.activo } : x)));
    try { await viernesApi.updateFilamento(f.id, { ...f, activo: !f.activo }); }
    catch { Alert.alert('Error', 'No se pudo actualizar.'); load(); }
  };

  // Agrupados por tipo de material, igual que el dashboard
  const sections = useMemo(() => {
    const q = search.trim().toLowerCase();
    const visibles = q ? items.filter((f) => f.nombre?.toLowerCase().includes(q)) : items;
    const porTipo = {};
    for (const f of visibles) {
      const t = f.tipo_material || 'Otros';
      (porTipo[t] ||= []).push(f);
    }
    return Object.keys(porTipo).sort().map((t) => ({ title: t, data: porTipo[t] }));
  }, [items, search]);

  return (
    <Screen padded={false}>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar color o material"
          placeholderTextColor="#8b8b8b"
          autoCapitalize="none"
        />
      </View>
      <SectionList
        sections={sections}
        keyExtractor={(i) => String(i.id)}
        contentContainerStyle={styles.list}
        refreshing={refreshing}
        onRefresh={onRefresh}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) => (
          <Text style={styles.section}>{section.title} · {section.data.length}</Text>
        )}
        renderItem={({ item }) => <FilamentoRow f={item} onToggle={toggle} />}
        ListEmptyComponent={<Text style={styles.empty}>No hay filamentos.</Text>}
      />
    </Screen>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  searchRow: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  searchInput: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, color: colors.text, fontSize: typography.base },
  list: { padding: spacing.lg, gap: 6, paddingBottom: 60 },
  section: { color: colors.text4, fontSize: typography.xs, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginTop: spacing.md, marginBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.surface, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderWidth: 1, borderColor: colors.border },
  dot: { width: 20, height: 20, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  nombre: { color: colors.text, fontSize: typography.sm, fontWeight: '600' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 1 },
  metaText: { color: colors.text4, fontSize: typography.xs },
  badge: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  empty: { color: colors.text4, textAlign: 'center', marginTop: spacing.xxl, fontSize: typography.base },
});
