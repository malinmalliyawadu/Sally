import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Image, Linking, Alert } from 'react-native';
import * as Location from 'expo-location';
import Ionicons from '@expo/vector-icons/Ionicons';
import proj4 from 'proj4';

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
  docLink?: string;  // DOC website URL for hiking trails
  trackDistance?: string;  // Track length (e.g., "3.1 km one way")
  walkDuration?: string;  // Walk duration (e.g., "2 hr 30 min one way")
}

interface CacheEntry {
  data: Place[];
  timestamp: number;
  location: { latitude: number; longitude: number };
  nextPageToken?: string;
}

interface DOCTrack {
  assetId: string;
  name: string;
  introduction?: string;
  introductionThumbnail?: string;
  distance?: string;
  walkDuration?: string;
  walkDurationCategory?: string[];
  walkTrackCategory?: string[];
  region?: string[];
  staticLink?: string;
  x: number;
  y: number;
}

type WalkType = 'great-walk' | 'day-walk' | 'short-walk';

// API configuration
const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || '';
const PLACES_API_BASE = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';
const DOC_API_KEY = process.env.EXPO_PUBLIC_DOC_API_KEY || '';
const DOC_API_BASE = 'https://api.doc.govt.nz/v1';

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
// Note: Clear this cache when coordinate conversion changes
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

// Define NZTM (EPSG:2193) projection
// New Zealand Transverse Mercator 2000
proj4.defs('EPSG:2193', '+proj=tmerc +lat_0=0 +lon_0=173 +k=0.9996 +x_0=1600000 +y_0=10000000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs');

// Convert NZTM (x, y) coordinates to WGS84 (lat, lng)
// Uses accurate proj4 transformation
const nztmToWGS84 = (x: number, y: number): { lat: number; lng: number } => {
  // Convert from NZTM (EPSG:2193) to WGS84 (EPSG:4326)
  const [lng, lat] = proj4('EPSG:2193', 'EPSG:4326', [x, y]);
  return { lat, lng };
};

// Get photo URL from photo reference
const getPhotoUrl = (photoReference: string, maxWidth: number = 400): string => {
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photoreference=${photoReference}&key=${GOOGLE_PLACES_API_KEY}`;
};

// Open place in external maps app
const openInMaps = (place: Place) => {
  const buttons: any[] = [
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
  ];

  // Add DOC website option for hiking trails
  if (place.docLink) {
    buttons.push({
      text: 'View on DOC Website',
      onPress: () => {
        Linking.openURL(place.docLink!).catch(() => {
          Alert.alert('Error', 'Unable to open DOC website');
        });
      },
    });
  }

  buttons.push({
    text: 'Cancel',
    style: 'cancel',
  });

  Alert.alert(
    place.docLink ? 'Options' : 'Open in Maps',
    place.docLink ? `${place.name}` : `Navigate to ${place.name}?`,
    buttons
  );
};

// Categorize walk by duration
const categorizeWalk = (durationCategory?: string[], name?: string): WalkType => {
  const greatWalks = [
    'Milford Track', 'Routeburn Track', 'Kepler Track', 'Abel Tasman Coast Track',
    'Heaphy Track', 'Tongariro Northern Circuit', 'Whanganui Journey',
    'Lake Waikaremoana Track', 'Rakiura Track', 'Paparoa Track'
  ];

  if (name && greatWalks.some(gw => name.includes(gw))) {
    return 'great-walk';
  }

  if (!durationCategory || durationCategory.length === 0) {
    return 'short-walk';
  }

  const category = durationCategory[0];
  if (category.includes('1 hour') || category.includes('Under 1 hour')) {
    return 'short-walk';
  }
  return 'day-walk';
};

// Calculate string similarity (0-1, where 1 is identical)
const stringSimilarity = (str1: string, str2: string): number => {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  if (s1 === s2) return 1;

  // Remove common noise words for better matching
  const noiseWords = ['track', 'trail', 'walk', 'walking', 'scenic', 'reserve', 'tramping', 'hike', 'hiking'];

  const cleanString = (str: string) => {
    let cleaned = str;
    noiseWords.forEach(word => {
      cleaned = cleaned.replace(new RegExp(`\\b${word}\\b`, 'gi'), '');
    });
    return cleaned.trim().split(/\s+/).filter(w => w.length > 0);
  };

  const words1 = cleanString(s1);
  const words2 = cleanString(s2);

  // If no meaningful words left after cleaning, use original
  const finalWords1 = words1.length > 0 ? words1 : s1.split(/\s+/);
  const finalWords2 = words2.length > 0 ? words2 : s2.split(/\s+/);

  let matchCount = 0;
  for (const word1 of finalWords1) {
    for (const word2 of finalWords2) {
      if (word1 === word2 || word1.includes(word2) || word2.includes(word1)) {
        matchCount++;
        break;
      }
    }
  }

  // Boost score if there's at least one meaningful match
  const similarity = matchCount / Math.max(finalWords1.length, finalWords2.length);

  // Extra boost if the key identifying words match (first significant word)
  if (finalWords1.length > 0 && finalWords2.length > 0) {
    const firstWord1 = finalWords1[0];
    const firstWord2 = finalWords2[0];
    if (firstWord1 === firstWord2 || firstWord1.includes(firstWord2) || firstWord2.includes(firstWord1)) {
      return Math.min(1, similarity + 0.2); // Boost for matching key identifier
    }
  }

  return similarity;
};

// Score a Google Places result for how well it matches a DOC track
const scoreMatch = (result: any, trackName: string, trackLat: number, trackLng: number): number => {
  let score = 0;

  // 1. Name similarity (0-30 points) - reduced to make room for rating weight
  const nameSimilarity = stringSimilarity(trackName, result.name);
  score += nameSimilarity * 30;

  // 2. Location proximity (0-20 points) - reduced slightly
  const distance = calculateDistance(
    trackLat,
    trackLng,
    result.geometry.location.lat,
    result.geometry.location.lng
  );
  if (distance < 1) score += 20;
  else if (distance < 5) score += 15;
  else if (distance < 10) score += 10;
  else if (distance < 20) score += 5;

  // 3. Relevant types (0-10 points)
  const relevantTypes = ['tourist_attraction', 'natural_feature', 'park', 'point_of_interest'];
  const hasRelevantType = result.types?.some((t: string) => relevantTypes.includes(t));
  if (hasRelevantType) score += 10;

  // 4. Has star rating (0-30 points) - MASSIVELY INCREASED: having ratings is critical!
  if (result.rating) {
    score += 30;
    // Bonus points for higher ratings (0-10 points)
    if (result.rating >= 4.5) score += 10;
    else if (result.rating >= 4.0) score += 7;
    else if (result.rating >= 3.5) score += 5;
  }

  // 5. Rating count (0-20 points) - INCREASED: more reviews = much more likely to be correct
  if (result.user_ratings_total) {
    if (result.user_ratings_total > 200) score += 20;
    else if (result.user_ratings_total > 100) score += 17;
    else if (result.user_ratings_total > 50) score += 14;
    else if (result.user_ratings_total > 20) score += 10;
    else if (result.user_ratings_total > 5) score += 6;
  }

  return score;
};

// Clean search query by removing common noise words
const cleanSearchQuery = (trackName: string): string => {
  const noiseWords = ['track', 'trail', 'walk', 'walking', 'scenic', 'reserve', 'tramping', 'hike', 'hiking', 'great', 'short', 'loop', 'circuit'];

  let cleaned = trackName;
  noiseWords.forEach(word => {
    // Remove whole words only (word boundaries)
    cleaned = cleaned.replace(new RegExp(`\\b${word}\\b`, 'gi'), '');
  });

  // Clean up extra spaces and trim
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  // If nothing meaningful left, return original
  return cleaned.length > 0 ? `${cleaned} hike` : trackName;
};

// Search Google Places for a track name to get ratings (with fuzzy matching)
const searchGooglePlacesForTrack = async (trackName: string, lat: number, lng: number): Promise<{ rating?: number; userRatingsTotal?: number } | null> => {
  if (!GOOGLE_PLACES_API_KEY) return null;

  try {
    // Clean the search query to remove noise words
    const cleanedQuery = cleanSearchQuery(trackName);
    console.log(`🔍 Searching: "${trackName}" → "${cleanedQuery}"`);

    // Use Text Search to find the track
    const params = new URLSearchParams({
      query: cleanedQuery,
      location: `${lat},${lng}`,
      radius: '10000', // 10km radius for fuzzy matching
      key: GOOGLE_PLACES_API_KEY,
    });

    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?${params.toString()}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.results && data.results.length > 0) {
      // Score all results and pick the best match
      let bestMatch = null;
      let bestScore = 0;
      let bestMatchWithRating = null;
      let bestScoreWithRating = 0;

      // Log all candidates for debugging
      console.log(`\n🔍 Searching for: "${trackName}"`);

      for (const result of data.results) {
        const score = scoreMatch(result, trackName, lat, lng);

        console.log(`  - "${result.name}" (score: ${score.toFixed(1)}, rating: ${result.rating || 'none'})`);

        // Track best overall match
        if (score > bestScore) {
          bestScore = score;
          bestMatch = result;
        }

        // Track best match that has a rating
        if (result.rating && score > bestScoreWithRating) {
          bestScoreWithRating = score;
          bestMatchWithRating = result;
        }
      }

      // Decision logic:
      // 1. If we have a match with rating and score >= 35, use it
      // 2. If best overall score is >= 50, use it even without rating (very confident match)
      // 3. Otherwise, no match

      let finalMatch = null;
      let finalScore = 0;

      if (bestMatchWithRating && bestScoreWithRating >= 35) {
        // Prefer matches with ratings if score is decent
        finalMatch = bestMatchWithRating;
        finalScore = bestScoreWithRating;
      } else if (bestMatch && bestScore >= 50) {
        // High confidence match, use even without rating
        finalMatch = bestMatch;
        finalScore = bestScore;
      }

      if (finalMatch && finalMatch.rating) {
        console.log(`✅ Matched "${trackName}" to "${finalMatch.name}" (score: ${finalScore.toFixed(1)}, rating: ${finalMatch.rating}⭐)`);
        return {
          rating: finalMatch.rating,
          userRatingsTotal: finalMatch.user_ratings_total
        };
      } else if (bestMatch) {
        console.log(`❌ No confident match for "${trackName}" - best: "${bestMatch.name}" (score: ${bestScore.toFixed(1)}, has rating: ${!!bestMatch.rating})`);
      }
    }

    return null;
  } catch (error) {
    console.error('Error searching Google Places for track:', error);
    return null;
  }
};

// Fetch DOC track details
const fetchDOCTrackDetail = async (assetId: string): Promise<DOCTrack | null> => {
  if (!DOC_API_KEY) return null;

  try {
    const response = await fetch(`${DOC_API_BASE}/tracks/${assetId}/detail`, {
      headers: {
        'x-api-key': DOC_API_KEY
      }
    });

    if (!response.ok) {
      console.error('DOC API detail error:', response.status);
      return null;
    }

    const detail = await response.json();
    return detail;
  } catch (error) {
    console.error('Error fetching DOC track detail:', error);
    return null;
  }
};

// Fetch DOC tracks
const fetchDOCTracks = async (): Promise<DOCTrack[]> => {
  if (!DOC_API_KEY) {
    console.error('DOC API key not configured');
    return [];
  }

  try {
    const response = await fetch(`${DOC_API_BASE}/tracks`, {
      headers: {
        'x-api-key': DOC_API_KEY
      }
    });

    if (!response.ok) {
      console.error('DOC API error:', response.status);
      return [];
    }

    const tracks = await response.json();
    return tracks;
  } catch (error) {
    console.error('Error fetching DOC tracks:', error);
    return [];
  }
};

// Convert DOC track to Place object
const docTrackToPlace = async (track: DOCTrack, userLat: number, userLng: number): Promise<Place | null> => {
  try {
    const { lat, lng } = nztmToWGS84(track.x, track.y);
    const distance = calculateDistance(userLat, userLng, lat, lng);

    const walkType = categorizeWalk(track.walkDurationCategory, track.name);

    return {
      place_id: track.assetId,
      name: track.name,
      types: ['hiking_trail', walkType],
      vicinity: track.region?.join(', '),
      rating: undefined, // Will be filled by Google Places cross-reference
      user_ratings_total: undefined,
      geometry: {
        location: {
          lat,
          lng
        }
      },
      photos: track.introductionThumbnail ? [{ photo_reference: track.introductionThumbnail }] : undefined,
      opening_hours: undefined,
      distance,
      icon: walkType === 'great-walk' ? 'trophy-outline' :
            walkType === 'day-walk' ? 'trail-sign-outline' : 'walk-outline',
      category: 'hiking'
    };
  } catch (error) {
    console.error('Error converting DOC track:', error);
    return null;
  }
};

// API fetch function
const fetchNearbyPlaces = async (
  latitude: number,
  longitude: number,
  category: Category,
  searchQuery: string = '',
  pageToken?: string
): Promise<{ places: Place[], nextPageToken?: string } | null> => {

  // Special handling for hiking category - use DOC tracks
  if (category === 'hiking') {
    try {
      const docTracks = await fetchDOCTracks();

      // First, convert basic tracks to calculate distances
      const placesPromises = docTracks.map(track => docTrackToPlace(track, latitude, longitude));
      const allPlaces = (await Promise.all(placesPromises)).filter((p): p is Place => p !== null);

      // Filter by distance (within 50km) first
      let nearbyPlaces = allPlaces.filter(p => p.distance < 50);

      // Apply search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        nearbyPlaces = nearbyPlaces.filter(p =>
          p.name.toLowerCase().includes(query) ||
          p.vicinity?.toLowerCase().includes(query)
        );
      }

      // Sort by distance
      nearbyPlaces.sort((a, b) => a.distance - b.distance);

      // Limit to top 20 before fetching details (performance optimization)
      const top20 = nearbyPlaces.slice(0, 20);

      // Fetch details and ratings in parallel but don't block on ratings
      const detailPromises = top20.map(async (place) => {
        // Fetch DOC details (required)
        const detail = await fetchDOCTrackDetail(place.place_id);

        // Fetch Google ratings (optional, non-blocking)
        const ratingsPromise = searchGooglePlacesForTrack(
          place.name,
          place.geometry.location.lat,
          place.geometry.location.lng
        );

        let updatedPlace = { ...place };

        if (detail) {
          updatedPlace = {
            ...updatedPlace,
            photos: detail.introductionThumbnail ? [{ photo_reference: detail.introductionThumbnail }] : place.photos,
            docLink: detail.staticLink,
            trackDistance: detail.distance,
            walkDuration: detail.walkDuration
          };
        }

        // Try to get ratings, but don't block if it fails or is slow
        try {
          const ratings = await Promise.race([
            ratingsPromise,
            new Promise(resolve => setTimeout(() => resolve(null), 2000)) // 2 second timeout
          ]);

          if (ratings) {
            updatedPlace = {
              ...updatedPlace,
              rating: ratings.rating,
              user_ratings_total: ratings.userRatingsTotal
            };
          }
        } catch (error) {
          // Ratings fetch failed, continue without them
          console.log('Could not fetch ratings for', place.name);
        }

        return updatedPlace;
      });

      const placesWithDetailsAndRatings = await Promise.all(detailPromises);

      return { places: placesWithDetailsAndRatings };
    } catch (error) {
      console.error('Error fetching DOC tracks:', error);
      return null;
    }
  }

  // For all other categories, use Google Places API
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

      // Special handling for hiking - progressive rendering
      if (selectedCategory === 'hiking') {
        try {
          // Step 1: Fetch all DOC tracks
          const docTracks = await fetchDOCTracks();

          // Step 2: Convert to basic places (fast, synchronous)
          const placesPromises = docTracks.map(track => docTrackToPlace(track, location.coords.latitude, location.coords.longitude));
          const allPlaces = (await Promise.all(placesPromises)).filter((p): p is Place => p !== null);

          // Step 3: Filter and sort
          let nearbyPlaces = allPlaces.filter(p => p.distance < 50);

          if (debouncedSearchQuery.trim()) {
            const query = debouncedSearchQuery.toLowerCase();
            nearbyPlaces = nearbyPlaces.filter(p =>
              p.name.toLowerCase().includes(query) ||
              p.vicinity?.toLowerCase().includes(query)
            );
          }

          nearbyPlaces.sort((a, b) => a.distance - b.distance);
          const top20 = nearbyPlaces.slice(0, 20);

          // Step 4: Show basic results immediately (non-blocking)
          setPlaces(top20);
          setLoading(false);

          // Step 5: Progressively enhance with details and ratings (background)
          // This runs async without blocking the UI
          top20.forEach(async (place, index) => {
            try {
              // Fetch DOC details
              const detail = await fetchDOCTrackDetail(place.place_id);

              // Fetch Google ratings with timeout (non-blocking)
              const ratingsPromise = searchGooglePlacesForTrack(
                place.name,
                place.geometry.location.lat,
                place.geometry.location.lng
              );

              let updatedPlace = { ...place };

              if (detail) {
                updatedPlace = {
                  ...updatedPlace,
                  photos: detail.introductionThumbnail ? [{ photo_reference: detail.introductionThumbnail }] : place.photos,
                  docLink: detail.staticLink,
                  trackDistance: detail.distance,
                  walkDuration: detail.walkDuration
                };
              }

              // Try to get ratings with 2 second timeout
              try {
                const ratings = await Promise.race([
                  ratingsPromise,
                  new Promise(resolve => setTimeout(() => resolve(null), 2000))
                ]);

                if (ratings) {
                  updatedPlace = {
                    ...updatedPlace,
                    rating: ratings.rating,
                    user_ratings_total: ratings.userRatingsTotal
                  };
                }
              } catch (error) {
                // Ratings fetch failed, continue without them
              }

              // Update this specific place in the list
              setPlaces(currentPlaces => {
                const newPlaces = [...currentPlaces];
                newPlaces[index] = updatedPlace;
                return newPlaces;
              });
            } catch (error) {
              console.error('Error enhancing place:', place.name, error);
            }
          });

          // Cache the basic results
          setCachedPlaces(selectedCategory, debouncedSearchQuery, top20, location.coords);

        } catch (error) {
          console.error('Error fetching DOC tracks:', error);
          setError('Failed to load hiking trails. Please check your connection.');
          setPlaces([]);
          setLoading(false);
        }
      } else {
        // For all other categories, use the original flow
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
      }
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
                      source={{
                        uri: place.photos[0].photo_reference.startsWith('http')
                          ? place.photos[0].photo_reference  // DOC direct URL
                          : getPhotoUrl(place.photos[0].photo_reference)  // Google photo reference
                      }}
                      style={styles.placeImage}
                      resizeMode="cover"
                    />
                  )}

                  <View style={styles.placeContent}>
                    <View style={styles.placeIconContainer}>
                      <Ionicons name={place.icon} size={24} color="#007AFF" />
                    </View>
                    <View style={styles.placeInfo}>
                      <View style={styles.placeHeader}>
                        <Text style={styles.placeName}>{place.name}</Text>
                        {/* Walk Type Badge */}
                        {place.types.includes('great-walk') && (
                          <View style={[styles.walkTypeBadge, styles.greatWalkBadge]}>
                            <Text style={styles.walkTypeBadgeText}>Great Walk</Text>
                          </View>
                        )}
                        {place.types.includes('day-walk') && (
                          <View style={[styles.walkTypeBadge, styles.dayWalkBadge]}>
                            <Text style={styles.walkTypeBadgeText}>Day Walk</Text>
                          </View>
                        )}
                        {place.types.includes('short-walk') && (
                          <View style={[styles.walkTypeBadge, styles.shortWalkBadge]}>
                            <Text style={styles.walkTypeBadgeText}>Short Walk</Text>
                          </View>
                        )}
                      </View>

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

                      {/* Track Distance & Duration (for hiking trails) */}
                      {(place.trackDistance || place.walkDuration) && (
                        <View style={styles.trackInfoContainer}>
                          {place.trackDistance && (
                            <View style={styles.trackInfoItem}>
                              <Ionicons name="resize-outline" size={14} color="#6b7280" />
                              <Text style={styles.trackInfoText}>{place.trackDistance}</Text>
                            </View>
                          )}
                          {place.walkDuration && (
                            <View style={styles.trackInfoItem}>
                              <Ionicons name="time-outline" size={14} color="#6b7280" />
                              <Text style={styles.trackInfoText}>{place.walkDuration}</Text>
                            </View>
                          )}
                        </View>
                      )}

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
  placeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  placeName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  walkTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  greatWalkBadge: {
    backgroundColor: '#FFD700',
  },
  dayWalkBadge: {
    backgroundColor: '#007AFF',
  },
  shortWalkBadge: {
    backgroundColor: '#10b981',
  },
  walkTypeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  placeDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 6,
  },
  trackInfoContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 6,
  },
  trackInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trackInfoText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
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
