# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is an **Expo UI Playground** - an experimental React Native application built with Expo SDK 54 and React 19, specifically designed to showcase and explore [Expo UI](https://docs.expo.dev/ui/overview/) Swift components. The app demonstrates a complete productivity interface with comprehensive component examples and real-world implementations.

## Development Commands

### Core Development
```bash
# Install dependencies
npm install

# Start development server
expo start
npx expo start

# Run on specific platforms
expo run:ios      # iOS development build
expo run:android  # Android development build
expo start --web  # Web development

# Linting
expo lint
```

### Platform Testing
- **iOS Simulator** (recommended - best Expo UI support, requires iOS 16+)
- **Android Emulator**
- **Physical device** with Expo Go

## Architecture Overview

### Application Structure

The app uses **Expo Router** with native tabs and follows a modular component architecture:

```
app/
├── _layout.tsx           # Root native tabs layout (Home, Basic, Settings)
├── home/index.tsx        # Main playground (liquid-glass-example)
├── basic/index.tsx       # Basic usage examples
└── settings.tsx          # Settings/configuration

components/
├── liquid-glass/         # Main playground components
│   ├── AppContext.tsx    # React Context with use() hook
│   ├── types.ts          # TypeScript definitions
│   └── *Section.tsx      # Modular UI sections
└── screens/              # Screen implementations
```

### State Management Architecture

**React Context with React 19's `use()` hook** - This is a key architectural decision:

- **AppContext.tsx**: Centralized state management using React 19's new `use()` hook
- **Real-time state synchronization**: All components share and update common state
- **Type-safe interfaces**: Full TypeScript integration with comprehensive type definitions
- **Modular state updates**: Dedicated updater functions for different app sections

### Component Organization

The app is structured around **functional UI sections** rather than traditional screens:

- **ProfileSection**: User avatar, theme customization, settings disclosure groups
- **DashboardSection**: Interactive gauges (6 types), sliders, performance metrics
- **TaskManagementSection**: Task filtering, completion tracking, priority visualization
- **ContextMenuSection**: Nested submenus, state persistence, destructive actions
- **DateTimeSection**: Multiple picker variants, display modes
- **ButtonsSection**: All 7 Expo UI button variants
- **SettingsSection**: App configuration with disclosure groups

## Key Technical Patterns

### Expo UI Integration
- **Swift UI components**: Button, Gauge, Slider, Switch, Picker, ColorPicker, etc.
- **Modifiers system**: Uses Expo UI's Swift-like modifier pattern for styling
- **Platform optimization**: Best performance on iOS 16+, with iOS-first design patterns

### Modern React Patterns
```tsx
// React 19 use() hook pattern
const { profile, updateProfile } = use(AppContext) as AppState;

// Modifiers pattern for styling
modifiers={[
  frame({ width: 100, height: 100 }),
  background(profile.theme),
  cornerRadius(100)
]}
```

### TypeScript Integration
- **Strict mode enabled**
- **Path aliases**: `@/*` for root-relative imports
- **Comprehensive interfaces**: All components fully typed
- **Type-safe state management**: Context and state updates

## Development Considerations

### Expo UI Specifics
- **iOS-first components**: Many components work best on iOS simulators
- **Version requirements**: iOS 16+ for full feature support
- **Glass effects and modifiers**: Heavy use of Expo UI's advanced styling system

### State Management Flow
- **Centralized context**: Single AppContext manages all app state
- **Real-time updates**: Components update immediately when state changes
- **Meaningful data flow**: Realistic interactions between all components
- **Performance optimized**: Efficient re-renders and state updates

### Component Development
- Each section is **completely modular** and can be developed independently
- **Real data interactions**: Components affect shared state, not just UI demos
- **Type safety**: All props and state are strictly typed

## Project-Specific Rules
- Don't use legacy shadow styles; use box shadow instead
- Always implement dark mode support
- Don't use SafeAreaView since it's deprecated
- Use `contentInsetAdjustmentBehavior="automatic"` with ScrollViews
- Each screen should use a ScrollView as its main container

## Configuration Details

- **Expo SDK**: 54.0.3
- **React**: 19.1.0 (with new `use()` hook)
- **React Native**: 0.81.4
- **TypeScript**: Strict mode enabled
- **New Architecture**: Enabled (`newArchEnabled: true`)
- **Edge-to-edge**: Enabled on Android
- **Typed routes**: Experimental feature enabled

## Important Notes

This is an **experimental playground** focused on showcasing Expo UI components with real-world interactions. When working with this codebase:

- Prioritize iOS development/testing for full feature support
- Maintain the modular section-based architecture
- Preserve the React Context + `use()` hook state management pattern
- Keep components interactive and connected to shared state
- Follow the established TypeScript patterns and interfaces