import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PicrLogo } from '@/src/components/PicrLogo';
import { picrColors, picrManualURL } from '@/src/constants';
import * as WebBrowser from 'expo-web-browser';

import { useKeyboardVisible } from '@/src/hooks/useKeyboardVisible';
import { AppBrandedBackground } from '@/src/components/AppBrandedBackground';
import { PTitle } from '@/src/components/PTitle';
import { LoginForm } from '@/src/components/LoginForm';

export default function Index() {
  const keyboardVisible = useKeyboardVisible();

  return (
    <AppBrandedBackground>
      <SafeAreaView style={{ flex: 1 }} testID="login-screen">
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
        >
          <ScrollView
            contentContainerStyle={styles.safeArea}
            keyboardShouldPersistTaps="handled"
          >
            <PicrLogo />
            <PTitle style={{ ...styles.headerText }}>Welcome to PICR</PTitle>
            <LoginForm />
          </ScrollView>
          {!keyboardVisible ? (
            <View style={{ alignItems: 'center', marginBottom: 32 }}>
              <TouchableOpacity
                onPress={() => {
                  void WebBrowser.openBrowserAsync(picrManualURL);
                }}
              >
                <Text style={{ color: '#fff', opacity: 0.8 }}>
                  What is PICR?
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </AppBrandedBackground>
  );
}

const styles = StyleSheet.create({
  headerText: { color: picrColors[2] },
  safeArea: {
    justifyContent: 'center',
    alignItems: 'center',
    flexGrow: 1,
    paddingVertical: 24,
    gap: 8,
  },
});
