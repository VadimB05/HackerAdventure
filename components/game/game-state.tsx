"use client"

import { useGameState } from '@/lib/contexts/game-context'
import { Bitcoin, TrendingUp, Clock, AlertTriangle, Info } from "lucide-react"

export default function GameState() {
  const { day, timeOfDay, bitcoinBalance, bitcoinRate, gameTime, alarmLevel } = useGameState()

  // Sichere Konvertierung zu Number
  const safeBitcoinBalance = Number(bitcoinBalance) || 0
  const safeBitcoinRate = Number(bitcoinRate) || 0

  // Berechne den Wert des Bitcoin-Guthabens in USD
  const balanceInUsd = safeBitcoinBalance * safeBitcoinRate

  // Formatiere die Spielzeit als Uhrzeit
  const formatGameTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`
  }

  // Alarm-Level-Farbe bestimmen
  const getAlarmColor = (level: number) => {
    if (level >= 8) return "text-red-500"
    if (level >= 5) return "text-orange-500"
    if (level >= 3) return "text-yellow-500"
    return "text-green-500"
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
        {/* Alarm-Level immer anzeigen */}
        <div className="relative group">
          <div className={`flex items-center ${getAlarmColor(alarmLevel)}`}>
            <AlertTriangle className="h-4 w-4 mr-1" />
            <span className="font-bold">ALARM: {alarmLevel}/10</span>
            <Info className="h-4 w-4 ml-1 text-current" />
          </div>
          
          {/* CSS Tooltip */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-4 py-3 bg-black border border-green-500 text-green-400 rounded-md text-xs w-80 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
            <div className="text-sm">
              <p className="font-bold mb-2">Alarm-Level System</p>
              <p className="mb-3">Jeder Fehler erhöht das Alarm-Level um 1.</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <p><span className="text-green-400">● 0-2:</span> Sicher</p>
                <p><span className="text-yellow-400">● 3-4:</span> Vorsicht</p>
                <p><span className="text-orange-400">● 5-7:</span> Gefährlich</p>
                <p><span className="text-red-400">● 8-9:</span> Fast erwischt!</p>
                <p className="col-span-2"><span className="text-red-500 font-bold">● 10:</span> Die Behörden  kommen!</p>
              </div>
              <p className="text-xs mt-3 text-gray-400">
                Bei Level 10 wird dein Spielstand gelöscht!
              </p>
            </div>
            {/* Pfeil nach oben */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-green-500"></div>
          </div>
        </div>
        <div className="flex items-center">
          <Bitcoin className="h-4 w-4 mr-1" />
          <span>{safeBitcoinBalance.toFixed(4)} BTC</span>
        </div>
        <div className="flex items-center">
          <TrendingUp className="h-4 w-4 mr-1" />
          <span>${safeBitcoinRate.toLocaleString('de-DE')}</span>
        </div>
        <div className="flex items-center text-green-400">
          <span>${balanceInUsd.toLocaleString('de-DE', { maximumFractionDigits: 2 })}</span>
        </div>
      </div>
    </div>
  )
}
