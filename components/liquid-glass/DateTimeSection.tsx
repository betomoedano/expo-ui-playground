import { DatePicker, Picker, Section, Text } from "@expo/ui/swift-ui";
import { cornerRadius, frame } from "@expo/ui/swift-ui/modifiers";
import React, { use, useState } from "react";
import { AppContext } from "./AppContext";
import { AppState } from "./types";

export function DateTimeSection() {
  const { selectedDate, setSelectedDate } = use(AppContext) as AppState;
  const [pickerType, setPickerType] = useState(0);
  const [displayStyle, setDisplayStyle] = useState(0);

  const displayOptions = ["compact", "graphical", "wheel"];
  const typeOptions = ["date", "hourAndMinute", "dateAndTime"];

  return (
    <Section title="📅 Date & Time Management">
      <Text
        size={16}
      >{`Current Selection: ${selectedDate.toLocaleString()}`}</Text>

      <Picker
        label="Display Style"
        selection={displayOptions[displayStyle]}
        onSelectionChange={(selection) => {
          setDisplayStyle(
            displayOptions.indexOf(
              selection as "compact" | "graphical" | "wheel"
            )
          );
        }}
      />

      <Picker
        label="Picker Type"
        selection={typeOptions[pickerType]}
        onSelectionChange={(selection) => {
          setPickerType(
            typeOptions.indexOf(
              selection as "date" | "hourAndMinute" | "dateAndTime"
            )
          );
        }}
      />

      <DatePicker
        onDateChange={(date) => {
          setSelectedDate(date);
        }}
        selection={selectedDate}
        modifiers={[frame({ width: 300 }), cornerRadius(10)]}
      />
    </Section>
  );
}
