import { picrColors } from '@/src/constants';
import { Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet } from 'react-native';
import { ReactNode } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

export const AppBrandedBackground = ({ children }: { children: ReactNode }) => {
  return (
    <LinearGradient style={styles.wholePage} colors={picrColors}>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={{ flex: 1 }}>{children}</SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  wholePage: { flex: 1, backgroundColor: 'blue' },
});
