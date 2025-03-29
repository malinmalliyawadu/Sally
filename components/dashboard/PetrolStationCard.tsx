import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PetrolStation } from '../../utils/locationService';
import { Colors } from '@/constants/Colors';

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
        <Ionicons name="car" size={32} color={Colors.dark.accentGreen} />
      </View>
      <View style={styles.contentContainer}>
        <Text style={styles.title}>Nearest Petrol Station</Text>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={Colors.dark.tint} />
            <Text style={styles.loadingText}>Finding petrol stations...</Text>
          </View>
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
  stationName: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.dark.text,
    marginBottom: 2,
  },
  distance: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.dark.accentGreen,
    marginBottom: 2,
  },
  address: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    marginBottom: 8,
  },
  directionsButton: {
    backgroundColor: Colors.dark.accentGreen,
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