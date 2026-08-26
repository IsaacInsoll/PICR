import {
  ActivityIndicator,
  Alert,
  Button,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { FieldError } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { CTextInput } from '@/src/components/CTextInput';
import { picrColors } from '@/src/constants';
import { useSetLoginDetails } from '@/src/hooks/useLoginDetails';
import { appLogin } from '@/src/helpers/appLogin';
import {
  loginFormSchema,
  normalizeServerUrl,
  type LoginFormValues,
} from '@/src/helpers/loginForm';

export const LoginForm = () => {
  const setLogin = useSetLoginDetails();
  const router = useRouter();
  const [step, setStep] = useState<'ready' | 'loading' | 'success' | 'error'>(
    'ready',
  );

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setStep('loading');
    const result = await appLogin(data);
    if (!result.error) {
      setStep('success');
      void router.replace('/');
      void setLogin({ ...data, token: result.token });
    } else {
      setStep('error');
      Alert.alert('Login Failed', result.error.message, [
        {
          text: 'Cancel',
          onPress: () => setStep('ready'),
          style: 'cancel',
        },
      ]);
    }
  };
  const handleFormSubmit = handleSubmit((data) => {
    void onSubmit(data);
  });
  const handlePressSubmit = () => {
    void handleFormSubmit();
  };

  return (
    <>
      <Text style={styles.fieldLabel}>Server</Text>
      <CTextInput
        accessibilityLabel="Server"
        testID="login-server-input"
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="while-editing"
        inputMode="url"
        keyboardType="url"
        control={control}
        onBlur={() => {
          const server = watch('server');
          const normalizedServer = normalizeServerUrl(server);
          if (normalizedServer !== server) {
            setValue('server', normalizedServer);
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
        accessibilityLabel="Username"
        testID="login-username-input"
        autoCapitalize="none"
        control={control}
        name="username"
        placeholder="admin"
        autoComplete="username"
        style={styles.textInput}
      />
      <ErrorMessage error={errors.username} />
      <Text style={styles.fieldLabel}>Password</Text>
      <CTextInput
        accessibilityLabel="Password"
        testID="login-password-input"
        control={control}
        name="password"
        secureTextEntry={true}
        style={styles.textInput}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="password"
        returnKeyType="go"
        onSubmitEditing={handlePressSubmit}
      />
      <ErrorMessage error={errors.password} />
      <View style={{ marginTop: 16 }}>
        {step === 'loading' ? (
          <ActivityIndicator size="large" />
        ) : (
          <Button
            accessibilityLabel="Login"
            testID="login-submit"
            title="Login"
            onPress={handlePressSubmit}
            color={Platform.OS === 'ios' ? '#ffffff' : picrColors[0]}
          />
        )}
      </View>
    </>
  );
};

const ErrorMessage = ({ error }: { error: FieldError | undefined }) => {
  if (!error) return null;
  return <Text style={{ color: 'red' }}>{error.message}</Text>;
};

const styles = StyleSheet.create({
  textInput: {
    backgroundColor: '#fff',
    color: '#000',
    width: 250,
    padding: 12,
    borderRadius: 8,
  },
  fieldLabel: { width: 250, marginTop: 8, opacity: 0.5, color: '#fff' },
});
