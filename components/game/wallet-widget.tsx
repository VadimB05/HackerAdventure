"use client"

import { useEffect, useState } from "react"
import { useGameState } from '@/lib/contexts/game-context'
import { Bitcoin, TrendingUp, TrendingDown } from "lucide-react"

export default function WalletWidget() {
  const { bitcoinBalance, bitcoinRate } = useGameState()
  const [previousRate, setPreviousRate] = useState(bitcoinRate)
  const [trend, setTrend] = useState<"up" | "down" | "neutral">("neutral")

  // Berechne den Wert des Bitcoin-Guthabens in USD
  const balanceInUsd = bitcoinBalance * bitcoinRate

  // Verfolge Kursänderungen
  useEffect(() => {
    if (bitcoinRate > previousRate) {
      setTrend("up")
    } else if (bitcoinRate < previousRate) {
      setTrend("down")
    } else {
      setTrend("neutral")
    }

    setPreviousRate(bitcoinRate)
  }, [bitcoinRate, previousRate])

  return (
    <div className="p-4 bg-black border border-green-900 rounded-lg">
      <h3 className="text-lg font-bold mb-2 flex items-center">
        <Bitcoin className="h-5 w-5 mr-2" />
        Bitcoin Wallet
      </h3>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className="text-sm opacity-70">Balance</div>
          <div className="text-xl font-bold">{bitcoinBalance.toFixed(4)} BTC</div>
        </div>
        <div>
          <div className="text-sm opacity-70">Value</div>
          <div className="text-xl font-bold">
            ${balanceInUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between p-2 bg-gray-900 rounded">
        <div className="text-sm">Current Rate</div>
        <div className="flex items-center">
          {trend === "up" && <TrendingUp className="h-4 w-4 mr-1 text-green-400" />}
          {trend === "down" && <TrendingDown className="h-4 w-4 mr-1 text-red-400" />}
          <span className={`font-bold ${trend === "up" ? "text-green-400" : trend === "down" ? "text-red-400" : ""}`}>
            ${bitcoinRate.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  )
}
