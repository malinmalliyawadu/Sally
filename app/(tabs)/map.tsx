import { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Alert, TouchableOpacity, Text, Modal, Linking, Platform, Animated, Image, ScrollView, Dimensions, PanResponder } from 'react-native';
import MapView, { Marker, Callout, PROVIDER_GOOGLE, PoiClickEvent, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';

interface JournalEntry {
  id: string;
  title: string;
  content: string;
  location: string;
  coordinates?: { latitude: number; longitude: number };
  date: string;
  timestamp: number;
  photos: string[];
  distanceTraveled?: number;
  placesVisited?: string[];
}

const STORAGE_KEY = '@sally_journal_entries';

// Sample data - replace with real data later
const SAMPLE_POIS = [
  {
    id: '1',
    title: 'Milford Sound',
    description: 'Stunning fiord in Fiordland National Park',
    coordinate: { latitude: -44.6717, longitude: 167.9261 },
    type: 'poi',
  },
  {
    id: '2',
    title: 'Mount Cook',
    description: 'Highest mountain in New Zealand',
    coordinate: { latitude: -43.5950, longitude: 170.1418 },
    type: 'poi',
  },
];

const SAMPLE_CAMPING = [
  {
    id: '3',
    title: 'Lake Pukaki Freedom Camp',
    description: 'Beautiful lake views',
    coordinate: { latitude: -44.1650, longitude: 170.1169 },
    type: 'camping',
  },
  {
    id: '4',
    title: 'Tekapo Freedom Camp',
    description: 'Stargazing paradise',
    coordinate: { latitude: -44.0045, longitude: 170.4776 },
    type: 'camping',
  },
];

interface SelectedPOI {
  name: string;
  latitude: number;
  longitude: number;
  placeId?: string;
  rating?: number;
  userRatingsTotal?: number;
  photos?: string[];
  formattedAddress?: string;
  isOpen?: boolean;
  distance?: string;
  duration?: string;
  type?: 'poi' | 'journal';
  journalEntry?: JournalEntry;
}

// Google Places API key from environment variable
const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || '';

export default function Map() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [selectedPOI, setSelectedPOI] = useState<SelectedPOI | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [galleryVisible, setGalleryVisible] = useState(false);
  const [galleryPhotos, setGalleryPhotos] = useState<string[]>([]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [savedPOI, setSavedPOI] = useState<SelectedPOI | null>(null);
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  const [lineCoordinates, setLineCoordinates] = useState<Array<{latitude: number; longitude: number}>>([]);
  const savedPOIRef = useRef<SelectedPOI | null>(null);
  const slideAnim = useRef(new Animated.Value(300)).current;
  const galleryTranslateY = useRef(new Animated.Value(0)).current;

  // Keep ref in sync with state
  useEffect(() => {
    savedPOIRef.current = savedPOI;
  }, [savedPOI]);

  useEffect(() => {
    loadJournalEntries();
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission needed',
          'Location permission is required to show your position on the map.'
        );
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);
    })();
  }, []);

  // Unified function to close gallery and restore POI modal
  const closeGallery = () => {
    const currentSavedPOI = savedPOIRef.current;
    console.log('Closing gallery, savedPOI:', currentSavedPOI?.name);
    setGalleryVisible(false);
    galleryTranslateY.setValue(0);

    // Restore POI modal if we have a saved one
    if (currentSavedPOI) {
      console.log('Restoring POI modal for:', currentSavedPOI.name);
      setTimeout(() => {
        setSelectedPOI(currentSavedPOI);
        slideAnim.setValue(300);
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          damping: 15,
          stiffness: 150,
          mass: 0.8,
        }).start();
      }, 150);
    }
  };

  const loadJournalEntries = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setJournalEntries(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading journal entries:', error);
    }
  };

  // Filter journal entries that have coordinates
  const journalMarkers = journalEntries.filter(entry => entry.coordinates);

  // Pan responder for swipe down to close gallery
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to vertical swipes
        return Math.abs(gestureState.dy) > Math.abs(gestureState.dx) && Math.abs(gestureState.dy) > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        // Only allow downward swipes
        if (gestureState.dy > 0) {
          galleryTranslateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100) {
          console.log('Swipe down detected, closing gallery');
          // Swiped down enough - close the gallery
          Animated.timing(galleryTranslateY, {
            toValue: Dimensions.get('window').height,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            closeGallery();
          });
        } else {
          // Snap back
          Animated.spring(galleryTranslateY, {
            toValue: 0,
            useNativeDriver: true,
            damping: 20,
          }).start();
        }
      },
    })
  ).current;

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

  const calculateDistanceAndDuration = (destLat: number, destLng: number) => {
    if (!location) {
      return null;
    }

    // Calculate straight-line distance
    const distanceKm = calculateDistance(
      location.coords.latitude,
      location.coords.longitude,
      destLat,
      destLng
    );

    // Format distance
    const distanceText = distanceKm < 1
      ? `${(distanceKm * 1000).toFixed(0)} m`
      : `${distanceKm.toFixed(1)} km`;

    // Estimate driving time (assuming average 50 km/h in cities, 80 km/h otherwise)
    const avgSpeed = distanceKm < 5 ? 40 : 70; // km/h
    const durationMinutes = Math.round((distanceKm / avgSpeed) * 60);

    const durationText = durationMinutes < 60
      ? `${durationMinutes} min`
      : `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m`;

    return {
      distance: distanceText,
      duration: durationText,
    };
  };

  const fetchPlaceDetails = async (placeId: string, lat: number, lng: number) => {
    if (!placeId || !GOOGLE_PLACES_API_KEY) {
      console.log('Google Places API key not configured');
      return null;
    }

    try {
      setLoadingDetails(true);

      // Calculate distance and fetch place details
      const distanceData = calculateDistanceAndDuration(lat, lng);

      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=rating,user_ratings_total,photos,formatted_address,opening_hours&key=${GOOGLE_PLACES_API_KEY}`;
      const response = await fetch(url);
      const placeData = await response.json();

      if (placeData.status === 'OK' && placeData.result) {
        const result = placeData.result;

        // Get photo URLs
        const photos = result.photos?.slice(0, 3).map((photo: any) =>
          `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${GOOGLE_PLACES_API_KEY}`
        ) || [];

        return {
          rating: result.rating,
          userRatingsTotal: result.user_ratings_total,
          photos,
          formattedAddress: result.formatted_address,
          isOpen: result.opening_hours?.open_now,
          distance: distanceData?.distance,
          duration: distanceData?.duration,
        };
      }
    } catch (error) {
      console.error('Error fetching place details:', error);
    } finally {
      setLoadingDetails(false);
    }
    return null;
  };

  const handlePoiClick = async (event: PoiClickEvent) => {
    const { name, coordinate, placeId } = event.nativeEvent;

    // Set basic info first
    const basicInfo: SelectedPOI = {
      name,
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
      placeId,
    };
    setSelectedPOI(basicInfo);

    // Slide up animation - fast and smooth
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      damping: 15,
      stiffness: 150,
      mass: 0.8,
    }).start();

    // Fetch additional details
    if (placeId) {
      const details = await fetchPlaceDetails(placeId, coordinate.latitude, coordinate.longitude);
      if (details) {
        setSelectedPOI({
          ...basicInfo,
          ...details,
        });
      }
    }
  };

  const closeModal = () => {
    Animated.timing(slideAnim, {
      toValue: 300,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setSelectedPOI(null);
      setSelectedMarkerId(null);
    });
  };

  const openDirections = () => {
    if (!selectedPOI) return;

    const { latitude, longitude, name } = selectedPOI;
    const label = encodeURIComponent(name);

    let url = '';
    if (Platform.OS === 'ios') {
      url = `http://maps.apple.com/?daddr=${latitude},${longitude}&q=${label}`;
    } else {
      url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&destination_place_id=${selectedPOI.placeId || ''}`;
    }

    Linking.openURL(url).catch((err) => {
      Alert.alert('Error', 'Unable to open maps');
      console.error('Error opening maps:', err);
    });
  };

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: -41.2865, // Center of New Zealand
          longitude: 174.7762,
          latitudeDelta: 10,
          longitudeDelta: 10,
        }}
        showsUserLocation
        showsMyLocationButton
        showsPointsOfInterest={true}
        showsBuildings={true}
        showsTraffic={false}
        showsIndoors={true}
        onPoiClick={handlePoiClick}
      >
        {/* Points of Interest */}
        {SAMPLE_POIS.map((poi) => (
          <Marker
            key={poi.id}
            coordinate={poi.coordinate}
            title={poi.title}
            description={poi.description}
            pinColor="red"
          />
        ))}

        {/* Freedom Camping Areas */}
        {SAMPLE_CAMPING.map((camp) => (
          <Marker
            key={camp.id}
            coordinate={camp.coordinate}
            title={camp.title}
            description={camp.description}
            pinColor="green"
          />
        ))}

        {/* Journal Entry Markers */}
        {journalMarkers.map((entry) => {
          const isSelected = selectedMarkerId === `journal-${entry.id}`;
          return (
            <Marker
              key={entry.id}
              coordinate={entry.coordinates!}
              tracksViewChanges={false}
              onPress={() => {
                console.log('Journal marker pressed:', entry.title);
                setSelectedMarkerId(`journal-${entry.id}`);
                const distanceData = calculateDistanceAndDuration(
                  entry.coordinates!.latitude,
                  entry.coordinates!.longitude
                );

                setSelectedPOI({
                  name: entry.title,
                  latitude: entry.coordinates!.latitude,
                  longitude: entry.coordinates!.longitude,
                  distance: distanceData?.distance,
                  duration: distanceData?.duration,
                  type: 'journal',
                  journalEntry: entry,
                  photos: entry.photos,
                  formattedAddress: entry.location,
                });

                Animated.spring(slideAnim, {
                  toValue: 0,
                  useNativeDriver: true,
                  damping: 15,
                  stiffness: 150,
                  mass: 0.8,
                }).start();
              }}
            >
              <View style={[
                styles.journalMarker,
                isSelected && styles.journalMarkerSelected
              ]}>
                <Ionicons name="book" size={isSelected ? 24 : 20} color="#fff" />
              </View>
            </Marker>
          );
        })}
      </MapView>

      {/* POI Details Modal */}
      <Modal
        visible={selectedPOI !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalOverlayTouchable}
            activeOpacity={1}
            onPress={closeModal}
          />
          <Animated.View
            style={[
              styles.poiModalWrapper,
              {
                transform: [{ translateY: slideAnim }],
              },
            ]}
            pointerEvents="box-none"
          >
            <View style={styles.poiModal} pointerEvents="auto">
              <View style={styles.poiModalHandle} />

              <View style={styles.poiIconContainer}>
                <View style={[
                  styles.poiIconCircle,
                  selectedPOI?.type === 'journal' && styles.journalIconCircle
                ]}>
                  <Ionicons
                    name={selectedPOI?.type === 'journal' ? 'book' : 'location-sharp'}
                    size={28}
                    color={selectedPOI?.type === 'journal' ? '#10b981' : '#007AFF'}
                  />
                </View>
              </View>

              <Text style={styles.poiName}>{selectedPOI?.name}</Text>

              {/* Journal Entry Date */}
              {selectedPOI?.type === 'journal' && selectedPOI.journalEntry && (
                <Text style={styles.journalDate}>{selectedPOI.journalEntry.date}</Text>
              )}

              {/* Distance and Duration */}
              {(selectedPOI?.distance || selectedPOI?.duration) && (
                <View style={styles.distanceContainer}>
                  {selectedPOI.distance && (
                    <View style={styles.distanceItem}>
                      <Ionicons name="car-outline" size={16} color="#007AFF" />
                      <Text style={styles.distanceText}>{selectedPOI.distance}</Text>
                    </View>
                  )}
                  {selectedPOI.duration && (
                    <View style={styles.distanceItem}>
                      <Ionicons name="time-outline" size={16} color="#007AFF" />
                      <Text style={styles.distanceText}>{selectedPOI.duration}</Text>
                    </View>
                  )}
                </View>
              )}

              {/* Rating */}
              {selectedPOI?.rating && (
                <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={16} color="#FFB800" />
                  <Text style={styles.ratingText}>
                    {selectedPOI.rating.toFixed(1)}
                  </Text>
                  {selectedPOI.userRatingsTotal && (
                    <Text style={styles.ratingCount}>
                      ({selectedPOI.userRatingsTotal})
                    </Text>
                  )}
                  {selectedPOI.isOpen !== undefined && (
                    <View style={[styles.openBadge, selectedPOI.isOpen && styles.openBadgeActive]}>
                      <Text style={[styles.openText, selectedPOI.isOpen && styles.openTextActive]}>
                        {selectedPOI.isOpen ? 'Open' : 'Closed'}
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {/* Address */}
              {selectedPOI?.formattedAddress && (
                <Text style={styles.poiAddress}>{selectedPOI.formattedAddress}</Text>
              )}

              {/* Photos */}
              {selectedPOI?.photos && selectedPOI.photos.length > 0 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.photosScroll}
                  contentContainerStyle={styles.photosContent}
                  scrollEnabled={selectedPOI.photos.length > 1}
                >
                  {selectedPOI.photos.map((photo, index) => (
                    <TouchableOpacity
                      key={index}
                      activeOpacity={0.8}
                      onPress={() => {
                        console.log('Photo tapped:', index);
                        const photos = selectedPOI.photos || [];
                        // Save current POI
                        setSavedPOI(selectedPOI);
                        // Close POI modal first
                        closeModal();
                        // Then open gallery with slight delay
                        setTimeout(() => {
                          setGalleryPhotos(photos);
                          setCurrentPhotoIndex(index);
                          setGalleryVisible(true);
                        }, 300);
                      }}
                      style={styles.photoTouchable}
                    >
                      <Image
                        source={{ uri: photo }}
                        style={styles.poiPhoto}
                      />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}

              {/* Loading indicator */}
              {loadingDetails && (
                <Text style={styles.loadingText}>Loading details...</Text>
              )}

              {/* Journal Entry Content */}
              {selectedPOI?.type === 'journal' && selectedPOI.journalEntry && (
                <View style={styles.journalContent}>
                  <Text style={styles.journalContentText} numberOfLines={3}>
                    {selectedPOI.journalEntry.content}
                  </Text>
                </View>
              )}

              {/* Buttons */}
              <View style={styles.modalButtons}>
                {selectedPOI?.type === 'journal' ? (
                  <>
                    <TouchableOpacity
                      style={[styles.directionsButton, styles.viewEntryButton]}
                      onPress={() => {
                        closeModal();
                        setTimeout(() => {
                          router.push(`/journal?entryId=${selectedPOI.journalEntry?.id}`);
                        }, 200);
                      }}
                    >
                      <View style={styles.directionsButtonContent}>
                        <Ionicons name="book-outline" size={22} color="#fff" />
                        <Text style={styles.directionsButtonText}>View Full Entry</Text>
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.directionsButton, styles.secondaryButton]}
                      onPress={openDirections}
                    >
                      <View style={styles.directionsButtonContent}>
                        <Ionicons name="navigate" size={22} color="#007AFF" />
                        <Text style={[styles.directionsButtonText, styles.secondaryButtonText]}>
                          Get Directions
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </>
                ) : (
                  <TouchableOpacity
                    style={styles.directionsButton}
                    onPress={openDirections}
                  >
                    <View style={styles.directionsButtonContent}>
                      <Ionicons name="navigate" size={22} color="#fff" />
                      <Text style={styles.directionsButtonText}>Get Directions</Text>
                    </View>
                  </TouchableOpacity>
                )}</View>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* Full Screen Image Gallery */}
      <Modal
        visible={galleryVisible}
        transparent={false}
        animationType="fade"
        onRequestClose={() => setGalleryVisible(false)}
      >
        <Animated.View
          style={[
            styles.galleryContainer,
            {
              transform: [{ translateY: galleryTranslateY }],
            },
          ]}
          {...panResponder.panHandlers}
        >
          {/* Scrollable Images */}
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(event) => {
              const index = Math.round(
                event.nativeEvent.contentOffset.x / Dimensions.get('window').width
              );
              setCurrentPhotoIndex(index);
            }}
            contentOffset={{
              x: currentPhotoIndex * Dimensions.get('window').width,
              y: 0
            }}
            key={currentPhotoIndex}
            scrollEnabled={galleryPhotos.length > 1}
          >
            {galleryPhotos.map((photo, index) => (
              <View
                key={index}
                style={styles.galleryImageContainer}
              >
                <Image
                  source={{ uri: photo }}
                  style={styles.galleryImage}
                  resizeMode="contain"
                />
              </View>
            ))}
          </ScrollView>

          {/* Image Counter */}
          {galleryPhotos.length > 1 && (
            <View style={styles.galleryCounter} pointerEvents="none">
              <Text style={styles.galleryCounterText}>
                {currentPhotoIndex + 1} / {galleryPhotos.length}
              </Text>
            </View>
          )}

          {/* Close Button */}
          <TouchableOpacity
            style={styles.galleryCloseButton}
            onPress={() => {
              console.log('Close button pressed');
              closeGallery();
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="close" size={32} color="#fff" />
          </TouchableOpacity>
        </Animated.View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  journalMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  journalMarkerSelected: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 4,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 10,
    transform: [{ scale: 1.1 }],
  },
  calloutContainer: {
    minWidth: 200,
    padding: 12,
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  calloutSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 2,
  },
  calloutLocation: {
    fontSize: 13,
    color: '#9ca3af',
    marginBottom: 8,
  },
  calloutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  calloutButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalOverlayTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  poiModalWrapper: {
    justifyContent: 'flex-end',
  },
  poiModal: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 44,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 15,
  },
  poiModalHandle: {
    width: 36,
    height: 5,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 24,
  },
  poiIconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  poiIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f0f7ff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  journalIconCircle: {
    backgroundColor: '#d1fae5',
    shadowColor: '#10b981',
  },
  poiName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 28,
  },
  poiCoordinates: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  directionsButton: {
    backgroundColor: '#007AFF',
    borderRadius: 16,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  directionsButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 32,
    gap: 10,
  },
  directionsButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#f0f7ff',
    borderRadius: 12,
    marginHorizontal: 24,
  },
  distanceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  distanceText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 12,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  ratingCount: {
    fontSize: 14,
    color: '#9ca3af',
  },
  openBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#fee',
    marginLeft: 8,
  },
  openBadgeActive: {
    backgroundColor: '#d1fae5',
  },
  openText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ef4444',
  },
  openTextActive: {
    color: '#10b981',
  },
  poiAddress: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  photosScroll: {
    marginBottom: 20,
    marginHorizontal: -24,
  },
  photosContent: {
    paddingHorizontal: 24,
    gap: 12,
  },
  photoTouchable: {
    marginRight: 12,
  },
  poiPhoto: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
  },
  loadingText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  journalDate: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 12,
  },
  journalContent: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    marginHorizontal: 0,
  },
  journalContentText: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
  modalButtons: {
    gap: 12,
  },
  viewEntryButton: {
    backgroundColor: '#10b981',
    shadowColor: '#10b981',
  },
  secondaryButton: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#007AFF',
    shadowColor: '#000',
    shadowOpacity: 0.1,
  },
  secondaryButtonText: {
    color: '#007AFF',
  },
  galleryContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  galleryCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 100,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
  },
  galleryCounter: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    zIndex: 50,
    alignItems: 'center',
  },
  galleryCounterText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  galleryImageContainer: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  galleryImage: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
});
