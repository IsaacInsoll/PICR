import { useLoginDetails } from '@/src/hooks/useLoginDetails';
import { Redirect } from 'expo-router';
import { PicrUserProvider } from '@/src/components/PicrUserProvider';
import { Suspense } from 'react';
import { PText } from '@/src/components/PText';

export default function index() {
  console.log('[app index.tsx]');
  const me = useLoginDetails();
  if (me?.hostname) {
    const destination = '/' + me?.hostname + 'admin';
    console.log('[app/index.tsx] redirecting from base URL to ' + destination);
    // router.replace('/' + me?.hostname);
    return <Redirect href={destination} withAnchor />;
  }

  return (
    <Suspense>
      <PicrUserProvider>
        <PText>You should never see this page?</PText>
      </PicrUserProvider>
    </Suspense>
  );
}
