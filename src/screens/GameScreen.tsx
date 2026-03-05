import { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { SafeAreaView, StyleSheet, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAudioManager } from "../audio/AudioManager";
import { useAppContext } from "../app/AppContext";
import { RootStackParamList } from "../app/navigation";
import AppText from "../components/AppText";
import ConfettiOverlay from "../components/ConfettiOverlay";
import IconButton from "../components/IconButton";
import PromptPanel from "../components/PromptPanel";
import QuadrantGrid from "../components/QuadrantGrid";
import TimerBar from "../components/TimerBar";
import { selectAdaptiveTarget } from "../game/adaptive";
import { getDifficultyForTopic } from "../game/datasets";
import { generateRound, getItemsForTopic } from "../game/generator";
import { advanceMemoryPhase, createMemoryPhaseState, isOptionsInteractive, isPromptHidden } from "../game/memory";
import { applyCorrectToProgression, applyNoClearToProgression, pickProgressionTopic } from "../game/progression";
import { RoundDefinition, RoundOption } from "../game/types";
import { KidLearningStats } from "../storage/schema";
import { resolveBackgroundColor } from "../theme/theme";

type Props = NativeStackScreenProps<RootStackParamList, "Game">;

function ensureItemStat(stats: KidLearningStats, itemId: string, now: number): KidLearningStats["items"][string] {
  return (
    stats.items[itemId] ?? {
      shown: 0,
      correct: 0,
      avgTimeMs: 0,
      timeouts: 0,
      lastSeenAt: now,
    }
  );
}

function ensureTopicStat(stats: KidLearningStats, topic: RoundDefinition["topic"], now: number) {
  return (
    stats.topics[topic] ?? {
      shown: 0,
      correct: 0,
      timeouts: 0,
      lastSeenAt: now,
    }
  );
}

function randomPickWithoutRepeat(pool: string[], lastItem?: string): string {
  const filtered = pool.filter((item) => item !== lastItem);
  const source = filtered.length > 0 ? filtered : pool;
  return source[Math.floor(Math.random() * source.length)];
}

export default function GameScreen({ navigation, route }: Props): React.JSX.Element {
  const { activeProfile, updateActiveStats } = useAppContext();
  const { playWrong, playYay } = useAudioManager();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const [round, setRound] = useState<RoundDefinition | null>(null);
  const [roundStartedAt, setRoundStartedAt] = useState(0);
  const [memoryState, setMemoryState] = useState(createMemoryPhaseState(Date.now(), false));
  const [wiggleTokens, setWiggleTokens] = useState<Record<string, number>>({});
  const [confettiVisible, setConfettiVisible] = useState(false);
  const [locked, setLocked] = useState(false);
  const [now, setNow] = useState(Date.now());

  const activeProfileRef = useRef(activeProfile);
  const roundRef = useRef<RoundDefinition | null>(null);
  const roundResolvedRef = useRef(false);

  activeProfileRef.current = activeProfile;
  roundRef.current = round;

  const settings = activeProfile?.settings;
  const score = activeProfile?.stats.progression.score ?? 0;
  const streak = activeProfile?.stats.progression.streak ?? 0;

  const isLowDifficulty = useMemo(() => {
    if (!round) {
      return route.params.mode === "focus" && route.params.bucket === "low";
    }
    return round.difficulty === 0;
  }, [round, route.params]);

  const timerEnabled = Boolean(settings?.showTimer) && !isLowDifficulty;
  const memoryEnabled = Boolean(settings?.memoryMode) && !isLowDifficulty;

  const backgroundColor = resolveBackgroundColor(settings?.backgroundThemeId);

  const config = useMemo(
    () => ({
      enabled: memoryEnabled,
      previewMs: settings?.previewMs ?? 1500,
      helpMs: settings?.helpMs ?? 6000,
      hintMs: settings?.hintMs ?? 800,
    }),
    [memoryEnabled, settings?.helpMs, settings?.hintMs, settings?.previewMs],
  );

  const markRoundShown = (generatedRound: RoundDefinition, startedAt: number): void => {
    updateActiveStats((stats) => {
      const item = ensureItemStat(stats, generatedRound.targetItemId, startedAt);
      const topic = ensureTopicStat(stats, generatedRound.topic, startedAt);

      return {
        ...stats,
        items: {
          ...stats.items,
          [generatedRound.targetItemId]: {
            ...item,
            shown: item.shown + 1,
            lastSeenAt: startedAt,
          },
        },
        topics: {
          ...stats.topics,
          [generatedRound.topic]: {
            ...topic,
            shown: topic.shown + 1,
            lastSeenAt: startedAt,
          },
        },
        recentTargets: [...stats.recentTargets, generatedRound.targetItemId].slice(-20),
        recentTopics: [...stats.recentTopics, generatedRound.topic].slice(-20),
        lastTargetId: generatedRound.targetItemId,
      };
    });
  };

  const markRoundCorrect = (currentRound: RoundDefinition, responseMs: number): void => {
    updateActiveStats((stats) => {
      const item = ensureItemStat(stats, currentRound.targetItemId, Date.now());
      const topic = ensureTopicStat(stats, currentRound.topic, Date.now());
      const nextAvg = item.correct === 0 ? responseMs : item.avgTimeMs * 0.7 + responseMs * 0.3;
      return {
        ...stats,
        items: {
          ...stats.items,
          [currentRound.targetItemId]: {
            ...item,
            correct: item.correct + 1,
            avgTimeMs: nextAvg,
          },
        },
        topics: {
          ...stats.topics,
          [currentRound.topic]: {
            ...topic,
            correct: topic.correct + 1,
          },
        },
        progression:
          route.params.mode === "progression"
            ? applyCorrectToProgression(stats.progression)
            : stats.progression,
      };
    });
  };

  const markRoundTimeout = (currentRound: RoundDefinition): void => {
    updateActiveStats((stats) => {
      const item = ensureItemStat(stats, currentRound.targetItemId, Date.now());
      const topic = ensureTopicStat(stats, currentRound.topic, Date.now());
      return {
        ...stats,
        items: {
          ...stats.items,
          [currentRound.targetItemId]: {
            ...item,
            timeouts: item.timeouts + 1,
          },
        },
        topics: {
          ...stats.topics,
          [currentRound.topic]: {
            ...topic,
            timeouts: topic.timeouts + 1,
          },
        },
        progression:
          route.params.mode === "progression"
            ? applyNoClearToProgression(stats.progression)
            : stats.progression,
      };
    });
  };

  const startNextRound = (): void => {
    const profile = activeProfileRef.current;
    if (!profile) {
      return;
    }

    const topic =
      route.params.mode === "focus"
        ? route.params.topic
        : pickProgressionTopic({
            difficultyLevel: profile.stats.progression.difficultyLevel,
            recentTopics: profile.stats.recentTopics,
          });

    const topicDifficulty = getDifficultyForTopic(topic);
    const lowDifficultyRound = topicDifficulty === 0;
    const pool = getItemsForTopic(topic, profile.settings.wordList);
    const targetItemId = profile.settings.adaptivePracticeEnabled
      ? selectAdaptiveTarget({
          itemIds: pool,
          itemStats: profile.stats.items,
          recentTargets: profile.stats.recentTargets,
          lastTargetId: profile.stats.lastTargetId,
          streak: profile.stats.progression.streak,
        })
      : randomPickWithoutRepeat(pool, profile.stats.lastTargetId);

    const generated = generateRound({
      topic,
      timeoutMs: profile.settings.timeoutMs,
      difficulty: topicDifficulty,
      wordList: profile.settings.wordList,
      targetItemId,
    });

    const startedAt = Date.now();
    setWiggleTokens({});
    setLocked(false);
    roundResolvedRef.current = false;
    setRoundStartedAt(startedAt);
    setMemoryState(createMemoryPhaseState(startedAt, profile.settings.memoryMode && !lowDifficultyRound));
    setRound(generated);
    markRoundShown(generated, startedAt);
  };

  const resolveTimeout = (): void => {
    const currentRound = roundRef.current;
    if (!currentRound || roundResolvedRef.current) {
      return;
    }
    roundResolvedRef.current = true;
    setLocked(true);
    markRoundTimeout(currentRound);
    setTimeout(() => startNextRound(), 220);
  };

  const onSelectOption = (option: RoundOption): void => {
    const currentRound = roundRef.current;
    if (!currentRound || roundResolvedRef.current || locked) {
      return;
    }

    if (!isOptionsInteractive(memoryState)) {
      void Haptics.selectionAsync();
      return;
    }

    if (option.optionKey === currentRound.correctOptionKey) {
      roundResolvedRef.current = true;
      setLocked(true);
      setConfettiVisible(true);
      const responseMs = Date.now() - roundStartedAt;
      playYay();
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      markRoundCorrect(currentRound, responseMs);
      setTimeout(() => startNextRound(), 700);
      setTimeout(() => setConfettiVisible(false), 1200);
      return;
    }

    playWrong();
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setWiggleTokens((current) => ({
      ...current,
      [option.optionKey]: (current[option.optionKey] ?? 0) + 1,
    }));
  };

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(interval);
  }, []);

  const sessionKey =
    route.params.mode === "focus"
      ? `${activeProfile?.id ?? "none"}-focus-${route.params.topic}`
      : `${activeProfile?.id ?? "none"}-progression`;

  useEffect(() => {
    if (!activeProfileRef.current) {
      return;
    }
    startNextRound();
  }, [sessionKey]);

  useEffect(() => {
    if (!round || roundResolvedRef.current) {
      return;
    }
    setMemoryState((current) => advanceMemoryPhase(current, now, config));
    if (timerEnabled && now - roundStartedAt >= round.timeoutMs) {
      resolveTimeout();
    }
  }, [config, now, round, roundStartedAt, timerEnabled]);

  const timeLeftMs = round ? Math.max(0, round.timeoutMs - (now - roundStartedAt)) : 0;
  const timerProgress = round ? timeLeftMs / round.timeoutMs : 1;
  const promptHidden = isPromptHidden(memoryState, config.enabled);
  const interactionDisabled = locked || !round || !isOptionsInteractive(memoryState);

  const contentWidth = width - 24;
  const availableHeight = Math.max(420, height - insets.top - insets.bottom - 22);
  const promptHeight = Math.min(availableHeight * 0.3, 230);
  const timerHeight = timerEnabled ? 34 : 0;
  const gridDimension = Math.min(contentWidth, availableHeight - promptHeight - timerHeight - 102);
  const tileSize = Math.max(82, Math.floor((gridDimension - 12) / 2));
  const gridWidth = tileSize * 2 + 12;

  if (!activeProfile || !round || !settings) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor }]}>
        <View style={styles.loadingWrap}>
          <AppText weight="bold" style={styles.loadingText}>
            Preparing round...
          </AppText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor }]}>
      <View style={styles.topBar}>
        <IconButton icon="home" label="Home" onPress={() => navigation.replace("Home")} haptic="light" />
        <AppText weight="semibold" style={styles.hudText}>
          {settings.showHud ? `Score ${score} • Streak ${streak}` : route.params.mode === "focus" ? "Focus Mode" : "Progression Mode"}
        </AppText>
      </View>

      <View style={[styles.promptArea, { height: promptHeight }]}>
        <PromptPanel prompt={round.prompt} hidden={promptHidden} />
      </View>

      <View style={styles.gridSection}>
        {timerEnabled ? (
          <View style={styles.timerWrap}>
            <TimerBar progress={timerProgress} />
            <AppText weight="bold" style={styles.timerLabel}>
              {Math.ceil(timeLeftMs / 1000)}s
            </AppText>
          </View>
        ) : null}

        <View style={[styles.gridWrap, { width: gridWidth }]}>
          <QuadrantGrid
            options={round.options}
            disabled={interactionDisabled}
            wiggleTokens={wiggleTokens}
            tileSize={tileSize}
            onSelect={onSelectOption}
          />
        </View>
      </View>

      <ConfettiOverlay visible={confettiVisible} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 12,
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontSize: 19,
    color: "#21405F",
  },
  topBar: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  hudText: {
    color: "#21405F",
    fontSize: 18,
  },
  promptArea: {
    marginTop: 8,
  },
  gridSection: {
    flex: 1,
    alignItems: "center",
    paddingTop: 10,
  },
  timerWrap: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  timerLabel: {
    marginLeft: 8,
    minWidth: 36,
    textAlign: "right",
    color: "#21405F",
    fontSize: 18,
  },
  gridWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
});
