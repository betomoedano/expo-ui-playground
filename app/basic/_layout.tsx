import { Stack } from "expo-router";

export default function HomeLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: "Basic Usage",
          headerSearchBarOptions: {
            onChangeText: (event) => {
              console.log(event.nativeEvent.text);
            },
          },
        }}
      />
    </Stack>
  );
}
