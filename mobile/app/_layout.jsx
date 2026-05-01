import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { store } from '../store';
import { restoreAuthThunk } from '../store/slices/authSlice';
import { colors } from '../lib/theme';

function AuthGate() {
  const dispatch  = useDispatch();
  const router    = useRouter();
  const segments  = useSegments();
  const { token, restored } = useSelector((s) => s.auth);

  useEffect(() => {
    dispatch(restoreAuthThunk());
  }, []);

  useEffect(() => {
    if (!restored) return;
    const inApp = segments[0] === '(app)';
    if (!token && inApp) router.replace('/login');
    if (token && !inApp) router.replace('/(app)/');
  }, [token, restored, segments]);

  return null;
}

function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style="light" backgroundColor={colors.bg} />
      <AuthGate />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="(app)" />
      </Stack>
    </GestureHandlerRootView>
  );
}

export default function Layout() {
  return (
    <Provider store={store}>
      <RootLayout />
    </Provider>
  );
}
