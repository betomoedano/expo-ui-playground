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
  buttonStyle,
  clipShape,
  controlSize,
  cornerRadius,
  foregroundStyle,
  frame,
  glassEffect,
  shapes,
  tint,
} from "@expo/ui/swift-ui/modifiers";
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
          <Text modifiers={[foregroundStyle("gray")]}>{profile.username}</Text>
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
            label="Open"
            modifiers={[
              glassEffect({
                glass: { variant: "regular", interactive: true },
              }),
              buttonStyle("glassProminent"),
            ]}
          />
        </Link>
      </LabeledContent>

      <LabeledContent label="Mini Button">
        <Button
          label="Mini Button"
          modifiers={[buttonStyle("bordered"), controlSize("mini")]}
        />
      </LabeledContent>
      <LabeledContent label="Small Button">
        <Button
          label="Small Button"
          modifiers={[buttonStyle("bordered"), controlSize("small")]}
        />
      </LabeledContent>
      <LabeledContent label="Regular Button">
        <Button
          label="Regular Button"
          modifiers={[buttonStyle("bordered"), controlSize("regular")]}
        />
      </LabeledContent>
      <LabeledContent label="Large Button">
        <Button
          label="Large Button"
          modifiers={[
            buttonStyle("bordered"),
            controlSize("large"),
            foregroundStyle("black"),
            background("white", shapes.roundedRectangle({ cornerRadius: 10 })),
          ]}
        />
      </LabeledContent>

      <LabeledContent label="Glass Prominent">
        <Button
          label="Help & Support"
          modifiers={[
            buttonStyle("glassProminent"),
            controlSize("large"),
            tint("black"),
            foregroundStyle("white"),
          ]}
        />
      </LabeledContent>

      <DisclosureGroup
        onStateChange={setProfileExpanded}
        isExpanded={profileExpanded}
        label="Profile Settings"
      >
        <Picker
          label="Profile Image Size"
          selection={profileSizes[profileSizeIndex]}
          onSelectionChange={(selection) => {
            updateProfile({
              profileImageSize: selection as "small" | "medium" | "large",
            });
          }}
        />

        <ColorPicker
          label="Theme Color"
          selection={profile.theme}
          supportsOpacity={false}
          onValueChanged={(color) => updateProfile({ theme: color })}
        />
      </DisclosureGroup>

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
    </Section>
  );
}
