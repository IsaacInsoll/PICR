import { Text } from 'react-native';
import { useGlobalSearchParams, useNavigation } from 'expo-router';
export default function NotFound() {
  const navigation = useNavigation();
  console.log(navigation.getState());
  return <Text style={{ color: 'red', fontSize: 50 }}>not found</Text>;
}
