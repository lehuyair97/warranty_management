/**
 * Centralized design system color tokens and constants.
 * All hex codes used in the application must be declared here or mapped to Tailwind theme tokens.
 * Direct arbitrary hex codes (`#[0-9a-fA-F]{3,8}`) in JSX/TSX components are strictly prohibited.
 */

export const COLOR_PALETTE = {
  sand: {
    50: '#fbf9f5', // Page canvas, warm background
    100: '#f4efe6', // Muted card, secondary button, table row hover
    200: '#e7e2d9', // Standard border, subtle divider
    300: '#d6cebf', // Focus ring, scrollbar thumb
  },
  espresso: {
    700: '#44403c', // Muted text
    800: '#292524', // Primary text
    900: '#1c1917', // Strong headings
  },
  bronze: {
    500: '#d97706', // Warning / highlight
    600: '#b45309', // Primary brand accent, primary CTA
    700: '#92400e', // Primary CTA hover
  },
  status: {
    danger: '#ef4444', // Red 500 error / delete
    dangerDark: '#dc2626', // Red 600 dark danger
    success: '#059669', // Emerald 600 success
    warning: '#d97706', // Amber 600 warning
  },
} as const;

export type ColorPalette = typeof COLOR_PALETTE;

/**
 * Chart color tokens for Recharts SVG renders.
 */
export const CHART_PALETTE = {
  revenue: '#2563EB',
  tickets: '#F59E0B',
  grid: '#F1F5F9',
  axisTick: '#64748B',
  fallback: '#64748B',
} as const;

/**
 * Status colors specifically for Donut and status distribution charts.
 */
export const TICKET_STATUS_CHART_COLORS = {
  received: '#3B82F6',
  inspecting: '#6366F1',
  waitingForParts: '#F59E0B',
  repairing: '#EA580C',
  completed: '#10B981',
  delivered: '#059669',
  cancelled: '#94A3B8',
  default: '#64748B',
} as const;

/**
 * Standard Tailwind utility classes corresponding to theme colors.
 * Prefer using these predefined class sets over manual string concatenation.
 */
export const THEME_COLOR_CLASSES = {
  background: {
    canvas: 'bg-sand-50',
    surface: 'bg-white',
    muted: 'bg-sand-100',
    hover: 'hover:bg-sand-100',
    cardHeader: 'bg-sand-50',
  },
  border: {
    default: 'border-sand-200',
    subtle: 'divide-sand-100',
    accent: 'border-bronze-600',
  },
  text: {
    primary: 'text-stone-900',
    secondary: 'text-stone-700',
    muted: 'text-stone-500',
    accent: 'text-bronze-600',
    accentHover: 'hover:text-bronze-600',
  },
  button: {
    primary: 'bg-bronze-600 text-white hover:bg-bronze-700 focus:ring-bronze-600',
    secondary: 'bg-sand-100 text-stone-800 hover:bg-sand-200 focus:ring-sand-300',
    outline: 'border border-sand-200 bg-white text-stone-700 hover:bg-sand-50',
    ghost: 'text-stone-600 hover:bg-sand-100 hover:text-stone-900',
  },
} as const;
