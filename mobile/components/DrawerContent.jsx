import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { logoutThunk } from '../store/slices/authSlice';
import { colors, typography, spacing, radius } from '../lib/theme';

const GROUPS = [
  {
    key: 'viernes',
    label: 'Viernes',
    items: [
      { route: '/(app)/chat',       label: 'Chat IA',     key: 'chat' },
      { route: '/(app)/gmail',      label: 'Gmail',       key: 'gmail' },
      { route: '/(app)/docs',       label: 'Documentos',  key: 'docs' },
    ],
  },
  {
    key: 'agenda',
    label: 'Agenda',
    items: [
      { route: '/(app)/tareas',     label: 'Tareas',      key: 'tareas' },
      { route: '/(app)/notas',      label: 'Notas',       key: 'notas' },
    ],
  },
  {
    key: 'sodigic',
    label: 'Sodigic',
    items: [
      { route: '/(app)/website',    label: 'Website',        key: 'website' },
      { route: '/(app)/catalogo',   label: 'Catálogo',       key: 'catalogo' },
      { route: '/(app)/piezas',     label: 'Piezas 3D',      key: 'piezas' },
      { route: '/(app)/inventario', label: 'Inventario',     key: 'inventario' },
      { route: '/(app)/redes',      label: 'Redes Sociales', key: 'redes' },
    ],
  },
  {
    key: 'funciones',
    label: 'Funciones',
    items: [
      { route: '/(app)/qr',        label: 'Generador QR', key: 'qr' },
      { route: '/(app)/passwords', label: 'Contraseñas',  key: 'passwords' },
    ],
  },
];

const ADMIN_GROUP = {
  key: 'admin',
  label: 'Administración',
  items: [
    { route: '/(app)/usuarios', label: 'Usuarios', key: 'usuarios', roles: ['admin', 'super_admin'] },
  ],
};

function canAccess(key, user) {
  if (!user) return false;
  if (user.role === 'admin' || user.role === 'super_admin') return true;
  if (!user.permissions) return true;
  return user.permissions[key] !== false;
}

function getInitials(name, email) {
  const src = name || email || '?';
  return src.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

function Chevron({ open }) {
  return (
    <Text style={{ color: colors.text4, fontSize: 10, transform: [{ rotate: open ? '0deg' : '-90deg' }] }}>
      ▼
    </Text>
  );
}

function NavGroup({ group, user, pathname, onNavigate, open, onToggle }) {
  const visibleItems = group.items.filter((item) =>
    (!item.roles || item.roles.includes(user?.role)) && canAccess(item.key, user)
  );
  if (visibleItems.length === 0) return null;

  return (
    <View style={styles.group}>
      <TouchableOpacity style={styles.groupHeader} onPress={onToggle} activeOpacity={0.7}>
        <Text style={styles.groupLabel}>{group.label}</Text>
        <Chevron open={open} />
      </TouchableOpacity>
      {open && visibleItems.map((item) => {
        const isActive = pathname === item.route || pathname.startsWith(item.route + '/');
        return (
          <TouchableOpacity
            key={item.route}
            style={[styles.navItem, isActive && styles.navItemActive]}
            onPress={() => onNavigate(item.route)}
            activeOpacity={0.7}
          >
            <View style={[styles.activeBar, { opacity: isActive ? 1 : 0 }]} />
            <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>{item.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function DrawerContent() {
  const router   = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch();
  const user     = useSelector((s) => s.auth.user);

  const allKeys = [...GROUPS.map((g) => g.key), 'admin'];
  const [open, setOpen] = useState(new Set(allKeys));

  const toggle = (key) => setOpen((prev) => {
    const next = new Set(prev);
    next.has(key) ? next.delete(key) : next.add(key);
    return next;
  });

  const navigate = (route) => router.push(route);

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const initials = getInitials(user?.name, user?.email);
  const displayName = user?.name || user?.email || 'Usuario';
  const displayRole = isAdmin ? 'Admin' : 'Usuario';

  const isHomeActive = pathname === '/(app)' || pathname === '/(app)/index' || pathname === '/';

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>V</Text>
        </View>
        <Text style={styles.brandName}>Viernes</Text>
      </View>

      <ScrollView style={styles.nav} showsVerticalScrollIndicator={false}>
        {/* Home solo */}
        <View style={styles.group}>
          <TouchableOpacity
            style={[styles.navItem, isHomeActive && styles.navItemActive]}
            onPress={() => navigate('/(app)/')}
            activeOpacity={0.7}
          >
            <View style={[styles.activeBar, { opacity: isHomeActive ? 1 : 0 }]} />
            <Text style={[styles.navLabel, isHomeActive && styles.navLabelActive]}>Overview</Text>
          </TouchableOpacity>
        </View>

        {/* Grouped sections */}
        {GROUPS.map((group) => (
          <NavGroup
            key={group.key}
            group={group}
            user={user}
            pathname={pathname}
            onNavigate={navigate}
            open={open.has(group.key)}
            onToggle={() => toggle(group.key)}
          />
        ))}

        {/* Admin group */}
        {isAdmin && (
          <NavGroup
            group={ADMIN_GROUP}
            user={user}
            pathname={pathname}
            onNavigate={navigate}
            open={open.has('admin')}
            onToggle={() => toggle('admin')}
          />
        )}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName} numberOfLines={1}>{displayName}</Text>
            <Text style={styles.userRole}>{displayRole}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => dispatch(logoutThunk())}
          activeOpacity={0.7}
        >
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root:          { flex: 1, backgroundColor: colors.shell },
  header:        { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: spacing.lg, paddingVertical: spacing.xl, borderBottomWidth: 1, borderBottomColor: colors.border },
  logo:          { width: 30, height: 30, borderRadius: radius.sm, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  logoText:      { color: '#fff', fontWeight: '700', fontSize: typography.base },
  brandName:     { color: colors.text, fontWeight: '600', fontSize: typography.base, letterSpacing: 0.5 },
  nav:           { flex: 1, paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  group:         { marginBottom: spacing.md },
  groupHeader:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.sm },
  groupLabel:    { color: colors.text4, fontSize: typography.xs, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1.2 },
  navItem:       { flexDirection: 'row', alignItems: 'center', paddingVertical: 9, paddingHorizontal: spacing.md, borderRadius: radius.md, marginBottom: 2 },
  navItemActive: { backgroundColor: colors.hover },
  activeBar:     { width: 2, height: 16, backgroundColor: colors.accent, borderRadius: 1, marginRight: spacing.sm },
  navLabel:      { color: colors.text3, fontSize: typography.sm, fontWeight: '500', marginLeft: 2 },
  navLabelActive:{ color: colors.text },
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
