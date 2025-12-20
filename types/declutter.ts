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

// =====================
// MASCOT TYPES
// =====================

// Mascot mood states
export type MascotMood = 'ecstatic' | 'happy' | 'content' | 'neutral' | 'sad' | 'sleepy' | 'excited';

// Mascot activity states
export type MascotActivity = 'idle' | 'cheering' | 'sleeping' | 'dancing' | 'cleaning' | 'celebrating';

// Mascot personality types
export type MascotPersonality = 'spark' | 'bubbles' | 'dusty' | 'tidy';

// Mascot data
export interface Mascot {
  name: string;
  personality: MascotPersonality;
  mood: MascotMood;
  activity: MascotActivity;
  level: number;
  xp: number;
  hunger: number; // 0-100 (fed by completing tasks)
  energy: number; // 0-100 (recovers over time)
  happiness: number; // 0-100 (based on user activity)
  lastFed: Date;
  lastInteraction: Date;
  createdAt: Date;
  accessories: string[]; // Unlocked accessories
  currentAccessory?: string;
}

// Mascot personality info
export const MASCOT_PERSONALITIES: Record<MascotPersonality, { emoji: string; name: string; description: string; color: string }> = {
  spark: { emoji: '⚡', name: 'Spark', description: 'Energetic and motivating!', color: '#FFD700' },
  bubbles: { emoji: '🫧', name: 'Bubbles', description: 'Cheerful and bubbly!', color: '#87CEEB' },
  dusty: { emoji: '🧹', name: 'Dusty', description: 'Wise and encouraging!', color: '#DEB887' },
  tidy: { emoji: '✨', name: 'Tidy', description: 'Calm and organized!', color: '#98FB98' },
};

// =====================
// FOCUS MODE TYPES
// =====================

// Focus mode session
export interface FocusSession {
  id: string;
  roomId?: string;
  startedAt: Date;
  duration: number; // Total duration in minutes
  remainingSeconds: number;
  isActive: boolean;
  isPaused: boolean;
  pausedAt?: Date;
  completedAt?: Date;
  tasksCompletedDuringSession: number;
  blockedApps: string[];
  distractionAttempts: number; // Times user tried to leave
}

// Focus mode settings
export interface FocusModeSettings {
  defaultDuration: number; // Default focus time in minutes
  breakDuration: number; // Break time in minutes
  autoStartBreak: boolean;
  blockNotifications: boolean;
  playWhiteNoise: boolean;
  whiteNoiseType: 'rain' | 'ocean' | 'forest' | 'cafe' | 'none';
  showMotivationalQuotes: boolean;
  strictMode: boolean; // Prevents exiting focus mode early
}

// =====================
// AR COLLECTIBLES TYPES
// =====================

// Collectible rarity
export type CollectibleRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

// Collectible category
export type CollectibleCategory = 'sparkles' | 'tools' | 'creatures' | 'treasures' | 'special';

// A collectible item
export interface Collectible {
  id: string;
  name: string;
  description: string;
  emoji: string;
  rarity: CollectibleRarity;
  category: CollectibleCategory;
  xpValue: number;
  spawnChance: number; // 0-1 probability
  requiredTasks: number; // Min tasks to unlock spawn
  isSpecial: boolean; // Limited time or achievement based
}

// A collected item instance
export interface CollectedItem {
  collectibleId: string;
  collectedAt: Date;
  roomId?: string; // Where it was found
  taskId?: string; // What task spawned it
}

// Player collection stats
export interface CollectionStats {
  totalCollected: number;
  uniqueCollected: number;
  commonCount: number;
  uncommonCount: number;
  rareCount: number;
  epicCount: number;
  legendaryCount: number;
  lastCollected?: Date;
}

// Spawn event (when an item appears during cleaning)
export interface SpawnEvent {
  collectible: Collectible;
  position: { x: number; y: number }; // Screen position
  expiresAt: Date;
  collected: boolean;
}

// =====================
// EXISTING TYPES (UPDATED)
// =====================

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
  // Focus mode settings
  focusMode: FocusModeSettings;
  // AR collection settings
  arCollectionEnabled: boolean;
  collectibleNotifications: boolean;
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

  // Mascot
  mascot: Mascot | null;

  // Focus Mode
  focusSession: FocusSession | null;

  // AR Collection
  collection: CollectedItem[];
  collectionStats: CollectionStats;
  activeSpawn: SpawnEvent | null;

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

  // Mascot Actions
  createMascot: (name: string, personality: MascotPersonality) => void;
  updateMascot: (updates: Partial<Mascot>) => void;
  feedMascot: () => void;
  interactWithMascot: () => void;

  // Focus Mode Actions
  startFocusSession: (duration: number, roomId?: string) => void;
  pauseFocusSession: () => void;
  resumeFocusSession: () => void;
  endFocusSession: () => void;
  updateFocusSession: (updates: Partial<FocusSession>) => void;

  // Collection Actions
  collectItem: (collectibleId: string, roomId?: string, taskId?: string) => void;
  spawnCollectible: () => SpawnEvent | null;
  dismissSpawn: () => void;
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

// Default focus mode settings
export const DEFAULT_FOCUS_SETTINGS: FocusModeSettings = {
  defaultDuration: 25, // Pomodoro style
  breakDuration: 5,
  autoStartBreak: true,
  blockNotifications: true,
  playWhiteNoise: false,
  whiteNoiseType: 'none',
  showMotivationalQuotes: true,
  strictMode: false,
};

// Collectible rarity colors
export const RARITY_COLORS: Record<CollectibleRarity, string> = {
  common: '#9CA3AF',
  uncommon: '#22C55E',
  rare: '#3B82F6',
  epic: '#A855F7',
  legendary: '#F59E0B',
};

// Predefined collectibles
export const COLLECTIBLES: Collectible[] = [
  // Sparkles (Common drops while cleaning)
  { id: 'sparkle-small', name: 'Tiny Sparkle', description: 'A small glimmer of cleanliness', emoji: '✨', rarity: 'common', category: 'sparkles', xpValue: 5, spawnChance: 0.4, requiredTasks: 0, isSpecial: false },
  { id: 'sparkle-medium', name: 'Bright Sparkle', description: 'Things are getting cleaner!', emoji: '💫', rarity: 'common', category: 'sparkles', xpValue: 10, spawnChance: 0.3, requiredTasks: 0, isSpecial: false },
  { id: 'sparkle-large', name: 'Mega Sparkle', description: 'That surface is gleaming!', emoji: '🌟', rarity: 'uncommon', category: 'sparkles', xpValue: 20, spawnChance: 0.15, requiredTasks: 5, isSpecial: false },
  { id: 'sparkle-rainbow', name: 'Rainbow Sparkle', description: 'Pure cleaning energy!', emoji: '🌈', rarity: 'rare', category: 'sparkles', xpValue: 50, spawnChance: 0.05, requiredTasks: 20, isSpecial: false },

  // Cleaning Tools (Uncommon to Rare)
  { id: 'tool-sponge', name: 'Magic Sponge', description: 'Absorbs all the mess!', emoji: '🧽', rarity: 'uncommon', category: 'tools', xpValue: 25, spawnChance: 0.12, requiredTasks: 3, isSpecial: false },
  { id: 'tool-broom', name: 'Sweepy Broom', description: 'Whisks away the dust', emoji: '🧹', rarity: 'uncommon', category: 'tools', xpValue: 25, spawnChance: 0.12, requiredTasks: 3, isSpecial: false },
  { id: 'tool-spray', name: 'Super Spray', description: 'Blasts away grime!', emoji: '🧴', rarity: 'rare', category: 'tools', xpValue: 40, spawnChance: 0.06, requiredTasks: 10, isSpecial: false },
  { id: 'tool-vacuum', name: 'Turbo Vacuum', description: 'Sucks up everything!', emoji: '🔌', rarity: 'rare', category: 'tools', xpValue: 45, spawnChance: 0.05, requiredTasks: 15, isSpecial: false },
  { id: 'tool-golden-gloves', name: 'Golden Gloves', description: 'The hands of a pro cleaner', emoji: '🧤', rarity: 'epic', category: 'tools', xpValue: 100, spawnChance: 0.02, requiredTasks: 30, isSpecial: false },

  // Cute Creatures (Rare helpers)
  { id: 'creature-dustbunny', name: 'Friendly Dustbunny', description: 'Reformed from the dark corners', emoji: '🐰', rarity: 'rare', category: 'creatures', xpValue: 60, spawnChance: 0.04, requiredTasks: 10, isSpecial: false },
  { id: 'creature-soap-sprite', name: 'Soap Sprite', description: 'Bubbles with joy!', emoji: '🫧', rarity: 'rare', category: 'creatures', xpValue: 65, spawnChance: 0.04, requiredTasks: 15, isSpecial: false },
  { id: 'creature-tidy-fairy', name: 'Tidy Fairy', description: 'Grants organizing wishes', emoji: '🧚', rarity: 'epic', category: 'creatures', xpValue: 120, spawnChance: 0.015, requiredTasks: 25, isSpecial: false },
  { id: 'creature-clean-dragon', name: 'Clean Dragon', description: 'Breathes fresh air!', emoji: '🐉', rarity: 'legendary', category: 'creatures', xpValue: 250, spawnChance: 0.005, requiredTasks: 50, isSpecial: false },

  // Treasures (Found in messy areas)
  { id: 'treasure-coin', name: 'Lost Coin', description: 'Found under the couch!', emoji: '🪙', rarity: 'common', category: 'treasures', xpValue: 15, spawnChance: 0.2, requiredTasks: 0, isSpecial: false },
  { id: 'treasure-gem', name: 'Hidden Gem', description: 'Was behind the bookshelf', emoji: '💎', rarity: 'rare', category: 'treasures', xpValue: 75, spawnChance: 0.03, requiredTasks: 15, isSpecial: false },
  { id: 'treasure-crown', name: 'Cleaning Crown', description: 'Royalty of tidiness', emoji: '👑', rarity: 'legendary', category: 'treasures', xpValue: 300, spawnChance: 0.003, requiredTasks: 75, isSpecial: false },

  // Special (Achievement/Event based)
  { id: 'special-first-clean', name: 'First Timer Trophy', description: 'Completed your first room!', emoji: '🏆', rarity: 'epic', category: 'special', xpValue: 150, spawnChance: 0, requiredTasks: 0, isSpecial: true },
  { id: 'special-streak-master', name: 'Streak Flame', description: '7-day cleaning streak!', emoji: '🔥', rarity: 'epic', category: 'special', xpValue: 200, spawnChance: 0, requiredTasks: 0, isSpecial: true },
  { id: 'special-speed-demon', name: 'Speed Demon', description: 'Finished 5 tasks in one session', emoji: '⚡', rarity: 'legendary', category: 'special', xpValue: 350, spawnChance: 0, requiredTasks: 0, isSpecial: true },
  { id: 'special-perfectionist', name: 'Perfectionist Star', description: '100% room completion', emoji: '⭐', rarity: 'legendary', category: 'special', xpValue: 400, spawnChance: 0, requiredTasks: 0, isSpecial: true },
];

// Motivational quotes for focus mode
export const FOCUS_QUOTES: string[] = [
  "You're doing amazing! One task at a time.",
  "Small steps lead to big transformations.",
  "Your space reflects your mind. Keep going!",
  "Progress, not perfection.",
  "Every minute counts. You've got this!",
  "The hardest part is starting. You did it!",
  "Cleaning is self-care for your space.",
  "Future you will be so grateful.",
  "Just 5 more minutes of awesome!",
  "You're creating calm, one task at a time.",
  "Messy to amazing - that's your superpower!",
  "Your focus is unstoppable right now.",
];
