import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Image, Alert,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loginThunk, restoreAuthThunk } from '../store/slices/authSlice';
import { TOKEN_KEY } from '../lib/api/client';
import * as bio from '../lib/biometria';
import { useTheme, useStyles, typography, spacing, radius } from '../lib/theme';

function Huella({ color, size = 26 }) {
  return (
    <Text style={{ fontSize: size, color, lineHeight: size + 4 }}>☝</Text>
  );
}

export default function LoginScreen() {
  const { colors } = useTheme();
  const styles = useStyles(makeStyles);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verPass, setVerPass] = useState(false);
  const [huellaLista, setHuellaLista] = useState(false);
  const dispatch = useDispatch();
  const { loading, error, token } = useSelector((s) => s.auth);

  // Solo ofrecemos huella si el aparato la tiene, el usuario la activó
  // y hay una sesión guardada que desbloquear.
  useEffect(() => {
    (async () => {
      const hay = await AsyncStorage.getItem(TOKEN_KEY);
      setHuellaLista(!!hay && (await bio.disponible()) && (await bio.activada()));
    })();
  }, []);

  const entrarConHuella = async () => {
    if (await bio.pedir('Entra a Viernes')) dispatch(restoreAuthThunk());
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) return;
    const r = await dispatch(loginThunk({ email: email.trim(), password }));
    if (r.meta.requestStatus !== 'fulfilled') return;
    // Ya dentro: ofrecer la huella para la próxima vez
    if ((await bio.disponible()) && !(await bio.activada())) {
      Alert.alert(
        'Entrar con huella',
        '¿Quieres usar tu huella la próxima vez en lugar de la contraseña?',
        [
          { text: 'Ahora no', style: 'cancel' },
          { text: 'Activar', onPress: () => bio.activar() },
        ],
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoWrap}>
          <Image source={require('../assets/logo.png')} style={styles.logo} resizeMode="contain" />
          <Text style={styles.brand}>Viernes</Text>
          <Text style={styles.subtitle}>Inicia sesión para continuar</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Correo</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              autoCorrect={false}
              placeholderTextColor={colors.text4}
              placeholder="correo@ejemplo.com"
            />
          </View>

          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Contraseña</Text>
            <View style={styles.passRow}>
              <TextInput
                style={[styles.input, styles.passInput]}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!verPass}
                placeholderTextColor={colors.text4}
                placeholder="••••••••"
                onSubmitEditing={handleLogin}
                returnKeyType="done"
              />
              <TouchableOpacity
                style={styles.verBtn}
                onPress={() => setVerPass((v) => !v)}
                hitSlop={8}
              >
                <Text style={styles.verTexto}>{verPass ? 'Ocultar' : 'Ver'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.btnText}>Entrar</Text>}
          </TouchableOpacity>

          {huellaLista && !token ? (
            <>
              <View style={styles.separador}>
                <View style={styles.linea} />
                <Text style={styles.separadorTexto}>o</Text>
                <View style={styles.linea} />
              </View>

              <TouchableOpacity style={styles.huellaBtn} onPress={entrarConHuella} activeOpacity={0.8}>
                <Huella color={colors.accentText} />
                <Text style={styles.huellaTexto}>Entrar con huella</Text>
              </TouchableOpacity>
            </>
          ) : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: spacing.xl },

  logoWrap: { alignItems: 'center', marginBottom: spacing.xl },
  logo: { width: 64, height: 64, marginBottom: spacing.md },
  brand: { color: colors.text, fontSize: typography.xxl, fontWeight: '700', letterSpacing: 0.5 },
  subtitle: { color: colors.text3, fontSize: typography.sm, marginTop: 4 },

  card: {
    backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.xl,
    borderWidth: 1, borderColor: colors.border, gap: spacing.md,
  },
  fieldWrap: { gap: 6 },
  label: { color: colors.text3, fontSize: typography.xs, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8 },
  input: {
    backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.borderMed,
    borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.md,
    color: colors.text, fontSize: typography.base,
  },
  passRow: { position: 'relative', justifyContent: 'center' },
  passInput: { paddingRight: 72 },
  verBtn: { position: 'absolute', right: spacing.md },
  verTexto: { color: colors.accentText, fontSize: typography.xs, fontWeight: '600' },

  error: { color: colors.red, fontSize: typography.sm, textAlign: 'center' },

  btn: { backgroundColor: colors.accent, borderRadius: radius.md, paddingVertical: 14, alignItems: 'center' },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: typography.base, fontWeight: '600' },

  separador: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  linea: { flex: 1, height: 1, backgroundColor: colors.border },
  separadorTexto: { color: colors.text4, fontSize: typography.xs },

  huellaBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    borderWidth: 1, borderColor: colors.borderMed, borderRadius: radius.md, paddingVertical: 12,
  },
  huellaTexto: { color: colors.text2, fontSize: typography.base, fontWeight: '600' },
});
