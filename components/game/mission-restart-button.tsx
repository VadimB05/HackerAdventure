"use client"

import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { useGameState } from "./game-context"

interface MissionRestartButtonProps {
  missionId: string
}

export default function MissionRestartButton({ missionId }: MissionRestartButtonProps) {
  const { setCurrentMission, completedMissions } = useGameState()

  // Nur anzeigen, wenn die Mission noch nicht abgeschlossen ist
  if (completedMissions.includes(missionId)) {
    return null
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setCurrentMission(missionId)}
      className="flex items-center text-green-500 border-green-500 hover:bg-green-900/20"
    >
      <RefreshCw className="h-3 w-3 mr-1" />
      Neustarten
    </Button>
  )
}
