import { Button, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { AppBrandedBackground } from '@/src/components/AppBrandedBackground';
import { PicrLogo } from '@/src/components/PicrLogo';
import { useLoginDetails, useSetLoggedOut } from '@/src/hooks/useLoginDetails';
import { serverInfoQuery } from '@frontend/urql/queries/serverInfoQuery';
import { useQuery } from 'urql';
import { useMe } from '@/src/hooks/useMe';
import { AppView } from '@/src/components/AppView';
import { PText } from '@/src/components/PText';
import { PTitle } from '@/src/components/PTitle';
import { CacheManager } from '@georstat/react-native-image-cache';
import { useEffect, useState } from 'react';
import prettyBytes from 'pretty-bytes';

export default function Settings() {
  const logout = useSetLoggedOut();
  return (
    <AppView style={{ flex: 1 }}>
      <SafeAreaView style={{}}>
        <ServerDetails />
        <AppDetails />
        <View style={{ marginVertical: 32 }}>
          <Button onPress={logout} title="Log out" />
        </View>
      </SafeAreaView>
    </AppView>
  );
}

const ServerDetails = () => {
  const [result] = useQuery({ query: serverInfoQuery });
  const login = useLoginDetails();
  const me = useMe();
  const details = result.data?.serverInfo;
  return (
    <View style={styles.settingsView}>
      <PicrLogo />
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
  const doClearCache = async () => {
    await CacheManager.clearCache();
  };

  useEffect(() => {
    console.log('getting cache size');
    CacheManager.getCacheSize().then((size) => setCacheSize(size));
  }, []);

  return (
    <View style={styles.settingsView}>
      <PTitle level={3}>App</PTitle>
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
