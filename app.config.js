module.exports = {
  expo: {
    name: "Sally",
    slug: "sally",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.anonymous.sally",
      infoPlist: {
        NSLocationWhenInUseUsageDescription: "Sally needs access to your location to show nearby points of interest and freedom camping areas.",
        NSPhotoLibraryUsageDescription: "Sally needs access to your photos to suggest images for your journal entries.",
        NSCameraUsageDescription: "Sally needs access to your camera to take photos for your journal."
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      package: "com.anonymous.sally",
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      permissions: [
        "ACCESS_COARSE_LOCATION",
        "ACCESS_FINE_LOCATION",
        "READ_MEDIA_IMAGES",
        "CAMERA"
      ],
      config: {
        googleMaps: {
          apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "YOUR_GOOGLE_MAPS_API_KEY"
        }
      }
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins: [
      "expo-router",
      [
        "expo-location",
        {
          locationAlwaysAndWhenInUsePermission: "Sally needs access to your location to show nearby points of interest and freedom camping areas."
        }
      ]
    ]
  }
};
