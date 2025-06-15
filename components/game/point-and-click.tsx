"use client"

import { useState } from "react"
import { useGameState } from "./game-context"
import DecisionLog from "./decision-log"

type Hotspot = {
  id: string
  x: number
  y: number
  width: number
  height: number
  tooltip: string
  action: () => void
}

export default function PointAndClick() {
  const { timeOfDay, setCurrentView, addMessage, setCurrentDecision } = useGameState()

  // Beispielentscheidung definieren
  const triggerWindowDecision = () => {
    setCurrentDecision({
      id: "window_observation",
      title: "Verdächtige Aktivität",
      description: "Du bemerkst eine Drohne, die vor deinem Fenster schwebt. Sie scheint dich zu beobachten.",
      options: [
        {
          id: "ignore",
          text: "Ignorieren und weitermachen",
          consequence:
            "Du hast die Drohne ignoriert. Sie verschwindet nach einigen Minuten, aber du fühlst dich unwohl.",
        },
        {
          id: "hide",
          text: "Jalousien schließen und verstecken",
          consequence: "Du schließt schnell die Jalousien. Die Drohne bleibt noch eine Weile, bevor sie verschwindet.",
        },
        {
          id: "hack",
          text: "Versuchen, die Drohne zu hacken",
          consequence:
            "Du versuchst, die Drohne zu hacken. Es gelingt dir, Zugriff auf ihre Kamera zu bekommen. Sie gehört einer Regierungsbehörde.",
        },
      ],
    })
  }

  // Beispielentscheidung für den Computer
  const triggerComputerDecision = () => {
    setCurrentDecision({
      id: "suspicious_email",
      title: "Verdächtige E-Mail",
      description:
        "Du findest eine ungelesene E-Mail mit dem Betreff 'Wir wissen, wer du bist'. Der Absender ist unbekannt.",
      options: [
        {
          id: "open",
          text: "E-Mail öffnen",
          consequence:
            "Die E-Mail enthält einen verschlüsselten Text und ein Bild deiner Wohnung von außen. Jemand beobachtet dich.",
        },
        {
          id: "delete",
          text: "E-Mail löschen",
          consequence:
            "Du löschst die E-Mail. Kurz darauf erhältst du eine Nachricht auf deinem Smartphone: 'Löschen wird dir nicht helfen.'",
        },
        {
          id: "trace",
          text: "Absender zurückverfolgen",
          consequence:
            "Du versuchst, den Absender zurückzuverfolgen. Die Spur führt zu einem Server in Moskau, bevor sie sich verliert.",
        },
      ],
    })
  }

  // Define hotspots for the apartment scene
  const hotspots: Hotspot[] = [
    {
      id: "computer",
      x: 20,
      y: 30,
      width: 25,
      height: 20,
      tooltip: "Computer Terminal",
      action: () => {
        // 20% Chance, eine Entscheidung auszulösen
        if (Math.random() < 0.2) {
          triggerComputerDecision()
        } else {
          setCurrentView("terminal")
        }
      },
    },
    {
      id: "phone",
      x: 60,
      y: 40,
      width: 10,
      height: 15,
      tooltip: "Smartphone",
      action: () => setCurrentView("smartphone"),
    },
    {
      id: "door",
      x: 80,
      y: 20,
      width: 15,
      height: 60,
      tooltip: "Door to Basement",
      action: () => setCurrentView("basement"),
    },
    {
      id: "window",
      x: 40,
      y: 10,
      width: 20,
      height: 25,
      tooltip: "Window (Look Outside)",
      action: () => {
        // 30% Chance, eine Entscheidung auszulösen
        if (Math.random() < 0.3) {
          triggerWindowDecision()
        } else {
          addMessage(
            "SYSTEM",
            "You look outside. The city is bustling with activity. You notice a surveillance drone hovering nearby.",
          )
        }
      },
    },
  ]

  const [hoveredHotspot, setHoveredHotspot] = useState<string | null>(null)

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Placeholder for the apartment background image */}
      <div
        className={`h-full w-full flex flex-col items-center justify-center ${timeOfDay === "night" ? "bg-gray-900" : "bg-gray-800"}`}
      >
        <div className="text-center mb-8">
          <p className="text-xl mb-4">
            {timeOfDay === "night"
              ? "Your apartment at night. The glow of screens illuminates the room."
              : "Your apartment during the day. Sunlight filters through the blinds."}
          </p>
          <p className="text-sm">(This is a placeholder for the apartment background image)</p>
        </div>

        {/* Entscheidungslog anzeigen */}
        <div className="w-full max-w-md">
          <DecisionLog />
        </div>
      </div>

      {/* Hotspot overlays */}
      {hotspots.map((hotspot) => (
        <div
          key={hotspot.id}
          className={`absolute border-2 ${
            hoveredHotspot === hotspot.id ? "border-green-400" : "border-green-800"
          } cursor-pointer transition-colors duration-200`}
          style={{
            left: `${hotspot.x}%`,
            top: `${hotspot.y}%`,
            width: `${hotspot.width}%`,
            height: `${hotspot.height}%`,
          }}
          onClick={hotspot.action}
          onMouseEnter={() => setHoveredHotspot(hotspot.id)}
          onMouseLeave={() => setHoveredHotspot(null)}
        >
          {hoveredHotspot === hotspot.id && (
            <div className="absolute bottom-full left-0 mb-2 bg-black text-green-500 px-2 py-1 text-sm whitespace-nowrap">
              {hotspot.tooltip}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
