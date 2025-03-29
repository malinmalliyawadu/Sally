import React, { useEffect, useState, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Image,
  ActivityIndicator,
  Animated
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Colors';
import { Stack } from 'expo-router';

// This would typically come from an API
const MOCK_HIKES = [
  {
    id: '1',
    name: 'Tongariro Alpine Crossing',
    image: require('@/assets/images/backgrounds/mt-aspiring.jpg'),
    distance: 19.4,
    duration: '7-8 hours',
    difficulty: 'Moderate-Hard',
    location: 'Tongariro National Park',
    description: "One of New Zealand's most popular day hikes, showcasing dramatic volcanic landscapes.",
    distanceAway: 15.2,
  },
  {
    id: '2',
    name: "Roy's Peak Track",
    image: require('@/assets/images/backgrounds/mt-aspiring.jpg'),
    distance: 16,
    duration: '5-6 hours',
    difficulty: 'Moderate',
    location: 'Wanaka',
    description: 'Offering stunning views over Lake Wanaka and Mount Aspiring National Park.',
    distanceAway: 8.7,
  },
  {
    id: '3',
    name: 'Abel Tasman Coast Track',
    image: require('@/assets/images/backgrounds/mt-aspiring.jpg'),
    distance: 60,
    duration: '3-5 days',
    difficulty: 'Easy-Moderate',
    location: 'Abel Tasman National Park',
    description: 'Beautiful coastal track with golden beaches and clear turquoise waters.',
    distanceAway: 22.3,
  },
  {
    id: '4',
    name: 'Hooker Valley Track',
    image: require('@/assets/images/backgrounds/mt-aspiring.jpg'),
    distance: 10,
    duration: '3 hours',
    difficulty: 'Easy',
    location: 'Aoraki/Mount Cook National Park',
    description: "An easy walk with spectacular views of New Zealand's highest mountain.",
    distanceAway: 35.6,
  },
];

const HikeCard = ({ hike, index }: { hike: typeof MOCK_HIKES[0], index: number }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(50)).current;
  
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 600,
        delay: index * 150,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 600,
        delay: index * 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  
  // Determine color based on difficulty
  const getDifficultyColor = (difficulty: string) => {
    const lowerDifficulty = difficulty.toLowerCase();
    if (lowerDifficulty.includes('easy')) return Colors.dark.accentGreen;
    if (lowerDifficulty.includes('moderate')) return Colors.dark.accentOrange;
    return Colors.dark.accentRed;
  };
  
  const difficultyColor = getDifficultyColor(hike.difficulty);
  
  return (
    <Animated.View
      style={{
        opacity,
        transform: [{ translateY }],
      }}
    >
      <TouchableOpacity 
        key={hike.id}
        style={[styles.hikeCard, { borderColor: 'rgba(255,255,255,0.15)' }]}
        activeOpacity={0.9}
      >
        <Image 
          source={hike.image} 
          style={styles.hikeImage} 
          resizeMode="cover"
        />
        <View style={styles.hikeOverlay} />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.9)']}
          style={styles.hikeGradient}
        />
        
        <View style={styles.hikeContent}>
          <View style={[styles.distanceTag, { backgroundColor: Colors.dark.accentPurple }]}>
            <Ionicons name="location" size={12} color="white" />
            <Text style={styles.distanceText}>{hike.distanceAway.toFixed(1)} km away</Text>
          </View>
          
          <View style={styles.textContainer}>
            <Text style={styles.hikeName}>{hike.name}</Text>
            <Text style={styles.hikeLocation}>{hike.location}</Text>
            
            <View style={styles.hikeDetails}>
              <View style={[styles.detailItem, { backgroundColor: difficultyColor }]}>
                <Ionicons name="trending-up" size={14} color="white" />
                <Text style={styles.detailText}>{hike.difficulty}</Text>
              </View>
              
              <View style={[styles.detailItem, { backgroundColor: Colors.dark.accentOrange }]}>
                <Ionicons name="time" size={14} color="white" />
                <Text style={styles.detailText}>{hike.duration}</Text>
              </View>
              
              <View style={[styles.detailItem, { backgroundColor: Colors.dark.accentBlue }]}>
                <Ionicons name="footsteps" size={14} color="white" />
                <Text style={styles.detailText}>{hike.distance} km</Text>
              </View>
            </View>
            
            <Text style={styles.hikeDescription} numberOfLines={2}>
              {hike.description}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function HikesScreen() {
  const [loading, setLoading] = useState(true);
  const [hikes, setHikes] = useState(MOCK_HIKES);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Simulate API loading time
    const timer = setTimeout(() => {
      setLoading(false);
      
      // Start the fade-in animation for the header
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Stack.Screen options={{ 
        title: 'Hiking Trails Nearby',
        headerStyle: {
          backgroundColor: Colors.dark.background,
        },
        headerTitleStyle: {
          fontWeight: '700',
        },
        headerShadowVisible: false,
      }} />
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.dark.tint} />
          <Text style={styles.loadingText}>Finding trails near you...</Text>
        </View>
      ) : (
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View 
            style={[
              styles.headerSection,
              { opacity: fadeAnim }
            ]}
          >
            <Text style={styles.sectionTitle}>
              Featured Hiking Trails
            </Text>
            <Text style={styles.sectionSubtitle}>
              Discover New Zealand's scenic beauty
            </Text>
          </Animated.View>
          
          {hikes.map((hike, index) => (
            <HikeCard key={hike.id} hike={hike} index={index} />
          ))}
        </ScrollView>
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
  headerSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.dark.text,
    marginBottom: 6,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: Colors.dark.textSecondary,
    marginBottom: 6,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100, // extra padding for bottom tab bar
  },
  hikeCard: {
    height: 220,
    borderRadius: 24,
    marginBottom: 24,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  hikeImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  hikeOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  hikeGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '75%',
  },
  hikeContent: {
    position: 'relative',
    padding: 16,
    height: '100%',
    justifyContent: 'flex-end',
  },
  textContainer: {
    marginTop: 'auto',
  },
  distanceTag: {
    position: 'absolute',
    top: 16,
    right: 16,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  distanceText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
    marginLeft: 4,
  },
  hikeName: {
    fontSize: 24,
    fontWeight: '800',
    color: 'white',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  hikeLocation: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  hikeDetails: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  detailText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
    marginLeft: 4,
  },
  hikeDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(255, 255, 255, 0.8)',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
}); 