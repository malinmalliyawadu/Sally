import React, { useState } from 'react';
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
}

const CategoryCard = ({ title, icon, description, image, route, color }: CategoryCardProps) => {
  return (
    <TouchableOpacity 
      style={styles.categoryCard}
      onPress={() => router.push(route)}
      activeOpacity={0.9}
    >
      <Image 
        source={image} 
        style={styles.categoryImage} 
        resizeMode="cover"
      />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.9)']}
        style={styles.categoryGradient}
      />
      <View style={styles.categoryContent}>
        <View style={[styles.iconCircle, { backgroundColor: color }]}>
          <Ionicons name={icon} size={24} color="white" />
        </View>
        <Text style={styles.categoryTitle}>{title}</Text>
        <Text style={styles.categoryDescription}>{description}</Text>
      </View>
    </TouchableOpacity>
  );
};

export default function ExploreScreen() {
  const categories: CategoryCardProps[] = [
    {
      title: 'Hiking Trails',
      icon: 'trail-sign',
      description: 'Discover beautiful trails and natural wonders nearby',
      image: require('@/assets/images/backgrounds/nz-landscape.jpg'),
      route: '/(tabs)/explore/hikes',
      color: Colors.dark.accentGreen,
    },
    {
      title: 'Local Events',
      icon: 'calendar',
      description: 'Find events, festivals, and activities happening now',
      image: require('@/assets/images/backgrounds/nz-landscape.jpg'),
      route: '/(tabs)/explore/events',
      color: Colors.dark.accentOrange,
    },
    {
      title: 'Essentials',
      icon: 'cart',
      description: 'Locate laundromats, supermarkets, and other necessities',
      image: require('@/assets/images/backgrounds/nz-landscape.jpg'),
      route: '/(tabs)/explore/essentials',
      color: Colors.dark.accentBlue,
    },
    {
      title: 'Food',
      icon: 'restaurant',
      description: 'Top-rated restaurants and cafes in the area',
      image: require('@/assets/images/backgrounds/nz-landscape.jpg'),
      route: '/(tabs)/explore/food',
      color: Colors.dark.accentPurple,
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.header}>
        <Text style={styles.title}>Explore</Text>
        <Text style={styles.subtitle}>Discover what's nearby</Text>
      </View>
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>Categories</Text>
        
        {categories.map((category, index) => (
          <CategoryCard key={index} {...category} />
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
    fontSize: 34,
    fontWeight: '800',
    color: Colors.dark.text,
  },
  subtitle: {
    fontSize: 17,
    color: Colors.dark.textSecondary,
    marginTop: 4,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100, // extra padding for bottom tab bar
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.dark.text,
    marginBottom: 16,
  },
  categoryCard: {
    height: 180,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  categoryImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  categoryGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: '100%',
  },
  categoryContent: {
    position: 'relative',
    padding: 16,
    height: '100%',
    justifyContent: 'flex-end',
  },
  iconCircle: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
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
  },
}); 