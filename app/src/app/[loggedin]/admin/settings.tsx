import { Button, StyleSheet, View } from 'react-native';
import { PicrLogo } from '@/src/components/PicrLogo';
import { useLoginDetails, useSetLoggedOut } from '@/src/hooks/useLoginDetails';
import { serverInfoQuery } from '@shared/urql/queries/serverInfoQuery';
import { useQuery } from 'urql';
import { useMe } from '@/src/hooks/useMe';
import { AppView } from '@/src/components/AppView';
import { PText } from '@/src/components/PText';
import { PTitle } from '@/src/components/PTitle';
import { CacheManager } from '@georstat/react-native-image-cache';
import { Suspense, useEffect, useState } from 'react';
import { prettyBytes } from '@shared/prettyBytes';
// import Constants from 'expo-constants';
import * as Application from 'expo-application';
import { AppLoadingIndicator } from '@/src/components/AppLoadingIndicator';
import Constants from 'expo-constants';
import { NotificationSettings } from '@/src/components/NotificationSettings';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeaderPadding } from '@/src/components/AppHeaderPadding';
import { SettingsScreen } from '@/src/components/settings/SettingsScreen';

export default function Settings() {
  const logout = useSetLoggedOut();

  const doClearCache = async () => {
    await CacheManager.clearCache();
    alert('Cleared');
  };
  return (
    <AppView style={{ flex: 1, alignItems: 'center' }}>
      <AppHeaderPadding />
      <PicrLogo />
      <Suspense fallback={<AppLoadingIndicator size="small" />}>
        <SettingsContainer />
      </Suspense>
      <SafeAreaView style={{}}>
        <AppDetails />
        <View style={{ margin: 32, gap: 16 }}>
          <Suspense fallback={<AppLoadingIndicator size="small" />}>
            <NotificationSettings />
          </Suspense>
          <Button onPress={doClearCache} title="Clear image cache" />
          <Button onPress={logout} title="Log out" />
        </View>
      </SafeAreaView>
    </AppView>
  );
}

export interface SettingsData {
  server?: string;
  me?: string;
  serverVersion?: string;
  serverLatest?: string;
}
const SettingsContainer = () => {
  // get all data, create all callbacks, and provide it to a native view
  const [result] = useQuery({ query: serverInfoQuery });
  const login = useLoginDetails();
  const me = useMe();
  const details = result.data?.serverInfo;

  const logout = useSetLoggedOut();

  const doClearCache = async () => {
    await CacheManager.clearCache();
    alert('Cleared');
  };

  const data: SettingsData = {
    server: login?.server,
    me: me?.name,
    serverVersion: details?.version,
    serverLatest: details?.latest,
  };

  return <SettingsScreen data={data} />;

  return <></>;
};

const ServerDetails = () => {
  const [result] = useQuery({ query: serverInfoQuery });
  const login = useLoginDetails();
  const me = useMe();
  const details = result.data?.serverInfo;
  return (
    <View style={styles.settingsView}>
      <PTitle level={3}>Server</PTitle>
      <PText>{login?.server}</PText>
      <PText>{me?.name}</PText>
      <PText>
        Server Version {details?.version} (Latest is {details?.latest})
      </PText>
    </View>
  );
};

const AppDetails = () => {
  const [cacheSize, setCacheSize] = useState(0);

  useEffect(() => {
    //note, this always returns a tiny value and is useless, see https://github.com/georstat/react-native-image-cache/issues/81
    CacheManager.getCacheSize().then((size) => setCacheSize(size));
  }, []);

  //TODO: relative date option

  return (
    <View style={styles.settingsView}>
      <PTitle level={3}>App</PTitle>
      <PText>
        App Version: {Application.nativeApplicationVersion} (Build{' '}
        {Application.nativeBuildVersion})
      </PText>
      <PText>Image cache size: {prettyBytes(cacheSize)}</PText>
    </View>
  );
};

const styles = StyleSheet.create({
  settingsView: {
    paddingTop: 32,
    alignItems: 'center',
    gap: 16,
    flexGrow: 1,
  },
});

export const useIsDev = () => {
  return !!Constants?.expoConfig?.extra?.dev;
};
