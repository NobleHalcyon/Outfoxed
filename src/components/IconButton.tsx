import { Octicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useMemo, useRef } from "react";
import { Animated, Pressable, StyleProp, StyleSheet, TextStyle, View, ViewStyle } from "react-native";
import { useAudioManager } from "../audio/AudioManager";
import AppText from "./AppText";

type OcticonName = React.ComponentProps<typeof Octicons>["name"];
type ButtonSize = "small" | "large";

interface IconButtonProps {
  icon?: OcticonName;
  label?: string;
  size?: ButtonSize;
  onPress?: () => void;
  disabled?: boolean;
  iconColor?: string;
  textColor?: string;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  iconSize?: number;
  layout?: "horizontal" | "vertical";
  haptic?: "none" | "light" | "success" | "error";
  playPop?: boolean;
  children?: React.ReactNode;
}

export default function IconButton({
  icon,
  label,
  size = "small",
  onPress,
  disabled = false,
  iconColor = "#1A4D9C",
  textColor = "#1A4D9C",
  style,
  labelStyle,
  iconSize,
  layout,
  haptic = "none",
  playPop = true,
  children,
}: IconButtonProps): React.JSX.Element {
  const scale = useRef(new Animated.Value(1)).current;
  const { playUiPop } = useAudioManager();
  const resolvedLayout = layout ?? (size === "large" ? "vertical" : "horizontal");

  const triggerFeedback = (): void => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.95, duration: 70, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, speed: 18, bounciness: 9, useNativeDriver: true }),
    ]).start();

    if (playPop) {
      playUiPop();
    }

    if (haptic === "light") {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (haptic === "success") {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    if (haptic === "error") {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  };

  const resolvedIconSize = useMemo(() => {
    if (iconSize) {
      return iconSize;
    }
    return size === "large" ? 40 : 24;
  }, [iconSize, size]);

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <Pressable
        onPressIn={triggerFeedback}
        onPress={() => {
          if (disabled) {
            return;
          }
          onPress?.();
        }}
        style={({ pressed }) => [
          styles.base,
          size === "large" ? styles.large : styles.small,
          resolvedLayout === "vertical" ? styles.vertical : styles.horizontal,
          disabled && styles.disabled,
          pressed && styles.pressed,
        ]}
      >
        {children ? (
          children
        ) : (
          <View style={[styles.labelRow, resolvedLayout === "vertical" ? styles.vertical : styles.horizontal]}>
            {icon ? <Octicons name={icon} size={resolvedIconSize} color={iconColor} /> : null}
            {label ? (
              <AppText
                weight="semibold"
                style={[
                  styles.label,
                  { color: textColor },
                  resolvedLayout === "vertical" ? styles.labelVertical : styles.labelHorizontal,
                  labelStyle,
                ]}
              >
                {label}
              </AppText>
            ) : null}
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#BFD0E3",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  small: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  large: {
    paddingHorizontal: 14,
    paddingVertical: 16,
  },
  horizontal: {
    flexDirection: "row",
  },
  vertical: {
    flexDirection: "column",
  },
  labelRow: {
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 16,
  },
  labelHorizontal: {
    marginLeft: 8,
  },
  labelVertical: {
    marginTop: 8,
    marginLeft: 0,
    textAlign: "center",
  },
  pressed: {
    opacity: 0.92,
  },
  disabled: {
    opacity: 0.55,
  },
});
