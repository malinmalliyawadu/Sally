import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PetrolStation } from '../../utils/locationService';

interface PetrolStationCardProps {
  petrolStation: PetrolStation | null;
  isLoading: boolean;
}

export default function PetrolStationCard({ petrolStation, isLoading }: PetrolStationCardProps) {
  
  const openMaps = () => {
    if (!petrolStation) return;
    
    const { latitude, longitude, name } = petrolStation;
    const label = encodeURI(name);
    const url = Platform.select({
      ios: `maps:?q=${label}&ll=${latitude},${longitude}`,
      android: `geo:${latitude},${longitude}?q=${label}`,
    });
    
    if (url) {
      Linking.openURL(url).catch(err => console.error('An error occurred', err));
    }
  };
  
  return (
    <View style={styles.card}>
      <View style={styles.iconContainer}>
        <Ionicons name="car" size={32} color="#4CAF50" />
      </View>
      <View style={styles.contentContainer}>
        <Text style={styles.title}>Nearest Petrol Station</Text>
        {isLoading ? (
          <Text style={styles.loadingText}>Finding petrol stations...</Text>
        ) : petrolStation ? (
          <>
            <Text style={styles.stationName}>{petrolStation.name}</Text>
            <Text style={styles.distance}>{petrolStation.distance.toFixed(1)} km away</Text>
            <Text style={styles.address}>{petrolStation.address}</Text>
            <TouchableOpacity style={styles.directionsButton} onPress={openMaps}>
              <Ionicons name="navigate" size={16} color="white" />
              <Text style={styles.directionsText}>Get Directions</Text>
            </TouchableOpacity>
          </>
        ) : (
          <Text style={styles.errorText}>No petrol stations found nearby</Text>
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
  stationName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0D0D0D',
    marginBottom: 2,
  },
  distance: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4CAF50',
    marginBottom: 2,
  },
  address: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  directionsButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  directionsText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 6,
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