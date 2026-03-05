import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useState } from "react";
import { SafeAreaView, ScrollView, StyleSheet, Switch, TextInput, View } from "react-native";
import { useAppContext } from "../app/AppContext";
import { RootStackParamList } from "../app/navigation";
import AppText from "../components/AppText";
import IconButton from "../components/IconButton";
import { DifficultyLevel } from "../game/types";
import { BACKGROUND_PRESETS, resolveBackgroundColor } from "../theme/theme";

type Props = NativeStackScreenProps<RootStackParamList, "Settings">;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function StepperRow({
  label,
  valueLabel,
  onDecrease,
  onIncrease,
}: {
  label: string;
  valueLabel: string;
  onDecrease: () => void;
  onIncrease: () => void;
}): React.JSX.Element {
  return (
    <View style={styles.stepperRow}>
      <AppText weight="medium" style={styles.rowLabel}>
        {label}
      </AppText>
      <View style={styles.stepperControls}>
        <IconButton icon="dash" label="Less" onPress={onDecrease} style={styles.stepperButton} haptic="light" />
        <AppText weight="semibold" style={styles.stepperValue}>
          {valueLabel}
        </AppText>
        <IconButton icon="plus-circle" label="More" onPress={onIncrease} style={styles.stepperButton} haptic="light" />
      </View>
    </View>
  );
}

export default function SettingsScreen({ navigation }: Props): React.JSX.Element {
  const { activeProfile, updateActiveSettings } = useAppContext();
  const [wordDraft, setWordDraft] = useState("");

  if (!activeProfile) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: "#EEF1F4" }]}>
        <View style={styles.centered}>
          <AppText weight="semibold" style={styles.placeholder}>
            No active kid profile.
          </AppText>
        </View>
      </SafeAreaView>
    );
  }

  const settings = activeProfile.settings;
  const backgroundColor = resolveBackgroundColor(settings.backgroundThemeId);

  const setStartingDifficulty = (level: DifficultyLevel): void => {
    updateActiveSettings({ startingDifficultyLevel: level });
  };

  const addWord = (): void => {
    const value = wordDraft.trim().toLowerCase();
    if (!value || settings.wordList.includes(value)) {
      return;
    }
    updateActiveSettings({ wordList: [...settings.wordList, value].slice(0, 20) });
    setWordDraft("");
  };

  const removeWord = (word: string): void => {
    updateActiveSettings({ wordList: settings.wordList.filter((entry) => entry !== word) });
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topRow}>
          <IconButton icon="home" label="Home" onPress={() => navigation.replace("Home")} />
          <AppText weight="bold" style={styles.title}>
            Settings
          </AppText>
        </View>

        <AppText weight="semibold" style={styles.kidLabel}>
          Kid: {activeProfile.name}
        </AppText>

        <View style={styles.card}>
          <View style={styles.switchRow}>
            <AppText weight="medium" style={styles.rowLabel}>
              Sound effects
            </AppText>
            <Switch value={settings.soundEnabled} onValueChange={(soundEnabled) => updateActiveSettings({ soundEnabled })} />
          </View>
          <View style={styles.switchRow}>
            <AppText weight="medium" style={styles.rowLabel}>
              Music
            </AppText>
            <IconButton
              icon={settings.musicMuted ? "mute" : "unmute"}
              label={settings.musicMuted ? "Muted" : "On"}
              onPress={() => updateActiveSettings({ musicMuted: !settings.musicMuted })}
              haptic="light"
            />
          </View>
          <View style={styles.switchRow}>
            <AppText weight="medium" style={styles.rowLabel}>
              Show HUD (score + streak)
            </AppText>
            <Switch value={settings.showHud} onValueChange={(showHud) => updateActiveSettings({ showHud })} />
          </View>
          <View style={styles.switchRow}>
            <AppText weight="medium" style={styles.rowLabel}>
              Show timer
            </AppText>
            <Switch value={settings.showTimer} onValueChange={(showTimer) => updateActiveSettings({ showTimer })} />
          </View>
          <StepperRow
            label="Round timeout"
            valueLabel={`${Math.round(settings.timeoutMs / 1000)}s`}
            onDecrease={() => updateActiveSettings({ timeoutMs: clamp(settings.timeoutMs - 1000, 5000, 30000) })}
            onIncrease={() => updateActiveSettings({ timeoutMs: clamp(settings.timeoutMs + 1000, 5000, 30000) })}
          />
          <AppText weight="regular" style={styles.helperText}>
            Low difficulty always disables timer and memory delay.
          </AppText>
        </View>

        <View style={styles.card}>
          <View style={styles.switchRow}>
            <AppText weight="medium" style={styles.rowLabel}>
              Memory mode
            </AppText>
            <Switch value={settings.memoryMode} onValueChange={(memoryMode) => updateActiveSettings({ memoryMode })} />
          </View>
          <StepperRow
            label="Preview"
            valueLabel={`${settings.previewMs}ms`}
            onDecrease={() => updateActiveSettings({ previewMs: clamp(settings.previewMs - 100, 800, 2500) })}
            onIncrease={() => updateActiveSettings({ previewMs: clamp(settings.previewMs + 100, 800, 2500) })}
          />
          <StepperRow
            label="Hint delay"
            valueLabel={`${settings.helpMs}ms`}
            onDecrease={() => updateActiveSettings({ helpMs: clamp(settings.helpMs - 500, 2000, 12000) })}
            onIncrease={() => updateActiveSettings({ helpMs: clamp(settings.helpMs + 500, 2000, 12000) })}
          />
          <StepperRow
            label="Hint duration"
            valueLabel={`${settings.hintMs}ms`}
            onDecrease={() => updateActiveSettings({ hintMs: clamp(settings.hintMs - 100, 300, 1500) })}
            onIncrease={() => updateActiveSettings({ hintMs: clamp(settings.hintMs + 100, 300, 1500) })}
          />
        </View>

        <View style={styles.card}>
          <View style={styles.switchRow}>
            <AppText weight="medium" style={styles.rowLabel}>
              Adaptive practice
            </AppText>
            <Switch
              value={settings.adaptivePracticeEnabled}
              onValueChange={(adaptivePracticeEnabled) => updateActiveSettings({ adaptivePracticeEnabled })}
            />
          </View>
          <AppText weight="semibold" style={styles.rowLabel}>
            Starting progression difficulty
          </AppText>
          <View style={styles.difficultyRow}>
            {[0, 1, 2].map((value) => {
              const labels = ["Low", "Moderate", "High"] as const;
              const selected = settings.startingDifficultyLevel === value;
              return (
                <IconButton
                  key={value}
                  icon="trophy"
                  label={labels[value]}
                  onPress={() => setStartingDifficulty(value as DifficultyLevel)}
                  style={[styles.difficultyChip, selected && styles.difficultyChipSelected]}
                  textColor={selected ? "#FFFFFF" : "#1E3553"}
                  iconColor={selected ? "#FFFFFF" : "#1E3553"}
                  haptic="light"
                />
              );
            })}
          </View>
        </View>

        <View style={styles.card}>
          <AppText weight="semibold" style={styles.rowLabel}>
            Background Theme
          </AppText>
          <View style={styles.themeWrap}>
            {BACKGROUND_PRESETS.map((preset) => {
              const selected = settings.backgroundThemeId === preset.id;
              return (
                <IconButton
                  key={preset.id}
                  icon="paintbrush"
                  label={preset.label}
                  onPress={() => updateActiveSettings({ backgroundThemeId: preset.id })}
                  style={[styles.themeButton, selected && styles.themeButtonSelected, { backgroundColor: preset.backgroundColor }]}
                  iconColor="#1A4D9C"
                  textColor="#1A4D9C"
                  haptic="light"
                />
              );
            })}
          </View>
        </View>

        <View style={styles.card}>
          <AppText weight="semibold" style={styles.rowLabel}>
            Simple Words
          </AppText>
          <View style={styles.wordWrap}>
            {settings.wordList.map((word) => (
              <View key={word} style={styles.wordChip}>
                <AppText weight="medium" style={styles.wordChipText}>
                  {word}
                </AppText>
                <IconButton icon="trash" label="Remove" onPress={() => removeWord(word)} style={styles.removeWordButton} haptic="light" />
              </View>
            ))}
          </View>
          <View style={styles.wordInputRow}>
            <TextInput
              value={wordDraft}
              onChangeText={setWordDraft}
              placeholder="Add word"
              autoCapitalize="none"
              style={styles.wordInput}
              maxLength={12}
            />
            <IconButton icon="plus-circle" label="Add Word" onPress={addWord} haptic="light" />
          </View>
        </View>

        <View style={styles.card}>
          <AppText weight="semibold" style={styles.rowLabel}>
            Parent Controls
          </AppText>
          <View style={styles.parentRow}>
            <IconButton icon="lock" label="Android App Pinning" style={styles.parentIcon} playPop={false} />
            <AppText weight="regular" style={styles.parentText}>
              Open Recent Apps, tap the Outfoxed app icon, then choose Pin. Unpin with Back + Overview.
            </AppText>
          </View>
          <View style={styles.parentRow}>
            <IconButton icon="lock" label="iOS Guided Access" style={styles.parentIcon} playPop={false} />
            <AppText weight="regular" style={styles.parentText}>
              Enable Guided Access in Accessibility, open Outfoxed, triple-click the side button, then tap Start.
            </AppText>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  content: {
    padding: 14,
    paddingBottom: 30,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    color: "#1A3450",
  },
  kidLabel: {
    fontSize: 18,
    color: "#1A3450",
    marginBottom: 10,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholder: {
    color: "#39506A",
    fontSize: 16,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#D7E3F0",
    padding: 12,
    marginBottom: 12,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  rowLabel: {
    color: "#21405F",
    fontSize: 17,
  },
  helperText: {
    color: "#4A607A",
    fontSize: 14,
  },
  stepperRow: {
    marginTop: 3,
    marginBottom: 8,
  },
  stepperControls: {
    flexDirection: "row",
    alignItems: "center",
  },
  stepperButton: {
    borderRadius: 12,
    minWidth: 86,
  },
  stepperValue: {
    minWidth: 100,
    textAlign: "center",
    color: "#21405F",
    fontSize: 16,
  },
  difficultyRow: {
    flexDirection: "row",
    marginTop: 6,
    gap: 8,
  },
  difficultyChip: {
    borderRadius: 999,
  },
  difficultyChipSelected: {
    backgroundColor: "#1A4D9C",
    borderColor: "#1A4D9C",
  },
  themeWrap: {
    gap: 8,
  },
  themeButton: {
    borderRadius: 14,
  },
  themeButtonSelected: {
    borderColor: "#1A4D9C",
    borderWidth: 2,
  },
  wordWrap: {
    gap: 8,
    marginBottom: 10,
  },
  wordChip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 999,
    backgroundColor: "#F1F7FF",
    borderWidth: 1,
    borderColor: "#C3D5E8",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  wordChipText: {
    color: "#21405F",
    fontSize: 15,
  },
  removeWordButton: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderColor: "#D5E2F1",
  },
  wordInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  wordInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#B4C9E0",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 9,
    backgroundColor: "#F8FBFF",
  },
  parentRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 8,
  },
  parentIcon: {
    marginRight: 8,
    minWidth: 84,
  },
  parentText: {
    flex: 1,
    fontSize: 14,
    color: "#334D67",
    lineHeight: 20,
  },
});
