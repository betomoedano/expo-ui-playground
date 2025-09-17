import { ScrollView, Text } from "react-native";

export default function SheetScreen() {
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{
        padding: 16,
        paddingTop: 40,
        paddingBottom: 100,
      }}
    >
      <Text style={{ fontSize: 24, fontWeight: "bold" }}>Sheet Screen</Text>
      {dummyData.map((item, index) => (
        <Text
          style={{ fontSize: 24, fontWeight: "bold", marginVertical: 8 }}
          key={index}
        >
          {item}
        </Text>
      ))}
    </ScrollView>
  );
}

const dummyData = [
  "🎮 Gaming Setup",
  "📱 iPhone 15 Pro",
  "💻 MacBook Pro",
  "🎧 AirPods Max",
  "⌚️ Apple Watch",
  "📸 Canon EOS R5",
  "🎤 Shure SM7B Mic",
  "🖥️ Studio Display",
  "⌨️ Magic Keyboard",
  "🖱️ Magic Trackpad",
  "📱 iPad Pro",
  "🎮 PS5",
  "🕹️ Nintendo Switch",
  "📺 LG OLED TV",
  "🔊 HomePod",
];
