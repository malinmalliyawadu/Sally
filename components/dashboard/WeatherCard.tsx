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
    const lowercaseCondition = condition.toLowerCase();
    const isNight = index > 6 && index < 18;

    if (lowercaseCondition.includes('clear') && isNight) {
      return ['#1A237E', '#0D47A1'];
    } else if (lowercaseCondition.includes('clear')) {
      return ['#1565C0', '#2196F3'];
    } else if (lowercaseCondition.includes('cloud') && isNight) {
      return ['#263238', '#37474F'];
    } else if (lowercaseCondition.includes('cloud')) {
      return ['#455A64', '#607D8B'];
    } else if (lowercaseCondition.includes('rain')) {
      return ['#0277BD', '#0288D1'];
    } else {
      return ['#263238', '#37474F'];
    }
  };
  
  return (
    <View style={styles.card}>
      <LinearGradient
        colors={['rgba(0,0,0,0.4)', 'transparent']}
        style={styles.cardGradient}
      />
      
      <View style={styles.titleContainer}>
        <Ionicons name="partly-sunny" size={24} color={Colors.dark.accentOrange} />
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
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.dark.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: Colors.dark.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
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
    color: Colors.dark.text,
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
    color: Colors.dark.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 12,
  },
  errorText: {
    fontSize: 16,
    color: Colors.dark.accentRed,
    textAlign: 'center',
    marginVertical: 12,
  },
}); 