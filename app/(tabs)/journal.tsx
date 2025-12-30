import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams } from 'expo-router';

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
const LOCATION_HISTORY_KEY = '@sally_location_history';

export default function Journal() {
  const params = useLocalSearchParams();
  const scrollViewRef = useRef<ScrollView>(null);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newPhotos, setNewPhotos] = useState<string[]>([]);
  const [currentLocation, setCurrentLocation] = useState('Unknown location');
  const [currentCoordinates, setCurrentCoordinates] = useState<{ latitude: number; longitude: number } | undefined>();
  const [suggestedTitle, setSuggestedTitle] = useState('');
  const [distanceTraveled, setDistanceTraveled] = useState(0);
  const [placesVisited, setPlacesVisited] = useState<string[]>([]);
  const [suggestedPhotos, setSuggestedPhotos] = useState<string[]>([]);
  const [highlightedEntryId, setHighlightedEntryId] = useState<string | null>(null);

  useEffect(() => {
    loadEntries();
    getCurrentLocation();
    requestPermissions();
  }, []);

  // Handle entry highlighting from map
  useEffect(() => {
    if (params.entryId && typeof params.entryId === 'string') {
      setHighlightedEntryId(params.entryId);
      // Clear highlight after 3 seconds
      setTimeout(() => {
        setHighlightedEntryId(null);
      }, 3000);
    }
  }, [params.entryId]);

  const requestPermissions = async () => {
    await ImagePicker.requestCameraPermissionsAsync();
    await ImagePicker.requestMediaLibraryPermissionsAsync();
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status === 'granted') {
      await fetchTodaysPhotos();
    }
  };

  const fetchTodaysPhotos = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayTimestamp = today.getTime() / 1000;

      const assets = await MediaLibrary.getAssetsAsync({
        first: 20,
        mediaType: 'photo',
        sortBy: ['creationTime'],
        createdAfter: todayTimestamp,
      });

      if (assets.assets.length > 0) {
        // Get full asset info to get proper URIs
        const photoPromises = assets.assets.map(asset =>
          MediaLibrary.getAssetInfoAsync(asset.id)
        );
        const photoInfos = await Promise.all(photoPromises);
        const photoUris = photoInfos.map(info => info.localUri || info.uri);
        setSuggestedPhotos(photoUris);
      }
    } catch (error) {
      console.error('Error fetching photos:', error);
    }
  };

  const toggleSuggestedPhoto = (uri: string) => {
    if (newPhotos.includes(uri)) {
      // Remove if already selected
      setNewPhotos(newPhotos.filter(p => p !== uri));
    } else {
      // Add if not selected
      setNewPhotos([...newPhotos, uri]);
    }
  };

  const loadEntries = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setEntries(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading entries:', error);
    }
  };

  const saveEntries = async (newEntries: JournalEntry[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newEntries));
      setEntries(newEntries);
    } catch (error) {
      console.error('Error saving entries:', error);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setCurrentLocation('Location unavailable');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});

      // Store coordinates
      setCurrentCoordinates({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      try {
        const [address] = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });

        if (address) {
          const locationName = `${address.city || address.region || 'Unknown'}, ${address.country || 'NZ'}`;
          const cityName = address.city || address.region || 'Unknown';
          setCurrentLocation(locationName);
          setSuggestedTitle(`Day in ${cityName}`);

          // Calculate activity data with city name
          await calculateActivityData(location, cityName);
        }
      } catch (geocodeError) {
        console.error('Geocoding error:', geocodeError);
        // Continue with coordinates only if geocoding fails
        setCurrentLocation('Current location');
        await calculateActivityData(location, 'Unknown');
      }
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const calculateActivityData = async (currentLocation: Location.LocationObject, cityName: string) => {
    try {
      // Get location history for today
      const historyString = await AsyncStorage.getItem(LOCATION_HISTORY_KEY);
      const history: Array<{ location: Location.LocationObject; timestamp: number }> = historyString
        ? JSON.parse(historyString)
        : [];

      // Add current location to history
      history.push({ location: currentLocation, timestamp: Date.now() });
      await AsyncStorage.setItem(LOCATION_HISTORY_KEY, JSON.stringify(history));

      // Filter for today's locations
      const today = new Date().setHours(0, 0, 0, 0);
      const todaysLocations = history.filter(h => h.timestamp >= today);

      // Calculate distance traveled
      let totalDistance = 0;

      for (let i = 1; i < todaysLocations.length; i++) {
        const prev = todaysLocations[i - 1].location.coords;
        const curr = todaysLocations[i].location.coords;

        // Calculate distance in km using Haversine formula
        const distance = calculateDistance(
          prev.latitude,
          prev.longitude,
          curr.latitude,
          curr.longitude
        );
        totalDistance += distance;
      }

      setDistanceTraveled(totalDistance);
      // Use current city name instead of reverse geocoding every point
      setPlacesVisited(cityName !== 'Unknown' ? [cityName] : []);
    } catch (error) {
      console.error('Error calculating activity:', error);
    }
  };

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

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      const uris = result.assets.map(asset => asset.uri);
      setNewPhotos([...newPhotos, ...uris]);
    }
  };

  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
    });

    if (!result.canceled) {
      setNewPhotos([...newPhotos, result.assets[0].uri]);
    }
  };

  const removePhoto = (index: number) => {
    setNewPhotos(newPhotos.filter((_, i) => i !== index));
  };

  const useSuggestedTitle = () => {
    setNewTitle(suggestedTitle);
  };

  const handleAddEntry = async () => {
    if (!newTitle.trim() || !newContent.trim()) {
      Alert.alert('Required', 'Please enter both a title and content for your entry.');
      return;
    }

    const newEntry: JournalEntry = {
      id: Date.now().toString(),
      title: newTitle,
      content: newContent,
      location: currentLocation,
      coordinates: currentCoordinates,
      date: new Date().toLocaleDateString('en-NZ', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
      timestamp: Date.now(),
      photos: newPhotos,
      distanceTraveled: distanceTraveled,
      placesVisited: placesVisited,
    };

    const updatedEntries = [newEntry, ...entries];
    await saveEntries(updatedEntries);

    // Reset form
    setNewTitle('');
    setNewContent('');
    setNewPhotos([]);
    setModalVisible(false);
    await getCurrentLocation();
  };

  const handleDeleteEntry = (id: string) => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this journal entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updatedEntries = entries.filter((entry) => entry.id !== id);
            await saveEntries(updatedEntries);
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Journal</Text>
          <Text style={styles.subtitle}>{entries.length} {entries.length === 1 ? 'entry' : 'entries'}</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView ref={scrollViewRef} style={styles.entriesList} contentContainerStyle={styles.entriesContent}>
        {entries.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="book-outline" size={64} color="#9ca3af" />
            <Text style={styles.emptyTitle}>No journal entries yet</Text>
            <Text style={styles.emptyText}>Start documenting your van life adventures</Text>
            <TouchableOpacity style={styles.emptyButton} onPress={() => setModalVisible(true)}>
              <Text style={styles.emptyButtonText}>Create First Entry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          entries.map((entry) => (
            <View
              key={entry.id}
              style={[
                styles.entryCard,
                highlightedEntryId === entry.id && styles.entryCardHighlighted
              ]}
            >
              {entry.photos && entry.photos.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoScroll}>
                  {entry.photos.map((photo, index) => (
                    <Image key={index} source={{ uri: photo }} style={styles.entryPhoto} />
                  ))}
                </ScrollView>
              )}
              <View style={styles.entryHeader}>
                <View style={styles.entryHeaderLeft}>
                  <Text style={styles.entryDate}>{entry.date}</Text>
                  <View style={styles.entryLocationContainer}>
                    <Ionicons name="location-outline" size={14} color="#9ca3af" />
                    <Text style={styles.entryLocation}>{entry.location}</Text>
                  </View>
                  {(entry.distanceTraveled !== undefined && entry.distanceTraveled > 0) && (
                    <View style={styles.activityContainer}>
                      <Ionicons name="navigate-outline" size={14} color="#9ca3af" />
                      <Text style={styles.activityText}>
                        {entry.distanceTraveled.toFixed(1)}km traveled
                      </Text>
                    </View>
                  )}
                </View>
                <TouchableOpacity onPress={() => handleDeleteEntry(entry.id)} style={styles.deleteButton}>
                  <Ionicons name="trash-outline" size={20} color="#ef4444" />
                </TouchableOpacity>
              </View>
              <Text style={styles.entryTitle}>{entry.title}</Text>
              <Text style={styles.entryContent} numberOfLines={3}>
                {entry.content}
              </Text>
            </View>
          ))
        )}
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>New Entry</Text>
            <TouchableOpacity onPress={handleAddEntry}>
              <Text style={styles.modalSave}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.locationInfo}>
              <Ionicons name="location" size={20} color="#007AFF" />
              <Text style={styles.locationText}>{currentLocation}</Text>
            </View>

            {/* Activity Summary */}
            {(distanceTraveled > 0 || placesVisited.length > 0) && (
              <View style={styles.activitySummary}>
                <Text style={styles.activitySummaryTitle}>Today's Activity</Text>
                {distanceTraveled > 0 && (
                  <View style={styles.activityRow}>
                    <Ionicons name="navigate" size={16} color="#007AFF" />
                    <Text style={styles.activitySummaryText}>
                      Traveled {distanceTraveled.toFixed(1)}km
                    </Text>
                  </View>
                )}
                {placesVisited.length > 0 && (
                  <View style={styles.activityRow}>
                    <Ionicons name="map" size={16} color="#007AFF" />
                    <Text style={styles.activitySummaryText}>
                      Visited {placesVisited.join(', ')}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Suggested Title */}
            {suggestedTitle && !newTitle && (
              <TouchableOpacity style={styles.suggestionChip} onPress={useSuggestedTitle}>
                <Ionicons name="bulb-outline" size={16} color="#007AFF" />
                <Text style={styles.suggestionText}>Use: "{suggestedTitle}"</Text>
              </TouchableOpacity>
            )}

            <TextInput
              style={styles.titleInput}
              placeholder="Entry title..."
              value={newTitle}
              onChangeText={setNewTitle}
              placeholderTextColor="#9ca3af"
            />

            {/* Photo Actions */}
            <View style={styles.photoActions}>
              <TouchableOpacity style={styles.photoActionButton} onPress={takePhoto}>
                <Ionicons name="camera-outline" size={20} color="#007AFF" />
                <Text style={styles.photoActionText}>Take Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.photoActionButton} onPress={pickImage}>
                <Ionicons name="images-outline" size={20} color="#007AFF" />
                <Text style={styles.photoActionText}>Choose Photos</Text>
              </TouchableOpacity>
            </View>

            {/* Suggested Photos from Today */}
            {suggestedPhotos.length > 0 && (
              <View style={styles.suggestedPhotosSection}>
                <View style={styles.suggestedPhotosHeader}>
                  <Ionicons name="images" size={16} color="#007AFF" />
                  <Text style={styles.suggestedPhotosTitle}>
                    Today's Photos {newPhotos.length > 0 && `(${newPhotos.length} selected)`}
                  </Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestedPhotosScroll}>
                  {suggestedPhotos.map((photo, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.suggestedPhotoContainer,
                        newPhotos.includes(photo) && styles.suggestedPhotoSelected,
                      ]}
                      onPress={() => toggleSuggestedPhoto(photo)}
                    >
                      <Image source={{ uri: photo }} style={styles.suggestedPhoto} />
                      {newPhotos.includes(photo) && (
                        <View style={styles.selectedBadge}>
                          <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            <TextInput
              style={styles.contentInput}
              placeholder="What happened today?..."
              value={newContent}
              onChangeText={setNewContent}
              multiline
              textAlignVertical="top"
              placeholderTextColor="#9ca3af"
            />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  entriesList: {
    flex: 1,
  },
  entriesContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  entryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  entryCardHighlighted: {
    backgroundColor: '#f0f7ff',
    borderWidth: 2,
    borderColor: '#007AFF',
    shadowColor: '#007AFF',
    shadowOpacity: 0.2,
  },
  photoScroll: {
    marginBottom: 12,
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  entryPhoto: {
    width: 120,
    height: 120,
    borderRadius: 12,
    marginRight: 8,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  entryHeaderLeft: {
    flex: 1,
  },
  entryDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
  },
  entryLocationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  entryLocation: {
    fontSize: 13,
    color: '#9ca3af',
  },
  activityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  activityText: {
    fontSize: 13,
    color: '#9ca3af',
  },
  deleteButton: {
    padding: 4,
  },
  entryTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  entryContent: {
    fontSize: 15,
    color: '#4b5563',
    lineHeight: 22,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: '#6b7280',
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalCancel: {
    fontSize: 17,
    color: '#6b7280',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  modalSave: {
    fontSize: 17,
    fontWeight: '600',
    color: '#007AFF',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
  },
  locationText: {
    fontSize: 15,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  activitySummary: {
    backgroundColor: '#f0f7ff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#bfe3ff',
  },
  activitySummaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 8,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  activitySummaryText: {
    fontSize: 14,
    color: '#1a1a1a',
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  suggestionText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  titleInput: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  photoActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  photoActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#007AFF',
  },
  photoActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  photoPreviewScroll: {
    marginBottom: 16,
  },
  photoPreviewContainer: {
    position: 'relative',
    marginRight: 8,
  },
  photoPreview: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  photoRemoveButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  contentInput: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1a1a1a',
    minHeight: 200,
    lineHeight: 24,
  },
  suggestedPhotosSection: {
    marginBottom: 16,
  },
  suggestedPhotosHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  suggestedPhotosTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  suggestedPhotosScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  suggestedPhotoContainer: {
    position: 'relative',
    marginRight: 8,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  suggestedPhotoSelected: {
    borderColor: '#007AFF',
  },
  suggestedPhoto: {
    width: 80,
    height: 80,
    borderRadius: 10,
  },
  selectedBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
});
