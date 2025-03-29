import React from 'react';
import { StyleSheet, View } from 'react-native';
import Dashboard from '@/components/dashboard/Dashboard';
import { Colors } from '@/constants/Colors';

export default function DashboardScreen() {
  return (
    <View style={styles.container}>
      <Dashboard />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
});
