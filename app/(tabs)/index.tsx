import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';

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
      {/* Welcome Section */}
      <View style={styles.welcomeSection}>
        <Text style={styles.greeting}>{getGreeting()}!</Text>
        <Text style={styles.subtitle}>Ready for your next adventure?</Text>
      </View>

      {/* Current Location Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Current Location</Text>
        <Text style={styles.locationText}>{locationName}</Text>
        {location && (
          <Text style={styles.coordsText}>
            {location.coords.latitude.toFixed(4)}, {location.coords.longitude.toFixed(4)}
          </Text>
        )}
      </View>

      {/* Weather Card - Placeholder */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Weather</Text>
        <View style={styles.weatherContent}>
          <Text style={styles.weatherTemp}>18°C</Text>
          <Text style={styles.weatherCondition}>Partly Cloudy</Text>
        </View>
        <Text style={styles.weatherNote}>Weather data coming soon</Text>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>Achievements</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>Journal Entries</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>Places Visited</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push('/(tabs)/map')}
        >
          <Text style={styles.actionButtonText}>Explore Map</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push('/(tabs)/journal')}
        >
          <Text style={styles.actionButtonText}>New Journal Entry</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 16,
    paddingTop: 60,
  },
  welcomeSection: {
    marginBottom: 24,
  },
  greeting: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 20,
    fontWeight: '500',
    color: '#007AFF',
    marginBottom: 4,
  },
  coordsText: {
    fontSize: 14,
    color: '#999',
  },
  weatherContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  weatherTemp: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 12,
  },
  weatherCondition: {
    fontSize: 18,
    color: '#666',
  },
  weatherNote: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  actionsContainer: {
    marginTop: 8,
  },
  actionButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
