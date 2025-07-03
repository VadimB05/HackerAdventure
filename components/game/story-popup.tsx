"use client"

import { useState, useEffect } from "react"
import { useGameState } from '@/lib/contexts/game-context'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { SkipForward } from "lucide-react"

export default function StoryPopup() {
  const { currentStory, setCurrentStory } = useGameState()
  const [currentTextIndex, setCurrentTextIndex] = useState(0)
  const [displayedText, setDisplayedText] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [typingSpeed, setTypingSpeed] = useState(30) // Millisekunden pro Zeichen

  // Wenn eine neue Story angezeigt wird, starte mit dem ersten Text
  useEffect(() => {
    if (currentStory) {
      setCurrentTextIndex(0)
      setDisplayedText("")
      setIsTyping(true)
    }
  }, [currentStory])

  // Schreibmaschineneffekt für den Text
  useEffect(() => {
    if (!currentStory || currentTextIndex >= currentStory.content.length) return

    const fullText = currentStory.content[currentTextIndex]

    if (!isTyping) return

    if (displayedText === fullText) {
      setIsTyping(false)
      return
    }

    const nextChar = fullText.charAt(displayedText.length)
    const delay = nextChar === " " ? typingSpeed / 2 : typingSpeed

    const timeout = setTimeout(() => {
      setDisplayedText(displayedText + nextChar)
    }, delay)

    return () => clearTimeout(timeout)
  }, [currentStory, currentTextIndex, displayedText, isTyping, typingSpeed])

  // Zum nächsten Text wechseln
  const nextText = () => {
    if (!currentStory) return

    if (isTyping) {
      // Wenn noch getippt wird, zeige den vollständigen Text sofort an
      setDisplayedText(currentStory.content[currentTextIndex])
      setIsTyping(false)
      return
    }

    if (currentTextIndex < currentStory.content.length - 1) {
      setCurrentTextIndex(currentTextIndex + 1)
      setDisplayedText("")
      setIsTyping(true)
    } else {
      // Ende der Story erreicht
      closeStory()
    }
  }

  // Story überspringen und schließen
  const skipStory = () => {
    closeStory()
  }

  // Story schließen
  const closeStory = () => {
    setCurrentStory(null)
    setCurrentTextIndex(0)
    setDisplayedText("")
  }

  if (!currentStory) return null

  return (
    <Dialog open={!!currentStory} onOpenChange={closeStory}>
      <DialogContent className="bg-black border border-green-500 text-green-500 max-w-2xl mx-auto p-0 overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>
            {currentStory.title || (currentStory.type === "dialog" ? "Dialog" : "Transmission")}
          </DialogTitle>
        </DialogHeader>
        <div className="relative">
          {/* Header mit Titel und Skip-Button */}
          <div className="flex justify-between items-center p-4 border-b border-green-800">
            <h2 className="text-xl font-mono font-bold text-green-400">
              {currentStory.title || (currentStory.type === "dialog" ? "Dialog" : "Transmission")}
            </h2>
            <Button variant="ghost" size="sm" onClick={skipStory} className="text-green-400 hover:bg-green-900/30">
              <SkipForward className="h-4 w-4 mr-1" />
              Skip
            </Button>
          </div>

          {/* Story-Inhalt */}
          <div className="p-6 min-h-[200px] bg-black/90">
            {currentStory.type === "dialog" && currentStory.speaker && (
              <div className="mb-4 text-green-300 font-bold">{currentStory.speaker}:</div>
            )}

            <div className="font-mono text-green-400 whitespace-pre-line leading-relaxed">
              {displayedText}
              <span className="animate-pulse">|</span>
            </div>
          </div>

          {/* Footer mit Fortschrittsanzeige und Next-Button */}
          <div className="flex justify-between items-center p-4 border-t border-green-800">
            <div className="flex space-x-1">
              {currentStory.content.map((_, index) => (
                <div
                  key={index}
                  className={`h-1 w-6 ${
                    index === currentTextIndex
                      ? "bg-green-400"
                      : index < currentTextIndex
                        ? "bg-green-700"
                        : "bg-green-900"
                  }`}
                />
              ))}
            </div>
            <Button onClick={nextText} className="bg-green-900 hover:bg-green-800">
              {isTyping ? "Skip Typing" : currentTextIndex < currentStory.content.length - 1 ? "Next" : "Close"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
