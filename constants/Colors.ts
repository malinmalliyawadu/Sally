/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

/**
 * Van Life App Dark Mode Color Scheme
 */

const tintColorLight = '#0a7ea4';
const tintColorDark = '#4ECDC4';

// Card colors for dark mode
const cardDark = '#1E272E'; 
const cardLight = '#ffffff';

// Accent colors
const accentOrange = '#FF9800';
const accentBlue = '#4ECDC4';
const accentGreen = '#2ECC71';
const accentRed = '#E74C3C';
const accentPurple = '#9B59B6';

export const Colors = {
  light: {
    text: '#11181C',
    textSecondary: '#687076',
    background: '#F5F5F5',
    tint: tintColorLight,
    card: cardLight,
    cardBorder: '#E0E0E0',
    shadow: '#000000',
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    accentOrange,
    accentBlue,
    accentGreen,
    accentRed,
    accentPurple,
  },
  dark: {
    text: '#ECEDEE',
    textSecondary: '#9BA1A6',
    background: '#121212',
    tint: tintColorDark,
    card: cardDark,
    cardBorder: '#343941',
    shadow: '#000000',
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    accentOrange,
    accentBlue,
    accentGreen,
    accentRed,
    accentPurple,
  },
};
