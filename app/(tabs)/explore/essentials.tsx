import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Image,
  ActivityIndicator,
  SectionList
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Stack } from 'expo-router';

// Type definitions
interface Essential {
  id: string;
  name: string;
  type: string;
  icon: keyof typeof Ionicons.glyphMap;
  address: string;
  distance: number;
  isOpen: boolean;
  openUntil?: string;
  rating?: number;
}

interface SectionData {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  data: Essential[];
}

// This would typically come from an API
const MOCK_ESSENTIALS: SectionData[] = [
  {
    title: 'Supermarkets',
    icon: 'cart',
    data: [
      {
        id: 's1',
        name: 'Countdown',
        type: 'supermarket',
        icon: 'cart',
        address: '123 Main Street',
        distance: 1.2,
        isOpen: true,
        openUntil: '9:00 PM',
        rating: 4.3,
      },
      {
        id: 's2',
        name: 'New World',
        type: 'supermarket',
        icon: 'cart',
        address: '456 High Street',
        distance: 2.4,
        isOpen: true,
        openUntil: '10:00 PM',
        rating: 4.5,
      },
    ],
  },
  {
    title: 'Laundromats',
    icon: 'water',
    data: [
      {
        id: 'l1',
        name: 'Quick Clean Laundry',
        type: 'laundromat',
        icon: 'water',
        address: '78 Church Street',
        distance: 0.8,
        isOpen: true,
        openUntil: '8:00 PM',
        rating: 3.9,
      },
      {
        id: 'l2',
        name: 'Wash & Fold',
        type: 'laundromat',
        icon: 'water',
        address: '15 Queen Road',
        distance: 3.1,
        isOpen: false,
        rating: 4.2,
      },
    ],
  },
  {
    title: 'Pharmacies',
    icon: 'medkit',
    data: [
      {
        id: 'p1',
        name: 'Chemist Warehouse',
        type: 'pharmacy',
        icon: 'medkit',
        address: '33 Victoria Avenue',
        distance: 1.6,
        isOpen: true,
        openUntil: '6:00 PM',
        rating: 4.0,
      },
    ],
  },
  {
    title: 'Gas Stations',
    icon: 'speedometer',
    data: [
      {
        id: 'g1',
        name: 'BP Gas Station',
        type: 'gas',
        icon: 'speedometer',
        address: '2 Highway Road',
        distance: 2.1,
        isOpen: true,
        openUntil: '24 hours',
        rating: 4.1,
      },
      {
        id: 'g2',
        name: 'Z Energy',
        type: 'gas',
        icon: 'speedometer',
        address: '47 Main Avenue',
        distance: 3.5,
        isOpen: true,
        openUntil: '24 hours',
        rating: 4.2,
      },
    ],
  },
];

export default function EssentialsScreen() {
  const [loading, setLoading] = useState(true);
  const [essentials, setEssentials] = useState<SectionData[]>(MOCK_ESSENTIALS);

  useEffect(() => {
    // Simulate API loading time
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  // Sort essentials by distance within each section
  useEffect(() => {
    if (!loading) {
      const sortedEssentials = essentials.map(section => ({
        ...section,
        data: [...section.data].sort((a, b) => a.distance - b.distance)
      }));
      setEssentials(sortedEssentials);
    }
  }, [loading]);

  const renderItem = ({ item }: { item: Essential }) => {
    return (
      <TouchableOpacity style={styles.itemContainer} activeOpacity={0.8}>
        <View style={[styles.iconContainer, { backgroundColor: getIconColor(item.type) }]}>
          <Ionicons name={item.icon} size={20} color="white" />
        </View>
        
        <View style={styles.itemContentContainer}>
          <View style={styles.itemTitleRow}>
            <Text style={styles.itemName}>{item.name}</Text>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={12} color={Colors.dark.accentOrange} />
              <Text style={styles.ratingText}>{item.rating?.toFixed(1) || '—'}</Text>
            </View>
          </View>
          
          <Text style={styles.itemAddress}>{item.address}</Text>
          
          <View style={styles.itemFooterRow}>
            <View style={styles.distanceContainer}>
              <Ionicons name="location" size={12} color={Colors.dark.textSecondary} />
              <Text style={styles.distanceText}>{item.distance.toFixed(1)} km</Text>
            </View>
            
            {item.isOpen ? (
              <View style={styles.openContainer}>
                <View style={styles.openDot} />
                <Text style={styles.openText}>Open • Until {item.openUntil}</Text>
              </View>
            ) : (
              <View style={styles.closedContainer}>
                <View style={styles.closedDot} />
                <Text style={styles.closedText}>Closed</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSectionHeader = ({ section }: { section: SectionData }) => {
    return (
      <View style={styles.sectionHeader}>
        <Ionicons name={section.icon} size={18} color={Colors.dark.text} />
        <Text style={styles.sectionTitle}>{section.title}</Text>
      </View>
    );
  };

  const getIconColor = (type: string): string => {
    switch (type) {
      case 'supermarket':
        return Colors.dark.accentGreen;
      case 'laundromat':
        return Colors.dark.accentBlue;
      case 'pharmacy':
        return Colors.dark.accentRed;
      case 'gas':
        return Colors.dark.accentOrange;
      default:
        return Colors.dark.tint;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Stack.Screen options={{ title: 'Essentials Nearby' }} />
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.dark.tint} />
          <Text style={styles.loadingText}>Finding essentials near you...</Text>
        </View>
      ) : (
        <SectionList
          sections={essentials}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.scrollContent}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          stickySectionHeadersEnabled={false}
          showsVerticalScrollIndicator={false}
        />
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.dark.text,
    marginLeft: 8,
  },
  itemContainer: {
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    marginBottom: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemContentContainer: {
    flex: 1,
  },
  itemTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark.text,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ratingText: {
    fontSize: 12,
    color: Colors.dark.text,
    marginLeft: 2,
  },
  itemAddress: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    marginBottom: 6,
  },
  itemFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  openContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  openDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.dark.accentGreen,
    marginRight: 4,
  },
  openText: {
    fontSize: 12,
    color: Colors.dark.accentGreen,
  },
  closedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  closedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.dark.accentRed,
    marginRight: 4,
  },
  closedText: {
    fontSize: 12,
    color: Colors.dark.accentRed,
  },
}); 