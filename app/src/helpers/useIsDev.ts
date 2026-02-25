import Constants from 'expo-constants';

export const useIsDev = () => {
  return !!Constants.expoConfig?.extra?.['isDev'];
};
