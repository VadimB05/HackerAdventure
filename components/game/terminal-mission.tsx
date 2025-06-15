"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useGameState } from "./game-context"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { TerminalIcon, AlertTriangle, HelpCircle } from "lucide-react"
// Füge den Import für den Neustart-Button hinzu
import MissionRestartButton from "./mission-restart-button"

export default function TerminalMission() {
  const { currentMission, setCurrentMission, completeMission, getMission } = useGameState()
  const [currentCommandIndex, setCurrentCommandIndex] = useState(0)
  const [output, setOutput] = useState<string[]>([])
  const [showHint, setShowHint] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const outputRef = useRef<HTMLDivElement>(null)

  const mission = currentMission ? getMission(currentMission) : null
  const isTerminalMission = mission?.type === "terminal" && !!mission.commands

  // Fokussiere das Eingabefeld, wenn die Mission gestartet wird
  useEffect(() => {
    if (isTerminalMission && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isTerminalMission])

  // Scrolle zum Ende des Outputs
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }, [output])

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!inputValue.trim() || !mission || !mission.commands) return

    // Füge den eingegebenen Befehl zum Output hinzu
    setOutput((prev) => [...prev, `nova@echovoid:~$ ${inputValue}`])

    // Prüfe, ob der Befehl korrekt ist
    const currentCommand = mission.commands[currentCommandIndex]
    if (inputValue.trim() === currentCommand) {
      // Generiere eine simulierte Ausgabe basierend auf dem Befehl
      const simulatedOutput = generateOutput(inputValue, currentCommandIndex)

      // Füge die simulierte Ausgabe hinzu
      setTimeout(() => {
        setOutput((prev) => [...prev, ...simulatedOutput])

        // Gehe zum nächsten Befehl
        if (currentCommandIndex < mission.commands.length - 1) {
          setCurrentCommandIndex((prev) => prev + 1)
        } else {
          // Mission abgeschlossen
          setTimeout(() => {
            setOutput((prev) => [...prev, "", "Mission erfolgreich abgeschlossen!", ""])
            completeMission(mission.id)

            // Schließe die Mission nach einer kurzen Verzögerung
            setTimeout(() => {
              setCurrentMission(null)
            }, 3000)
          }, 1000)
        }
      }, 500)
    } else {
      // Falscher Befehl
      setTimeout(() => {
        setOutput((prev) => [...prev, "Befehl nicht erkannt oder fehlerhaft. Versuche es erneut."])
      }, 300)
    }

    // Leere das Eingabefeld
    setInputValue("")
  }

  // Generiere eine simulierte Ausgabe basierend auf dem Befehl
  const generateOutput = (command: string, index: number): string[] => {
    // Hier könnten wir für jeden Befehl eine spezifische Ausgabe definieren
    switch (index) {
      case 0: // hydra
        return [
          "Hydra v9.3 (c) 2022 by van Hauser/THC & David Maciejak - Please do not use in military or secret service organizations, or for illegal purposes (this is non-binding, these *** ignore laws and ethics anyway).",
          "",
          "Hydra (https://github.com/vanhauser-thc/thc-hydra) starting at 2024-05-01 21:45:13",
          "[DATA] max 16 tasks per 1 server, overall 16 tasks, 14344399 login tries (l:1/p:14344399), ~896525 tries per task",
          "[DATA] attacking http-post-form://192.168.1.200:8080/login.php",
          "[STATUS] 1694.00 tries/min, 1694 tries in 00:01h, 14342705 to do in 141:10h, 16 active",
          "[STATUS] 1652.00 tries/min, 4956 tries in 00:03h, 14339443 to do in 144:50h, 16 active",
          "[8080][http-post-form] host: 192.168.1.200   login: admin   password: P@ssw0rd123!",
          "[STATUS] attack finished for 192.168.1.200 (valid pair found)",
          "1 of 1 target successfully completed, 1 valid password found",
          "Hydra (https://github.com/vanhauser-thc/thc-hydra) finished at 2024-05-01 21:49:43",
          "",
        ]
      case 1: // ssh
        return [
          "admin@192.168.1.200's password: ",
          "Welcome to Ubuntu 20.04.4 LTS (GNU/Linux 5.4.0-107-generic x86_64)",
          "",
          " * Documentation:  https://help.ubuntu.com",
          " * Management:     https://landscape.canonical.com",
          " * Support:        https://ubuntu.com/advantage",
          "",
          "Last login: Wed May 1 21:30:12 2024 from 192.168.1.5",
          "admin@bankserver:~$ ",
          "",
        ]
      case 2: // cd
        return ["admin@bankserver:/var/www/html/bank$ ", ""]
      case 3: // cat
        return [
          "<?php",
          "// Database configuration",
          "$db_host = 'localhost';",
          "$db_name = 'bankdb';",
          "$db_user = 'bankadmin';",
          "$db_pass = 'P@ssw0rd123!';",
          "",
          "// Connect to database",
          "$conn = new mysqli($db_host, $db_user, $db_pass, $db_name);",
          "",
          "// Check connection",
          "if ($conn->connect_error) {",
          "    die('Connection failed: ' . $conn->connect_error);",
          "}",
          "?>",
          "",
        ]
      case 4: // mysql
        return [
          "Enter password: ",
          "Welcome to the MySQL monitor.  Commands end with ; or \\g.",
          "Your MySQL connection id is 345",
          "Server version: 8.0.28-0ubuntu0.20.04.3 (Ubuntu)",
          "",
          "Copyright (c) 2000, 2022, Oracle and/or its affiliates.",
          "",
          "Oracle is a registered trademark of Oracle Corporation and/or its",
          "affiliates. Other names may be trademarks of their respective",
          "owners.",
          "",
          "Type 'help;' or '\\h' for help. Type '\\c' to clear the current input statement.",
          "",
          "mysql> ",
          "",
        ]
      case 5: // SELECT
        return [
          "+------------+---------------+----------------+-------------+",
          "| account_id | account_name  | account_type   | balance     |",
          "+------------+---------------+----------------+-------------+",
          "| ACT7391    | James Wilson  | Savings        | 25430.75    |",
          "| ACT8842    | Sarah Johnson | Checking       | 1250.50     |",
          "| ACT9023    | Michael Brown | Business       | 125750.25   |",
          "| ACT1045    | Emma Davis    | Savings        | 18500.00    |",
          "| ACT3367    | Robert Taylor | Investment     | 350000.00   |",
          "+------------+---------------+----------------+-------------+",
          "5 rows in set (0.00 sec)",
          "",
          "mysql> ",
          "",
        ]
      case 6: // UPDATE
        return ["Query OK, 1 row affected (0.05 sec)", "Rows matched: 1  Changed: 1  Warnings: 0", "", "mysql> ", ""]
      case 7: // INSERT
        return ["Query OK, 1 row affected (0.06 sec)", "", "mysql> ", ""]
      case 8: // exit
        return [
          "Bye",
          "",
          "admin@bankserver:/var/www/html/bank$ ",
          "",
          "Connection to 192.168.1.200 closed.",
          "",
          "Mission erfolgreich! 10.000 wurden vom Konto ACT7391 auf das Konto ACT8842 überwiesen.",
          "Belohnung: 0.25 BTC wurden deinem Wallet gutgeschrieben.",
          "",
        ]
      default:
        return ["Befehl ausgeführt."]
    }
  }

  // Nur fortfahren, wenn es eine Terminal-Mission ist
  if (!isTerminalMission) return null

  const currentCommand = mission.commands[currentCommandIndex]

  return (
    <Dialog open={!!currentMission && isTerminalMission} onOpenChange={() => {}}>
      <DialogContent className="bg-black border border-green-500 text-green-500 max-w-4xl mx-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-green-400 flex items-center">
            <TerminalIcon className="h-5 w-5 mr-2" />
            {mission.title}
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          <div className="mb-4">
            <p className="text-green-400">{mission.description}</p>
            <p className="text-sm text-green-700 mt-2">Belohnung: {mission.reward} BTC</p>
          </div>

          <div className="bg-gray-950 border border-green-900 rounded-md p-4 mb-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-green-400">Terminal</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHint(!showHint)}
                className="text-green-700 hover:text-green-500 hover:bg-green-900/20"
              >
                <HelpCircle className="h-4 w-4 mr-1" />
                {showHint ? "Hinweis ausblenden" : "Hinweis anzeigen"}
              </Button>
            </div>

            {showHint && (
              <div className="bg-green-900/20 border border-green-800 rounded p-3 mb-4 text-sm">
                <p className="text-green-400">Nächster Befehl:</p>
                <code className="bg-black p-1 rounded text-green-300 block mt-1">{currentCommand}</code>
              </div>
            )}

            <div
              ref={outputRef}
              className="font-mono bg-black p-3 rounded h-64 overflow-y-auto mb-4 whitespace-pre-wrap"
            >
              {output.map((line, index) => (
                <div key={index} className="mb-1">
                  {line}
                </div>
              ))}
            </div>

            <form onSubmit={handleCommandSubmit} className="flex items-center">
              <span className="text-green-700 mr-2">nova@echovoid:~$</span>
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-green-500"
                autoComplete="off"
                spellCheck="false"
              />
            </form>
          </div>

          {/* Füge den Neustart-Button zur Benutzeroberfläche hinzu */}
          <div className="flex justify-between">
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => setCurrentMission(null)}
                className="border-red-700 text-red-500 hover:bg-red-900/20"
              >
                <AlertTriangle className="h-4 w-4 mr-1" />
                Mission abbrechen
              </Button>
              <MissionRestartButton missionId={mission.id} />
            </div>
            <div className="flex items-center">
              <span className="text-sm text-green-700 mr-2">
                Fortschritt: {currentCommandIndex + 1}/{mission.commands.length}
              </span>
              <div className="w-32 h-2 bg-gray-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-600"
                  style={{ width: `${((currentCommandIndex + 1) / mission.commands.length) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
