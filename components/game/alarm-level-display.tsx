"use client"

import { useGameState } from "./game-context"
import { AlertTriangle, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"

export default function AlarmLevelDisplay() {
  const { alarmLevel, alarmNotifications, removeAlarmNotification } = useGameState()
  const [visibleNotifications, setVisibleNotifications] = useState<string[]>([])

  // Neue Benachrichtigungen automatisch anzeigen
  useEffect(() => {
    alarmNotifications.forEach(notification => {
      if (!visibleNotifications.includes(notification.id)) {
        setVisibleNotifications(prev => [...prev, notification.id])
        
        // Benachrichtigung nach 8 Sekunden automatisch ausblenden
        setTimeout(() => {
          setVisibleNotifications(prev => prev.filter(id => id !== notification.id))
          removeAlarmNotification(notification.id)
        }, 8000)
      }
    })
  }, [alarmNotifications, visibleNotifications, removeAlarmNotification])

  // Alarm-Level nur anzeigen, wenn > 0
  if (alarmLevel === 0) {
    return null
  }

  const getAlarmColor = (level: number) => {
    if (level >= 8) return "text-red-500"
    if (level >= 5) return "text-orange-500"
    if (level >= 3) return "text-yellow-500"
    return "text-green-500"
  }

  const getAlarmBgColor = (level: number) => {
    if (level >= 8) return "bg-red-900/20 border-red-500"
    if (level >= 5) return "bg-orange-900/20 border-orange-500"
    if (level >= 3) return "bg-yellow-900/20 border-yellow-500"
    return "bg-green-900/20 border-green-500"
  }

  return (
    <>
      {/* Alarm-Level-Anzeige */}
      <div className={`fixed top-4 right-4 z-[100] ${getAlarmBgColor(alarmLevel)} border-2 rounded-lg p-3 backdrop-blur-sm shadow-2xl`}>
        <div className="flex items-center space-x-2">
          <AlertTriangle className={`h-5 w-5 ${getAlarmColor(alarmLevel)} ${alarmLevel >= 8 ? 'animate-pulse' : ''}`} />
          <span className={`font-bold ${getAlarmColor(alarmLevel)}`}>
            ALARM LEVEL: {alarmLevel}/10
          </span>
        </div>
        {alarmLevel >= 8 && (
          <div className="text-red-400 text-xs mt-1 font-bold">
            ⚠️ FBI-WARNUNG: Du bist fast erwischt!
          </div>
        )}
      </div>

      {/* Alarm-Benachrichtigungen */}
      {alarmNotifications
        .filter(notification => visibleNotifications.includes(notification.id))
        .map((notification, index) => (
          <div
            key={notification.id}
            className={`fixed top-4 left-4 z-[100] bg-red-950/95 border-2 border-red-500 rounded-lg p-4 max-w-sm shadow-2xl animate-in slide-in-from-left-2 duration-500`}
            style={{ 
              top: `${4 + index * 90}px`,
              boxShadow: '0 0 20px rgba(239, 68, 68, 0.5)'
            }}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-red-400 animate-pulse" />
                  <span className="font-bold text-red-400 text-lg">
                    ⚠️ ALARM LEVEL {notification.level}
                  </span>
                </div>
                <p className="text-red-100 text-sm mb-2 font-medium">
                  {notification.message}
                </p>
                {notification.isFirstTime && (
                  <div className="bg-red-800/50 border border-red-600 rounded p-2 mt-2">
                    <p className="text-red-200 text-xs font-bold">
                      🚨 Das Alarm-Level-System ist jetzt aktiv!
                    </p>
                    <p className="text-red-300 text-xs mt-1">
                      Jeder Fehler erhöht das Alarm-Level. Bei Level 10 kommt das FBI!
                    </p>
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setVisibleNotifications(prev => prev.filter(id => id !== notification.id))
                  removeAlarmNotification(notification.id)
                }}
                className="text-red-400 hover:text-red-300 hover:bg-red-800/50 ml-2"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
    </>
  )
} 