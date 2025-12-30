import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Image, Linking, Alert } from 'react-native';
import * as Location from 'expo-location';
import Ionicons from '@expo/vector-icons/Ionicons';

type Category = 'all' | 'food' | 'fuel' | 'camping' | 'attractions' | 'hiking';

interface Place {
  place_id: string;
  name: string;
  types: string[];
  vicinity?: string;
  rating?: number;
  user_ratings_total?: number;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  photos?: Array<{ photo_reference: string }>;
  opening_hours?: { open_now: boolean };
  // Computed fields
  distance: number;
  icon: keyof typeof Ionicons.glyphMap;
  category: Category;
}

interface CacheEntry {
  data: Place[];
  timestamp: number;
  location: { latitude: number; longitude: number };
  nextPageToken?: string;
}

// API configuration
const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || '';
const PLACES_API_BASE = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';

// Category to Google Places type mapping
const CATEGORY_TYPE_MAPPING: Record<Category, string[] | null> = {
  all: null,
  food: ['restaurant', 'cafe', 'bakery', 'meal_takeaway'],
  fuel: ['gas_station'],
  camping: ['campground', 'rv_park', 'park'],
  attractions: ['tourist_attraction', 'museum', 'art_gallery', 'zoo', 'natural_feature'],
  hiking: ['park', 'natural_feature']
};

// Search radius by category (meters)
const CATEGORY_RADIUS: Record<Category, number> = {
  all: 5000,
  food: 3000,
  fuel: 5000,
  camping: 15000,
  attractions: 20000,
  hiking: 20000
};

// Icon mapping (Google Places types → Ionicons)
const TYPE_ICON_MAPPING: Record<string, keyof typeof Ionicons.glyphMap> = {
  restaurant: 'restaurant-outline',
  cafe: 'cafe-outline',
  bakery: 'storefront-outline',
  bar: 'beer-outline',
  meal_takeaway: 'fast-food-outline',
  meal_delivery: 'bicycle-outline',
  gas_station: 'car-outline',
  campground: 'bonfire-outline',
  rv_park: 'bonfire-outline',
  park: 'leaf-outline',
  tourist_attraction: 'image-outline',
  museum: 'library-outline',
  art_gallery: 'color-palette-outline',
  zoo: 'paw-outline',
  natural_feature: 'mountain-outline',
  default: 'location-outline'
};

// Cache configuration
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const LOCATION_CHANGE_THRESHOLD_KM = 1;

// Cache storage
let placesCache = new Map<string, CacheEntry>();

const CATEGORIES = [
  { id: 'all', label: 'All', icon: 'apps-outline' },
  { id: 'food', label: 'Food', icon: 'restaurant-outline' },
  { id: 'fuel', label: 'Fuel', icon: 'car-outline' },
  { id: 'camping', label: 'Camping', icon: 'bonfire-outline' },
  { id: 'attractions', label: 'Attractions', icon: 'image-outline' },
  { id: 'hiking', label: 'Hiking', icon: 'trail-sign-outline' },
] as const;

// Helper Functions

// Haversine distance calculation
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Select appropriate icon based on place types
const getIconForPlace = (types: string[], category: Category): keyof typeof Ionicons.glyphMap => {
  for (const type of types) {
    if (TYPE_ICON_MAPPING[type]) {
      return TYPE_ICON_MAPPING[type];
    }
  }
  const categoryDef = CATEGORIES.find(c => c.id === category);
  return (categoryDef?.icon as keyof typeof Ionicons.glyphMap) || 'location-outline';
};

// Match Google Places types to our categories
const matchCategory = (types: string[]): Category => {
  for (const [category, placeTypes] of Object.entries(CATEGORY_TYPE_MAPPING)) {
    if (!placeTypes) continue;
    if (types.some(t => placeTypes.includes(t))) {
      return category as Category;
    }
  }
  return 'all';
};

// Cache management functions
const getCacheKey = (category: Category, searchQuery: string): string => {
  return `${category}:${searchQuery}`;
};

const getCachedPlaces = (
  category: Category,
  searchQuery: string,
  currentLocation: { latitude: number; longitude: number }
): CacheEntry | null => {
  const key = getCacheKey(category, searchQuery);
  const cached = placesCache.get(key);

  if (!cached) return null;

  // Check TTL
  if (Date.now() - cached.timestamp > CACHE_TTL_MS) {
    placesCache.delete(key);
    return null;
  }

  // Check location change >1km
  const distance = calculateDistance(
    cached.location.latitude,
    cached.location.longitude,
    currentLocation.latitude,
    currentLocation.longitude
  );

  if (distance > LOCATION_CHANGE_THRESHOLD_KM) {
    placesCache.delete(key);
    return null;
  }

  return cached;
};

const setCachedPlaces = (
  category: Category,
  searchQuery: string,
  places: Place[],
  location: { latitude: number; longitude: number },
  nextPageToken?: string
) => {
  const key = getCacheKey(category, searchQuery);
  placesCache.set(key, {
    data: places,
    timestamp: Date.now(),
    location,
    nextPageToken
  });
};

// Get photo URL from photo reference
const getPhotoUrl = (photoReference: string, maxWidth: number = 400): string => {
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photoreference=${photoReference}&key=${GOOGLE_PLACES_API_KEY}`;
};

// Open place in external maps app
const openInMaps = (place: Place) => {
  Alert.alert(
    'Open in Maps',
    `Navigate to ${place.name}?`,
    [
      {
        text: 'Apple Maps',
        onPress: () => {
          const url = `maps://maps.apple.com/?q=${encodeURIComponent(place.name)}&ll=${place.geometry.location.lat},${place.geometry.location.lng}`;
          Linking.openURL(url).catch(() => {
            Alert.alert('Error', 'Unable to open Apple Maps');
          });
        },
      },
      {
        text: 'Google Maps',
        onPress: () => {
          const url = `https://www.google.com/maps/search/?api=1&query=${place.geometry.location.lat},${place.geometry.location.lng}&query_place_id=${place.place_id}`;
          Linking.openURL(url).catch(() => {
            Alert.alert('Error', 'Unable to open Google Maps');
          });
        },
      },
      {
        text: 'Cancel',
        style: 'cancel',
      },
    ]
  );
};

// API fetch function
const fetchNearbyPlaces = async (
  latitude: number,
  longitude: number,
  category: Category,
  searchQuery: string = '',
  pageToken?: string
): Promise<{ places: Place[], nextPageToken?: string } | null> => {

  if (!GOOGLE_PLACES_API_KEY) {
    console.error('Google Places API key not configured');
    return null;
  }

  try {
    const params = new URLSearchParams({
      location: `${latitude},${longitude}`,
      radius: CATEGORY_RADIUS[category].toString(),
      key: GOOGLE_PLACES_API_KEY,
    });

    // Add type filter
    if (category !== 'all' && CATEGORY_TYPE_MAPPING[category]) {
      const types = CATEGORY_TYPE_MAPPING[category];
      if (types) {
        params.append('type', types.join('|'));
      }
    }

    // Add search keyword
    if (searchQuery.trim()) {
      params.append('keyword', searchQuery.trim());
    }

    // Add pagination token
    if (pageToken) {
      params.append('pagetoken', pageToken);
    }

    const url = `${PLACES_API_BASE}?${params.toString()}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('Google Places API error:', data.status, data.error_message);
      return null;
    }

    if (data.status === 'ZERO_RESULTS') {
      return { places: [] };
    }

    // Transform results
    const places: Place[] = data.results.map((result: any) => {
      const distance = calculateDistance(
        latitude,
        longitude,
        result.geometry.location.lat,
        result.geometry.location.lng
      );

      const resultCategory = matchCategory(result.types);

      return {
        place_id: result.place_id,
        name: result.name,
        types: result.types,
        vicinity: result.vicinity,
        rating: result.rating,
        user_ratings_total: result.user_ratings_total,
        geometry: result.geometry,
        photos: result.photos,
        opening_hours: result.opening_hours,
        distance,
        icon: getIconForPlace(result.types, resultCategory),
        category: resultCategory,
      };
    });

    // Sort by distance
    places.sort((a, b) => a.distance - b.distance);

    return { places, nextPageToken: data.next_page_token };

  } catch (error) {
    console.error('Error fetching nearby places:', error);
    return null;
  }
};

export default function Explore() {
  const [selectedCategory, setSelectedCategory] = useState<Category>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>();
  const [loadingMore, setLoadingMore] = useState(false);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  // Get location permission
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const currentLocation = await Location.getCurrentPositionAsync({});
        setLocation(currentLocation);
      }
    })();
  }, []);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchQuery(searchQuery), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch places when location, category, or search changes
  useEffect(() => {
    if (!location) return;

    const loadPlaces = async () => {
      // Check cache
      const cached = getCachedPlaces(selectedCategory, debouncedSearchQuery, location.coords);
      if (cached) {
        console.log('Using cached places');
        setPlaces(cached.data);
        setNextPageToken(cached.nextPageToken);
        setError(null);
        return;
      }

      // Fetch from API
      setLoading(true);
      setError(null);

      const result = await fetchNearbyPlaces(
        location.coords.latitude,
        location.coords.longitude,
        selectedCategory,
        debouncedSearchQuery
      );

      if (result) {
        setPlaces(result.places);
        setNextPageToken(result.nextPageToken);
        setCachedPlaces(selectedCategory, debouncedSearchQuery, result.places, location.coords, result.nextPageToken);
      } else {
        setError('Failed to load places. Please check your connection.');
        setPlaces([]);
      }

      setLoading(false);
    };

    loadPlaces();
  }, [location, selectedCategory, debouncedSearchQuery]);

  // Load more handler
  const handleLoadMore = async () => {
    if (!location || !nextPageToken || loadingMore) return;

    setLoadingMore(true);
    const result = await fetchNearbyPlaces(
      location.coords.latitude,
      location.coords.longitude,
      selectedCategory,
      debouncedSearchQuery,
      nextPageToken
    );

    if (result) {
      const newPlaces = [...places, ...result.places];
      setPlaces(newPlaces);
      setNextPageToken(result.nextPageToken);
      setCachedPlaces(selectedCategory, debouncedSearchQuery, newPlaces, location.coords, result.nextPageToken);
    }

    setLoadingMore(false);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Explore</Text>
        <Text style={styles.subtitle}>Discover nearby places</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#9ca3af" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search places..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#9ca3af"
        />
      </View>

      {/* Category Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
        contentContainerStyle={styles.categoriesContent}
      >
        {CATEGORIES.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryChip,
              selectedCategory === category.id && styles.categoryChipActive,
            ]}
            onPress={() => setSelectedCategory(category.id as Category)}
          >
            <Ionicons
              name={category.icon}
              size={18}
              color={selectedCategory === category.id ? '#fff' : '#007AFF'}
            />
            <Text
              style={[
                styles.categoryLabel,
                selectedCategory === category.id && styles.categoryLabelActive,
              ]}
            >
              {category.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Loading State */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Finding places nearby...</Text>
        </View>
      )}

      {/* Error State */}
      {error && !loading && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              placesCache.clear();
              setError(null);
            }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Places List */}
      {!loading && !error && (
        <ScrollView style={styles.placesList} contentContainerStyle={styles.placesContent}>
          {places.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="location-outline" size={48} color="#9ca3af" />
              <Text style={styles.emptyText}>
                {searchQuery ? `No places found for "${searchQuery}"` : 'No places found nearby'}
              </Text>
              <Text style={styles.emptySubtext}>Try adjusting your search or category filter</Text>
            </View>
          ) : (
            <>
              {places.map((place) => (
                <TouchableOpacity
                  key={place.place_id}
                  style={styles.placeCard}
                  onPress={() => openInMaps(place)}
                >
                  {/* Place Photo */}
                  {place.photos && place.photos.length > 0 && (
                    <Image
                      source={{ uri: getPhotoUrl(place.photos[0].photo_reference) }}
                      style={styles.placeImage}
                      resizeMode="cover"
                    />
                  )}

                  <View style={styles.placeContent}>
                    <View style={styles.placeIconContainer}>
                      <Ionicons name={place.icon} size={24} color="#007AFF" />
                    </View>
                    <View style={styles.placeInfo}>
                      <Text style={styles.placeName}>{place.name}</Text>

                      {/* Rating */}
                      {place.rating && (
                        <View style={styles.placeRating}>
                          <Ionicons name="star" size={14} color="#FFB800" />
                          <Text style={styles.placeRatingText}>{place.rating.toFixed(1)}</Text>
                          {place.user_ratings_total && (
                            <Text style={styles.placeRatingCount}>({place.user_ratings_total})</Text>
                          )}
                          {place.opening_hours?.open_now !== undefined && (
                            <View
                              style={[
                                styles.openBadge,
                                place.opening_hours.open_now && styles.openBadgeActive,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.openBadgeText,
                                  place.opening_hours.open_now && styles.openBadgeTextActive,
                                ]}
                              >
                                {place.opening_hours.open_now ? 'Open' : 'Closed'}
                              </Text>
                            </View>
                          )}
                        </View>
                      )}

                      <Text style={styles.placeDescription} numberOfLines={1}>
                        {place.vicinity}
                      </Text>

                      <View style={styles.placeFooter}>
                        <Ionicons name="navigate-outline" size={14} color="#9ca3af" />
                        <Text style={styles.placeDistance}>
                          {place.distance < 1
                            ? `${(place.distance * 1000).toFixed(0)}m`
                            : `${place.distance.toFixed(1)}km`} away
                        </Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward-outline" size={20} color="#9ca3af" />
                  </View>
                </TouchableOpacity>
              ))}

              {/* Load More Button */}
              {nextPageToken && (
                <TouchableOpacity
                  style={styles.loadMoreButton}
                  onPress={handleLoadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? (
                    <ActivityIndicator size="small" color="#007AFF" />
                  ) : (
                    <>
                      <Ionicons name="add-circle-outline" size={20} color="#007AFF" />
                      <Text style={styles.loadMoreText}>Load More Places</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 17,
    color: '#6b7280',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: '#1a1a1a',
  },
  categoriesContainer: {
    maxHeight: 50,
    marginBottom: 16,
  },
  categoriesContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#007AFF',
    gap: 6,
  },
  categoryChipActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  categoryLabelActive: {
    color: '#ffffff',
  },
  placesList: {
    flex: 1,
  },
  placesContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  placeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  placeImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#f0f7ff',
  },
  placeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  placeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  placeInfo: {
    flex: 1,
  },
  placeName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  placeDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 6,
  },
  placeFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  placeDistance: {
    fontSize: 13,
    color: '#9ca3af',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 16,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    marginTop: 16,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#007AFF',
    borderRadius: 12,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  placeRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  placeRatingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  placeRatingCount: {
    fontSize: 13,
    color: '#9ca3af',
  },
  openBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#fee2e2',
    marginLeft: 6,
  },
  openBadgeActive: {
    backgroundColor: '#d1fae5',
  },
  openBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ef4444',
  },
  openBadgeTextActive: {
    color: '#10b981',
  },
  loadMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: '#007AFF',
    gap: 8,
  },
  loadMoreText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
});
