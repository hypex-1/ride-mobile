import { MD3LightTheme, useTheme } from 'react-native-paper';
import { DefaultTheme as NavigationDefaultTheme, Theme as NavigationTheme } from '@react-navigation/native';
import type { MD3Theme } from 'react-native-paper';

const palette = {
  // Bolt's exact color scheme
  primary: '#34D186', // Bolt green
  primaryMuted: '#6EE5A7',
  primaryDark: '#2CAB73',
  secondary: '#1A1A1A',
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceVariant: '#F8F9FA',
  outline: '#E5E7EB',
  outlineDark: '#D1D5DB',
  success: '#34D186',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',
  muted: '#6B7280',
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  textLight: '#9CA3AF',
  mapGreen: '#34D186',
  rideGreen: '#25D366',
  shadowColor: '#000000',
} as const;

const basePaperTheme = MD3LightTheme as MD3Theme;

export const paperTheme: MD3Theme = {
  ...basePaperTheme,
  roundness: 12, // Bolt's slightly rounded corners
  colors: {
    ...basePaperTheme.colors,
    primary: palette.primary,
    primaryContainer: palette.primaryMuted,
    onPrimary: '#FFFFFF',
    secondary: palette.secondary,
    onSecondary: '#FFFFFF',
    tertiary: palette.success,
    onTertiary: '#FFFFFF',
    background: palette.background,
    surface: palette.surface,
    surfaceVariant: palette.surfaceVariant,
    outline: palette.outline,
    outlineVariant: palette.outlineDark,
    error: palette.danger,
    onError: '#FFFFFF',
    onSurface: palette.textPrimary,
    onSurfaceVariant: palette.textSecondary,
  },
};

export type AppTheme = typeof paperTheme;

export const navigationTheme: NavigationTheme = {
  ...NavigationDefaultTheme,
  colors: {
    ...NavigationDefaultTheme.colors,
    primary: paperTheme.colors.primary,
    background: paperTheme.colors.background,
    card: paperTheme.colors.surface,
    text: paperTheme.colors.onSurface,
    border: paperTheme.colors.outline,
    notification: paperTheme.colors.primary,
  },
};

export const spacing = (factor = 1) => factor * 8;

export const radii = {
  xs: 4,
  sm: 8, 
  md: 12, // Bolt's standard radius
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

export const elevation = {
  sm: 2,
  md: 4,
  lg: 8,
} as const;

export const useAppTheme = () => useTheme<AppTheme>();

export const themeTokens = {
  palette,
  spacing,
  radii,
  elevation,
} as const;
