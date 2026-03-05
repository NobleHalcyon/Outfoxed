import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import Svg, { Circle, Path, Polygon, Rect } from "react-native-svg";
import { RoundOption, ShapeId } from "../game/types";
import AppText from "./AppText";
import IconButton from "./IconButton";

interface QuadrantCardProps {
  option: RoundOption;
  disabled: boolean;
  wiggleToken: number;
  size: number;
  onPress: (option: RoundOption) => void;
}

function shapePoints(shape: ShapeId): string {
  switch (shape) {
    case "triangle":
      return "50,12 88,88 12,88";
    case "star":
      return "50,8 61,36 92,36 66,54 76,86 50,66 24,86 34,54 8,36 39,36";
    case "hexagon":
      return "26,16 74,16 92,50 74,84 26,84 8,50";
    case "octagon":
      return "30,8 70,8 92,30 92,70 70,92 30,92 8,70 8,30";
    case "diamond":
      return "50,8 92,50 50,92 8,50";
    default:
      return "";
  }
}

function ShapeGlyph({ shape, color, size = 82 }: { shape: ShapeId; color: string; size?: number }): React.JSX.Element {
  const viewBox = "0 0 100 100";
  if (shape === "circle") {
    return (
      <Svg width={size} height={size} viewBox={viewBox}>
        <Circle cx="50" cy="50" r="40" fill={color} />
      </Svg>
    );
  }
  if (shape === "square") {
    return (
      <Svg width={size} height={size} viewBox={viewBox}>
        <Rect x="14" y="14" width="72" height="72" rx="8" fill={color} />
      </Svg>
    );
  }
  if (shape === "heart") {
    return (
      <Svg width={size} height={size} viewBox={viewBox}>
        <Path d="M50 84 C20 64, 8 44, 18 28 C26 16, 40 16, 50 30 C60 16, 74 16, 82 28 C92 44, 80 64, 50 84 Z" fill={color} />
      </Svg>
    );
  }
  return (
    <Svg width={size} height={size} viewBox={viewBox}>
      <Polygon points={shapePoints(shape)} fill={color} />
    </Svg>
  );
}

function QuantityGlyph({
  quantity,
  shape,
  color,
}: {
  quantity: number;
  shape: ShapeId;
  color: string;
}): React.JSX.Element {
  return (
    <View style={styles.quantityWrap}>
      {Array.from({ length: quantity }).map((_, index) => (
        <View key={index} style={styles.quantityItem}>
          <ShapeGlyph shape={shape} color={color} size={32} />
        </View>
      ))}
    </View>
  );
}

export default function QuadrantCard({
  option,
  disabled,
  wiggleToken,
  size,
  onPress,
}: QuadrantCardProps): React.JSX.Element {
  const wiggleX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!wiggleToken) {
      return;
    }
    Animated.sequence([
      Animated.timing(wiggleX, { toValue: -8, duration: 65, useNativeDriver: true, easing: Easing.linear }),
      Animated.timing(wiggleX, { toValue: 8, duration: 75, useNativeDriver: true, easing: Easing.linear }),
      Animated.timing(wiggleX, { toValue: -6, duration: 65, useNativeDriver: true, easing: Easing.linear }),
      Animated.timing(wiggleX, { toValue: 0, duration: 70, useNativeDriver: true, easing: Easing.linear }),
    ]).start();
  }, [wiggleToken, wiggleX]);

  const content = useMemo(() => {
    switch (option.kind) {
      case "text":
        return (
          <AppText weight="bold" style={[styles.bigText, { color: option.style.foregroundColor }]}>
            {option.text}
          </AppText>
        );
      case "color":
        return (
          <AppText weight="bold" style={[styles.colorText, { color: option.style.foregroundColor }]}>
            {option.text}
          </AppText>
        );
      case "shape":
        return <ShapeGlyph shape={option.shape ?? "circle"} color={option.style.shapeColor ?? option.style.foregroundColor} />;
      case "quantity":
        return (
          <QuantityGlyph
            quantity={option.quantity ?? 1}
            shape={option.shape ?? "circle"}
            color={option.style.shapeColor ?? option.style.foregroundColor}
          />
        );
      case "letter_shape":
        return (
          <View style={styles.letterShapeWrap}>
            <ShapeGlyph shape={option.shape ?? "circle"} color={option.style.shapeColor ?? option.style.foregroundColor} size={82} />
            <AppText weight="bold" style={[styles.overlayLetter, { color: option.style.foregroundColor }]}>
              {option.shapeLetter}
            </AppText>
          </View>
        );
      case "word":
        return (
          <AppText weight="bold" style={styles.wordText}>
            {(option.text ?? "").split("").map((letter, index) => (
              <AppText
                key={`${letter}-${index}`}
                weight="bold"
                style={{ color: option.letterColors?.[index] ?? option.style.foregroundColor }}
              >
                {letter}
              </AppText>
            ))}
          </AppText>
        );
      default:
        return (
          <AppText weight="bold" style={[styles.bigText, { color: option.style.foregroundColor }]}>
            {option.text}
          </AppText>
        );
    }
  }, [option]);

  return (
    <Animated.View style={[styles.cardContainer, { width: size, height: size, transform: [{ translateX: wiggleX }] }]}>
      <IconButton
        disabled={disabled}
        playPop
        style={[styles.cardButton, { backgroundColor: option.style.backgroundColor }]}
        onPress={() => onPress(option)}
      >
        <View pointerEvents="none" style={styles.depthHighlight} />
        {content}
      </IconButton>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    marginBottom: 10,
  },
  cardButton: {
    flex: 1,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#CFDCE8",
    paddingHorizontal: 8,
    shadowColor: "#20354D",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
    overflow: "hidden",
  },
  depthHighlight: {
    position: "absolute",
    top: 6,
    left: 10,
    right: 10,
    height: 14,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.23)",
  },
  bigText: {
    fontSize: 58,
  },
  colorText: {
    fontSize: 28,
    textAlign: "center",
  },
  quantityWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: "88%",
    justifyContent: "center",
    alignItems: "center",
  },
  quantityItem: {
    width: "33%",
    alignItems: "center",
    marginVertical: 2,
  },
  letterShapeWrap: {
    width: 98,
    height: 98,
    alignItems: "center",
    justifyContent: "center",
  },
  overlayLetter: {
    position: "absolute",
    fontSize: 42,
  },
  wordText: {
    fontSize: 38,
    textTransform: "lowercase",
  },
});
