import { Drawer } from 'expo-router/drawer';
import DrawerContent from '../../components/DrawerContent';
import { useTheme } from '../../lib/theme';

export default function AppLayout() {
  const { colors } = useTheme();

  const screenOptions = {
    headerStyle: {
      backgroundColor: colors.shell,
      shadowColor: 'transparent',
      elevation: 0,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTintColor: colors.text,
    headerTitleStyle: { color: colors.text, fontWeight: '600', fontSize: 16 },
    drawerStyle: { backgroundColor: colors.shell, width: 280 },
    drawerType: 'slide',
    overlayColor: 'rgba(0,0,0,0.6)',
  };

  return (
    <Drawer
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={screenOptions}
    >
      <Drawer.Screen name="index"      options={{ title: 'Overview' }} />
      <Drawer.Screen name="chat"       options={{ title: 'Chat IA' }} />
      <Drawer.Screen name="gmail"      options={{ title: 'Gmail' }} />
      <Drawer.Screen name="docs"       options={{ title: 'Documentos' }} />
      <Drawer.Screen name="tareas"     options={{ title: 'Tareas' }} />
      <Drawer.Screen name="notas"      options={{ title: 'Notas' }} />
      <Drawer.Screen name="website"    options={{ title: 'Website' }} />
      <Drawer.Screen name="catalogo"   options={{ title: 'Catálogo' }} />
      <Drawer.Screen name="piezas"     options={{ title: 'Piezas 3D' }} />
      <Drawer.Screen name="inventario" options={{ title: 'Inventario' }} />
      <Drawer.Screen name="redes"      options={{ title: 'Redes Sociales' }} />
      <Drawer.Screen name="qr"         options={{ title: 'Generador QR' }} />
      <Drawer.Screen name="passwords"  options={{ title: 'Contraseñas' }} />
      <Drawer.Screen name="usuarios"   options={{ title: 'Usuarios' }} />
    </Drawer>
  );
}
