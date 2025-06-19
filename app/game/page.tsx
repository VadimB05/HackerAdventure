import GameLayout from "@/components/game/game-layout"
import { GameProvider } from "@/components/game/game-context"
import IntroStory from "@/components/game/intro-story"

export default function GamePage() {
  return (
    <GameProvider>
      <GameLayout />
      <IntroStory />
    </GameProvider>
  )
} 