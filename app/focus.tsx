/**
 * Declutterly - Focus Mode Screen
 * Immersive focus timer with beautiful animations and motivation
 */

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
import { FOCUS_QUOTES, MASCOT_PERSONALITIES } from '@/types/declutter';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withSpring,
  Easing,
  interpolate,
  FadeIn,
  FadeOut,
  SlideInDown,
  ZoomIn,
} from 'react-native-reanimated';
// Using native View with gradient-like styling

const { width, height } = Dimensions.get('window');
const TIMER_SIZE = Math.min(width * 0.7, 280);

// Breathing particle for ambient effect
function BreathingParticle({ delay, size, x, y }: { delay: number; size: number; x: number; y: number }) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.5);
  const translateY = useSharedValue(0);

  useEffect(() => {
    opacity.value = withSequence(
      withTiming(0, { duration: delay }),
      withRepeat(
        withSequence(
          withTiming(0.6, { duration: 2000 }),
          withTiming(0.1, { duration: 2000 })
        ),
        -1,
        true
      )
    );

    scale.value = withSequence(
      withTiming(0.5, { duration: delay }),
      withRepeat(
        withSequence(
          withTiming(1, { duration: 3000 }),
          withTiming(0.5, { duration: 3000 })
        ),
        -1,
        true
      )
    );

    translateY.value = withRepeat(
      withSequence(
        withTiming(-20, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
        withTiming(20, { duration: 4000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { scale: scale.value },
      { translateY: translateY.value },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.particle,
        animatedStyle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          left: x,
          top: y,
        },
      ]}
    />
  );
}

// Animated progress ring
function ProgressRing({ progress, isPaused }: { progress: number; isPaused: boolean }) {
  const rotation = useSharedValue(0);
  const glowOpacity = useSharedValue(0.5);

  useEffect(() => {
    if (!isPaused) {
      rotation.value = withRepeat(
        withTiming(360, { duration: 20000, easing: Easing.linear }),
        -1,
        false
      );

      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.8, { duration: 1500 }),
          withTiming(0.4, { duration: 1500 })
        ),
        -1,
        true
      );
    }
  }, [isPaused]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  // Calculate the stroke dasharray for progress
  const circumference = TIMER_SIZE * Math.PI;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <View style={styles.progressRingContainer}>
      {/* Background ring */}
      <View style={styles.ringBackground} />

      {/* Animated glow */}
      <Animated.View style={[styles.ringGlow, glowStyle]} />

      {/* Progress arc - using segments */}
      <View style={styles.progressSegments}>
        {Array.from({ length: 60 }).map((_, i) => {
          const segmentProgress = i / 60;
          const isActive = segmentProgress <= progress;
          const angle = (i / 60) * 360 - 90;
          const radians = (angle * Math.PI) / 180;
          const x = (TIMER_SIZE / 2) * Math.cos(radians);
          const y = (TIMER_SIZE / 2) * Math.sin(radians);

          return (
            <View
              key={i}
              style={[
                styles.progressSegment,
                {
                  opacity: isActive ? 1 : 0.2,
                  backgroundColor: isActive ? '#fff' : 'rgba(255,255,255,0.3)',
                  transform: [
                    { translateX: x + TIMER_SIZE / 2 - 3 },
                    { translateY: y + TIMER_SIZE / 2 - 3 },
                    { rotate: `${angle + 90}deg` },
                  ],
                },
              ]}
            />
          );
        })}
      </View>

      {/* Rotating accent */}
      <Animated.View style={[styles.rotatingAccent, ringStyle]}>
        <View style={styles.accentDot} />
      </Animated.View>
    </View>
  );
}

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
  const [showCompletion, setShowCompletion] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const appState = useRef(AppState.currentState);

  // Animation values
  const timerScale = useSharedValue(1);
  const breatheScale = useSharedValue(1);
  const mascotBounce = useSharedValue(0);

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

    // Breathing animation for timer
    breatheScale.value = withRepeat(
      withSequence(
        withTiming(1.02, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Mascot bounce
    mascotBounce.value = withRepeat(
      withSequence(
        withTiming(-5, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(5, { duration: 800, easing: Easing.inOut(Easing.ease) })
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

  // Handle app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, []);

  function handleAppStateChange(nextAppState: AppStateStatus) {
    if (appState.current === 'active' && nextAppState.match(/inactive|background/)) {
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
    setShowCompletion(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Vibration.vibrate([0, 200, 100, 200, 100, 200]);

    setTimeout(() => {
      endFocusSession();
      router.back();
    }, 3000);
  }

  function handlePauseResume() {
    if (focusSession?.isPaused) {
      resumeFocusSession();
      timerScale.value = withSpring(1, { damping: 10 });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      pauseFocusSession();
      timerScale.value = withSpring(0.95, { damping: 10 });
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

  function formatTime(seconds: number): { mins: string; secs: string } {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return {
      mins: mins.toString().padStart(2, '0'),
      secs: secs.toString().padStart(2, '0'),
    };
  }

  // Calculate progress
  const totalSeconds = duration * 60;
  const elapsedSeconds = totalSeconds - (focusSession?.remainingSeconds || totalSeconds);
  const progress = elapsedSeconds / totalSeconds;
  const time = formatTime(focusSession?.remainingSeconds || 0);

  // Animated styles
  const timerStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: timerScale.value * breatheScale.value },
    ],
  }));

  const mascotStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: mascotBounce.value }],
  }));

  // Get mascot personality info
  const mascotEmoji = mascot ? MASCOT_PERSONALITIES[mascot.personality].emoji : '🧹';

  // Generate ambient particles
  const particles = Array.from({ length: 8 }).map((_, i) => ({
    id: i,
    delay: i * 500,
    size: Math.random() * 40 + 20,
    x: Math.random() * width,
    y: Math.random() * height * 0.7,
  }));

  // Get primary color based on progress
  const getPrimaryColor = (): string => {
    if (progress < 0.33) {
      return '#667eea';
    } else if (progress < 0.66) {
      return '#11998e';
    } else {
      return '#8B5CF6';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: getPrimaryColor() }]}>

      {/* Ambient particles */}
      {particles.map(p => (
        <BreathingParticle key={p.id} delay={p.delay} size={p.size} x={p.x} y={p.y} />
      ))}

      {/* Completion celebration */}
      {showCompletion && (
        <Animated.View
          entering={ZoomIn.springify()}
          style={styles.completionOverlay}
        >
          <RNText style={styles.completionEmoji}>🎉</RNText>
          <RNText style={styles.completionTitle}>Amazing!</RNText>
          <RNText style={styles.completionText}>
            You completed {focusSession?.tasksCompletedDuringSession || 0} tasks!
          </RNText>
          <RNText style={styles.completionXP}>+{Math.floor(elapsedSeconds / 60) * 10} XP</RNText>
        </Animated.View>
      )}

      {/* Exit Warning Modal */}
      {showExitWarning && (
        <Animated.View
          entering={FadeIn}
          exiting={FadeOut}
          style={styles.warningOverlay}
        >
          <Animated.View
            entering={SlideInDown.springify()}
            style={[styles.warningModal, { backgroundColor: colors.card }]}
          >
            <RNText style={styles.warningEmoji}>💪</RNText>
            <RNText style={[styles.warningTitle, { color: colors.text }]}>
              You're doing great!
            </RNText>
            <RNText style={[styles.warningText, { color: colors.textSecondary }]}>
              Are you sure you want to exit? You've already completed{' '}
              <RNText style={{ fontWeight: '700', color: colors.text }}>
                {focusSession?.tasksCompletedDuringSession || 0} tasks
              </RNText>
              !
            </RNText>
            <View style={styles.warningButtons}>
              <Pressable
                style={[styles.warningButton, styles.keepGoingButton]}
                onPress={() => setShowExitWarning(false)}
              >
                <RNText style={styles.warningButtonText}>Keep Going! 🔥</RNText>
              </Pressable>
              <Pressable
                style={[styles.warningButton, styles.exitAnywayButton]}
                onPress={confirmExit}
              >
                <RNText style={[styles.warningButtonText, { opacity: 0.8 }]}>Exit</RNText>
              </Pressable>
            </View>
          </Animated.View>
        </Animated.View>
      )}

      {/* Main Content */}
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={handleExit} style={styles.exitButton}>
            <View style={styles.exitButtonInner}>
              <RNText style={styles.exitIcon}>←</RNText>
              <RNText style={styles.exitText}>Exit</RNText>
            </View>
          </Pressable>
          <View style={styles.modeContainer}>
            <RNText style={styles.modeEmoji}>
              {settings.focusMode.strictMode ? '🔒' : '🧘'}
            </RNText>
            <RNText style={styles.modeText}>
              {settings.focusMode.strictMode ? 'Strict' : 'Focus'}
            </RNText>
          </View>
        </View>

        {/* Timer Section */}
        <View style={styles.timerSection}>
          <Animated.View style={[styles.timerContainer, timerStyle]}>
            <ProgressRing progress={progress} isPaused={focusSession?.isPaused || false} />

            <View style={styles.timerContent}>
              <View style={styles.timeDisplay}>
                <RNText style={styles.timeDigits}>{time.mins}</RNText>
                <RNText style={styles.timeSeparator}>:</RNText>
                <RNText style={styles.timeDigits}>{time.secs}</RNText>
              </View>
              <RNText style={styles.timerLabel}>
                {focusSession?.isPaused ? '⏸️ PAUSED' : 'remaining'}
              </RNText>
            </View>
          </Animated.View>
        </View>

        {/* Mascot */}
        <Animated.View style={[styles.mascotSection, mascotStyle]}>
          <View style={styles.mascotBubble}>
            <RNText style={styles.mascotEmoji}>{mascotEmoji}</RNText>
          </View>
          {mascot && (
            <RNText style={styles.mascotMessage}>
              {focusSession?.isPaused
                ? `${mascot.name} is waiting...`
                : `${mascot.name} is cleaning with you!`}
            </RNText>
          )}
        </Animated.View>

        {/* Quote */}
        {settings.focusMode.showMotivationalQuotes && (
          <Animated.View entering={FadeIn.delay(300)} style={styles.quoteContainer}>
            <RNText style={styles.quoteText}>"{quote}"</RNText>
          </Animated.View>
        )}

        {/* Stats Bar */}
        <View style={styles.statsBar}>
          <View style={styles.statPill}>
            <RNText style={styles.statPillValue}>
              {focusSession?.tasksCompletedDuringSession || 0}
            </RNText>
            <RNText style={styles.statPillLabel}>tasks</RNText>
          </View>
          <View style={styles.statPill}>
            <RNText style={styles.statPillValue}>
              {Math.floor(elapsedSeconds / 60)}
            </RNText>
            <RNText style={styles.statPillLabel}>min</RNText>
          </View>
          {(focusSession?.distractionAttempts ?? 0) > 0 && (
            <View style={[styles.statPill, styles.resistedPill]}>
              <RNText style={styles.statPillValue}>
                {focusSession?.distractionAttempts}
              </RNText>
              <RNText style={styles.statPillLabel}>resisted</RNText>
            </View>
          )}
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <Pressable
            style={styles.secondaryButton}
            onPress={() => {
              updateFocusSession({
                remainingSeconds: (focusSession?.remainingSeconds || 0) + 300,
                duration: (focusSession?.duration || duration) + 5,
              });
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <RNText style={styles.secondaryButtonText}>+5 min</RNText>
          </Pressable>

          <Pressable
            style={styles.primaryButton}
            onPress={handlePauseResume}
          >
            <RNText style={styles.primaryButtonEmoji}>
              {focusSession?.isPaused ? '▶️' : '⏸️'}
            </RNText>
            <RNText style={styles.primaryButtonText}>
              {focusSession?.isPaused ? 'Resume' : 'Pause'}
            </RNText>
          </Pressable>

          <Pressable
            style={styles.secondaryButton}
            onPress={() => {
              if ((focusSession?.remainingSeconds || 0) > 300) {
                updateFocusSession({
                  remainingSeconds: (focusSession?.remainingSeconds || 0) - 300,
                  duration: Math.max(5, (focusSession?.duration || duration) - 5),
                });
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
            }}
          >
            <RNText style={styles.secondaryButtonText}>-5 min</RNText>
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
  particle: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.15)',
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
    padding: 4,
  },
  exitButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    gap: 6,
  },
  exitIcon: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  exitText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  modeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    gap: 6,
  },
  modeEmoji: {
    fontSize: 14,
  },
  modeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  timerSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  timerContainer: {
    width: TIMER_SIZE,
    height: TIMER_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressRingContainer: {
    position: 'absolute',
    width: TIMER_SIZE,
    height: TIMER_SIZE,
  },
  ringBackground: {
    position: 'absolute',
    width: TIMER_SIZE,
    height: TIMER_SIZE,
    borderRadius: TIMER_SIZE / 2,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  ringGlow: {
    position: 'absolute',
    width: TIMER_SIZE + 20,
    height: TIMER_SIZE + 20,
    left: -10,
    top: -10,
    borderRadius: (TIMER_SIZE + 20) / 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  progressSegments: {
    position: 'absolute',
    width: TIMER_SIZE,
    height: TIMER_SIZE,
  },
  progressSegment: {
    position: 'absolute',
    width: 6,
    height: 2,
    borderRadius: 1,
  },
  rotatingAccent: {
    position: 'absolute',
    width: TIMER_SIZE,
    height: TIMER_SIZE,
  },
  accentDot: {
    position: 'absolute',
    top: -4,
    left: TIMER_SIZE / 2 - 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  timerContent: {
    alignItems: 'center',
  },
  timeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeDigits: {
    fontSize: 64,
    fontWeight: '200',
    color: '#fff',
    fontVariant: ['tabular-nums'],
    width: 80,
    textAlign: 'center',
  },
  timeSeparator: {
    fontSize: 56,
    fontWeight: '200',
    color: 'rgba(255,255,255,0.7)',
    marginHorizontal: -8,
  },
  timerLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
    letterSpacing: 3,
    marginTop: 8,
  },
  mascotSection: {
    alignItems: 'center',
    marginTop: 30,
  },
  mascotBubble: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mascotEmoji: {
    fontSize: 36,
  },
  mascotMessage: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    marginTop: 10,
    fontWeight: '500',
  },
  quoteContainer: {
    paddingHorizontal: 30,
    marginTop: 24,
  },
  quoteText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 15,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 24,
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 30,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 6,
  },
  resistedPill: {
    backgroundColor: 'rgba(34, 197, 94, 0.3)',
  },
  statPillValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  statPillLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    marginTop: 'auto',
    marginBottom: 50,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingVertical: 18,
    paddingHorizontal: 36,
    borderRadius: 30,
    gap: 10,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  primaryButtonEmoji: {
    fontSize: 20,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  secondaryButtonText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    fontWeight: '600',
  },
  warningOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  warningModal: {
    width: width * 0.85,
    padding: 28,
    borderRadius: 24,
    alignItems: 'center',
  },
  warningEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  warningTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  warningText: {
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 24,
  },
  warningButtons: {
    width: '100%',
    gap: 12,
  },
  warningButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  keepGoingButton: {
    backgroundColor: '#22C55E',
  },
  exitAnywayButton: {
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  warningButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  completionOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 200,
  },
  completionEmoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  completionTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
  },
  completionText: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 16,
  },
  completionXP: {
    fontSize: 28,
    fontWeight: '700',
    color: '#22C55E',
  },
});
