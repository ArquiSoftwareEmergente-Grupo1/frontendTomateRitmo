import { definePreset } from '@primeng/themes';
import Lara from '@primeng/themes/lara';

export const MyPreset = definePreset(Lara, {
  semantic: {
    primary: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
      950: '#052e16'
    },
    colorScheme: {
      light: {
        primary: {
          color: '#005F40',
          contrastColor: '#ffffff',
          hoverColor: '#004D33',
          activeColor: '#003D26'
        },
        highlight: {
          background: '#E8F5E8',
          focusBackground: '#D4F4D4',
          color: '#005F40',
          focusColor: '#004D33'
        },
        surface: {
          0: '#ffffff',
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617'
        },
        success: {
          color: '#22c55e',
          contrastColor: '#ffffff',
          hoverColor: '#16a34a',
          activeColor: '#15803d'
        },
        warning: {
          color: '#f59e0b',
          contrastColor: '#ffffff',
          hoverColor: '#d97706',
          activeColor: '#b45309'
        },
        danger: {
          color: '#ef4444',
          contrastColor: '#ffffff',
          hoverColor: '#dc2626',
          activeColor: '#b91c1c'
        },
        info: {
          color: '#3b82f6',
          contrastColor: '#ffffff',
          hoverColor: '#2563eb',
          activeColor: '#1d4ed8'
        },
        agriculture: {
          tomato: '#FF6B6B',
          leaf: '#51CF66',
          soil: '#8B4513',
          water: '#339AF0',
          sun: '#FFD43B'
        }
      }
    },
    button: {
      primary: {
        background: '#005F40',
        hoverBackground: '#004D33',
        activeBackground: '#003D26',
        borderColor: '#005F40',
        hoverBorderColor: '#004D33',
        activeBorderColor: '#003D26',
        color: '#ffffff',
        hoverColor: '#ffffff',
        activeColor: '#ffffff'
      },
      secondary: {
        background: 'transparent',
        hoverBackground: '#f1f5f9',
        activeBackground: '#e2e8f0',
        borderColor: '#005F40',
        hoverBorderColor: '#004D33',
        activeBorderColor: '#003D26',
        color: '#005F40',
        hoverColor: '#004D33',
        activeColor: '#003D26'
      }
    },
    card: {
      background: '#ffffff',
      borderColor: '#e2e8f0',
      shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
    },
    sidebar: {
      background: 'linear-gradient(180deg, #005F40 0%, #004D33 100%)',
      color: '#ffffff',
      borderColor: 'transparent'
    }
  }
});
