/**
 * Declutterly - App Context
 * Global state management for the declutter app
 */

import React, { createContext, ReactNode, useState, useEffect, useCallback } from 'react';
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
  Mascot,
  MascotPersonality,
  MascotMood,
  FocusSession,
  CollectedItem,
  CollectionStats,
  SpawnEvent,
  Collectible,
  COLLECTIBLES,
  DEFAULT_FOCUS_SETTINGS,
  FocusModeSettings,
} from '@/types/declutter';
import { setGeminiApiKey } from '@/services/gemini';

// Storage keys
const STORAGE_KEYS = {
  USER: '@declutterly_user',
  ROOMS: '@declutterly_rooms',
  STATS: '@declutterly_stats',
  SETTINGS: '@declutterly_settings',
  API_KEY: '@declutterly_api_key',
  MASCOT: '@declutterly_mascot',
  COLLECTION: '@declutterly_collection',
  COLLECTION_STATS: '@declutterly_collection_stats',
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
  focusMode: DEFAULT_FOCUS_SETTINGS,
  arCollectionEnabled: true,
  collectibleNotifications: true,
};

// Default collection stats
const defaultCollectionStats: CollectionStats = {
  totalCollected: 0,
  uniqueCollected: 0,
  commonCount: 0,
  uncommonCount: 0,
  rareCount: 0,
  epicCount: 0,
  legendaryCount: 0,
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

  // Mascot state
  const [mascot, setMascot] = useState<Mascot | null>(null);

  // Focus mode state
  const [focusSession, setFocusSession] = useState<FocusSession | null>(null);

  // Collection state
  const [collection, setCollection] = useState<CollectedItem[]>([]);
  const [collectionStats, setCollectionStats] = useState<CollectionStats>(defaultCollectionStats);
  const [activeSpawn, setActiveSpawn] = useState<SpawnEvent | null>(null);

  // Load data from storage on mount
  useEffect(() => {
    loadData();
  }, []);

  // Save data when it changes
  useEffect(() => {
    if (isLoaded) {
      saveData();
    }
  }, [user, rooms, stats, settings, mascot, collection, collectionStats, isLoaded]);

  // Update mascot mood based on activity
  useEffect(() => {
    if (mascot) {
      const interval = setInterval(() => {
        updateMascotStatus();
      }, 60000); // Check every minute
      return () => clearInterval(interval);
    }
  }, [mascot]);

  function updateMascotStatus() {
    if (!mascot) return;

    const now = new Date();
    const hoursSinceInteraction = (now.getTime() - new Date(mascot.lastInteraction).getTime()) / (1000 * 60 * 60);
    const hoursSinceFed = (now.getTime() - new Date(mascot.lastFed).getTime()) / (1000 * 60 * 60);

    let newMood: MascotMood = mascot.mood;
    let newHunger = Math.max(0, mascot.hunger - hoursSinceFed * 5);
    let newEnergy = Math.min(100, mascot.energy + 2);
    let newHappiness = mascot.happiness;

    // Mood logic
    if (hoursSinceInteraction > 24) {
      newMood = 'sad';
      newHappiness = Math.max(0, newHappiness - 10);
    } else if (newHunger < 20) {
      newMood = 'sad';
    } else if (hoursSinceInteraction > 12) {
      newMood = 'neutral';
    } else if (newHunger > 80 && newHappiness > 80) {
      newMood = 'ecstatic';
    } else if (newHunger > 60) {
      newMood = 'happy';
    }

    // Update if changed
    if (newMood !== mascot.mood || newHunger !== mascot.hunger) {
      setMascot(prev => prev ? {
        ...prev,
        mood: newMood,
        hunger: newHunger,
        energy: newEnergy,
        happiness: newHappiness,
      } : null);
    }
  }

  async function loadData() {
    try {
      const [userStr, roomsStr, statsStr, settingsStr, apiKey, mascotStr, collectionStr, collectionStatsStr] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.USER),
        AsyncStorage.getItem(STORAGE_KEYS.ROOMS),
        AsyncStorage.getItem(STORAGE_KEYS.STATS),
        AsyncStorage.getItem(STORAGE_KEYS.SETTINGS),
        AsyncStorage.getItem(STORAGE_KEYS.API_KEY),
        AsyncStorage.getItem(STORAGE_KEYS.MASCOT),
        AsyncStorage.getItem(STORAGE_KEYS.COLLECTION),
        AsyncStorage.getItem(STORAGE_KEYS.COLLECTION_STATS),
      ]);

      if (userStr) {
        const userData = JSON.parse(userStr);
        userData.createdAt = new Date(userData.createdAt);
        setUser(userData);
      }

      if (roomsStr) {
        const roomsData = JSON.parse(roomsStr);
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
        const loadedSettings = JSON.parse(settingsStr);
        setSettingsState({ ...defaultSettings, ...loadedSettings });
      }

      if (apiKey) {
        setGeminiApiKey(apiKey);
      }

      if (mascotStr) {
        const mascotData = JSON.parse(mascotStr);
        mascotData.lastFed = new Date(mascotData.lastFed);
        mascotData.lastInteraction = new Date(mascotData.lastInteraction);
        mascotData.createdAt = new Date(mascotData.createdAt);
        setMascot(mascotData);
      }

      if (collectionStr) {
        const collectionData = JSON.parse(collectionStr);
        collectionData.forEach((item: CollectedItem) => {
          item.collectedAt = new Date(item.collectedAt);
        });
        setCollection(collectionData);
      }

      if (collectionStatsStr) {
        setCollectionStats(JSON.parse(collectionStatsStr));
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
        mascot ? AsyncStorage.setItem(STORAGE_KEYS.MASCOT, JSON.stringify(mascot)) : null,
        AsyncStorage.setItem(STORAGE_KEYS.COLLECTION, JSON.stringify(collection)),
        AsyncStorage.setItem(STORAGE_KEYS.COLLECTION_STATS, JSON.stringify(collectionStats)),
      ]);
    } catch (error) {
      console.error('Error saving data:', error);
    }
  }

  // Check and unlock badges
  function checkBadges(updatedStats: UserStats): Badge[] {
    const newBadges: Badge[] = [];

    BADGES.forEach(badge => {
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

  // =====================
  // BASIC ACTIONS
  // =====================

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

        const completedCount = updatedTasks.filter(t => t.completed).length;
        const totalCount = updatedTasks.length;
        const newProgress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

        const task = room.tasks.find(t => t.id === taskId);
        if (task && !task.completed) {
          const newXp = stats.xp + 10;
          const updatedStats: UserStats = {
            ...stats,
            totalTasksCompleted: stats.totalTasksCompleted + 1,
            totalMinutesCleaned: stats.totalMinutesCleaned + task.estimatedMinutes,
            xp: newXp,
            level: calculateLevel(newXp),
          };

          const newBadges = checkBadges(updatedStats);
          if (newBadges.length > 0) {
            updatedStats.badges = [...updatedStats.badges, ...newBadges];
          }

          setStats(updatedStats);

          // Feed mascot when task is completed
          if (mascot) {
            feedMascotAction();
          }

          // Spawn collectible chance
          if (settings.arCollectionEnabled) {
            const spawn = spawnCollectibleAction();
            if (spawn) {
              setActiveSpawn(spawn);
            }
          }

          // Update focus session
          if (focusSession?.isActive) {
            setFocusSession(prev => prev ? {
              ...prev,
              tasksCompletedDuringSession: prev.tasksCompletedDuringSession + 1,
            } : null);
          }

          if (newProgress === 100) {
            const roomStats: UserStats = {
              ...updatedStats,
              totalRoomsCleaned: updatedStats.totalRoomsCleaned + 1,
              xp: updatedStats.xp + 50,
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
      if (currentSession.tasksCompletedIds.length > 0) {
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

  // =====================
  // MASCOT ACTIONS
  // =====================

  const createMascot = (name: string, personality: MascotPersonality) => {
    const newMascot: Mascot = {
      name,
      personality,
      mood: 'happy',
      activity: 'idle',
      level: 1,
      xp: 0,
      hunger: 100,
      energy: 100,
      happiness: 100,
      lastFed: new Date(),
      lastInteraction: new Date(),
      createdAt: new Date(),
      accessories: [],
    };
    setMascot(newMascot);
  };

  const updateMascotAction = (updates: Partial<Mascot>) => {
    setMascot(prev => prev ? { ...prev, ...updates } : null);
  };

  const feedMascotAction = () => {
    if (!mascot) return;

    const newHunger = Math.min(100, mascot.hunger + 20);
    const newHappiness = Math.min(100, mascot.happiness + 10);
    const newXp = mascot.xp + 5;
    const newLevel = Math.floor(newXp / 50) + 1;

    setMascot(prev => prev ? {
      ...prev,
      hunger: newHunger,
      happiness: newHappiness,
      xp: newXp,
      level: newLevel,
      lastFed: new Date(),
      mood: newHunger > 80 ? 'happy' : prev.mood,
      activity: 'cheering',
    } : null);

    // Reset activity after animation
    setTimeout(() => {
      setMascot(prev => prev ? { ...prev, activity: 'idle' } : null);
    }, 2000);
  };

  const interactWithMascot = () => {
    if (!mascot) return;

    const newHappiness = Math.min(100, mascot.happiness + 15);

    setMascot(prev => prev ? {
      ...prev,
      happiness: newHappiness,
      lastInteraction: new Date(),
      activity: 'dancing',
      mood: newHappiness > 70 ? 'excited' : prev.mood,
    } : null);

    setTimeout(() => {
      setMascot(prev => prev ? { ...prev, activity: 'idle' } : null);
    }, 3000);
  };

  // =====================
  // FOCUS MODE ACTIONS
  // =====================

  const startFocusSession = (duration: number, roomId?: string) => {
    const session: FocusSession = {
      id: generateId(),
      roomId,
      startedAt: new Date(),
      duration,
      remainingSeconds: duration * 60,
      isActive: true,
      isPaused: false,
      tasksCompletedDuringSession: 0,
      blockedApps: [],
      distractionAttempts: 0,
    };
    setFocusSession(session);

    // Update mascot to cleaning mode
    if (mascot) {
      setMascot(prev => prev ? { ...prev, activity: 'cleaning' } : null);
    }
  };

  const pauseFocusSession = () => {
    setFocusSession(prev => prev ? {
      ...prev,
      isPaused: true,
      pausedAt: new Date(),
    } : null);
  };

  const resumeFocusSession = () => {
    setFocusSession(prev => prev ? {
      ...prev,
      isPaused: false,
      pausedAt: undefined,
    } : null);
  };

  const endFocusSession = () => {
    if (focusSession) {
      // Grant bonus XP for focus sessions
      const bonusXp = Math.floor((focusSession.duration * 60 - focusSession.remainingSeconds) / 60) * 2;
      setStats(prev => ({
        ...prev,
        xp: prev.xp + bonusXp,
        level: calculateLevel(prev.xp + bonusXp),
      }));

      // Mascot celebrates
      if (mascot) {
        setMascot(prev => prev ? { ...prev, activity: 'celebrating' } : null);
        setTimeout(() => {
          setMascot(prev => prev ? { ...prev, activity: 'idle' } : null);
        }, 3000);
      }
    }
    setFocusSession(null);
  };

  const updateFocusSessionAction = (updates: Partial<FocusSession>) => {
    setFocusSession(prev => prev ? { ...prev, ...updates } : null);
  };

  // =====================
  // COLLECTION ACTIONS
  // =====================

  const spawnCollectibleAction = useCallback((): SpawnEvent | null => {
    if (!settings.arCollectionEnabled) return null;

    // Get eligible collectibles based on tasks completed
    const eligible = COLLECTIBLES.filter(c =>
      !c.isSpecial &&
      c.requiredTasks <= stats.totalTasksCompleted &&
      c.spawnChance > 0
    );

    if (eligible.length === 0) return null;

    // Roll for spawn
    const roll = Math.random();
    let cumulative = 0;

    for (const collectible of eligible) {
      cumulative += collectible.spawnChance;
      if (roll <= cumulative) {
        const spawn: SpawnEvent = {
          collectible,
          position: {
            x: Math.random() * 0.6 + 0.2, // 20-80% of screen
            y: Math.random() * 0.4 + 0.3, // 30-70% of screen
          },
          expiresAt: new Date(Date.now() + 30000), // 30 seconds to collect
          collected: false,
        };
        return spawn;
      }
    }

    return null;
  }, [settings.arCollectionEnabled, stats.totalTasksCompleted]);

  const collectItem = (collectibleId: string, roomId?: string, taskId?: string) => {
    const collectible = COLLECTIBLES.find(c => c.id === collectibleId);
    if (!collectible) return;

    const newItem: CollectedItem = {
      collectibleId,
      collectedAt: new Date(),
      roomId,
      taskId,
    };

    setCollection(prev => [...prev, newItem]);

    // Update collection stats
    const isFirstOfKind = !collection.some(c => c.collectibleId === collectibleId);
    setCollectionStats(prev => ({
      ...prev,
      totalCollected: prev.totalCollected + 1,
      uniqueCollected: isFirstOfKind ? prev.uniqueCollected + 1 : prev.uniqueCollected,
      commonCount: collectible.rarity === 'common' ? prev.commonCount + 1 : prev.commonCount,
      uncommonCount: collectible.rarity === 'uncommon' ? prev.uncommonCount + 1 : prev.uncommonCount,
      rareCount: collectible.rarity === 'rare' ? prev.rareCount + 1 : prev.rareCount,
      epicCount: collectible.rarity === 'epic' ? prev.epicCount + 1 : prev.epicCount,
      legendaryCount: collectible.rarity === 'legendary' ? prev.legendaryCount + 1 : prev.legendaryCount,
      lastCollected: new Date(),
    }));

    // Grant XP
    setStats(prev => ({
      ...prev,
      xp: prev.xp + collectible.xpValue,
      level: calculateLevel(prev.xp + collectible.xpValue),
    }));

    // Clear active spawn
    setActiveSpawn(null);

    // Mascot gets excited
    if (mascot) {
      setMascot(prev => prev ? { ...prev, activity: 'cheering', mood: 'excited' } : null);
      setTimeout(() => {
        setMascot(prev => prev ? { ...prev, activity: 'idle' } : null);
      }, 2000);
    }
  };

  const dismissSpawn = () => {
    setActiveSpawn(null);
  };

  // Context value
  const value: DeclutterState = {
    user,
    stats,
    rooms,
    activeRoomId,
    currentSession,
    settings,
    mascot,
    focusSession,
    collection,
    collectionStats,
    activeSpawn,
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
    createMascot,
    updateMascot: updateMascotAction,
    feedMascot: feedMascotAction,
    interactWithMascot,
    startFocusSession,
    pauseFocusSession,
    resumeFocusSession,
    endFocusSession,
    updateFocusSession: updateFocusSessionAction,
    collectItem,
    spawnCollectible: spawnCollectibleAction,
    dismissSpawn,
  };

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
