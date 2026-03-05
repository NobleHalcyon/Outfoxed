import React from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Circle, Path, Polygon, Rect } from "react-native-svg";
import { PromptData, ShapeId } from "../game/types";
import AppText from "./AppText";

interface PromptPanelProps {
  prompt: PromptData;
  hidden: boolean;
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

function ShapeVisual({ shape, color, size = 130 }: { shape: ShapeId; color: string; size?: number }): React.JSX.Element {
  if (shape === "circle") {
    return (
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Circle cx="50" cy="50" r="40" fill={color} />
      </Svg>
    );
  }
  if (shape === "square") {
    return (
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Rect x="14" y="14" width="72" height="72" rx="8" fill={color} />
      </Svg>
    );
  }
  if (shape === "heart") {
    return (
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Path d="M50 84 C20 64, 8 44, 18 28 C26 16, 40 16, 50 30 C60 16, 74 16, 82 28 C92 44, 80 64, 50 84 Z" fill={color} />
      </Svg>
    );
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Polygon points={shapePoints(shape)} fill={color} />
    </Svg>
  );
}

function QuantityVisual({
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
          <ShapeVisual shape={shape} color={color} size={42} />
        </View>
      ))}
    </View>
  );
}

export default function PromptPanel({ prompt, hidden }: PromptPanelProps): React.JSX.Element {
  return (
    <View style={styles.card}>
      {hidden ? (
        <AppText weight="bold" style={styles.hiddenText}>
          ?
        </AppText>
      ) : (
        <>
          {prompt.kind === "text" && (
            <AppText weight="bold" style={[styles.textPrompt, { color: prompt.foregroundColor }]}>
              {prompt.text}
            </AppText>
          )}
          {prompt.kind === "color" && <View style={[styles.colorSwatch, { backgroundColor: prompt.swatchColor ?? "#FFFFFF" }]} />}
          {prompt.kind === "shape" && (
            <ShapeVisual shape={prompt.shape ?? "circle"} color={prompt.shapeColor ?? prompt.foregroundColor} />
          )}
          {prompt.kind === "quantity" && (
            <QuantityVisual
              quantity={prompt.quantity ?? 1}
              shape={prompt.shape ?? "circle"}
              color={prompt.shapeColor ?? prompt.foregroundColor}
            />
          )}
          {prompt.kind === "letter_shape" && (
            <View style={styles.letterShapeWrap}>
              <ShapeVisual
                shape={prompt.shape ?? "circle"}
                color={prompt.shapeColor ?? prompt.foregroundColor}
                size={138}
              />
              <AppText weight="bold" style={[styles.overlayLetter, { color: prompt.foregroundColor }]}>
                {prompt.shapeLetter}
              </AppText>
            </View>
          )}
          {prompt.kind === "word" && (
            <AppText weight="bold" style={styles.wordText}>
              {(prompt.text ?? "").split("").map((letter, index) => (
                <AppText
                  key={`${letter}-${index}`}
                  weight="bold"
                  style={{ color: prompt.letterColors?.[index] ?? prompt.foregroundColor }}
                >
                  {letter}
                </AppText>
              ))}
            </AppText>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    flex: 1,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: "#D4DEE8",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    paddingVertical: 18,
    shadowColor: "#1C324B",
    shadowOpacity: 0.14,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },
  hiddenText: {
    fontSize: 88,
    color: "#B1C0D0",
  },
  textPrompt: {
    fontSize: 104,
    lineHeight: 112,
    textAlign: "center",
  },
  colorSwatch: {
    width: "86%",
    maxWidth: 320,
    aspectRatio: 2.3,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#D9E1E8",
  },
  quantityWrap: {
    width: "88%",
    maxWidth: 320,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  quantityItem: {
    width: "33.33%",
    alignItems: "center",
    marginVertical: 3,
  },
  letterShapeWrap: {
    width: 160,
    height: 160,
    alignItems: "center",
    justifyContent: "center",
  },
  overlayLetter: {
    position: "absolute",
    fontSize: 64,
  },
  wordText: {
    fontSize: 58,
    textTransform: "lowercase",
    textAlign: "center",
  },
});
