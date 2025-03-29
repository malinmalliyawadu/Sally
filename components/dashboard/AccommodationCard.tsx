import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';

export interface Accommodation {
  name: string;
  type: 'campground' | 'holiday_park' | 'freedom_camping' | 'doc_site';
  address: string;
  distance: number;
  price?: string;
  amenities: string[];
  isOpen: boolean;
  rating?: number;
  latitude: number;
  longitude: number;
}

interface AccommodationCardProps {
  accommodation: Accommodation | null;
  isLoading: boolean;
}

export default function AccommodationCard({ accommodation, isLoading }: AccommodationCardProps) {
  
  const getAccommodationIcon = (type: string) => {
    switch(type) {
      case 'campground': return 'bonfire';
      case 'holiday_park': return 'home';
      case 'freedom_camping': return 'leaf';
      case 'doc_site': return 'trail-sign';
      default: return 'bed';
    }
  };
  
  const getAccommodationLabel = (type: string) => {
    switch(type) {
      case 'campground': return 'Campground';
      case 'holiday_park': return 'Holiday Park';
      case 'freedom_camping': return 'Freedom Camping';
      case 'doc_site': return 'DOC Campsite';
      default: return 'Accommodation';
    }
  };
  
  const openMaps = () => {
    if (!accommodation) return;
    
    const { latitude, longitude, name } = accommodation;
    const label = encodeURI(name);
    const url = Platform.select({
      ios: `maps:?q=${label}&ll=${latitude},${longitude}`,
      android: `geo:${latitude},${longitude}?q=${label}`,
    });
    
    if (url) {
      Linking.openURL(url).catch(err => console.error('An error occurred', err));
    }
  };
  
  return (
    <LinearGradient
      colors={['#922B21', '#641E16']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <View style={styles.iconContainer}>
        <Ionicons name="bed" size={32} color="#FADBD8" />
      </View>
      <View style={styles.contentContainer}>
        <Text style={styles.title}>Stay Tonight</Text>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={Colors.dark.tint} />
            <Text style={styles.loadingText}>Finding places to stay...</Text>
          </View>
        ) : accommodation ? (
          <>
            <Text style={styles.accommodationName}>{accommodation.name}</Text>
            <View style={styles.typeContainer}>
              <Ionicons 
                name={getAccommodationIcon(accommodation.type)} 
                size={14} 
                color="#FADBD8" 
              />
              <Text style={styles.typeText}>
                {getAccommodationLabel(accommodation.type)}
              </Text>
              {accommodation.price && (
                <Text style={styles.priceText}>{accommodation.price}</Text>
              )}
            </View>
            <Text style={styles.distance}>{accommodation.distance.toFixed(1)} km away</Text>
            <Text style={styles.address}>{accommodation.address}</Text>
            
            <View style={styles.amenitiesContainer}>
              {accommodation.amenities.slice(0, 3).map((amenity, index) => (
                <View key={index} style={styles.amenityTag}>
                  <Text style={styles.amenityText}>{amenity}</Text>
                </View>
              ))}
              {accommodation.amenities.length > 3 && (
                <Text style={styles.moreAmenities}>+{accommodation.amenities.length - 3} more</Text>
              )}
            </View>
            
            <TouchableOpacity style={styles.directionsButton} onPress={openMaps}>
              <Ionicons name="navigate" size={16} color="white" />
              <Text style={styles.directionsText}>Get Directions</Text>
            </TouchableOpacity>
          </>
        ) : (
          <Text style={styles.errorText}>No accommodation found nearby</Text>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    shadowColor: Colors.dark.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  iconContainer: {
    marginRight: 16,
    justifyContent: 'flex-start',
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  accommodationName: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  typeText: {
    fontSize: 14,
    fontWeight: '500',
    color: "#FADBD8",
    marginLeft: 6,
    marginRight: 8,
  },
  priceText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  distance: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  address: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 10,
  },
  amenitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    alignItems: 'center',
  },
  amenityTag: {
    backgroundColor: 'rgba(219, 145, 140, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 6,
  },
  amenityText: {
    fontSize: 12,
    color: 'white',
  },
  moreAmenities: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginLeft: 4,
  },
  directionsButton: {
    backgroundColor: '#922B21',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  directionsText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 6,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  loadingText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    fontStyle: 'italic',
    marginLeft: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#FADBD8',
  },
}); 