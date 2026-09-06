export const lightTheme = {
  mode: 'light',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceMuted: '#F1F5F9',
  surfaceHighlight: '#EEF2FF',
  border: '#E2E8F0',
  borderFocus: '#6366F1',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  primary: '#4F46E5',
  primaryDark: '#3730A3',
  primaryLight: '#EEF2FF',
  primaryGradient: ['#4F46E5', '#6366F1', '#818CF8'],
  accentPurple: '#7C3AED',
  accentEmerald: '#10B981',
  accentAmber: '#F59E0B',
  accentRose: '#F43F5E',
  inputBg: '#FFFFFF',
  inputBorder: '#E2E8F0',
  cardShadow: 'rgba(15, 23, 42, 0.08)',
  statusBarStyle: 'dark',
};

export const darkTheme = {
  mode: 'dark',
  background: '#0B0F19',
  surface: '#121727',
  surfaceMuted: '#1A2136',
  surfaceHighlight: '#1E2544',
  border: '#202940',
  borderFocus: '#818CF8',
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  primary: '#6366F1',
  primaryDark: '#4F46E5',
  primaryLight: '#1C2346',
  primaryGradient: ['#6366F1', '#818CF8', '#A78BFA'],
  accentPurple: '#A78BFA',
  accentEmerald: '#34D399',
  accentAmber: '#FBBF24',
  accentRose: '#FB7185',
  inputBg: '#151C30',
  inputBorder: '#232D47',
  cardShadow: 'rgba(0, 0, 0, 0.4)',
  statusBarStyle: 'light',
};

// Aliases for compatibility
export const lightColors = lightTheme;
export const darkColors = darkTheme;

export default { lightTheme, darkTheme, lightColors, darkColors };
