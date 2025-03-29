import * as Location from 'expo-location';
import axios from 'axios';
import { Accommodation } from '../components/dashboard/AccommodationCard';

// Types
export interface LocationData {
  latitude: number;
  longitude: number;
  placeName?: string;
}

export interface PetrolStation {
  name: string;
  distance: number;
  address: string;
  latitude: number;
  longitude: number;
}

export interface HourlyForecast {
  time: string; // Format: "HH:MM"
  temp: number;
  condition: string;
  icon: string;
}

export interface WeatherData {
  hourlyForecasts: HourlyForecast[];
  currentTemp: number;
  currentCondition: string;
}

// Get current location
export const getCurrentLocation = async (): Promise<LocationData | null> => {
  try {
    // Request permission
    const { status } = await Location.requestForegroundPermissionsAsync();
    
    if (status !== 'granted') {
      console.error('Location permission not granted');
      return null;
    }
    
    // Get location
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    
    // Get place name using reverse geocoding
    const reverseGeocode = await Location.reverseGeocodeAsync({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    });
    
    const placeName = reverseGeocode[0]?.city || 
                      reverseGeocode[0]?.region || 
                      'Unknown location';
    
    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      placeName,
    };
  } catch (error) {
    console.error('Error getting location:', error);
    return null;
  }
};

// Get nearby petrol stations
// Note: You would need to use a real API key for Google Places or similar service
export const getNearbyPetrolStations = async (
  latitude: number, 
  longitude: number
): Promise<PetrolStation[]> => {
  try {
    // This is a placeholder - in a real app, you'd use a Places API like Google Places
    // const apiKey = 'YOUR_GOOGLE_PLACES_API_KEY';
    // const response = await axios.get(
    //   `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=5000&type=gas_station&key=${apiKey}`
    // );
    
    // For demo purposes, return mock data
    return [
      {
        name: 'BP Service Station',
        distance: 1.2,
        address: '123 Main Road, Auckland',
        latitude: latitude + 0.01,
        longitude: longitude + 0.01,
      },
      {
        name: 'Z Energy',
        distance: 2.8,
        address: '456 Highway Drive, Auckland',
        latitude: latitude - 0.01,
        longitude: longitude - 0.01,
      },
    ];
  } catch (error) {
    console.error('Error getting petrol stations:', error);
    return [];
  }
};

// Get weather forecast
export const getWeatherForecast = async (
  latitude: number, 
  longitude: number
): Promise<WeatherData | null> => {
  try {
    // This is a placeholder - in a real app, you'd use a weather API like OpenWeatherMap
    // const apiKey = 'YOUR_OPENWEATHERMAP_API_KEY';
    // const response = await axios.get(
    //   `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&units=metric&appid=${apiKey}`
    // );
    
    // For demo purposes, return mock data
    const currentTime = new Date();
    const hourlyForecasts: HourlyForecast[] = [];
    
    // Generate 24 hours of forecast data
    for (let i = 0; i < 24; i++) {
      const forecastTime = new Date(currentTime);
      forecastTime.setHours(forecastTime.getHours() + i);
      
      const hour = forecastTime.getHours();
      const isNight = hour >= 19 || hour <= 6;
      const conditions = [
        'Clear', 'Partly Cloudy', 'Cloudy', 'Light Rain', 'Rain', 'Sunny'
      ];
      
      // Simulate temperature fluctuations based on time of day
      let temp = 18; // Base temperature
      if (hour >= 11 && hour <= 15) {
        // Warmer during mid-day
        temp += 4 + Math.random() * 2;
      } else if (hour >= 0 && hour <= 5) {
        // Cooler during early morning
        temp -= 4 + Math.random() * 3;
      } else if (hour >= 19) {
        // Cooling down in evening
        temp -= 2 + Math.random() * 2;
      }
      
      // Add some randomness to temperatures
      temp += (Math.random() * 2 - 1);
      temp = Math.round(temp * 10) / 10; // Round to 1 decimal place
      
      // Pick a random condition, but weight it by time of day
      let condition;
      if (isNight) {
        condition = Math.random() > 0.7 ? 'Clear' : 'Partly Cloudy';
      } else {
        condition = conditions[Math.floor(Math.random() * conditions.length)];
      }
      
      const icon = isNight ? '🌙' : '☀️';
      
      hourlyForecasts.push({
        time: `${forecastTime.getHours().toString().padStart(2, '0')}:00`,
        temp,
        condition,
        icon,
      });
    }
    
    return {
      hourlyForecasts,
      currentTemp: hourlyForecasts[0].temp,
      currentCondition: hourlyForecasts[0].condition,
    };
  } catch (error) {
    console.error('Error getting weather:', error);
    return null;
  }
};

// Get nearby accommodations
export const getNearbyAccommodations = async (
  latitude: number, 
  longitude: number
): Promise<Accommodation[]> => {
  try {
    // This is a placeholder - in a real app, you'd use an API
    // For demo purposes, return mock data
    const accommodations: Accommodation[] = [
      {
        name: 'Queenstown Holiday Park',
        type: 'holiday_park',
        address: '230 Lake Esplanade, Queenstown',
        distance: 2.3,
        price: '$25-45/night',
        amenities: ['Power Sites', 'Showers', 'Kitchen', 'WiFi', 'Laundry'],
        isOpen: true,
        rating: 4.2,
        latitude: latitude + 0.02,
        longitude: longitude - 0.01,
      },
      {
        name: 'Moke Lake DOC Campsite',
        type: 'doc_site',
        address: 'Moke Lake Road, Queenstown',
        distance: 7.8,
        price: '$15/night',
        amenities: ['Toilets', 'Lake View', 'Hiking Trails'],
        isOpen: true,
        rating: 4.7,
        latitude: latitude - 0.03,
        longitude: longitude + 0.02,
      },
      {
        name: 'Twelve Mile Delta Campground',
        type: 'campground',
        address: 'Glenorchy-Queenstown Road',
        distance: 5.4,
        price: '$20/night',
        amenities: ['Toilets', 'Water', 'Lake Access', 'Picnic Tables'],
        isOpen: true,
        rating: 4.5,
        latitude: latitude + 0.01,
        longitude: longitude + 0.03,
      },
      {
        name: 'Wilson Bay',
        type: 'freedom_camping',
        address: 'Glenorchy-Queenstown Road',
        distance: 8.9,
        amenities: ['Lake Access', 'Self-Contained Only'],
        isOpen: true,
        latitude: latitude - 0.02,
        longitude: longitude - 0.03,
      }
    ];
    
    return accommodations.sort((a, b) => a.distance - b.distance);
  } catch (error) {
    console.error('Error getting accommodations:', error);
    return [];
  }
}; 