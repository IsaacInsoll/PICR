import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useAtomValue } from 'jotai';
import * as SecureStore from 'expo-secure-store';
import { CTextInput } from '@/src/components/CTextInput';
import { appLogin } from '@/src/helpers/appLogin';
import { restoreAppSession } from '@/src/helpers/appSession';
import { sessionExpiredAtom } from '@/src/hooks/useLoginDetails';
import { nativeAuthErrorMessage } from '@/src/helpers/nativeAuthRequest';
import {
  loginFormSchema,
  normalizeServerUrl,
  type LoginFormValues,
} from '@/src/helpers/loginForm';

export const LoginForm = () => {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const expired = useAtomValue(sessionExpiredAtom);
  const {
    control,
    getValues,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { server: '' },
  });
  useEffect(() => {
    const lifetime = new AbortController();
    void (async () => {
      try {
        await restoreAppSession();
        const server = await SecureStore.getItemAsync('login-server');
        if (lifetime.signal.aborted) return;
        if (server && !getValues('server')) setValue('server', server);
      } catch {
        if (!lifetime.signal.aborted)
          setError(
            'Unable to read saved sign-in details. Please try restarting the app.',
          );
      } finally {
        if (!lifetime.signal.aborted) setReady(true);
      }
    })();
    return () => {
      lifetime.abort();
    };
  }, [getValues, setValue]);
  const submit = handleSubmit(async ({ server }) => {
    if (busy) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      if (await appLogin(normalizeServerUrl(server))) router.replace('/');
      else
        setMessage(
          'Sign-in cancelled. You can try again whenever you’re ready.',
        );
    } catch (failure) {
      setError(nativeAuthErrorMessage(failure));
    } finally {
      setBusy(false);
    }
  });
  return (
    <View style={styles.form}>
      <Text style={styles.description}>Connect to your photo library</Text>
      <Text style={styles.label}>Your PICR server</Text>
      <CTextInput
        accessibilityLabel="Server"
        testID="login-server-input"
        control={control}
        name="server"
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="while-editing"
        inputMode="url"
        keyboardType="url"
        autoComplete="url"
        editable={ready && !busy}
        placeholder="https://photos.example.com"
        style={styles.input}
        returnKeyType="go"
        onSubmitEditing={() => {
          void submit();
        }}
        onBlur={() =>
          setValue('server', normalizeServerUrl(getValues('server')))
        }
      />
      {errors.server ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {errors.server.message}
        </Text>
      ) : null}
      {message ? (
        <Text accessibilityLiveRegion="polite" style={styles.notice}>
          {message}
        </Text>
      ) : null}
      {!message && expired ? (
        <Text accessibilityLiveRegion="polite" style={styles.notice}>
          Your session has expired. Sign in again to reconnect to your library.
        </Text>
      ) : null}
      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Continue in browser"
        accessibilityState={{ disabled: busy || !ready, busy }}
        testID="login-submit"
        disabled={busy || !ready}
        onPress={() => {
          void submit();
        }}
        style={({ pressed }) => [
          styles.button,
          { opacity: busy || !ready ? 0.6 : pressed ? 0.85 : 1 },
        ]}
      >
        {busy ? <ActivityIndicator color="#173c40" /> : null}
        <Text style={styles.buttonText}>
          {busy ? 'Waiting for sign-in…' : 'Continue in browser'}
        </Text>
      </Pressable>
    </View>
  );
};
const styles = StyleSheet.create({
  form: { width: '100%', maxWidth: 380, paddingHorizontal: 24, gap: 12 },
  description: {
    color: '#fff',
    opacity: 0.8,
    textAlign: 'center',
    marginBottom: 12,
    fontSize: 16,
  },
  label: { color: '#fff', fontSize: 15, fontWeight: '600' },
  input: {
    backgroundColor: '#fff',
    color: '#111',
    padding: 14,
    borderRadius: 10,
    fontSize: 16,
    minHeight: 50,
  },
  button: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    minHeight: 52,
    marginTop: 8,
  },
  buttonText: { color: '#173c40', fontWeight: '600', fontSize: 16 },
  notice: {
    color: '#fff',
    backgroundColor: '#ffffff15',
    padding: 12,
    borderRadius: 8,
    lineHeight: 21,
  },
  error: {
    color: '#ffe3df',
    lineHeight: 21,
    ...Platform.select({ ios: { fontSize: 14 }, android: { fontSize: 14 } }),
  },
});
