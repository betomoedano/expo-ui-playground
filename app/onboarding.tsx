/**
 * Declutterly - Onboarding Screen
 * Welcome flow for new users
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
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { useColorScheme, View, StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

// Onboarding slides content
const slides = [
  {
    title: 'Welcome to Declutterly',
    subtitle: 'Your AI-powered cleaning companion',
    description: 'Take control of your space with small, achievable steps. Perfect for busy minds!',
    emoji: '✨',
  },
  {
    title: 'Snap a Photo',
    subtitle: 'Show us your space',
    description: 'Take a picture of any room or area that needs attention. No judgment here!',
    emoji: '📸',
  },
  {
    title: 'Get Your Plan',
    subtitle: 'AI breaks it down',
    description: 'Our AI creates a personalized task list with small, manageable steps and time estimates.',
    emoji: '📋',
  },
  {
    title: 'Track Progress',
    subtitle: 'Celebrate every win',
    description: 'Check off tasks, earn badges, and see your space transform. You\'ve got this!',
    emoji: '🏆',
  },
];

export default function OnboardingScreen() {
  const rawColorScheme = useColorScheme();
  const colorScheme = rawColorScheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[colorScheme];
  const { setUser, completeOnboarding } = useDeclutter();

  const [currentSlide, setCurrentSlide] = useState(0);
  const [name, setName] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [showSetup, setShowSetup] = useState(false);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      setShowSetup(true);
    }
  };

  const handleGetStarted = async () => {
    if (!name.trim()) return;

    // Save API key if provided
    if (apiKey.trim()) {
      await saveApiKey(apiKey.trim());
    }

    // Create user profile
    setUser({
      id: `user-${Date.now()}`,
      name: name.trim(),
      createdAt: new Date(),
      onboardingComplete: true,
    });

    completeOnboarding();
    router.replace('/(tabs)');
  };

  if (showSetup) {
    return (
      <Host style={styles.container}>
        <Form>
          <Section title="">
            <VStack spacing={24} alignment="center">
              <Text size={60}>👋</Text>
              <Text size={28} weight="bold">Let's Get Started!</Text>
              <Text
                size={16}
                modifiers={[foregroundStyle(colors.textSecondary)]}
              >
                Tell us your name to personalize your experience
              </Text>
            </VStack>
          </Section>

          <Section title="Your Info">
            <TextField
              placeholder="What should we call you?"
              defaultValue={name}
              onChangeText={setName}
            />
          </Section>

          <Section title="AI Setup (Optional)">
            <TextField
              placeholder="Enter your API key for AI features"
              defaultValue={apiKey}
              onChangeText={setApiKey}
            />
            <Text
              size={13}
              modifiers={[foregroundStyle(colors.textSecondary)]}
            >
              Get a free API key at ai.google.dev. Without it, you'll get sample tasks.
            </Text>
          </Section>

          <Section title="">
            <VStack spacing={12}>
              <Button
                label="Start Decluttering!"
                onPress={handleGetStarted}
                modifiers={[
                  buttonStyle('borderedProminent'),
                  controlSize('large'),
                  frame({ maxWidth: 400 }),
                ]}
              />
              {!name.trim() && (
                <Text
                  size={13}
                  modifiers={[foregroundStyle(colors.warning)]}
                >
                  Please enter your name to continue
                </Text>
              )}
            </VStack>
          </Section>
        </Form>
      </Host>
    );
  }

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
});
