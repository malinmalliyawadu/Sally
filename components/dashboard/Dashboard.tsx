import React, { useEffect, useState } from 'react';
import { View, StyleSheet, RefreshControl, ScrollView, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';

import LocationCard from './LocationCard';
import PetrolStationCard from './PetrolStationCard';
import WeatherCard from './WeatherCard';
import { 
  getCurrentLocation, 
  getNearbyPetrolStations, 
  getWeatherForecast,
  LocationData,
  PetrolStation,
  WeatherData
} from '../../utils/locationService';

export default function Dashboard() {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [petrolStation, setPetrolStation] = useState<PetrolStation | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Get current location
      const locationData = await getCurrentLocation();
      setLocation(locationData);
      
      if (locationData) {
        // Get petrol stations
        const stations = await getNearbyPetrolStations(
          locationData.latitude, 
          locationData.longitude
        );
        setPetrolStation(stations.length > 0 ? stations[0] : null);
        
        // Get weather
        const weatherData = await getWeatherForecast(
          locationData.latitude, 
          locationData.longitude
        );
        setWeather(weatherData);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text style={styles.headerTitle}>Sally</Text>
        <Text style={styles.headerSubtitle}>Van Life Dashboard</Text>
        
        <LocationCard location={location} isLoading={isLoading} />
        <PetrolStationCard petrolStation={petrolStation} isLoading={isLoading} />
        <WeatherCard weather={weather} isLoading={isLoading} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    padding: 16,
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: '#333',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 24,
  },
}); 