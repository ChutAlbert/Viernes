// Import first so TaskManager.defineTask registers before any navigation
import '../lib/locationTask';

import { useEffect, useRef } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { store } from '../store';
import { restoreAuthThunk } from '../store/slices/authSlice';
import { ThemeProvider, useTheme } from '../lib/theme';
import {
  registerLocationTask,
  unregisterLocationTask,
  getOrCreateDeviceId,
  checkAndRefreshIfNeeded,
} from '../lib/locationTask';

function AuthGate() {
  const dispatch  = useDispatch();
  const router    = useRouter();
  const segments  = useSegments();
  const { token, restored } = useSelector((s) => s.auth);
  const pollRef = useRef(null);

  useEffect(() => {
    dispatch(restoreAuthThunk());
  }, []);

  useEffect(() => {
    if (!restored) return;
    const inApp = segments[0] === '(app)';
    if (!token && inApp) router.replace('/login');
    if (token && !inApp) router.replace('/(app)/');
  }, [token, restored, segments]);

  // Location lifecycle tied to auth state
  useEffect(() => {
    if (!token || !restored) {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
      unregisterLocationTask();
      return;
    }
    // Ensure device ID exists then register background task
    getOrCreateDeviceId().then(() => registerLocationTask());
    // Foreground poll every 30s to react to server-requested refreshes
    pollRef.current = setInterval(checkAndRefreshIfNeeded, 30_000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [token, restored]);

  return null;
}

function RootLayout() {
  const { colors, isLight } = useTheme();
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style={isLight ? 'dark' : 'light'} backgroundColor={colors.bg} />
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
      <ThemeProvider>
        <RootLayout />
      </ThemeProvider>
    </Provider>
  );
}
