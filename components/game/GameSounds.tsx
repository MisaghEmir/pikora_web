
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type SoundName =
  | "chip"
  | "card"
  | "fold"
  | "check"
  | "call"
  | "raise"
  | "win"
  | "lose"
  | "yourTurn";

type GameSoundsContextType = {
  playSound: (name: SoundName) => void;
  muted: boolean;
  volume: number;
  toggleMute: () => void;
  setVolume: (value: number) => void;
};

const soundFiles: Record<SoundName, string> = {
  chip: "/sounds/chipMedium.mp3",
  card: "/sounds/Card.mp3",
  fold: "/sounds/fold.mp3",
  check: "/sounds/check.mp3",
  call: "/sounds/check.mp3",
  raise: "/sounds/AllIn.mp3",
  win: "/sounds/win.wav",
  yourTurn: "/sounds/your-turn.wav",
  lose: "/sounds/lose.wav",
};

const GameSoundsContext =
  createContext<GameSoundsContextType | null>(null);

export function GameSoundsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.5);

  const playSound = useCallback(
    (name: SoundName) => {
      if (muted) return;

      const audio = new Audio(soundFiles[name]);
      audio.volume = volume;

      audio.play().catch((error) => {
        console.warn("Sound playback failed:", error);
      });
    },
    [muted, volume]
  );

  const toggleMute = useCallback(() => {
    setMuted((prev) => !prev);
  }, []);

  const value = useMemo(
    () => ({
      playSound,
      muted,
      volume,
      toggleMute,
      setVolume,
    }),
    [playSound, muted, volume, toggleMute]
  );

  return (
    <GameSoundsContext.Provider value={value}>
      {children}
    </GameSoundsContext.Provider>
  );
}

export function useGameSounds() {
  const context = useContext(GameSoundsContext);

  if (!context) {
    throw new Error(
      "useGameSounds must be used inside GameSoundsProvider"
    );
  }

  return context;
}
