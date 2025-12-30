import { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';

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

  useEffect(() => {
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
});
