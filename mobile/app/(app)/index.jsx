import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../../components/Screen';
import { useSelector } from 'react-redux';
import { viernesApi } from '../../lib/api/viernes';
import { useTheme, useStyles, typography, spacing, radius } from '../../lib/theme';

function GradientCard({ label, value, accent }) {
  const styles = useStyles(makeStyles);
  return (
    <View style={[styles.gradCard, { backgroundColor: accent }]}>
      <Text style={styles.gradLabel}>{label}</Text>
      <Text style={styles.gradValue}>{value}</Text>
    </View>
  );
}

function StatCard({ label, value }) {
  const styles = useStyles(makeStyles);
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function TaskItem({ task, onComplete }) {
  const { colors } = useTheme();
  const styles = useStyles(makeStyles);
  const colors_ = {
    high:   { text: colors.red,    bg: colors.redBg },
    medium: { text: colors.yellow, bg: colors.yellowBg },
    low:    { text: colors.green,  bg: colors.greenBg },
  };
  const p = colors_[task.priority] || colors_.medium;

  return (
    <View style={styles.taskRow}>
      <TouchableOpacity
        style={styles.taskCircle}
        onPress={() => onComplete(task.id)}
        activeOpacity={0.7}
      />
      <Text style={styles.taskTitle} numberOfLines={1}>{task.title}</Text>
      <View style={[styles.taskBadge, { backgroundColor: p.bg }]}>
        <Text style={[styles.taskBadgeText, { color: p.text }]}>
          {task.priority === 'high' ? 'Alta' : task.priority === 'low' ? 'Baja' : 'Media'}
        </Text>
      </View>
    </View>
  );
}

export default function OverviewScreen() {
  const styles = useStyles(makeStyles);
  // Un usuario comun no ve visitas del sitio ni alertas de inventario
  const user = useSelector((st) => st.auth.user);
  const esAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const [visits, setVisits]   = useState(null);
  const [tasks, setTasks]     = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const load = useCallback(async () => {
    const [v, t, a] = await Promise.allSettled([
      esAdmin ? viernesApi.visitStats() : Promise.resolve(null),
      viernesApi.pendingTasks(),
      esAdmin ? viernesApi.getInventarioAlertas() : Promise.resolve([]),
    ]);
    if (v.status === 'fulfilled') setVisits(v.value);
    if (t.status === 'fulfilled') setTasks(t.value);
    if (a.status === 'fulfilled') setAlertas(a.value ?? []);
  }, [esAdmin]);

  useEffect(() => { load(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleComplete = async (id) => {
    try {
      await viernesApi.toggleTaskComplete(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch {}
  };

  const fmt = (n) => (n == null ? '—' : n.toLocaleString('es-MX'));

  return (
    <Screen scroll onRefresh={onRefresh} refreshing={refreshing}>
      {/* Alerta inventario */}
      {alertas.length > 0 && (
        <TouchableOpacity
          style={styles.alertaBanner}
          onPress={() => router.push('/(app)/inventario')}
          activeOpacity={0.8}
        >
          <Text style={styles.alertaText}>
            ⚠ Stock bajo — {alertas.length} {alertas.length === 1 ? 'material' : 'materiales'}
          </Text>
          <Text style={styles.alertaLink}>Ver →</Text>
        </TouchableOpacity>
      )}

      {/* Visitas — solo admin */}
      {esAdmin && (
        <>
          <Text style={styles.sectionTitle}>Visitas al sitio web</Text>
          <View style={styles.grid2}>
            <GradientCard label="Total histórico" value={fmt(visits?.total)}        accent="#5b21b6" />
            <GradientCard label="Últimos 30 días" value={fmt(visits?.last_30_days)} accent="#0e7490" />
          </View>
          <View style={[styles.grid2, { marginTop: spacing.sm }]}>
            <StatCard label="Esta semana" value={fmt(visits?.last_7_days)} />
            <StatCard label="Hoy"         value={fmt(visits?.today)} />
          </View>
        </>
      )}

      {/* Tareas pendientes */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.cardTitle}>Tareas pendientes</Text>
            {tasks.length > 0 && (
              <Text style={styles.cardSub}>{tasks.length} pendiente{tasks.length !== 1 ? 's' : ''}</Text>
            )}
          </View>
          <TouchableOpacity onPress={() => router.push('/(app)/tareas')} activeOpacity={0.7}>
            <Text style={styles.seeAll}>Ver todas →</Text>
          </TouchableOpacity>
        </View>
        {tasks.length === 0 ? (
          <Text style={styles.empty}>Todo al día ✓</Text>
        ) : (
          tasks.slice(0, 5).map((t) => (
            <TaskItem key={t.id} task={t} onComplete={handleComplete} />
          ))
        )}
      </View>
    </Screen>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  sectionTitle:    { color: colors.text4, fontSize: typography.xs, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.sm, marginTop: spacing.md },
  grid2:           { flexDirection: 'row', gap: spacing.sm },
  gradCard:        { flex: 1, borderRadius: radius.lg, padding: spacing.lg },
  gradLabel:       { color: 'rgba(255,255,255,0.7)', fontSize: typography.xs, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: spacing.sm },
  gradValue:       { color: '#fff', fontSize: typography.xxxl, fontWeight: '700' },
  statCard:        { flex: 1, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
  statLabel:       { color: colors.text3, fontSize: typography.xs },
  statValue:       { color: colors.text, fontSize: typography.xxl, fontWeight: '700', marginTop: 4 },
  alertaBanner:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.yellowBg, borderWidth: 1, borderColor: '#f59e0b44', borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md },
  alertaText:      { color: colors.yellow, fontSize: typography.sm, fontWeight: '600', flex: 1 },
  alertaLink:      { color: colors.yellow, fontSize: typography.sm },
  card:            { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, marginTop: spacing.md },
  cardHeader:      { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: spacing.md },
  cardTitle:       { color: colors.text, fontSize: typography.base, fontWeight: '600' },
  cardSub:         { color: colors.text3, fontSize: typography.xs, marginTop: 2 },
  seeAll:          { color: colors.text4, fontSize: typography.xs },
  empty:           { color: colors.text4, fontSize: typography.sm, textAlign: 'center', paddingVertical: spacing.lg },
  taskRow:         { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm, paddingHorizontal: spacing.sm, backgroundColor: colors.hover, borderRadius: radius.md, marginBottom: 6 },
  taskCircle:      { width: 16, height: 16, borderRadius: radius.full, borderWidth: 2, borderColor: colors.borderMed },
  taskTitle:       { flex: 1, color: colors.text2, fontSize: typography.xs },
  taskBadge:       { paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.sm },
  taskBadgeText:   { fontSize: 10, fontWeight: '600' },
});
