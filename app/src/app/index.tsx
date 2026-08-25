import { useLoginDetails } from '@/src/hooks/useLoginDetails';
import { Redirect } from 'expo-router';
import { PicrUserProvider } from '@/src/components/PicrUserProvider';
import { Suspense } from 'react';
import { PText } from '@/src/components/PText';
import { adminDashboardHref } from '@/src/helpers/appRoutes';

export default function Index() {
  // console.log('[app index.tsx]');
  const me = useLoginDetails();
  if (me?.hostname) {
    const destination = adminDashboardHref(me.hostname);
    // console.log('[app/index.tsx] redirecting from base URL to ' + destination);
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
