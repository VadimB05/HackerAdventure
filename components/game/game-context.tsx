"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

// Ändere die View-Typen, um "city" hinzuzufügen
type View = "apartment" | "terminal" | "smartphone" | "darkroom" | "basement" | "city"
type TimeOfDay = "day" | "night"
type MentalState = "normal" | "paranoid" | "sleep-deprived" | "focused"

// Neue Typen für Entscheidungen
export interface DecisionOption {
  id: string
  text: string
  consequence: string
}

export interface Decision {
  id: string
  title: string
  description: string
  options: DecisionOption[]
}

export interface PlayerDecision {
  decisionId: string
  optionId: string
  timestamp: string
  consequence: string
}

// Neue Typen für Story-Elemente
export interface StoryPopup {
  id: string
  title?: string
  content: string[]
  type: "text" | "dialog" | "voiceMessage" | "mission"
  speaker?: string
  image?: string
}

// Neue Typen für Chat-Gruppen
export interface ChatMessage {
  id: string
  sender: string
  content: string
  timestamp: string
  isSystem?: boolean
}

export interface ChatGroup {
  id: string
  name: string
  isFavorite?: boolean
  description: string
  messages: ChatMessage[]
  unreadCount?: number
}

// Neue Typen für Geld-Benachrichtigungen
export interface MoneyNotification {
  id: string
  amount: number
  message: string
  timestamp: string
}

// Neue Typen für Missionen
export interface Mission {
  id: string
  title: string
  description: string
  reward: number
  type: "guided" | "terminal" // guided = mit UI-Hilfe, terminal = selbst eintippen
  steps?: MissionStep[]
  commands?: string[] // Für terminal-Missionen
}

export interface MissionStep {
  id: string
  title: string
  description: string
  command: string
  expectedOutput?: string
  hint?: string
  completed: boolean
}

// Neue Typen für Alarm-Level-System
export interface AlarmLevelNotification {
  id: string
  level: number
  message: string
  timestamp: string
  isFirstTime: boolean
}

// Neuer Typ für "Leben verloren"-Nachricht
export interface LifeLostNotification {
  id: string
  message: string
  timestamp: string
}

// Füge Entscheidungen zum GameContextType hinzu
interface GameContextType {
  currentView: View
  setCurrentView: (view: View) => void
  day: number
  incrementDay: () => void
  timeOfDay: TimeOfDay
  toggleTimeOfDay: () => void
  gameTime: number // Neue Spielzeit in Minuten
  bitcoinBalance: number
  setBitcoinBalance: (balance: number) => void
  bitcoinRate: number
  updateBitcoinBalance: (amount: number, message?: string, skipBackend?: boolean) => void
  mentalState: MentalState
  setMentalState: (state: MentalState) => void
  terminalHistory: string[]
  addTerminalCommand: (command: string) => void
  messages: { sender: string; content: string; timestamp: string }[]
  addMessage: (sender: string, content: string) => void
  // Neue Entscheidungsfunktionen
  currentDecision: Decision | null
  setCurrentDecision: (decision: Decision | null) => void
  playerDecisions: PlayerDecision[]
  makeDecision: (optionId: string) => void
  // Neue Story-Funktionen
  currentStory: StoryPopup | null
  setCurrentStory: (story: StoryPopup | null) => void
  showStory: (story: StoryPopup) => void
  // Neue Chat-Funktionen
  chatGroups: ChatGroup[]
  currentChatGroup: string
  setCurrentChatGroup: (groupId: string) => void
  addChatMessage: (groupId: string, message: ChatMessage) => void
  // Neue Hacking-Mission Funktionen
  currentMission: string | null
  setCurrentMission: (missionId: string | null) => void
  completedMissions: string[]
  completeMission: (missionId: string) => void
  // Neue Geld-Benachrichtigungen
  moneyNotifications: MoneyNotification[]
  addMoneyNotification: (amount: number, message: string) => void
  removeMoneyNotification: (id: string) => void
  testMoneyNotification: () => void
  // Neue Missionen
  missions: Mission[]
  getMission: (id: string) => Mission | undefined
  // Neue Alarm-Level-Funktionen
  alarmLevel: number
  increaseAlarmLevel: (reason: string) => void
  resetAlarmLevel: () => void
  alarmNotifications: AlarmLevelNotification[]
  removeAlarmNotification: (id: string) => void
  isGameOver: boolean
  resetGame: () => void
}

const GameContext = createContext<GameContextType | undefined>(undefined)

interface GameProviderProps {
  children: ReactNode;
  continueGame?: boolean;
  initialRoom?: string;
  initialBitcoins?: number;
  initialExp?: number;
  initialLevel?: number;
  initialMission?: string | null;
}

export function GameProvider({ 
  children, 
  continueGame = false,
  initialRoom = "intro",
  initialBitcoins = 0,
  initialExp = 0,
  initialLevel = 1,
  initialMission = null
}: GameProviderProps) {
  const [currentView, setCurrentView] = useState<View>(continueGame ? "apartment" : "apartment")
  const [day, setDay] = useState(1)
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>("day")
  const [gameTime, setGameTime] = useState(480) // Start bei 8:00 Uhr (480 Minuten)
  const [bitcoinBalance, setBitcoinBalance] = useState(continueGame ? initialBitcoins : 0)
  const [bitcoinRate, setBitcoinRate] = useState(59000) // Startpreis für 1 BTC in USD
  const [mentalState, setMentalState] = useState<MentalState>("normal")
  const [terminalHistory, setTerminalHistory] = useState<string[]>([])
  const [messages, setMessages] = useState<{ sender: string; content: string; timestamp: string }[]>([
    {
      sender: "DARKROOM",
      content: continueGame ? "Welcome back, n0seC. Your progress has been loaded." : "Welcome to INTRUSION, n0seC. Your first mission awaits. Check your terminal.",
      timestamp: new Date().toISOString(),
    },
  ])

  // Neue States für Entscheidungen
  const [currentDecision, setCurrentDecision] = useState<Decision | null>(null)
  const [playerDecisions, setPlayerDecisions] = useState<PlayerDecision[]>([])

  // Neue States für Story
  const [currentStory, setCurrentStory] = useState<StoryPopup | null>(null)

  // Neue States für Chat-Gruppen
  const [chatGroups, setChatGroups] = useState<ChatGroup[]>([
    {
      id: "crimenetwork",
      name: "CrimeNetwork",
      isFavorite: true,
      description: "Hauptkanal für illegale Aktivitäten und Aufträge",
      messages: [
        {
          id: "1",
          sender: "ShadowDealer",
          content: "NEW SHIPMENT: Premium Cocaine, 99% pure. DM for prices.",
          timestamp: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: "2",
          sender: "H4ckM4st3r",
          content: "Selling access to corporate networks. Starting at 0.05 BTC. Clean entry, no traces.",
          timestamp: new Date(Date.now() - 2400000).toISOString(),
        },
        {
          id: "3",
          sender: "GhostProxy",
          content: "VPN nodes available in 15 countries. Bulletproof hosting. 0.01 BTC/month.",
          timestamp: new Date(Date.now() - 1200000).toISOString(),
        },
        {
          id: "4",
          sender: "CryptoKing",
          content: "Money laundering service. 15% fee. No questions asked.",
          timestamp: new Date(Date.now() - 600000).toISOString(),
        },
        {
          id: "5",
          sender: "ADMIN",
          content: "Reminder: No feds, no scams. Violators will be permanently banned and doxxed.",
          timestamp: new Date(Date.now() - 300000).toISOString(),
          isSystem: true,
        },
        // Die DarkOperator-Nachricht wird jetzt dynamisch in der darknet-chat.tsx hinzugefügt
      ],
      unreadCount: 3,
    },
    {
      id: "marketplace",
      name: "Marketplace",
      description: "Kauf und Verkauf von Waren und Dienstleistungen",
      messages: [
        {
          id: "1",
          sender: "TechTrader",
          content: "Selling custom-modded smartphones. Untraceable, encrypted, ready to use.",
          timestamp: new Date(Date.now() - 4800000).toISOString(),
        },
        {
          id: "2",
          sender: "DataMerchant",
          content: "Fresh database dumps from major corporations. Credit cards, personal info, everything.",
          timestamp: new Date(Date.now() - 3600000).toISOString(),
        },
      ],
      unreadCount: 2,
    },
    {
      id: "hackerspace",
      name: "HackerSpace",
      description: "Diskussionen über Hacking-Techniken und Tools",
      messages: [
        {
          id: "1",
          sender: "RootKit",
          content: "Anyone tested the new kernel exploit? Looking for feedback before I use it on a job.",
          timestamp: new Date(Date.now() - 7200000).toISOString(),
        },
        {
          id: "2",
          sender: "BinaryNinja",
          content: "I've updated my bruteforce tool. Now 40% faster. Check my repo.",
          timestamp: new Date(Date.now() - 5400000).toISOString(),
        },
      ],
      unreadCount: 0,
    },
    {
      id: "servermarket",
      name: "Server Power",
      description: "Miete Rechenleistung für intensive Operationen",
      messages: [
        {
          id: "1",
          sender: "CloudMaster",
          content: "Offering 32-core servers for rent. Perfect for password cracking. 0.02 BTC/hour.",
          timestamp: new Date(Date.now() - 8600000).toISOString(),
        },
        {
          id: "2",
          sender: "NetGiant",
          content: "Botnet with 10,000+ nodes available for DDoS or distributed computing. PM for details.",
          timestamp: new Date(Date.now() - 7200000).toISOString(),
        },
      ],
      unreadCount: 0,
    },
  ])
  const [currentChatGroup, setCurrentChatGroup] = useState<string>("crimenetwork")

  // Neue States für Missionen
  const [currentMission, setCurrentMission] = useState<string | null>(continueGame ? initialMission : null)
  const [completedMissions, setCompletedMissions] = useState<string[]>([])

  // Neue States für Geld-Benachrichtigungen
  const [moneyNotifications, setMoneyNotifications] = useState<MoneyNotification[]>([])

  // Neue States für Alarm-Level-System
  const [alarmLevel, setAlarmLevel] = useState(0)
  const [alarmNotifications, setAlarmNotifications] = useState<AlarmLevelNotification[]>([])
  const [isGameOver, setIsGameOver] = useState(false)
  const [hasShownFirstAlarmExplanation, setHasShownFirstAlarmExplanation] = useState(false)

  // Missionen definieren
  const [missions, setMissions] = useState<Mission[]>([])

  // Funktion zum Abrufen einer Mission
  const getMission = (id: string) => {
    return missions.find(mission => mission.id === id)
  }

  // Funktion zum Treffen einer Entscheidung
  const makeDecision = (optionId: string) => {
    if (!currentDecision) return

    const selectedOption = currentDecision.options.find((option) => option.id === optionId)
    if (!selectedOption) return

    // Neue Entscheidung zum Log hinzufügen
    const newDecision: PlayerDecision = {
      decisionId: currentDecision.id,
      optionId: selectedOption.id,
      timestamp: new Date().toISOString(),
      consequence: selectedOption.consequence,
    }

    setPlayerDecisions((prev) => [...prev, newDecision])

    // Nachricht zur Konsequenz hinzufügen
    addMessage("SYSTEM", `Entscheidung: ${selectedOption.consequence}`)

    // Modal schließen
    setCurrentDecision(null)
  }

  // Funktion zum Anzeigen einer Story
  const showStory = (story: StoryPopup) => {
    setCurrentStory(story)
  }

  // Funktion zum Hinzufügen einer Chat-Nachricht
  const addChatMessage = (groupId: string, message: ChatMessage) => {
    setChatGroups((prevGroups) =>
      prevGroups.map((group) => {
        if (group.id === groupId) {
          return {
            ...group,
            messages: [...group.messages, message],
          }
        }
        return group
      }),
    )
  }

  // Funktion für standardmäßiges Feedback im Chat nach Jobabschluss
  const sendJobCompletionFeedback = (missionId: string, groupId = "crimenetwork") => {
    const mission = getMission(missionId)
    if (!mission) return

    // Verzögerung für natürlicheres Verhalten
    setTimeout(() => {
      // Auftraggeber gibt Feedback
      addChatMessage(groupId, {
        id: Date.now().toString(),
        sender: "DarkOperator",
        content: `n0seC hat den Job erledigt! Zahlung von ${mission.reward} BTC wurde überwiesen. Saubere Arbeit.`,
        timestamp: new Date().toISOString(),
      })

      // Andere Mitglieder loben den Spieler
      const feedbackMessages = [
        { sender: "H4ckM4st3r", content: `Nicht schlecht, n0seC. Schnell und sauber. Respekt.` },
        { sender: "CryptoKing", content: `Wir haben hier einen echten Profi. Gute Arbeit!` },
        { sender: "ByteWizard", content: `n0seC liefert immer ab. Deswegen arbeite ich gerne mit dir.` },
        { sender: "ShadowDealer", content: `Saubere Arbeit, n0seC. Meld dich, wenn du was brauchst.` },
        { sender: "GhostProxy", content: `Effizient und diskret. So muss das sein.` },
        { sender: "NetGiant", content: `Ich hab's dir gesagt, DarkOperator. n0seC ist der Richtige für den Job.` },
      ]

      // Wähle zufällig 2-3 Feedback-Nachrichten aus
      const selectedMessages = feedbackMessages
        .sort(() => Math.random() - 0.5)
        .slice(0, 2 + Math.floor(Math.random() * 2))

      // Sende die Nachrichten mit Verzögerung
      selectedMessages.forEach((msg, index) => {
        setTimeout(
          () => {
            addChatMessage(groupId, {
              id: Date.now().toString() + index,
              sender: msg.sender,
              content: msg.content,
              timestamp: new Date().toISOString(),
            })
          },
          2000 + index * 2000,
        )
      })

      // Nach einer Weile kommt die nächste Mission, wenn verfügbar
      const nextMissionId = getNextMission(missionId)
      if (nextMissionId) {
        setTimeout(() => {
          addChatMessage(groupId, {
            id: Date.now().toString() + "next",
            sender: "DarkOperator",
            content: `Ich habe noch einen Job für dich, n0seC. Interesse?`,
            timestamp: new Date().toISOString(),
          })
        }, 8000)
      }
    }, 2000)
  }

  // Hilfsfunktion, um die nächste verfügbare Mission zu finden
  const getNextMission = (currentMissionId: string): string | null => {
    const missionIds = missions.map((m) => m.id)
    const currentIndex = missionIds.indexOf(currentMissionId)
    if (currentIndex >= 0 && currentIndex < missionIds.length - 1) {
      return missionIds[currentIndex + 1]
    }
    return null
  }

  // Funktion zum Abschließen einer Mission
  const completeMission = (missionId: string) => {
    if (!completedMissions.includes(missionId)) {
      setCompletedMissions((prev) => [...prev, missionId])

      // Belohnung für die Mission
      const mission = getMission(missionId)
      if (mission) {
        updateBitcoinBalance(mission.reward, `Mission abgeschlossen: ${mission.title}`)

        // Standardmäßiges Feedback im Chat, wenn die Mission aus dem CrimeNetwork kam
        sendJobCompletionFeedback(missionId)
      }
    }
  }

  // Funktion zum Hinzufügen einer Geld-Benachrichtigung
  const addMoneyNotification = (amount: number | string, message: string) => {
    const safeAmount = Number(amount) || 0;
    console.log("addMoneyNotification:", safeAmount, typeof safeAmount, message);
    const newNotification: MoneyNotification = {
      id: Date.now().toString(),
      amount: safeAmount,
      message,
      timestamp: new Date().toISOString(),
    }
    setMoneyNotifications((prev) => [...prev, newNotification])
  }

  // Funktion zum Entfernen einer Geld-Benachrichtigung
  const removeMoneyNotification = (id: string) => {
    setMoneyNotifications((prev) => prev.filter((notification) => notification.id !== id))
  }

  // Funktion zum Aktualisieren des Bitcoin-Guthabens mit optionaler Benachrichtigung
  const updateBitcoinBalance = async (amount: number | string, message?: string, skipBackend = false) => {
    const safeAmount = Number(amount) || 0;
    const newBalance = bitcoinBalance + safeAmount;
    setBitcoinBalance(newBalance);

    if (!skipBackend) {
      try {
        const response = await fetch('/api/game/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ bitcoins: newBalance }),
        });
        if (!response.ok) {
          console.error('Fehler beim Aktualisieren der Bitcoin-Balance im Backend');
        }
      } catch (error) {
        console.error('Fehler beim Aktualisieren der Bitcoin-Balance:', error);
      }
    }

    if (safeAmount > 0 && message) {
      addMoneyNotification(safeAmount, message)
    }
  }

  // Bitcoin-Kurs aktualisieren (größere Schwankungen)
  useEffect(() => {
    const updateBitcoinRate = () => {
      // Größere Preisänderung zwischen -1000 und +1000
      setBitcoinRate((prevRate) => {
        const changeAmount = Math.floor(Math.random() * 2001) - 1000
        return Math.max(10000, prevRate + changeAmount) // Mindestpreis 10.000
      })
    }

    // Setze Interval für alle 30 Sekunden
    const interval = setInterval(updateBitcoinRate, 30000)

    // Cleanup beim Unmount
    return () => clearInterval(interval)
  }, [])

  // Spielzeit aktualisieren (1 Minute = 5 Sekunden - schneller als zuvor)
  useEffect(() => {
    const updateGameTime = () => {
      setGameTime((prevTime) => {
        const newTime = prevTime + 1

        // Tag/Nacht-Wechsel
        if (newTime % 1440 === 0) {
          // Neuer Tag um Mitternacht
          incrementDay()
        }

        // Zeitpunkt für Tag/Nacht-Wechsel
        if (newTime % 1440 === 360) {
          // 6:00 Uhr
          setTimeOfDay("day")
        } else if (newTime % 1440 === 1080) {
          // 18:00 Uhr
          setTimeOfDay("night")
        }

        return newTime % 1440 // Modulo 1440 für 24-Stunden-Format
      })
    }

    // Setze Interval für alle 5 Sekunden (= 1 Spielminute) - schneller als zuvor
    const interval = setInterval(updateGameTime, 5000)

    // Cleanup beim Unmount
    return () => clearInterval(interval)
  }, [])

  // Bitcoin-Balance aus dem Backend laden
  useEffect(() => {
    const loadBitcoinBalance = async () => {
      try {
        const response = await fetch('/api/game/state', {
          method: 'GET',
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.gameState) {
            setBitcoinBalance(parseFloat(data.gameState.bitcoins) || 0);
          }
        }
      } catch (error) {
        console.error('Fehler beim Laden der Bitcoin-Balance:', error);
      }
    };

    loadBitcoinBalance();
  }, []);

  const incrementDay = () => {
    setDay((prev) => prev + 1)
  }

  const toggleTimeOfDay = () => {
    setTimeOfDay((prev) => (prev === "day" ? "night" : "day"))
  }

  const addTerminalCommand = (command: string) => {
    setTerminalHistory((prev) => [...prev, command])
  }

  const addMessage = (sender: string, content: string) => {
    setMessages((prev) => [
      ...prev,
      {
        sender,
        content,
        timestamp: new Date().toISOString(),
      },
    ])
  }

  // Event-Listener für View-Änderungen von Interaktionspunkten
  useEffect(() => {
    const handleViewChange = (event: CustomEvent) => {
      const newView = event.detail as View;
      setCurrentView(newView);
    };

    window.addEventListener('changeView', handleViewChange as EventListener);
    
    return () => {
      window.removeEventListener('changeView', handleViewChange as EventListener);
    };
  }, []);

  // Alarm-Level-Funktionen
  const increaseAlarmLevel = async (reason: string) => {
    const newLevel = alarmLevel + 1
    setAlarmLevel(newLevel)
    
    // Benachrichtigung erstellen
    const notification: AlarmLevelNotification = {
      id: Date.now().toString(),
      level: newLevel,
      message: !hasShownFirstAlarmExplanation 
        ? `Du hast ein Leben verloren! ${reason}` 
        : `Deine Alarm-Stufe hat sich um 1 erhöht`,
      timestamp: new Date().toISOString(),
      isFirstTime: !hasShownFirstAlarmExplanation
    }
    
    setAlarmNotifications(prev => [...prev, notification])
    
    // Erste Alarm-Level-Erklärung anzeigen (nur beim ersten Mal)
    if (!hasShownFirstAlarmExplanation) {
      setHasShownFirstAlarmExplanation(true)
      showStory({
        id: 'alarm_explanation',
        title: '⚠️ ALARM LEVEL SYSTEM AKTIVIERT',
        content: [
          'Du hast deinen ersten Fehler gemacht! Das Alarm-Level-System ist jetzt aktiv.',
          'Jeder Fehler erhöht das Alarm-Level. Bei Level 10 wirst du Erwischt und dein Spielstand wird gelöscht!',
          'Sei vorsichtiger bei deinen nächsten Versuchen!'
        ],
        type: 'text'
      })
    }
    
    // Bei Alarm-Level 10: FBI kommt!
    if (newLevel >= 10) {
      setIsGameOver(true)
      
      // FBI-Sound abspielen (falls verfügbar)
      try {
        const audio = new Audio('/sounds/fbi_open_up.mp3')
        audio.volume = 0.7
        audio.play()
      } catch (error) {
        console.log('FBI-Sound konnte nicht abgespielt werden')
      }
      
      // Spielstand-Löschung nach kurzer Verzögerung
      setTimeout(() => {
        resetGame()
      }, 3000)
    }

    // Datenbank-Update über API (falls User eingeloggt ist)
    try {
      const mockUserId = 1
      
      const response = await fetch('/api/game/alarm-level', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: mockUserId,
          reason: reason
        }),
      });

      if (!response.ok) {
        console.log('API-Update für Alarm-Level fehlgeschlagen')
      }
    } catch (error) {
      console.log('API-Update für Alarm-Level fehlgeschlagen:', error)
    }
  }

  const resetAlarmLevel = async () => {
    setAlarmLevel(0)
    setAlarmNotifications([])
    
    // Datenbank-Update über API (falls User eingeloggt ist)
    try {
      const mockUserId = 1
      
      const response = await fetch('/api/game/alarm-level', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: mockUserId
        }),
      });

      if (!response.ok) {
        console.log('API-Update für Alarm-Level-Reset fehlgeschlagen')
      }
    } catch (error) {
      console.log('API-Update für Alarm-Level-Reset fehlgeschlagen:', error)
    }
  }

  const removeAlarmNotification = (id: string) => {
    setAlarmNotifications(prev => prev.filter(notification => notification.id !== id))
  }

  const resetGame = () => {
    // Alle Spielstände zurücksetzen
    setCurrentView("apartment")
    setDay(1)
    setTimeOfDay("day")
    setGameTime(480)
    setBitcoinBalance(0)
    setBitcoinRate(59000)
    setMentalState("normal")
    setTerminalHistory([])
    setMessages([
      {
        sender: "DARKROOM",
        content: "Welcome to INTRUSION, n0seC. Your first mission awaits. Check your terminal.",
        timestamp: new Date().toISOString(),
      },
    ])
    setCurrentDecision(null)
    setPlayerDecisions([])
    setCurrentStory(null)
    setCurrentChatGroup("crimenetwork")
    setCurrentMission(null)
    setCompletedMissions([])
    setMoneyNotifications([])
    setAlarmLevel(0)
    setAlarmNotifications([])
    setIsGameOver(false)
    setHasShownFirstAlarmExplanation(false)
    
    // Chat-Gruppen zurücksetzen
    setChatGroups([
      {
        id: "crimenetwork",
        name: "CrimeNetwork",
        isFavorite: true,
        description: "Hauptkanal für illegale Aktivitäten und Aufträge",
        messages: [
          {
            id: "1",
            sender: "ShadowDealer",
            content: "NEW SHIPMENT: Premium Cocaine, 99% pure. DM for prices.",
            timestamp: new Date(Date.now() - 3600000).toISOString(),
          },
          {
            id: "2",
            sender: "H4ckM4st3r",
            content: "Selling access to corporate networks. Starting at 0.05 BTC. Clean entry, no traces.",
            timestamp: new Date(Date.now() - 2400000).toISOString(),
          },
          {
            id: "3",
            sender: "GhostProxy",
            content: "VPN nodes available in 15 countries. Bulletproof hosting. 0.01 BTC/month.",
            timestamp: new Date(Date.now() - 1200000).toISOString(),
          },
          {
            id: "4",
            sender: "CryptoKing",
            content: "Money laundering service. 15% fee. No questions asked.",
            timestamp: new Date(Date.now() - 600000).toISOString(),
          },
          {
            id: "5",
            sender: "ADMIN",
            content: "Reminder: No feds, no scams. Violators will be permanently banned and doxxed.",
            timestamp: new Date(Date.now() - 300000).toISOString(),
            isSystem: true,
          },
        ],
        unreadCount: 0,
      },
      {
        id: "hackers",
        name: "HackersUnited",
        isFavorite: false,
        description: "Community für ethische Hacker und Sicherheitsforscher",
        messages: [
          {
            id: "1",
            sender: "WhiteHat",
            content: "New zero-day vulnerability found in OpenSSL. Reporting to maintainers.",
            timestamp: new Date(Date.now() - 1800000).toISOString(),
          },
          {
            id: "2",
            sender: "BugHunter",
            content: "Anyone interested in collaborating on a security research project?",
            timestamp: new Date(Date.now() - 900000).toISOString(),
          },
        ],
        unreadCount: 0,
      },
    ])
  }

  // Füge Entscheidungsfunktionen zum value-Objekt hinzu
  const value = {
    currentView,
    setCurrentView,
    day,
    incrementDay,
    timeOfDay,
    toggleTimeOfDay,
    gameTime,
    bitcoinBalance,
    setBitcoinBalance,
    bitcoinRate,
    updateBitcoinBalance,
    mentalState,
    setMentalState,
    terminalHistory,
    addTerminalCommand,
    messages,
    addMessage,
    currentDecision,
    setCurrentDecision,
    playerDecisions,
    makeDecision,
    currentStory,
    setCurrentStory,
    showStory,
    chatGroups,
    currentChatGroup,
    setCurrentChatGroup,
    addChatMessage,
    currentMission,
    setCurrentMission,
    completedMissions,
    completeMission,
    moneyNotifications,
    addMoneyNotification,
    removeMoneyNotification,
    missions,
    getMission,
    testMoneyNotification: () => {
      addMoneyNotification(0.05, "Test notification")
    },
    alarmLevel,
    increaseAlarmLevel,
    resetAlarmLevel,
    alarmNotifications,
    removeAlarmNotification,
    isGameOver,
    resetGame,
  }

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

export function useGameState() {
  const context = useContext(GameContext)
  if (context === undefined) {
    throw new Error("useGameState must be used within a GameProvider")
  }
  return context
}
