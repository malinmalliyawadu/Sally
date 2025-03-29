import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Image,
  ActivityIndicator
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
    image: require('@/assets/images/backgrounds/nz-landscape.jpg'),
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
    image: require('@/assets/images/backgrounds/nz-landscape.jpg'),
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
    image: require('@/assets/images/backgrounds/nz-landscape.jpg'),
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
    image: require('@/assets/images/backgrounds/nz-landscape.jpg'),
    distance: 10,
    duration: '3 hours',
    difficulty: 'Easy',
    location: 'Aoraki/Mount Cook National Park',
    description: "An easy walk with spectacular views of New Zealand's highest mountain.",
    distanceAway: 35.6,
  },
];

export default function HikesScreen() {
  const [loading, setLoading] = useState(true);
  const [hikes, setHikes] = useState(MOCK_HIKES);

  useEffect(() => {
    // Simulate API loading time
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Stack.Screen options={{ title: 'Hiking Trails Nearby' }} />
      
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
          {hikes.map((hike) => (
            <TouchableOpacity 
              key={hike.id}
              style={styles.hikeCard}
              activeOpacity={0.9}
            >
              <Image 
                source={hike.image} 
                style={styles.hikeImage} 
                resizeMode="cover"
              />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.9)']}
                style={styles.hikeGradient}
              />
              
              <View style={styles.hikeContent}>
                <View style={styles.distanceTag}>
                  <Ionicons name="location" size={12} color="white" />
                  <Text style={styles.distanceText}>{hike.distanceAway.toFixed(1)} km away</Text>
                </View>
                
                <Text style={styles.hikeName}>{hike.name}</Text>
                <Text style={styles.hikeLocation}>{hike.location}</Text>
                
                <View style={styles.hikeDetails}>
                  <View style={styles.detailItem}>
                    <Ionicons name="trending-up" size={14} color={Colors.dark.accentGreen} />
                    <Text style={styles.detailText}>{hike.difficulty}</Text>
                  </View>
                  
                  <View style={styles.detailItem}>
                    <Ionicons name="time" size={14} color={Colors.dark.accentOrange} />
                    <Text style={styles.detailText}>{hike.duration}</Text>
                  </View>
                  
                  <View style={styles.detailItem}>
                    <Ionicons name="footsteps" size={14} color={Colors.dark.accentBlue} />
                    <Text style={styles.detailText}>{hike.distance} km</Text>
                  </View>
                </View>
                
                <Text style={styles.hikeDescription} numberOfLines={2}>
                  {hike.description}
                </Text>
              </View>
            </TouchableOpacity>
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
  scrollContent: {
    padding: 16,
    paddingBottom: 100, // extra padding for bottom tab bar
  },
  hikeCard: {
    height: 220,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  hikeImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  hikeGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: '100%',
  },
  hikeContent: {
    position: 'relative',
    padding: 16,
    height: '100%',
    justifyContent: 'flex-end',
  },
  distanceTag: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  distanceText: {
    fontSize: 12,
    color: 'white',
    marginLeft: 4,
  },
  hikeName: {
    fontSize: 22,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  hikeLocation: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  hikeDetails: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  detailText: {
    fontSize: 12,
    color: 'white',
    marginLeft: 4,
  },
  hikeDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
}); 