import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { loginThunk } from '../store/slices/authSlice';
import { colors, typography, spacing, radius } from '../lib/theme';

export default function LoginScreen() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch();
  const { loading, error } = useSelector((s) => s.auth);

  const handleLogin = () => {
    if (!email.trim() || !password.trim()) return;
    dispatch(loginThunk({ email: email.trim(), password }));
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>
        {/* Logo */}
        <View style={styles.logoWrap}>
          <View style={styles.logo}>
            <Text style={styles.logoLetter}>V</Text>
          </View>
          <Text style={styles.brand}>Viernes</Text>
          <Text style={styles.subtitle}>Inicia sesión para continuar</Text>
        </View>

        {/* Fields */}
        <View style={styles.fields}>
          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Correo</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoCorrect={false}
              placeholderTextColor={colors.text4}
              placeholder="correo@ejemplo.com"
            />
          </View>
          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Contraseña</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholderTextColor={colors.text4}
              placeholder="••••••••"
              onSubmitEditing={handleLogin}
              returnKeyType="done"
            />
          </View>
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={styles.btnText}>Entrar</Text>
          }
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root:       { flex: 1, backgroundColor: colors.bg, justifyContent: 'center', padding: spacing.xl },
  card:       { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.xl, borderWidth: 1, borderColor: colors.border },
  logoWrap:   { alignItems: 'center', marginBottom: spacing.xxl },
  logo:       { width: 56, height: 56, borderRadius: radius.lg, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  logoLetter: { color: '#fff', fontSize: typography.xxl, fontWeight: '700' },
  brand:      { color: colors.text, fontSize: typography.xl, fontWeight: '700', letterSpacing: 0.5 },
  subtitle:   { color: colors.text3, fontSize: typography.sm, marginTop: 4 },
  fields:     { gap: spacing.md, marginBottom: spacing.lg },
  fieldWrap:  { gap: 6 },
  label:      { color: colors.text3, fontSize: typography.xs, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8 },
  input:      { backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.borderMed, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.md, color: colors.text, fontSize: typography.base },
  error:      { color: colors.red, fontSize: typography.sm, marginBottom: spacing.md, textAlign: 'center' },
  btn:        { backgroundColor: colors.accent, borderRadius: radius.md, paddingVertical: 14, alignItems: 'center' },
  btnDisabled:{ opacity: 0.6 },
  btnText:    { color: '#fff', fontSize: typography.base, fontWeight: '600' },
});
