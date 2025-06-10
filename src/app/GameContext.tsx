"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type GameSettings = {
   numColors: number;
   numPegs: number;
   allowDuplicates: boolean;
};

export type GameState = {
   sessionId: string | null;
   guesses: string[];
   results: { blacks: number; whites: number }[];
   solution: string | null;
   status: "playing" | "won" | "lost";
};

export type GameContextType = {
   settings: GameSettings;
   setSettings: (settings: GameSettings) => void;
   game: GameState;
   setGame: (game: GameState) => void;
};

const defaultSettings: GameSettings = {
   numColors: 6,
   numPegs: 4,
   allowDuplicates: true,
};

const defaultGame: GameState = {
   sessionId: null,
   guesses: [],
   results: [],
   solution: null,
   status: "playing",
};

export const GameContext = createContext<GameContextType | undefined>(undefined);

export const useGameContext = () => {
   const context = useContext(GameContext);
   if (!context) throw new Error("useGameContext must be used within GameProvider");
   return context;
};

export const GameProvider = ({ children }: { children: ReactNode }) => {
   const [settings, setSettings] = useState<GameSettings>(() => {
      if (typeof window !== "undefined") {
         const stored = localStorage.getItem("mastermind_settings");
         if (stored) return JSON.parse(stored);
      }
      return defaultSettings;
   });
   const [game, setGame] = useState<GameState>(defaultGame);

   useEffect(() => {
      if (typeof window !== "undefined") {
         localStorage.setItem("mastermind_settings", JSON.stringify(settings));
      }
   }, [settings]);

   return (
      <GameContext.Provider value={{ settings, setSettings, game, setGame }}>
         {children}
      </GameContext.Provider>
   );
};
