import React from 'react';
import { Stack } from 'expo-router';
import { Colors } from '@/constants/Colors';

export default function ExploreLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.dark.background,
        },
        headerTintColor: Colors.dark.text,
        headerShadowVisible: false,
        animation: 'slide_from_right',
        contentStyle: {
          backgroundColor: Colors.dark.background,
        },
        headerBackTitle: "Explore",
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{ 
          headerShown: false,
          title: "Explore"
        }} 
      />
    </Stack>
  );
} 