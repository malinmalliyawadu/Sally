import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WeatherData } from '../../utils/locationService';

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
  
  return (
    <View style={styles.card}>
      <View style={styles.titleContainer}>
        <Ionicons name="partly-sunny" size={24} color="#FF9800" />
        <Text style={styles.title}>Weather Forecast</Text>
      </View>
      
      {isLoading ? (
        <Text style={styles.loadingText}>Loading weather forecast...</Text>
      ) : weather ? (
        <>
          <View style={styles.currentWeather}>
            <Text style={styles.currentTemp}>{weather.currentTemp}°C</Text>
            <Text style={styles.currentCondition}>{weather.currentCondition}</Text>
          </View>
          
          <Text style={styles.hourlyTitle}>Hourly Forecast</Text>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.hourlyContainer}
          >
            {weather.hourlyForecasts.map((forecast, index) => (
              <View key={index} style={styles.hourBlock}>
                <Text style={styles.hourText}>{forecast.time}</Text>
                <Ionicons 
                  name={getWeatherIcon(forecast.condition)} 
                  size={24} 
                  color={index < 6 ? "#FF9800" : "#3F51B5"} 
                />
                <Text style={styles.hourTemp}>{forecast.temp}°</Text>
              </View>
            ))}
          </ScrollView>
        </>
      ) : (
        <Text style={styles.errorText}>Unable to fetch weather data</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
    color: '#333',
  },
  currentWeather: {
    alignItems: 'center',
    marginBottom: 16,
  },
  currentTemp: {
    fontSize: 36,
    fontWeight: '700',
    color: '#333',
  },
  currentCondition: {
    fontSize: 18,
    color: '#666',
    marginTop: 4,
  },
  hourlyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#555',
  },
  hourlyContainer: {
    paddingBottom: 8,
  },
  hourBlock: {
    alignItems: 'center',
    marginRight: 16,
    minWidth: 50,
  },
  hourText: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: '#555',
  },
  hourTemp: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 12,
  },
  errorText: {
    fontSize: 16,
    color: '#E53935',
    textAlign: 'center',
    marginVertical: 12,
  },
}); 