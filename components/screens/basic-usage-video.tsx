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
    </ScrollView>
  );
}
