import { useGlobalSearchParams } from 'expo-router';

const getSingleParam = (
  value: string | string[] | undefined,
): string | null => {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
};

// returns current hostname based on URL of current page (not inspecting user details or anything)
export const useHostname = () => {
  const global = useGlobalSearchParams();
  return getSingleParam(global?.loggedin);
};

export const useUuid = (): string | null => {
  const global = useGlobalSearchParams();
  return getSingleParam(global?.uuid);
};
