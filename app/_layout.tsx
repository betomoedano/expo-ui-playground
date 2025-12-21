/**
 * Declutterly - Root Layout
 * Main navigation structure with tab bar
 */

import { DeclutterProvider, useDeclutter } from '@/context/DeclutterContext';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';

function RootLayoutNav() {
  const { user } = useDeclutter();

  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        {!user?.onboardingComplete ? (
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        ) : (
          <>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="room/[id]"
              options={{
                presentation: 'card',
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="camera"
              options={{
                presentation: 'fullScreenModal',
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="analysis"
              options={{
                presentation: 'modal',
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="settings"
              options={{
                presentation: 'modal',
                headerShown: false,
              }}
            />
          </>
        )}
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <DeclutterProvider>
      <RootLayoutNav />
    </DeclutterProvider>
  );
}
