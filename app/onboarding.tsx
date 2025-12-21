/**
 * Declutterly - Onboarding Screen
 * Welcome flow with guest mode, sign-in options, and mascot selection
 */

import { Colors } from '@/constants/Colors';
import { useDeclutter, saveApiKey } from '@/context/DeclutterContext';
import {
  Button,
  Form,
  Host,
  Section,
  Text,
  TextField,
  VStack,
  HStack,
  Spacer,
} from '@expo/ui/swift-ui';
import {
  buttonStyle,
  controlSize,
  foregroundStyle,
  frame,
} from '@expo/ui/swift-ui/modifiers';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  useColorScheme,
  View,
  StyleSheet,
  Dimensions,
  Pressable,
  Text as RNText,
  ScrollView,
  Alert,
  Linking,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { MASCOT_PERSONALITIES, MascotPersonality } from '@/types/declutter';

const { width } = Dimensions.get('window');

// Onboarding slides content
const slides = [
  {
    title: 'Welcome to Declutterly',
    subtitle: 'Your AI-powered cleaning companion',
    description: 'Take control of your space with small, achievable steps. Perfect for busy minds and anyone who wants a calmer home.',
    emoji: '✨',
  },
  {
    title: 'Snap a Photo or Video',
    subtitle: 'Show us your space',
    description: 'Take a picture or video of any room that needs attention. Our AI analyzes it and creates a personalized plan.',
    emoji: '📸',
  },
  {
    title: 'Get Your Cleaning Plan',
    subtitle: 'AI breaks it down for you',
    description: 'Receive step-by-step tasks with clear instructions, time estimates, and "Quick Wins" you can do in 2 minutes.',
    emoji: '📋',
  },
  {
    title: 'Track & Celebrate',
    subtitle: 'Make cleaning fun!',
    description: 'Earn XP, collect virtual rewards, level up your mascot, and watch your space transform!',
    emoji: '🎮',
  },
];

type OnboardingStep = 'welcome' | 'auth' | 'info' | 'mascot' | 'ready';

export default function OnboardingScreen() {
  const rawColorScheme = useColorScheme();
  const colorScheme = rawColorScheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[colorScheme];
  const { setUser, completeOnboarding, createMascot } = useDeclutter();

  const [currentSlide, setCurrentSlide] = useState(0);
  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [name, setName] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [mascotName, setMascotName] = useState('');
  const [selectedPersonality, setSelectedPersonality] = useState<MascotPersonality | null>(null);
  const [isGuest, setIsGuest] = useState(false);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      setStep('auth');
    }
  };

  const handleGuestMode = () => {
    setIsGuest(true);
    setName('Guest');
    setStep('info');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleSignInPlaceholder = (provider: 'google' | 'apple' | 'email') => {
    // Placeholder for future authentication
    Alert.alert(
      'Coming Soon',
      `${provider === 'google' ? 'Google' : provider === 'apple' ? 'Apple' : 'Email'} sign-in will be available when Firebase is configured. For now, continue as a guest or enter your name to get started!`,
      [
        { text: 'Continue as Guest', onPress: handleGuestMode },
        { text: 'Enter Name', onPress: () => setStep('info') },
      ]
    );
  };

  const handleInfoNext = async () => {
    if (!name.trim()) {
      Alert.alert('Name Required', 'Please enter your name to personalize your experience.');
      return;
    }

    // Save API key if provided
    if (apiKey.trim()) {
      await saveApiKey(apiKey.trim());
    }

    setStep('mascot');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleMascotNext = () => {
    if (!selectedPersonality) {
      Alert.alert('Choose a Buddy', 'Select a mascot personality to continue.');
      return;
    }

    const finalMascotName = mascotName.trim() || MASCOT_PERSONALITIES[selectedPersonality].name;
    createMascot(finalMascotName, selectedPersonality);

    setStep('ready');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleGetStarted = () => {
    // Create user profile
    setUser({
      id: `user-${Date.now()}`,
      name: name.trim() || 'Guest',
      createdAt: new Date(),
      onboardingComplete: true,
    });

    completeOnboarding();
    router.replace('/(tabs)');
  };

  const handleSkipMascot = () => {
    // Create default mascot
    createMascot('Buddy', 'spark');
    setStep('ready');
  };

  // Auth Selection Step
  if (step === 'auth') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={styles.authContainer}>
          <View style={styles.authHeader}>
            <RNText style={styles.authEmoji}>🏠</RNText>
            <RNText style={[styles.authTitle, { color: colors.text }]}>
              Get Started
            </RNText>
            <RNText style={[styles.authSubtitle, { color: colors.textSecondary }]}>
              Sign in to sync across devices, or continue as a guest
            </RNText>
          </View>

          {/* Auth Options */}
          <View style={styles.authOptions}>
            {/* Guest Mode - Primary */}
            <Pressable
              style={[styles.authButton, styles.guestButton, { borderColor: colors.primary }]}
              onPress={handleGuestMode}
            >
              <RNText style={styles.authButtonEmoji}>👤</RNText>
              <View style={styles.authButtonContent}>
                <RNText style={[styles.authButtonTitle, { color: colors.text }]}>
                  Continue as Guest
                </RNText>
                <RNText style={[styles.authButtonDesc, { color: colors.textSecondary }]}>
                  Start immediately, data saved locally
                </RNText>
              </View>
              <RNText style={[styles.authArrow, { color: colors.primary }]}>→</RNText>
            </Pressable>

            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              <RNText style={[styles.dividerText, { color: colors.textSecondary }]}>
                or sign in
              </RNText>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            </View>

            {/* Google Sign In */}
            <Pressable
              style={[styles.authButton, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => handleSignInPlaceholder('google')}
            >
              <RNText style={styles.authButtonEmoji}>🔵</RNText>
              <View style={styles.authButtonContent}>
                <RNText style={[styles.authButtonTitle, { color: colors.text }]}>
                  Continue with Google
                </RNText>
              </View>
            </Pressable>

            {/* Apple Sign In */}
            <Pressable
              style={[styles.authButton, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => handleSignInPlaceholder('apple')}
            >
              <RNText style={styles.authButtonEmoji}>🍎</RNText>
              <View style={styles.authButtonContent}>
                <RNText style={[styles.authButtonTitle, { color: colors.text }]}>
                  Continue with Apple
                </RNText>
              </View>
            </Pressable>

            {/* Email Sign In */}
            <Pressable
              style={[styles.authButton, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => handleSignInPlaceholder('email')}
            >
              <RNText style={styles.authButtonEmoji}>📧</RNText>
              <View style={styles.authButtonContent}>
                <RNText style={[styles.authButtonTitle, { color: colors.text }]}>
                  Sign in with Email
                </RNText>
              </View>
            </Pressable>
          </View>

          {/* Privacy Note */}
          <View style={styles.privacyNote}>
            <RNText style={[styles.privacyText, { color: colors.textSecondary }]}>
              By continuing, you agree to our Terms of Service and Privacy Policy.
              Your data is stored securely and never shared.
            </RNText>
          </View>

          {/* Back Button */}
          <Pressable onPress={() => setStep('welcome')} style={styles.backLink}>
            <RNText style={[styles.backLinkText, { color: colors.primary }]}>
              ← Back to intro
            </RNText>
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  // Setup Step: User Info
  if (step === 'info') {
    return (
      <Host style={styles.container}>
        <Form>
          <Section title="">
            <VStack spacing={24} alignment="center">
              <Text size={60}>👋</Text>
              <Text size={28} weight="bold">
                {isGuest ? "Quick Setup" : "Let's Get Started!"}
              </Text>
              <Text
                size={16}
                modifiers={[foregroundStyle(colors.textSecondary)]}
              >
                {isGuest
                  ? "You can add a name later. Let's keep it simple!"
                  : "Tell us your name to personalize your experience"
                }
              </Text>
            </VStack>
          </Section>

          <Section title="Your Name">
            <TextField
              placeholder="What should we call you?"
              defaultValue={isGuest ? '' : name}
              onChangeText={setName}
            />
            {isGuest && (
              <Text
                size={13}
                modifiers={[foregroundStyle(colors.textSecondary)]}
              >
                Optional - you can skip and use "Guest"
              </Text>
            )}
          </Section>

          <Section title="AI Setup (Optional)">
            <TextField
              placeholder="Gemini API key for AI features"
              defaultValue={apiKey}
              onChangeText={setApiKey}
            />
            <VStack spacing={8}>
              <Text
                size={13}
                modifiers={[foregroundStyle(colors.textSecondary)]}
              >
                The AI analyzes your photos and creates personalized cleaning tasks.
              </Text>
              <Button
                label="Get Free API Key →"
                onPress={() => Linking.openURL('https://ai.google.dev/')}
                modifiers={[buttonStyle('plain'), controlSize('small')]}
              />
            </VStack>
          </Section>

          <Section title="">
            <VStack spacing={12}>
              <Button
                label="Next: Choose Your Buddy!"
                onPress={handleInfoNext}
                modifiers={[
                  buttonStyle('borderedProminent'),
                  controlSize('large'),
                  frame({ maxWidth: 400 }),
                ]}
              />
              {isGuest && (
                <Button
                  label="Skip - Just call me Guest"
                  onPress={() => {
                    setName('Guest');
                    handleInfoNext();
                  }}
                  modifiers={[buttonStyle('plain')]}
                />
              )}
            </VStack>
          </Section>
        </Form>
      </Host>
    );
  }

  // Setup Step: Mascot Selection
  if (step === 'mascot') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={styles.mascotContainer}>
          <View style={styles.mascotHeader}>
            <RNText style={[styles.mascotTitle, { color: colors.text }]}>
              Choose Your Buddy!
            </RNText>
            <RNText style={[styles.mascotSubtitle, { color: colors.textSecondary }]}>
              Your cleaning companion will cheer you on and celebrate your wins
            </RNText>
          </View>

          {/* Personality Selection */}
          <View style={styles.personalityGrid}>
            {(Object.keys(MASCOT_PERSONALITIES) as MascotPersonality[]).map(personality => {
              const info = MASCOT_PERSONALITIES[personality];
              const isSelected = selectedPersonality === personality;

              return (
                <Pressable
                  key={personality}
                  onPress={() => {
                    setSelectedPersonality(personality);
                    Haptics.selectionAsync();
                  }}
                  style={[
                    styles.personalityCard,
                    {
                      backgroundColor: isSelected ? info.color + '30' : colors.card,
                      borderColor: isSelected ? info.color : colors.border,
                      borderWidth: isSelected ? 3 : 1,
                    },
                  ]}
                >
                  <RNText style={styles.personalityEmoji}>{info.emoji}</RNText>
                  <RNText style={[styles.personalityName, { color: colors.text }]}>
                    {info.name}
                  </RNText>
                  <RNText style={[styles.personalityDesc, { color: colors.textSecondary }]}>
                    {info.description}
                  </RNText>
                  {isSelected && (
                    <View style={[styles.selectedBadge, { backgroundColor: info.color }]}>
                      <RNText style={styles.selectedText}>Selected!</RNText>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>

          {/* Mascot Name Input */}
          {selectedPersonality && (
            <View style={styles.nameInputContainer}>
              <RNText style={[styles.nameLabel, { color: colors.text }]}>
                Name your buddy:
              </RNText>
              <View style={[styles.nameInput, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <RNText style={styles.nameEmoji}>
                  {MASCOT_PERSONALITIES[selectedPersonality].emoji}
                </RNText>
                <RNText
                  style={[styles.nameInputText, { color: colors.text }]}
                  numberOfLines={1}
                >
                  {mascotName || 'Enter a name...'}
                </RNText>
              </View>
              <Host>
                <TextField
                  placeholder="Give your buddy a name"
                  defaultValue={mascotName}
                  onChangeText={setMascotName}
                />
              </Host>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.mascotButtons}>
            <Pressable
              style={[
                styles.primaryButton,
                {
                  backgroundColor: selectedPersonality && mascotName.trim()
                    ? colors.primary
                    : colors.border,
                },
              ]}
              onPress={handleMascotNext}
              disabled={!selectedPersonality || !mascotName.trim()}
            >
              <RNText style={styles.primaryButtonText}>
                Continue with {mascotName || 'Buddy'}!
              </RNText>
            </Pressable>

            <Pressable onPress={handleSkipMascot} style={styles.skipButton}>
              <RNText style={[styles.skipText, { color: colors.textSecondary }]}>
                Skip for now
              </RNText>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    );
  }

  // Setup Step: Ready to Go
  if (step === 'ready') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.readyContainer}>
          <RNText style={styles.readyEmoji}>🎉</RNText>
          <RNText style={[styles.readyTitle, { color: colors.text }]}>
            You're All Set, {name}!
          </RNText>
          {selectedPersonality && mascotName && (
            <View style={styles.mascotPreview}>
              <RNText style={styles.previewEmoji}>
                {MASCOT_PERSONALITIES[selectedPersonality].emoji}
              </RNText>
              <RNText style={[styles.previewText, { color: colors.textSecondary }]}>
                {mascotName} is excited to help you declutter!
              </RNText>
            </View>
          )}
          <RNText style={[styles.readySubtitle, { color: colors.textSecondary }]}>
            Time to transform your space into a calm, organized haven.
          </RNText>

          <View style={styles.featureList}>
            <FeatureItem emoji="📸" text="Snap photos of messy spaces" colors={colors} />
            <FeatureItem emoji="🤖" text="Get AI-powered task lists" colors={colors} />
            <FeatureItem emoji="✅" text="Complete small, easy tasks" colors={colors} />
            <FeatureItem emoji="🎮" text="Collect items & earn XP" colors={colors} />
            <FeatureItem emoji="🏆" text="Level up & unlock badges" colors={colors} />
          </View>

          <Pressable
            style={[styles.startButton, { backgroundColor: colors.primary }]}
            onPress={handleGetStarted}
          >
            <RNText style={styles.startButtonText}>Start Decluttering!</RNText>
          </Pressable>
        </View>
      </View>
    );
  }

  // Intro Slides
  const slide = slides[currentSlide];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Host style={styles.host}>
        <VStack spacing={32} alignment="center">
          <Spacer />

          {/* Emoji/Icon */}
          <Text size={80}>{slide.emoji}</Text>

          {/* Title */}
          <VStack spacing={8} alignment="center">
            <Text size={28} weight="bold">
              {slide.title}
            </Text>
            <Text
              size={18}
              modifiers={[foregroundStyle(colors.primary)]}
              weight="semibold"
            >
              {slide.subtitle}
            </Text>
          </VStack>

          {/* Description */}
          <Text
            size={16}
            modifiers={[
              foregroundStyle(colors.textSecondary),
              frame({ maxWidth: 300 }),
            ]}
          >
            {slide.description}
          </Text>

          <Spacer />

          {/* Pagination dots */}
          <HStack spacing={8}>
            {slides.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  {
                    backgroundColor:
                      index === currentSlide ? colors.primary : colors.border,
                  },
                ]}
              />
            ))}
          </HStack>

          {/* Buttons */}
          <VStack spacing={12}>
            <Button
              label={currentSlide === slides.length - 1 ? "Let's Go!" : 'Next'}
              onPress={handleNext}
              modifiers={[
                buttonStyle('borderedProminent'),
                controlSize('large'),
                frame({ width: 200 }),
              ]}
            />

            {currentSlide > 0 && (
              <Button
                label="Back"
                onPress={() => setCurrentSlide(currentSlide - 1)}
                modifiers={[
                  buttonStyle('plain'),
                  controlSize('regular'),
                ]}
              />
            )}

            {currentSlide === 0 && (
              <Button
                label="Skip"
                onPress={() => setShowSetup(true)}
                modifiers={[
                  buttonStyle('plain'),
                  foregroundStyle(colors.textSecondary),
                ]}
              />
            )}
          </VStack>

          <Spacer />
        </VStack>
      </Host>
    </View>
  );
}

function FeatureItem({ emoji, text, colors }: { emoji: string; text: string; colors: any }) {
  return (
    <View style={styles.featureItem}>
      <RNText style={styles.featureEmoji}>{emoji}</RNText>
      <RNText style={[styles.featureText, { color: colors.text }]}>{text}</RNText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  host: {
    flex: 1,
    paddingHorizontal: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  // Auth Screen Styles
  authContainer: {
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 40,
  },
  authHeader: {
    alignItems: 'center',
    marginBottom: 40,
  },
  authEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  authTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  authSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  authOptions: {
    gap: 12,
    marginBottom: 32,
  },
  authButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  guestButton: {
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    borderWidth: 2,
  },
  authButtonEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  authButtonContent: {
    flex: 1,
  },
  authButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  authButtonDesc: {
    fontSize: 13,
    marginTop: 2,
  },
  authArrow: {
    fontSize: 20,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 13,
    marginHorizontal: 16,
  },
  privacyNote: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  privacyText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  backLink: {
    alignItems: 'center',
    padding: 12,
  },
  backLinkText: {
    fontSize: 15,
    fontWeight: '500',
  },
  // Mascot Screen Styles
  mascotContainer: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  mascotHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  mascotTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  mascotSubtitle: {
    fontSize: 15,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 20,
  },
  personalityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 24,
  },
  personalityCard: {
    width: (width - 52) / 2,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  personalityEmoji: {
    fontSize: 48,
  },
  personalityName: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 8,
  },
  personalityDesc: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  selectedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  selectedText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  nameInputContainer: {
    marginBottom: 24,
  },
  nameLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  nameInput: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  nameEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  nameInputText: {
    fontSize: 16,
  },
  mascotButtons: {
    alignItems: 'center',
    gap: 12,
  },
  primaryButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  skipButton: {
    padding: 12,
  },
  skipText: {
    fontSize: 15,
  },
  readyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  readyEmoji: {
    fontSize: 80,
  },
  readyTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginTop: 16,
    textAlign: 'center',
  },
  mascotPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 20,
  },
  previewEmoji: {
    fontSize: 24,
    marginRight: 8,
  },
  previewText: {
    fontSize: 14,
  },
  readySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 12,
    paddingHorizontal: 20,
  },
  featureList: {
    marginTop: 32,
    gap: 12,
    width: '100%',
    maxWidth: 300,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureEmoji: {
    fontSize: 20,
    marginRight: 12,
    width: 30,
    textAlign: 'center',
  },
  featureText: {
    fontSize: 15,
  },
  startButton: {
    marginTop: 32,
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 30,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
