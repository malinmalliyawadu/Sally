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
const MOCK_EVENTS = [
  {
    id: '1',
    name: 'Wellington Food Festival',
    image: require('@/assets/images/backgrounds/nz-landscape.jpg'),
    date: 'Today, 10:00 AM - 6:00 PM',
    location: 'Wellington Waterfront',
    description: 'A celebration of local cuisine featuring top chefs and food vendors from around the region.',
    distanceAway: 1.2,
    isFree: false,
    price: '$10',
  },
  {
    id: '2',
    name: 'Kiwi Music Night',
    image: require('@/assets/images/backgrounds/nz-landscape.jpg'),
    date: 'Tomorrow, 7:00 PM - 11:00 PM',
    location: 'The Civic Hall',
    description: 'Live performances from emerging New Zealand musicians and bands.',
    distanceAway: 3.5,
    isFree: false,
    price: '$15',
  },
  {
    id: '3',
    name: 'Farmers Market',
    image: require('@/assets/images/backgrounds/nz-landscape.jpg'),
    date: 'Saturday, 8:00 AM - 1:00 PM',
    location: 'City Square',
    description: 'Fresh local produce, handmade crafts, and community activities.',
    distanceAway: 2.8,
    isFree: true,
    price: null,
  },
  {
    id: '4',
    name: 'Outdoor Movie Night',
    image: require('@/assets/images/backgrounds/nz-landscape.jpg'),
    date: 'Saturday, 8:30 PM - 11:00 PM',
    location: 'Victoria Park',
    description: 'Bring a blanket and enjoy a classic film under the stars.',
    distanceAway: 4.1,
    isFree: true,
    price: null,
  },
];

export default function EventsScreen() {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState(MOCK_EVENTS);

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
      <Stack.Screen options={{ title: 'Local Events Nearby' }} />
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.dark.tint} />
          <Text style={styles.loadingText}>Finding events near you...</Text>
        </View>
      ) : (
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {events.map((event) => (
            <TouchableOpacity 
              key={event.id}
              style={styles.eventCard}
              activeOpacity={0.9}
            >
              <Image 
                source={event.image} 
                style={styles.eventImage} 
                resizeMode="cover"
              />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.9)']}
                style={styles.eventGradient}
              />
              
              <View style={styles.eventContent}>
                {event.isFree ? (
                  <View style={styles.freeTag}>
                    <Text style={styles.freeText}>FREE</Text>
                  </View>
                ) : (
                  <View style={styles.priceTag}>
                    <Text style={styles.priceText}>{event.price}</Text>
                  </View>
                )}
                
                <View style={styles.distanceTag}>
                  <Ionicons name="location" size={12} color="white" />
                  <Text style={styles.distanceText}>{event.distanceAway.toFixed(1)} km away</Text>
                </View>
                
                <Text style={styles.eventName}>{event.name}</Text>
                
                <View style={styles.eventDetails}>
                  <View style={styles.detailItem}>
                    <Ionicons name="calendar" size={14} color={Colors.dark.accentOrange} />
                    <Text style={styles.detailText}>{event.date}</Text>
                  </View>
                  
                  <View style={styles.detailItem}>
                    <Ionicons name="location" size={14} color={Colors.dark.accentBlue} />
                    <Text style={styles.detailText}>{event.location}</Text>
                  </View>
                </View>
                
                <Text style={styles.eventDescription} numberOfLines={2}>
                  {event.description}
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
  eventCard: {
    height: 220,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  eventImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  eventGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: '100%',
  },
  eventContent: {
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
  freeTag: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: Colors.dark.accentGreen,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  freeText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'white',
  },
  priceTag: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: Colors.dark.accentPurple,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  priceText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'white',
  },
  eventName: {
    fontSize: 22,
    fontWeight: '700',
    color: 'white',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  eventDetails: {
    flexDirection: 'column',
    marginBottom: 8,
    gap: 6,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  detailText: {
    fontSize: 12,
    color: 'white',
    marginLeft: 4,
  },
  eventDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
}); 