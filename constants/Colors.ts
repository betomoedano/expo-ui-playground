/**
 * Declutterly - AI-Powered Declutter Assistant
 * Color system designed for clarity, motivation, and ADHD-friendly UI
 */

// Primary brand color - Indigo (calming, trustworthy, motivating)
const primaryLight = '#6366F1';
const primaryDark = '#818CF8';

// Success colors for task completion (dopamine hits!)
const successColor = '#10B981';
const successColorDark = '#34D399';

// Warning/Priority colors
const warningColor = '#F59E0B';
const dangerColor = '#EF4444';

export const Colors = {
  light: {
    text: '#1F2937',
    textSecondary: '#6B7280',
    background: '#F9FAFB',
    card: '#FFFFFF',
    tint: primaryLight,
    primary: primaryLight,
    success: successColor,
    warning: warningColor,
    danger: dangerColor,
    icon: '#6B7280',
    tabIconDefault: '#9CA3AF',
    tabIconSelected: primaryLight,
    border: '#E5E7EB',
    glassBg: 'rgba(255, 255, 255, 0.7)',
  },
  dark: {
    text: '#F9FAFB',
    textSecondary: '#9CA3AF',
    background: '#111827',
    card: '#1F2937',
    tint: primaryDark,
    primary: primaryDark,
    success: successColorDark,
    warning: '#FBBF24',
    danger: '#F87171',
    icon: '#9CA3AF',
    tabIconDefault: '#6B7280',
    tabIconSelected: primaryDark,
    border: '#374151',
    glassBg: 'rgba(31, 41, 55, 0.7)',
  },
};

// Room type colors for visual categorization
export const RoomColors = {
  bedroom: '#8B5CF6',
  kitchen: '#F59E0B',
  bathroom: '#06B6D4',
  livingRoom: '#10B981',
  office: '#6366F1',
  garage: '#6B7280',
  closet: '#EC4899',
  other: '#8B5CF6',
};

// Priority colors for tasks
export const PriorityColors = {
  high: '#EF4444',
  medium: '#F59E0B',
  low: '#10B981',
};

// Progress colors for gamification
export const ProgressColors = {
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#FFD700',
  platinum: '#E5E4E2',
};
