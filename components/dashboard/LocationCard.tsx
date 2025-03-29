import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LocationData } from '../../utils/locationService';
import { Colors } from '@/constants/Colors';

interface LocationCardProps {
  location: LocationData | null;
  isLoading: boolean;
}

export default function LocationCard({ location, isLoading }: LocationCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.iconContainer}>
        <Ionicons name="location" size={32} color={Colors.dark.accentRed} />
      </View>
      <View style={styles.contentContainer}>
        <Text style={styles.title}>Current Location</Text>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={Colors.dark.tint} />
            <Text style={styles.loadingText}>Finding your location...</Text>
          </View>
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
    backgroundColor: Colors.dark.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    shadowColor: Colors.dark.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
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
    color: Colors.dark.textSecondary,
  },
  locationName: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.dark.text,
    marginBottom: 2,
  },
  coordinates: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.dark.textSecondary,
    fontStyle: 'italic',
    marginLeft: 8,
  },
  errorText: {
    fontSize: 16,
    color: Colors.dark.accentRed,
  },
}); 