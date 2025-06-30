"use client"

import { useGameState } from "./game-context"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RotateCcw } from "lucide-react"

export default function GameOverScreen() {
  const { isGameOver, resetGame } = useGameState()

  if (!isGameOver) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-red-900/80 border-2 border-red-500 rounded-lg p-8 max-w-md mx-4 text-center">
        <div className="mb-6">
          <AlertTriangle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-red-400 mb-2">
            DU WURDEST ERWISCHT!
          </h1>
          <p className="text-red-300 text-lg">
            Das FBI hat dich gefunden!
          </p>
        </div>
        
        <div className="mb-6 text-red-200">
          <p className="mb-2">
            <strong>FBI OPEN UP!</strong>
          </p>
          <p className="text-sm">
            Dein Spielstand wurde komplett gelöscht.
          </p>
          <p className="text-sm">
            Du beginnst von vorne...
          </p>
        </div>

        <div className="space-y-3">
          <Button
            onClick={resetGame}
            className="w-full bg-red-600 hover:bg-red-700 text-white"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Neues Spiel starten
          </Button>
        </div>
      </div>
    </div>
  )
} 