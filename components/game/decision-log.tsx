"use client"

import { useGameState } from '@/lib/contexts/game-context'
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatDistanceToNow } from "date-fns"
import { de } from "date-fns/locale"

export default function DecisionLog() {
  const { playerDecisions } = useGameState()

  if (playerDecisions.length === 0) {
    return (
      <div className="p-4 border border-green-900 rounded bg-black text-green-500">
        <h3 className="text-lg font-bold mb-2">Entscheidungsprotokoll</h3>
        <p className="text-sm opacity-70">Noch keine Entscheidungen getroffen.</p>
      </div>
    )
  }

  return (
    <div className="p-4 border border-green-900 rounded bg-black text-green-500">
      <h3 className="text-lg font-bold mb-2">Entscheidungsprotokoll</h3>
      <ScrollArea className="h-64">
        <div className="space-y-3">
          {playerDecisions.map((decision, index) => (
            <div key={index} className="border-l-2 border-green-700 pl-3 py-1">
              <div className="flex justify-between items-start">
                <span className="font-medium">Entscheidung #{playerDecisions.length - index}</span>
                <span className="text-xs opacity-70">
                  {formatDistanceToNow(new Date(decision.timestamp), { addSuffix: true, locale: de })}
                </span>
              </div>
              <p className="text-sm mt-1">{decision.consequence}</p>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
