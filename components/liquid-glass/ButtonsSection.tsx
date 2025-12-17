import { Button, Section, VStack } from "@expo/ui/swift-ui";
import React from "react";

export function ButtonsSection() {
  return (
    <Section title="🔘 Buttons">
      <VStack spacing={12}>
        <Button label="Default" />
        {/* <Button variant="bordered">Bordered</Button>
        <Button variant="plain">Plain</Button>
        <Button variant="glass">Glass</Button>
        <Button variant="glassProminent">Glass Prominent</Button>
        <Button variant="borderedProminent">Bordered Prominent</Button>
        <Button variant="borderless">Borderless</Button> */}
      </VStack>
    </Section>
  );
}
