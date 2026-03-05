import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useMemo, useState } from "react";
import { SafeAreaView, ScrollView, StyleSheet, View } from "react-native";
import { useAppContext } from "../app/AppContext";
import { RootStackParamList } from "../app/navigation";
import AppText from "../components/AppText";
import IconButton from "../components/IconButton";
import { ALL_TOPICS, HIGH_TOPICS, LOW_TOPICS, MODERATE_TOPICS, TOPIC_META } from "../game/datasets";
import { DifficultyBucket, TopicId } from "../game/types";
import { resolveBackgroundColor } from "../theme/theme";

type Props = NativeStackScreenProps<RootStackParamList, "FocusSetup">;

const BUCKETS: Array<{ id: DifficultyBucket; label: string }> = [
  { id: "low", label: "Low" },
  { id: "moderate", label: "Moderate" },
  { id: "high", label: "High" },
  { id: "auto", label: "Auto" },
];

function topicsForBucket(bucket: DifficultyBucket): TopicId[] {
  if (bucket === "low") {
    return LOW_TOPICS;
  }
  if (bucket === "moderate") {
    return MODERATE_TOPICS;
  }
  if (bucket === "high") {
    return HIGH_TOPICS;
  }
  return ALL_TOPICS;
}

export default function FocusSetupScreen({ navigation }: Props): React.JSX.Element {
  const { activeProfile } = useAppContext();
  const [bucket, setBucket] = useState<DifficultyBucket>("low");
  const [topic, setTopic] = useState<TopicId>("letters");
  const topics = useMemo(() => topicsForBucket(bucket), [bucket]);
  const backgroundColor = resolveBackgroundColor(activeProfile?.settings.backgroundThemeId);

  const selectBucket = (next: DifficultyBucket): void => {
    setBucket(next);
    const nextTopics = topicsForBucket(next);
    if (!nextTopics.includes(topic)) {
      setTopic(nextTopics[0]);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <AppText weight="bold" style={styles.title}>
          Focus Setup
        </AppText>

        <AppText weight="semibold" style={styles.section}>
          Difficulty Bucket
        </AppText>
        <View style={styles.optionsWrap}>
          {BUCKETS.map((entry) => {
            const selected = bucket === entry.id;
            return (
              <IconButton
                key={entry.id}
                icon="eye"
                label={entry.label}
                onPress={() => selectBucket(entry.id)}
                style={[styles.chip, selected && styles.chipSelected]}
                textColor={selected ? "#FFFFFF" : "#1E3553"}
                iconColor={selected ? "#FFFFFF" : "#1E3553"}
                haptic="light"
              />
            );
          })}
        </View>

        <AppText weight="semibold" style={styles.section}>
          Topic
        </AppText>
        <View style={styles.optionsWrap}>
          {TOPIC_META.filter((entry) => topics.includes(entry.id)).map((entry) => {
            const selected = topic === entry.id;
            return (
              <IconButton
                key={entry.id}
                icon="eye"
                label={entry.label}
                onPress={() => setTopic(entry.id)}
                style={[styles.topicCard, selected && styles.topicCardSelected]}
                textColor={selected ? "#FFFFFF" : "#1E3553"}
                iconColor={selected ? "#FFFFFF" : "#1E3553"}
                haptic="light"
              />
            );
          })}
        </View>

        <IconButton
          icon="eye"
          label="Start Focus"
          size="large"
          onPress={() =>
            navigation.replace("Game", {
              mode: "focus",
              bucket,
              topic,
            })
          }
          style={styles.startButton}
          iconColor="#1A4D9C"
          textColor="#1A4D9C"
          haptic="light"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 30,
  },
  title: {
    fontSize: 34,
    color: "#18314F",
    marginBottom: 18,
  },
  section: {
    fontSize: 19,
    color: "#27476B",
    marginBottom: 8,
  },
  optionsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 18,
  },
  chip: {
    borderRadius: 999,
    minWidth: 84,
  },
  chipSelected: {
    backgroundColor: "#1A4D9C",
    borderColor: "#1A4D9C",
  },
  topicCard: {
    width: "48%",
    minHeight: 64,
    borderRadius: 16,
  },
  topicCardSelected: {
    backgroundColor: "#FF8C42",
    borderColor: "#FF8C42",
  },
  startButton: {
    marginTop: 4,
    borderRadius: 18,
    minHeight: 120,
  },
});
