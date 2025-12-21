# Declutterly - Firebase Backend Integration Guide

## Overview

This document outlines how to integrate Firebase as the backend for the Declutterly app. Firebase provides a complete backend solution including authentication, real-time database, cloud storage, and analytics.

## Table of Contents

1. [Firebase Services Overview](#firebase-services-overview)
2. [Project Setup](#project-setup)
3. [Authentication](#authentication)
4. [Firestore Database Schema](#firestore-database-schema)
5. [Cloud Storage](#cloud-storage)
6. [Security Rules](#security-rules)
7. [Cloud Functions](#cloud-functions)
8. [Analytics & Crashlytics](#analytics--crashlytics)
9. [Migration from AsyncStorage](#migration-from-asyncstorage)

---

## Firebase Services Overview

### Required Services

| Service | Purpose | Priority |
|---------|---------|----------|
| **Firebase Auth** | User authentication (email, Google, Apple) | Essential |
| **Cloud Firestore** | Real-time NoSQL database for user data | Essential |
| **Cloud Storage** | Photo storage for room images | Essential |
| **Cloud Functions** | Server-side logic, scheduled tasks | Important |
| **Analytics** | User behavior tracking | Recommended |
| **Crashlytics** | Crash reporting | Recommended |
| **Remote Config** | Dynamic app configuration | Optional |

### Firebase SDK for React Native

```bash
# Install Firebase packages
npm install @react-native-firebase/app
npm install @react-native-firebase/auth
npm install @react-native-firebase/firestore
npm install @react-native-firebase/storage
npm install @react-native-firebase/analytics
npm install @react-native-firebase/crashlytics
npm install @react-native-firebase/functions
```

For Expo managed workflow:
```bash
npx expo install expo-firebase-core
npx expo install @react-native-firebase/app @react-native-firebase/auth @react-native-firebase/firestore @react-native-firebase/storage
```

---

## Project Setup

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create new project: "Declutterly"
3. Enable Google Analytics
4. Add iOS and Android apps

### 2. Configuration Files

**iOS:** Download `GoogleService-Info.plist` → place in `ios/` folder

**Android:** Download `google-services.json` → place in `android/app/` folder

### 3. App Configuration

Create `firebase/config.ts`:

```typescript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

export default app;
```

### 4. Environment Variables

Create `.env`:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXX
```

---

## Authentication

### Supported Auth Methods

1. **Email/Password** - Traditional signup
2. **Google Sign-In** - OAuth
3. **Apple Sign-In** - Required for iOS
4. **Anonymous** - Guest mode

### Auth Service Implementation

Create `services/auth.ts`:

```typescript
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithCredential,
  onAuthStateChanged,
  User,
  updateProfile,
} from 'firebase/auth';
import { auth, db } from '@/firebase/config';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

// Sign up with email
export async function signUpWithEmail(
  email: string,
  password: string,
  displayName: string
): Promise<User> {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // Update profile
  await updateProfile(user, { displayName });

  // Create user document in Firestore
  await createUserDocument(user, displayName);

  return user;
}

// Sign in with email
export async function signInWithEmail(email: string, password: string): Promise<User> {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

// Sign out
export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

// Create user document in Firestore
async function createUserDocument(user: User, displayName: string): Promise<void> {
  const userRef = doc(db, 'users', user.uid);

  await setDoc(userRef, {
    uid: user.uid,
    email: user.email,
    displayName,
    createdAt: serverTimestamp(),
    onboardingComplete: false,
    settings: {
      notifications: true,
      theme: 'auto',
      hapticFeedback: true,
      encouragementLevel: 'moderate',
      taskBreakdownLevel: 'detailed',
      arCollectionEnabled: true,
    },
    stats: {
      totalTasksCompleted: 0,
      totalRoomsCleaned: 0,
      currentStreak: 0,
      longestStreak: 0,
      totalMinutesCleaned: 0,
      level: 1,
      xp: 0,
    },
  });
}

// Auth state listener
export function onAuthStateChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

// Get current user
export function getCurrentUser(): User | null {
  return auth.currentUser;
}
```

---

## Firestore Database Schema

### Collections Structure

```
users/
  {userId}/
    - uid: string
    - email: string
    - displayName: string
    - createdAt: timestamp
    - onboardingComplete: boolean
    - settings: UserSettings
    - stats: UserStats

    mascot/
      {mascotId}/
        - name: string
        - personality: 'spark' | 'bubbles' | 'dusty' | 'tidy'
        - mood: string
        - level: number
        - xp: number
        - hunger: number
        - energy: number
        - happiness: number
        - lastFed: timestamp
        - lastInteraction: timestamp
        - createdAt: timestamp
        - accessories: string[]

    rooms/
      {roomId}/
        - name: string
        - type: RoomType
        - emoji: string
        - createdAt: timestamp
        - messLevel: number
        - currentProgress: number
        - lastAnalyzedAt: timestamp
        - aiSummary: string
        - motivationalMessage: string

        photos/
          {photoId}/
            - uri: string (Cloud Storage path)
            - downloadUrl: string
            - timestamp: timestamp
            - type: 'before' | 'progress' | 'after'

        tasks/
          {taskId}/
            - title: string
            - description: string
            - emoji: string
            - priority: 'high' | 'medium' | 'low'
            - difficulty: 'quick' | 'medium' | 'challenging'
            - estimatedMinutes: number
            - completed: boolean
            - completedAt: timestamp | null
            - tips: string[]
            - subtasks: SubTask[]

    badges/
      {badgeId}/
        - badgeType: string
        - unlockedAt: timestamp

    collection/
      {collectionId}/
        - collectibleId: string
        - collectedAt: timestamp
        - roomId: string | null
        - taskId: string | null

    focusSessions/
      {sessionId}/
        - startedAt: timestamp
        - endedAt: timestamp | null
        - duration: number
        - roomId: string | null
        - tasksCompleted: number
        - distractionAttempts: number
```

### Firestore Service Implementation

Create `services/firestore.ts`:

```typescript
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  increment,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import { Room, CleaningTask, Mascot, UserStats } from '@/types/declutter';

// =====================
// USER OPERATIONS
// =====================

export async function getUserData(userId: string) {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    return userSnap.data();
  }
  return null;
}

export async function updateUserSettings(userId: string, settings: Partial<AppSettings>) {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, { settings });
}

export async function updateUserStats(userId: string, stats: Partial<UserStats>) {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, { stats });
}

// =====================
// ROOM OPERATIONS
// =====================

export async function createRoom(userId: string, roomData: Omit<Room, 'id' | 'createdAt'>) {
  const roomsRef = collection(db, 'users', userId, 'rooms');
  const docRef = await addDoc(roomsRef, {
    ...roomData,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getRooms(userId: string): Promise<Room[]> {
  const roomsRef = collection(db, 'users', userId, 'rooms');
  const q = query(roomsRef, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate(),
    lastAnalyzedAt: doc.data().lastAnalyzedAt?.toDate(),
  })) as Room[];
}

export async function updateRoom(userId: string, roomId: string, updates: Partial<Room>) {
  const roomRef = doc(db, 'users', userId, 'rooms', roomId);
  await updateDoc(roomRef, updates);
}

export async function deleteRoom(userId: string, roomId: string) {
  const roomRef = doc(db, 'users', userId, 'rooms', roomId);
  await deleteDoc(roomRef);
}

// Subscribe to rooms in real-time
export function subscribeToRooms(userId: string, callback: (rooms: Room[]) => void) {
  const roomsRef = collection(db, 'users', userId, 'rooms');
  const q = query(roomsRef, orderBy('createdAt', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const rooms = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
    })) as Room[];
    callback(rooms);
  });
}

// =====================
// TASK OPERATIONS
// =====================

export async function setTasksForRoom(
  userId: string,
  roomId: string,
  tasks: CleaningTask[]
) {
  const tasksRef = collection(db, 'users', userId, 'rooms', roomId, 'tasks');

  // Delete existing tasks
  const existingTasks = await getDocs(tasksRef);
  for (const taskDoc of existingTasks.docs) {
    await deleteDoc(taskDoc.ref);
  }

  // Add new tasks
  for (const task of tasks) {
    await addDoc(tasksRef, {
      ...task,
      completedAt: task.completedAt ? Timestamp.fromDate(task.completedAt) : null,
    });
  }
}

export async function toggleTask(
  userId: string,
  roomId: string,
  taskId: string,
  completed: boolean
) {
  const taskRef = doc(db, 'users', userId, 'rooms', roomId, 'tasks', taskId);
  await updateDoc(taskRef, {
    completed,
    completedAt: completed ? serverTimestamp() : null,
  });

  // Update user stats if completing
  if (completed) {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      'stats.totalTasksCompleted': increment(1),
      'stats.xp': increment(10),
    });
  }
}

// =====================
// MASCOT OPERATIONS
// =====================

export async function createMascot(userId: string, mascotData: Omit<Mascot, 'createdAt'>) {
  const mascotRef = doc(db, 'users', userId, 'mascot', 'current');
  await setDoc(mascotRef, {
    ...mascotData,
    createdAt: serverTimestamp(),
    lastFed: serverTimestamp(),
    lastInteraction: serverTimestamp(),
  });
}

export async function getMascot(userId: string): Promise<Mascot | null> {
  const mascotRef = doc(db, 'users', userId, 'mascot', 'current');
  const mascotSnap = await getDoc(mascotRef);

  if (mascotSnap.exists()) {
    const data = mascotSnap.data();
    return {
      ...data,
      createdAt: data.createdAt?.toDate(),
      lastFed: data.lastFed?.toDate(),
      lastInteraction: data.lastInteraction?.toDate(),
    } as Mascot;
  }
  return null;
}

export async function updateMascot(userId: string, updates: Partial<Mascot>) {
  const mascotRef = doc(db, 'users', userId, 'mascot', 'current');
  await updateDoc(mascotRef, updates);
}

export async function feedMascot(userId: string) {
  const mascotRef = doc(db, 'users', userId, 'mascot', 'current');
  await updateDoc(mascotRef, {
    hunger: increment(20),
    happiness: increment(10),
    xp: increment(5),
    lastFed: serverTimestamp(),
  });
}

// =====================
// COLLECTION OPERATIONS
// =====================

export async function collectItem(
  userId: string,
  collectibleId: string,
  roomId?: string,
  taskId?: string
) {
  const collectionRef = collection(db, 'users', userId, 'collection');
  await addDoc(collectionRef, {
    collectibleId,
    roomId: roomId || null,
    taskId: taskId || null,
    collectedAt: serverTimestamp(),
  });
}

export async function getCollection(userId: string) {
  const collectionRef = collection(db, 'users', userId, 'collection');
  const snapshot = await getDocs(collectionRef);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    collectedAt: doc.data().collectedAt?.toDate(),
  }));
}

// =====================
// FOCUS SESSION OPERATIONS
// =====================

export async function createFocusSession(
  userId: string,
  duration: number,
  roomId?: string
) {
  const sessionsRef = collection(db, 'users', userId, 'focusSessions');
  const docRef = await addDoc(sessionsRef, {
    startedAt: serverTimestamp(),
    duration,
    roomId: roomId || null,
    tasksCompleted: 0,
    distractionAttempts: 0,
  });
  return docRef.id;
}

export async function endFocusSession(
  userId: string,
  sessionId: string,
  tasksCompleted: number,
  distractionAttempts: number
) {
  const sessionRef = doc(db, 'users', userId, 'focusSessions', sessionId);
  await updateDoc(sessionRef, {
    endedAt: serverTimestamp(),
    tasksCompleted,
    distractionAttempts,
  });
}
```

---

## Cloud Storage

### Storage Structure

```
users/
  {userId}/
    rooms/
      {roomId}/
        photos/
          {photoId}.jpg
    profile/
      avatar.jpg
```

### Storage Service Implementation

Create `services/storage.ts`:

```typescript
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '@/firebase/config';
import * as FileSystem from 'expo-file-system';

export async function uploadRoomPhoto(
  userId: string,
  roomId: string,
  photoUri: string,
  photoId: string
): Promise<string> {
  // Read the file
  const response = await fetch(photoUri);
  const blob = await response.blob();

  // Create storage reference
  const photoRef = ref(storage, `users/${userId}/rooms/${roomId}/photos/${photoId}.jpg`);

  // Upload
  await uploadBytes(photoRef, blob);

  // Get download URL
  const downloadUrl = await getDownloadURL(photoRef);
  return downloadUrl;
}

export async function deleteRoomPhoto(
  userId: string,
  roomId: string,
  photoId: string
): Promise<void> {
  const photoRef = ref(storage, `users/${userId}/rooms/${roomId}/photos/${photoId}.jpg`);
  await deleteObject(photoRef);
}

export async function uploadProfileAvatar(
  userId: string,
  photoUri: string
): Promise<string> {
  const response = await fetch(photoUri);
  const blob = await response.blob();

  const avatarRef = ref(storage, `users/${userId}/profile/avatar.jpg`);
  await uploadBytes(avatarRef, blob);

  return await getDownloadURL(avatarRef);
}
```

---

## Security Rules

### Firestore Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      // Allow reading settings for theme/preferences
      allow read: if request.auth != null;

      // Subcollections
      match /rooms/{roomId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;

        match /photos/{photoId} {
          allow read, write: if request.auth != null && request.auth.uid == userId;
        }

        match /tasks/{taskId} {
          allow read, write: if request.auth != null && request.auth.uid == userId;
        }
      }

      match /mascot/{mascotId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }

      match /collection/{itemId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }

      match /badges/{badgeId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }

      match /focusSessions/{sessionId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }

    // Global leaderboards (read-only for authenticated users)
    match /leaderboards/{leaderboardId} {
      allow read: if request.auth != null;
      allow write: if false; // Only Cloud Functions can write
    }
  }
}
```

### Storage Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/{allPaths=**} {
      // Users can only access their own files
      allow read, write: if request.auth != null && request.auth.uid == userId;

      // Limit file size to 10MB
      allow write: if request.resource.size < 10 * 1024 * 1024;

      // Only allow image uploads
      allow write: if request.resource.contentType.matches('image/.*');
    }
  }
}
```

---

## Cloud Functions

### Function Examples

Create `functions/src/index.ts`:

```typescript
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

const db = admin.firestore();

// =====================
// STREAK MANAGEMENT
// =====================

// Update user streaks daily at midnight
export const updateStreaks = functions.pubsub
  .schedule('0 0 * * *')
  .timeZone('UTC')
  .onRun(async (context) => {
    const usersRef = db.collection('users');
    const usersSnapshot = await usersRef.get();

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const batch = db.batch();

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const lastActivity = userData.lastActivityDate?.toDate();

      if (lastActivity && lastActivity < yesterday) {
        // Reset streak if no activity yesterday
        batch.update(userDoc.ref, {
          'stats.currentStreak': 0,
        });
      }
    }

    await batch.commit();
    console.log('Streaks updated for all users');
  });

// =====================
// BADGE UNLOCKING
// =====================

// Check for new badges when tasks are completed
export const checkBadges = functions.firestore
  .document('users/{userId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const userId = context.params.userId;

    // Check if tasks completed increased
    if (after.stats.totalTasksCompleted > before.stats.totalTasksCompleted) {
      const badges = [];

      // First task badge
      if (after.stats.totalTasksCompleted >= 1 && before.stats.totalTasksCompleted < 1) {
        badges.push({ id: 'first-task', name: 'First Step' });
      }

      // 10 tasks badge
      if (after.stats.totalTasksCompleted >= 10 && before.stats.totalTasksCompleted < 10) {
        badges.push({ id: 'task-10', name: 'Getting Going' });
      }

      // 50 tasks badge
      if (after.stats.totalTasksCompleted >= 50 && before.stats.totalTasksCompleted < 50) {
        badges.push({ id: 'task-50', name: 'Cleaning Machine' });
      }

      // Award badges
      for (const badge of badges) {
        await db.collection('users').doc(userId).collection('badges').add({
          ...badge,
          unlockedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    }
  });

// =====================
// MASCOT MOOD UPDATES
// =====================

// Update mascot moods every hour
export const updateMascotMoods = functions.pubsub
  .schedule('0 * * * *')
  .timeZone('UTC')
  .onRun(async (context) => {
    const usersRef = db.collection('users');
    const usersSnapshot = await usersRef.get();

    for (const userDoc of usersSnapshot.docs) {
      const mascotRef = userDoc.ref.collection('mascot').doc('current');
      const mascotSnap = await mascotRef.get();

      if (mascotSnap.exists) {
        const mascot = mascotSnap.data();
        const now = new Date();
        const lastInteraction = mascot?.lastInteraction?.toDate();

        if (lastInteraction) {
          const hoursSinceInteraction = (now.getTime() - lastInteraction.getTime()) / (1000 * 60 * 60);

          let newMood = mascot?.mood;
          let newHunger = Math.max(0, (mascot?.hunger || 0) - 2);

          if (hoursSinceInteraction > 24) {
            newMood = 'sad';
          } else if (hoursSinceInteraction > 12) {
            newMood = 'neutral';
          }

          await mascotRef.update({
            mood: newMood,
            hunger: newHunger,
          });
        }
      }
    }
  });

// =====================
// LEADERBOARDS
// =====================

// Update leaderboards daily
export const updateLeaderboards = functions.pubsub
  .schedule('0 1 * * *')
  .timeZone('UTC')
  .onRun(async (context) => {
    const usersRef = db.collection('users');
    const usersSnapshot = await usersRef.orderBy('stats.xp', 'desc').limit(100).get();

    const leaderboard = usersSnapshot.docs.map((doc, index) => ({
      rank: index + 1,
      displayName: doc.data().displayName,
      xp: doc.data().stats.xp,
      level: doc.data().stats.level,
      tasksCompleted: doc.data().stats.totalTasksCompleted,
    }));

    await db.collection('leaderboards').doc('global').set({
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      entries: leaderboard,
    });
  });

// =====================
// PUSH NOTIFICATIONS
// =====================

// Send reminder notifications
export const sendReminders = functions.pubsub
  .schedule('0 9 * * *')
  .timeZone('UTC')
  .onRun(async (context) => {
    const usersRef = db.collection('users');
    const usersSnapshot = await usersRef
      .where('settings.notifications', '==', true)
      .get();

    // Implementation would use Firebase Cloud Messaging
    // This is a placeholder for the notification logic
    console.log(`Would send reminders to ${usersSnapshot.size} users`);
  });
```

---

## Analytics & Crashlytics

### Analytics Events

```typescript
import analytics from '@react-native-firebase/analytics';

// Track key events
export const AnalyticsEvents = {
  // Onboarding
  onboardingStarted: () => analytics().logEvent('onboarding_started'),
  onboardingCompleted: () => analytics().logEvent('onboarding_completed'),
  mascotChosen: (personality: string) =>
    analytics().logEvent('mascot_chosen', { personality }),

  // Room events
  roomCreated: (roomType: string) =>
    analytics().logEvent('room_created', { room_type: roomType }),
  roomAnalyzed: (roomType: string, messLevel: number) =>
    analytics().logEvent('room_analyzed', { room_type: roomType, mess_level: messLevel }),

  // Task events
  taskCompleted: (difficulty: string, duration: number) =>
    analytics().logEvent('task_completed', { difficulty, duration }),

  // Focus mode
  focusSessionStarted: (duration: number) =>
    analytics().logEvent('focus_session_started', { duration }),
  focusSessionCompleted: (tasksCompleted: number) =>
    analytics().logEvent('focus_session_completed', { tasks_completed: tasksCompleted }),

  // Collection
  collectibleFound: (rarity: string, xp: number) =>
    analytics().logEvent('collectible_found', { rarity, xp_value: xp }),

  // Engagement
  appOpened: () => analytics().logAppOpen(),
  screenViewed: (screenName: string) =>
    analytics().logScreenView({ screen_name: screenName }),
};
```

### Crashlytics Setup

```typescript
import crashlytics from '@react-native-firebase/crashlytics';

// Log user info for crash reports
export function setUserForCrashlytics(userId: string, email: string) {
  crashlytics().setUserId(userId);
  crashlytics().setAttributes({
    email,
  });
}

// Log custom errors
export function logError(error: Error, context?: string) {
  crashlytics().log(context || 'Unknown context');
  crashlytics().recordError(error);
}

// Log non-fatal issues
export function logWarning(message: string) {
  crashlytics().log(`Warning: ${message}`);
}
```

---

## Migration from AsyncStorage

### Migration Strategy

1. **Dual-Write Period**: Write to both AsyncStorage and Firebase during transition
2. **Data Migration**: On first Firebase auth, migrate local data
3. **Fallback**: Keep AsyncStorage as offline cache

### Migration Service

Create `services/migration.ts`:

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '@/firebase/config';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const STORAGE_KEYS = {
  USER: '@declutterly_user',
  ROOMS: '@declutterly_rooms',
  STATS: '@declutterly_stats',
  SETTINGS: '@declutterly_settings',
  MASCOT: '@declutterly_mascot',
  COLLECTION: '@declutterly_collection',
  MIGRATED: '@declutterly_migrated',
};

export async function migrateToFirebase(userId: string): Promise<boolean> {
  try {
    // Check if already migrated
    const migrated = await AsyncStorage.getItem(STORAGE_KEYS.MIGRATED);
    if (migrated === 'true') {
      return true;
    }

    // Check if Firebase already has data
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists() && userSnap.data().stats?.totalTasksCompleted > 0) {
      // Firebase has data, skip migration
      await AsyncStorage.setItem(STORAGE_KEYS.MIGRATED, 'true');
      return true;
    }

    // Load local data
    const [userStr, roomsStr, statsStr, settingsStr, mascotStr, collectionStr] =
      await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.USER),
        AsyncStorage.getItem(STORAGE_KEYS.ROOMS),
        AsyncStorage.getItem(STORAGE_KEYS.STATS),
        AsyncStorage.getItem(STORAGE_KEYS.SETTINGS),
        AsyncStorage.getItem(STORAGE_KEYS.MASCOT),
        AsyncStorage.getItem(STORAGE_KEYS.COLLECTION),
      ]);

    // Parse and migrate user data
    if (userStr || statsStr || settingsStr) {
      const userData = userStr ? JSON.parse(userStr) : {};
      const stats = statsStr ? JSON.parse(statsStr) : {};
      const settings = settingsStr ? JSON.parse(settingsStr) : {};

      await setDoc(userRef, {
        uid: userId,
        displayName: userData.name || 'User',
        onboardingComplete: userData.onboardingComplete || false,
        stats,
        settings,
        migratedAt: new Date(),
      }, { merge: true });
    }

    // Migrate rooms
    if (roomsStr) {
      const rooms = JSON.parse(roomsStr);
      for (const room of rooms) {
        const roomRef = doc(db, 'users', userId, 'rooms', room.id);
        await setDoc(roomRef, {
          ...room,
          createdAt: new Date(room.createdAt),
          lastAnalyzedAt: room.lastAnalyzedAt ? new Date(room.lastAnalyzedAt) : null,
        });
      }
    }

    // Migrate mascot
    if (mascotStr) {
      const mascot = JSON.parse(mascotStr);
      const mascotRef = doc(db, 'users', userId, 'mascot', 'current');
      await setDoc(mascotRef, {
        ...mascot,
        createdAt: new Date(mascot.createdAt),
        lastFed: new Date(mascot.lastFed),
        lastInteraction: new Date(mascot.lastInteraction),
      });
    }

    // Migrate collection
    if (collectionStr) {
      const collection = JSON.parse(collectionStr);
      for (const item of collection) {
        await setDoc(doc(db, 'users', userId, 'collection', item.collectibleId), {
          ...item,
          collectedAt: new Date(item.collectedAt),
        });
      }
    }

    // Mark as migrated
    await AsyncStorage.setItem(STORAGE_KEYS.MIGRATED, 'true');

    console.log('Migration to Firebase completed successfully');
    return true;
  } catch (error) {
    console.error('Migration failed:', error);
    return false;
  }
}

// Clear local data after successful migration (optional)
export async function clearLocalData(): Promise<void> {
  const keysToKeep = [STORAGE_KEYS.MIGRATED];
  const allKeys = await AsyncStorage.getAllKeys();
  const keysToRemove = allKeys.filter(
    key => key.startsWith('@declutterly_') && !keysToKeep.includes(key)
  );
  await AsyncStorage.multiRemove(keysToRemove);
}
```

---

## Offline Support

Firebase provides built-in offline support. Enable persistence:

```typescript
import { enableIndexedDbPersistence } from 'firebase/firestore';
import { db } from '@/firebase/config';

// Enable offline persistence
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    // Multiple tabs open, persistence can only be enabled in one tab at a time
    console.log('Persistence failed: Multiple tabs open');
  } else if (err.code === 'unimplemented') {
    // The current browser doesn't support persistence
    console.log('Persistence not supported');
  }
});
```

---

## Cost Estimation

### Free Tier Limits (Spark Plan)

| Service | Free Limit |
|---------|------------|
| Firestore | 1GB storage, 50K reads/day, 20K writes/day |
| Cloud Storage | 5GB storage, 1GB/day download |
| Authentication | 10K verifications/month |
| Cloud Functions | 2M invocations/month |

### Estimated Usage Per User

| Operation | Frequency | Cost Impact |
|-----------|-----------|-------------|
| Room analysis | 2-5/day | Low |
| Task toggles | 10-20/day | Low |
| Photo uploads | 1-3/day | Medium |
| Sync operations | Continuous | Medium |

### Recommended Plan

For a production app with moderate users (1,000-10,000 MAU):
- **Blaze Plan** (Pay as you go)
- Estimated cost: $20-100/month depending on usage

---

## Next Steps

1. [ ] Create Firebase project in console
2. [ ] Install Firebase packages
3. [ ] Configure authentication providers
4. [ ] Deploy Firestore security rules
5. [ ] Deploy Cloud Storage rules
6. [ ] Implement auth service
7. [ ] Implement Firestore service
8. [ ] Test data migration
9. [ ] Deploy Cloud Functions
10. [ ] Set up analytics dashboard
11. [ ] Configure crash reporting

---

## Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [React Native Firebase](https://rnfirebase.io/)
- [Expo Firebase Guide](https://docs.expo.dev/guides/using-firebase/)
- [Firestore Best Practices](https://firebase.google.com/docs/firestore/best-practices)
- [Cloud Functions Examples](https://github.com/firebase/functions-samples)
