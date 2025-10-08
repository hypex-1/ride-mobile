import { MD3DarkTheme, MD3LightTheme, useTheme } from 'react-native-paper';
import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme,
  Theme as NavigationTheme,
} from '@react-navigation/native';
import type { MD3Theme } from 'react-native-paper';

type Palette = {
  primary: string;
  primaryMuted: string;
  primaryDark: string;
  secondary: string;
  background: string;
  surface: string;
  surfaceVariant: string;
  outline: string;
  outlineDark: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
  muted: string;
  textPrimary: string;
  textSecondary: string;
  textLight: string;
  mapGreen: string;
  rideGreen: string;
  shadowColor: string;
};

const lightPalette: Palette = {
  // Bolt's exact light color scheme
  primary: '#34D186',
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

const darkPalette: Palette = {
  primary: '#34D186',
  primaryMuted: '#2CAB73',
  primaryDark: '#19985F',
  secondary: '#F9FAFB',
  background: '#0F172A',
  surface: '#111827',
  surfaceVariant: '#1F2937',
  outline: '#2D3648',
  outlineDark: '#374151',
  success: '#34D186',
  warning: '#F59E0B',
  danger: '#F87171',
  info: '#60A5FA',
  muted: '#9CA3AF',
  textPrimary: '#F9FAFB',
  textSecondary: '#CBD5F5',
  textLight: '#E5E7EB',
  mapGreen: '#22C55E',
  rideGreen: '#22C55E',
  shadowColor: '#000000',
} as const;

const buildPaperTheme = (base: MD3Theme, palette: typeof lightPalette, isDark: boolean): MD3Theme => ({
  ...base,
  dark: isDark,
  roundness: 12,
  colors: {
    ...base.colors,
    primary: palette.primary,
    primaryContainer: palette.primaryMuted,
    onPrimary: '#FFFFFF',
    secondary: palette.secondary,
    onSecondary: isDark ? '#111827' : '#FFFFFF',
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
});

export const lightPaperTheme = buildPaperTheme(MD3LightTheme as MD3Theme, lightPalette, false);
export const darkPaperTheme = buildPaperTheme(MD3DarkTheme as MD3Theme, darkPalette, true);

export type AppTheme = typeof lightPaperTheme;

export const buildNavigationTheme = (
  mode: 'light' | 'dark',
  paperTheme: MD3Theme,
): NavigationTheme => {
  const base = mode === 'dark' ? NavigationDarkTheme : NavigationDefaultTheme;
  return {
    ...base,
    colors: {
      ...base.colors,
      primary: paperTheme.colors.primary,
      background: paperTheme.colors.background,
      card: paperTheme.colors.surface,
      text: paperTheme.colors.onSurface,
      border: paperTheme.colors.outline,
      notification: paperTheme.colors.primary,
    },
  };
};

// Backwards compatible defaults (light theme)
export const paperTheme = lightPaperTheme;
export const navigationTheme = buildNavigationTheme('light', lightPaperTheme);

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
  palette: lightPalette,
  spacing,
  radii,
  elevation,
} as const;
