import {
  ActivityIndicator,
  Alert,
  Button,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { PicrLogo } from '@/src/components/PicrLogo';
import { useRouter } from 'expo-router';
import { FieldError, useForm } from 'react-hook-form';
import { CTextInput } from '@/src/components/CTextInput';
import { mainFont, picrColors, picrManualURL } from '@/src/constants';
import * as WebBrowser from 'expo-web-browser';
import { zodResolver } from '@hookform/resolvers/zod';

import { useKeyboardVisible } from '@/src/hooks/useKeyboardVisible';
import { urqlClient } from '@/src/urqlClient';
import { loginMutation } from '@frontend/urql/mutations/loginMutation';
import { z, ZodType } from 'zod';
import { useState } from 'react';
import { LoginDetails, useSetLoginDetails } from '@/src/hooks/useLoginDetails';
import { AppBrandedBackground } from '@/src/components/AppBrandedBackground';
import { PTitle } from '@/src/components/PTitle';

const loginFormSchema: ZodType<LoginDetails> = z.object({
  server: z.string().url(),
  username: z.string().email(),
  password: z.string().min(8),
});

export default function index() {
  const keyboardVisible = useKeyboardVisible();

  return (
    <AppBrandedBackground>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
        >
          <View style={styles.safeArea}>
            <PicrLogo />
            <PTitle style={{ ...styles.headerText }}>Login to PICR</PTitle>
            <LoginForm />
          </View>
          {!keyboardVisible ? (
            <View style={{ alignItems: 'center', marginBottom: 32 }}>
              <TouchableOpacity
                onPress={() => {
                  WebBrowser.openBrowserAsync(picrManualURL);
                }}
              >
                <Text style={{ color: picrColors[0] }}>What is PICR?</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </AppBrandedBackground>
  );
}

const LoginForm = () => {
  const setLogin = useSetLoginDetails();
  const router = useRouter();
  const [step, setStep] = useState<
    'ready' | 'loading' | 'success' | 'networkError' | 'authError'
  >('ready');

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<LoginDetails>({ resolver: zodResolver(loginFormSchema) });

  const onSubmit = async (data: LoginDetails) => {
    setStep('loading');
    const { server, username, password } = data;

    const newClient = urqlClient(server, {});
    // TODO: Fix this await mutation crashing on iOS 16.4
    // No errors in console, so I just set minimum target to 17 for now :(
    const result = await newClient
      .mutation(loginMutation, { username, password })
      .toPromise();
    const token = result?.data?.auth;
    if (token) {
      setStep('success');
      console.log('[login/index.tsx] redirecting to dashboard??');
      router.replace('/');
      setLogin({ ...data, token });
    } else {
      setStep(result.error ? 'networkError' : 'authError');
      const message = result.error
        ? 'Unable to connect to server: ' + result.error.message
        : 'Incorrect username or password';
      {
        Alert.alert('Login Failed', message, [
          {
            text: 'Cancel',
            onPress: () => setStep('ready'),
            style: 'cancel',
          },
        ]);
      }
    }
  };

  return (
    <>
      <Text style={styles.fieldLabel}>Server</Text>
      <CTextInput
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="while-editing"
        inputMode="url"
        keyboardType="url"
        control={control}
        onBlur={() => {
          let s = watch('server').trim();
          if (!s.startsWith('http')) s = 'https://' + s;
          if (!s.endsWith('/')) s = s + '/';
          if (s != watch('server')) {
            setValue('server', s);
          }
        }}
        name="server"
        placeholder="https://mysite.com/"
        autoComplete="url"
        style={styles.textInput}
      />
      <ErrorMessage error={errors.server} />
      <Text style={styles.fieldLabel}>Username</Text>
      <CTextInput
        autoCapitalize="none"
        control={control}
        name="username"
        placeholder="me@mysite.com"
        autoComplete="email"
        style={styles.textInput}
      />
      <ErrorMessage error={errors.username} />
      <Text style={styles.fieldLabel}>Password</Text>
      <CTextInput
        control={control}
        name="password"
        secureTextEntry={true}
        style={styles.textInput}
        returnKeyType="go"
        onSubmitEditing={handleSubmit(onSubmit)}
      />
      <ErrorMessage error={errors.password} />
      <View style={{ marginTop: 16 }}>
        {step == 'loading' ? (
          <ActivityIndicator size="large" />
        ) : (
          <Button
            title="Login"
            onPress={handleSubmit(onSubmit)}
            color={Platform.OS === 'ios' ? '#ffffff' : picrColors[0]}
          />
        )}
      </View>
    </>
  );
};

const ErrorMessage = ({ error }: { error: FieldError | undefined }) => {
  if (!error) return null;
  console.log(error);
  return <Text style={{ color: 'red' }}>{error.message}</Text>;
};

const styles = StyleSheet.create({
  headerText: { color: picrColors[2] },
  safeArea: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  textInput: {
    backgroundColor: '#fff',
    color: '#000',
    width: 250,
    padding: 12,
    borderRadius: 8,
  },
  fieldLabel: { width: 250, marginTop: 8, opacity: 0.5, color: '#fff' },
});
