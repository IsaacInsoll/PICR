import { picrColors } from '@/src/constants';
import { Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, StyleSheet } from 'react-native';
import { ReactNode } from 'react';

export const PicrBackground = ({ children }: { children: ReactNode }) => {
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
