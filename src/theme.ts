import { useColorScheme } from 'react-native';

const light = {
  bg: '#eef1f4',
  surface: '#ffffff',
  ink: '#16202b',
  muted: '#5d6b79',
  line: '#d7dde4',
  chip: '#e4e9ee',
  accent: '#e2522f',
  accentInk: '#ffffff',
  protein: '#2f6fd6',
  carbs: '#d39a14',
  fat: '#8a55c9',
  good: '#1f8a5b',
  warn: '#c2410c',
};

const dark: typeof light = {
  bg: '#0f151c',
  surface: '#18212b',
  ink: '#e8edf2',
  muted: '#95a3b1',
  line: '#2a3644',
  chip: '#223040',
  accent: '#ff6a45',
  accentInk: '#1a0d08',
  protein: '#6aa1ff',
  carbs: '#f0b938',
  fat: '#b98af0',
  good: '#4cc790',
  warn: '#fb8c4c',
};

export type Theme = typeof light;

export function useTheme(): Theme {
  return useColorScheme() === 'dark' ? dark : light;
}
