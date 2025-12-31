# Sally - Van Life Companion App

A React Native mobile application built with Expo for van travelers exploring New Zealand (Aotearoa). Track your journey, discover points of interest, journal your experiences, and unlock location-based achievements.

## Tech Stack

- **Expo SDK 54** (latest)
- **React 19.1.0**
- **React Native 0.81.5**
- **TypeScript**
- **Expo Router** (file-based routing)
- **Native Tabs** (`expo-router/unstable-native-tabs`) - True native platform tab bars

### Key Dependencies

- `react-native-maps` - Interactive maps with Google Maps provider
- `expo-location` - GPS tracking and reverse geocoding
- `@react-native-async-storage/async-storage` - Local data persistence
- `expo-image-picker` - Photo selection and camera integration
- `expo-media-library` - Access to device photo library
- `expo-blur` - Glass effect for iOS tab bar
- `@expo/vector-icons` - Ionicons icon set
- `proj4` - Accurate NZTM to WGS84 coordinate transformation

### Testing

- **Jest** with **ts-jest** preset for TypeScript support
- Unit tests in `__tests__/` directory
- Utility functions extracted to `app/(tabs)/explore.utils.ts` for testability
- **24 test cases** with **95.6% code coverage**

**Run tests:**
```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

## Project Structure

```
/Users/malin/Projects/Sally/
├── app/
│   ├── _layout.tsx                    # Root layout
│   └── (tabs)/
│       ├── _layout.tsx                # Native tabs configuration
│       ├── index.tsx                  # Dashboard tab
│       ├── map.tsx                    # Interactive map tab
│       ├── explore.tsx                # POI discovery tab
│       ├── explore.utils.ts           # Testable utility functions (Explore)
│       ├── journal.tsx                # Journal entries tab
│       └── trophies.tsx               # Achievement system tab
├── __tests__/
│   └── explore.utils.test.ts          # Unit tests for explore utilities
├── assets/
│   ├── trophies.json                  # Trophy definitions
│   ├── icon.png
│   ├── splash-icon.png
│   ├── adaptive-icon.png
│   └── favicon.png
├── .env                               # API keys (not in git)
├── .env.example                       # API key template
├── app.config.js                      # Expo configuration with env vars
├── app.json                           # App metadata
├── jest.config.js                     # Jest testing configuration
├── jest.setup.js                      # Jest mocks for Expo modules
├── package.json
└── tsconfig.json
```

## Features

### 1. Dashboard (`app/(tabs)/index.tsx`)
- Current location display with reverse geocoding
- Weather placeholder (ready for API integration)
- Quick stats: Places Visited, Distance Traveled, Journal Entries
- Quick action buttons: New Journal Entry, Find Nearby, Plan Route
- Clean white cards on gray background with iOS blue (#007AFF) accents
- Minimal shadows, outline icons, professional design

### 2. Map (`app/(tabs)/map.tsx`)
- Google Maps integration with native controls
- Real-time user location tracking
- POI markers (clickable with Google Places API integration)
- Freedom camping area markers
- Journal entry markers (green book icons)
- Polyline connections from user to selected location
- Detailed POI modal with:
  - Name, rating, formatted address
  - Distance and travel duration
  - Photo gallery with pagination
  - Directions to Apple Maps and Google Maps
  - Journal entry viewing (for journal markers)
- Location permission handling

**Important Implementation Details:**
- Uses `PROVIDER_GOOGLE` for Android compatibility
- API key configured in `app.config.js` from environment variables
- Photos fetched via Google Places API
- Distance calculations use Haversine formula
- Animated slide-up modal with spring animation

### 3. Explore (`app/(tabs)/explore.tsx`)
**Real-time POI discovery with advanced hiking trail integration:**

- **Search & Filters:**
  - Real-time search bar with debouncing
  - Category filters: All, Food, Fuel, Camping, Attractions, **Hiking**
  - Sorted by proximity to user

- **Google Places Integration:**
  - Live data for restaurants, cafes, fuel, camping
  - Ratings, reviews, photos, opening hours
  - 5-minute cache with location-based invalidation
  - Pagination for large result sets

- **DOC Tracks Integration (Hiking):**
  - **3000+ NZ Department of Conservation walking tracks**
  - Accurate NZTM → WGS84 coordinate conversion (proj4)
  - Track metadata: distance, duration, difficulty
  - Categorized: Great Walks, Day Walks, Short Walks
  - **Progressive rendering** - shows basic info immediately, enhances with photos/ratings in background
  - **Fuzzy matching** to cross-reference with Google Places ratings

- **Smart Rating Matching (`explore.utils.ts`):**
  - Removes noise words ("Track", "Trail", "Scenic", "Reserve") from search
  - Heavily weights results with ratings (30 points base + 10 for high ratings + 20 for review count)
  - Accepts matches with score ≥ 35 (with rating) or ≥ 50 (high confidence)
  - Example: "Tokatoka Scenic Reserve Track" → searches "Tokatoka hike" → finds "Tokatoka Lookout Track" (4.7⭐)

- **Place Cards Display:**
  - Photos, name, type badges (Great Walk, Day Walk, Short Walk)
  - Star ratings + review counts
  - Track distance & duration (for trails)
  - Distance from user + "Open Now" status
  - Tap to open in Apple Maps, Google Maps, or DOC website

**Testable Architecture:**
- Core utilities extracted to `explore.utils.ts`
- Functions: `calculateDistance`, `nztmToWGS84`, `stringSimilarity`, `scoreMatch`, `cleanSearchQuery`
- 24 unit tests with 95.6% coverage

### 4. Journal (`app/(tabs)/journal.tsx`)
**Most complex component with:**

- **Photo Management:**
  - Auto-suggested photos from today using `MediaLibrary.getAssetsAsync()`
  - Toggle selection in "Today's Photos" section (tap to select/unselect)
  - Photo picker for selecting from library
  - Camera integration for taking new photos
  - Selected photo counter

- **Activity Tracking:**
  - Distance traveled calculation
  - Places visited counter
  - Stored in location history for trophy checking

- **Smart Features:**
  - Title suggestions based on current location ("Day in [City]")
  - Coordinates stored with each entry
  - Entry highlighting when navigated from map
  - Timestamp for all entries

- **Data Storage:**
  - AsyncStorage key: `@sally_journal_entries`
  - Location history key: `@sally_location_history`
  - Each entry includes: id, title, content, photos, location, coordinates, timestamp, distance, placesVisited

**Critical Fix for Photo Display:**
Must use `MediaLibrary.getAssetInfoAsync(asset.id)` to get `localUri` - direct URIs from `getAssetsAsync()` cause "no suitable url request handler found" error.

### 5. Trophies (`app/(tabs)/trophies.tsx`)
**Achievement system with location-based unlocking:**

- **Trophy Storage:**
  - Definitions: `/assets/trophies.json` (15 achievements)
  - Unlocked state: AsyncStorage `@sally_unlocked_trophies`

- **Rule Types:**
  - `visit_any` - Visit any location (count)
  - `visit_count` - Visit N unique locations
  - `visit_location` - GPS coordinates + radius (meters)
  - `visit_poi_type` - Visit specific POI type (e.g., camping)
  - `visit_region` - N locations in North/South Island (split at -41.5° latitude)
  - `daily_distance` - Distance in single day (km)
  - `total_distance` - Total distance traveled (km)
  - `total_journals` - Number of journal entries
  - `total_photos` - Total photos across all entries
  - `journal_time` - Entry created before specific hour
  - `weekend_journals` - N entries in a single weekend

- **UI Features:**
  - Category filtering (all, beginner, exploration, distance, landmark, camping, journaling)
  - Locked trophies: grayed out with 60% opacity
  - Unlocked trophies: gold icons (#FFD700) with checkmark badge
  - Progress counter: X/15 unlocked
  - Refresh button for manual checking
  - Auto-check on page load

- **Distance Calculations:**
  - Haversine formula for accurate lat/lon distance
  - Earth radius: 6371 km
  - Returns distance in kilometers

## Native Tabs Configuration

Located in `app/(tabs)/_layout.tsx`:

```typescript
import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';
```

**Critical Details:**
- Must use `expo-router/unstable-native-tabs` (NOT `expo-router/ui`)
- Icons use SF Symbols for iOS: `sf={{ default: 'house', selected: 'house.fill' }}`
- Android fallback: `drawable="ic_menu_home"`
- Glass effect applied on iOS automatically with `expo-blur`

## Environment Variables

Required API keys in `.env`:

```bash
EXPO_PUBLIC_GOOGLE_PLACES_API_KEY=your_key_here
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here
EXPO_PUBLIC_DOC_API_KEY=your_key_here
```

**Setup:**

**Google Maps & Places:**
1. Get keys from: https://console.cloud.google.com/google/maps-apis
2. Enable: Google Places API, Google Maps SDK for Android, Google Maps SDK for iOS, Text Search API
3. Can use same key for both if both APIs are enabled
4. Keys are loaded in `app.config.js` via `process.env`

**DOC API (Department of Conservation):**
1. Get API key from: https://api.doc.govt.nz
2. Used for 3000+ NZ walking tracks data
3. Free tier available for non-commercial use

## Permissions

### iOS (`app.config.js` - infoPlist)
- `NSLocationWhenInUseUsageDescription` - Location access for POIs/camping
- `NSPhotoLibraryUsageDescription` - Photo suggestions for journal
- `NSCameraUsageDescription` - Take photos for journal

### Android (`app.config.js` - permissions array)
- `ACCESS_COARSE_LOCATION`
- `ACCESS_FINE_LOCATION`
- `READ_MEDIA_IMAGES`
- `CAMERA`

## Installation & Setup

```bash
# Install dependencies
npm install

# Run on iOS
npx expo start --ios

# Run on Android
npx expo start --android

# Clear cache if needed
npx expo start --clear
```

**Note:** Some dependencies installed with `--legacy-peer-deps` flag due to React 19 compatibility.

## Data Flow

### Journal → Trophies
1. User creates journal entry with photos and location
2. Entry saved to AsyncStorage (`@sally_journal_entries`)
3. Location added to history (`@sally_location_history`)
4. Trophy system checks all rules against data
5. Newly unlocked trophies saved (`@sally_unlocked_trophies`)

### Map → Journal
1. User taps journal marker on map
2. Modal shows entry details with photos
3. "View Full Entry" navigates to journal tab
4. Entry is highlighted in journal list

## Common Issues & Fixes

### 1. Icons Not Showing in Tabs
**Problem:** Tab bar icons are blank
**Solution:** Use `sf` prop (not `ios`), import from `unstable-native-tabs`

### 2. Photo Display Error
**Problem:** "No suitable url request handler found"
**Solution:** Use `MediaLibrary.getAssetInfoAsync()` for `localUri`, not direct `uri`

### 3. AsyncStorage Peer Dependency
**Problem:** npm install fails with peer dependency conflict
**Solution:** Install with `--legacy-peer-deps` flag

### 4. NativeTabs Undefined
**Problem:** `Cannot read property 'Trigger' of undefined`
**Solution:** Import from `'expo-router/unstable-native-tabs'` not `'expo-router/ui'`

## Design Principles

- **Clean & Professional:** White cards, subtle shadows, gray backgrounds
- **iOS Blue Accent:** #007AFF for primary actions and active states
- **No Gradients:** User rejected gradient design as "tacky"
- **Outline Icons:** Use outline style (e.g., `home-outline`) for consistency
- **Native Feel:** Use platform-specific native tabs and icons
- **Minimal Text:** Icons and visual hierarchy over verbose labels

## Future Enhancements

- Replace sample POI data with real NZ database
- Integrate weather API for dashboard
- Add route planning functionality
- Implement social sharing for journal entries
- Export journal as PDF
- Offline map caching
- Push notifications for nearby attractions
- Community POI submissions

## Bundle Identifiers

- iOS: `com.anonymous.sally`
- Android: `com.anonymous.sally`

## Git

- Main branch: `main`
- .gitignore includes: `.env`, `/ios`, `/android`, `node_modules/`
- Rebuild from scratch on Expo SDK 54 (commit: f58709e)

## Important Notes

1. **New Expo Architecture Enabled:** `newArchEnabled: true` in app.config.js
2. **Edge-to-Edge on Android:** Modern full-screen experience
3. **Auto Dark Mode:** `userInterfaceStyle: "automatic"`
4. **TypeScript:** Strict mode enabled, full type coverage
5. **Location History:** Stored but not displayed yet - ready for timeline view
6. **Trophy Checking:** Manual refresh button + auto-check on load
7. **Google Maps Required:** Native maps on Android needs API key in app.config.js

## Development History

Project completely rebuilt from scratch with latest Expo SDK 54. Features added incrementally:
1. Fresh Expo project with TypeScript
2. Native tab navigation
3. Dashboard with location & stats
4. Interactive map with POIs
5. Explore page with search/filters
6. Journal with photos & activity tracking
7. Trophy/achievement system

Each feature was tested and committed individually before moving to the next.
