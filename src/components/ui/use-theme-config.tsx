import type { Theme } from '@react-navigation/native';
import { DefaultTheme } from '@react-navigation/native';

const SoraTheme: Theme = {
  ...DefaultTheme,
  dark: false,
  colors: {
    ...DefaultTheme.colors,
    primary: '#3D8A5A',
    background: '#FAF8F5',
    text: '#1A1918',
    border: '#EDECEA',
    card: '#FFFFFF',
    notification: '#3D8A5A',
  },
};

export function useThemeConfig() {
  return SoraTheme;
}
