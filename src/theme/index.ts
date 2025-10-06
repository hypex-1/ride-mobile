import { MD3LightTheme, useTheme } from 'react-native-paper';
import { DefaultTheme as NavigationDefaultTheme, Theme as NavigationTheme } from '@react-navigation/native';
import type { MD3Theme } from 'react-native-paper';

const palette = {
  primary: '#2563EB',
  primaryMuted: '#9AB7FF',
  secondary: '#0F172A',
  background: '#F6F8FC',
  surface: '#FFFFFF',
  surfaceVariant: '#EEF2FF',
  outline: '#E2E8F0',
  success: '#16A34A',
  warning: '#F59E0B',
  danger: '#DC2626',
  info: '#0284C7',
  muted: '#64748B',
} as const;

const basePaperTheme = MD3LightTheme as MD3Theme;

export const paperTheme: MD3Theme = {
  ...basePaperTheme,
  roundness: 18,
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
    outlineVariant: palette.outline,
    error: palette.danger,
    onError: '#FFFFFF',
    onSurface: palette.secondary,
    onSurfaceVariant: palette.muted,
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
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
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
