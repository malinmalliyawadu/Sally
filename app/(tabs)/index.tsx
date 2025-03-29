import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import Dashboard from '@/components/dashboard/Dashboard';

export default function DashboardScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Dashboard />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
});
