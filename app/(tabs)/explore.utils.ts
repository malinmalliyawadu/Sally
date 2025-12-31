import proj4 from 'proj4';

// Define NZTM (EPSG:2193) projection
proj4.defs('EPSG:2193', '+proj=tmerc +lat_0=0 +lon_0=173 +k=0.9996 +x_0=1600000 +y_0=10000000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs');

// Haversine distance calculation
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Convert NZTM (x, y) coordinates to WGS84 (lat, lng)
export const nztmToWGS84 = (x: number, y: number): { lat: number; lng: number } => {
  const [lng, lat] = proj4('EPSG:2193', 'EPSG:4326', [x, y]);
  return { lat, lng };
};

// Calculate string similarity (0-1, where 1 is identical)
export const stringSimilarity = (str1: string, str2: string): number => {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  if (s1 === s2) return 1;

  // Remove common noise words for better matching
  const noiseWords = ['track', 'trail', 'walk', 'walking', 'scenic', 'reserve', 'tramping', 'hike', 'hiking'];

  const cleanString = (str: string) => {
    let cleaned = str;
    noiseWords.forEach(word => {
      cleaned = cleaned.replace(new RegExp(`\\b${word}\\b`, 'gi'), '');
    });
    return cleaned.trim().split(/\s+/).filter(w => w.length > 0);
  };

  const words1 = cleanString(s1);
  const words2 = cleanString(s2);

  // If no meaningful words left after cleaning, use original
  const finalWords1 = words1.length > 0 ? words1 : s1.split(/\s+/);
  const finalWords2 = words2.length > 0 ? words2 : s2.split(/\s+/);

  let matchCount = 0;
  for (const word1 of finalWords1) {
    for (const word2 of finalWords2) {
      if (word1 === word2 || word1.includes(word2) || word2.includes(word1)) {
        matchCount++;
        break;
      }
    }
  }

  // Boost score if there's at least one meaningful match
  const similarity = matchCount / Math.max(finalWords1.length, finalWords2.length);

  // Extra boost if the key identifying words match (first significant word)
  if (finalWords1.length > 0 && finalWords2.length > 0) {
    const firstWord1 = finalWords1[0];
    const firstWord2 = finalWords2[0];
    if (firstWord1 === firstWord2 || firstWord1.includes(firstWord2) || firstWord2.includes(firstWord1)) {
      return Math.min(1, similarity + 0.2); // Boost for matching key identifier
    }
  }

  return similarity;
};

// Score a Google Places result for how well it matches a DOC track
export const scoreMatch = (result: any, trackName: string, trackLat: number, trackLng: number): number => {
  let score = 0;

  // 1. Name similarity (0-30 points) - reduced to make room for rating weight
  const nameSimilarity = stringSimilarity(trackName, result.name);
  score += nameSimilarity * 30;

  // 2. Location proximity (0-20 points) - reduced slightly
  const distance = calculateDistance(
    trackLat,
    trackLng,
    result.geometry.location.lat,
    result.geometry.location.lng
  );
  if (distance < 1) score += 20;
  else if (distance < 5) score += 15;
  else if (distance < 10) score += 10;
  else if (distance < 20) score += 5;

  // 3. Relevant types (0-10 points)
  const relevantTypes = ['tourist_attraction', 'natural_feature', 'park', 'point_of_interest'];
  const hasRelevantType = result.types?.some((t: string) => relevantTypes.includes(t));
  if (hasRelevantType) score += 10;

  // 4. Has star rating (0-30 points) - MASSIVELY INCREASED: having ratings is critical!
  if (result.rating) {
    score += 30;
    // Bonus points for higher ratings (0-10 points)
    if (result.rating >= 4.5) score += 10;
    else if (result.rating >= 4.0) score += 7;
    else if (result.rating >= 3.5) score += 5;
  }

  // 5. Rating count (0-20 points) - INCREASED: more reviews = much more likely to be correct
  if (result.user_ratings_total) {
    if (result.user_ratings_total > 200) score += 20;
    else if (result.user_ratings_total > 100) score += 17;
    else if (result.user_ratings_total > 50) score += 14;
    else if (result.user_ratings_total > 20) score += 10;
    else if (result.user_ratings_total > 5) score += 6;
  }

  return score;
};

// Clean search query by removing common noise words
export const cleanSearchQuery = (trackName: string): string => {
  const noiseWords = ['track', 'trail', 'walk', 'walking', 'scenic', 'reserve', 'tramping', 'hike', 'hiking', 'great', 'short', 'loop', 'circuit'];

  let cleaned = trackName;
  noiseWords.forEach(word => {
    // Remove whole words only (word boundaries)
    cleaned = cleaned.replace(new RegExp(`\\b${word}\\b`, 'gi'), '');
  });

  // Clean up extra spaces and trim
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  // If nothing meaningful left, return original
  return cleaned.length > 0 ? `${cleaned} hike` : trackName;
};

// Check if a place name or vicinity contains priority camping keywords
export const isPriorityCamping = (name: string, vicinity?: string): boolean => {
  const searchText = `${name.toLowerCase()} ${vicinity?.toLowerCase() || ''}`;

  // Check for priority camping keywords (exact phrases)
  const priorityKeywords = [
    'nzmca',
    'freedom camp',
    'freedom camping',
    'doc camp',
    'doc campsite',
    'doc campground',
    'self-contained',
  ];

  return priorityKeywords.some(keyword => searchText.includes(keyword));
};

// Identify camping type from place data
export const identifyCampingType = (
  name: string,
  vicinity?: string,
  types?: string[]
): 'nzmca' | 'freedom' | 'doc' | 'general' => {
  const searchText = `${name.toLowerCase()} ${vicinity?.toLowerCase() || ''}`;

  // Check for NZMCA
  if (searchText.includes('nzmca')) {
    return 'nzmca';
  }

  // Check for freedom camping
  if (searchText.includes('freedom camp') || searchText.includes('freedom camping')) {
    return 'freedom';
  }

  // Check for DOC camping
  if (searchText.includes('doc camp') || searchText.includes('doc campsite') || searchText.includes('doc campground')) {
    return 'doc';
  }

  // Default to general camping
  return 'general';
};
