"use client"

import { useEffect, useState } from "react"
import { useGameState } from '@/lib/contexts/game-context'
import { playSound, stopSound } from "@/lib/sound-utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Volume2, VolumeX, Play, SkipForward, MessageSquare, ArrowLeft } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { autoSave } from '@/lib/services/save-service'

export default function IntroStory() {
  const { showStory } = useGameState()
  const [hasShownIntro, setHasShownIntro] = useState(false)
  const [showVoiceNote, setShowVoiceNote] = useState(false)
  const [showText, setShowText] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [hasPlayedOnce, setHasPlayedOnce] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [confirmAction, setConfirmAction] = useState<'skip' | 'close' | null>(null)
  const [shouldShowIntro, setShouldShowIntro] = useState<boolean | null>(null)

  const VOICE_NOTE_PATH = '/sounds/voice/intro-narrator.mp3'

  // Prüfe beim Mounten, ob ein Speicherpunkt existiert
  useEffect(() => {
    console.log('[DEBUG] useEffect: checkIntroSave (IntroStory) MOUNTED');
    const checkIntroSave = async () => {
      try {
        const authResponse = await fetch('/api/auth/verify', {
          method: 'GET',
          credentials: 'include'
        });
        if (!authResponse.ok) {
          setShouldShowIntro(true)
          return
        }
        const authData = await authResponse.json();
        if (!authData.user || !authData.user.id) {
          setShouldShowIntro(true)
          return
        }
        const saveRes = await fetch(`/api/game/save?userId=${authData.user.id}`, {
          method: 'GET',
          credentials: 'include'
        });
        if (!saveRes.ok) {
          setShouldShowIntro(true)
          return
        }
        const saveData = await saveRes.json();
        const found = saveData.savePoints && saveData.savePoints.some((sp: any) => sp.eventType === 'game_started');
        setShouldShowIntro(!found)
      } catch (e) {
        setShouldShowIntro(true)
      }
    }
    checkIntroSave();
  }, []);

  useEffect(() => {
    console.log('[DEBUG] useEffect: showVoiceNote (IntroStory) MOUNTED');
    // Zeige die Sprachnotiz nur beim ersten Laden und nur einmal
    if (!hasShownIntro && shouldShowIntro) {
      const timer = setTimeout(() => {
        setShowVoiceNote(true)
        setHasShownIntro(true)
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [hasShownIntro, shouldShowIntro])

  // Cleanup beim Unmount
  useEffect(() => {
    console.log('[DEBUG] useEffect: cleanup (IntroStory) MOUNTED');
    return () => {
      console.log('[DEBUG] useEffect: cleanup (IntroStory) UNMOUNTED');
      // Stoppe Audio beim Unmount
      stopSound(VOICE_NOTE_PATH)
    }
  }, [])

  const handlePlayVoiceNote = async () => {
    if (isPlaying) return

    setIsPlaying(true)
    
    try {
      // Sound-Effekt für Sprachnotiz abspielen
      await playSound(VOICE_NOTE_PATH, 0.7)
      setHasPlayedOnce(true)
    } catch (error) {
      // Stille Behandlung - zeige Text an, wenn Audio nicht verfügbar ist
      console.log('Voice note sound not available, showing text instead')
      setShowText(true)
      setHasPlayedOnce(true) // Markiere als "gehört", damit keine Bestätigung mehr nötig ist
    } finally {
      setIsPlaying(false)
    }
  }

  const handleSkip = () => {
    // Bestätigung nur anzeigen, wenn noch nicht abgespielt wurde
    if (!hasPlayedOnce) {
      setConfirmAction('skip')
      setShowConfirmDialog(true)
    } else {
      confirmSkip()
    }
  }

  const handleClose = () => {
    // Bestätigung nur anzeigen, wenn noch nicht abgespielt wurde
    if (!hasPlayedOnce) {
      setConfirmAction('close')
      setShowConfirmDialog(true)
    } else {
      confirmClose()
    }
  }

  const confirmSkip = async () => {
    // Stoppe das Audio
    stopSound(VOICE_NOTE_PATH)
    setIsPlaying(false)
    
    // Sound-Effekt für Skip
    playSound('/sounds/ui/button-click.mp3', 0.3).catch(() => {
      console.log('Skip sound not available')
    })
    setShowVoiceNote(false)
    setShowConfirmDialog(false)
    setConfirmAction(null)

    // Speicherpunkt anlegen
    try {
      // Aktuelle User-ID holen
      const authResponse = await fetch('/api/auth/verify', {
        method: 'GET',
        credentials: 'include'
      });
      
      if (authResponse.ok) {
        const authData = await authResponse.json();
        if (authData.user && authData.user.id) {
          await autoSave(authData.user.id, {
            type: 'game_started',
            data: { reason: 'Intro-Sprachnotiz übersprungen' },
            timestamp: new Date().toISOString()
          });
        }
      }
    } catch (e) {
      console.error('Fehler beim Speichern des Intro-Speicherpunkts:', e);
      // Fehler ignorieren, Spiel geht weiter
    }
  }

  const confirmClose = async () => {
    // Stoppe das Audio
    stopSound(VOICE_NOTE_PATH)
    setIsPlaying(false)
    
    // Sound-Effekt für Schließen
    playSound('/sounds/ui/popup-close.mp3', 0.3).catch(() => {
      console.log('Close sound not available')
    })
    setShowVoiceNote(false)
    setShowText(false)
    setShowConfirmDialog(false)
    setConfirmAction(null)

    // Speicherpunkt anlegen
    try {
      // Aktuelle User-ID holen
      const authResponse = await fetch('/api/auth/verify', {
        method: 'GET',
        credentials: 'include'
      });
      
      if (authResponse.ok) {
        const authData = await authResponse.json();
        if (authData.user && authData.user.id) {
          await autoSave(authData.user.id, {
            type: 'game_started',
            data: { reason: 'Intro-Sprachnotiz geschlossen' },
            timestamp: new Date().toISOString()
          });
        }
      }
    } catch (e) {
      console.error('Fehler beim Speichern des Intro-Speicherpunkts:', e);
      // Fehler ignorieren
    }
  }

  const handleCancelConfirm = () => {
    // Sound-Effekt für Abbrechen
    playSound('/sounds/ui/button-click.mp3', 0.3).catch(() => {
      console.log('Button click sound not available')
    })
    setShowConfirmDialog(false)
    setConfirmAction(null)
  }

  const handleShowText = () => {
    // Sound-Effekt für Button-Click
    playSound('/sounds/ui/button-click.mp3', 0.3).catch(() => {
      console.log('Button click sound not available')
    })
    setShowText(true)
  }

  const voiceNoteText = [
    "Ey… hör zu. Es ist heiß – verdammt heiß! Die Russen wissen, dass du noch lebst!",
    "Ich weiß nicht wie, aber sie sind dran an dir. Ich hab 'nen Ping gesehen tief im FSB-Netz. Das wars mit dir!",
    "Du musst jetzt Kohle machen – schnell. Alles, was du kriegen kannst. Und dann raus da. Verschwinde!",
    "Ich hab dir was im Darknet hinterlassen – ein Job. Riskant, aber es könnte reichen, um unterzutauchen.",
    "Du weißt, wie das läuft… keine Spuren. Kein Vertrauen.",
    "Mach's gut, Bruder… und pass auf dich auf!"
  ]

  if (shouldShowIntro === false) {
    // Es gibt bereits einen Speicherpunkt, Intro nicht anzeigen
    return null;
  }

  return (
    <AnimatePresence>
      {showVoiceNote && (
        <motion.div
          key="voice-note-dialog"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="w-full max-w-md bg-gray-800/95 backdrop-blur-sm border-gray-600 shadow-2xl">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-lg flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-red-400" />
                    Sprachnotiz
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handleShowText}
                      variant="ghost"
                      size="sm"
                      className="text-gray-400 hover:text-white p-1 h-8 w-8"
                      title="Text einblenden"
                    >
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={handleSkip}
                      variant="ghost"
                      size="sm"
                      className="text-gray-400 hover:text-white p-1 h-8 w-8"
                      title="Überspringen"
                    >
                      <SkipForward className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {!showText ? (
                  <>
                    {/* Volume-Hinweis */}
                    <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-3 mb-4">
                      <div className="flex items-center gap-2 text-yellow-400 mb-2">
                        <Volume2 className="h-4 w-4" />
                        <span className="text-sm font-medium">Volume prüfen</span>
                      </div>
                      <p className="text-xs text-yellow-300">
                        Stelle sicher, dass dein Lautsprecher eingeschaltet ist und die Lautstärke hoch genug ist.
                      </p>
                    </div>

                    {/* Sprachnotiz-Player */}
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 mx-auto bg-red-500/20 rounded-full flex items-center justify-center">
                        <MessageSquare className="h-8 w-8 text-red-400" />
                      </div>
                      
                      <div>
                        <h3 className="text-white font-medium mb-2">Unbekannter Anrufer</h3>
                        <p className="text-sm text-gray-400">Dringende Nachricht</p>
                      </div>

                      <div className="flex justify-center gap-3">
                        <Button
                          onClick={handlePlayVoiceNote}
                          disabled={isPlaying}
                          className="bg-red-600 hover:bg-red-700 text-white px-6"
                        >
                          <Play className="h-4 w-4 mr-2" />
                          {isPlaying ? "Spielt ab..." : hasPlayedOnce ? "Nochmal hören" : "Höre Sprachnotiz"}
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Text-Version */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-5 w-5 text-red-400" />
                          <h3 className="text-white font-medium">Transkript der Sprachnotiz</h3>
                        </div>
                        <Button
                          onClick={() => {
                            playSound('/sounds/ui/button-click.mp3', 0.3).catch(() => {
                              console.log('Button click sound not available')
                            })
                            setShowText(false)
                          }}
                          variant="ghost"
                          size="sm"
                          className="text-gray-400 hover:text-white p-1 h-8 w-8"
                          title="Zurück zur Sprachnotiz"
                        >
                          <ArrowLeft className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {voiceNoteText
                          .filter((text, index) => text.trim() !== '') // Filtere leere Strings
                          .map((text, index) => (
                            <p key={`voice-note-${index}-${text.substring(0, 10)}`} className="text-gray-300 text-sm leading-relaxed">
                              {text}
                            </p>
                          ))}
                      </div>
                    </div>
                  </>
                )}

                <div className="flex justify-end pt-4">
                  <Button
                    onClick={handleClose}
                    className="bg-gray-600 hover:bg-gray-700 text-white"
                  >
                    Schließen
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}

      {showConfirmDialog && (
        <motion.div
          key="confirm-dialog"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="w-full max-w-sm bg-gray-800/95 backdrop-blur-sm border-gray-600 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-yellow-400" />
                  Bestätigung erforderlich
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-gray-300 text-sm">
                  {confirmAction === 'skip' 
                    ? "Bist du sicher, dass du die erste Sequenz überspringen möchtest? Diese wichtige Nachricht könnte entscheidend für deine Mission sein."
                    : "Bist du sicher, dass du die Sprachnotiz schließen möchtest? Du hast sie noch nicht vollständig gehört."
                  }
                </p>
                
                <div className="flex justify-end gap-3">
                  <Button
                    onClick={handleCancelConfirm}
                    variant="outline"
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    Abbrechen
                  </Button>
                  <Button
                    onClick={confirmAction === 'skip' ? confirmSkip : confirmClose}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    {confirmAction === 'skip' ? 'Überspringen' : 'Schließen'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
