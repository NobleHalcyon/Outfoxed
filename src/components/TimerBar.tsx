import React from "react";
import { StyleSheet, View } from "react-native";

interface TimerBarProps {
  progress: number;
}

export default function TimerBar({ progress }: TimerBarProps): React.JSX.Element {
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${Math.max(0, Math.min(1, progress)) * 100}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 6,
    width: "100%",
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "#D6E3EE",
  },
  fill: {
    height: "100%",
    backgroundColor: "#1A4D9C",
  },
});
