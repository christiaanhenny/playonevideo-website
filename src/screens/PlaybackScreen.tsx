/**
 * PlaybackScreen — router
 * ========================
 * Stuurt premium gebruikers naar PlaybackScreenPremium (met glas)
 * en gratis gebruikers naar PlaybackScreenFree (zonder glas).
 *
 * WIJZIG DIT BESTAND NIET voor playback-logica.
 * Pas PlaybackScreenPremium of PlaybackScreenFree aan.
 */

import React from 'react';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import { useAppState } from '../context/AppStateContext';
import { PlaybackScreenPremium } from './PlaybackScreenPremium';
import { PlaybackScreenFree } from './PlaybackScreenFree';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Playback'>;
  route: RouteProp<RootStackParamList, 'Playback'>;
};

export function PlaybackScreen({ navigation, route }: Props) {
  const { isPremium } = useAppState();
  if (isPremium) {
    return <PlaybackScreenPremium navigation={navigation} route={route} />;
  }
  return <PlaybackScreenFree navigation={navigation} route={route} />;
}
