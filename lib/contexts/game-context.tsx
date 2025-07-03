"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getSavePoints } from '@/lib/services/save-service';

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
  bitcoins: number;
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
  rewardBitcoins: number;
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
  totalBitcoinsEarned: number;
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
  hasSkippedIntro: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  startNewGame: () => Promise<void>;
  continueGame: () => Promise<void>;
  checkGameProgress: () => Promise<boolean>;
  loadRoomData: (roomId: string) => Promise<{
    room: any;
    puzzles: any[];
    items: any[];
    mission: any;
  } | null>;
}

type View = "apartment" | "smartphone" | "basement" | "city";
type TimeOfDay = "day" | "night";

export interface StoryPopup {
  id: string;
  title?: string;
  content: string[];
  type: "text" | "dialog" | "voiceMessage" | "mission";
  speaker?: string;
  image?: string;
}
export interface ChatMessage {
  id: string;
  sender: string;
  content: string;
  timestamp: string;
  isSystem?: boolean;
}
export interface ChatGroup {
  id: string;
  name: string;
  isFavorite?: boolean;
  description: string;
  messages: ChatMessage[];
  unreadCount?: number;
}
export interface MoneyNotification {
  id: string;
  amount: number;
  message: string;
  timestamp: string;
}
export interface Mission {
  id: string;
  title: string;
  description: string;
  reward: number;
  type: "guided" | "terminal";
  steps?: any[];
  commands?: string[];
}
export interface AlarmLevelNotification {
  id: string;
  level: number;
  message: string;
  timestamp: string;
  isFirstTime: boolean;
}
export interface LifeLostNotification {
  id: string;
  message: string;
  timestamp: string;
}

interface ExtendedGameContextType extends GameContextType {
  currentView: View;
  setCurrentView: (view: View) => void;
  day: number;
  incrementDay: () => void;
  timeOfDay: TimeOfDay;
  toggleTimeOfDay: () => void;
  gameTime: number;
  bitcoinBalance: number;
  setBitcoinBalance: (balance: number) => void;
  bitcoinRate: number;
  updateBitcoinBalance: (amount: number, message?: string, skipBackend?: boolean) => void;
  terminalHistory: string[];
  addTerminalCommand: (command: string) => void;
  messages: { sender: string; content: string; timestamp: string }[];
  addMessage: (sender: string, content: string) => void;
  currentStory: StoryPopup | null;
  setCurrentStory: (story: StoryPopup | null) => void;
  showStory: (story: StoryPopup) => void;
  chatGroups: ChatGroup[];
  currentChatGroup: string;
  setCurrentChatGroup: (groupId: string) => void;
  addChatMessage: (groupId: string, message: ChatMessage) => void;
  currentMission: string | null;
  setCurrentMission: (missionId: string | null) => void;
  completedMissions: string[];
  completeMission: (missionId: string) => void;
  moneyNotifications: MoneyNotification[];
  addMoneyNotification: (amount: number, message: string) => void;
  removeMoneyNotification: (id: string) => void;
  testMoneyNotification: () => void;
  missions: Mission[];
  getMission: (id: string) => Mission | undefined;
  alarmLevel: number;
  increaseAlarmLevel: (reason: string) => void;
  resetAlarmLevel: () => void;
  alarmNotifications: AlarmLevelNotification[];
  removeAlarmNotification: (id: string) => void;
  isGameOver: boolean;
  resetGame: () => void;
}

const GameContext = createContext<ExtendedGameContextType | undefined>(undefined);

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
  const [hasSkippedIntro, setHasSkippedIntro] = useState(false);
  const [currentView, setCurrentView] = useState<View>("apartment");
  const [day, setDay] = useState(1);
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>("day");
  const [gameTime, setGameTime] = useState(480); // Start bei 8:00 Uhr (480 Minuten)
  const [bitcoinBalance, setBitcoinBalance] = useState(0);
  const [bitcoinRate, setBitcoinRate] = useState(59000);
  const [terminalHistory, setTerminalHistory] = useState<string[]>([]);
  const [messages, setMessages] = useState<{ sender: string; content: string; timestamp: string }[]>([]);
  const [currentStory, setCurrentStory] = useState<StoryPopup | null>(null);
  const [chatGroups, setChatGroups] = useState<ChatGroup[]>([]);
  const [currentChatGroup, setCurrentChatGroup] = useState<string>("");
  const [currentMission, setCurrentMission] = useState<string | null>(null);
  const [completedMissions, setCompletedMissions] = useState<string[]>([]);
  const [moneyNotifications, setMoneyNotifications] = useState<MoneyNotification[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [alarmLevel, setAlarmLevel] = useState(0);
  const [alarmNotifications, setAlarmNotifications] = useState<AlarmLevelNotification[]>([]);
  const [isGameOver, setIsGameOver] = useState(false);

  const incrementDay = () => setDay((prev) => prev + 1);
  const toggleTimeOfDay = () => setTimeOfDay((prev) => (prev === "day" ? "night" : "day"));
  const addTerminalCommand = (command: string) => setTerminalHistory((prev) => [...prev, command]);
  const addMessage = (sender: string, content: string) => setMessages((prev) => [...prev, { sender, content, timestamp: new Date().toISOString() }]);
  const showStory = (story: StoryPopup) => setCurrentStory(story);
  const addChatMessage = (groupId: string, message: ChatMessage) => {/* Dummy */};
  const completeMission = (missionId: string) => {/* Dummy */};
  const addMoneyNotification = (amount: number, message: string) => {/* Dummy */};
  const removeMoneyNotification = (id: string) => {/* Dummy */};
  const testMoneyNotification = () => {/* Dummy */};
  const getMission = (id: string) => missions.find(m => m.id === id);
  const increaseAlarmLevel = (reason: string) => {/* Dummy */};
  const resetAlarmLevel = () => {/* Dummy */};
  const removeAlarmNotification = (id: string) => {/* Dummy */};
  const resetGame = () => {/* Dummy */};
  const updateBitcoinBalance = (amount: number, message?: string, skipBackend?: boolean) => {/* Dummy */};

  const checkGameProgress = useCallback(async (): Promise<boolean> => {
    console.log('checkGameProgress called, user:', user);
    
    if (!user) {
      console.log('No user, setting hasGameProgress to false');
      setGameState(null);
      setRoomData(null);
      setMissionData(null);
      setSolvedPuzzles([]);
      setPlayerStats(null);
      setHasGameProgress(false);
      return false;
    }

    try {
      console.log('Fetching game state from API...');
      const response = await fetch('/api/game/state', {
        method: 'GET',
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Game state API response:', data);
        console.log('API says hasGameProgress:', data.hasGameProgress);
        
        setGameState(data.gameState);
        setRoomData(data.roomData);
        setMissionData(data.missionData);
        setSolvedPuzzles(data.solvedPuzzles || []);
        setPlayerStats(data.playerStats);
        setHasGameProgress(data.hasGameProgress);
        
        console.log('Setting hasGameProgress to:', data.hasGameProgress);
        console.log('Game state:', data.gameState);
        console.log('Solved puzzles:', data.solvedPuzzles);
        
        return data.hasGameProgress;
      } else {
        console.log('Game state API failed:', response.status, response.statusText);
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
  }, [user]);

  const checkAuthStatus = useCallback(async () => {
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
  }, [checkGameProgress]);

  const checkIntroSkipped = useCallback(async () => {
    try {
      if (!user) return;
      const result = await getSavePoints(user.id);
      if (result.success && result.savePoints) {
        const found = result.savePoints.some(sp => sp.eventType === 'game_started');
        console.log('Intro-Speicherpunkt gefunden:', found, result.savePoints);
        setHasSkippedIntro(found);
      }
    } catch (e) {
      setHasSkippedIntro(false);
    }
  }, [user]);

  // Beim Laden prüfen, ob User angemeldet ist
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  // Prüfe Intro-Speicherpunkt, sobald User gesetzt ist
  useEffect(() => {
    if (user) {
      checkIntroSkipped();
    }
  }, [user, checkIntroSkipped]);

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
    if (hasGameProgress && gameState) {
      // Spielstandsdaten als URL-Parameter übergeben
      const params = new URLSearchParams({
        continue: 'true',
        room: gameState.currentRoom,
        bitcoins: gameState.bitcoins.toString(),
        exp: gameState.experiencePoints.toString(),
        level: gameState.level.toString()
      });
      
      if (gameState.currentMission) {
        params.append('mission', gameState.currentMission);
      }
      
      router.push(`/game?${params.toString()}`);
    }
  };

  const loadRoomData = async (roomId: string): Promise<{
    room: any;
    puzzles: any[];
    items: any[];
    mission: any;
  } | null> => {
    try {
      const response = await fetch(`/api/game/room?roomId=${encodeURIComponent(roomId)}`, {
        method: 'GET',
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        return {
          room: data.room,
          puzzles: data.puzzles,
          items: data.items,
          mission: data.mission
        };
      } else {
        console.error('Failed to load room data');
        return null;
      }
    } catch (error) {
      console.error('Loading room data failed:', error);
      return null;
    }
  };

  const value: ExtendedGameContextType = {
    currentView, setCurrentView,
    day, incrementDay,
    timeOfDay, toggleTimeOfDay,
    gameTime,
    bitcoinBalance, setBitcoinBalance, bitcoinRate, updateBitcoinBalance,
    terminalHistory, addTerminalCommand,
    messages, addMessage,
    currentStory, setCurrentStory, showStory,
    chatGroups, currentChatGroup, setCurrentChatGroup, addChatMessage,
    currentMission, setCurrentMission, completedMissions, completeMission,
    moneyNotifications, addMoneyNotification, removeMoneyNotification, testMoneyNotification,
    missions, getMission,
    alarmLevel, increaseAlarmLevel, resetAlarmLevel, alarmNotifications, removeAlarmNotification,
    isGameOver, resetGame,
    user,
    gameState,
    roomData,
    missionData,
    solvedPuzzles,
    playerStats,
    isLoading,
    hasGameProgress,
    hasSkippedIntro,
    login,
    logout,
    startNewGame,
    continueGame,
    checkGameProgress,
    loadRoomData
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

export function useGameState() {
  return useGame();
} 