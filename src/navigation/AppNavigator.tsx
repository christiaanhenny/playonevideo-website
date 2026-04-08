import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

import { LockedHomeScreen } from '../screens/LockedHomeScreen';
import { ParentAuthScreen } from '../screens/ParentAuthScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { VideoSetupScreen } from '../screens/VideoSetupScreen';
import { PlaybackScreen } from '../screens/PlaybackScreen';
import { FinishedScreen } from '../screens/FinishedScreen';
import { DonationPromptScreen } from '../screens/DonationPromptScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { FolderVideosScreen } from '../screens/FolderVideosScreen';
import { ManageFoldersScreen } from '../screens/ManageFoldersScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="LockedHome"
        screenOptions={{ headerShown: false, animation: 'fade' }}>
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
          options={{ orientation: 'all' }}
        />
        <Stack.Screen
          name="Finished"
          component={FinishedScreen}
          options={{ gestureEnabled: false }}
        />
        <Stack.Screen
          name="DonationPrompt"
          component={DonationPromptScreen}
          options={{ presentation: 'transparentModal', animation: 'fade' }}
        />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen
          name="FolderVideos"
          component={FolderVideosScreen}
          options={{ gestureEnabled: false }}
        />
        <Stack.Screen name="ManageFolders" component={ManageFoldersScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
