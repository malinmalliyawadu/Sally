import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, RefreshControl, Text, Image, Animated } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';

import LocationCard from './LocationCard';
import PetrolStationCard from './PetrolStationCard';
import WeatherCard from './WeatherCard';
import { Colors } from '@/constants/Colors'; 
import { 
  getCurrentLocation, 
  getNearbyPetrolStations, 
  getWeatherForecast,
  LocationData,
  PetrolStation,
  WeatherData
} from '../../utils/locationService';

const HEADER_MAX_HEIGHT = 200;
const HEADER_MIN_HEIGHT = 0;
const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

export default function Dashboard() {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [petrolStation, setPetrolStation] = useState<PetrolStation | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Animation values
  const scrollY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Derived animated values
  const headerHeight = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
    extrapolate: 'clamp',
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE / 2, HEADER_SCROLL_DISTANCE],
    outputRange: [1, 0.5, 0],
    extrapolate: 'clamp',
  });

  const titleScale = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE / 2],
    outputRange: [1, 0.8],
    extrapolate: 'clamp',
  });

  const titleTranslateY = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [0, -HEADER_MAX_HEIGHT],
    extrapolate: 'clamp',
  });

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
    
    // Start the fade-in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: true,
    }).start();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <Animated.ScrollView
        contentContainerStyle={styles.scrollContent}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={Colors.dark.text}
            colors={[Colors.dark.tint]}
            progressViewOffset={HEADER_MAX_HEIGHT}
          />
        }
      >
        {/* Add padding to the top to account for the header */}
        <View style={{ height: HEADER_MAX_HEIGHT }} />
        
        <LocationCard location={location} isLoading={isLoading} />
        <PetrolStationCard petrolStation={petrolStation} isLoading={isLoading} />
        <WeatherCard weather={weather} isLoading={isLoading} />
      </Animated.ScrollView>
      
      {/* Header with background image - positioned absolute so it scrolls away */}
      <Animated.View 
        style={[
          styles.headerContainer,
          { 
            height: headerHeight,
            opacity: headerOpacity,
          }
        ]}
      >
        <Animated.View style={[
          styles.backgroundImageContainer,
          { opacity: fadeAnim }
        ]}>
          <Image 
            source={require('@/assets/images/backgrounds/nz-landscape.jpg')} 
            style={styles.backgroundImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)', Colors.dark.background]}
            style={styles.headerGradient}
          />
        </Animated.View>
        
        <Animated.View style={[
          styles.headerContent,
          {
            transform: [
              { scale: titleScale },
              { translateY: titleTranslateY }
            ]
          }
        ]}>
          <Text style={styles.headerTitle}>Sally</Text>
          <Text style={styles.headerSubtitle}>Van Life Dashboard</Text>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
    zIndex: 10,
  },
  backgroundImageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  headerGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: '100%',
  },
  headerContent: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 16,
    position: 'relative',
    zIndex: 2,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 0, // The header height takes care of this
  },
  headerTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: Colors.dark.text,
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  headerSubtitle: {
    fontSize: 18,
    color: Colors.dark.text,
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
}); 