# Declutterly - Complete Documentation

## Table of Contents
1. [Overview](#overview)
2. [Features](#features)
3. [Architecture](#architecture)
4. [Screens & Navigation](#screens--navigation)
5. [AI Integration](#ai-integration)
6. [Data Management](#data-management)
7. [Gamification System](#gamification-system)
8. [Setup & Configuration](#setup--configuration)
9. [Video Support](#video-support)
10. [Troubleshooting](#troubleshooting)

---

## Overview

Declutterly is an ADHD-friendly AI-powered decluttering assistant built with React Native and Expo. It helps users clean and organize their spaces by:

- Taking photos/videos of messy rooms
- Using AI (Google Gemini) to analyze the space
- Breaking down cleaning into small, achievable tasks
- Gamifying the experience with XP, levels, and collectibles
- Providing encouraging, non-judgmental support

### Tech Stack
- **Framework**: React Native + Expo SDK 55 (Canary)
- **Router**: Expo Router 7
- **UI Components**: @expo/ui (SwiftUI-style components)
- **State Management**: React Context API
- **Storage**: AsyncStorage (local persistence)
- **AI**: Google Gemini 3.0 Flash API
- **Animations**: react-native-reanimated + Animated API

---

## Features

### Core Features

#### 1. AI Room Analysis
- Capture photos or select from gallery
- AI analyzes clutter level (0-100%)
- Generates personalized cleaning tasks
- Provides specific step-by-step instructions
- Identifies "Quick Wins" (2-minute tasks)

#### 2. Task Management
- Tasks organized by priority (High/Medium/Low)
- Each task includes:
  - Detailed instructions
  - Time estimates
  - Helpful tips
  - Subtasks for complex tasks
- Progress tracking per room

#### 3. Mascot Companion
- Choose from 6 personalities:
  - Spark (energetic)
  - Zen (calm)
  - Buddy (friendly)
  - Cheery (optimistic)
  - Coach (motivating)
  - Chill (laid-back)
- Mood changes based on activity
- Provides contextual encouragement

#### 4. Focus Mode
- Pomodoro-style focus sessions
- Customizable work/break durations
- Task display during sessions
- Break reminders with suggestions
- Distraction-free interface

#### 5. Collectibles System
- Collectibles spawn when completing tasks
- 5 rarity tiers: Common, Uncommon, Rare, Epic, Legendary
- Categories: Sparkles, Tools, Creatures, Treasures, Special
- Track collection completion
- XP bonuses from collecting

#### 6. Progress & Achievements
- XP system with levels
- Daily streak tracking
- Badges for milestones
- Weekly activity visualization
- Room-by-room progress tracking

### UI/UX Features
- Dark/Light mode support
- Haptic feedback
- Celebration animations on task completion
- Empty states with helpful guidance
- Polished loading states with progress indicators
- ADHD-friendly design patterns

---

## Architecture

### Directory Structure
```
app/
  (tabs)/            # Tab navigation screens
    index.tsx        # Home screen
    progress.tsx     # Progress & achievements
    _layout.tsx      # Tab layout
  room/
    [id].tsx         # Room detail screen
  analysis.tsx       # AI analysis results
  camera.tsx         # Photo/video capture
  collection.tsx     # Collectibles view
  focus.tsx          # Focus mode timer
  mascot.tsx         # Mascot interaction
  onboarding.tsx     # Tutorial & setup
  settings.tsx       # App settings

components/
  features/          # Feature components
    Mascot.tsx
    CollectibleSpawn.tsx
  ui/                # UI components

constants/
  Colors.ts          # Theme colors

context/
  DeclutterContext.tsx  # Global state

services/
  gemini.ts          # AI integration

types/
  declutter.ts       # TypeScript types
```

### State Flow
```
User Action
    ↓
Component (dispatch action)
    ↓
DeclutterContext (handle action)
    ↓
Update State + AsyncStorage
    ↓
Re-render Components
```

---

## Screens & Navigation

### 1. Onboarding (`/onboarding`)
- 3-step swipeable tutorial
- Quick setup: name + mascot selection
- No account required (local storage)
- Can skip directly to setup

### 2. Home (`/(tabs)`)
- Welcome message with user stats
- Quick action buttons: Capture, Focus, Collection
- Progress overview gauge
- Room cards (in-progress and completed)
- Mascot mini-display
- Daily motivation quote

### 3. Camera (`/camera`)
- Live camera preview
- Photo capture button
- Gallery picker (photos + videos)
- Guide overlay for framing
- Room type selection for new rooms

### 4. Analysis (`/analysis`)
- Shows captured image during processing
- Animated loading states with stages:
  1. Processing photo
  2. Analyzing room layout
  3. Identifying clutter areas
  4. Creating personalized plan
  5. Almost ready
- Displays analysis results:
  - Clutter level gauge
  - Summary
  - Quick wins
  - Task preview
  - Encouragement

### 5. Room Detail (`/room/[id]`)
- Room header with photo/emoji
- Progress gauge
- Focus Mode quick-start button
- Photo comparison feature
- Task list grouped by priority:
  - Quick Wins
  - High Priority
  - Medium Priority
  - Low Priority
- Task cards with:
  - Expandable details
  - Subtask checklists
  - Tips
- Celebration animation on task completion

### 6. Focus Mode (`/focus`)
- Timer display (work/break)
- Current task display
- Pause/Resume controls
- Break mode with suggestions:
  - Get water
  - Stretch
  - Walk around
- End session option

### 7. Progress (`/(tabs)/progress`)
- Level and XP display
- Weekly activity bar chart
- Streak banner
- Statistics grid:
  - Tasks completed
  - Rooms cleaned
  - Current streak
  - Time spent
  - Best streak
  - Badges earned
- Badge showcase (earned + locked)
- Room progress list

### 8. Collection (`/collection`)
- Stats overview: Total, Unique, Completion %
- Rarity breakdown
- Category filter tabs
- Grid of collectibles
- Detail modal with:
  - Rarity badge
  - Description
  - XP value
  - Owned count
  - Spawn rate
  - Unlock requirements

### 9. Settings (`/settings`)
- API key configuration
- Haptic feedback toggle
- Focus Mode settings
- Collectibles toggle
- Data management (clear all)

---

## AI Integration

### Gemini 3.0 Flash API

#### Configuration
```typescript
// services/gemini.ts
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent';
```

#### API Key Setup
1. Get API key from: https://ai.google.dev/
2. Enter in Settings screen
3. Key is stored securely in AsyncStorage

#### Analysis Flow
1. User captures/selects image
2. Image converted to base64
3. Request sent to Gemini with system prompt
4. Response parsed into structured tasks
5. Tasks stored in room state

#### Response Format
```json
{
  "messLevel": 65,
  "summary": "Description of the room...",
  "encouragement": "Motivational message...",
  "roomType": "bedroom",
  "quickWins": ["Task 1", "Task 2"],
  "estimatedTotalTime": 45,
  "tasks": [
    {
      "title": "Clear the desk",
      "description": "Detailed instructions...",
      "emoji": "📝",
      "priority": "high",
      "difficulty": "medium",
      "estimatedMinutes": 10,
      "tips": ["Tip 1", "Tip 2"],
      "subtasks": [
        {"title": "Step 1"},
        {"title": "Step 2"}
      ]
    }
  ]
}
```

#### Progress Comparison
The AI can compare before/after photos:
```typescript
analyzeProgress(beforeImage, afterImage) → {
  progressPercentage: number,
  completedTasks: string[],
  remainingTasks: string[],
  encouragement: string
}
```

---

## Data Management

### AsyncStorage Keys
```typescript
const STORAGE_KEYS = {
  USER: 'declutter_user',
  ROOMS: 'declutter_rooms',
  STATS: 'declutter_stats',
  SETTINGS: 'declutter_settings',
  API_KEY: 'declutter_api_key',
  MASCOT: 'declutter_mascot',
  COLLECTION: 'declutter_collection',
  COLLECTION_STATS: 'declutter_collection_stats',
};
```

### Data Models

#### User
```typescript
interface User {
  id: string;
  name: string;
  createdAt: Date;
  onboardingComplete: boolean;
}
```

#### Room
```typescript
interface Room {
  id: string;
  name: string;
  type: RoomType;
  emoji: string;
  createdAt: Date;
  messLevel: number;
  currentProgress: number;
  tasks: CleaningTask[];
  photos: RoomPhoto[];
  aiSummary?: string;
  motivationalMessage?: string;
  lastAnalyzedAt?: Date;
}
```

#### Stats
```typescript
interface UserStats {
  totalTasksCompleted: number;
  totalRoomsCleaned: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string;
  xp: number;
  level: number;
  totalMinutesCleaned: number;
  badges: Badge[];
}
```

### Persistence
- All data persists automatically via AsyncStorage
- State hydrates on app launch
- Changes save immediately

---

## Gamification System

### XP System
| Action | XP Reward |
|--------|-----------|
| Complete task | 10-30 XP |
| Collect item | 5-50 XP (by rarity) |
| Complete room | 50 XP |
| Daily login | 10 XP |

### Levels
- XP required per level: `level * 100`
- Level displayed on home screen
- Unlocks higher-tier collectibles

### Streaks
- Tracked daily via `lastActiveDate`
- Completing any task counts
- Displayed prominently in UI

### Badges
| Badge | Requirement |
|-------|-------------|
| First Steps | Complete 1 task |
| Getting Started | Complete 5 tasks |
| Task Master | Complete 50 tasks |
| Room Rookie | Clean 1 room |
| Room Expert | Clean 10 rooms |
| Streak Starter | 3-day streak |
| Streak Master | 30-day streak |
| Time Invested | 60 min cleaned |
| Dedicated | 300 min cleaned |

### Collectibles

#### Rarity Distribution
| Rarity | Spawn Chance | XP Value |
|--------|--------------|----------|
| Common | 60% | 5 XP |
| Uncommon | 25% | 10 XP |
| Rare | 10% | 20 XP |
| Epic | 4% | 35 XP |
| Legendary | 1% | 50 XP |

#### Spawn Mechanics
- 40% chance on task completion
- Higher levels = more spawns
- Special items require task count thresholds

---

## Setup & Configuration

### Development Setup
```bash
# Install dependencies
npm install

# Start development server
npx expo start

# Run on iOS
npx expo run:ios

# Run on Android
npx expo run:android
```

### Environment Configuration
No environment variables required for basic usage. API key is configured in-app.

### Building for Production
```bash
# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android
```

---

## Video Support

### Current Implementation
- Videos can be selected from gallery (up to 30 seconds)
- Video indicator badge shown during preview
- For AI analysis, the first frame is extracted
- Same analysis flow as photos

### How It Works
1. User selects video via ImagePicker
2. `mediaType: 'video'` is detected
3. Video URI passed to analysis
4. Analysis screen shows video preview
5. For Gemini API, first frame is used

### Limitations
- Live video recording not yet supported
- Only gallery video selection available
- Maximum duration: 30 seconds
- Frame extraction uses video thumbnail

### Future Improvements
- Add live video recording
- Multi-frame analysis for better accuracy
- Video playback in preview

---

## Troubleshooting

### Common Issues

#### API Key Not Working
1. Verify key at https://ai.google.dev/
2. Check for spaces/typos
3. Ensure Gemini API is enabled in Google Cloud Console

#### Analysis Failing
- Check network connection
- Verify image is not too large
- Try re-capturing the photo
- Check console for error details

#### Data Not Persisting
- Check AsyncStorage permissions
- Clear and reinstall app
- Check for storage quota issues

#### Camera Not Working
- Grant camera permissions in device settings
- Restart the app
- Check if camera is in use by another app

### Debug Mode
Enable console logging by checking logs in Metro bundler terminal.

### Clear All Data
Settings → Scroll to bottom → "Clear All Data"

---

## API Reference

### Context Methods

```typescript
// Room Management
addRoom(room: Partial<Room>): Room
updateRoom(id: string, updates: Partial<Room>): void
deleteRoom(id: string): void
setActiveRoom(id: string | null): void
setTasksForRoom(roomId: string, tasks: CleaningTask[]): void
addPhotoToRoom(roomId: string, photo: Omit<RoomPhoto, 'id'>): void

// Task Management
toggleTask(roomId: string, taskId: string): void
toggleSubTask(roomId: string, taskId: string, subTaskId: string): void

// User Management
setUser(user: User): void
completeOnboarding(): void

// Mascot
createMascot(name: string, personality: MascotPersonality): void
updateMascotMood(mood: MascotMood): void

// Collection
addToCollection(collectibleId: string): void
dismissSpawn(): void

// Data Management
clearAllData(): Promise<void>
resetStats(): void
```

### Gemini Service

```typescript
// Set API key
setGeminiApiKey(key: string): void

// Get current key
getGeminiApiKey(): string

// Analyze room image
analyzeRoomImage(
  base64Image: string,
  context?: string
): Promise<AIAnalysisResult>

// Compare before/after
analyzeProgress(
  beforeImage: string,
  afterImage: string
): Promise<ProgressResult>

// Get motivation
getMotivation(context: string): Promise<string>
```

---

## Contributing

### Code Style
- Use TypeScript strict mode
- Follow React Native best practices
- Prefer functional components
- Use hooks for state/effects
- Keep components focused and small

### Pull Request Guidelines
1. Create feature branch
2. Write clear commit messages
3. Test on iOS and Android
4. Update documentation if needed
5. Request review

---

## License

This project is proprietary software. All rights reserved.
