import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useTheme, useStyles, typography, spacing, radius } from '../../lib/theme';

const PRESETS = [
  { label: 'URL', value: 'https://sodigic.com' },
  { label: 'Email', value: 'mailto:contacto@sodigic.com' },
  { label: 'Tel', value: 'tel:+521234567890' },
  { label: 'WhatsApp', value: 'https://wa.me/521234567890' },
];

export default function QRScreen() {
  const { colors } = useTheme();
  const styles = useStyles(makeStyles);
  const [text, setText]   = useState('');
  const [qr, setQr]       = useState('');
  const [size, setSize]   = useState(220);

  const generate = () => {
    const val = text.trim();
    if (!val) return;
    setQr(val);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Presets */}
        <Text style={styles.sectionLabel}>Plantillas rápidas</Text>
        <View style={styles.presets}>
          {PRESETS.map((p) => (
            <TouchableOpacity
              key={p.label}
              style={styles.preset}
              onPress={() => setText(p.value)}
              activeOpacity={0.7}
            >
              <Text style={styles.presetText}>{p.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Input */}
        <Text style={styles.sectionLabel}>Contenido del QR</Text>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="URL, texto, número de teléfono…"
          placeholderTextColor={colors.text4}
          multiline
          autoCapitalize="none"
          autoCorrect={false}
        />

        {/* Size */}
        <Text style={styles.sectionLabel}>Tamaño: {size}px</Text>
        <View style={styles.sizeRow}>
          {[180, 220, 280, 340].map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.sizeBtn, size === s && styles.sizeBtnActive]}
              onPress={() => setSize(s)}
              activeOpacity={0.7}
            >
              <Text style={[styles.sizeBtnText, size === s && styles.sizeBtnTextActive]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.btn, !text.trim() && styles.btnDisabled]}
          onPress={generate}
          disabled={!text.trim()}
          activeOpacity={0.85}
        >
          <Text style={styles.btnText}>Generar QR</Text>
        </TouchableOpacity>

        {/* QR Result */}
        {qr ? (
          <View style={styles.qrCard}>
            <QRCode
              value={qr}
              size={size}
              backgroundColor="transparent"
              color={colors.text}
            />
            <Text style={styles.qrValue} numberOfLines={2}>{qr}</Text>
          </View>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container:      { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  sectionLabel:   { color: colors.text4, fontSize: typography.xs, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  presets:        { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  preset:         { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.full, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  presetText:     { color: colors.text3, fontSize: typography.xs, fontWeight: '500' },
  input:          { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderMed, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.md, color: colors.text, fontSize: typography.base, minHeight: 80, textAlignVertical: 'top' },
  sizeRow:        { flexDirection: 'row', gap: spacing.sm },
  sizeBtn:        { flex: 1, paddingVertical: spacing.sm, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  sizeBtnActive:  { backgroundColor: colors.accentBg, borderColor: colors.accent },
  sizeBtnText:    { color: colors.text3, fontSize: typography.xs, fontWeight: '600' },
  sizeBtnTextActive:{ color: colors.accentText },
  btn:            { backgroundColor: colors.accent, borderRadius: radius.md, paddingVertical: 14, alignItems: 'center' },
  btnDisabled:    { opacity: 0.4 },
  btnText:        { color: '#fff', fontSize: typography.base, fontWeight: '600' },
  qrCard:         { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.xl, alignItems: 'center', gap: spacing.md, borderWidth: 1, borderColor: colors.border, marginTop: spacing.md },
  qrValue:        { color: colors.text4, fontSize: typography.xs, textAlign: 'center' },
});
