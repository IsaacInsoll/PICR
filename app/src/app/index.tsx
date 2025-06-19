import { useLoginDetails } from '@/src/hooks/useLoginDetails';
import { Redirect } from 'expo-router';
import { PicrUserProvider } from '@/src/components/PicrUserProvider';
import { Suspense } from 'react';
import { Text } from 'react-native';

export default function index() {
  console.log('app index.tsx');
  const me = useLoginDetails();
  if (me?.hostname) {
    console.log('[app/index.tsx] redirecting from base URL');
    // router.replace('/' + me?.hostname);
    return <Redirect href={'/' + me?.hostname} withAnchor />;
  }

  return (
    <Suspense>
      <PicrUserProvider>
        <Text>You should never see this page?</Text>
      </PicrUserProvider>
    </Suspense>
  );
}
