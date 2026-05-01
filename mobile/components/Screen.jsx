import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../lib/theme';

export function Screen({ children, style, scroll = false, onRefresh, refreshing = false, padded = true }) {
  const content = (
    <View style={[styles.inner, padded && styles.padded, style]}>
      {children}
    </View>
  );

  if (scroll) {
    return (
      <SafeAreaView style={styles.root} edges={['bottom']}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.accentText}
                colors={[colors.accentText]}
              />
            ) : undefined
          }
        >
          {content}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
      {content}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:         { flex: 1, backgroundColor: colors.bg },
  inner:        { flex: 1 },
  padded:       { padding: spacing.lg },
  scroll:       { flex: 1, backgroundColor: colors.bg },
  scrollContent:{ flexGrow: 1, padding: spacing.lg },
});
