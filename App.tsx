import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppStateProvider } from './src/context/AppStateContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { PremiumService } from './src/services/PremiumService';

PremiumService.configure();

export default function App() {
  return (
    <SafeAreaProvider>
      <AppStateProvider>
        <AppNavigator />
      </AppStateProvider>
    </SafeAreaProvider>
  );
}
