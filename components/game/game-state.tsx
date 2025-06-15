"use client"

import { useGameState } from "./game-context"
import { Bitcoin, Brain, TrendingUp, Clock } from "lucide-react"

export default function GameState() {
  const { day, timeOfDay, bitcoinBalance, bitcoinRate, mentalState, gameTime } = useGameState()

  const getMentalStateIcon = () => {
    switch (mentalState) {
      case "paranoid":
        return "👀"
      case "sleep-deprived":
        return "😴"
      case "focused":
        return "🧠"
      default:
        return "😐"
    }
  }

  // Berechne den Wert des Bitcoin-Guthabens in USD
  const balanceInUsd = bitcoinBalance * bitcoinRate

  // Formatiere die Spielzeit als Uhrzeit
  const formatGameTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`
  }

  return (
    <div className="bg-black border-b border-green-900 p-2 flex justify-between text-sm">
      <div className="flex items-center">
        <span className="font-bold mr-4">DAY {day}</span>
        <span className="mr-4">{timeOfDay.toUpperCase()}</span>
        <div className="flex items-center">
          <Clock className="h-4 w-4 mr-1" />
          <span>{formatGameTime(gameTime)}</span>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <div className="flex items-center">
          <Brain className="h-4 w-4 mr-1" />
          <span>
            {mentalState.charAt(0).toUpperCase() + mentalState.slice(1)} {getMentalStateIcon()}
          </span>
        </div>
        <div className="flex items-center">
          <Bitcoin className="h-4 w-4 mr-1" />
          <span>{bitcoinBalance.toFixed(4)} BTC</span>
        </div>
        <div className="flex items-center">
          <TrendingUp className="h-4 w-4 mr-1" />
          <span>${bitcoinRate.toLocaleString()}</span>
        </div>
        <div className="flex items-center text-green-400">
          <span>${balanceInUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
        </div>
      </div>
    </div>
  )
}
