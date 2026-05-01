import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  ActivityIndicator, Image, TextInput,
} from 'react-native';
import { Screen } from '../../components/Screen';
import { viernesApi } from '../../lib/api/viernes';
import { API_BASE_URL } from '../../lib/api/client';
import { colors, typography, spacing, radius } from '../../lib/theme';

function ProductCard({ product }) {
  const img = product.imagenes?.[0]?.url
    ? { uri: `${API_BASE_URL}${product.imagenes[0].url}` }
    : null;

  return (
    <View style={styles.card}>
      <View style={styles.imgBox}>
        {img
          ? <Image source={img} style={styles.img} resizeMode="cover" />
          : <View style={styles.imgPlaceholder}><Text style={styles.imgIcon}>◈</Text></View>
        }
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>{product.nombre}</Text>
        {product.precio_base != null && (
          <Text style={styles.price}>${product.precio_base.toFixed(2)}</Text>
        )}
        {product.categoria && (
          <Text style={styles.category}>{product.categoria}</Text>
        )}
      </View>
    </View>
  );
}

export default function CatalogoScreen() {
  const [productos, setProductos] = useState([]);
  const [filtered, setFiltered]   = useState([]);
  const [search, setSearch]       = useState('');
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await viernesApi.listProductosCatalogo();
      setProductos(data);
      setFiltered(data);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      q ? productos.filter((p) => p.nombre?.toLowerCase().includes(q) || p.categoria?.toLowerCase().includes(q))
        : productos
    );
  }, [search, productos]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  return (
    <Screen padded={false}>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar producto…"
          placeholderTextColor={colors.text4}
        />
      </View>
      {loading ? (
        <View style={styles.center}><ActivityIndicator color={colors.accentText} /></View>
      ) : (
        <FlatList
          data={filtered}
          numColumns={2}
          columnWrapperStyle={styles.row}
          keyExtractor={(p) => String(p.id)}
          onRefresh={onRefresh}
          refreshing={refreshing}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <ProductCard product={item} />}
          ListEmptyComponent={<Text style={styles.empty}>Sin productos</Text>}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  searchRow:   { padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  searchInput: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderMed, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, color: colors.text, fontSize: typography.sm },
  list:        { padding: spacing.md, paddingBottom: spacing.xxl },
  row:         { gap: spacing.sm, marginBottom: spacing.sm },
  center:      { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card:        { flex: 1, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  imgBox:      { height: 120 },
  img:         { width: '100%', height: '100%' },
  imgPlaceholder:{ width: '100%', height: '100%', backgroundColor: colors.hover, alignItems: 'center', justifyContent: 'center' },
  imgIcon:     { color: colors.text4, fontSize: 32 },
  info:        { padding: spacing.sm, gap: 3 },
  name:        { color: colors.text, fontSize: typography.xs, fontWeight: '600' },
  price:       { color: colors.accentText, fontSize: typography.sm, fontWeight: '700' },
  category:    { color: colors.text4, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  empty:       { color: colors.text4, textAlign: 'center', marginTop: spacing.xxl, fontSize: typography.base },
});
