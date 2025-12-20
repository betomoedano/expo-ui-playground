/**
 * Declutterly - App Context
 * Global state management for the declutter app
 */

import React, { createContext, ReactNode, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DeclutterState,
  Room,
  UserProfile,
  UserStats,
  AppSettings,
  CleaningTask,
  PhotoCapture,
  CleaningSession,
  BADGES,
  Badge,
} from '@/types/declutter';
import { setGeminiApiKey } from '@/services/gemini';

// Storage keys
const STORAGE_KEYS = {
  USER: '@declutterly_user',
  ROOMS: '@declutterly_rooms',
  STATS: '@declutterly_stats',
  SETTINGS: '@declutterly_settings',
  API_KEY: '@declutterly_api_key',
};

// Default stats
const defaultStats: UserStats = {
  totalTasksCompleted: 0,
  totalRoomsCleaned: 0,
  currentStreak: 0,
  longestStreak: 0,
  totalMinutesCleaned: 0,
  level: 1,
  xp: 0,
  badges: [],
};

// Default settings
const defaultSettings: AppSettings = {
  notifications: true,
  theme: 'auto',
  hapticFeedback: true,
  encouragementLevel: 'moderate',
  taskBreakdownLevel: 'detailed',
};

// Create context
export const DeclutterContext = createContext<DeclutterState | null>(null);

// Generate unique ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Provider component
export function DeclutterProvider({ children }: { children: ReactNode }) {
  // State
  const [user, setUser] = useState<UserProfile | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [stats, setStats] = useState<UserStats>(defaultStats);
  const [settings, setSettingsState] = useState<AppSettings>(defaultSettings);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [currentSession, setCurrentSession] = useState<CleaningSession | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load data from storage on mount
  useEffect(() => {
    loadData();
  }, []);

  // Save data when it changes
  useEffect(() => {
    if (isLoaded) {
      saveData();
    }
  }, [user, rooms, stats, settings, isLoaded]);

  async function loadData() {
    try {
      const [userStr, roomsStr, statsStr, settingsStr, apiKey] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.USER),
        AsyncStorage.getItem(STORAGE_KEYS.ROOMS),
        AsyncStorage.getItem(STORAGE_KEYS.STATS),
        AsyncStorage.getItem(STORAGE_KEYS.SETTINGS),
        AsyncStorage.getItem(STORAGE_KEYS.API_KEY),
      ]);

      if (userStr) {
        const userData = JSON.parse(userStr);
        userData.createdAt = new Date(userData.createdAt);
        setUser(userData);
      }

      if (roomsStr) {
        const roomsData = JSON.parse(roomsStr);
        // Convert date strings back to Date objects
        roomsData.forEach((room: Room) => {
          room.createdAt = new Date(room.createdAt);
          if (room.lastAnalyzedAt) room.lastAnalyzedAt = new Date(room.lastAnalyzedAt);
          room.photos.forEach((p: PhotoCapture) => {
            p.timestamp = new Date(p.timestamp);
          });
          room.tasks.forEach((t: CleaningTask) => {
            if (t.completedAt) t.completedAt = new Date(t.completedAt);
          });
        });
        setRooms(roomsData);
      }

      if (statsStr) {
        const statsData = JSON.parse(statsStr);
        statsData.badges = statsData.badges.map((b: Badge) => ({
          ...b,
          unlockedAt: b.unlockedAt ? new Date(b.unlockedAt) : undefined,
        }));
        setStats(statsData);
      }

      if (settingsStr) {
        setSettingsState(JSON.parse(settingsStr));
      }

      if (apiKey) {
        setGeminiApiKey(apiKey);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoaded(true);
    }
  }

  async function saveData() {
    try {
      await Promise.all([
        user ? AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user)) : null,
        AsyncStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(rooms)),
        AsyncStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats)),
        AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings)),
      ]);
    } catch (error) {
      console.error('Error saving data:', error);
    }
  }

  // Check and unlock badges
  function checkBadges(updatedStats: UserStats): Badge[] {
    const newBadges: Badge[] = [];

    BADGES.forEach(badge => {
      // Skip if already unlocked
      if (updatedStats.badges.some(b => b.id === badge.id)) return;

      let shouldUnlock = false;
      switch (badge.type) {
        case 'tasks':
          shouldUnlock = updatedStats.totalTasksCompleted >= badge.requirement;
          break;
        case 'rooms':
          shouldUnlock = updatedStats.totalRoomsCleaned >= badge.requirement;
          break;
        case 'streak':
          shouldUnlock = updatedStats.currentStreak >= badge.requirement;
          break;
        case 'time':
          shouldUnlock = updatedStats.totalMinutesCleaned >= badge.requirement;
          break;
      }

      if (shouldUnlock) {
        newBadges.push({ ...badge, unlockedAt: new Date() });
      }
    });

    return newBadges;
  }

  // Calculate level from XP
  function calculateLevel(xp: number): number {
    return Math.floor(xp / 100) + 1;
  }

  // Actions
  const setUserAction = (newUser: UserProfile) => {
    setUser(newUser);
  };

  const addRoom = (roomData: Omit<Room, 'id' | 'createdAt' | 'photos' | 'tasks' | 'currentProgress'>) => {
    const newRoom: Room = {
      ...roomData,
      id: generateId(),
      createdAt: new Date(),
      photos: [],
      tasks: [],
      currentProgress: 0,
    };
    setRooms(prev => [...prev, newRoom]);
    return newRoom;
  };

  const updateRoom = (roomId: string, updates: Partial<Room>) => {
    setRooms(prev =>
      prev.map(room => (room.id === roomId ? { ...room, ...updates } : room))
    );
  };

  const deleteRoom = (roomId: string) => {
    setRooms(prev => prev.filter(room => room.id !== roomId));
    if (activeRoomId === roomId) {
      setActiveRoomId(null);
    }
  };

  const addPhotoToRoom = (roomId: string, photoData: Omit<PhotoCapture, 'id'>) => {
    const photo: PhotoCapture = {
      ...photoData,
      id: generateId(),
    };
    setRooms(prev =>
      prev.map(room =>
        room.id === roomId
          ? { ...room, photos: [...room.photos, photo] }
          : room
      )
    );
  };

  const setTasksForRoom = (roomId: string, tasks: CleaningTask[]) => {
    setRooms(prev =>
      prev.map(room =>
        room.id === roomId ? { ...room, tasks } : room
      )
    );
  };

  const toggleTask = (roomId: string, taskId: string) => {
    setRooms(prev =>
      prev.map(room => {
        if (room.id !== roomId) return room;

        const updatedTasks = room.tasks.map(task => {
          if (task.id !== taskId) return task;

          const nowCompleted = !task.completed;
          return {
            ...task,
            completed: nowCompleted,
            completedAt: nowCompleted ? new Date() : undefined,
          };
        });

        // Calculate new progress
        const completedCount = updatedTasks.filter(t => t.completed).length;
        const totalCount = updatedTasks.length;
        const newProgress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

        // Update stats if task was completed
        const task = room.tasks.find(t => t.id === taskId);
        if (task && !task.completed) {
          // Task is being completed
          const newXp = stats.xp + 10;
          const updatedStats: UserStats = {
            ...stats,
            totalTasksCompleted: stats.totalTasksCompleted + 1,
            totalMinutesCleaned: stats.totalMinutesCleaned + task.estimatedMinutes,
            xp: newXp,
            level: calculateLevel(newXp),
          };

          // Check for new badges
          const newBadges = checkBadges(updatedStats);
          if (newBadges.length > 0) {
            updatedStats.badges = [...updatedStats.badges, ...newBadges];
          }

          setStats(updatedStats);

          // Check if room is complete
          if (newProgress === 100) {
            const roomStats: UserStats = {
              ...updatedStats,
              totalRoomsCleaned: updatedStats.totalRoomsCleaned + 1,
              xp: updatedStats.xp + 50, // Bonus XP for completing room
            };
            roomStats.level = calculateLevel(roomStats.xp);
            const roomBadges = checkBadges(roomStats);
            if (roomBadges.length > 0) {
              roomStats.badges = [...roomStats.badges, ...roomBadges];
            }
            setStats(roomStats);
          }
        }

        return {
          ...room,
          tasks: updatedTasks,
          currentProgress: newProgress,
        };
      })
    );
  };

  const toggleSubTask = (roomId: string, taskId: string, subTaskId: string) => {
    setRooms(prev =>
      prev.map(room => {
        if (room.id !== roomId) return room;

        const updatedTasks = room.tasks.map(task => {
          if (task.id !== taskId || !task.subtasks) return task;

          const updatedSubtasks = task.subtasks.map(st =>
            st.id === subTaskId ? { ...st, completed: !st.completed } : st
          );

          return { ...task, subtasks: updatedSubtasks };
        });

        return { ...room, tasks: updatedTasks };
      })
    );
  };

  const setActiveRoom = (roomId: string | null) => {
    setActiveRoomId(roomId);
  };

  const updateSettings = (updates: Partial<AppSettings>) => {
    setSettingsState(prev => ({ ...prev, ...updates }));
  };

  const updateStats = (updates: Partial<UserStats>) => {
    setStats(prev => ({ ...prev, ...updates }));
  };

  const startSession = (roomId: string, focusMode: boolean) => {
    const session: CleaningSession = {
      id: generateId(),
      roomId,
      startedAt: new Date(),
      tasksCompletedIds: [],
      focusMode,
    };
    setCurrentSession(session);
  };

  const endSession = () => {
    if (currentSession) {
      // Update streak if tasks were completed
      if (currentSession.tasksCompletedIds.length > 0) {
        const today = new Date().toDateString();
        // Simple streak logic - in production, would need last active date
        setStats(prev => ({
          ...prev,
          currentStreak: prev.currentStreak + 1,
          longestStreak: Math.max(prev.longestStreak, prev.currentStreak + 1),
        }));
      }
    }
    setCurrentSession(null);
  };

  const completeOnboarding = () => {
    if (user) {
      setUser({ ...user, onboardingComplete: true });
    }
  };

  // Context value
  const value: DeclutterState = {
    user,
    stats,
    rooms,
    activeRoomId,
    currentSession,
    settings,
    isAnalyzing,
    analysisError,
    setUser: setUserAction,
    addRoom,
    updateRoom,
    deleteRoom,
    addPhotoToRoom,
    setTasksForRoom,
    toggleTask,
    toggleSubTask,
    setActiveRoom,
    updateSettings,
    updateStats,
    startSession,
    endSession,
    setAnalyzing: setIsAnalyzing,
    setAnalysisError,
    completeOnboarding,
  };

  // Don't render until data is loaded
  if (!isLoaded) {
    return null;
  }

  return (
    <DeclutterContext.Provider value={value}>
      {children}
    </DeclutterContext.Provider>
  );
}

// Hook to use the context
export function useDeclutter() {
  const context = React.use(DeclutterContext);
  if (!context) {
    throw new Error('useDeclutter must be used within a DeclutterProvider');
  }
  return context;
}

// Save API key
export async function saveApiKey(apiKey: string) {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.API_KEY, apiKey);
    setGeminiApiKey(apiKey);
  } catch (error) {
    console.error('Error saving API key:', error);
  }
}

// Load API key
export async function loadApiKey(): Promise<string | null> {
  try {
    const key = await AsyncStorage.getItem(STORAGE_KEYS.API_KEY);
    if (key) {
      setGeminiApiKey(key);
    }
    return key;
  } catch (error) {
    console.error('Error loading API key:', error);
    return null;
  }
}
