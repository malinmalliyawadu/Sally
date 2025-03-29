import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WeatherData } from '../../utils/locationService';
import { Colors } from '@/constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';

interface WeatherCardProps {
  weather: WeatherData | null;
  isLoading: boolean;
}

export default function WeatherCard({ weather, isLoading }: WeatherCardProps) {
  
  const getWeatherIcon = (condition: string) => {
    const lowercaseCondition = condition.toLowerCase();
    
    if (lowercaseCondition.includes('clear')) return 'sunny';
    if (lowercaseCondition.includes('cloud')) return 'partly-sunny';
    if (lowercaseCondition.includes('rain')) return 'rainy';
    if (lowercaseCondition.includes('snow')) return 'snow';
    if (lowercaseCondition.includes('storm') || lowercaseCondition.includes('thunder')) return 'thunderstorm';
    
    return 'cloudy';
  };

  const getBackgroundColors = (condition: string, index: number): [string, string] => {
    // Return the same translucent colors for all weather conditions
    return ['rgba(0, 0, 0, 0.3)', 'rgba(0, 0, 0, 0.15)'];
  };
  
  return (
    <LinearGradient
      colors={[Colors.dark.accentOrange, 'rgba(135, 72, 0, 1)']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <LinearGradient
        colors={['rgba(0,0,0,0.4)', 'transparent']}
        style={styles.cardGradient}
      />
      
      <View style={styles.titleContainer}>
        <Ionicons name="partly-sunny" size={24} color="#FDEBD0" />
        <Text style={styles.title}>Weather Forecast</Text>
      </View>
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.dark.tint} />
          <Text style={styles.loadingText}>Loading weather forecast...</Text>
        </View>
      ) : weather ? (
        <>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.hourlyContainer}
          >
            {weather.hourlyForecasts.slice(0, 24).map((forecast, index) => (
              <LinearGradient
                key={index}
                colors={getBackgroundColors(forecast.condition, index)}
                style={styles.hourBlock}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
              >
                <Text style={styles.hourText}>{forecast.time}</Text>
                <Ionicons 
                  name={getWeatherIcon(forecast.condition)} 
                  size={24} 
                  color="#FFFFFF" 
                />
                <Text style={styles.hourTemp}>{forecast.temp}°</Text>
                <Text style={styles.hourCondition}>{forecast.condition}</Text>
              </LinearGradient>
            ))}
          </ScrollView>
        </>
      ) : (
        <Text style={styles.errorText}>Unable to fetch weather data</Text>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: Colors.dark.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  cardGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: '100%',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
    color: 'white',
  },
  currentWeather: {
    alignItems: 'center',
    marginBottom: 16,
  },
  currentTemp: {
    fontSize: 42,
    fontWeight: '700',
    color: Colors.dark.text,
  },
  currentCondition: {
    fontSize: 18,
    color: Colors.dark.textSecondary,
    marginTop: 4,
  },
  hourlyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: Colors.dark.textSecondary,
  },
  hourlyContainer: {
    paddingBottom: 8,
  },
  hourBlock: {
    alignItems: 'center',
    marginRight: 12,
    padding: 10,
    borderRadius: 12,
    minWidth: 80,
  },
  hourText: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: "#FFFFFF",
  },
  hourTemp: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
    color: "#FFFFFF",
  },
  hourCondition: {
    fontSize: 12,
    marginTop: 4,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 12,
  },
  errorText: {
    fontSize: 16,
    color: '#FDEBD0',
    textAlign: 'center',
    marginVertical: 12,
  },
}); 