import React from "react";
import { StyleSheet, View } from "react-native";
import { RoundOption } from "../game/types";
import QuadrantCard from "./QuadrantCard";

interface QuadrantGridProps {
  options: RoundOption[];
  disabled: boolean;
  wiggleTokens: Record<string, number>;
  tileSize: number;
  onSelect: (option: RoundOption) => void;
}

export default function QuadrantGrid({
  options,
  disabled,
  wiggleTokens,
  tileSize,
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
          size={tileSize}
          onPress={onSelect}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignContent: "space-between",
  },
});
