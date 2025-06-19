"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: number;
  username: string;
  email?: string;
  isAdmin: boolean;
}

interface GameState {
  currentRoom: string;
  inventory: string[];
  progress: Record<string, any>;
  money: number;
  experiencePoints: number;
  level: number;
  currentMission?: string | null;
}

interface RoomData {
  roomId: string;
  name: string;
  description: string;
  backgroundImage?: string;
  ambientSound?: string;
  connections: Record<string, any>;
  requiredLevel: number;
  isLocked: boolean;
}

interface MissionData {
  missionId: string;
  name: string;
  description: string;
  difficulty: number;
  requiredLevel: number;
  rewardMoney: number;
  rewardExp: number;
}

interface SolvedPuzzle {
  puzzleId: string;
  completedAt: string;
  attempts: number;
  bestTimeSeconds?: number;
}

interface PlayerStats {
  puzzlesSolved: number;
  roomsVisited: number;
  missionsCompleted: number;
  totalMoneyEarned: number;
  totalExpEarned: number;
  playTimeMinutes: number;
}

interface GameContextType {
  user: User | null;
  gameState: GameState | null;
  roomData: RoomData | null;
  missionData: MissionData | null;
  solvedPuzzles: SolvedPuzzle[];
  playerStats: PlayerStats | null;
  isLoading: boolean;
  hasGameProgress: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  startNewGame: () => Promise<void>;
  continueGame: () => Promise<void>;
  checkGameProgress: () => Promise<boolean>;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [missionData, setMissionData] = useState<MissionData | null>(null);
  const [solvedPuzzles, setSolvedPuzzles] = useState<SolvedPuzzle[]>([]);
  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasGameProgress, setHasGameProgress] = useState(false);

  // Beim Laden prüfen, ob User angemeldet ist
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/verify', {
        method: 'GET',
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        
        // Spielstand prüfen
        await checkGameProgress();
      } else {
        // Explizit User auf null setzen wenn nicht angemeldet
        setUser(null);
        setGameState(null);
        setHasGameProgress(false);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      // Bei Fehler auch User auf null setzen
      setUser(null);
      setGameState(null);
      setHasGameProgress(false);
    } finally {
      setIsLoading(false);
    }
  };

  const checkGameProgress = async (): Promise<boolean> => {
    if (!user) {
      setGameState(null);
      setRoomData(null);
      setMissionData(null);
      setSolvedPuzzles([]);
      setPlayerStats(null);
      setHasGameProgress(false);
      return false;
    }

    try {
      const response = await fetch('/api/game/state', {
        method: 'GET',
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setGameState(data.gameState);
        setRoomData(data.roomData);
        setMissionData(data.missionData);
        setSolvedPuzzles(data.solvedPuzzles || []);
        setPlayerStats(data.playerStats);
        setHasGameProgress(data.hasGameProgress);
        return data.hasGameProgress;
      } else {
        setGameState(null);
        setRoomData(null);
        setMissionData(null);
        setSolvedPuzzles([]);
        setPlayerStats(null);
        setHasGameProgress(false);
        return false;
      }
    } catch (error) {
      console.error('Game progress check failed:', error);
      setGameState(null);
      setRoomData(null);
      setMissionData(null);
      setSolvedPuzzles([]);
      setPlayerStats(null);
      setHasGameProgress(false);
      return false;
    }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (data.success) {
        setUser(data.user);
        await checkGameProgress();
        return true;
      } else {
        // Bei fehlgeschlagener Anmeldung User-Status zurücksetzen
        setUser(null);
        setGameState(null);
        setRoomData(null);
        setMissionData(null);
        setSolvedPuzzles([]);
        setPlayerStats(null);
        setHasGameProgress(false);
        return false;
      }
    } catch (error) {
      console.error('Login failed:', error);
      // Bei Fehler User-Status zurücksetzen
      setUser(null);
      setGameState(null);
      setRoomData(null);
      setMissionData(null);
      setSolvedPuzzles([]);
      setPlayerStats(null);
      setHasGameProgress(false);
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setUser(null);
      setGameState(null);
      setRoomData(null);
      setMissionData(null);
      setSolvedPuzzles([]);
      setPlayerStats(null);
      setHasGameProgress(false);
      router.push('/');
    }
  };

  const startNewGame = async (): Promise<void> => {
    try {
      const response = await fetch('/api/game/start', {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        
        // Spielstand im Context aktualisieren
        setGameState(data.gameState);
        setRoomData(data.roomData);
        setMissionData(null); // Neues Spiel = keine Mission
        setSolvedPuzzles([]);
        setPlayerStats(null);
        setHasGameProgress(false); // Neues Spiel = kein Fortschritt
        
        router.push('/game');
      } else {
        console.error('Failed to start new game');
      }
    } catch (error) {
      console.error('Start new game failed:', error);
    }
  };

  const continueGame = async (): Promise<void> => {
    if (hasGameProgress) {
      router.push('/game');
    }
  };

  const value: GameContextType = {
    user,
    gameState,
    roomData,
    missionData,
    solvedPuzzles,
    playerStats,
    isLoading,
    hasGameProgress,
    login,
    logout,
    startNewGame,
    continueGame,
    checkGameProgress
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
} 