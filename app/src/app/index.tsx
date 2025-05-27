import { useLoginDetails } from '@/src/hooks/useLoginDetails';
import { Stack, useRouter } from 'expo-router';
import { PicrUserProvider } from '@/src/components/PicrUserProvider';
import { Suspense } from 'react';
import { Text } from 'react-native';

export default function index() {
  const router = useRouter();
  const me = useLoginDetails();
  if (me?.hostname) {
    router.replace('/' + me?.hostname);
  }

  return (
    <Suspense>
      <PicrUserProvider>
        <Text>You should never see this page?</Text>
      </PicrUserProvider>
    </Suspense>
  );
}
