import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, Pressable, StyleSheet, View } from "react-native";
import Svg, { Circle, Ellipse, Polygon, Rect } from "react-native-svg";

interface NixFoxProps {
  size?: number;
  onTap?: () => void;
}

export default function NixFox({ size = 160, onTap }: NixFoxProps): React.JSX.Element {
  const bob = useRef(new Animated.Value(0)).current;
  const bounce = useRef(new Animated.Value(1)).current;
  const [blink, setBlink] = useState(false);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: -5, duration: 1200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(bob, { toValue: 0, duration: 1200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [bob]);

  useEffect(() => {
    const timer = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 130);
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  const handlePress = (): void => {
    Animated.sequence([
      Animated.timing(bounce, { toValue: 1.1, duration: 120, useNativeDriver: true }),
      Animated.timing(bounce, { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start();
    onTap?.();
  };

  return (
    <Pressable onPress={handlePress} style={styles.wrap}>
      <Animated.View style={{ transform: [{ translateY: bob }, { scale: bounce }] }}>
        <View style={{ width: size, height: size }}>
          <Svg width={size} height={size} viewBox="0 0 200 200">
            <Ellipse cx="100" cy="180" rx="54" ry="12" fill="#E6EDF5" />
            <Polygon points="52,40 28,8 74,24" fill="#E58139" />
            <Polygon points="148,40 172,8 126,24" fill="#E58139" />
            <Polygon points="50,40 36,18 68,28" fill="#FFD5B5" />
            <Polygon points="150,40 164,18 132,28" fill="#FFD5B5" />
            <Polygon points="100,20 168,66 144,154 56,154 32,66" fill="#F28D3B" />
            <Polygon points="100,44 146,78 130,138 70,138 54,78" fill="#FFF2E3" />
            <Rect x="88" y="100" width="24" height="18" rx="9" fill="#3D2B1F" />
            {!blink ? (
              <>
                <Circle cx="76" cy="88" r="6" fill="#1F2D3D" />
                <Circle cx="124" cy="88" r="6" fill="#1F2D3D" />
              </>
            ) : (
              <>
                <Rect x="70" y="86" width="12" height="3" rx="2" fill="#1F2D3D" />
                <Rect x="118" y="86" width="12" height="3" rx="2" fill="#1F2D3D" />
              </>
            )}
          </Svg>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
  },
});
