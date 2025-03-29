import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Image,
  ActivityIndicator,
  FlatList
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Colors';
import { Stack } from 'expo-router';

// Type definitions
interface Restaurant {
  id: string;
  name: string;
  image: any;
  cuisineType: string;
  priceLevel: 1 | 2 | 3; // 1 = $, 2 = $$, 3 = $$$
  rating: number;
  numRatings: number;
  distance: number;
  address: string;
  isOpen: boolean;
  openUntil?: string;
  featuredDish?: string;
}

// This would typically come from an API
const MOCK_RESTAURANTS: Restaurant[] = [
  {
    id: '1',
    name: 'The Green Kiwi',
    image: require('@/assets/images/backgrounds/nz-landscape.jpg'),
    cuisineType: 'New Zealand',
    priceLevel: 2,
    rating: 4.7,
    numRatings: 256,
    distance: 1.2,
    address: '123 Queen Street',
    isOpen: true,
    openUntil: '10:00 PM',
    featuredDish: 'Lamb Rack with Kumara',
  },
  {
    id: '2',
    name: 'Ocean Blue',
    image: require('@/assets/images/backgrounds/nz-landscape.jpg'),
    cuisineType: 'Seafood',
    priceLevel: 3,
    rating: 4.9,
    numRatings: 189,
    distance: 2.5,
    address: '45 Harbor Road',
    isOpen: true,
    openUntil: '11:00 PM',
    featuredDish: 'Green-lipped Mussels',
  },
  {
    id: '3',
    name: 'Spice Route',
    image: require('@/assets/images/backgrounds/nz-landscape.jpg'),
    cuisineType: 'Indian',
    priceLevel: 2,
    rating: 4.6,
    numRatings: 212,
    distance: 0.8,
    address: '78 Victoria Street',
    isOpen: true,
    openUntil: '9:30 PM',
    featuredDish: 'Butter Chicken',
  },
  {
    id: '4',
    name: 'Tokyo House',
    image: require('@/assets/images/backgrounds/nz-landscape.jpg'),
    cuisineType: 'Japanese',
    priceLevel: 3,
    rating: 4.8,
    numRatings: 324,
    distance: 1.7,
    address: '15 Albert Street',
    isOpen: false,
    featuredDish: 'Fresh Sashimi Platter',
  },
  {
    id: '5',
    name: 'The Coffee Club',
    image: require('@/assets/images/backgrounds/nz-landscape.jpg'),
    cuisineType: 'Café',
    priceLevel: 1,
    rating: 4.5,
    numRatings: 178,
    distance: 0.5,
    address: '3 Williams Avenue',
    isOpen: true,
    openUntil: '6:00 PM',
    featuredDish: 'Big Breakfast',
  },
];

export default function FoodScreen() {
  const [loading, setLoading] = useState(true);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string>('distance');

  useEffect(() => {
    // Simulate API loading time
    const timer = setTimeout(() => {
      setLoading(false);
      setRestaurants(MOCK_RESTAURANTS);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const sortRestaurants = (filter: string) => {
    setSelectedFilter(filter);
    const sorted = [...restaurants];
    
    switch (filter) {
      case 'rating':
        sorted.sort((a, b) => b.rating - a.rating);
        break;
      case 'price-asc':
        sorted.sort((a, b) => a.priceLevel - b.priceLevel);
        break;
      case 'price-desc':
        sorted.sort((a, b) => b.priceLevel - a.priceLevel);
        break;
      case 'distance':
      default:
        sorted.sort((a, b) => a.distance - b.distance);
    }
    
    setRestaurants(sorted);
  };

  const renderPriceLevel = (level: number) => {
    return Array(level).fill('$').join('');
  };

  const renderRestaurant = ({ item }: { item: Restaurant }) => {
    return (
      <TouchableOpacity style={styles.restaurantCard} activeOpacity={0.9}>
        <View style={styles.imageContainer}>
          <Image 
            source={item.image} 
            style={styles.restaurantImage} 
            resizeMode="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.imageGradient}
          />
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={16} color={Colors.dark.accentOrange} />
            <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
            <Text style={styles.numRatingsText}>({item.numRatings})</Text>
          </View>
        </View>
        
        <View style={styles.cardContent}>
          <View style={styles.nameRow}>
            <Text style={styles.restaurantName}>{item.name}</Text>
            <Text style={styles.priceLevel}>
              {renderPriceLevel(item.priceLevel)}
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.cuisineType}>{item.cuisineType}</Text>
            <View style={styles.distanceContainer}>
              <Ionicons name="location" size={12} color={Colors.dark.textSecondary} />
              <Text style={styles.distanceText}>{item.distance.toFixed(1)} km</Text>
            </View>
          </View>
          
          <Text style={styles.address}>{item.address}</Text>
          
          <View style={styles.statusRow}>
            {item.isOpen ? (
              <View style={styles.statusContainer}>
                <View style={styles.openDot} />
                <Text style={styles.openText}>Open • Until {item.openUntil}</Text>
              </View>
            ) : (
              <View style={styles.statusContainer}>
                <View style={styles.closedDot} />
                <Text style={styles.closedText}>Closed</Text>
              </View>
            )}
            
            {item.featuredDish && (
              <View style={styles.featuredDishContainer}>
                <Ionicons name="restaurant" size={12} color={Colors.dark.accentGreen} />
                <Text style={styles.featuredDishText}>{item.featuredDish}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Stack.Screen options={{ title: 'Food Nearby' }} />
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.dark.tint} />
          <Text style={styles.loadingText}>Finding restaurants near you...</Text>
        </View>
      ) : (
        <>
          <View style={styles.filterContainer}>
            <Text style={styles.filterLabel}>Sort by:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScrollContent}>
              <TouchableOpacity 
                style={[styles.filterButton, selectedFilter === 'distance' && styles.filterButtonActive]} 
                onPress={() => sortRestaurants('distance')}
              >
                <Text style={[styles.filterText, selectedFilter === 'distance' && styles.filterTextActive]}>Nearest</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.filterButton, selectedFilter === 'rating' && styles.filterButtonActive]} 
                onPress={() => sortRestaurants('rating')}
              >
                <Text style={[styles.filterText, selectedFilter === 'rating' && styles.filterTextActive]}>Top Rated</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.filterButton, selectedFilter === 'price-asc' && styles.filterButtonActive]} 
                onPress={() => sortRestaurants('price-asc')}
              >
                <Text style={[styles.filterText, selectedFilter === 'price-asc' && styles.filterTextActive]}>$ to $$$</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.filterButton, selectedFilter === 'price-desc' && styles.filterButtonActive]} 
                onPress={() => sortRestaurants('price-desc')}
              >
                <Text style={[styles.filterText, selectedFilter === 'price-desc' && styles.filterTextActive]}>$$$ to $</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
          
          <FlatList
            data={restaurants}
            keyExtractor={(item) => item.id}
            renderItem={renderRestaurant}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.dark.text,
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.cardBorder,
  },
  filterLabel: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    marginBottom: 8,
  },
  filtersScrollContent: {
    paddingBottom: 8,
    paddingRight: 16,
    gap: 8,
    flexDirection: 'row',
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.dark.card,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
  },
  filterButtonActive: {
    backgroundColor: Colors.dark.tint,
    borderColor: Colors.dark.tint,
  },
  filterText: {
    fontSize: 14,
    color: Colors.dark.text,
  },
  filterTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100, // extra padding for bottom tab bar
  },
  restaurantCard: {
    backgroundColor: Colors.dark.card,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
  },
  imageContainer: {
    height: 150,
    position: 'relative',
  },
  restaurantImage: {
    width: '100%',
    height: '100%',
  },
  imageGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 60,
  },
  ratingContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '700',
    color: 'white',
    marginLeft: 4,
  },
  numRatingsText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 2,
  },
  cardContent: {
    padding: 14,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.dark.text,
  },
  priceLevel: {
    fontSize: 16,
    color: Colors.dark.textSecondary,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cuisineType: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distanceText: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    marginLeft: 4,
  },
  address: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  openDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.dark.accentGreen,
    marginRight: 4,
  },
  openText: {
    fontSize: 12,
    color: Colors.dark.accentGreen,
  },
  closedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.dark.accentRed,
    marginRight: 4,
  },
  closedText: {
    fontSize: 12,
    color: Colors.dark.accentRed,
  },
  featuredDishContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featuredDishText: {
    fontSize: 12,
    fontStyle: 'italic',
    color: Colors.dark.accentGreen,
    marginLeft: 4,
  },
}); 