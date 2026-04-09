import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { StorageService } from '../services/StorageService';

import { OnboardingScreen } from '../screens/OnboardingScreen';
import { LockedHomeScreen } from '../screens/LockedHomeScreen';
import { ParentAuthScreen } from '../screens/ParentAuthScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { VideoSetupScreen } from '../screens/VideoSetupScreen';
import { PlaybackScreen } from '../screens/PlaybackScreen';
import { FinishedScreen } from '../screens/FinishedScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { FolderVideosScreen } from '../screens/FolderVideosScreen';
import { ManageFoldersScreen } from '../screens/ManageFoldersScreen';
import { PlaylistVideosScreen } from '../screens/PlaylistVideosScreen';
import { ChannelVideosScreen } from '../screens/ChannelVideosScreen';
import { WatchHistoryScreen } from '../screens/WatchHistoryScreen';
import { ChildSettingsScreen } from '../screens/ChildSettingsScreen';
import { FamilySyncScreen } from '../screens/FamilySyncScreen';
import { PaywallScreen } from '../screens/PaywallScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  const [initialRoute, setInitialRoute] = useState<'Onboarding' | 'LockedHome' | null>(null);

  useEffect(() => {
    StorageService.getOnboardingComplete().then(done => {
      setInitialRoute(done ? 'LockedHome' : 'Onboarding');
    });
  }, []);

  // Wait until we know which screen to start on
  if (initialRoute === null) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{ headerShown: false, animation: 'default' }}>
        <Stack.Screen
          name="Onboarding"
          component={OnboardingScreen}
          options={{ animation: 'fade' }}
        />
        <Stack.Screen name="LockedHome" component={LockedHomeScreen} />
        <Stack.Screen
          name="ParentAuth"
          component={ParentAuthScreen}
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen name="Search" component={SearchScreen} />
        <Stack.Screen name="VideoSetup" component={VideoSetupScreen} />
        <Stack.Screen
          name="Playback"
          component={PlaybackScreen}
          options={{ gestureEnabled: false, animation: 'fade', orientation: 'all' }}
        />
        <Stack.Screen
          name="Finished"
          component={FinishedScreen}
          options={{ gestureEnabled: false, animation: 'fade' }}
        />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="FolderVideos" component={FolderVideosScreen} />
        <Stack.Screen name="ManageFolders" component={ManageFoldersScreen} />
        <Stack.Screen name="PlaylistVideos" component={PlaylistVideosScreen} />
        <Stack.Screen name="ChannelVideos" component={ChannelVideosScreen} />
        <Stack.Screen name="WatchHistory" component={WatchHistoryScreen} />
        <Stack.Screen name="ChildSettings" component={ChildSettingsScreen} />
        <Stack.Screen name="FamilySync" component={FamilySyncScreen} />
        <Stack.Screen
          name="Paywall"
          component={PaywallScreen}
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
