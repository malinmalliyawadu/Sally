import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function Dashboard() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [locationName, setLocationName] = useState<string>('Loading...');
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationName('Location unavailable');
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);

      // Reverse geocode to get location name
      const [address] = await Location.reverseGeocodeAsync({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });

      if (address) {
        setLocationName(`${address.city || address.region || 'Unknown'}, ${address.country || 'NZ'}`);
      }
    })();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>{getGreeting()}</Text>
        <Text style={styles.subtitle}>Ready for your next adventure?</Text>
      </View>

      {/* Current Location Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="location-outline" size={22} color="#007AFF" />
          <Text style={styles.cardTitle}>Current Location</Text>
        </View>
        <Text style={styles.locationText}>{locationName}</Text>
        {location && (
          <Text style={styles.coordsText}>
            {location.coords.latitude.toFixed(4)}, {location.coords.longitude.toFixed(4)}
          </Text>
        )}
      </View>

      {/* Weather Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="partly-sunny-outline" size={22} color="#007AFF" />
          <Text style={styles.cardTitle}>Weather</Text>
        </View>
        <View style={styles.weatherContent}>
          <Text style={styles.weatherTemp}>18°C</Text>
          <Text style={styles.weatherCondition}>Partly Cloudy</Text>
        </View>
        <Text style={styles.weatherNote}>Weather data coming soon</Text>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Ionicons name="trophy-outline" size={24} color="#007AFF" />
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>Achievements</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="book-outline" size={24} color="#007AFF" />
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>Journal</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="map-outline" size={24} color="#007AFF" />
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>Places</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push('/(tabs)/map')}
        >
          <Ionicons name="compass-outline" size={20} color="#007AFF" />
          <Text style={styles.actionButtonText}>Explore Map</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push('/(tabs)/journal')}
        >
          <Ionicons name="create-outline" size={20} color="#007AFF" />
          <Text style={styles.actionButtonText}>New Journal Entry</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  contentContainer: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 30,
  },
  greeting: {
    fontSize: 34,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 17,
    color: '#6b7280',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1a1a1a',
    marginLeft: 8,
  },
  locationText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 6,
  },
  coordsText: {
    fontSize: 14,
    color: '#9ca3af',
    fontFamily: 'monospace',
  },
  weatherContent: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  weatherTemp: {
    fontSize: 42,
    fontWeight: '700',
    color: '#1a1a1a',
    marginRight: 12,
  },
  weatherCondition: {
    fontSize: 18,
    color: '#6b7280',
    fontWeight: '500',
  },
  weatherNote: {
    fontSize: 13,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    fontWeight: '500',
  },
  actionsContainer: {
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#007AFF',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
});
