import { Redirect } from 'expo-router';
import { useLoginDetails } from '@/src/hooks/useLoginDetails';

// WebBrowser consumes the callback; Router must never treat it as a gallery URL.
export default function AuthCallback() {
  const login = useLoginDetails();
  return <Redirect href={login ? '/' : '/login'} />;
}
