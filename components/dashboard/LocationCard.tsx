import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LocationData } from '../../utils/locationService';

interface LocationCardProps {
  location: LocationData | null;
  isLoading: boolean;
}

export default function LocationCard({ location, isLoading }: LocationCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.iconContainer}>
        <Ionicons name="location" size={32} color="#FF5757" />
      </View>
      <View style={styles.contentContainer}>
        <Text style={styles.title}>Current Location</Text>
        {isLoading ? (
          <Text style={styles.loadingText}>Finding your location...</Text>
        ) : location ? (
          <>
            <Text style={styles.locationName}>{location.placeName}</Text>
            <Text style={styles.coordinates}>
              {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
            </Text>
          </>
        ) : (
          <Text style={styles.errorText}>Unable to get location</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    marginRight: 16,
    justifyContent: 'center',
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#333',
  },
  locationName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0D0D0D',
    marginBottom: 2,
  },
  coordinates: {
    fontSize: 14,
    color: '#666',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
  },
  errorText: {
    fontSize: 16,
    color: '#E53935',
  },
}); 