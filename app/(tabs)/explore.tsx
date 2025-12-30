import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import * as Location from 'expo-location';
import Ionicons from '@expo/vector-icons/Ionicons';

type Category = 'all' | 'food' | 'fuel' | 'camping' | 'attractions' | 'hiking';

interface Place {
  id: string;
  name: string;
  category: Category;
  description: string;
  distance: number; // in km
  coordinate: { latitude: number; longitude: number };
  icon: keyof typeof Ionicons.glyphMap;
}

// Sample data - replace with real data later
const SAMPLE_PLACES: Place[] = [
  {
    id: '1',
    name: 'The Bakery Café',
    category: 'food',
    description: 'Fresh pastries and coffee',
    distance: 1.2,
    coordinate: { latitude: -41.2865, longitude: 174.7762 },
    icon: 'restaurant-outline',
  },
  {
    id: '2',
    name: 'BP Petrol Station',
    category: 'fuel',
    description: 'Fuel and convenience store',
    distance: 0.8,
    coordinate: { latitude: -41.2865, longitude: 174.7762 },
    icon: 'car-outline',
  },
  {
    id: '3',
    name: 'Tekapo Freedom Camp',
    category: 'camping',
    description: 'Beautiful lake views, free camping',
    distance: 3.5,
    coordinate: { latitude: -44.0045, longitude: 170.4776 },
    icon: 'bonfire-outline',
  },
  {
    id: '4',
    name: 'Milford Sound',
    category: 'attractions',
    description: 'Stunning fiord, must-see destination',
    distance: 245.0,
    coordinate: { latitude: -44.6717, longitude: 167.9261 },
    icon: 'image-outline',
  },
  {
    id: '5',
    name: 'Tongariro Alpine Crossing',
    category: 'hiking',
    description: 'One of NZ\'s best day hikes',
    distance: 156.0,
    coordinate: { latitude: -39.1333, longitude: 175.5833 },
    icon: 'trail-sign-outline',
  },
  {
    id: '6',
    name: 'New World Supermarket',
    category: 'food',
    description: 'Full grocery shopping',
    distance: 2.1,
    coordinate: { latitude: -41.2865, longitude: 174.7762 },
    icon: 'cart-outline',
  },
];

const CATEGORIES = [
  { id: 'all', label: 'All', icon: 'apps-outline' },
  { id: 'food', label: 'Food', icon: 'restaurant-outline' },
  { id: 'fuel', label: 'Fuel', icon: 'car-outline' },
  { id: 'camping', label: 'Camping', icon: 'bonfire-outline' },
  { id: 'attractions', label: 'Attractions', icon: 'image-outline' },
  { id: 'hiking', label: 'Hiking', icon: 'trail-sign-outline' },
] as const;

export default function Explore() {
  const [selectedCategory, setSelectedCategory] = useState<Category>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState<Location.LocationObject | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const currentLocation = await Location.getCurrentPositionAsync({});
        setLocation(currentLocation);
      }
    })();
  }, []);

  const filteredPlaces = SAMPLE_PLACES.filter((place) => {
    const matchesCategory = selectedCategory === 'all' || place.category === selectedCategory;
    const matchesSearch =
      searchQuery === '' ||
      place.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      place.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  }).sort((a, b) => a.distance - b.distance);

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

      {/* Places List */}
      <ScrollView style={styles.placesList} contentContainerStyle={styles.placesContent}>
        {filteredPlaces.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="location-outline" size={48} color="#9ca3af" />
            <Text style={styles.emptyText}>No places found</Text>
          </View>
        ) : (
          filteredPlaces.map((place) => (
            <TouchableOpacity key={place.id} style={styles.placeCard}>
              <View style={styles.placeIconContainer}>
                <Ionicons name={place.icon} size={24} color="#007AFF" />
              </View>
              <View style={styles.placeInfo}>
                <Text style={styles.placeName}>{place.name}</Text>
                <Text style={styles.placeDescription}>{place.description}</Text>
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
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
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
});
