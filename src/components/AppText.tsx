import React, { createContext, useContext } from "react";
import { StyleSheet, Text, TextProps, TextStyle } from "react-native";

type AppFontWeight = "regular" | "medium" | "semibold" | "bold";

const FontLoadedContext = createContext(false);

export function AppTextFontProvider({
  loaded,
  children,
}: {
  loaded: boolean;
  children: React.ReactNode;
}): React.JSX.Element {
  return <FontLoadedContext.Provider value={loaded}>{children}</FontLoadedContext.Provider>;
}

interface AppTextProps extends TextProps {
  weight?: AppFontWeight;
}

const FONT_BY_WEIGHT: Record<AppFontWeight, string> = {
  regular: "Fredoka_400Regular",
  medium: "Fredoka_500Medium",
  semibold: "Fredoka_600SemiBold",
  bold: "Fredoka_700Bold",
};

export default function AppText({
  children,
  style,
  weight = "regular",
  ...props
}: AppTextProps): React.JSX.Element {
  const loaded = useContext(FontLoadedContext);
  const fontStyle: TextStyle = loaded ? { fontFamily: FONT_BY_WEIGHT[weight] } : {};

  return (
    <Text {...props} style={StyleSheet.flatten([fontStyle, style])}>
      {children}
    </Text>
  );
}
