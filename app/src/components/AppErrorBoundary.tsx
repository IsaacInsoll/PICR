import { ReactNode } from 'react';
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';

export const AppErrorBoundary = ({ children }: { children: ReactNode }) => {
  return (
    <ErrorBoundary fallbackRender={fallbackRender}>{children}</ErrorBoundary>
  );
};

function fallbackRender({ error }: FallbackProps) {
  // const theme = useAppTheme();
  console.log(error.stack);
  const stackLines = (error.stack ?? '').split('\n').slice(0, 4);

  return (
    <LinearGradient
      style={{ flex: 1 }}
      colors={['#1777C2', '#104e7e']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <SafeAreaView style={styles.container}>
        <Image
          source={require('./../../assets/images/picr-logo-beta-1024.png')}
          style={{ width: 128, height: 128 }}
        />
        <Text style={styles.header}>Whoops, an error occured :(</Text>
        <Text style={styles.errorMessage}>{error.message}</Text>
        {stackLines.map((line: string, index: number) => (
          <Text
            key={`${index}-${line}`}
            style={[styles.stack, { opacity: 0.8 - index * 0.2 }]}
          >
            {line}
          </Text>
        ))}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  errorMessage: {
    fontFamily: 'Courier New',
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    backgroundColor: '#00f2',
    maxWidth: '80%',
    lineHeight: 30,
  },
  header: { color: '#fff', fontSize: 18, textAlign: 'center' },
  stack: {
    color: '#fff',
    fontSize: 11,
    fontFamily: 'Courier New',
    width: '95%',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    gap: 16,
    justifyContent: 'center',
  },
});
