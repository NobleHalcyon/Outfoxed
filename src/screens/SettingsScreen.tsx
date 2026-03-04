import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { RootStackParamList } from "../app/navigation";
import { useAppContext } from "../app/AppContext";
import { DifficultyLevel } from "../game/types";

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
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.stepperControls}>
        <Pressable style={styles.stepperButton} onPress={onDecrease}>
          <Text style={styles.stepperText}>-</Text>
        </Pressable>
        <Text style={styles.stepperValue}>{valueLabel}</Text>
        <Pressable style={styles.stepperButton} onPress={onIncrease}>
          <Text style={styles.stepperText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function SettingsScreen({}: Props): React.JSX.Element {
  const { activeProfile, updateActiveSettings } = useAppContext();
  const [wordDraft, setWordDraft] = useState("");

  if (!activeProfile) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <Text style={styles.placeholder}>No active kid profile.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const settings = activeProfile.settings;

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
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Settings · {activeProfile.name}</Text>

        <View style={styles.card}>
          <View style={styles.switchRow}>
            <Text style={styles.rowLabel}>Sound</Text>
            <Switch value={settings.soundEnabled} onValueChange={(soundEnabled) => updateActiveSettings({ soundEnabled })} />
          </View>
          <View style={styles.switchRow}>
            <Text style={styles.rowLabel}>Show HUD (score + streak)</Text>
            <Switch value={settings.showHud} onValueChange={(showHud) => updateActiveSettings({ showHud })} />
          </View>
          <View style={styles.switchRow}>
            <Text style={styles.rowLabel}>Show timer</Text>
            <Switch value={settings.showTimer} onValueChange={(showTimer) => updateActiveSettings({ showTimer })} />
          </View>
          <StepperRow
            label="Round timeout"
            valueLabel={`${Math.round(settings.timeoutMs / 1000)}s`}
            onDecrease={() => updateActiveSettings({ timeoutMs: clamp(settings.timeoutMs - 1000, 5000, 30000) })}
            onIncrease={() => updateActiveSettings({ timeoutMs: clamp(settings.timeoutMs + 1000, 5000, 30000) })}
          />
        </View>

        <View style={styles.card}>
          <View style={styles.switchRow}>
            <Text style={styles.rowLabel}>Memory Mode</Text>
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
            <Text style={styles.rowLabel}>Adaptive practice</Text>
            <Switch
              value={settings.adaptivePracticeEnabled}
              onValueChange={(adaptivePracticeEnabled) => updateActiveSettings({ adaptivePracticeEnabled })}
            />
          </View>
          <Text style={styles.rowLabel}>Starting progression difficulty</Text>
          <View style={styles.difficultyRow}>
            {[0, 1, 2].map((value) => {
              const labels = ["Low", "Moderate", "High"] as const;
              const selected = settings.startingDifficultyLevel === value;
              return (
                <Pressable
                  key={value}
                  style={[styles.difficultyChip, selected && styles.difficultyChipSelected]}
                  onPress={() => setStartingDifficulty(value as DifficultyLevel)}
                >
                  <Text style={[styles.difficultyText, selected && styles.difficultyTextSelected]}>{labels[value]}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.rowLabel}>Simple Words</Text>
          <View style={styles.wordWrap}>
            {settings.wordList.map((word) => (
              <View key={word} style={styles.wordChip}>
                <Text style={styles.wordChipText}>{word}</Text>
                <Pressable onPress={() => removeWord(word)}>
                  <Text style={styles.removeWord}>x</Text>
                </Pressable>
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
            <Pressable style={styles.addWordButton} onPress={addWord}>
              <Text style={styles.addWordText}>Add</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F4F8FC",
  },
  content: {
    padding: 14,
    paddingBottom: 30,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholder: {
    color: "#39506A",
    fontWeight: "700",
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
    color: "#1A3450",
    marginBottom: 10,
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
    fontWeight: "700",
    fontSize: 15,
    marginBottom: 6,
  },
  stepperRow: {
    marginTop: 3,
    marginBottom: 6,
  },
  stepperControls: {
    flexDirection: "row",
    alignItems: "center",
  },
  stepperButton: {
    width: 34,
    height: 34,
    borderRadius: 999,
    backgroundColor: "#E3ECF6",
    alignItems: "center",
    justifyContent: "center",
  },
  stepperText: {
    color: "#21405F",
    fontWeight: "900",
    fontSize: 20,
  },
  stepperValue: {
    minWidth: 90,
    textAlign: "center",
    color: "#21405F",
    fontWeight: "800",
  },
  difficultyRow: {
    flexDirection: "row",
    marginTop: 4,
  },
  difficultyChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#E8F0FA",
    borderWidth: 1,
    borderColor: "#B4C9E0",
    marginRight: 8,
  },
  difficultyChipSelected: {
    backgroundColor: "#1A4D9C",
    borderColor: "#1A4D9C",
  },
  difficultyText: {
    color: "#1E3553",
    fontWeight: "700",
  },
  difficultyTextSelected: {
    color: "#FFFFFF",
  },
  wordWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 10,
  },
  wordChip: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    backgroundColor: "#F1F7FF",
    borderWidth: 1,
    borderColor: "#C3D5E8",
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 6,
    marginBottom: 6,
  },
  wordChipText: {
    color: "#21405F",
    marginRight: 8,
    fontWeight: "700",
  },
  removeWord: {
    color: "#B83838",
    fontWeight: "900",
  },
  wordInputRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  wordInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#B4C9E0",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 9,
    marginRight: 8,
  },
  addWordButton: {
    borderRadius: 10,
    backgroundColor: "#1A4D9C",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  addWordText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
});
