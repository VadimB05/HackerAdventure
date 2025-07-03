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
  checkGameProgress: (userOverride?: User | null) => Promise<boolean>;
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
export interface AlarmNotifyNotification {
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
  increaseAlarmLevel: (reason: string, puzzleName?: string) => void;
  resetAlarmLevel: () => void;
  alarmNotifications: AlarmLevelNotification[];
  removeAlarmNotification: (id: string) => void;
  showAlarmLevelModal: boolean;
  alarmLevelModalData: {
    alarmLevel: number;
    puzzleName: string;
  } | null;
  closeAlarmLevelModal: () => void;
  isGameOver: boolean;
  resetGame: () => void;
  alarmNotifyNotifications: AlarmNotifyNotification[];
  addAlarmNotifyNotification: (message: string) => void;
  removeAlarmNotifyNotification: (id: string) => void;
}

const GameContext = createContext<ExtendedGameContextType | undefined>(undefined);

export function GameProvider({
  children,
  continueGame = false,
  initialRoom = "intro",
  initialBitcoins = 0,
  initialExp = 0,
  initialLevel = 1,
  initialMission = null
}: {
  children: React.ReactNode;
  continueGame?: boolean;
  initialRoom?: string;
  initialBitcoins?: number;
  initialExp?: number;
  initialLevel?: number;
  initialMission?: string | null;
}) {
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
  const [showAlarmLevelModal, setShowAlarmLevelModal] = useState(false);
  const [alarmLevelModalData, setAlarmLevelModalData] = useState<{
    alarmLevel: number;
    puzzleName: string;
  } | null>(null);
  const [alarmNotifyNotifications, setAlarmNotifyNotifications] = useState<AlarmNotifyNotification[]>([]);

  const incrementDay = () => setDay((prev) => prev + 1);
  const toggleTimeOfDay = () => setTimeOfDay((prev) => (prev === "day" ? "night" : "day"));
  const addTerminalCommand = (command: string) => setTerminalHistory((prev) => [...prev, command]);
  const addMessage = (sender: string, content: string) => setMessages((prev) => [...prev, { sender, content, timestamp: new Date().toISOString() }]);
  const showStory = (story: StoryPopup) => setCurrentStory(story);
  
  const addChatMessage = useCallback((groupId: string, message: ChatMessage) => {
    setChatGroups(prev => prev.map(group => 
      group.id === groupId 
        ? { ...group, messages: [...group.messages, message] }
        : group
    ));
  }, []);
  
  const completeMission = useCallback((missionId: string) => {
    setCompletedMissions(prev => [...prev, missionId]);
  }, []);
  
  const addMoneyNotification = useCallback((amount: number, message: string) => {
    const notification: MoneyNotification = {
      id: Date.now().toString(),
      amount,
      message,
      timestamp: new Date().toISOString()
    };
    setMoneyNotifications(prev => [...prev, notification]);
    
    // Automatisch nach 5 Sekunden entfernen
    setTimeout(() => {
      setMoneyNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  }, []);
  
  const removeMoneyNotification = useCallback((id: string) => {
    setMoneyNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);
  
  const testMoneyNotification = useCallback(() => {
    addMoneyNotification(0.001, 'Test-Belohnung erhalten!');
  }, [addMoneyNotification]);

  const getMission = (id: string) => missions.find(m => m.id === id);

  const increaseAlarmLevel = useCallback(async (reason: string, puzzleName?: string) => {
    try {
      if (!user) return;
      
      const response = await fetch('/api/game/alarm-level', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          userId: user.id,
          reason,
          puzzleId: null,
          missionId: null
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const newLevel = data.newLevel;
          const wasFirstTime = alarmLevel === 0;
          
          setAlarmLevel(newLevel);
          
          // Benachrichtigung hinzufügen
          const notification: AlarmLevelNotification = {
            id: Date.now().toString(),
            level: newLevel,
            message: reason,
            timestamp: new Date().toISOString(),
            isFirstTime: wasFirstTime
          };
          
          setAlarmNotifications(prev => [...prev, notification]);
          
          // Beim ersten Alarm-Level: Modal anzeigen
          if (wasFirstTime && puzzleName) {
            setAlarmLevelModalData({
              alarmLevel: newLevel,
              puzzleName
            });
            setShowAlarmLevelModal(true);
          }
          
          // Bei Level 10: Game Over
          if (newLevel >= 10) {
            setIsGameOver(true);
          }
          
          console.log(`Alarm-Level erhöht auf ${newLevel}: ${reason}`);
        }
      }
    } catch (error) {
      console.error('Fehler beim Erhöhen des Alarm-Levels:', error);
    }
  }, [user, alarmLevel]);

  const resetAlarmLevel = useCallback(async () => {
    try {
      if (!user) return;
      
      const response = await fetch('/api/game/alarm-level', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          userId: user.id
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAlarmLevel(0);
          setAlarmNotifications([]);
          console.log('Alarm-Level zurückgesetzt');
        }
      }
    } catch (error) {
      console.error('Fehler beim Zurücksetzen des Alarm-Levels:', error);
    }
  }, [user]);

  const removeAlarmNotification = useCallback((id: string) => {
    setAlarmNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const closeAlarmLevelModal = useCallback(() => {
    setShowAlarmLevelModal(false);
    setAlarmLevelModalData(null);
  }, []);

  const resetGame = useCallback(() => {
    setIsGameOver(false);
    setAlarmLevel(0);
    setAlarmNotifications([]);
    // Weitere Reset-Logik hier...
  }, []);
  
  const updateBitcoinBalance = useCallback(async (amount: number, message?: string, skipBackend?: boolean) => {
    const newBalance = bitcoinBalance + amount;
    setBitcoinBalance(newBalance);
    
    if (message && amount > 0) {
      const notification: MoneyNotification = {
        id: Date.now().toString(),
        amount,
        message,
        timestamp: new Date().toISOString()
      };
      setMoneyNotifications(prev => [...prev, notification]);
      
      // Automatisch nach 5 Sekunden entfernen
      setTimeout(() => {
        setMoneyNotifications(prev => prev.filter(n => n.id !== notification.id));
      }, 5000);
    }
    
    if (!skipBackend && user) {
      try {
        await fetch('/api/game/save', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            userId: user.id,
            bitcoins: newBalance
          }),
        });
      } catch (error) {
        console.error('Fehler beim Speichern des Bitcoin-Guthabens:', error);
      }
    }
  }, [bitcoinBalance, user]);

  const checkGameProgress = async (userOverride?: User | null): Promise<boolean> => {
    console.log('checkGameProgress called, user:', userOverride || user);
    if (!userOverride && !user) {
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
      setGameState(null);
      setRoomData(null);
      setMissionData(null);
      setSolvedPuzzles([]);
      setPlayerStats(null);
      setHasGameProgress(false);
      return false;
    }
  };

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
        await checkGameProgress(data.user);
        // Alarm-Level abrufen
        await loadAlarmLevel(data.user.id);
      } else {
        setUser(null);
        setGameState(null);
        setHasGameProgress(false);
      }
    } catch (error) {
      setUser(null);
      setGameState(null);
      setHasGameProgress(false);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAlarmLevel = async (userId: number) => {
    try {
      const response = await fetch(`/api/game/alarm-level?userId=${userId}`, {
        method: 'GET',
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.stats) {
          setAlarmLevel(data.stats.current_alarm_level);
        }
      }
    } catch (error) {
      console.error('Fehler beim Laden des Alarm-Levels:', error);
    }
  };

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        await checkGameProgress(data.user);
        await loadAlarmLevel(data.user.id);
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

  const addAlarmNotifyNotification = useCallback((message: string) => {
    // Alarm-Level sofort neu laden, bevor das Notify angezeigt wird
    if (user) {
      loadAlarmLevel(user.id);
    }
    const notification: AlarmNotifyNotification = {
      id: Date.now().toString(),
      message,
      timestamp: new Date().toISOString()
    };
    setAlarmNotifyNotifications(prev => [...prev, notification]);
    setTimeout(() => {
      setAlarmNotifyNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 4000);
  }, [user]);

  const removeAlarmNotifyNotification = useCallback((id: string) => {
    setAlarmNotifyNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

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
        showAlarmLevelModal, alarmLevelModalData, closeAlarmLevelModal,
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
    checkGameProgress,
    loadRoomData,
    alarmNotifyNotifications,
    addAlarmNotifyNotification,
    removeAlarmNotifyNotification
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