import { ActivityIndicator, ActivityIndicatorProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// For showing "inline"
export const InlineAppLoadingIndicator = (props: ActivityIndicatorProps) => {
  return <ActivityIndicator {...props} />;
};

// for when it's part of the whole screen (eg: list loading)
export const AppLoadingIndicator = (props: ActivityIndicatorProps) => {
  return (
    <SafeAreaView
      style={{
        flexGrow: 1,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <InlineAppLoadingIndicator {...props} />
    </SafeAreaView>
  );
};
