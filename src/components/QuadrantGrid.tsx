import React from "react";
import { StyleSheet, View } from "react-native";
import { RoundOption } from "../game/types";
import QuadrantCard from "./QuadrantCard";

interface QuadrantGridProps {
  options: RoundOption[];
  disabled: boolean;
  wiggleTokens: Record<string, number>;
  onSelect: (option: RoundOption) => void;
}

export default function QuadrantGrid({
  options,
  disabled,
  wiggleTokens,
  onSelect,
}: QuadrantGridProps): React.JSX.Element {
  return (
    <View style={styles.grid}>
      {options.map((option) => (
        <QuadrantCard
          key={option.optionKey}
          option={option}
          disabled={disabled}
          wiggleToken={wiggleTokens[option.optionKey] ?? 0}
          onPress={onSelect}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    width: "100%",
    height: "100%",
    alignContent: "space-between",
  },
});
