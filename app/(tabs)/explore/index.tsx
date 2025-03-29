import React, { useState, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Image,
  Animated,
  Dimensions
} from 'react-native';
import { Link, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Colors';

type ExploreRoute = '/(tabs)/explore/hikes' | '/(tabs)/explore/events' | '/(tabs)/explore/essentials' | '/(tabs)/explore/food';

interface CategoryCardProps {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
  image: any;
  route: ExploreRoute;
  color: string;
  index: number;
}

const CategoryCard = ({ title, icon, description, image, route, color, index }: CategoryCardProps) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(50)).current;
  
  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 600,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 600,
        delay: index * 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  
  return (
    <Animated.View
      style={{
        opacity,
        transform: [{ translateY }],
      }}
    >
      <TouchableOpacity 
        style={[styles.categoryCard, { borderColor: color }]}
        onPress={() => router.push(route)}
        activeOpacity={0.8}
      >
        <Image 
          source={image} 
          style={styles.categoryImage} 
          resizeMode="cover"
        />
        <View style={styles.categoryOverlay} />
        <LinearGradient
          colors={[
            'transparent', 
            'rgba(0,0,0,0.6)', 
            'rgba(0,0,0,0.85)'
          ]}
          style={styles.categoryGradient}
        />
        <View style={styles.categoryContent}>
          <View style={[styles.iconCircle, { backgroundColor: color }]}>
            <Ionicons name={icon} size={24} color="white" />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.categoryTitle}>{title}</Text>
            <Text style={styles.categoryDescription}>{description}</Text>
          </View>
          <View style={[styles.exploreButton, { backgroundColor: color }]}>
            <Text style={styles.exploreButtonText}>Explore</Text>
            <Ionicons name="chevron-forward" size={16} color="white" />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function ExploreScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);
  
  const categories: Omit<CategoryCardProps, 'index'>[] = [
    {
      title: 'Hiking Trails',
      icon: 'trail-sign',
      description: 'Discover beautiful trails and natural wonders nearby',
      image: require('@/assets/images/backgrounds/mt-aspiring.jpg'),
      route: '/(tabs)/explore/hikes',
      color: Colors.dark.accentGreen,
    },
    {
      title: 'Local Events',
      icon: 'calendar',
      description: 'Find events, festivals, and activities happening now',
      image: require('@/assets/images/backgrounds/concert.jpg'),
      route: '/(tabs)/explore/events',
      color: Colors.dark.accentOrange,
    },
    {
      title: 'Essentials',
      icon: 'cart',
      description: 'Locate laundromats, supermarkets, and other necessities',
      image: require('@/assets/images/backgrounds/supermarket.jpg'),
      route: '/(tabs)/explore/essentials',
      color: Colors.dark.accentBlue,
    },
    {
      title: 'Food',
      icon: 'restaurant',
      description: 'Top-rated restaurants and cafes in the area',
      image: require('@/assets/images/backgrounds/burger.jpg'),
      route: '/(tabs)/explore/food',
      color: Colors.dark.accentPurple,
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <Animated.View 
        style={[
          styles.header,
          { opacity: fadeAnim }
        ]}
      >
        <Text style={styles.title}>Explore</Text>
        <Text style={styles.subtitle}>Discover what's nearby</Text>
      </Animated.View>
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {categories.map((category, index) => (
          <CategoryCard 
            key={index} 
            {...category} 
            index={index}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  header: {
    padding: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: Colors.dark.text,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 18,
    color: Colors.dark.textSecondary,
    marginTop: 4,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100, // extra padding for bottom tab bar
  },
  categoryCard: {
    height: 190,
    borderRadius: 20,
    marginBottom: 24,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  categoryImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  categoryOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  categoryGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '70%',
  },
  categoryContent: {
    position: 'relative',
    padding: 16,
    height: '100%',
    justifyContent: 'space-between',
  },
  textContainer: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  iconCircle: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  exploreButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  exploreButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
    marginRight: 4,
  },
  categoryTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: 'white',
    marginBottom: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  categoryDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    lineHeight: 20,
    marginRight: 80, // Make space for the button
  },
}); 