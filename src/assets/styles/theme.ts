/**
 * MediStore Design System
 * Extracted from mobile app (Stitch)
 * 
 * Design Philosophy: "The Clinical Sanctuary"
 * - No 1px borders - structure via background shifts
 * - Generous whitespace for cognitive load reduction
 * - High-chroma colors only for status
 * - Tonal depth for hierarchy
 */

export const colors = {
  // Primary - Medical Blue
  primary: '#005EB4',
  primary_container: '#D6E3FF',
  primary_dim: '#00529F',
  primary_fixed: '#D6E3FF',
  primary_fixed_dim: '#BFD5FF',
  on_primary: '#F6F7FF',
  on_primary_container: '#00519E',
  on_primary_fixed: '#003F7D',
  on_primary_fixed_variant: '#005BAF',
  
  // Secondary - Gray Blue
  secondary: '#49636F',
  secondary_container: '#CBE7F5',
  secondary_dim: '#3D5762',
  secondary_fixed: '#CBE7F5',
  secondary_fixed_dim: '#BDD9E6',
  on_secondary: '#F2FAFF',
  on_secondary_container: '#3C5561',
  on_secondary_fixed: '#29434E',
  on_secondary_fixed_variant: '#455F6B',
  
  // Tertiary - Safe Green (for "Normal" vitals)
  tertiary: '#1C6D25',
  tertiary_container: '#9DF197',
  tertiary_dim: '#096119',
  tertiary_fixed: '#9DF197',
  tertiary_fixed_dim: '#90E28A',
  on_tertiary: '#EAFFE2',
  on_tertiary_container: '#005C15',
  on_tertiary_fixed: '#00460E',
  on_tertiary_fixed_variant: '#12661E',
  
  // Error - Critical Red
  error: '#9F403D',
  error_container: '#FE8983',
  error_dim: '#4E0309',
  on_error: '#FFF7F6',
  on_error_container: '#752121',
  
  // Surface Hierarchy (The "No-Line" Rule)
  background: '#F8FAFB',
  surface: '#F8FAFB',
  surface_bright: '#F8FAFB',
  surface_dim: '#CFDCE0',
  surface_container: '#E9EFF1',
  surface_container_high: '#E1EAEC',
  surface_container_highest: '#D9E4E8',
  surface_container_low: '#F0F4F6',
  surface_container_lowest: '#FFFFFF',
  surface_tint: '#005EB4',
  surface_variant: '#D9E4E8',
  
  // Text & Borders
  on_surface: '#2A3437',
  on_surface_variant: '#566164',
  on_background: '#2A3437',
  outline: '#727C80',
  outline_variant: '#A9B4B7',
  
  // Inverse (for dark overlays)
  inverse_surface: '#0B0F10',
  inverse_on_surface: '#9A9D9E',
  inverse_primary: '#609FFB',
} as const

export const typography = {
  // Fonts
  headline: 'Public Sans, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  body: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  
  // Sizes (rem)
  sizes: {
    'display-lg': '3.5rem',    // 56px - Massive hero numbers
    'display-md': '2.75rem',   // 44px - Primary metrics
    'display-sm': '2.25rem',   // 36px
    'headline-lg': '2rem',     // 32px - Critical alerts
    'headline-md': '1.75rem',  // 28px
    'headline-sm': '1.5rem',   // 24px
    'title-lg': '1.375rem',    // 22px
    'title-md': '1.125rem',    // 18px
    'title-sm': '1rem',        // 16px
    'body-lg': '1rem',         // 16px
    'body-md': '0.875rem',     // 14px
    'body-sm': '0.75rem',      // 12px
    'label-lg': '0.875rem',    // 14px
    'label-md': '0.75rem',     // 12px
    'label-sm': '0.6875rem',   // 11px
  },
  
  // Weights
  weights: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  
  // Line Heights
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const

export const spacing = {
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  7: '1.75rem',   // 28px
  8: '2rem',      // 32px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem',     // 96px
} as const

export const borderRadius = {
  none: '0',
  sm: '0.125rem',   // 2px
  md: '0.25rem',    // 4px - Primary roundness (ROUND_FOUR)
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px - For main containers
  '2xl': '1rem',    // 16px
  full: '9999px',   // Pills & circular elements
} as const

export const shadows = {
  // Subtle ambient shadows (no harsh drops)
  none: 'none',
  sm: '0 1px 2px 0 rgba(42, 52, 55, 0.03)',
  md: '0 4px 6px -1px rgba(42, 52, 55, 0.05), 0 2px 4px -2px rgba(42, 52, 55, 0.03)',
  lg: '0 10px 15px -3px rgba(42, 52, 55, 0.06), 0 4px 6px -4px rgba(42, 52, 55, 0.05)',
  xl: '0 20px 25px -5px rgba(42, 52, 55, 0.06), 0 8px 10px -6px rgba(42, 52, 55, 0.05)',
  '2xl': '0 32px 48px 0 rgba(42, 52, 55, 0.06)', // For critical modals
} as const

export const transitions = {
  fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
  normal: '250ms cubic-bezier(0.4, 0, 0.2, 1)',
  slow: '350ms cubic-bezier(0.4, 0, 0.2, 1)',
} as const

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const

// Semantic color aliases for common use cases
export const semantic = {
  // Status Colors
  status: {
    safe: colors.tertiary,
    warning: '#D97706',
    critical: colors.error,
    info: colors.primary,
  },
  
  // Text Colors
  text: {
    primary: colors.on_surface,
    secondary: colors.on_surface_variant,
    disabled: colors.outline,
    inverse: colors.inverse_on_surface,
  },
  
  // Background Layers (for "No-Line" rule)
  layers: {
    base: colors.background,
    elevated1: colors.surface_container_low,
    elevated2: colors.surface_container,
    elevated3: colors.surface_container_high,
    elevated4: colors.surface_container_highest,
    card: colors.surface_container_lowest,
  },
} as const

export default {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  transitions,
  breakpoints,
  semantic,
}
