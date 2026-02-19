import { clearGlobalError, globalErrorAtom } from '@shared/globalErrorAtom';
import { PText } from '@/src/components/PText';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { useAtomValue } from 'jotai';
import { Href, usePathname, useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

export const GlobalErrorOverlay = () => {
  const incident = useAtomValue(globalErrorAtom);
  const theme = useAppTheme();
  const router = useRouter();
  const pathname = usePathname();

  if (!incident) return null;

  const title =
    incident.type === 'network_unavailable'
      ? 'Network currently unavailable'
      : 'You do not have permission';
  const description =
    incident.type === 'network_unavailable'
      ? 'PICR could not reach the server.'
      : 'This request is not allowed for your current user.';

  const retry = () => {
    clearGlobalError();
    const route = (pathname || '/').replace(/[?&]retry=\d+/g, '');
    const retryPath = route.includes('?')
      ? `${route}&retry=${Date.now()}`
      : `${route}?retry=${Date.now()}`;
    router.replace(retryPath as Href);
  };

  return (
    <View style={styles.backdrop}>
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.backgroundColor,
            borderColor: theme.dimmedColor,
          },
        ]}
      >
        <PText variant="bold" style={styles.title}>
          {title}
        </PText>
        <PText variant="dimmed" style={styles.description}>
          {description}
        </PText>
        <View style={styles.messageBox}>
          <PText>
            {incident.message
              .replace('[GraphQL] ', '')
              .replace('[Network] ', '')}
          </PText>
        </View>
        <View style={styles.buttonRow}>
          <Pressable
            style={[
              styles.primaryButton,
              { backgroundColor: theme.brandColor },
            ]}
            onPress={retry}
          >
            <PText style={styles.buttonText}>Retry</PText>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={clearGlobalError}>
            <PText>Close warning</PText>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.65)',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    padding: 16,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 9999,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  buttonText: {
    color: '#ffffff',
  },
  card: {
    borderRadius: 10,
    borderWidth: 1,
    maxWidth: 560,
    padding: 16,
    width: '100%',
  },
  description: {
    marginTop: 6,
  },
  messageBox: {
    borderColor: '#cc6666',
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 12,
    padding: 10,
  },
  primaryButton: {
    borderRadius: 6,
    minWidth: 120,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  secondaryButton: {
    borderColor: '#888888',
    borderRadius: 6,
    borderWidth: 1,
    minWidth: 120,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  title: {
    fontSize: 18,
  },
});
