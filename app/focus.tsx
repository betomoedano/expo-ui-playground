/**
 * Declutterly - Focus Mode Screen
 * Full-screen focus timer with app blocking and motivation
 */

import {
  Host,
  VStack,
  HStack,
  Text,
  Button,
  Section,
} from '@expo/ui/swift-ui';
import {
  frame,
  foregroundStyle,
  padding,
  cornerRadius,
} from '@expo/ui/swift-ui/modifiers';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect, useRef } from 'react';
import {
  useColorScheme,
  View,
  StyleSheet,
  Pressable,
  Dimensions,
  AppState,
  AppStateStatus,
  Text as RNText,
  Vibration,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useDeclutter } from '@/context/DeclutterContext';
import { Colors } from '@/constants/Colors';
import { FOCUS_QUOTES } from '@/types/declutter';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

export default function FocusModeScreen() {
  const rawColorScheme = useColorScheme();
  const colorScheme = rawColorScheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[colorScheme];

  const params = useLocalSearchParams<{ duration?: string; roomId?: string }>();
  const duration = parseInt(params.duration || '25', 10);
  const roomId = params.roomId;

  const {
    focusSession,
    startFocusSession,
    pauseFocusSession,
    resumeFocusSession,
    endFocusSession,
    updateFocusSession,
    mascot,
    settings,
  } = useDeclutter();

  const [quote, setQuote] = useState(FOCUS_QUOTES[0]);
  const [showExitWarning, setShowExitWarning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const appState = useRef(AppState.currentState);

  // Animation values
  const pulseScale = useSharedValue(1);
  const progressRotation = useSharedValue(0);

  // Start session on mount
  useEffect(() => {
    if (!focusSession) {
      startFocusSession(duration, roomId);
    }

    // Rotate quote every 30 seconds
    const quoteInterval = setInterval(() => {
      const randomQuote = FOCUS_QUOTES[Math.floor(Math.random() * FOCUS_QUOTES.length)];
      setQuote(randomQuote);
    }, 30000);

    // Pulse animation
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    return () => {
      clearInterval(quoteInterval);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Timer countdown
  useEffect(() => {
    if (focusSession?.isActive && !focusSession?.isPaused) {
      timerRef.current = setInterval(() => {
        if (focusSession.remainingSeconds > 0) {
          updateFocusSession({ remainingSeconds: focusSession.remainingSeconds - 1 });
        } else {
          // Timer complete!
          handleTimerComplete();
        }
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [focusSession?.isActive, focusSession?.isPaused, focusSession?.remainingSeconds]);

  // Handle app state changes (detect when user leaves app)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, []);

  function handleAppStateChange(nextAppState: AppStateStatus) {
    if (appState.current === 'active' && nextAppState.match(/inactive|background/)) {
      // User is trying to leave!
      if (focusSession?.isActive && settings.focusMode.strictMode) {
        updateFocusSession({
          distractionAttempts: (focusSession.distractionAttempts || 0) + 1,
        });
        Vibration.vibrate([0, 100, 50, 100]);
      }
    }
    appState.current = nextAppState;
  }

  function handleTimerComplete() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Vibration.vibrate([0, 200, 100, 200, 100, 200]);
    endFocusSession();
    router.back();
  }

  function handlePauseResume() {
    if (focusSession?.isPaused) {
      resumeFocusSession();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      pauseFocusSession();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }

  function handleExit() {
    if (settings.focusMode.strictMode && focusSession && focusSession.remainingSeconds > 60) {
      setShowExitWarning(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } else {
      confirmExit();
    }
  }

  function confirmExit() {
    endFocusSession();
    router.back();
  }

  // Format time display
  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  // Calculate progress percentage
  const totalSeconds = duration * 60;
  const elapsedSeconds = totalSeconds - (focusSession?.remainingSeconds || totalSeconds);
  const progress = elapsedSeconds / totalSeconds;

  // Animated styles
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  // Get mascot emoji based on mood
  const getMascotEmoji = () => {
    if (!mascot) return '🧹';
    switch (mascot.activity) {
      case 'cleaning': return '🧹';
      case 'cheering': return '🎉';
      case 'celebrating': return '🥳';
      default:
        switch (mascot.mood) {
          case 'ecstatic': return '🤩';
          case 'happy': return '😊';
          case 'excited': return '😄';
          default: return '😊';
        }
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.primary }]}>
      {/* Exit Warning Modal */}
      {showExitWarning && (
        <View style={styles.warningOverlay}>
          <View style={[styles.warningModal, { backgroundColor: colors.card }]}>
            <RNText style={[styles.warningTitle, { color: colors.text }]}>
              Wait! You're doing great!
            </RNText>
            <RNText style={[styles.warningText, { color: colors.textSecondary }]}>
              Are you sure you want to exit focus mode? You've already completed{' '}
              {focusSession?.tasksCompletedDuringSession || 0} tasks!
            </RNText>
            <View style={styles.warningButtons}>
              <Pressable
                style={[styles.warningButton, { backgroundColor: colors.success }]}
                onPress={() => setShowExitWarning(false)}
              >
                <RNText style={styles.warningButtonText}>Keep Going!</RNText>
              </Pressable>
              <Pressable
                style={[styles.warningButton, { backgroundColor: colors.danger }]}
                onPress={confirmExit}
              >
                <RNText style={styles.warningButtonText}>Exit Anyway</RNText>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {/* Main Content */}
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={handleExit} style={styles.exitButton}>
            <RNText style={styles.exitText}>Exit</RNText>
          </Pressable>
          <RNText style={styles.modeText}>
            {settings.focusMode.strictMode ? '🔒 Strict Mode' : '🧘 Focus Mode'}
          </RNText>
        </View>

        {/* Timer Circle */}
        <View style={styles.timerContainer}>
          <Animated.View style={[styles.timerCircle, pulseStyle]}>
            {/* Progress ring */}
            <View style={styles.progressRing}>
              <View
                style={[
                  styles.progressFill,
                  {
                    transform: [{ rotate: `${progress * 360}deg` }],
                  },
                ]}
              />
            </View>

            {/* Timer display */}
            <View style={styles.timerInner}>
              <RNText style={styles.timerText}>
                {formatTime(focusSession?.remainingSeconds || 0)}
              </RNText>
              <RNText style={styles.timerLabel}>
                {focusSession?.isPaused ? 'PAUSED' : 'remaining'}
              </RNText>
            </View>
          </Animated.View>
        </View>

        {/* Mascot */}
        <View style={styles.mascotContainer}>
          <RNText style={styles.mascotEmoji}>{getMascotEmoji()}</RNText>
          {mascot && (
            <RNText style={styles.mascotMessage}>
              {mascot.name} is cleaning with you!
            </RNText>
          )}
        </View>

        {/* Motivational Quote */}
        {settings.focusMode.showMotivationalQuotes && (
          <View style={styles.quoteContainer}>
            <RNText style={styles.quoteText}>"{quote}"</RNText>
          </View>
        )}

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <RNText style={styles.statValue}>
              {focusSession?.tasksCompletedDuringSession || 0}
            </RNText>
            <RNText style={styles.statLabel}>Tasks Done</RNText>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <RNText style={styles.statValue}>
              {Math.floor(elapsedSeconds / 60)}
            </RNText>
            <RNText style={styles.statLabel}>Minutes</RNText>
          </View>
          {focusSession?.distractionAttempts ? (
            <>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <RNText style={styles.statValue}>
                  {focusSession.distractionAttempts}
                </RNText>
                <RNText style={styles.statLabel}>Resisted</RNText>
              </View>
            </>
          ) : null}
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <Pressable
            style={[styles.controlButton, styles.pauseButton]}
            onPress={handlePauseResume}
          >
            <RNText style={styles.controlButtonText}>
              {focusSession?.isPaused ? '▶️ Resume' : '⏸️ Pause'}
            </RNText>
          </Pressable>

          <Pressable
            style={[styles.controlButton, styles.addTimeButton]}
            onPress={() => {
              updateFocusSession({
                remainingSeconds: (focusSession?.remainingSeconds || 0) + 300,
                duration: (focusSession?.duration || duration) + 5,
              });
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <RNText style={styles.controlButtonText}>+5 min</RNText>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  exitButton: {
    padding: 10,
  },
  exitText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    fontWeight: '600',
  },
  modeText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    fontWeight: '500',
  },
  timerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 30,
  },
  timerCircle: {
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressRing: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    borderWidth: 8,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  progressFill: {
    position: 'absolute',
    width: 125,
    height: 250,
    backgroundColor: 'transparent',
    borderTopRightRadius: 125,
    borderBottomRightRadius: 125,
    borderWidth: 8,
    borderLeftWidth: 0,
    borderColor: '#fff',
    transformOrigin: 'left center',
  },
  timerInner: {
    alignItems: 'center',
  },
  timerText: {
    fontSize: 56,
    fontWeight: '200',
    color: '#fff',
    fontVariant: ['tabular-nums'],
  },
  timerLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginTop: 4,
  },
  mascotContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  mascotEmoji: {
    fontSize: 48,
  },
  mascotMessage: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginTop: 8,
  },
  quoteContainer: {
    paddingHorizontal: 30,
    marginVertical: 20,
  },
  quoteText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 20,
    marginVertical: 20,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 'auto',
    marginBottom: 50,
  },
  controlButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    minWidth: 130,
    alignItems: 'center',
  },
  pauseButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  addTimeButton: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  controlButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  warningOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  warningModal: {
    width: width * 0.85,
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
  },
  warningTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  warningText: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 24,
  },
  warningButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  warningButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    minWidth: 120,
    alignItems: 'center',
  },
  warningButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
