import { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, TouchableOpacity, Text } from 'react-native';
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';

interface JournalEntry {
  id: string;
  title: string;
  content: string;
  location: string;
  coordinates?: { latitude: number; longitude: number };
  date: string;
  timestamp: number;
  photos: string[];
  distanceTraveled?: number;
  placesVisited?: string[];
}

const STORAGE_KEY = '@sally_journal_entries';

// Sample data - replace with real data later
const SAMPLE_POIS = [
  {
    id: '1',
    title: 'Milford Sound',
    description: 'Stunning fiord in Fiordland National Park',
    coordinate: { latitude: -44.6717, longitude: 167.9261 },
    type: 'poi',
  },
  {
    id: '2',
    title: 'Mount Cook',
    description: 'Highest mountain in New Zealand',
    coordinate: { latitude: -43.5950, longitude: 170.1418 },
    type: 'poi',
  },
];

const SAMPLE_CAMPING = [
  {
    id: '3',
    title: 'Lake Pukaki Freedom Camp',
    description: 'Beautiful lake views',
    coordinate: { latitude: -44.1650, longitude: 170.1169 },
    type: 'camping',
  },
  {
    id: '4',
    title: 'Tekapo Freedom Camp',
    description: 'Stargazing paradise',
    coordinate: { latitude: -44.0045, longitude: 170.4776 },
    type: 'camping',
  },
];

export default function Map() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);

  useEffect(() => {
    loadJournalEntries();
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission needed',
          'Location permission is required to show your position on the map.'
        );
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);
    })();
  }, []);

  const loadJournalEntries = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setJournalEntries(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading journal entries:', error);
    }
  };

  // Filter journal entries that have coordinates
  const journalMarkers = journalEntries.filter(entry => entry.coordinates);

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: -41.2865, // Center of New Zealand
          longitude: 174.7762,
          latitudeDelta: 10,
          longitudeDelta: 10,
        }}
        showsUserLocation
        showsMyLocationButton
      >
        {/* Points of Interest */}
        {SAMPLE_POIS.map((poi) => (
          <Marker
            key={poi.id}
            coordinate={poi.coordinate}
            title={poi.title}
            description={poi.description}
            pinColor="red"
          />
        ))}

        {/* Freedom Camping Areas */}
        {SAMPLE_CAMPING.map((camp) => (
          <Marker
            key={camp.id}
            coordinate={camp.coordinate}
            title={camp.title}
            description={camp.description}
            pinColor="green"
          />
        ))}

        {/* Journal Entry Markers */}
        {journalMarkers.map((entry) => (
          <Marker
            key={entry.id}
            coordinate={entry.coordinates!}
          >
            <TouchableOpacity
              onPress={() => {
                // Navigate to journal tab with entry ID
                router.push(`/journal?entryId=${entry.id}`);
              }}
            >
              <View style={styles.journalMarker}>
                <Ionicons name="book" size={20} color="#fff" />
              </View>
            </TouchableOpacity>
            <Callout
              onPress={() => {
                router.push(`/journal?entryId=${entry.id}`);
              }}
            >
              <View style={styles.calloutContainer}>
                <Text style={styles.calloutTitle}>{entry.title}</Text>
                <Text style={styles.calloutSubtitle}>{entry.date}</Text>
                <Text style={styles.calloutLocation}>{entry.location}</Text>
                <View style={styles.calloutButton}>
                  <Ionicons name="arrow-forward" size={16} color="#007AFF" />
                  <Text style={styles.calloutButtonText}>View Entry</Text>
                </View>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  journalMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  calloutContainer: {
    minWidth: 200,
    padding: 12,
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  calloutSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 2,
  },
  calloutLocation: {
    fontSize: 13,
    color: '#9ca3af',
    marginBottom: 8,
  },
  calloutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  calloutButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
});
