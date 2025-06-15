"use client"

import { useState, useEffect } from "react"
import { useGameState } from "./game-context"
import { Bitcoin } from "lucide-react"
import { cn } from "@/lib/utils"
import { playSound } from "@/lib/sound-utils"

export default function MoneyPopup() {
  const { moneyNotifications, removeMoneyNotification } = useGameState()

  // Sound-Effekt für Geldeingang
  useEffect(() => {
    if (moneyNotifications.length > 0) {
      // Use the utility function with error handling
      playSound("/sounds/cash-register.mp3", 0.5).catch(() => {
        // Continue without sound if there's an error
        console.log("Continuing without sound effect")
      })
    }
  }, [moneyNotifications.length])

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {moneyNotifications.map((notification) => (
        <MoneyNotification
          key={notification.id}
          amount={notification.amount}
          message={notification.message}
          onRemove={() => removeMoneyNotification(notification.id)}
        />
      ))}
    </div>
  )
}

interface MoneyNotificationProps {
  amount: number
  message: string
  onRemove: () => void
}

function MoneyNotification({ amount, message, onRemove }: MoneyNotificationProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [isLeaving, setIsLeaving] = useState(false)

  useEffect(() => {
    // Start exit animation after 4 seconds
    const exitTimer = setTimeout(() => {
      setIsLeaving(true)
    }, 4000)

    // Remove component after exit animation (500ms)
    const removeTimer = setTimeout(() => {
      setIsVisible(false)
      onRemove()
    }, 4500)

    return () => {
      clearTimeout(exitTimer)
      clearTimeout(removeTimer)
    }
  }, [onRemove])

  if (!isVisible) return null

  return (
    <div
      className={cn(
        "bg-black border border-green-500 text-green-400 p-3 rounded-md shadow-lg flex items-center",
        "transform transition-all duration-500 ease-in-out",
        "animate-slideIn",
        isLeaving ? "opacity-0 translate-x-full" : "opacity-100",
      )}
    >
      <Bitcoin className="h-6 w-6 mr-2 text-green-500" />
      <div>
        <div className="font-bold text-lg">+{amount.toFixed(4)} BTC</div>
        <div className="text-sm text-green-300">{message}</div>
      </div>
    </div>
  )
}
