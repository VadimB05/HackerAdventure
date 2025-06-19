"use client"

import { useEffect, useState } from "react"
import { useGameState } from "./game-context"

export default function IntroStory() {
  const { showStory } = useGameState()
  const [hasShownIntro, setHasShownIntro] = useState(false)

  useEffect(() => {
    // Zeige die Intro-Story nur beim ersten Laden und nur einmal
    if (!hasShownIntro) {
      const introStory = {
        id: "intro",
        title: "INTRUSION",
        type: "text",
        content: [
          "Das Jahr 2031. Die Welt ist ein Netz aus Daten, Geheimnissen und Macht.",
          "Du bist n0seC, ein Hacker mit einer verborgenen Vergangenheit. Einst Teil eines geheimen Regierungsprojekts, lebst du nun im Schatten, unter falscher Identität.",
          "Dein Apartment in Moskau ist deine Festung. Von hier aus navigierst du durch das digitale Labyrinth, nimmst Aufträge an und versuchst, deiner Vergangenheit einen Schritt voraus zu sein.",
          "Das Darknet ist dein Marktplatz. Deine Fähigkeiten sind deine Währung. Und Bitcoin ist dein Blut.",
          "Doch die Schatten deiner Vergangenheit werden länger. Jemand hat deine Spur aufgenommen. Jemand, der weiß, wer du wirklich bist.",
          "Willkommen in INTRUSION. Deine Entscheidungen werden dein Schicksal bestimmen.",
        ],
      }

      // Verzögere die Anzeige um 1 Sekunde
      const timer = setTimeout(() => {
        showStory(introStory)
        setHasShownIntro(true)
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [showStory, hasShownIntro])

  return null
}
