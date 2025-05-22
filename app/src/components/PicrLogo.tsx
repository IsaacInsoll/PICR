import { Image } from 'expo-image';

export const PicrLogo = () => {
  return (
    <Image
      source={require('./../../assets/images/picr-logo-512.png')}
      style={{ width: 64, height: 64 }}
    />
  );
};
