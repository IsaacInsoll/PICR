import {
  Button,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { PicrLogo } from '@/src/components/PicrLogo';
import { Stack } from 'expo-router';
import { useForm } from 'react-hook-form';
import { CTextInput } from '@/src/components/CTextInput';
import { LinearGradient } from 'expo-linear-gradient';
import { picrColors, picrManualURL } from '@/src/constants';
import * as WebBrowser from 'expo-web-browser';
import { useMutation } from 'urql';

import { loginMutation } from '@frontend/urql/mutations/loginMutation';

type LoginFormData = {
  server: string;
  username: string;
  password: string;
};

export default function index() {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({});

  const onSubmit = (data: LoginFormData) => console.log(data);

  return (
    <LinearGradient style={styles.wholePage} colors={picrColors}>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={{ flex: 1 }}>
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
          />
          <Text style={styles.fieldLabel}>Username</Text>
          <CTextInput
            control={control}
            name="username"
            placeholder="me@mysite.com"
            autoComplete="email"
            style={styles.textInput}
          />
          {errors.username && <Text>This is required.</Text>}
          <Text style={styles.fieldLabel}>Password</Text>
          <CTextInput
            control={control}
            name="password"
            secureTextEntry={true}
            // placeholder="Password"
            style={styles.textInput}
          />
          <View style={{ marginTop: 16 }}>
            <Button
              title="Login"
              onPress={handleSubmit(onSubmit)}
              color={Platform.OS === 'ios' ? '#ffffff' : picrColors[0]}
            />
          </View>
        </View>
        <View style={{ alignItems: 'center', marginBottom: 32 }}>
          <TouchableOpacity
            onPress={() => {
              WebBrowser.openBrowserAsync(picrManualURL);
            }}
          >
            <Text style={{ color: picrColors[0] }}>What is PICR?</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

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
