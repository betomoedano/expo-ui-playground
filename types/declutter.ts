/**
 * Declutterly - Core Types
 * Types for rooms, tasks, progress tracking, and AI analysis
 */

// Room types for categorization
export type RoomType =
  | 'bedroom'
  | 'kitchen'
  | 'bathroom'
  | 'livingRoom'
  | 'office'
  | 'garage'
  | 'closet'
  | 'other';

// Task priority levels (ADHD-friendly - not too many options)
export type Priority = 'high' | 'medium' | 'low';

// Task difficulty for breaking down work
export type TaskDifficulty = 'quick' | 'medium' | 'challenging';

// A single cleaning/declutter task
export interface CleaningTask {
  id: string;
  title: string;
  description: string;
  emoji: string;
  priority: Priority;
  difficulty: TaskDifficulty;
  estimatedMinutes: number; // ADHD-friendly: show time commitment
  completed: boolean;
  completedAt?: Date;
  tips?: string[]; // Helpful tips for ADHD/motivation
  subtasks?: SubTask[]; // Break down into even smaller pieces
}

// Sub-tasks for complex tasks
export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

// A photo capture session
export interface PhotoCapture {
  id: string;
  uri: string;
  timestamp: Date;
  type: 'before' | 'progress' | 'after';
}

// A room being tracked
export interface Room {
  id: string;
  name: string;
  type: RoomType;
  emoji: string;
  createdAt: Date;
  photos: PhotoCapture[];
  tasks: CleaningTask[];
  messLevel: number; // 0-100, from AI analysis
  currentProgress: number; // 0-100 percentage complete
  lastAnalyzedAt?: Date;
  aiSummary?: string; // AI's description of the room state
  motivationalMessage?: string; // Encouraging message from AI
}

// User profile
export interface UserProfile {
  id: string;
  name: string;
  avatar?: string;
  createdAt: Date;
  onboardingComplete: boolean;
}

// User stats for gamification
export interface UserStats {
  totalTasksCompleted: number;
  totalRoomsCleaned: number;
  currentStreak: number; // Days in a row
  longestStreak: number;
  totalMinutesCleaned: number;
  level: number;
  xp: number;
  badges: Badge[];
}

// Achievement badges
export interface Badge {
  id: string;
  name: string;
  description: string;
  emoji: string;
  unlockedAt?: Date;
  requirement: number; // Number needed to unlock
  type: 'tasks' | 'rooms' | 'streak' | 'time';
}

// AI Analysis result
export interface AIAnalysisResult {
  messLevel: number; // 0-100
  summary: string;
  encouragement: string;
  tasks: CleaningTask[];
  quickWins: string[]; // Things that can be done in under 2 minutes
  estimatedTotalTime: number; // Total minutes to complete all tasks
  roomType?: RoomType; // AI detected room type
}

// App settings
export interface AppSettings {
  notifications: boolean;
  reminderTime?: string; // Time for daily reminders
  theme: 'light' | 'dark' | 'auto';
  hapticFeedback: boolean;
  encouragementLevel: 'minimal' | 'moderate' | 'maximum'; // How much positive reinforcement
  taskBreakdownLevel: 'normal' | 'detailed' | 'ultra'; // How small to break tasks
}

// Session for a cleaning session (body doubling concept)
export interface CleaningSession {
  id: string;
  roomId: string;
  startedAt: Date;
  endedAt?: Date;
  tasksCompletedIds: string[];
  focusMode: boolean; // Timer-based cleaning
}

// App state
export interface DeclutterState {
  // User
  user: UserProfile | null;
  stats: UserStats;

  // Rooms
  rooms: Room[];
  activeRoomId: string | null;

  // Current session
  currentSession: CleaningSession | null;

  // Settings
  settings: AppSettings;

  // UI State
  isAnalyzing: boolean;
  analysisError: string | null;

  // Actions
  setUser: (user: UserProfile) => void;
  addRoom: (room: Omit<Room, 'id' | 'createdAt' | 'photos' | 'tasks' | 'currentProgress'>) => Room;
  updateRoom: (roomId: string, updates: Partial<Room>) => void;
  deleteRoom: (roomId: string) => void;
  addPhotoToRoom: (roomId: string, photo: Omit<PhotoCapture, 'id'>) => void;
  setTasksForRoom: (roomId: string, tasks: CleaningTask[]) => void;
  toggleTask: (roomId: string, taskId: string) => void;
  toggleSubTask: (roomId: string, taskId: string, subTaskId: string) => void;
  setActiveRoom: (roomId: string | null) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  updateStats: (updates: Partial<UserStats>) => void;
  startSession: (roomId: string, focusMode: boolean) => void;
  endSession: () => void;
  setAnalyzing: (analyzing: boolean) => void;
  setAnalysisError: (error: string | null) => void;
  completeOnboarding: () => void;
}

// Predefined badges
export const BADGES: Badge[] = [
  { id: 'first-task', name: 'First Step', description: 'Complete your first task', emoji: '🌱', requirement: 1, type: 'tasks' },
  { id: 'task-10', name: 'Getting Going', description: 'Complete 10 tasks', emoji: '🚀', requirement: 10, type: 'tasks' },
  { id: 'task-50', name: 'Cleaning Machine', description: 'Complete 50 tasks', emoji: '⚡', requirement: 50, type: 'tasks' },
  { id: 'task-100', name: 'Declutter Master', description: 'Complete 100 tasks', emoji: '👑', requirement: 100, type: 'tasks' },
  { id: 'first-room', name: 'Room Conquered', description: 'Fully clean a room', emoji: '🏠', requirement: 1, type: 'rooms' },
  { id: 'rooms-5', name: 'Home Hero', description: 'Clean 5 rooms', emoji: '🦸', requirement: 5, type: 'rooms' },
  { id: 'streak-3', name: 'Consistent', description: '3 day streak', emoji: '🔥', requirement: 3, type: 'streak' },
  { id: 'streak-7', name: 'Week Warrior', description: '7 day streak', emoji: '💪', requirement: 7, type: 'streak' },
  { id: 'streak-30', name: 'Monthly Master', description: '30 day streak', emoji: '🏆', requirement: 30, type: 'streak' },
  { id: 'time-60', name: 'Hour Power', description: 'Clean for 60 minutes total', emoji: '⏰', requirement: 60, type: 'time' },
  { id: 'time-300', name: 'Time Investor', description: 'Clean for 5 hours total', emoji: '📈', requirement: 300, type: 'time' },
];

// Room type info
export const ROOM_TYPE_INFO: Record<RoomType, { emoji: string; label: string }> = {
  bedroom: { emoji: '🛏️', label: 'Bedroom' },
  kitchen: { emoji: '🍳', label: 'Kitchen' },
  bathroom: { emoji: '🚿', label: 'Bathroom' },
  livingRoom: { emoji: '🛋️', label: 'Living Room' },
  office: { emoji: '💼', label: 'Office' },
  garage: { emoji: '🚗', label: 'Garage' },
  closet: { emoji: '👔', label: 'Closet' },
  other: { emoji: '📦', label: 'Other' },
};
