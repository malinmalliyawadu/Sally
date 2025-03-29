import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

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
    <View style={styles.card}>
      <View style={styles.iconContainer}>
        <Ionicons name="bed" size={32} color={Colors.dark.accentPurple} />
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
                color={Colors.dark.accentPurple} 
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
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.dark.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    shadowColor: Colors.dark.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
  },
  iconContainer: {
    marginRight: 16,
    justifyContent: 'center',
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: Colors.dark.textSecondary,
  },
  accommodationName: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.dark.text,
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
    color: Colors.dark.accentPurple,
    marginLeft: 6,
    marginRight: 8,
  },
  priceText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark.textSecondary,
  },
  distance: {
    fontSize: 14,
    color: Colors.dark.tint,
    marginBottom: 4,
  },
  address: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    marginBottom: 10,
  },
  amenitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    alignItems: 'center',
  },
  amenityTag: {
    backgroundColor: 'rgba(155, 89, 182, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 6,
  },
  amenityText: {
    fontSize: 12,
    color: Colors.dark.text,
  },
  moreAmenities: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    marginLeft: 4,
  },
  directionsButton: {
    backgroundColor: Colors.dark.accentPurple,
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
    color: Colors.dark.textSecondary,
    fontStyle: 'italic',
    marginLeft: 8,
  },
  errorText: {
    fontSize: 16,
    color: Colors.dark.accentRed,
  },
}); 