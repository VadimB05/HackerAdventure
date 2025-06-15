"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useGameState, type ChatMessage } from "./game-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Star, MessageSquare, AlertTriangle, Search } from "lucide-react"

export default function DarknetChat() {
  const { chatGroups, currentChatGroup, setCurrentChatGroup, addChatMessage, setCurrentMission, completedMissions } =
    useGameState()
  const [input, setInput] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [isProcessingMessage, setIsProcessingMessage] = useState(false)

  const activeGroup = chatGroups.find((group) => group.id === currentChatGroup) || chatGroups[0]

  // Liste von möglichen Antworten für verschiedene Situationen
  const greetingResponses = [
    { sender: "ShadowDealer", content: "Hey, was geht?" },
    { sender: "H4ckM4st3r", content: "Moin. Lange nicht gesehen." },
    { sender: "GhostProxy", content: "Hi. Sicher unterwegs heute?" },
    { sender: "CryptoKing", content: "Servus. Wie läuft's mit dem Bitcoin?" },
    { sender: "ByteWizard", content: "Hey n0seC, alles klar bei dir?" },
    { sender: "NetRunner", content: "Yo, was gibt's Neues?" },
  ]

  const busyResponses = [
    { sender: "DataGhost", content: "Gerade keine Zeit, bin mitten in einem Job." },
    { sender: "CipherPunk", content: "Nicht jetzt. Bin beschäftigt." },
    { sender: "HexHunter", content: "Später vielleicht. Muss was erledigen." },
    { sender: "RootKit", content: "Bin afk. Melde mich später." },
  ]

  const anyoneThereResponses = [
    { sender: "ShadowDealer", content: "Immer da, immer wachsam." },
    { sender: "H4ckM4st3r", content: "Yo, was brauchst du?" },
    { sender: "ADMIN", content: "Dieser Kanal wird 24/7 überwacht. Natürlich ist jemand da.", isSystem: true },
    { sender: "ByteWizard", content: "Nein, hier ist niemand. Das ist eine automatische Nachricht." },
    { sender: "NetRunner", content: "Kommt drauf an, wer fragt und warum..." },
  ]

  // Neue Antworten, die den Spieler als Hacking-Master loben
  const praiseResponses = [
    { sender: "H4ckM4st3r", content: "n0seC, ich hab gehört du hast den ISP-Job erledigt. Saubere Arbeit!" },
    { sender: "ByteWizard", content: "Leute, wenn ihr einen echten Profi braucht, fragt n0seC. Hab nur Gutes gehört." },
    { sender: "CryptoKing", content: "Wer hat diesen Volkov-Hack gemacht? n0seC? Respekt, das war nicht einfach." },
    { sender: "GhostProxy", content: "n0seC ist einer der wenigen hier, die wirklich wissen, was sie tun." },
    {
      sender: "ShadowDealer",
      content: "Hab gehört du kannst mit Code umgehen wie kein anderer, n0seC. Meld dich, wenn du mal was brauchst.",
    },
    { sender: "NetRunner", content: "Die Legende n0seC ist wieder aktiv. Willkommen zurück im Spiel." },
  ]

  const randomResponses = [
    { sender: "DataGhost", content: "Interessant. Erzähl mehr." },
    { sender: "CipherPunk", content: "Und was hat das mit mir zu tun?" },
    { sender: "HexHunter", content: "Klingt nach Bullshit, aber ok." },
    { sender: "RootKit", content: "Hast du dafür irgendwelche Beweise?" },
    { sender: "ByteWizard", content: "Cool story, bro." },
    { sender: "NetRunner", content: "Schon mal von Verschlüsselung gehört? DM mich für sowas." },
    { sender: "ShadowDealer", content: "Nicht hier im öffentlichen Chat, Mann." },
    { sender: "GhostProxy", content: "Ich kenne jemanden, der dir dabei helfen könnte." },
    { sender: "CryptoKing", content: "Kostet dich 0.01 BTC für die Info." },
  ]

  const jobOffer = {
    sender: "DarkOperator",
    content: "Hey n0seC, Lust auf nen geilen Job?",
    timestamp: new Date().toISOString(),
  }

  // Füge die Job-Anfrage als letzte Nachricht hinzu, wenn sie noch nicht existiert
  useEffect(() => {
    if (currentChatGroup === "crimenetwork") {
      const hasDarkOperatorMessage = chatGroups
        .find((g) => g.id === "crimenetwork")
        ?.messages.some((m) => m.sender === "DarkOperator" && m.content.includes("Lust auf nen geilen Job"))

      if (!hasDarkOperatorMessage) {
        addChatMessage("crimenetwork", {
          id: Date.now().toString(),
          ...jobOffer,
        })
      }
    }
  }, [currentChatGroup, chatGroups, addChatMessage])

  // Füge gelegentlich Lob-Nachrichten hinzu, wenn Mission 1 abgeschlossen wurde
  useEffect(() => {
    if (completedMissions.includes("mission1") && currentChatGroup === "crimenetwork" && Math.random() < 0.3) {
      const interval = setInterval(() => {
        // 30% Chance, dass jemand den Spieler lobt
        if (Math.random() < 0.3) {
          const randomPraise = praiseResponses[Math.floor(Math.random() * praiseResponses.length)]
          addChatMessage("crimenetwork", {
            id: Date.now().toString(),
            ...randomPraise,
            timestamp: new Date().toISOString(),
          })
        }
      }, 60000) // Alle 60 Sekunden prüfen

      return () => clearInterval(interval)
    }
  }, [completedMissions, currentChatGroup, addChatMessage])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isProcessingMessage) return

    setIsProcessingMessage(true)

    // Neue Nachricht erstellen
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: "n0seC",
      content: input,
      timestamp: new Date().toISOString(),
    }

    // Nachricht zum aktuellen Chat hinzufügen
    addChatMessage(currentChatGroup, newMessage)

    const lowerInput = input.toLowerCase()
    setInput("")

    // Prüfe auf Job-Annahme für Mission 1
    if (
      currentChatGroup === "crimenetwork" &&
      !completedMissions.includes("mission1") &&
      (lowerInput.includes("ja") ||
        lowerInput.includes("yes") ||
        lowerInput.includes("klar") ||
        lowerInput.includes("sicher") ||
        lowerInput.includes("ok") ||
        lowerInput.includes("bin dabei"))
    ) {
      // Verzögerung für die Antwort
      setTimeout(() => {
        // Antwort auf Job-Anfrage
        addChatMessage("crimenetwork", {
          id: Date.now().toString(),
          sender: "DarkOperator",
          content:
            "Perfekt. Check dein Terminal für die Details. Es geht um einen Datenauszug aus einer ISP-Datenbank.",
          timestamp: new Date().toISOString(),
        })

        // Kurze Verzögerung, dann zweite Nachricht
        setTimeout(() => {
          addChatMessage("crimenetwork", {
            id: Date.now().toString(),
            sender: "DarkOperator",
            content:
              "0.15 BTC bei erfolgreicher Lieferung. Keine Vorauszahlung. Keine Fragen zur Verwendung der Daten.",
            timestamp: new Date().toISOString(),
          })

          // Starte die Mission nach einer weiteren Verzögerung
          setTimeout(() => {
            setCurrentMission("mission1")
          }, 2000)

          setIsProcessingMessage(false)
        }, 2000)
      }, 1000)
    }
    // Prüfe auf Job-Annahme für Mission 2
    else if (
      currentChatGroup === "crimenetwork" &&
      completedMissions.includes("mission1") &&
      !completedMissions.includes("mission2") &&
      (lowerInput.includes("ja") ||
        lowerInput.includes("yes") ||
        lowerInput.includes("klar") ||
        lowerInput.includes("sicher") ||
        lowerInput.includes("ok") ||
        lowerInput.includes("interesse") ||
        lowerInput.includes("bin dabei"))
    ) {
      // Verzögerung für die Antwort
      setTimeout(() => {
        // Antwort auf Job-Anfrage
        addChatMessage("crimenetwork", {
          id: Date.now().toString(),
          sender: "DarkOperator",
          content:
            "Ausgezeichnet. Diesmal geht es um einen Bankzugang. Du musst ein Passwort knacken und Geld überweisen.",
          timestamp: new Date().toISOString(),
        })

        // Kurze Verzögerung, dann zweite Nachricht
        setTimeout(() => {
          addChatMessage("crimenetwork", {
            id: Date.now().toString(),
            sender: "DarkOperator",
            content: "0.25 BTC Belohnung. Diesmal musst du die Befehle selbst eintippen. Ich schicke dir die Details.",
            timestamp: new Date().toISOString(),
          })

          // Starte die Mission nach einer weiteren Verzögerung
          setTimeout(() => {
            setCurrentMission("mission2")
          }, 2000)

          setIsProcessingMessage(false)
        }, 2000)
      }, 1000)
    } else {
      // Normale Nachrichtenverarbeitung
      processMessage(lowerInput)
    }
  }

  const processMessage = (lowerInput: string) => {
    // Bestimme, ob und wie viele Antworten gesendet werden sollen
    const shouldRespond = Math.random() < 0.9 // 90% Chance auf mindestens eine Antwort
    if (!shouldRespond) {
      setIsProcessingMessage(false)
      return
    }

    // Bestimme die Anzahl der Antworten (1-3)
    const numberOfResponses = Math.random() < 0.7 ? 1 : Math.random() < 0.9 ? 2 : 3

    // Verzögerung für die erste Antwort
    const initialDelay = 800 + Math.random() * 1200

    setTimeout(() => {
      let responses: ChatMessage[] = []

      // Prüfe auf Begrüßungen
      if (
        lowerInput.includes("hi") ||
        lowerInput.includes("hallo") ||
        lowerInput.includes("hello") ||
        lowerInput.includes("moin") ||
        lowerInput.includes("abend") ||
        lowerInput.includes("morgen") ||
        lowerInput.includes("tag") ||
        lowerInput.includes("servus") ||
        lowerInput.includes("grüß")
      ) {
        // Wähle zufällige Begrüßungsantworten
        const shuffledGreetings = [...greetingResponses].sort(() => Math.random() - 0.5)
        responses = shuffledGreetings.slice(0, numberOfResponses).map((r) => ({
          id: Date.now().toString() + Math.random(),
          ...r,
          timestamp: new Date().toISOString(),
        }))
      }
      // Prüfe auf "ist jemand da?"
      else if (
        lowerInput.includes("jemand da") ||
        lowerInput.includes("anyone") ||
        lowerInput.includes("hier?") ||
        lowerInput.includes("hallo?") ||
        lowerInput.includes("hello?")
      ) {
        // Wähle zufällige "Jemand da?"-Antworten
        const shuffledAnyone = [...anyoneThereResponses].sort(() => Math.random() - 0.5)
        responses = shuffledAnyone.slice(0, numberOfResponses).map((r) => ({
          id: Date.now().toString() + Math.random(),
          ...r,
          timestamp: new Date().toISOString(),
        }))
      }
      // Zufällige Antwort oder "keine Zeit"
      else {
        // 20% Chance auf "keine Zeit"-Antworten
        if (Math.random() < 0.2) {
          const shuffledBusy = [...busyResponses].sort(() => Math.random() - 0.5)
          responses = shuffledBusy.slice(0, 1).map((r) => ({
            id: Date.now().toString() + Math.random(),
            ...r,
            timestamp: new Date().toISOString(),
          }))
        } else {
          // Normale zufällige Antworten
          const shuffledRandom = [...randomResponses].sort(() => Math.random() - 0.5)
          responses = shuffledRandom.slice(0, numberOfResponses).map((r) => ({
            id: Date.now().toString() + Math.random(),
            ...r,
            timestamp: new Date().toISOString(),
          }))
        }
      }

      // Sende die Antworten mit Verzögerung zwischen ihnen
      let delay = 0
      responses.forEach((response, index) => {
        setTimeout(() => {
          addChatMessage(currentChatGroup, response)

          // Wenn es die letzte Antwort ist, setze isProcessingMessage zurück
          if (index === responses.length - 1) {
            setIsProcessingMessage(false)
          }
        }, delay)
        delay += 800 + Math.random() * 1200 // 800-2000ms Verzögerung zwischen Nachrichten
      })
    }, initialDelay)
  }

  // Filtere Chat-Gruppen basierend auf der Suche
  const filteredGroups = chatGroups.filter(
    (group) =>
      group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.description.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [activeGroup.messages])

  return (
    <div className="h-full flex bg-black text-green-500">
      {/* Sidebar mit Chat-Gruppen */}
      <div className="w-64 border-r border-green-900 flex flex-col">
        <div className="p-3 border-b border-green-900">
          <h2 className="text-lg font-bold mb-2">DARKNET</h2>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-700" />
            <Input
              type="text"
              placeholder="Suche Kanäle..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 bg-black border-green-900 text-green-500"
            />
          </div>
        </div>
        <ScrollArea className="flex-1">
          {filteredGroups.map((group) => (
            <button
              key={group.id}
              onClick={() => setCurrentChatGroup(group.id)}
              className={`w-full text-left p-3 flex items-start hover:bg-green-900/20 transition-colors ${
                group.id === currentChatGroup ? "bg-green-900/30" : ""
              }`}
            >
              <div className="mr-3 mt-1">
                {group.isFavorite ? (
                  <Star className="h-4 w-4 text-yellow-500" />
                ) : (
                  <MessageSquare className="h-4 w-4 text-green-700" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <span className="font-medium truncate">{group.name}</span>
                  {group.unreadCount > 0 && (
                    <span className="ml-2 bg-green-700 text-black text-xs px-1.5 py-0.5 rounded-full">
                      {group.unreadCount}
                    </span>
                  )}
                </div>
                <p className="text-xs text-green-700 truncate">{group.description}</p>
              </div>
            </button>
          ))}
        </ScrollArea>
        <div className="p-3 border-t border-green-900 text-xs text-green-700">
          <AlertTriangle className="h-3 w-3 inline mr-1" />
          Encrypted connection active
        </div>
      </div>

      {/* Chat-Bereich */}
      <div className="flex-1 flex flex-col">
        {/* Chat-Header */}
        <div className="p-3 border-b border-green-900 flex justify-between items-center">
          <div>
            <h3 className="font-bold flex items-center">
              {activeGroup.isFavorite && <Star className="h-4 w-4 text-yellow-500 mr-1" />}
              {activeGroup.name}
            </h3>
            <p className="text-xs text-green-700">{activeGroup.description}</p>
          </div>
          <div className="text-xs text-green-700">
            {activeGroup.messages.length} messages • {activeGroup.messages.filter((m) => m.sender === "n0seC").length}{" "}
            from you
          </div>
        </div>

        {/* Chat-Nachrichten */}
        <ScrollArea className="flex-1 p-4">
          {activeGroup.messages.map((msg) => (
            <div
              key={msg.id}
              className={`mb-4 max-w-[80%] ${
                msg.sender === "n0seC"
                  ? "ml-auto bg-green-900/50"
                  : msg.isSystem
                    ? "bg-yellow-900/30"
                    : "bg-gray-900/50"
              } p-3 rounded`}
            >
              <div className="font-bold mb-1 flex justify-between items-center">
                <span>{msg.sender}</span>
                {msg.isSystem && <AlertTriangle className="h-3 w-3 text-yellow-500" />}
              </div>
              <p className="break-words">{msg.content}</p>
              <div className="text-right text-xs opacity-70 mt-1">{new Date(msg.timestamp).toLocaleTimeString()}</div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </ScrollArea>

        {/* Chat-Eingabe */}
        <form onSubmit={handleSendMessage} className="p-3 border-t border-green-900 flex">
          <Input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Nachricht eingeben..."
            className="flex-1 bg-black border-green-900 text-green-500"
            disabled={isProcessingMessage}
          />
          <Button type="submit" className="ml-2 bg-green-900 hover:bg-green-800" disabled={isProcessingMessage}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}
