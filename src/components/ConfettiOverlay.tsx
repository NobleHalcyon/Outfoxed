import React from "react";
import { StyleSheet, View } from "react-native";
import ConfettiCannon from "react-native-confetti-cannon";

interface ConfettiOverlayProps {
  visible: boolean;
}

export default function ConfettiOverlay({ visible }: ConfettiOverlayProps): React.JSX.Element | null {
  if (!visible) {
    return null;
  }

  return (
    <View pointerEvents="none" style={styles.container}>
      <ConfettiCannon count={80} origin={{ x: 180, y: -20 }} autoStart fadeOut fallSpeed={2500} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
  },
});
