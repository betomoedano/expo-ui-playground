/**
 * Declutterly - Camera Screen
 * Capture photos of spaces for AI analysis
 */

import { Colors } from '@/constants/Colors';
import { useDeclutter } from '@/context/DeclutterContext';
import { ROOM_TYPE_INFO, RoomType } from '@/types/declutter';
import {
  Button,
  Form,
  Host,
  HStack,
  Section,
  Spacer,
  Text,
  VStack,
} from '@expo/ui/swift-ui';
import {
  buttonStyle,
  controlSize,
  foregroundStyle,
  frame,
  glassEffect,
} from '@expo/ui/swift-ui/modifiers';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  useColorScheme,
  View,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Pressable,
  Text as RNText,
} from 'react-native';

const { width, height } = Dimensions.get('window');

export default function CameraScreen() {
  const rawColorScheme = useColorScheme();
  const colorScheme = rawColorScheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[colorScheme];
  const { activeRoomId, rooms, addRoom, addPhotoToRoom, setActiveRoom } = useDeclutter();
  const cameraRef = useRef<CameraView>(null);

  const [permission, requestPermission] = useCameraPermissions();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [showRoomSelector, setShowRoomSelector] = useState(false);
  const [selectedRoomType, setSelectedRoomType] = useState<RoomType | null>(null);

  const activeRoom = activeRoomId ? rooms.find(r => r.id === activeRoomId) : null;

  // Handle permission
  if (!permission) {
    return (
      <Host style={styles.container}>
        <VStack spacing={16} alignment="center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text>Loading camera...</Text>
        </VStack>
      </Host>
    );
  }

  if (!permission.granted) {
    return (
      <Host style={styles.container}>
        <Form>
          <Section title="">
            <VStack spacing={24} alignment="center">
              <Text size={48}>📸</Text>
              <Text size={20} weight="bold">Camera Access Needed</Text>
              <Text
                size={14}
                modifiers={[foregroundStyle(colors.textSecondary)]}
              >
                We need camera access to capture photos of your spaces for AI analysis.
              </Text>
              <Button
                label="Grant Permission"
                onPress={requestPermission}
                modifiers={[buttonStyle('borderedProminent'), controlSize('large')]}
              />
              <Button
                label="Go Back"
                onPress={() => router.back()}
                modifiers={[buttonStyle('plain')]}
              />
            </VStack>
          </Section>
        </Form>
      </Host>
    );
  }

  const takePicture = async () => {
    if (!cameraRef.current || isCapturing) return;

    try {
      setIsCapturing(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });

      if (photo?.uri) {
        setCapturedImage(photo.uri);
      }
    } catch (error) {
      console.error('Error taking picture:', error);
    } finally {
      setIsCapturing(false);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
      });

      if (!result.canceled && result.assets[0]) {
        setCapturedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setShowRoomSelector(false);
    setSelectedRoomType(null);
  };

  const handleAnalyze = async () => {
    if (!capturedImage) return;

    let roomId = activeRoomId;

    // If no active room, show room selector
    if (!roomId) {
      if (!selectedRoomType) {
        setShowRoomSelector(true);
        return;
      }

      // Create new room
      const info = ROOM_TYPE_INFO[selectedRoomType];
      const newRoom = addRoom({
        name: info.label,
        type: selectedRoomType,
        emoji: info.emoji,
        messLevel: 0,
      });
      roomId = newRoom.id;
      setActiveRoom(roomId);
    }

    // Add photo to room
    const photoType = activeRoom && activeRoom.photos.length > 0
      ? (activeRoom.currentProgress > 0 ? 'progress' : 'after')
      : 'before';

    addPhotoToRoom(roomId!, {
      uri: capturedImage,
      timestamp: new Date(),
      type: photoType,
    });

    // Navigate to analysis
    router.replace({
      pathname: '/analysis',
      params: { roomId, imageUri: capturedImage },
    });
  };

  const selectRoomType = (type: RoomType) => {
    setSelectedRoomType(type);
    setShowRoomSelector(false);
    // Immediately proceed with analysis
    setTimeout(() => handleAnalyze(), 100);
  };

  // Room selector view
  if (showRoomSelector && capturedImage) {
    return (
      <Host style={styles.container}>
        <Form>
          <Section title="">
            <Button
              label="← Back"
              onPress={() => setShowRoomSelector(false)}
              modifiers={[buttonStyle('plain')]}
            />
          </Section>

          <Section title="What type of space is this?">
            <VStack spacing={12}>
              {(Object.keys(ROOM_TYPE_INFO) as RoomType[]).map(type => (
                <Button
                  key={type}
                  label={`${ROOM_TYPE_INFO[type].emoji} ${ROOM_TYPE_INFO[type].label}`}
                  onPress={() => selectRoomType(type)}
                  modifiers={[
                    buttonStyle('bordered'),
                    controlSize('large'),
                    frame({ maxWidth: 400 }),
                  ]}
                />
              ))}
            </VStack>
          </Section>
        </Form>
      </Host>
    );
  }

  // Preview captured image
  if (capturedImage) {
    return (
      <View style={styles.container}>
        <View style={styles.preview}>
          <View style={styles.previewImage}>
            {/* Using a simple View as placeholder since Image from expo-image might not render full-screen well */}
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: colors.card },
              ]}
            >
              {/* Preview would show here */}
              <View style={styles.previewContent}>
                <RNText
                  style={{
                    color: colors.text,
                    fontSize: 48,
                    textAlign: 'center',
                  }}
                >
                  📸
                </RNText>
                <RNText
                  style={{
                    color: colors.text,
                    fontSize: 18,
                    textAlign: 'center',
                    marginTop: 16,
                  }}
                >
                  Photo captured!
                </RNText>
              </View>
            </View>
          </View>

          {/* Controls */}
          <View style={[styles.previewControls, { backgroundColor: colors.card }]}>
            <Host style={{ flex: 1 }}>
              <HStack spacing={16}>
                <Button
                  label="Retake"
                  onPress={handleRetake}
                  modifiers={[buttonStyle('bordered'), controlSize('large')]}
                />
                <Spacer />
                <Button
                  label="✨ Analyze"
                  onPress={handleAnalyze}
                  modifiers={[buttonStyle('borderedProminent'), controlSize('large')]}
                />
              </HStack>

              {activeRoom && (
                <Text
                  size={14}
                  modifiers={[foregroundStyle(colors.textSecondary)]}
                >
                  Adding to: {activeRoom.emoji} {activeRoom.name}
                </Text>
              )}
            </Host>
          </View>
        </View>
      </View>
    );
  }

  // Camera view
  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <RNText style={{ color: 'white', fontSize: 18 }}>✕</RNText>
          </Pressable>

          {activeRoom && (
            <View style={styles.roomBadge}>
              <RNText style={{ color: 'white', fontSize: 14 }}>
                {activeRoom.emoji} {activeRoom.name}
              </RNText>
            </View>
          )}
        </View>

        {/* Guide overlay */}
        <View style={styles.guideOverlay}>
          <View style={[styles.cornerTL, styles.corner]} />
          <View style={[styles.cornerTR, styles.corner]} />
          <View style={[styles.cornerBL, styles.corner]} />
          <View style={[styles.cornerBR, styles.corner]} />

          <RNText style={styles.guideText}>
            Position the room in frame
          </RNText>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          {/* Gallery button */}
          <Pressable onPress={pickImage} style={styles.sideButton}>
            <RNText style={{ fontSize: 24 }}>🖼️</RNText>
          </Pressable>

          {/* Capture button */}
          <Pressable
            onPress={takePicture}
            disabled={isCapturing}
            style={[
              styles.captureButton,
              isCapturing && { opacity: 0.5 },
            ]}
          >
            <View style={styles.captureButtonInner} />
          </Pressable>

          {/* Placeholder for symmetry */}
          <View style={styles.sideButton} />
        </View>

        {/* Tips */}
        <View style={styles.tips}>
          <RNText style={styles.tipText}>
            💡 Tip: Capture the whole area for best results
          </RNText>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roomBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  guideOverlay: {
    flex: 1,
    margin: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 12,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 12,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 12,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 12,
  },
  guideText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    textAlign: 'center',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 40,
    paddingHorizontal: 40,
  },
  sideButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'white',
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'white',
  },
  tips: {
    position: 'absolute',
    bottom: 120,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  tipText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  preview: {
    flex: 1,
  },
  previewImage: {
    flex: 1,
  },
  previewContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewControls: {
    padding: 20,
    paddingBottom: 40,
  },
});
