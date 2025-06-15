"use client"

import type React from "react"

import { useState } from "react"
import { useGameState } from "./game-context"
import { Button } from "@/components/ui/button"
import { Coffee, Wifi, ShoppingBag, Building, AlertTriangle } from "lucide-react"

type Location = {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  available: boolean
  action: () => void
}

export default function CityView() {
  const { timeOfDay, setCurrentStory } = useGameState()
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null)

  // Definiere die verfügbaren Orte in der Stadt
  const locations: Location[] = [
    {
      id: "cafe",
      name: "Neon Cafe",
      description: "Ein Treffpunkt für Hacker und Informationshändler. Öffentliches WLAN mit guter Verschlüsselung.",
      icon: <Coffee className="h-6 w-6" />,
      available: true,
      action: () => {
        setCurrentStory({
          id: "cafe_visit",
          title: "Neon Cafe",
          type: "dialog",
          speaker: "Barista",
          content: [
            "Willkommen im Neon Cafe. Der übliche?",
            "Ich habe gehört, dass die Behörden verstärkt nach unverschlüsseltem Datenverkehr suchen. Pass auf dich auf.",
            "Übrigens, der Typ in der Ecke hat nach dir gefragt. Ich kenne ihn nicht, aber er scheint dich zu kennen.",
          ],
        })
      },
    },
    {
      id: "market",
      name: "Schwarzmarkt",
      description: "Hier findest du Hardware, Software und andere Waren, die anderswo nicht erhältlich sind.",
      icon: <ShoppingBag className="h-6 w-6" />,
      available: timeOfDay === "night", // Nur nachts verfügbar
      action: () => {
        setCurrentStory({
          id: "market_visit",
          title: "Schwarzmarkt",
          type: "dialog",
          speaker: "Händler",
          content: [
            "Psst, ich habe neue Ware bekommen. Hochwertige Hardware, direkt vom Laster.",
            "Brauchst du etwas Besonderes? Ich kann fast alles besorgen... gegen den richtigen Preis.",
            "Aber sei vorsichtig. Die Polizei hat letzte Woche eine Razzia durchgeführt. Sie sind nervös geworden.",
          ],
        })
      },
    },
    {
      id: "hotspot",
      name: "Freies WLAN",
      description: "Ein öffentlicher Hotspot mit hoher Bandbreite. Perfekt für anonymes Surfen.",
      icon: <Wifi className="h-6 w-6" />,
      available: true,
      action: () => {
        setCurrentStory({
          id: "hotspot_visit",
          title: "Freies WLAN",
          type: "text",
          content: [
            "Du verbindest dich mit dem öffentlichen WLAN-Netzwerk.",
            "Deine VPN-Software aktiviert sich automatisch und leitet deinen Datenverkehr über mehrere Server um.",
            "Die Verbindung ist stabil, aber du bemerkst ungewöhnliche Netzwerkaktivitäten. Jemand könnte das Netzwerk überwachen.",
            "Vielleicht ist es besser, sensible Operationen woanders durchzuführen.",
          ],
        })
      },
    },
    {
      id: "isp",
      name: "ISP Hauptquartier",
      description: "Das Hauptgebäude des lokalen Internetanbieters. Stark bewacht und gesichert.",
      icon: <Building className="h-6 w-6" />,
      available: false, // Noch nicht verfügbar
      action: () => {
        setCurrentStory({
          id: "isp_locked",
          title: "Zugang verweigert",
          type: "text",
          content: [
            "Das ISP-Hauptquartier ist stark bewacht. Du benötigst einen Zugangscode oder eine Einladung, um hineinzukommen.",
            "Vielleicht findest du im Darknet Informationen, wie du Zugang erhalten kannst.",
            "Oder du könntest versuchen, einen Mitarbeiterausweis zu fälschen...",
          ],
        })
      },
    },
  ]

  return (
    <div className="h-full flex flex-col bg-black text-green-500 p-4">
      <div className="mb-4">
        <h2 className="text-xl font-bold">CITY MAP</h2>
        <p className="text-sm opacity-70">
          {timeOfDay === "day"
            ? "Die Stadt ist belebt. Sei vorsichtig, wem du vertraust."
            : "Die Nacht bietet Schutz, aber auch Gefahren."}
        </p>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
        {locations.map((location) => (
          <div
            key={location.id}
            className={`
              border rounded p-4 cursor-pointer transition-colors
              ${selectedLocation === location.id ? "border-green-500 bg-green-900/20" : "border-gray-700 hover:border-green-700"}
              ${!location.available ? "opacity-50" : ""}
            `}
            onClick={() => {
              if (location.available) {
                setSelectedLocation(location.id)
              }
            }}
          >
            <div className="flex items-center mb-2">
              <div className="mr-3 text-green-500">{location.icon}</div>
              <div>
                <h3 className="font-bold">{location.name}</h3>
                <p className="text-xs opacity-70">{location.description}</p>
              </div>
            </div>

            {!location.available && (
              <div className="flex items-center mt-2 text-yellow-500 text-xs">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {timeOfDay === "day" && location.id === "market" ? "Nur nachts verfügbar" : "Zugang gesperrt"}
              </div>
            )}
          </div>
        ))}
      </div>

      {selectedLocation && (
        <div className="mt-4 p-4 border border-gray-700 rounded">
          <h3 className="font-bold mb-2">{locations.find((l) => l.id === selectedLocation)?.name}</h3>
          <p className="mb-4">{locations.find((l) => l.id === selectedLocation)?.description}</p>

          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setSelectedLocation(null)}
              className="border-green-500 text-green-500 hover:bg-green-900"
            >
              Zurück
            </Button>

            <Button
              onClick={() => {
                const location = locations.find((l) => l.id === selectedLocation)
                if (location && location.available) {
                  location.action()
                }
              }}
              disabled={!locations.find((l) => l.id === selectedLocation)?.available}
              className="bg-green-900 hover:bg-green-800 disabled:bg-gray-800"
            >
              Besuchen
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
