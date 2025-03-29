import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Dimensions } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT, Region, Callout } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

import { Colors } from '@/constants/Colors';
import { JournalEntry } from '@/utils/journalService';

interface JourneyMapProps {
  entries: JournalEntry[];
}

export default function JourneyMap({ entries }: JourneyMapProps) {
  const mapRef = useRef<MapView>(null);
  const [mapReady, setMapReady] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);

  // Calculate the initial map region to fit all points
  const getInitialRegion = (): Region | undefined => {
    if (entries.length === 0) return undefined;

    // If there's only one entry, center on it
    if (entries.length === 1) {
      return {
        latitude: entries[0].location.latitude,
        longitude: entries[0].location.longitude,
        latitudeDelta: 0.5,
        longitudeDelta: 0.5,
      };
    }

    // Calculate bounds for all entries
    let minLat = Number.MAX_VALUE;
    let maxLat = Number.MIN_VALUE;
    let minLng = Number.MAX_VALUE;
    let maxLng = Number.MIN_VALUE;

    entries.forEach(entry => {
      minLat = Math.min(minLat, entry.location.latitude);
      maxLat = Math.max(maxLat, entry.location.latitude);
      minLng = Math.min(minLng, entry.location.longitude);
      maxLng = Math.max(maxLng, entry.location.longitude);
    });

    // Add padding
    const PADDING = 0.5;
    minLat -= PADDING;
    maxLat += PADDING;
    minLng -= PADDING;
    maxLng += PADDING;

    // Calculate center point and deltas
    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;
    const latDelta = maxLat - minLat;
    const lngDelta = maxLng - minLng;

    return {
      latitude: centerLat,
      longitude: centerLng,
      latitudeDelta: latDelta,
      longitudeDelta: lngDelta,
    };
  };

  // Get journey path coordinates for the polyline
  const getJourneyPathCoordinates = () => {
    // Sort entries by timestamp (oldest first) to draw the path correctly
    return [...entries]
      .sort((a, b) => a.timestamp - b.timestamp)
      .map(entry => ({
        latitude: entry.location.latitude,
        longitude: entry.location.longitude,
      }));
  };

  // Format entry date
  const formatEntryDate = (timestamp: number) => {
    return format(new Date(timestamp), 'MMM d, yyyy - h:mm a');
  };

  // Fit map to show all markers
  const fitToMarkers = () => {
    if (!mapRef.current || entries.length === 0) return;
    
    const initialRegion = getInitialRegion();
    if (initialRegion) {
      mapRef.current.animateToRegion(initialRegion, 1000);
    }
  };

  // Handle marker press
  const handleMarkerPress = (entry: JournalEntry) => {
    setSelectedEntry(entry);
  };

  // Fit to markers when map is ready and when entries change
  useEffect(() => {
    if (mapReady && entries.length > 0) {
      fitToMarkers();
    }
  }, [mapReady, entries.length]);

  // Get sorted entries for display
  const getSortedEntries = () => {
    return [...entries].sort((a, b) => a.timestamp - b.timestamp);
  };

  // Get stop number (chronological order)
  const getStopNumber = (entry: JournalEntry) => {
    const sortedEntries = getSortedEntries();
    return sortedEntries.findIndex(e => e.id === entry.id) + 1;
  };

  const sortedEntries = getSortedEntries();
  const startPoint = sortedEntries[0];
  const endPoint = sortedEntries[sortedEntries.length - 1];

  return (
    <View style={styles.container}>
      {entries.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="map" size={64} color={Colors.dark.textSecondary} />
          <Text style={styles.emptyText}>
            No journey data available yet
          </Text>
        </View>
      ) : (
        <>
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={PROVIDER_DEFAULT}
            initialRegion={getInitialRegion()}
            onMapReady={() => setMapReady(true)}
            onLayout={() => {}}
            showsUserLocation={true}
            showsCompass={true}
            showsScale={true}
            rotateEnabled={true}
          >
            {/* Draw the journey path line */}
            <Polyline
              coordinates={getJourneyPathCoordinates()}
              strokeColor={Colors.dark.tint}
              strokeWidth={3}
              lineDashPattern={[1, 0]}
            />
            
            {/* Place markers for each entry */}
            {entries.map((entry) => (
              <Marker
                key={entry.id}
                coordinate={{
                  latitude: entry.location.latitude,
                  longitude: entry.location.longitude,
                }}
                onPress={() => handleMarkerPress(entry)}
                pinColor={entry.isAutoGenerated ? Colors.dark.accentBlue : Colors.dark.accentGreen}
              >
                {/* Special markers for start and end points */}
                {entry.id === startPoint.id || entry.id === endPoint.id ? (
                  <View style={[
                    styles.specialMarker,
                    entry.id === startPoint.id ? styles.startMarker : styles.endMarker
                  ]}>
                    <Ionicons
                      name={entry.id === startPoint.id ? "flag" : "location"}
                      size={18}
                      color="white"
                    />
                  </View>
                ) : (
                  <View style={[
                    styles.markerLabel,
                    entry.isAutoGenerated ? styles.autoMarker : styles.manualMarker
                  ]}>
                    <Text style={styles.markerText}>
                      {getStopNumber(entry)}
                    </Text>
                  </View>
                )}
                
                <Callout tooltip style={styles.calloutContainer}>
                  <View style={styles.callout}>
                    <Text style={styles.calloutTitle}>{entry.location.placeName}</Text>
                    <Text style={styles.calloutDate}>{formatEntryDate(entry.timestamp)}</Text>
                    
                    {entry.distanceTraveled && (
                      <View style={styles.calloutStat}>
                        <Ionicons name="speedometer-outline" size={14} color={Colors.dark.accentOrange} />
                        <Text style={styles.calloutStatText}>
                          {entry.distanceTraveled.toFixed(1)} km traveled
                        </Text>
                      </View>
                    )}
                    
                    {entry.notes && (
                      <Text style={styles.calloutNotes} numberOfLines={2}>{entry.notes}</Text>
                    )}
                    
                    <View style={styles.calloutFooter}>
                      <View style={styles.calloutType}>
                        <View style={[
                          styles.calloutTypeDot,
                          { backgroundColor: entry.isAutoGenerated ? Colors.dark.accentBlue : Colors.dark.accentGreen }
                        ]} />
                        <Text style={styles.calloutTypeText}>
                          {entry.isAutoGenerated ? 'Auto' : 'Manual'} entry
                        </Text>
                      </View>
                      <Text style={styles.calloutStop}>Stop #{getStopNumber(entry)}</Text>
                    </View>
                  </View>
                  <View style={styles.calloutArrow} />
                </Callout>
              </Marker>
            ))}
          </MapView>
          
          {/* Journey stats */}
          <View style={styles.journeyStats}>
            <Text style={styles.journeyStatsTitle}>Your Journey</Text>
            <Text style={styles.journeyStatsText}>
              {entries.length} stops over {Math.ceil((endPoint.timestamp - startPoint.timestamp) / (1000 * 60 * 60 * 24))} days
            </Text>
          </View>
          
          {/* Fit to markers button */}
          <TouchableOpacity 
            style={styles.fitButton} 
            onPress={fitToMarkers}
          >
            <Ionicons name="expand" size={22} color={Colors.dark.text} />
          </TouchableOpacity>
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
  map: {
    width: '100%',
    height: '100%',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    marginTop: 16,
  },
  journeyStats: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(18, 18, 18, 0.8)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
  },
  journeyStatsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.dark.text,
    marginBottom: 4,
  },
  journeyStatsText: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
  },
  fitButton: {
    position: 'absolute',
    bottom: 96,
    right: 16,
    backgroundColor: Colors.dark.card,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  markerLabel: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  specialMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  startMarker: {
    backgroundColor: Colors.dark.accentGreen,
  },
  endMarker: {
    backgroundColor: Colors.dark.accentRed,
  },
  autoMarker: {
    backgroundColor: Colors.dark.accentBlue,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  manualMarker: {
    backgroundColor: Colors.dark.accentGreen,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  markerText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  calloutContainer: {
    width: 250,
  },
  callout: {
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.dark.text,
    marginBottom: 2,
  },
  calloutDate: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    marginBottom: 6,
  },
  calloutStat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  calloutStatText: {
    fontSize: 12,
    color: Colors.dark.accentOrange,
    marginLeft: 4,
  },
  calloutNotes: {
    fontSize: 13,
    color: Colors.dark.text,
    marginBottom: 6,
  },
  calloutFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  calloutType: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calloutTypeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  calloutTypeText: {
    fontSize: 11,
    color: Colors.dark.textSecondary,
  },
  calloutStop: {
    fontSize: 11,
    color: Colors.dark.textSecondary,
    fontWeight: '600',
  },
  calloutArrow: {
    backgroundColor: 'transparent',
    borderTopWidth: 16,
    borderTopColor: Colors.dark.card,
    borderRightWidth: 16,
    borderRightColor: 'transparent',
    borderLeftWidth: 16,
    borderLeftColor: 'transparent',
    width: 32,
    height: 16,
    alignSelf: 'center',
    marginTop: -2,
  },
}); 