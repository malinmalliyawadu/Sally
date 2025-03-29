# Sally - Van Life Companion App for Aotearoa

Sally is a comprehensive mobile application designed to enhance your van life experience in Aotearoa (New Zealand). Built with [Expo](https://expo.dev), this app provides essential tools and information for travelers exploring NZ by van.

## Features

- **Location-based campsite finder**
- **Points of interest and scenic routes**
- **Local weather forecasts**
- **Waste station locator**
- **Emergency services information**
- **Trip planning tools**

## Getting Started

### Prerequisites

- Node.js (18.x or newer)
- npm or yarn
- iOS Simulator or Android Emulator (optional for development)

### Installation

1. Clone the repository

2. Install dependencies
   ```bash
   npm install
   ```

3. Start the application
   ```bash
   npx expo start
   ```

   This will open the Expo development server with options to run the app on:
   - iOS simulator
   - Android emulator
   - Your physical device using Expo Go
   - Development build

## Development

This project uses Expo's file-based routing system. The main application code is located in the **app** directory.

Key dependencies:
- React Native Maps
- Expo Location
- AsyncStorage for data persistence
- Expo Router for navigation
