import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Image } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { logoutThunk } from '../store/slices/authSlice';
import { useTheme, useStyles, THEMES, typography, spacing, radius } from '../lib/theme';

// Workspace accent colors are identity colors — fixed across themes.
const WORKSPACES = [
  {
    key: 'viernes', label: 'Viernes', color: '#7c3aed',
    sub: 'Tu asistente y centro de mando.',
    items: [
      { route: '/(app)/',      label: 'Overview',    key: 'overview' },
      { route: '/(app)/chat',  label: 'Chat IA',     key: 'chat' },
      { route: '/(app)/gmail', label: 'Gmail',       key: 'gmail' },
      { route: '/(app)/docs',  label: 'Documentos',  key: 'docs' },
    ],
  },
  {
    key: 'personal', label: 'Personal', color: '#22d3ee',
    sub: 'Tu día a día: tareas, notas y utilidades.',
    items: [
      { route: '/(app)/tareas',    label: 'Tareas',       key: 'tareas' },
      { route: '/(app)/notas',     label: 'Notas',        key: 'notas' },
      { group: 'Utilidades' },
      { route: '/(app)/qr',        label: 'Generador QR', key: 'qr' },
      { route: '/(app)/passwords', label: 'Contraseñas',  key: 'passwords' },
    ],
  },
  {
    key: 'sodigic', label: 'Sodigic', color: '#f59e0b',
    sub: 'El negocio: catálogo, producción y web.',
    items: [
      { route: '/(app)/website',    label: 'Website',    key: 'website' },
      { route: '/(app)/piezas',     label: 'Piezas',     key: 'piezas' },
      { route: '/(app)/filamentos', label: 'Filamentos', key: 'filamentos' },
      { route: '/(app)/inventario', label: 'Inventario', key: 'inventario' },
      { route: '/(app)/contactos',  label: 'Contactos',  key: 'website' },
    ],
  },
  {
    key: 'admin', label: 'Admin', color: '#10b981', adminOnly: true,
    sub: 'Gestión del sistema y accesos.',
    items: [
      { route: '/(app)/usuarios', label: 'Usuarios', key: 'usuarios', roles: ['super_admin'] },
    ],
  },
];

// El espacio Admin lo ve solo el super_admin (el dueno), no todo admin.
function isAdminUser(user) {
  return user?.role === 'super_admin';
}

function canAccess(key, user) {
  if (!user) return false;
  if (isAdminUser(user)) return true;
  if (!user.permissions) return true;
  return user.permissions[key] !== false;
}

function visibleItems(ws, user) {
  return ws.items.filter((it) =>
    it.group || ((!it.roles || it.roles.includes(user?.role)) && canAccess(it.key, user))
  );
}

function visibleWorkspaces(user) {
  return WORKSPACES.filter((ws) => {
    if (ws.adminOnly && !isAdminUser(user)) return false;
    return visibleItems(ws, user).some((it) => !it.group);
  });
}

// usePathname() de expo-router devuelve la ruta SIN el grupo: /website, no
// /(app)/website. Normalizamos ambos lados para que comparen igual.
function sinGrupos(p) {
  return (p || '').replace(/\/\([^)]*\)/g, '') || '/';
}

function isActiveRoute(route, pathname) {
  const r = sinGrupos(route);
  const actual = sinGrupos(pathname);
  if (r === '/') return actual === '/' || actual === '/index';
  return actual === r || actual.startsWith(r + '/');
}

function getInitials(name, email) {
  const src = name || email || '?';
  return src.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

export default function DrawerContent() {
  const router   = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch();
  const user     = useSelector((s) => s.auth.user);
  const { colors, theme, setTheme } = useTheme();
  const styles = useStyles(makeStyles);

  const spaces = visibleWorkspaces(user);
  const insets = useSafeAreaInsets();

  const isAdmin = isAdminUser(user);
  const initials = getInitials(user?.name, user?.email);
  const displayName = user?.name || user?.email || 'Usuario';
  const displayRole = isAdmin ? 'Admin' : 'Usuario';

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Image source={require('../assets/logo.png')} style={styles.logo} resizeMode="contain" />
        <Text style={styles.brandName}>Viernes</Text>
      </View>

      {/* Todos los espacios en un solo scroll: con pestañas quedaban ocultos */}
      <ScrollView style={styles.nav} showsVerticalScrollIndicator={false}>
        {spaces.map((ws) => (
          <View key={ws.key} style={styles.space}>
            <View style={styles.spaceTitleRow}>
              <View style={[styles.spaceChip, { backgroundColor: ws.color }]} />
              <Text style={[styles.spaceTitle, { color: ws.color }]}>{ws.label}</Text>
            </View>

            {visibleItems(ws, user).map((it, i) => {
              if (it.group) return <Text key={`g-${ws.key}-${i}`} style={styles.groupLabel}>{it.group}</Text>;
              const active = isActiveRoute(it.route, pathname);
              return (
                <TouchableOpacity
                  key={it.route}
                  style={[styles.navItem, active && styles.navItemActive]}
                  onPress={() => router.push(it.route)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.activeBar, { backgroundColor: ws.color, opacity: active ? 1 : 0 }]} />
                  <Text style={[styles.navLabel, active && styles.navLabelActive]}>{it.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </ScrollView>

      {/* Theme picker */}
      <View style={styles.themeWrap}>
        <Text style={styles.themeLabel}>Tema</Text>
        <View style={styles.themeRow}>
          {THEMES.map((t) => {
            const on = t.key === theme;
            return (
              <TouchableOpacity
                key={t.key}
                onPress={() => setTheme(t.key)}
                activeOpacity={0.7}
                style={[styles.swatch, { backgroundColor: t.swatch[0], borderColor: on ? colors.accentText : colors.borderMed, borderWidth: on ? 2 : 1 }]}
                accessibilityLabel={`Tema ${t.label}`}
              >
                <View style={[styles.swatchAccent, { backgroundColor: t.swatch[1] }]} />
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.userCard}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View>
          <View style={styles.userInfo}>
            <Text style={styles.userName} numberOfLines={1}>{displayName}</Text>
            <Text style={styles.userRole}>{displayRole}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={() => dispatch(logoutThunk())} activeOpacity={0.7}>
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  root:          { flex: 1, backgroundColor: colors.shell },
  header:        { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: spacing.lg, paddingVertical: spacing.xl, borderBottomWidth: 1, borderBottomColor: colors.border },
  logo:          { width: 30, height: 30 },
  space:         { marginBottom: spacing.lg },
  brandName:     { color: colors.text, fontWeight: '600', fontSize: typography.base, letterSpacing: 0.5 },


  spaceHead:     { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm },
  spaceTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 3 },
  spaceChip:     { width: 10, height: 10, borderRadius: 3 },
  spaceTitle:    { color: colors.text, fontSize: typography.lg, fontWeight: '700' },

  nav:           { flex: 1, paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  groupLabel:    { color: colors.text4, fontSize: typography.xs, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1.2, paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.xs },
  navItem:       { flexDirection: 'row', alignItems: 'center', paddingVertical: 9, paddingHorizontal: spacing.md, borderRadius: radius.md, marginBottom: 2 },
  navItemActive: { backgroundColor: colors.hover },
  activeBar:     { width: 2, height: 16, borderRadius: 1, marginRight: spacing.sm },
  navLabel:      { color: colors.text3, fontSize: typography.sm, fontWeight: '500', marginLeft: 2 },
  navLabelActive:{ color: colors.text },

  themeWrap:     { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  themeLabel:    { color: colors.text4, fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1.4, marginBottom: spacing.sm },
  themeRow:      { flexDirection: 'row', gap: spacing.sm },
  swatch:        { width: 30, height: 30, borderRadius: radius.sm, overflow: 'hidden', justifyContent: 'flex-end', alignItems: 'flex-end' },
  swatchAccent:  { width: '55%', height: '55%', borderTopLeftRadius: 4 },

  footer:        { padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, gap: spacing.sm },
  userCard:      { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.hover },
  avatar:        { width: 32, height: 32, borderRadius: radius.full, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  avatarText:    { color: '#fff', fontWeight: '700', fontSize: typography.xs },
  userInfo:      { flex: 1 },
  userName:      { color: colors.text2, fontSize: typography.xs, fontWeight: '500' },
  userRole:      { color: colors.text4, fontSize: 10, marginTop: 1 },
  logoutBtn:     { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radius.md, alignItems: 'center' },
  logoutText:    { color: colors.text3, fontSize: typography.sm, fontWeight: '500' },
});
