import { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Screen } from '../../components/Screen';
import { viernesApi } from '../../lib/api/viernes';
import { colors, typography, spacing, radius } from '../../lib/theme';

function ServiceCard({ service }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.name}>{service.nombre || service.title || 'Servicio'}</Text>
        {service.activo != null && (
          <View style={[styles.badge, service.activo ? styles.badgeActive : styles.badgeInactive]}>
            <Text style={[styles.badgeText, service.activo ? styles.badgeTextActive : styles.badgeTextInactive]}>
              {service.activo ? 'Activo' : 'Inactivo'}
            </Text>
          </View>
        )}
      </View>
      {service.descripcion && (
        <Text style={styles.desc} numberOfLines={3}>{service.descripcion}</Text>
      )}
      {service.categoria && (
        <Text style={styles.cat}>{service.categoria}</Text>
      )}
    </View>
  );
}

export default function WebsiteScreen() {
  const [services, setServices] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await viernesApi.listServicios();
      setServices(Array.isArray(data) ? data : data?.services || data?.items || []);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, []);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  return (
    <Screen padded={false}>
      {loading ? (
        <View style={styles.center}><ActivityIndicator color={colors.accentText} /></View>
      ) : (
        <FlatList
          data={services}
          keyExtractor={(s, i) => String(s.id || i)}
          onRefresh={onRefresh}
          refreshing={refreshing}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <ServiceCard service={item} />}
          ListHeaderComponent={
            <Text style={styles.hint}>Servicios del sitio web público de Sodigic</Text>
          }
          ListEmptyComponent={<Text style={styles.empty}>Sin servicios configurados</Text>}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list:           { padding: spacing.lg, gap: spacing.sm, paddingBottom: spacing.xxl },
  center:         { flex: 1, justifyContent: 'center', alignItems: 'center' },
  hint:           { color: colors.text4, fontSize: typography.xs, marginBottom: spacing.md },
  card:           { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border, gap: spacing.sm },
  cardHeader:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name:           { color: colors.text, fontSize: typography.base, fontWeight: '600', flex: 1 },
  desc:           { color: colors.text3, fontSize: typography.xs, lineHeight: 18 },
  cat:            { color: colors.text4, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 },
  badge:          { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full },
  badgeActive:    { backgroundColor: colors.greenBg },
  badgeInactive:  { backgroundColor: colors.redBg },
  badgeText:      { fontSize: 11, fontWeight: '600' },
  badgeTextActive:{ color: colors.green },
  badgeTextInactive:{ color: colors.red },
  empty:          { color: colors.text4, textAlign: 'center', marginTop: spacing.xxl, fontSize: typography.base },
});
