import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  ActivityIndicator, TextInput, Alert,
} from 'react-native';
import { Screen } from '../../components/Screen';
import { viernesApi } from '../../lib/api/viernes';
import { useTheme, useStyles, typography, spacing, radius } from '../../lib/theme';

// Desde la fusion, una "pieza" es un catalogo_producto: puede estar publicada
// en el sitio, marcada como vendida, o ninguna de las dos (borrador).
function PiezaCard({ pieza, onDelete }) {
  const { colors } = useTheme();
  const styles = useStyles(makeStyles);
  const precio = pieza.precio_desde;
  return (
    <View style={styles.card}>
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
    </View>
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
          renderItem={({ item }) => <PiezaCard pieza={item} onDelete={handleDelete} />}
          ListEmptyComponent={<Text style={styles.empty}>Sin piezas 3D</Text>}
        />
      )}
    </Screen>
  );
}

const makeStyles = (colors) => StyleSheet.create({
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
