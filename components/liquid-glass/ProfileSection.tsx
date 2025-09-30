import {
  Button,
  ColorPicker,
  DisclosureGroup,
  Image as ExpoUIImage,
  Group,
  HStack,
  Image,
  LabeledContent,
  Picker,
  Section,
  Spacer,
  Switch,
  Text,
  VStack,
} from "@expo/ui/swift-ui";
import {
  background,
  clipShape,
  cornerRadius,
  foregroundStyle,
  frame,
  glassEffect,
} from "@expo/ui/swift-ui/modifiers";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Image as ExpoImage } from "expo-image";
import { Link } from "expo-router";
import React, { use, useState } from "react";
import { AppContext } from "./AppContext";
import { AppState } from "./types";

export function ProfileSection() {
  const { profile, updateProfile } = use(AppContext) as AppState;
  const [profileExpanded, setProfileExpanded] = useState(false);
  const [isAirplaneMode, setIsAirplaneMode] = useState(false);

  const profileSizes = ["small", "medium", "large"];
  const profileSizeIndex = profileSizes.indexOf(profile.profileImageSize);

  const imageSize =
    profile.profileImageSize === "large"
      ? 80
      : profile.profileImageSize === "medium"
      ? 60
      : 40;

  return (
    <>
      <Section title="👤 User Profile">
        <HStack spacing={16}>
          <HStack
            modifiers={[
              frame({ width: imageSize, height: imageSize }),
              cornerRadius(100),
            ]}
          >
            <ExpoImage
              source={{ uri: "https://github.com/betomoedano.png" }}
              style={{ width: imageSize, height: imageSize }}
              contentFit="fill"
            />
          </HStack>

          <VStack alignment="leading">
            <Text
              modifiers={[foregroundStyle(profile.theme)]}
              color={profile.theme}
              size={22}
              weight="bold"
            >
              {profile.name}
            </Text>
            <Text modifiers={[foregroundStyle("gray")]}>
              {profile.username}
            </Text>
          </VStack>
        </HStack>

        <HStack spacing={8}>
          <ExpoUIImage
            systemName="airplane"
            color="white"
            size={18}
            modifiers={[
              frame({ width: 28, height: 28 }),
              background("#ffa500"),
              clipShape("roundedRectangle"),
            ]}
          />
          <Text>Airplane Mode</Text>
          <Spacer />
          <Switch value={isAirplaneMode} onValueChange={setIsAirplaneMode} />
        </HStack>

        <LabeledContent label="Bottom Sheet">
          <Link href="/home/sheet" asChild>
            <Button
              variant={
                isLiquidGlassAvailable() ? "glassProminent" : "borderless"
              }
            >
              Open
            </Button>
          </Link>
        </LabeledContent>

        <LabeledContent label="Mini Button">
          <Button
            controlSize="mini"
            variant={isLiquidGlassAvailable() ? "glassProminent" : "borderless"}
          >
            Mini Button
          </Button>
        </LabeledContent>
        <LabeledContent label="Small Button">
          <Button
            controlSize="small"
            variant={isLiquidGlassAvailable() ? "glassProminent" : "borderless"}
          >
            Small Button
          </Button>
        </LabeledContent>
        <LabeledContent label="Regular Button">
          <Button
            controlSize="regular"
            variant={isLiquidGlassAvailable() ? "glassProminent" : "borderless"}
          >
            Regular Button
          </Button>
        </LabeledContent>
        <LabeledContent label="Large Button">
          <Button
            controlSize="large"
            variant={isLiquidGlassAvailable() ? "glassProminent" : "borderless"}
          >
            Large Button
          </Button>
        </LabeledContent>

        {isLiquidGlassAvailable() && (
          <LabeledContent label="Glass Prominent Button">
            <Button
              variant="glassProminent"
              color="red"
              modifiers={[foregroundStyle({ type: "color", color: "white" })]}
            >
              Prominent
            </Button>
          </LabeledContent>
        )}
        {isLiquidGlassAvailable() && (
          <LabeledContent label="Glass Prominent Button">
            <Button
              variant="glassProminent"
              color="orange"
              modifiers={[foregroundStyle({ type: "color", color: "white" })]}
            >
              Orange
            </Button>
          </LabeledContent>
        )}

        <DisclosureGroup
          onStateChange={setProfileExpanded}
          isExpanded={profileExpanded}
          label="Profile Settings"
        >
          <Picker
            label="Profile Image Size"
            options={profileSizes}
            selectedIndex={profileSizeIndex}
            onOptionSelected={({ nativeEvent: { index } }) => {
              updateProfile({
                profileImageSize: profileSizes[index] as
                  | "small"
                  | "medium"
                  | "large",
              });
            }}
            variant="menu"
          />

          <ColorPicker
            label="Theme Color"
            selection={profile.theme}
            supportsOpacity={false}
            onValueChanged={(color) => updateProfile({ theme: color })}
          />
        </DisclosureGroup>
      </Section>

      <Group
        modifiers={[
          glassEffect({ glass: { variant: "regular", interactive: true } }),
          frame({ width: 100, height: 100 }),
        ]}
      >
        <Image
          systemName="applelogo"
          // onPress={() => alert("This is an image")}
          size={50}
        />
      </Group>
      <Button variant="borderless" onPress={() => alert("This is a button")}>
        Borderless button
      </Button>
    </>
  );
}
