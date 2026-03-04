import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Audio } from "expo-av";
import * as Speech from "expo-speech";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import ConfettiOverlay from "../components/ConfettiOverlay";
import PromptPanel from "../components/PromptPanel";
import QuadrantGrid from "../components/QuadrantGrid";
import TimerBar from "../components/TimerBar";
import { RootStackParamList } from "../app/navigation";
import { useAppContext } from "../app/AppContext";
import { selectAdaptiveTarget } from "../game/adaptive";
import { getDifficultyForTopic } from "../game/datasets";
import { generateRound, getItemsForTopic } from "../game/generator";
import { advanceMemoryPhase, createMemoryPhaseState, isOptionsInteractive, isPromptHidden } from "../game/memory";
import { applyCorrectToProgression, applyNoClearToProgression, pickProgressionTopic } from "../game/progression";
import { RoundDefinition, RoundOption } from "../game/types";
import NixFox from "../mascot/NixFox";
import { KidLearningStats } from "../storage/schema";

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
  const wiggleLastAtRef = useRef<Record<string, number>>({});
  const soundRef = useRef<Audio.Sound | null>(null);
  const tailSweep = useRef(new Animated.Value(0)).current;

  activeProfileRef.current = activeProfile;
  roundRef.current = round;

  const settings = activeProfile?.settings;
  const score = activeProfile?.stats.progression.score ?? 0;
  const streak = activeProfile?.stats.progression.streak ?? 0;

  const config = useMemo(
    () => ({
      enabled: Boolean(settings?.memoryMode),
      previewMs: settings?.previewMs ?? 1500,
      helpMs: settings?.helpMs ?? 6000,
      hintMs: settings?.hintMs ?? 800,
    }),
    [settings?.helpMs, settings?.hintMs, settings?.memoryMode, settings?.previewMs],
  );

  const playYay = async (): Promise<void> => {
    if (!settings?.soundEnabled) {
      return;
    }
    try {
      if (soundRef.current) {
        await soundRef.current.replayAsync();
      } else {
        Speech.speak("Yayy!");
      }
    } catch {
      Speech.speak("Yayy!");
    }
  };

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
      difficulty: getDifficultyForTopic(topic),
      wordList: profile.settings.wordList,
      targetItemId,
    });

    const startedAt = Date.now();
    setWiggleTokens({});
    setLocked(false);
    roundResolvedRef.current = false;
    setRoundStartedAt(startedAt);
    setMemoryState(createMemoryPhaseState(startedAt, profile.settings.memoryMode));
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
    setTimeout(() => {
      startNextRound();
    }, 260);
  };

  const onSelectOption = (option: RoundOption): void => {
    const currentRound = roundRef.current;
    if (!currentRound || roundResolvedRef.current || locked || !isOptionsInteractive(memoryState)) {
      return;
    }

    if (option.optionKey === currentRound.correctOptionKey) {
      roundResolvedRef.current = true;
      setLocked(true);
      setConfettiVisible(true);
      const responseMs = Date.now() - roundStartedAt;
      void playYay();
      markRoundCorrect(currentRound, responseMs);
      setTimeout(() => {
        startNextRound();
      }, 700);
      setTimeout(() => {
        setConfettiVisible(false);
      }, 1200);
      return;
    }

    const tappedAt = Date.now();
    const lastWiggle = wiggleLastAtRef.current[option.optionKey] ?? 0;
    if (tappedAt - lastWiggle >= 800) {
      wiggleLastAtRef.current[option.optionKey] = tappedAt;
      setTimeout(() => {
        setWiggleTokens((current) => ({
          ...current,
          [option.optionKey]: (current[option.optionKey] ?? 0) + 1,
        }));
      }, 400);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let mounted = true;
    Audio.Sound.createAsync(require("../../assets/audio/yay.mp3"))
      .then(({ sound }) => {
        if (mounted) {
          soundRef.current = sound;
        }
      })
      .catch(() => {
        soundRef.current = null;
      });
    return () => {
      mounted = false;
      if (soundRef.current) {
        void soundRef.current.unloadAsync();
      }
    };
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
    if (now - roundStartedAt >= round.timeoutMs) {
      resolveTimeout();
    }
  }, [config, now, round, roundStartedAt]);

  const timeLeftMs = round ? Math.max(0, round.timeoutMs - (now - roundStartedAt)) : 0;
  const timerProgress = round ? timeLeftMs / round.timeoutMs : 1;
  const promptHidden = isPromptHidden(memoryState, config.enabled);
  const interactionDisabled = locked || !round || !isOptionsInteractive(memoryState);

  useEffect(() => {
    if (!promptHidden) {
      tailSweep.stopAnimation();
      return;
    }
    tailSweep.setValue(0);
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(tailSweep, {
          toValue: 1,
          duration: 450,
          useNativeDriver: true,
        }),
        Animated.timing(tailSweep, {
          toValue: 0,
          duration: 450,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [promptHidden, tailSweep]);

  if (!activeProfile || !round || !settings) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingWrap}>
          <Text style={styles.loadingText}>Preparing round...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <Pressable style={styles.backButton} onPress={() => navigation.replace("Home")}>
          <Text style={styles.backText}>Home</Text>
        </Pressable>
        {settings.showHud ? (
          <Text style={styles.hudText}>Score {score} · Streak {streak}</Text>
        ) : (
          <Text style={styles.hudText}>{route.params.mode === "focus" ? "Focus Mode" : "Progression Mode"}</Text>
        )}
      </View>

      <View style={styles.promptArea}>
        <PromptPanel prompt={round.prompt} hidden={promptHidden} />
        <View style={styles.nixWrap}>
          <NixFox size={84} />
        </View>
        {promptHidden ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.tailCover,
              {
                transform: [
                  {
                    translateX: tailSweep.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-16, 18],
                    }),
                  },
                ],
              },
            ]}
          />
        ) : null}
      </View>

      <View style={styles.gridArea}>
        {settings.showTimer ? (
          <View style={styles.timerWrap}>
            <TimerBar progress={timerProgress} />
            <Text style={styles.timerLabel}>{Math.ceil(timeLeftMs / 1000)}s</Text>
          </View>
        ) : null}
        <QuadrantGrid options={round.options} disabled={interactionDisabled} wiggleTokens={wiggleTokens} onSelect={onSelectOption} />
      </View>

      <ConfettiOverlay visible={confettiVisible} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#EAF2FB",
    paddingHorizontal: 10,
    paddingTop: 6,
    paddingBottom: 12,
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontSize: 18,
    color: "#21405F",
    fontWeight: "700",
  },
  topBar: {
    height: "8%",
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    borderRadius: 999,
    backgroundColor: "#1A4D9C",
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  backText: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  hudText: {
    color: "#21405F",
    fontWeight: "800",
  },
  promptArea: {
    height: "20%",
    minHeight: 130,
    justifyContent: "center",
  },
  nixWrap: {
    position: "absolute",
    right: -4,
    bottom: -4,
  },
  tailCover: {
    position: "absolute",
    right: 58,
    top: "32%",
    width: 96,
    height: 54,
    borderTopLeftRadius: 26,
    borderBottomLeftRadius: 30,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 16,
    backgroundColor: "rgba(242, 141, 59, 0.7)",
  },
  gridArea: {
    height: "72%",
    paddingTop: 8,
    width: "100%",
  },
  timerWrap: {
    marginBottom: 8,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
  },
  timerLabel: {
    marginLeft: 8,
    color: "#21405F",
    fontWeight: "800",
    minWidth: 34,
    textAlign: "right",
  },
});
