import { useGlobalSearchParams } from 'expo-router';

// returns current hostname based on URL of current page (not inspecting user details or anything)
export const useHostname = () => {
  const global = useGlobalSearchParams();
  return global?.loggedin;
};

export const useUuid = (): string | null => {
  const global = useGlobalSearchParams();
  return global?.uuid;
};
