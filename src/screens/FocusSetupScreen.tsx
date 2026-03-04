import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useMemo, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { RootStackParamList } from "../app/navigation";
import { ALL_TOPICS, HIGH_TOPICS, LOW_TOPICS, MODERATE_TOPICS, TOPIC_META } from "../game/datasets";
import { DifficultyBucket, TopicId } from "../game/types";

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
  const [bucket, setBucket] = useState<DifficultyBucket>("low");
  const [topic, setTopic] = useState<TopicId>("letters");
  const topics = useMemo(() => topicsForBucket(bucket), [bucket]);

  const selectBucket = (next: DifficultyBucket): void => {
    setBucket(next);
    const nextTopics = topicsForBucket(next);
    if (!nextTopics.includes(topic)) {
      setTopic(nextTopics[0]);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Focus Setup</Text>
        <Text style={styles.section}>Difficulty Bucket</Text>
        <View style={styles.optionsWrap}>
          {BUCKETS.map((entry) => (
            <Pressable
              key={entry.id}
              style={[styles.chip, bucket === entry.id && styles.chipSelected]}
              onPress={() => selectBucket(entry.id)}
            >
              <Text style={[styles.chipText, bucket === entry.id && styles.chipTextSelected]}>{entry.label}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.section}>Topic</Text>
        <View style={styles.optionsWrap}>
          {TOPIC_META.filter((entry) => topics.includes(entry.id)).map((entry) => (
            <Pressable
              key={entry.id}
              style={[styles.topicCard, topic === entry.id && styles.topicCardSelected]}
              onPress={() => setTopic(entry.id)}
            >
              <Text style={[styles.topicText, topic === entry.id && styles.topicTextSelected]}>{entry.label}</Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          style={styles.startButton}
          onPress={() =>
            navigation.replace("Game", {
              mode: "focus",
              bucket,
              topic,
            })
          }
        >
          <Text style={styles.startButtonText}>Start</Text>
        </Pressable>
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
    padding: 16,
    paddingBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    color: "#18314F",
    marginBottom: 18,
  },
  section: {
    fontSize: 18,
    fontWeight: "800",
    color: "#27476B",
    marginBottom: 8,
  },
  optionsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 20,
  },
  chip: {
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "#B9CCE0",
    backgroundColor: "#FFFFFF",
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginRight: 8,
    marginBottom: 8,
  },
  chipSelected: {
    backgroundColor: "#1A4D9C",
    borderColor: "#1A4D9C",
  },
  chipText: {
    color: "#1E3553",
    fontWeight: "800",
  },
  chipTextSelected: {
    color: "#FFFFFF",
  },
  topicCard: {
    width: "48%",
    marginRight: "2%",
    marginBottom: 10,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#B9CCE0",
    backgroundColor: "#FFFFFF",
    paddingVertical: 14,
    paddingHorizontal: 10,
  },
  topicCardSelected: {
    backgroundColor: "#FF8C42",
    borderColor: "#FF8C42",
  },
  topicText: {
    textAlign: "center",
    color: "#1E3553",
    fontWeight: "700",
  },
  topicTextSelected: {
    color: "#FFFFFF",
  },
  startButton: {
    marginTop: 8,
    borderRadius: 16,
    backgroundColor: "#1A4D9C",
    paddingVertical: 14,
    alignItems: "center",
  },
  startButtonText: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
  },
});
