import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LocationData } from '../../utils/locationService';
import { getJournalEntries, JournalEntry } from '../../utils/journalService';
import { Colors } from '@/constants/Colors';

interface JournalReminderCardProps {
  location: LocationData | null;
  isLoading: boolean;
}

export default function JournalReminderCard({ location, isLoading }: JournalReminderCardProps) {
  const router = useRouter();
  const [lastEntry, setLastEntry] = useState<JournalEntry | null>(null);
  const [timePassedText, setTimePassedText] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLastEntry();
  }, []);

  const loadLastEntry = async () => {
    try {
      setLoading(true);
      const entries = await getJournalEntries();
      if (entries.length > 0) {
        setLastEntry(entries[0]); // Get the most recent entry (already sorted in getJournalEntries)
        calculateTimePassed(entries[0].timestamp);
      }
    } catch (error) {
      console.error('Error loading last journal entry:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTimePassed = (timestamp: number) => {
    const now = Date.now();
    const timePassed = now - timestamp;
    
    // Convert to hours
    const hoursPassed = Math.floor(timePassed / (1000 * 60 * 60));
    
    if (hoursPassed < 1) {
      setTimePassedText('Less than an hour ago');
    } else if (hoursPassed === 1) {
      setTimePassedText('1 hour ago');
    } else if (hoursPassed < 24) {
      setTimePassedText(`${hoursPassed} hours ago`);
    } else {
      const daysPassed = Math.floor(hoursPassed / 24);
      if (daysPassed === 1) {
        setTimePassedText('1 day ago');
      } else {
        setTimePassedText(`${daysPassed} days ago`);
      }
    }
  };

  const navigateToJournal = () => {
    router.push('/(tabs)/journal');
  };

  const needsReminder = () => {
    if (!lastEntry) return true;
    
    const hoursSinceLastEntry = (Date.now() - lastEntry.timestamp) / (1000 * 60 * 60);
    // Remind if it's been more than 6 hours since the last entry
    return hoursSinceLastEntry > 6;
  };

  return (
    <View style={styles.card}>
      <View style={styles.iconContainer}>
        <Ionicons name="book" size={32} color={Colors.dark.accentPurple} />
      </View>
      <View style={styles.contentContainer}>
        <Text style={styles.title}>Journal Reminder</Text>
        {isLoading || loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={Colors.dark.tint} />
            <Text style={styles.loadingText}>Checking journal status...</Text>
          </View>
        ) : lastEntry ? (
          <>
            <Text style={styles.journalStatus}>
              Last entry: <Text style={styles.locationText}>{lastEntry.location.placeName}</Text>
            </Text>
            <Text style={styles.timeText}>{timePassedText}</Text>
            {needsReminder() && (
              <Text style={styles.reminderText}>
                Time to add a new journal entry for your journey!
              </Text>
            )}
            <TouchableOpacity style={styles.addButton} onPress={navigateToJournal}>
              <Ionicons name="add-circle" size={16} color="white" />
              <Text style={styles.addButtonText}>Add Journal Entry</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.emptyText}>No journal entries yet</Text>
            <Text style={styles.reminderText}>
              Start documenting your journey with your first entry!
            </Text>
            <TouchableOpacity style={styles.addButton} onPress={navigateToJournal}>
              <Ionicons name="add-circle" size={16} color="white" />
              <Text style={styles.addButtonText}>Start Your Journal</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.dark.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    shadowColor: Colors.dark.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
  },
  iconContainer: {
    marginRight: 16,
    justifyContent: 'center',
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: Colors.dark.textSecondary,
  },
  journalStatus: {
    fontSize: 16,
    color: Colors.dark.text,
    marginBottom: 2,
  },
  locationText: {
    fontWeight: '700',
  },
  timeText: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    marginBottom: 6,
  },
  reminderText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: Colors.dark.accentPurple,
    marginBottom: 10,
  },
  addButton: {
    backgroundColor: Colors.dark.accentPurple,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 6,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.dark.textSecondary,
    fontStyle: 'italic',
    marginLeft: 8,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.dark.text,
    marginBottom: 2,
  },
}); 