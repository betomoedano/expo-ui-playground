/**
 * Declutterly - Onboarding Screen
 * Quick tutorial with guest mode and optional mascot selection
 */

import { Colors } from '@/constants/Colors';
import { useDeclutter, saveApiKey } from '@/context/DeclutterContext';
import { router } from 'expo-router';
import React, { useState, useRef } from 'react';
import {
  useColorScheme,
  View,
  StyleSheet,
  Dimensions,
  Pressable,
  Text as RNText,
  ScrollView,
  Animated,
  FlatList,
  TextInput,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { MASCOT_PERSONALITIES, MascotPersonality } from '@/types/declutter';

const { width, height } = Dimensions.get('window');

// Short tutorial slides - just 3 quick steps
const tutorialSlides = [
  {
    id: '1',
    emoji: '📸',
    title: 'Snap a Photo',
    description: 'Take a picture of any messy space',
    tip: 'Works with photos AND videos!',
  },
  {
    id: '2',
    emoji: '🤖',
    title: 'AI Creates Your Plan',
    description: 'Get personalized step-by-step tasks',
    tip: '"Quick wins" you can do in 2 minutes',
  },
  {
    id: '3',
    emoji: '✨',
    title: 'Clean & Collect',
    description: 'Complete tasks, earn XP, find rewards!',
    tip: 'Your mascot cheers you on',
  },
];

type OnboardingStep = 'tutorial' | 'setup' | 'ready';

export default function OnboardingScreen() {
  const rawColorScheme = useColorScheme();
  const colorScheme = rawColorScheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[colorScheme];
  const { setUser, completeOnboarding, createMascot } = useDeclutter();

  const [step, setStep] = useState<OnboardingStep>('tutorial');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [name, setName] = useState('');
  const [selectedMascot, setSelectedMascot] = useState<MascotPersonality>('spark');
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleTutorialComplete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setStep('setup');
  };

  const handleSkipTutorial = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStep('setup');
  };

  const handleGetStarted = () => {
    const finalName = name.trim() || 'Friend';

    // Create user profile
    setUser({
      id: `user-${Date.now()}`,
      name: finalName,
      createdAt: new Date(),
      onboardingComplete: true,
    });

    // Create mascot with selected personality
    const mascotInfo = MASCOT_PERSONALITIES[selectedMascot];
    createMascot(mascotInfo.name, selectedMascot);

    completeOnboarding();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace('/(tabs)');
  };

  const handleSlideChange = (index: number) => {
    setCurrentSlide(index);
    Haptics.selectionAsync();
  };

  // Tutorial Step - Quick swipeable slides
  if (step === 'tutorial') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Skip button */}
        <Pressable style={styles.skipButton} onPress={handleSkipTutorial}>
          <RNText style={[styles.skipText, { color: colors.textSecondary }]}>
            Skip
          </RNText>
        </Pressable>

        {/* Tutorial slides */}
        <FlatList
          ref={flatListRef}
          data={tutorialSlides}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false }
          )}
          onMomentumScrollEnd={(e) => {
            const index = Math.round(e.nativeEvent.contentOffset.x / width);
            handleSlideChange(index);
          }}
          renderItem={({ item, index }) => (
            <View style={[styles.slide, { width }]}>
              <View style={styles.slideContent}>
                {/* Step indicator */}
                <View style={[styles.stepBadge, { backgroundColor: colors.primary + '20' }]}>
                  <RNText style={[styles.stepText, { color: colors.primary }]}>
                    Step {index + 1} of 3
                  </RNText>
                </View>

                {/* Main illustration */}
                <View style={styles.illustrationContainer}>
                  <RNText style={styles.slideEmoji}>{item.emoji}</RNText>
                  <View style={styles.decorativeElements}>
                    <RNText style={styles.decorative1}>✨</RNText>
                    <RNText style={styles.decorative2}>⭐</RNText>
                  </View>
                </View>

                {/* Content */}
                <RNText style={[styles.slideTitle, { color: colors.text }]}>
                  {item.title}
                </RNText>
                <RNText style={[styles.slideDescription, { color: colors.textSecondary }]}>
                  {item.description}
                </RNText>

                {/* Tip */}
                <View style={[styles.tipBox, { backgroundColor: colors.primary + '15' }]}>
                  <RNText style={[styles.tipText, { color: colors.primary }]}>
                    💡 {item.tip}
                  </RNText>
                </View>
              </View>
            </View>
          )}
          keyExtractor={(item) => item.id}
        />

        {/* Pagination & Button */}
        <View style={styles.bottomSection}>
          {/* Dots */}
          <View style={styles.pagination}>
            {tutorialSlides.map((_, index) => {
              const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
              const dotWidth = scrollX.interpolate({
                inputRange,
                outputRange: [8, 24, 8],
                extrapolate: 'clamp',
              });
              const opacity = scrollX.interpolate({
                inputRange,
                outputRange: [0.3, 1, 0.3],
                extrapolate: 'clamp',
              });

              return (
                <Animated.View
                  key={index}
                  style={[
                    styles.dot,
                    {
                      width: dotWidth,
                      opacity,
                      backgroundColor: colors.primary,
                    },
                  ]}
                />
              );
            })}
          </View>

          {/* Action Button */}
          {currentSlide === tutorialSlides.length - 1 ? (
            <Pressable
              style={[styles.primaryButton, { backgroundColor: colors.primary }]}
              onPress={handleTutorialComplete}
            >
              <RNText style={styles.primaryButtonText}>Let's Go! 🚀</RNText>
            </Pressable>
          ) : (
            <Pressable
              style={[styles.secondaryButton, { borderColor: colors.primary }]}
              onPress={() => {
                flatListRef.current?.scrollToIndex({ index: currentSlide + 1 });
              }}
            >
              <RNText style={[styles.secondaryButtonText, { color: colors.primary }]}>
                Next →
              </RNText>
            </Pressable>
          )}
        </View>
      </View>
    );
  }

  // Setup Step - Quick name + mascot selection
  if (step === 'setup') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={styles.setupContainer}>
          {/* Header */}
          <View style={styles.setupHeader}>
            <RNText style={styles.waveEmoji}>👋</RNText>
            <RNText style={[styles.setupTitle, { color: colors.text }]}>
              Quick Setup
            </RNText>
            <RNText style={[styles.setupSubtitle, { color: colors.textSecondary }]}>
              Just two things and you're ready!
            </RNText>
          </View>

          {/* Name Input */}
          <View style={styles.inputSection}>
            <RNText style={[styles.inputLabel, { color: colors.text }]}>
              What should we call you?
            </RNText>
            <TextInput
              style={[
                styles.nameInput,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              placeholder="Your name (optional)"
              placeholderTextColor={colors.textSecondary}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              returnKeyType="done"
            />
          </View>

          {/* Mascot Selection */}
          <View style={styles.mascotSection}>
            <RNText style={[styles.inputLabel, { color: colors.text }]}>
              Pick your cleaning buddy
            </RNText>
            <View style={styles.mascotGrid}>
              {(Object.keys(MASCOT_PERSONALITIES) as MascotPersonality[]).map((personality) => {
                const info = MASCOT_PERSONALITIES[personality];
                const isSelected = selectedMascot === personality;

                return (
                  <Pressable
                    key={personality}
                    onPress={() => {
                      setSelectedMascot(personality);
                      Haptics.selectionAsync();
                    }}
                    style={[
                      styles.mascotCard,
                      {
                        backgroundColor: isSelected ? info.color + '25' : colors.card,
                        borderColor: isSelected ? info.color : colors.border,
                        borderWidth: isSelected ? 2 : 1,
                      },
                    ]}
                  >
                    <RNText style={styles.mascotEmoji}>{info.emoji}</RNText>
                    <RNText
                      style={[
                        styles.mascotName,
                        { color: isSelected ? info.color : colors.text },
                      ]}
                    >
                      {info.name}
                    </RNText>
                    {isSelected && (
                      <View style={[styles.checkBadge, { backgroundColor: info.color }]}>
                        <RNText style={styles.checkText}>✓</RNText>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Selected mascot preview */}
          <View style={[styles.previewCard, { backgroundColor: colors.card }]}>
            <RNText style={styles.previewEmoji}>
              {MASCOT_PERSONALITIES[selectedMascot].emoji}
            </RNText>
            <View style={styles.previewText}>
              <RNText style={[styles.previewTitle, { color: colors.text }]}>
                {MASCOT_PERSONALITIES[selectedMascot].name} is ready!
              </RNText>
              <RNText style={[styles.previewDesc, { color: colors.textSecondary }]}>
                {MASCOT_PERSONALITIES[selectedMascot].description}
              </RNText>
            </View>
          </View>

          {/* Start Button */}
          <Pressable
            style={[styles.startButton, { backgroundColor: colors.primary }]}
            onPress={handleGetStarted}
          >
            <RNText style={styles.startButtonText}>
              Start Decluttering! ✨
            </RNText>
          </Pressable>

          {/* Privacy note */}
          <RNText style={[styles.privacyNote, { color: colors.textSecondary }]}>
            Your data is stored locally on your device.
            {'\n'}No account required!
          </RNText>
        </ScrollView>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Skip button
  skipButton: {
    position: 'absolute',
    top: 60,
    right: 24,
    zIndex: 10,
    padding: 8,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '500',
  },
  // Slide styles
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slideContent: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  stepBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 32,
  },
  stepText: {
    fontSize: 14,
    fontWeight: '600',
  },
  illustrationContainer: {
    position: 'relative',
    marginBottom: 32,
  },
  slideEmoji: {
    fontSize: 100,
  },
  decorativeElements: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  decorative1: {
    position: 'absolute',
    top: -10,
    right: -20,
    fontSize: 28,
  },
  decorative2: {
    position: 'absolute',
    bottom: 0,
    left: -25,
    fontSize: 24,
  },
  slideTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  slideDescription: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 26,
  },
  tipBox: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
  },
  tipText: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  // Bottom section
  bottomSection: {
    paddingHorizontal: 32,
    paddingBottom: 48,
    alignItems: 'center',
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  primaryButton: {
    width: '100%',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  secondaryButton: {
    width: '100%',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
  },
  secondaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  // Setup styles
  setupContainer: {
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 40,
  },
  setupHeader: {
    alignItems: 'center',
    marginBottom: 40,
  },
  waveEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  setupTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  setupSubtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  inputSection: {
    marginBottom: 32,
  },
  inputLabel: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 12,
  },
  nameInput: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 17,
  },
  mascotSection: {
    marginBottom: 24,
  },
  mascotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  mascotCard: {
    width: (width - 72) / 3,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    position: 'relative',
  },
  mascotEmoji: {
    fontSize: 36,
  },
  mascotName: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 6,
  },
  checkBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 32,
  },
  previewEmoji: {
    fontSize: 40,
    marginRight: 16,
  },
  previewText: {
    flex: 1,
  },
  previewTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  previewDesc: {
    fontSize: 14,
    lineHeight: 20,
  },
  startButton: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  privacyNote: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
});
