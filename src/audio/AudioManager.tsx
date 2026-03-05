import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from "expo-av";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAppContext } from "../app/AppContext";

interface AudioManagerValue {
  ready: boolean;
  playUiPop: () => void;
  playWrong: () => void;
  playYay: () => void;
}

const AudioManagerContext = createContext<AudioManagerValue | undefined>(undefined);

async function replay(sound: Audio.Sound | null): Promise<void> {
  if (!sound) {
    return;
  }
  try {
    await sound.replayAsync();
  } catch {
    // Ignore transient audio errors so interaction remains responsive.
  }
}

export function AudioManagerProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const { activeProfile } = useAppContext();
  const [ready, setReady] = useState(false);
  const musicRef = useRef<Audio.Sound | null>(null);
  const uiPopRef = useRef<Audio.Sound | null>(null);
  const wrongRef = useRef<Audio.Sound | null>(null);
  const yayRef = useRef<Audio.Sound | null>(null);

  const soundEnabled = activeProfile?.settings.soundEnabled ?? true;
  const musicMuted = activeProfile?.settings.musicMuted ?? false;

  useEffect(() => {
    let mounted = true;

    const loadAudio = async (): Promise<void> => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          interruptionModeIOS: InterruptionModeIOS.DuckOthers,
          interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
        });

        const [music, pop, wrong, yay] = await Promise.all([
          Audio.Sound.createAsync(require("../../assets/audio/music_loop.mp3"), {
            volume: 0.16,
            isLooping: true,
            shouldPlay: false,
          }),
          Audio.Sound.createAsync(require("../../assets/audio/ui_pop.wav"), { volume: 0.28, shouldPlay: false }),
          Audio.Sound.createAsync(require("../../assets/audio/wrong_boop.wav"), { volume: 0.22, shouldPlay: false }),
          Audio.Sound.createAsync(require("../../assets/audio/yayy.wav"), { volume: 0.36, shouldPlay: false }),
        ]);

        if (!mounted) {
          await Promise.all([
            music.sound.unloadAsync(),
            pop.sound.unloadAsync(),
            wrong.sound.unloadAsync(),
            yay.sound.unloadAsync(),
          ]);
          return;
        }

        musicRef.current = music.sound;
        uiPopRef.current = pop.sound;
        wrongRef.current = wrong.sound;
        yayRef.current = yay.sound;
      } catch {
        musicRef.current = null;
        uiPopRef.current = null;
        wrongRef.current = null;
        yayRef.current = null;
      } finally {
        if (mounted) {
          setReady(true);
        }
      }
    };

    void loadAudio();

    return () => {
      mounted = false;
      const sounds = [musicRef.current, uiPopRef.current, wrongRef.current, yayRef.current];
      sounds.forEach((sound) => {
        if (sound) {
          void sound.unloadAsync();
        }
      });
    };
  }, []);

  useEffect(() => {
    if (!musicRef.current) {
      return;
    }
    if (musicMuted) {
      void musicRef.current.pauseAsync().catch(() => undefined);
      return;
    }
    void musicRef.current.playAsync().catch(() => undefined);
  }, [musicMuted, ready]);

  const playUiPop = useCallback(() => {
    if (!soundEnabled) {
      return;
    }
    void replay(uiPopRef.current);
  }, [soundEnabled]);

  const playWrong = useCallback(() => {
    if (!soundEnabled) {
      return;
    }
    void replay(wrongRef.current);
  }, [soundEnabled]);

  const playYay = useCallback(() => {
    if (!soundEnabled) {
      return;
    }
    void replay(yayRef.current);
  }, [soundEnabled]);

  const value = useMemo(
    () => ({
      ready,
      playUiPop,
      playWrong,
      playYay,
    }),
    [playUiPop, playWrong, playYay, ready],
  );

  return <AudioManagerContext.Provider value={value}>{children}</AudioManagerContext.Provider>;
}

export function useAudioManager(): AudioManagerValue {
  const context = useContext(AudioManagerContext);
  if (!context) {
    throw new Error("useAudioManager must be used inside AudioManagerProvider.");
  }
  return context;
}
