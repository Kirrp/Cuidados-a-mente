import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#FFFFFF',
    tint: '#6413A3',
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: '#6413A3',
    backgroundElement: '#F1E4FA',
    backgroundSelected: '#E8D5F5',
    textSecondary: '#687076',
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: '#C78BE8',
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: '#C78BE8',
    backgroundElement: '#2A1D30',
    backgroundSelected: '#3A2942',
    textSecondary: '#AEB4B8',
  },
} as const;

export type Theme = (typeof Colors)['light'];
export type ThemeColor = keyof Theme;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    serif: 'Georgia, serif',
    rounded: '"Arial Rounded MT Bold", "Trebuchet MS", sans-serif',
    mono: 'monospace',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 12,
  four: 16,
  five: 20,
  six: 24,
} as const;

export const BottomTabInset = 0;
export const MaxContentWidth = 960;

export const Design = {
  colors: {
    primary: '#6413A3',
    surface: '#FFFFFF',
    surfaceSelected: '#F1E4FA',
    border: '#E4D8EA',
  },
  navigation: {
    height: 72,
  },
  radius: {
    control: 12,
  },
  image: {
    icon: 40,
  },
} as const;
