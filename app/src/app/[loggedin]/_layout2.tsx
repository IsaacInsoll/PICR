import { Tabs } from 'expo-router';
import { View } from 'react-native';

export default function TabLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Tabs>
        <Tabs.Screen
          name="index"
          options={[
            {
              title: 'Home',
            },
            { title: 'Settings' },
          ]}
        />
      </Tabs>
    </View>
  );
}
