"use client"

import type React from "react"

import { useState } from "react"
import { useGameState } from '@/lib/contexts/game-context'
import { Button } from "@/components/ui/button"
import { Shield, Wifi, Headphones, Brain } from "lucide-react"

type UpgradeType = "firewall" | "vpn" | "audio" | "ai"

interface Upgrade {
  id: UpgradeType
  name: string
  description: string
  level: number
  maxLevel: number
  cost: number
  icon: React.ReactNode
}

export default function Basement() {
  const { bitcoinBalance, updateBitcoinBalance } = useGameState()

  const [upgrades, setUpgrades] = useState<Upgrade[]>([
    {
      id: "firewall",
      name: "Firewall",
      description: "Protects against intrusion attempts",
      level: 1,
      maxLevel: 5,
      cost: 0.05,
      icon: <Shield className="h-6 w-6" />,
    },
    {
      id: "vpn",
      name: "VPN Nodes",
      description: "Masks your location and identity",
      level: 1,
      maxLevel: 5,
      cost: 0.08,
      icon: <Wifi className="h-6 w-6" />,
    },
    {
      id: "audio",
      name: "Audio Protection",
      description: "Prevents audio surveillance",
      level: 0,
      maxLevel: 3,
      cost: 0.12,
      icon: <Headphones className="h-6 w-6" />,
    },
    {
      id: "ai",
      name: "AI Defense",
      description: "Automated counter-measures",
      level: 0,
      maxLevel: 4,
      cost: 0.2,
      icon: <Brain className="h-6 w-6" />,
    },
  ])

  const [selectedUpgrade, setSelectedUpgrade] = useState<UpgradeType | null>(null)

  const handleUpgrade = (id: UpgradeType) => {
    const upgrade = upgrades.find((u) => u.id === id)
    if (!upgrade || upgrade.level >= upgrade.maxLevel) return

    if (bitcoinBalance >= upgrade.cost) {
      updateBitcoinBalance(-upgrade.cost)

      setUpgrades(
        upgrades.map((u) =>
          u.id === id ? { ...u, level: u.level + 1, cost: Math.round(u.cost * 1.5 * 100) / 100 } : u,
        ),
      )
    }
  }

  return (
    <div className="h-full flex flex-col bg-black text-green-500 p-4">
      <div className="mb-4">
        <h2 className="text-xl font-bold">BASEMENT</h2>
        <p className="text-sm opacity-70">Upgrade your security infrastructure</p>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
        {upgrades.map((upgrade) => (
          <div
            key={upgrade.id}
            className={`
              border rounded p-4 cursor-pointer transition-colors
              ${selectedUpgrade === upgrade.id ? "border-green-500 bg-green-900/20" : "border-gray-700 hover:border-green-700"}
              ${upgrade.level >= upgrade.maxLevel ? "opacity-50" : ""}
            `}
            onClick={() => setSelectedUpgrade(upgrade.id)}
          >
            <div className="flex items-center mb-2">
              <div className="mr-3 text-green-500">{upgrade.icon}</div>
              <div>
                <h3 className="font-bold">{upgrade.name}</h3>
                <p className="text-xs opacity-70">{upgrade.description}</p>
              </div>
            </div>

            <div className="flex justify-between items-center mt-4">
              <div className="flex space-x-1">
                {Array.from({ length: upgrade.maxLevel }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-full ${i < upgrade.level ? "bg-green-500" : "bg-gray-700"}`}
                  ></div>
                ))}
              </div>
              <div className="text-xs">
                Level {upgrade.level}/{upgrade.maxLevel}
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedUpgrade && (
        <div className="mt-4 p-4 border border-gray-700 rounded">
          <h3 className="font-bold mb-2">{upgrades.find((u) => u.id === selectedUpgrade)?.name} Details</h3>

          <div className="mb-4">
            <p className="mb-2">{upgrades.find((u) => u.id === selectedUpgrade)?.description}</p>
            <div className="text-sm grid grid-cols-2 gap-2">
              <div>Current Level:</div>
              <div>{upgrades.find((u) => u.id === selectedUpgrade)?.level}</div>
              <div>Max Level:</div>
              <div>{upgrades.find((u) => u.id === selectedUpgrade)?.maxLevel}</div>
              <div>Upgrade Cost:</div>
              <div>{upgrades.find((u) => u.id === selectedUpgrade)?.cost.toFixed(4)} BTC</div>
            </div>
          </div>

          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setSelectedUpgrade(null)}
              className="border-green-500 text-green-500 hover:bg-green-900"
            >
              Cancel
            </Button>

            <Button
              onClick={() => handleUpgrade(selectedUpgrade)}
              disabled={
                (upgrades.find((u) => u.id === selectedUpgrade)?.level || 0) >=
                  (upgrades.find((u) => u.id === selectedUpgrade)?.maxLevel || 0) ||
                bitcoinBalance < (upgrades.find((u) => u.id === selectedUpgrade)?.cost || 0)
              }
              className="bg-green-900 hover:bg-green-800 disabled:bg-gray-800"
            >
              Upgrade ({upgrades.find((u) => u.id === selectedUpgrade)?.cost.toFixed(4)} BTC)
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
