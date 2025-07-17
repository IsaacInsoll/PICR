import React, { useRef } from 'react';
import {
  Animated,
  GestureResponderEvent,
  PanResponder,
  PanResponderGestureState,
  View,
} from 'react-native';
import { getDistance, getScale } from './_helpers';

const PanContainer = ({
  children,
  close,
  setIsDragging,
}: {
  children: any;
  close: () => void;
  setIsDragging: any;
}) => {
  const translationXY = useRef(new Animated.ValueXY()).current;
  const scale = useRef(new Animated.Value(1)).current;
  let _initialTouches: any = useRef().current;

  const onRelease = (
    _: GestureResponderEvent,
    gestureState: PanResponderGestureState
  ): void | boolean => {
    setIsDragging(false);
    if (gestureState.dy > 180 && _initialTouches.length === 1) {
      close();
      return false;
    }

    Animated.parallel([
      Animated.timing(scale, {
        duration: 100,
        toValue: 1,
        useNativeDriver: true,
      }),

      Animated.timing(translationXY.x, {
        duration: 100,
        toValue: 0,
        useNativeDriver: true,
      }),
      Animated.timing(translationXY.y, {
        duration: 100,
        toValue: 0,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (
        _: GestureResponderEvent,
        gestureState: PanResponderGestureState
      ) => {
        const absDx = Math.abs(gestureState.dx);
        const absDY = Math.abs(gestureState.dy);
        if (absDY > 5 && absDx <= 2 && gestureState.numberActiveTouches <= 1) {
          return true;
        }
        if (absDx > 0 && gestureState.numberActiveTouches <= 1) {
          return false;
        }
        return true;
      },
      // onMoveShouldSetPanResponderCapture: (evt, gestureState) => true,

      onPanResponderGrant: (evt: GestureResponderEvent) => {
        setIsDragging(true);
        _initialTouches = evt.nativeEvent.touches;

        translationXY.setOffset({
          x: 0,
          y: 0,
        });
        return true;
      },
      onPanResponderMove: (
        evt: GestureResponderEvent,
        gestureState: PanResponderGestureState
      ) => {
        const { touches } = evt.nativeEvent;

        if (touches.length <= 1 && Math.abs(gestureState.dy) > 10) {
          translationXY.y.setValue(gestureState.dy);
          return true;
        }
        if (touches.length <= 1 && Math.abs(gestureState.dx) > 0) {
          setIsDragging(false);
          return false;
        }
        if (touches.length < 2) {
          // Trigger a release
          onRelease(evt, gestureState);
          return false;
        }

        const { dx, dy } = gestureState;
        translationXY.x.setValue(dx);
        translationXY.y.setValue(dy);
        // for scaling photo
        const currentDistance = getDistance(touches);
        const initialDistance = getDistance(_initialTouches);
        const newScale = getScale(currentDistance, initialDistance);
        scale.setValue(newScale);
        return true;
      },
      onPanResponderTerminationRequest: () => {
        return true;
      },
      onPanResponderRelease: (
        evt: GestureResponderEvent,
        gestureState: PanResponderGestureState
      ) => {
        onRelease(evt, gestureState);
        return true;
      },
      onPanResponderTerminate: () => true,
    })
  ).current;

  return (
    <View>
      <Animated.View
        {...panResponder.panHandlers}
        style={{
          transform: [
            {
              translateX: translationXY.x,
            },
            {
              translateY: translationXY.y,
            },
            { scale: scale },
          ],
        }}
      >
        {children}
      </Animated.View>
    </View>
  );
};

export default PanContainer;
