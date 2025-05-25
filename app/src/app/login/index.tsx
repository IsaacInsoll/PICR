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
import { Stack } from 'expo-router';
import { FieldError, useForm } from 'react-hook-form';
import { CTextInput } from '@/src/components/CTextInput';
import { LinearGradient } from 'expo-linear-gradient';
import { picrColors, picrManualURL } from '@/src/constants';
import * as WebBrowser from 'expo-web-browser';
import { zodResolver } from '@hookform/resolvers/zod';

import { useKeyboardVisible } from '@/src/hooks/useKeyboardVisible';
import { urqlClient } from '@/src/urqlClient';
import { loginMutation } from '@frontend/urql/mutations/loginMutation';
import { z, ZodType } from 'zod';
import { useState } from 'react';

type LoginFormData = {
  server: string;
  username: string;
  password: string;
};

const loginFormSchema: ZodType<LoginFormData> = z.object({
  server: z.string().url(),
  username: z.string().email(),
  password: z.string().min(8),
});

export default function index() {
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginFormSchema) });

  const keyboardVisible = useKeyboardVisible();
  const [step, setStep] = useState<
    'ready' | 'loading' | 'success' | 'networkError' | 'authError'
  >('ready');
  const onSubmit = async (data: LoginFormData) => {
    setStep('loading');
    const { server, username, password } = data;
    const newClient = await urqlClient(server, {});
    const result = await newClient
      .mutation(loginMutation, { username, password })
      .toPromise();
    if (result?.data?.auth) {
      setStep('success');
      Alert.alert('Login Success', 'we are in!');
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
    <LinearGradient style={styles.wholePage} colors={picrColors}>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
        >
          <View style={styles.safeArea}>
            <PicrLogo />
            <Text style={styles.headerText}>Login to PICR</Text>
            <Text style={styles.fieldLabel}>Server</Text>
            <CTextInput
              control={control}
              name="server"
              placeholder="https://mysite.com/"
              autoComplete="url"
              style={styles.textInput}
              onEndEditing={(e) => {
                let s = watch('server');
                if (!s.startsWith('http')) s = 'https://' + s;
                if (!s.endsWith('/')) s = s + '/';
                if (s != watch('server')) {
                  setValue('server', s);
                }
              }}
            />
            <ErrorMessage error={errors.server} />
            <Text style={styles.fieldLabel}>Username</Text>
            <CTextInput
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
    </LinearGradient>
  );
}

const ErrorMessage = ({ error }: { error: FieldError | undefined }) => {
  if (!error) return null;
  console.log(error);
  return <Text style={{ color: 'red' }}>{error.message}</Text>;
};

const styles = StyleSheet.create({
  headerText: { color: picrColors[2], fontSize: 18 },
  wholePage: { flex: 1, backgroundColor: 'blue' },
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
