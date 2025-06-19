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
  bitcoinRate: number
  updateBitcoinBalance: (amount: number, message?: string) => void
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
}

const GameContext = createContext<GameContextType | undefined>(undefined)

export function GameProvider({ children }: { children: ReactNode }) {
  const [currentView, setCurrentView] = useState<View>("apartment")
  const [day, setDay] = useState(1)
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>("day")
  const [gameTime, setGameTime] = useState(480) // Start bei 8:00 Uhr (480 Minuten)
  const [bitcoinBalance, setBitcoinBalance] = useState(0.25)
  const [bitcoinRate, setBitcoinRate] = useState(59000) // Startpreis für 1 BTC in USD
  const [mentalState, setMentalState] = useState<MentalState>("normal")
  const [terminalHistory, setTerminalHistory] = useState<string[]>([])
  const [messages, setMessages] = useState<{ sender: string; content: string; timestamp: string }[]>([
    {
      sender: "DARKROOM",
      content: "Welcome to INTRUSION, n0seC. Your first mission awaits. Check your terminal.",
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
  const [currentMission, setCurrentMission] = useState<string | null>(null)
  const [completedMissions, setCompletedMissions] = useState<string[]>([])

  // Neue States für Geld-Benachrichtigungen
  const [moneyNotifications, setMoneyNotifications] = useState<MoneyNotification[]>([])

  // Missionen definieren
  const [missions] = useState<Mission[]>([
    {
      id: "mission1",
      title: "Datenextraktion: ISP-Datenbank",
      description: "Extrahiere Kundendaten von Alexander Volkov aus der ISP-Datenbank.",
      reward: 0.15,
      type: "guided",
      steps: [
        {
          id: "step1",
          title: "Netzwerk scannen",
          description: "Scanne das Zielnetzwerk nach offenen Ports und Diensten.",
          command: "nmap -sV 192.168.1.100",
          hint: "nmap ist ein Netzwerk-Scanner. Der Parameter -sV identifiziert Dienste und Versionen.",
          completed: false,
        },
        {
          id: "step2",
          title: "SSH-Verbindung herstellen",
          description: "Verbinde dich mit dem Server über SSH.",
          command: "ssh -p 22 admin@192.168.1.100",
          hint: "SSH (Secure Shell) ermöglicht sichere Verbindungen. -p gibt den Port an.",
          completed: false,
        },
        {
          id: "step3",
          title: "Datenbank-Zugriff",
          description: "Greife auf die MySQL-Datenbank zu.",
          command: "mysql -u root -p customers",
          hint: "MySQL ist ein Datenbanksystem. -u gibt den Benutzer an, -p fordert ein Passwort.",
          completed: false,
        },
        {
          id: "step4",
          title: "Daten extrahieren",
          description: "Extrahiere die Kundendaten von Alexander Volkov.",
          command: "SELECT * FROM users WHERE name LIKE '%Volkov%';",
          hint: "SQL-Befehle werden verwendet, um Daten abzufragen. % ist ein Platzhalter für beliebige Zeichen.",
          completed: false,
        },
        {
          id: "step5",
          title: "Daten exportieren",
          description: "Exportiere die gefundenen Daten in eine Datei.",
          command: "mysqldump -u root -p customers users > volkov_data.sql",
          hint: "mysqldump erstellt ein Backup von Datenbanken. > leitet die Ausgabe in eine Datei um.",
          completed: false,
        },
      ],
    },
    {
      id: "mission2",
      title: "Passwort-Knacker: Bankzugang",
      description: "Knacke das Passwort für ein Bankkonto und überweise Geld auf ein anonymes Konto.",
      reward: 0.25,
      type: "terminal",
      commands: [
        "hydra -l admin -P /usr/share/wordlists/rockyou.txt 192.168.1.200 -s 8080 http-post-form",
        "ssh admin@192.168.1.200",
        "cd /var/www/html/bank",
        "cat config.php",
        "mysql -u bankadmin -p'P@ssw0rd123!' bankdb",
        "SELECT * FROM accounts WHERE balance > 10000;",
        "UPDATE accounts SET balance = balance - 10000 WHERE account_id = 'ACT7391';",
        "INSERT INTO transactions VALUES (NULL, 'ACT7391', 'ACT8842', 10000, NOW(), 'Transfer');",
        "exit",
      ],
    },
    {
      id: "mission3",
      title: "Überwachungssystem: Kamera-Hack",
      description: "Hacke das Überwachungssystem eines Hochsicherheitsgebäudes und deaktiviere die Kameras.",
      reward: 0.35,
      type: "guided",
      steps: [
        {
          id: "step1",
          title: "Netzwerk identifizieren",
          description: "Identifiziere das Netzwerk des Überwachungssystems.",
          command: "nmap -sP 192.168.2.0/24",
          hint: "Der Parameter -sP führt einen Ping-Scan durch, um aktive Hosts zu finden.",
          completed: false,
        },
        {
          id: "step2",
          title: "Schwachstellen scannen",
          description: "Scanne das Überwachungssystem nach Schwachstellen.",
          command: "nmap -sV --script vuln 192.168.2.50",
          hint: "Der Parameter --script vuln führt Skripte aus, die nach bekannten Schwachstellen suchen.",
          completed: false,
        },
        {
          id: "step3",
          title: "Zugriff erlangen",
          description: "Nutze die gefundene Schwachstelle, um Zugriff zu erlangen.",
          command: "exploit -t 192.168.2.50 -v CVE-2023-1234",
          hint: "Der exploit-Befehl nutzt bekannte Schwachstellen aus. -t gibt das Ziel an, -v die Schwachstelle.",
          completed: false,
        },
        {
          id: "step4",
          title: "Kamerasystem finden",
          description: "Finde das Kamerasystem im internen Netzwerk.",
          command: "find / -name 'camera_control*'",
          hint: "Der find-Befehl durchsucht das Dateisystem nach Dateien mit bestimmten Namen.",
          completed: false,
        },
        {
          id: "step5",
          title: "Kameras deaktivieren",
          description: "Deaktiviere die Überwachungskameras.",
          command: "./camera_control --disable-all --no-log",
          hint: "Der Parameter --no-log verhindert, dass die Aktion protokolliert wird.",
          completed: false,
        },
        {
          id: "step6",
          title: "Spuren verwischen",
          description: "Lösche alle Spuren deiner Anwesenheit.",
          command: "shred -u /var/log/access.log",
          hint: "Der shred-Befehl überschreibt Dateien mehrfach, bevor er sie löscht, um Datenwiederherstellung zu verhindern.",
          completed: false,
        },
      ],
    },
    {
      id: "mission4",
      title: "Kryptowährung: Blockchain-Manipulation",
      description: "Manipuliere eine Blockchain-Transaktion, um Gelder umzuleiten.",
      reward: 0.5,
      type: "terminal",
      commands: [
        "btc-tools --scan-mempool",
        "btc-tools --analyze-tx 3a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p",
        "btc-tools --clone-tx 3a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p",
        "nano tx_clone.json",
        "btc-tools --modify-tx tx_clone.json --output-address 1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2",
        "btc-tools --sign-tx tx_clone.json --key private_key.pem",
        "btc-tools --broadcast-tx tx_clone.json",
        "btc-tools --verify-tx",
        "shred -u tx_clone.json private_key.pem",
        "exit",
      ],
    },
  ])

  // Funktion zum Abrufen einer Mission
  const getMission = (id: string) => {
    return missions.find((mission) => mission.id === id)
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
  const addMoneyNotification = (amount: number, message: string) => {
    const newNotification: MoneyNotification = {
      id: Date.now().toString(),
      amount,
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
  const updateBitcoinBalance = (amount: number, message?: string) => {
    setBitcoinBalance((prev) => prev + amount)

    // Wenn ein positiver Betrag und eine Nachricht vorhanden sind, zeige eine Benachrichtigung
    if (amount > 0 && message) {
      addMoneyNotification(amount, message)
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
