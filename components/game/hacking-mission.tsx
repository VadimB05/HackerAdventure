"use client"

import { useState, useEffect } from "react"
import { useGameState } from "./game-context"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { TerminalIcon, Shield, Database, Server, AlertTriangle, CheckCircle, HelpCircle } from "lucide-react"
// Füge den Import für den Neustart-Button hinzu
import MissionRestartButton from "./mission-restart-button"

export default function HackingMission() {
  const { currentMission, setCurrentMission, completeMission, getMission } = useGameState()
  const [steps, setSteps] = useState<any[]>([])
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [showTooltip, setShowTooltip] = useState(true)

  const mission = currentMission ? getMission(currentMission) : null
  const isGuidedMission = mission?.type === "guided"

  // Mission 1: Daten aus einer Datenbank extrahieren
  useEffect(() => {
    if (currentMission === "mission1" && mission?.steps) {
      setSteps(mission.steps)
      setCurrentStepIndex(0)
      setShowTooltip(true)
    }
  }, [currentMission, mission])

  // Schritt als abgeschlossen markieren
  const completeStep = (index: number) => {
    setSteps((prevSteps) => prevSteps.map((step, i) => (i === index ? { ...step, completed: true } : step)))

    // Zum nächsten Schritt wechseln
    if (index < steps.length - 1) {
      setCurrentStepIndex(index + 1)
    } else {
      // Mission abgeschlossen
      if (currentMission) {
        completeMission(currentMission)
        setTimeout(() => {
          setCurrentMission(null)
        }, 2000)
      }
    }
  }

  // Mission abbrechen
  const cancelMission = () => {
    setCurrentMission(null)
  }

  // Wenn es keine Mission gibt oder es eine Terminal-Mission ist, zeige nichts an
  if (!mission || mission.type === "terminal") return null

  return (
    <Dialog open={!!currentMission} onOpenChange={() => {}}>
      <DialogContent className="bg-black border border-green-500 text-green-500 max-w-3xl mx-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-green-400 flex items-center">
            <TerminalIcon className="h-5 w-5 mr-2" />
            {mission.title}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-4 mt-4">
          {/* Linke Spalte: Missionsschritte */}
          <div className="col-span-1 border-r border-green-900 pr-4">
            <h3 className="font-bold mb-2 text-green-400">Mission Steps</h3>
            <div className="space-y-2">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className={`p-2 rounded flex items-center ${
                    index === currentStepIndex
                      ? "bg-green-900/30 border border-green-500"
                      : step.completed
                        ? "bg-green-900/10"
                        : "opacity-50"
                  }`}
                >
                  <div className="mr-2">
                    {step.completed ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : index === currentStepIndex ? (
                      <Server className="h-4 w-4 text-yellow-500 animate-pulse" />
                    ) : (
                      <Shield className="h-4 w-4 text-green-700" />
                    )}
                  </div>
                  <span className={step.completed ? "line-through opacity-70" : ""}>{step.title}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Rechte Spalte: Aktueller Schritt */}
          <div className="col-span-2">
            {steps.length > 0 && (
              <div>
                <h3 className="font-bold text-lg mb-2">{steps[currentStepIndex].title}</h3>
                <p className="mb-4 text-green-400">{steps[currentStepIndex].description}</p>

                <div className="mb-4">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-green-700">Erforderlicher Befehl:</span>
                    <TooltipProvider>
                      <Tooltip open={showTooltip}>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowTooltip(!showTooltip)}
                            className="h-6 text-xs text-green-700 hover:text-green-500"
                          >
                            <HelpCircle className="h-3 w-3 mr-1" />
                            Hilfe
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent
                          side="bottom"
                          className="max-w-xs bg-black border border-green-700 text-green-500 p-3"
                        >
                          <p>{steps[currentStepIndex].hint}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="font-mono bg-gray-900 p-3 rounded border border-green-900">
                    {steps[currentStepIndex].command}
                  </div>
                </div>

                <div className="bg-gray-900/50 p-4 rounded border border-green-900 mb-4 min-h-[100px]">
                  <div className="flex items-center mb-2">
                    <Database className="h-4 w-4 mr-2 text-green-700" />
                    <span className="text-sm text-green-700">Simulierte Ausgabe:</span>
                  </div>
                  {currentStepIndex === 0 && (
                    <div className="font-mono text-sm">
                      <p>Starting Nmap 7.92 ( https://nmap.org )</p>
                      <p>Scanning 192.168.1.100 [1000 ports]</p>
                      <p className="text-green-400">PORT STATE SERVICE VERSION</p>
                      <p className="text-green-400">22/tcp open ssh OpenSSH 8.4p1</p>
                      <p className="text-green-400">80/tcp open http Apache httpd 2.4.46</p>
                      <p className="text-green-400">3306/tcp open mysql MySQL 8.0.27</p>
                      <p>Service detection performed. Please report any incorrect results.</p>
                      <p>Nmap done: 1 IP address (1 host up) scanned in 12.05 seconds</p>
                    </div>
                  )}
                  {currentStepIndex === 1 && (
                    <div className="font-mono text-sm">
                      <p>admin@192.168.1.100&apos;s password: *********</p>
                      <p>Last login: Wed May 1 14:22:31 2024 from 192.168.1.5</p>
                      <p className="text-green-400">Connection established to ISP-DB-Server</p>
                      <p>admin@ISP-DB-Server:~$ </p>
                    </div>
                  )}
                  {currentStepIndex === 2 && (
                    <div className="font-mono text-sm">
                      <p>Enter password: *********</p>
                      <p className="text-green-400">Welcome to the MySQL monitor. Commands end with ; or \g.</p>
                      <p>Your MySQL connection id is 345</p>
                      <p>Server version: 8.0.27 MySQL Community Server</p>
                      <p>mysql&gt; </p>
                    </div>
                  )}
                  {currentStepIndex === 3 && (
                    <div className="font-mono text-sm">
                      <p className="text-green-400">+----+----------------+------------------+----------------+</p>
                      <p className="text-green-400">| ID | NAME | EMAIL | PHONE |</p>
                      <p className="text-green-400">+----+----------------+------------------+----------------+</p>
                      <p className="text-green-400">| 42 | Alexander Volkov | avolkov@mail.ru | +7 9123456789 |</p>
                      <p className="text-green-400">+----+----------------+------------------+----------------+</p>
                      <p>1 row in set (0.00 sec)</p>
                      <p>mysql&gt; </p>
                    </div>
                  )}
                  {currentStepIndex === 4 && (
                    <div className="font-mono text-sm">
                      <p>Enter password: *********</p>
                      <p className="text-green-400">Dumping data for table &apos;users&apos;</p>
                      <p>Data exported successfully to volkov_data.sql</p>
                      <p className="text-yellow-400">Mission complete! Data extracted successfully.</p>
                      <p className="text-yellow-400">Reward: 0.15 BTC has been transferred to your wallet.</p>
                    </div>
                  )}
                </div>

                {/* Füge den Neustart-Button zur Benutzeroberfläche hinzu */}
                <div className="flex justify-between">
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      onClick={cancelMission}
                      className="border-red-700 text-red-500 hover:bg-red-900/20"
                    >
                      <AlertTriangle className="h-4 w-4 mr-1" />
                      Abbrechen
                    </Button>
                    <MissionRestartButton missionId={mission.id} />
                  </div>
                  <Button onClick={() => completeStep(currentStepIndex)} className="bg-green-900 hover:bg-green-800">
                    {currentStepIndex < steps.length - 1 ? "Nächster Schritt" : "Mission abschließen"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
