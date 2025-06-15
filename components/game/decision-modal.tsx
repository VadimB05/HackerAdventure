"use client"

import { useGameState, type DecisionOption } from "./game-context"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export default function DecisionModal() {
  const { currentDecision, makeDecision } = useGameState()

  if (!currentDecision) return null

  return (
    <Dialog open={!!currentDecision} onOpenChange={() => {}}>
      <DialogContent className="bg-black border border-green-500 text-green-500 max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-green-400">{currentDecision.title}</DialogTitle>
          <DialogDescription className="text-green-300 opacity-90">{currentDecision.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {currentDecision.options.map((option: DecisionOption) => (
            <Button
              key={option.id}
              onClick={() => makeDecision(option.id)}
              className="w-full text-left justify-start bg-gray-900 hover:bg-green-900 border border-green-800"
            >
              {option.text}
            </Button>
          ))}
        </div>

        <div className="text-xs text-green-600 mt-4 italic">Hinweis: Deine Entscheidung wird Konsequenzen haben.</div>
      </DialogContent>
    </Dialog>
  )
}
