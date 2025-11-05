import { Button, Host, Label } from "@expo/ui/swift-ui";
import {
  background,
  foregroundStyle,
  padding,
} from "@expo/ui/swift-ui/modifiers";
import { Link } from "expo-router";
import { ScrollView } from "react-native";
import NormalView from "../NormalView";

export default function BasicUsageVideo() {
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: 16 }}
    >
      <Link href="/home/sheet" style={{ marginBottom: 30 }}>
        Go to Sheet
      </Link>

      <NormalView />

      <Host matchContents>
        <Button>
          <Label
            title="title"
            systemImage="gear"
            modifiers={[
              foregroundStyle({ type: "color", color: "black" }),
              padding({ all: 12 }),
              background("yellow"),
            ]}
          />
        </Button>
      </Host>
    </ScrollView>
  );
}
