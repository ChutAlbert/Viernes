import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { Screen } from '../../components/Screen';
import { viernesApi } from '../../lib/api/viernes';
import { useTheme, useStyles, typography, spacing, radius } from '../../lib/theme';

function SessionItem({ session, active, onPress }) {
  const styles = useStyles(makeStyles);
  return (
    <TouchableOpacity
      style={[styles.sessionItem, active && styles.sessionItemActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.sessionTitle, active && styles.sessionTitleActive]} numberOfLines={1}>
        {session.title || `Chat ${session.id}`}
      </Text>
    </TouchableOpacity>
  );
}

function Message({ msg }) {
  const styles = useStyles(makeStyles);
  const isUser = msg.role === 'user';
  return (
    <View style={[styles.msgRow, isUser && styles.msgRowUser]}>
      <View style={[styles.msgBubble, isUser ? styles.msgUser : styles.msgAI]}>
        <Text style={[styles.msgText, isUser && styles.msgTextUser]}>{msg.content}</Text>
      </View>
    </View>
  );
}

export default function ChatScreen() {
  const { colors } = useTheme();
  const styles = useStyles(makeStyles);
  const [sessions, setSessions]       = useState([]);
  const [sessionId, setSessionId]     = useState(null);
  const [messages, setMessages]       = useState([]);
  const [input, setInput]             = useState('');
  const [sending, setSending]         = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const flatRef = useRef(null);

  useEffect(() => {
    viernesApi.listSessions()
      .then((data) => {
        setSessions(data);
        if (data.length > 0) selectSession(data[0].id);
      })
      .catch(() => {});
  }, []);

  const selectSession = useCallback(async (id) => {
    setSessionId(id);
    setLoadingMsgs(true);
    try {
      const msgs = await viernesApi.getMessages(id);
      setMessages(msgs);
    } catch {} finally {
      setLoadingMsgs(false);
    }
  }, []);

  const newSession = async () => {
    try {
      const s = await viernesApi.createSession();
      setSessions((prev) => [s, ...prev]);
      setSessionId(s.id);
      setMessages([]);
    } catch {}
  };

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    let sid = sessionId;
    if (!sid) {
      try {
        const s = await viernesApi.createSession();
        setSessions((prev) => [s, ...prev]);
        sid = s.id;
        setSessionId(sid);
      } catch { return; }
    }
    setInput('');
    const userMsg = { id: Date.now(), role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setSending(true);
    try {
      const res = await viernesApi.sendMessage({ message: text, session_id: sid });
      const aiMsg = { id: Date.now() + 1, role: 'assistant', content: res.response || res.content || res.message || '' };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (e) {
      const errMsg = { id: Date.now() + 1, role: 'assistant', content: `Error: ${e.message}` };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    if (messages.length > 0) flatRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      {/* Session list */}
      <View style={styles.sessionBar}>
        <FlatList
          data={sessions}
          horizontal
          keyExtractor={(s) => String(s.id)}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm }}
          renderItem={({ item }) => (
            <SessionItem
              session={item}
              active={item.id === sessionId}
              onPress={() => selectSession(item.id)}
            />
          )}
          ListHeaderComponent={
            <TouchableOpacity style={styles.newBtn} onPress={newSession} activeOpacity={0.7}>
              <Text style={styles.newBtnText}>+ Nuevo</Text>
            </TouchableOpacity>
          }
        />
      </View>

      {/* Messages */}
      {loadingMsgs ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accentText} />
        </View>
      ) : (
        <FlatList
          ref={flatRef}
          data={messages}
          keyExtractor={(m) => String(m.id)}
          contentContainerStyle={styles.msgList}
          renderItem={({ item }) => <Message msg={item} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>Escribe tu primera pregunta</Text>
            </View>
          }
        />
      )}

      {/* Input */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.textInput}
          value={input}
          onChangeText={setInput}
          placeholder="Escribe un mensaje…"
          placeholderTextColor={colors.text4}
          multiline
          maxLength={2000}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!input.trim() || sending) && styles.sendBtnDisabled]}
          onPress={send}
          disabled={!input.trim() || sending}
          activeOpacity={0.8}
        >
          {sending
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={styles.sendIcon}>↑</Text>
          }
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  sessionBar:       { borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.shell },
  sessionItem:      { paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.full, backgroundColor: colors.hover, maxWidth: 140 },
  sessionItemActive:{ backgroundColor: colors.accentBg, borderWidth: 1, borderColor: colors.accent },
  sessionTitle:     { color: colors.text3, fontSize: typography.xs },
  sessionTitleActive:{ color: colors.accentText },
  newBtn:           { paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.full, borderWidth: 1, borderColor: colors.borderMed },
  newBtnText:       { color: colors.accentText, fontSize: typography.xs, fontWeight: '600' },
  center:           { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  emptyText:        { color: colors.text4, fontSize: typography.sm },
  msgList:          { flexGrow: 1, padding: spacing.md, gap: spacing.md },
  msgRow:           { flexDirection: 'row' },
  msgRowUser:       { justifyContent: 'flex-end' },
  msgBubble:        { maxWidth: '80%', padding: spacing.md, borderRadius: radius.lg },
  msgUser:          { backgroundColor: colors.accent },
  msgAI:            { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  msgText:          { color: colors.text2, fontSize: typography.sm, lineHeight: 20 },
  msgTextUser:      { color: '#fff' },
  inputRow:         { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.shell },
  textInput:        { flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderMed, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, color: colors.text, fontSize: typography.base, maxHeight: 120 },
  sendBtn:          { width: 40, height: 40, borderRadius: radius.full, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled:  { opacity: 0.4 },
  sendIcon:         { color: '#fff', fontSize: typography.lg, fontWeight: '700' },
});
