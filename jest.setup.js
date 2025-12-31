// Mock Expo modules that aren't needed for utility tests
jest.mock('expo-location', () => ({}));
jest.mock('expo-image-picker', () => ({}));
jest.mock('expo-media-library', () => ({}));
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));
