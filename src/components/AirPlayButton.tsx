import React from 'react';
import { requireNativeComponent, StyleProp, ViewStyle } from 'react-native';

const NativeAirPlayButton = requireNativeComponent('AirPlayButton');

export function AirPlayButton({ style }: { style?: StyleProp<ViewStyle> }) {
  return <NativeAirPlayButton style={style} />;
}
