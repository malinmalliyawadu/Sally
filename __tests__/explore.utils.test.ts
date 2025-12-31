import {
  calculateDistance,
  nztmToWGS84,
  stringSimilarity,
  scoreMatch,
  cleanSearchQuery,
} from '../app/(tabs)/explore.utils';

describe('explore.utils', () => {
  describe('calculateDistance', () => {
    it('should calculate distance between Auckland and Wellington', () => {
      // Auckland: -36.8485, 174.7633
      // Wellington: -41.2865, 174.7762
      const distance = calculateDistance(-36.8485, 174.7633, -41.2865, 174.7762);
      // Actual distance is ~493km
      expect(distance).toBeGreaterThan(490);
      expect(distance).toBeLessThan(500);
    });

    it('should return 0 for same location', () => {
      const distance = calculateDistance(-36.8485, 174.7633, -36.8485, 174.7633);
      expect(distance).toBe(0);
    });

    it('should calculate short distances accurately', () => {
      // Two points ~1km apart
      const distance = calculateDistance(-36.8485, 174.7633, -36.8575, 174.7633);
      expect(distance).toBeGreaterThan(0.9);
      expect(distance).toBeLessThan(1.1);
    });
  });

  describe('nztmToWGS84', () => {
    it('should convert Auckland NZTM to WGS84', () => {
      // Auckland Domain approximate NZTM: 1756736, 5918661
      // Expected WGS84: approximately -36.86, 174.78
      const result = nztmToWGS84(1756736, 5918661);
      expect(result.lat).toBeCloseTo(-36.86, 1);
      expect(result.lng).toBeCloseTo(174.78, 1);
    });

    it('should convert Wellington NZTM to WGS84', () => {
      // Wellington Te Papa approximate NZTM: 1749000, 5427000
      // Expected WGS84: approximately -41.29, 174.78
      const result = nztmToWGS84(1749000, 5427000);
      expect(result.lat).toBeCloseTo(-41.29, 1);
      expect(result.lng).toBeCloseTo(174.78, 1);
    });
  });

  describe('stringSimilarity', () => {
    it('should return 1 for identical strings', () => {
      expect(stringSimilarity('Mount Eden Track', 'Mount Eden Track')).toBe(1);
    });

    it('should return 1 for identical strings with different case', () => {
      expect(stringSimilarity('Mount Eden Track', 'mount eden track')).toBe(1);
    });

    it('should match tracks with different noise words', () => {
      const similarity = stringSimilarity(
        'Tokatoka Scenic Reserve Track',
        'Tokatoka Lookout Track'
      );
      // Should have high similarity due to matching "Tokatoka"
      expect(similarity).toBeGreaterThanOrEqual(0.7);
    });

    it('should give bonus for matching first key word', () => {
      const similarity = stringSimilarity(
        'Rangitoto Summit Track',
        'Rangitoto Walking Trail'
      );
      // Both start with "Rangitoto" after noise word removal
      expect(similarity).toBeGreaterThanOrEqual(0.7);
    });

    it('should handle partial word matches', () => {
      const similarity = stringSimilarity('Abel Tasman Track', 'Abel Tasman');
      expect(similarity).toBeGreaterThan(0.8);
    });

    it('should return low similarity for completely different names', () => {
      const similarity = stringSimilarity('Mount Eden Track', 'Rangitoto Summit');
      expect(similarity).toBeLessThan(0.3);
    });
  });

  describe('cleanSearchQuery', () => {
    it('should remove common noise words', () => {
      expect(cleanSearchQuery('Tokatoka Scenic Reserve Track')).toBe('Tokatoka hike');
    });

    it('should remove multiple noise words', () => {
      expect(cleanSearchQuery('Mount Eden Summit Walking Track')).toBe('Mount Eden Summit hike');
    });

    it('should preserve meaningful words', () => {
      expect(cleanSearchQuery('Abel Tasman Coast Track')).toBe('Abel Tasman Coast hike');
    });

    it('should handle already clean names', () => {
      expect(cleanSearchQuery('Tokatoka Lookout')).toBe('Tokatoka Lookout hike');
    });

    it('should return original if only noise words', () => {
      expect(cleanSearchQuery('Track')).toBe('Track');
    });

    it('should handle case insensitivity', () => {
      expect(cleanSearchQuery('MOUNT EDEN TRACK')).toBe('MOUNT EDEN hike');
    });

    it('should clean up extra spaces', () => {
      expect(cleanSearchQuery('Mount  Eden   Track')).toBe('Mount Eden hike');
    });
  });

  describe('scoreMatch', () => {
    const mockTrackLat = -36.8485;
    const mockTrackLng = 174.7633;

    it('should give high score for exact name match with rating', () => {
      const result = {
        name: 'Mount Eden Track',
        geometry: {
          location: {
            lat: mockTrackLat,
            lng: mockTrackLng,
          },
        },
        types: ['tourist_attraction'],
        rating: 4.7,
        user_ratings_total: 250,
      };

      const score = scoreMatch(result, 'Mount Eden Track', mockTrackLat, mockTrackLng);

      // Should get: 30 (perfect name) + 20 (distance <1km) + 10 (relevant type)
      // + 30 (has rating) + 7 (rating 4.7) + 20 (250 reviews)
      expect(score).toBeGreaterThan(110);
    });

    it('should penalize results without ratings', () => {
      const withRating = {
        name: 'Mount Eden Track',
        geometry: { location: { lat: mockTrackLat, lng: mockTrackLng } },
        types: ['tourist_attraction'],
        rating: 4.5,
        user_ratings_total: 100,
      };

      const withoutRating = {
        name: 'Mount Eden Track',
        geometry: { location: { lat: mockTrackLat, lng: mockTrackLng } },
        types: ['tourist_attraction'],
      };

      const scoreWith = scoreMatch(withRating, 'Mount Eden Track', mockTrackLat, mockTrackLng);
      const scoreWithout = scoreMatch(withoutRating, 'Mount Eden Track', mockTrackLat, mockTrackLng);

      // Difference should be at least 40 points (30 rating + 10 bonus + rating count)
      expect(scoreWith - scoreWithout).toBeGreaterThan(40);
    });

    it('should give bonus points for high ratings', () => {
      const highRating = {
        name: 'Mount Eden Track',
        geometry: { location: { lat: mockTrackLat, lng: mockTrackLng } },
        types: ['tourist_attraction'],
        rating: 4.8,
        user_ratings_total: 50,
      };

      const lowRating = {
        name: 'Mount Eden Track',
        geometry: { location: { lat: mockTrackLat, lng: mockTrackLng } },
        types: ['tourist_attraction'],
        rating: 3.0,
        user_ratings_total: 50,
      };

      const scoreHigh = scoreMatch(highRating, 'Mount Eden Track', mockTrackLat, mockTrackLng);
      const scoreLow = scoreMatch(lowRating, 'Mount Eden Track', mockTrackLat, mockTrackLng);

      // High rating should get bonus points
      expect(scoreHigh).toBeGreaterThan(scoreLow);
      expect(scoreHigh - scoreLow).toBeGreaterThan(5);
    });

    it('should score based on distance proximity', () => {
      const nearResult = {
        name: 'Mount Eden',
        geometry: { location: { lat: mockTrackLat, lng: mockTrackLng } },
        types: ['tourist_attraction'],
        rating: 4.5,
        user_ratings_total: 100,
      };

      // Location 10km away
      const farResult = {
        name: 'Mount Eden',
        geometry: { location: { lat: mockTrackLat + 0.09, lng: mockTrackLng } },
        types: ['tourist_attraction'],
        rating: 4.5,
        user_ratings_total: 100,
      };

      const scoreNear = scoreMatch(nearResult, 'Mount Eden Track', mockTrackLat, mockTrackLng);
      const scoreFar = scoreMatch(farResult, 'Mount Eden Track', mockTrackLat, mockTrackLng);

      // Near result should score higher
      expect(scoreNear).toBeGreaterThan(scoreFar);
    });

    it('should prefer results with more reviews', () => {
      const manyReviews = {
        name: 'Mount Eden',
        geometry: { location: { lat: mockTrackLat, lng: mockTrackLng } },
        types: ['tourist_attraction'],
        rating: 4.5,
        user_ratings_total: 500,
      };

      const fewReviews = {
        name: 'Mount Eden',
        geometry: { location: { lat: mockTrackLat, lng: mockTrackLng } },
        types: ['tourist_attraction'],
        rating: 4.5,
        user_ratings_total: 10,
      };

      const scoreMany = scoreMatch(manyReviews, 'Mount Eden Track', mockTrackLat, mockTrackLng);
      const scoreFew = scoreMatch(fewReviews, 'Mount Eden Track', mockTrackLat, mockTrackLng);

      expect(scoreMany).toBeGreaterThan(scoreFew);
    });

    it('should handle fuzzy name matching', () => {
      const result = {
        name: 'Tokatoka Lookout Track',
        geometry: { location: { lat: mockTrackLat, lng: mockTrackLng } },
        types: ['tourist_attraction'],
        rating: 4.6,
        user_ratings_total: 150,
      };

      const score = scoreMatch(result, 'Tokatoka Scenic Reserve Track', mockTrackLat, mockTrackLng);

      // Should still get a decent score due to fuzzy matching and ratings
      expect(score).toBeGreaterThan(70);
    });
  });
});
