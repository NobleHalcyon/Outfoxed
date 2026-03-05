import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import {
  Fredoka_400Regular,
  Fredoka_500Medium,
  Fredoka_600SemiBold,
  Fredoka_700Bold,
} from "@expo-google-fonts/fredoka";
import { useFonts } from "expo-font";
import React from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { AudioManagerProvider } from "./src/audio/AudioManager";
import { AppProvider, useAppContext } from "./src/app/AppContext";
import { RootStackParamList } from "./src/app/navigation";
import { AppTextFontProvider } from "./src/components/AppText";
import FocusSetupScreen from "./src/screens/FocusSetupScreen";
import GameScreen from "./src/screens/GameScreen";
import HomeScreen from "./src/screens/HomeScreen";
import SettingsScreen from "./src/screens/SettingsScreen";
import { resolveBackgroundColor } from "./src/theme/theme";

const Stack = createNativeStackNavigator<RootStackParamList>();

function AppNavigator(): React.JSX.Element {
  const { ready, activeProfile } = useAppContext();
  const backgroundColor = resolveBackgroundColor(activeProfile?.settings.backgroundThemeId);

  if (!ready) {
    return (
      <View style={[styles.loading, { backgroundColor }]}>
        <ActivityIndicator size="large" color="#1A4D9C" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="FocusSetup" component={FocusSetupScreen} />
        <Stack.Screen name="Game" component={GameScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App(): React.JSX.Element {
  const [fontsLoaded, fontError] = useFonts({
    Fredoka_400Regular,
    Fredoka_500Medium,
    Fredoka_600SemiBold,
    Fredoka_700Bold,
  });

  const fontReady = fontsLoaded || Boolean(fontError);

  if (!fontReady) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#1A4D9C" />
      </View>
    );
  }

  return (
    <AppTextFontProvider loaded={fontsLoaded}>
      <AppProvider>
        <AudioManagerProvider>
          <AppNavigator />
        </AudioManagerProvider>
      </AppProvider>
    </AppTextFontProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F4F8FC",
  },
});
