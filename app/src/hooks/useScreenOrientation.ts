import * as ScreenOrientation from 'expo-screen-orientation';
import { Orientation } from 'expo-screen-orientation';
import { useEffect, useState } from 'react';

export const useScreenOrientation = (): [
  orientation: Orientation,
  isLandscape: boolean,
] => {
  const [orientation, setOrientation] = useState<Orientation>(
    Orientation.UNKNOWN,
  );
  console.log('useScreenOrientation', orientation);

  useEffect(() => {
    // set initial orientation
    ScreenOrientation.getOrientationAsync().then((orientation) => {
      setOrientation(orientation);
    });

    // subscribe to future changes
    const subscription = ScreenOrientation.addOrientationChangeListener(
      (evt) => {
        setOrientation(evt.orientationInfo.orientation);
      },
    );

    // return a clean up function to unsubscribe from notifications
    return () => {
      ScreenOrientation.removeOrientationChangeListener(subscription);
    };
  }, []);

  return [orientation, orientation > 2];
};
