import { TextStyle } from 'react-native';
import { Colors } from './colors';

export const Typography: { [key: string]: TextStyle } = {
  h1: {
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  h2: {
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600',
  },
  bodyLarge: {
    fontSize: 18,
    fontWeight: '400',
  },
  bodyMedium: {
    fontSize: 16,
    fontWeight: '400',
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400',
  },
  caption: {
    fontSize: 12,
    fontWeight: '400',
    color: Colors.textSecondary,
  },
  button: {
    fontSize: 16,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
};
