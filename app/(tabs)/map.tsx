import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, TouchableOpacity, Dimensions, Platform } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT, MapStyleElement } from 'react-native-maps';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { Colors } from '@/constants/Colors';
import { getCurrentLocation, getNearbyPetrolStations, LocationData, PetrolStation } from '@/utils/locationService';

// Dark mode map style
const darkMapStyle: MapStyleElement[] = [
  {
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#212121"
      }
    ]
  },
  {
    "elementType": "labels.icon",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#757575"
      }
    ]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [
      {
        "color": "#212121"
      }
    ]
  },
  {
    "featureType": "administrative",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#757575"
      }
    ]
  },
  {
    "featureType": "administrative.country",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#9e9e9e"
      }
    ]
  },
  {
    "featureType": "administrative.locality",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#bdbdbd"
      }
    ]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#757575"
      }
    ]
  },
  {
    "featureType": "poi.park",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#181818"
      }
    ]
  },
  {
    "featureType": "poi.park",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#616161"
      }
    ]
  },
  {
    "featureType": "poi.park",
    "elementType": "labels.text.stroke",
    "stylers": [
      {
        "color": "#1b1b1b"
      }
    ]
  },
  {
    "featureType": "road",
    "elementType": "geometry.fill",
    "stylers": [
      {
        "color": "#2c2c2c"
      }
    ]
  },
  {
    "featureType": "road",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#8a8a8a"
      }
    ]
  },
  {
    "featureType": "road.arterial",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#373737"
      }
    ]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#3c3c3c"
      }
    ]
  },
  {
    "featureType": "road.highway.controlled_access",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#4e4e4e"
      }
    ]
  },
  {
    "featureType": "road.local",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#616161"
      }
    ]
  },
  {
    "featureType": "transit",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#757575"
      }
    ]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#000000"
      }
    ]
  },
  {
    "featureType": "water",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#3d3d3d"
      }
    ]
  }
];

export default function MapScreen() {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [petrolStations, setPetrolStations] = useState<PetrolStation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    const fetchLocationData = async () => {
      try {
        const currentLocation = await getCurrentLocation();
        setLocation(currentLocation);

        if (currentLocation) {
          const stations = await getNearbyPetrolStations(
            currentLocation.latitude,
            currentLocation.longitude
          );
          setPetrolStations(stations);
        }
      } catch (error) {
        console.error('Error fetching map data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLocationData();
  }, []);

  const centerOnUserLocation = () => {
    if (mapRef.current && location && mapReady) {
      mapRef.current.animateToRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }, 1000);
    }
  };

  const handleMapReady = () => {
    setMapReady(true);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color={Colors.dark.tint} />
        <Text style={styles.loadingText}>Loading map...</Text>
      </View>
    );
  }

  if (!location) {
    return (
      <View style={styles.errorContainer}>
        <StatusBar style="light" />
        <Ionicons name="alert-circle" size={64} color={Colors.dark.accentRed} />
        <Text style={styles.errorText}>Unable to get your location</Text>
        <Text style={styles.errorSubText}>Please check your location permissions</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Use the default provider to prevent native module issues */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_DEFAULT : undefined}
        initialRegion={{
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        customMapStyle={darkMapStyle}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={true}
        onMapReady={handleMapReady}
        onLayout={() => {}}
      >
        {mapReady && petrolStations.map((station, index) => (
          <Marker
            key={index}
            coordinate={{
              latitude: station.latitude,
              longitude: station.longitude,
            }}
            title={station.name}
            description={`${station.distance.toFixed(1)} km away`}
            pinColor={Colors.dark.accentGreen}
          />
        ))}
      </MapView>
      
      {/* Location label */}
      <View style={styles.locationLabelContainer}>
        <LinearGradient
          colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.5)']}
          style={styles.locationLabelGradient}
        >
          <Ionicons name="location" size={20} color={Colors.dark.text} />
          <Text style={styles.locationLabelText}>
            {location.placeName || 'Current Location'}
          </Text>
        </LinearGradient>
      </View>
      
      {/* Bottom controls */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity 
          style={styles.locationButton}
          onPress={centerOnUserLocation}
        >
          <Ionicons name="locate" size={28} color={Colors.dark.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.dark.background,
  },
  loadingText: {
    fontSize: 18,
    marginTop: 16,
    color: Colors.dark.text,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.dark.background,
    padding: 20,
  },
  errorText: {
    fontSize: 22,
    fontWeight: '600',
    marginTop: 16,
    color: Colors.dark.text,
  },
  errorSubText: {
    fontSize: 16,
    marginTop: 8,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
  },
  locationButton: {
    backgroundColor: Colors.dark.card,
    borderRadius: 30,
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
  },
  locationLabelContainer: {
    position: 'absolute',
    top: 48,
    alignSelf: 'center',
  },
  locationLabelGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  locationLabelText: {
    color: Colors.dark.text,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 24,
    right: 16,
  },
}); 