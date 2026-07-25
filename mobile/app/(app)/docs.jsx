import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, FlatList, StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { Screen } from '../../components/Screen';
import { viernesApi } from '../../lib/api/viernes';
import { useTheme, useStyles, typography, spacing, radius } from '../../lib/theme';

const EXT_COLOR = {
  pdf:  '#ef4444', docx: '#3b82f6', doc: '#3b82f6',
  xlsx: '#22c55e', txt: '#94a3b8', png: '#f59e0b',
  jpg:  '#f59e0b', jpeg: '#f59e0b', mp3: '#a78bfa',
};

function DocRow({ doc, onDelete }) {
  const { colors } = useTheme();
  const styles = useStyles(makeStyles);
  const ext  = doc.filename?.split('.').pop()?.toLowerCase() || '?';
  const color = EXT_COLOR[ext] || colors.text4;
  const date = doc.uploaded_at
    ? new Date(doc.uploaded_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
    : '';
  const size = doc.size ? `${(doc.size / 1024).toFixed(0)} KB` : '';

  return (
    <View style={styles.row}>
      <View style={[styles.extBadge, { backgroundColor: color + '22', borderColor: color + '44' }]}>
        <Text style={[styles.extText, { color }]}>{ext.toUpperCase()}</Text>
      </View>
      <View style={styles.rowMid}>
        <Text style={styles.filename} numberOfLines={1}>{doc.filename}</Text>
        <Text style={styles.meta}>{[date, size].filter(Boolean).join(' · ')}</Text>
      </View>
      <TouchableOpacity onPress={() => onDelete(doc.filename)} activeOpacity={0.7}>
        <Text style={styles.del}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function DocsScreen() {
  const { colors } = useTheme();
  const styles = useStyles(makeStyles);
  const [docs, setDocs]           = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading]     = useState(true);

  const load = useCallback(() =>
    viernesApi.listDocuments().then((d) => { setDocs(d); setLoading(false); }).catch(() => setLoading(false)),
  []);

  useEffect(() => { load(); }, []);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleDelete = (filename) => {
    Alert.alert('Eliminar documento', `¿Eliminar "${filename}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
        try { await viernesApi.deleteDocument(filename); setDocs((prev) => prev.filter((d) => d.filename !== filename)); } catch {}
      }},
    ]);
  };

  return (
    <Screen padded={false}>
      {loading ? (
        <View style={styles.center}><ActivityIndicator color={colors.accentText} /></View>
      ) : (
        <FlatList
          data={docs}
          keyExtractor={(d, i) => d.filename || String(i)}
          onRefresh={onRefresh}
          refreshing={refreshing}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <DocRow doc={item} onDelete={handleDelete} />}
          ListHeaderComponent={
            <Text style={styles.hint}>Sube documentos desde el dashboard web para analizarlos con el Chat IA</Text>
          }
          ListEmptyComponent={<Text style={styles.empty}>Sin documentos</Text>}
        />
      )}
    </Screen>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  list:     { padding: spacing.lg, gap: spacing.sm, paddingBottom: spacing.xxl },
  center:   { flex: 1, justifyContent: 'center', alignItems: 'center' },
  hint:     { color: colors.text4, fontSize: typography.xs, marginBottom: spacing.md, lineHeight: 18 },
  row:      { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  extBadge: { width: 40, height: 40, borderRadius: radius.sm, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  extText:  { fontSize: 10, fontWeight: '700' },
  rowMid:   { flex: 1 },
  filename: { color: colors.text, fontSize: typography.sm, fontWeight: '500' },
  meta:     { color: colors.text4, fontSize: 11, marginTop: 2 },
  del:      { color: colors.text4, fontSize: typography.base, padding: 4 },
  empty:    { color: colors.text4, textAlign: 'center', marginTop: spacing.xxl, fontSize: typography.base },
});
