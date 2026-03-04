import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Path, Polygon, Rect } from "react-native-svg";
import { PromptData, ShapeId } from "../game/types";

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

function ShapeVisual({ shape, color, size = 54 }: { shape: ShapeId; color: string; size?: number }): React.JSX.Element {
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
          <ShapeVisual shape={shape} color={color} size={28} />
        </View>
      ))}
    </View>
  );
}

export default function PromptPanel({ prompt, hidden }: PromptPanelProps): React.JSX.Element {
  return (
    <View style={styles.panel}>
      <Text style={styles.title}>{prompt.title}</Text>
      <View style={styles.targetWrap}>
        {hidden ? (
          <View style={styles.hiddenTarget}>
            <Text style={styles.hiddenText}>?</Text>
          </View>
        ) : (
          <View style={[styles.visibleTarget, { backgroundColor: prompt.backgroundColor }]}>
            {prompt.kind === "text" && (
              <Text style={[styles.text, { color: prompt.foregroundColor }]}>{prompt.text}</Text>
            )}
            {prompt.kind === "color" && (
              <View style={[styles.swatch, { backgroundColor: prompt.swatchColor ?? "#EEE" }]}>
                <Text style={[styles.swatchLabel, { color: prompt.foregroundColor }]}>{prompt.text}</Text>
              </View>
            )}
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
                <ShapeVisual shape={prompt.shape ?? "circle"} color={prompt.shapeColor ?? prompt.foregroundColor} size={60} />
                <Text style={[styles.overlayLetter, { color: prompt.foregroundColor }]}>{prompt.shapeLetter}</Text>
              </View>
            )}
            {prompt.kind === "word" && (
              <Text style={styles.wordText}>
                {(prompt.text ?? "").split("").map((letter, index) => (
                  <Text key={`${letter}-${index}`} style={{ color: prompt.letterColors?.[index] ?? prompt.foregroundColor }}>
                    {letter}
                  </Text>
                ))}
              </Text>
            )}
          </View>
        )}
      </View>
      {prompt.subtitle ? <Text style={styles.subtitle}>{prompt.subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    width: "100%",
    height: "100%",
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#DCE7F2",
    paddingVertical: 8,
    paddingHorizontal: 12,
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1F3653",
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#355070",
  },
  targetWrap: {
    flex: 1,
    justifyContent: "center",
    width: "100%",
    alignItems: "center",
    paddingVertical: 4,
  },
  visibleTarget: {
    minWidth: 140,
    minHeight: 72,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#C3D5E5",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  hiddenTarget: {
    minWidth: 140,
    minHeight: 72,
    borderRadius: 14,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#C3D5E5",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EEF5FC",
  },
  hiddenText: {
    fontSize: 34,
    fontWeight: "800",
    color: "#97AFC9",
  },
  text: {
    fontSize: 42,
    fontWeight: "900",
  },
  swatch: {
    width: 148,
    height: 62,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  swatchLabel: {
    fontSize: 24,
    fontWeight: "900",
  },
  quantityWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: 114,
    justifyContent: "center",
  },
  quantityItem: {
    width: "33%",
    alignItems: "center",
  },
  letterShapeWrap: {
    width: 64,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
  },
  overlayLetter: {
    position: "absolute",
    fontSize: 28,
    fontWeight: "900",
  },
  wordText: {
    fontSize: 30,
    fontWeight: "900",
    textTransform: "lowercase",
  },
});
