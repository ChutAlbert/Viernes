import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, FlatList, StyleSheet,
  TextInput, ActivityIndicator, Modal, ScrollView,
} from 'react-native';
import { Screen } from '../../components/Screen';
import { viernesApi } from '../../lib/api/viernes';
import { useTheme, useStyles, typography, spacing, radius } from '../../lib/theme';

function EmailRow({ email, onPress }) {
  const styles = useStyles(makeStyles);
  const date = email.date
    ? new Date(email.date).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })
    : '';

  return (
    <TouchableOpacity style={[styles.row, !email.is_read && styles.rowUnread]} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.rowLeft}>
        {!email.is_read && <View style={styles.unreadDot} />}
        <View>
          <Text style={[styles.sender, !email.is_read && styles.senderBold]} numberOfLines={1}>
            {email.from_name || email.from_email || 'Desconocido'}
          </Text>
          <Text style={styles.subject} numberOfLines={1}>{email.subject || '(sin asunto)'}</Text>
          {email.snippet && <Text style={styles.snippet} numberOfLines={1}>{email.snippet}</Text>}
        </View>
      </View>
      <Text style={styles.date}>{date}</Text>
    </TouchableOpacity>
  );
}

function EmailModal({ email, visible, onClose }) {
  const { colors } = useTheme();
  const styles = useStyles(makeStyles);
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
            <Text style={styles.modalBack}>← Volver</Text>
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.emailBody}>
          <Text style={styles.emailSubject}>{email?.subject || '(sin asunto)'}</Text>
          <Text style={styles.emailFrom}>{email?.from_name} &lt;{email?.from_email}&gt;</Text>
          <Text style={styles.emailDate}>
            {email?.date ? new Date(email.date).toLocaleString('es-MX') : ''}
          </Text>
          <View style={styles.emailDivider} />
          <Text style={styles.emailContent}>{email?.body || email?.snippet || ''}</Text>
        </ScrollView>
      </View>
    </Modal>
  );
}

export default function GmailScreen() {
  const { colors } = useTheme();
  const styles = useStyles(makeStyles);
  const [emails, setEmails]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch]       = useState('');
  const [selected, setSelected]   = useState(null);
  const [status, setStatus]       = useState(null);

  const load = useCallback(async () => {
    const [s, inbox] = await Promise.allSettled([
      viernesApi.gmailStatus(),
      viernesApi.gmailInbox(30),
    ]);
    if (s.status === 'fulfilled') setStatus(s.value);
    if (inbox.status === 'fulfilled') setEmails(inbox.value?.emails || inbox.value || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, []);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleSearch = async () => {
    if (!search.trim()) return;
    setLoading(true);
    try {
      const res = await viernesApi.gmailSearch(search.trim());
      setEmails(res?.emails || res || []);
    } catch {} finally { setLoading(false); }
  };

  const openEmail = async (email) => {
    setSelected(email);
    if (!email.is_read) {
      viernesApi.gmailMarkRead(email.id).catch(() => {});
      setEmails((prev) => prev.map((e) => e.id === email.id ? { ...e, is_read: true } : e));
    }
  };

  if (!status?.authorized) {
    return (
      <Screen>
        <View style={styles.center}>
          <Text style={styles.warnTitle}>Gmail no conectado</Text>
          <Text style={styles.warnSub}>Configura Gmail OAuth desde el dashboard web.</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      {/* Search */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar emails…"
          placeholderTextColor={colors.text4}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => { setSearch(''); load(); }} activeOpacity={0.7}>
            <Text style={styles.clearSearch}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={colors.accentText} /></View>
      ) : (
        <FlatList
          data={emails}
          keyExtractor={(e) => String(e.id)}
          onRefresh={onRefresh}
          refreshing={refreshing}
          renderItem={({ item }) => <EmailRow email={item} onPress={() => openEmail(item)} />}
          ListEmptyComponent={<Text style={styles.empty}>Sin emails</Text>}
        />
      )}

      {selected && (
        <EmailModal
          email={selected}
          visible={!!selected}
          onClose={() => setSelected(null)}
        />
      )}
    </Screen>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  searchRow:     { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  searchInput:   { flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderMed, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, color: colors.text, fontSize: typography.sm },
  clearSearch:   { color: colors.text4, fontSize: typography.base, padding: 4 },
  center:        { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  row:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  rowUnread:     { backgroundColor: colors.hover },
  rowLeft:       { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  unreadDot:     { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accentText, marginTop: 4 },
  sender:        { color: colors.text3, fontSize: typography.sm },
  senderBold:    { color: colors.text, fontWeight: '600' },
  subject:       { color: colors.text2, fontSize: typography.xs, marginTop: 1 },
  snippet:       { color: colors.text4, fontSize: 11, marginTop: 1 },
  date:          { color: colors.text4, fontSize: 11, marginLeft: spacing.sm },
  empty:         { color: colors.text4, textAlign: 'center', marginTop: spacing.xxl, fontSize: typography.base },
  warnTitle:     { color: colors.yellow, fontSize: typography.lg, fontWeight: '600' },
  warnSub:       { color: colors.text3, fontSize: typography.sm, marginTop: spacing.sm, textAlign: 'center' },
  modalHeader:   { flexDirection: 'row', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalBack:     { color: colors.text3, fontSize: typography.base },
  emailBody:     { padding: spacing.lg, gap: spacing.sm },
  emailSubject:  { color: colors.text, fontSize: typography.lg, fontWeight: '600' },
  emailFrom:     { color: colors.text3, fontSize: typography.sm },
  emailDate:     { color: colors.text4, fontSize: typography.xs },
  emailDivider:  { height: 1, backgroundColor: colors.border, marginVertical: spacing.md },
  emailContent:  { color: colors.text2, fontSize: typography.base, lineHeight: 24 },
});
