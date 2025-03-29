import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  
  // Calculate the bottom padding based on safe area
  const bottomPadding = Platform.OS === 'ios' ? insets.bottom : 8;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.dark.tint,
        tabBarInactiveTintColor: Colors.dark.tabIconDefault,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: () => (
          <BlurView 
            intensity={100} 
            tint="dark" 
            style={StyleSheet.absoluteFill}
          >
            <View style={styles.tabBarOverlay} />
          </BlurView>
        ),
        tabBarStyle: {
          position: 'absolute',
          borderTopWidth: 0,
          elevation: 0,
          height: 50 + bottomPadding,
          paddingBottom: bottomPadding,
          paddingTop: 0,
          backgroundColor: 'transparent',
        },
        tabBarLabelStyle: {
          fontWeight: '600',
          fontSize: 12,
          marginTop: -5,
        },
        tabBarIconStyle: {
          marginTop: 5,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="map.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="paperplane.fill" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(18, 18, 18, 0.75)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(52, 57, 65, 0.8)',
  }
});
