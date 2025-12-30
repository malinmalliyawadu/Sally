import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import Ionicons from '@expo/vector-icons/Ionicons';
import trophyDefinitions from '../../assets/trophies.json';

interface Trophy {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  rule: any;
}

interface UnlockedTrophy {
  id: string;
  unlockedAt: number;
}

const JOURNAL_ENTRIES_KEY = '@sally_journal_entries';
const LOCATION_HISTORY_KEY = '@sally_location_history';
const UNLOCKED_TROPHIES_KEY = '@sally_unlocked_trophies';

export default function Trophies() {
  const [trophies, setTrophies] = useState<Trophy[]>(trophyDefinitions);
  const [unlockedTrophies, setUnlockedTrophies] = useState<UnlockedTrophy[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    loadUnlockedTrophies();
    checkTrophies();
  }, []);

  const loadUnlockedTrophies = async () => {
    try {
      const stored = await AsyncStorage.getItem(UNLOCKED_TROPHIES_KEY);
      if (stored) {
        setUnlockedTrophies(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading unlocked trophies:', error);
    }
  };

  const saveUnlockedTrophies = async (unlocked: UnlockedTrophy[]) => {
    try {
      await AsyncStorage.setItem(UNLOCKED_TROPHIES_KEY, JSON.stringify(unlocked));
      setUnlockedTrophies(unlocked);
    } catch (error) {
      console.error('Error saving unlocked trophies:', error);
    }
  };

  const checkTrophies = async () => {
    try {
      // Load user data
      const journalsString = await AsyncStorage.getItem(JOURNAL_ENTRIES_KEY);
      const locationHistoryString = await AsyncStorage.getItem(LOCATION_HISTORY_KEY);
      const unlockedString = await AsyncStorage.getItem(UNLOCKED_TROPHIES_KEY);

      const journals = journalsString ? JSON.parse(journalsString) : [];
      const locationHistory = locationHistoryString ? JSON.parse(locationHistoryString) : [];
      const currentUnlocked = unlockedString ? JSON.parse(unlockedString) : [];

      const newlyUnlocked: UnlockedTrophy[] = [];

      // Check each trophy
      for (const trophy of trophies) {
        // Skip if already unlocked
        if (currentUnlocked.some((u: UnlockedTrophy) => u.id === trophy.id)) {
          continue;
        }

        let unlocked = false;

        switch (trophy.rule.type) {
          case 'visit_any':
            unlocked = locationHistory.length >= trophy.rule.count;
            break;

          case 'visit_count':
            const uniqueLocations = new Set(
              locationHistory.map((l: any) => `${l.location.coords.latitude.toFixed(2)},${l.location.coords.longitude.toFixed(2)}`)
            );
            unlocked = uniqueLocations.size >= trophy.rule.count;
            break;

          case 'visit_location':
            unlocked = locationHistory.some((l: any) => {
              const distance = calculateDistance(
                l.location.coords.latitude,
                l.location.coords.longitude,
                trophy.rule.coordinates.latitude,
                trophy.rule.coordinates.longitude
              );
              return distance * 1000 <= trophy.rule.coordinates.radius;
            });
            break;

          case 'visit_poi_type':
            unlocked = locationHistory.some((l: any) => l.poiType === trophy.rule.poiType);
            break;

          case 'visit_region':
            const regionLocations = locationHistory.filter((l: any) => {
              const isNorthIsland = l.location.coords.latitude > -41.5;
              const matchesRegion = trophy.rule.region === 'North Island' ? isNorthIsland : !isNorthIsland;
              return matchesRegion;
            });
            const uniqueRegionLocations = new Set(
              regionLocations.map((l: any) => `${l.location.coords.latitude.toFixed(2)},${l.location.coords.longitude.toFixed(2)}`)
            );
            unlocked = uniqueRegionLocations.size >= trophy.rule.count;
            break;

          case 'daily_distance':
            const dailyDistances = calculateDailyDistances(locationHistory);
            unlocked = dailyDistances.some(d => d >= trophy.rule.distance);
            break;

          case 'total_distance':
            const totalDistance = calculateTotalDistance(locationHistory);
            unlocked = totalDistance >= trophy.rule.distance;
            break;

          case 'total_journals':
            unlocked = journals.length >= trophy.rule.count;
            break;

          case 'total_photos':
            const totalPhotos = journals.reduce((sum: number, j: any) => sum + (j.photos?.length || 0), 0);
            unlocked = totalPhotos >= trophy.rule.count;
            break;

          case 'journal_time':
            unlocked = journals.some((j: any) => {
              const hour = new Date(j.timestamp).getHours();
              return hour < trophy.rule.before;
            });
            break;

          case 'weekend_journals':
            const weekendJournals = journals.filter((j: any) => {
              const day = new Date(j.timestamp).getDay();
              return day === 0 || day === 6;
            });
            const weekendsByDate: { [key: string]: number } = {};
            weekendJournals.forEach((j: any) => {
              const date = new Date(j.timestamp).toDateString();
              weekendsByDate[date] = (weekendsByDate[date] || 0) + 1;
            });
            unlocked = Object.values(weekendsByDate).some(count => count >= trophy.rule.count);
            break;

          default:
            break;
        }

        if (unlocked) {
          newlyUnlocked.push({ id: trophy.id, unlockedAt: Date.now() });
        }
      }

      if (newlyUnlocked.length > 0) {
        const updated = [...currentUnlocked, ...newlyUnlocked];
        await saveUnlockedTrophies(updated);
      }
    } catch (error) {
      console.error('Error checking trophies:', error);
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const calculateDailyDistances = (history: any[]): number[] => {
    const dailyDistances: { [key: string]: number } = {};

    for (let i = 1; i < history.length; i++) {
      const prev = history[i - 1];
      const curr = history[i];
      const date = new Date(curr.timestamp).toDateString();

      const distance = calculateDistance(
        prev.location.coords.latitude,
        prev.location.coords.longitude,
        curr.location.coords.latitude,
        curr.location.coords.longitude
      );

      dailyDistances[date] = (dailyDistances[date] || 0) + distance;
    }

    return Object.values(dailyDistances);
  };

  const calculateTotalDistance = (history: any[]): number => {
    let total = 0;
    for (let i = 1; i < history.length; i++) {
      total += calculateDistance(
        history[i - 1].location.coords.latitude,
        history[i - 1].location.coords.longitude,
        history[i].location.coords.latitude,
        history[i].location.coords.longitude
      );
    }
    return total;
  };

  const isTrophyUnlocked = (trophyId: string): boolean => {
    return unlockedTrophies.some(t => t.id === trophyId);
  };

  const categories = ['all', ...new Set(trophies.map(t => t.category))];

  const filteredTrophies = selectedCategory === 'all'
    ? trophies
    : trophies.filter(t => t.category === selectedCategory);

  const unlockedCount = trophies.filter(t => isTrophyUnlocked(t.id)).length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Trophies</Text>
          <Text style={styles.subtitle}>
            {unlockedCount} / {trophies.length} unlocked
          </Text>
        </View>
        <TouchableOpacity style={styles.refreshButton} onPress={checkTrophies}>
          <Ionicons name="refresh-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Category Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
        contentContainerStyle={styles.categoriesContent}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryChip,
              selectedCategory === category && styles.categoryChipActive,
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text
              style={[
                styles.categoryLabel,
                selectedCategory === category && styles.categoryLabelActive,
              ]}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Trophies List */}
      <ScrollView style={styles.trophiesList} contentContainerStyle={styles.trophiesContent}>
        {filteredTrophies.map((trophy) => {
          const unlocked = isTrophyUnlocked(trophy.id);
          return (
            <View
              key={trophy.id}
              style={[styles.trophyCard, !unlocked && styles.trophyCardLocked]}
            >
              <View style={[styles.iconContainer, !unlocked && styles.iconContainerLocked]}>
                <Ionicons
                  name={trophy.icon as any}
                  size={32}
                  color={unlocked ? '#FFD700' : '#9ca3af'}
                />
              </View>
              <View style={styles.trophyInfo}>
                <Text style={[styles.trophyName, !unlocked && styles.trophyNameLocked]}>
                  {trophy.name}
                </Text>
                <Text style={styles.trophyDescription}>{trophy.description}</Text>
                <View style={styles.trophyFooter}>
                  <View style={[styles.categoryBadge, !unlocked && styles.categoryBadgeLocked]}>
                    <Text style={[styles.categoryBadgeText, !unlocked && styles.categoryBadgeTextLocked]}>
                      {trophy.category}
                    </Text>
                  </View>
                  {unlocked && (
                    <View style={styles.unlockedBadge}>
                      <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
                      <Text style={styles.unlockedText}>Unlocked</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          );
        })}
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
  refreshButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f7ff',
    justifyContent: 'center',
    alignItems: 'center',
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
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
  },
  categoryChipActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  categoryLabelActive: {
    color: '#ffffff',
  },
  trophiesList: {
    flex: 1,
  },
  trophiesContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  trophyCard: {
    flexDirection: 'row',
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
  trophyCardLocked: {
    opacity: 0.6,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFF9E6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  iconContainerLocked: {
    backgroundColor: '#f3f4f6',
  },
  trophyInfo: {
    flex: 1,
  },
  trophyName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  trophyNameLocked: {
    color: '#6b7280',
  },
  trophyDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  trophyFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#f0f7ff',
  },
  categoryBadgeLocked: {
    backgroundColor: '#f3f4f6',
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
  },
  categoryBadgeTextLocked: {
    color: '#9ca3af',
  },
  unlockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  unlockedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#22c55e',
  },
});
