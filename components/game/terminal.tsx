"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useGameState } from "./game-context"
import { Button } from "@/components/ui/button"
import { HelpCircle } from "lucide-react"

export default function Terminal() {
  const {
    addTerminalCommand,
    bitcoinBalance,
    bitcoinRate,
    setCurrentMission,
    completedMissions,
    updateBitcoinBalance,
  } = useGameState()
  const [input, setInput] = useState("")
  const [output, setOutput] = useState<string[]>(["INTRUSION Terminal v1.0", 'Type "help" for available commands.', ""])
  const [showHelp, setShowHelp] = useState(false)
  const terminalRef = useRef<HTMLDivElement>(null)

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    const command = input.trim()
    addTerminalCommand(command)
    setOutput((prev) => [...prev, `n0seC@echovoid:~$ ${command}`])

    // Process command
    processCommand(command)
    setInput("")
  }

  const processCommand = (command: string) => {
    const cmd = command.toLowerCase()
    const args = cmd.split(" ")

    switch (args[0]) {
      case "help":
        setOutput((prev) => [
          ...prev,
          "Available commands:",
          "  help - Show this help message",
          "  clear - Clear the terminal",
          "  ls - List files in current directory",
          "  cat <file> - Display file contents",
          "  nmap <ip> - Scan network",
          "  ssh <user>@<ip> - Connect to remote server",
          "  bitcoin - Check bitcoin wallet",
          "  mission <id> - Start a hacking mission",
          "  whoami - Display current user",
          "  ifconfig - Display network configuration",
          "",
        ])
        break
      case "clear":
        setOutput(["INTRUSION Terminal v1.0", 'Type "help" for available commands.', ""])
        break
      case "ls":
        setOutput((prev) => [
          ...prev,
          "Documents/",
          "Downloads/",
          "mission_1.txt",
          "contacts.enc",
          "wallet.dat",
          completedMissions.includes("mission1") ? "volkov_data.sql" : "",
          "",
        ])
        break
      case "cat":
        if (args[1] === "mission_1.txt") {
          setOutput((prev) => [
            ...prev,
            "--- MISSION 1 ---",
            "Target: Local ISP database",
            'Objective: Extract customer records for "Alexander Volkov"',
            "Reward: 0.15 BTC",
            "Note: Use nmap to scan 192.168.1.100 for open ports",
            "",
            "Type 'mission start 1' to begin the mission.",
            "",
          ])
        } else if (args[1] === "contacts.enc") {
          setOutput((prev) => [...prev, "File is encrypted. Decryption key required.", ""])
        } else if (args[1] === "wallet.dat") {
          setOutput((prev) => [...prev, 'Binary file. Use "bitcoin" command to access wallet.', ""])
        } else if (args[1] === "volkov_data.sql" && completedMissions.includes("mission1")) {
          setOutput((prev) => [
            ...prev,
            "-- MySQL dump of customer data",
            "-- Host: 192.168.1.100    Database: customers",
            "-- ------------------------------------------------------",
            "-- Server version\t8.0.27",
            "",
            "/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;",
            "/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;",
            "",
            "-- Table structure for table `users`",
            "",
            "DROP TABLE IF EXISTS `users`;",
            "CREATE TABLE `users` (",
            "  `id` int NOT NULL AUTO_INCREMENT,",
            "  `name` varchar(255) NOT NULL,",
            "  `email` varchar(255) NOT NULL,",
            "  `phone` varchar(20) DEFAULT NULL,",
            "  PRIMARY KEY (`id`)",
            ");",
            "",
            "-- Dumping data for table `users`",
            "",
            "INSERT INTO `users` VALUES (42,'Alexander Volkov','avolkov@mail.ru','+7 9123456789');",
            "",
            "/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;",
            "/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;",
            "",
          ])
        } else {
          setOutput((prev) => [...prev, `File not found: ${args[1] || ""}`, ""])
        }
        break
      case "nmap":
        if (args[1]) {
          setOutput((prev) => [
            ...prev,
            `Starting Nmap scan for ${args[1]}...`,
            "Scanning...",
            "PORT     STATE  SERVICE",
            "22/tcp   open   ssh",
            "80/tcp   open   http",
            "443/tcp  open   https",
            "3306/tcp open   mysql",
            "Nmap scan complete.",
            "",
          ])
        } else {
          setOutput((prev) => [...prev, "Usage: nmap <ip>", ""])
        }
        break
      case "ssh":
        if (args[1]) {
          setOutput((prev) => [
            ...prev,
            `Connecting to ${args[1]}...`,
            "Connection failed: Authentication required.",
            "Hint: Find credentials in the darknet.",
            "",
          ])
        } else {
          setOutput((prev) => [...prev, "Usage: ssh <user>@<ip>", ""])
        }
        break
      case "bitcoin":
        setOutput((prev) => [
          ...prev,
          "Bitcoin Wallet",
          "-------------",
          `Balance: ${bitcoinBalance.toFixed(4)} BTC`,
          `Current Value: $${(bitcoinBalance * bitcoinRate).toLocaleString(undefined, { maximumFractionDigits: 2 })} USD`,
          `Current Rate: $${bitcoinRate.toLocaleString()} / BTC`,
          "Recent Transactions:",
          completedMissions.includes("mission1")
            ? "  [IN]  0.1500 BTC - Mission Reward - From: DARKROOM"
            : "  [IN]  0.1000 BTC - 3 days ago - From: DARKROOM",
          "  [IN]  0.1500 BTC - 7 days ago - From: UNKNOWN",
          "",
        ])
        break
      case "test-money":
        setOutput((prev) => [...prev, "Testing money notification...", ""])
        updateBitcoinBalance(0.05, "Test notification")
        break
      case "mission":
        if (args[1] === "start" && args[2] === "1") {
          setOutput((prev) => [...prev, "Starting Mission 1: Data Extraction", "Loading mission interface...", ""])
          setTimeout(() => {
            setCurrentMission("mission1")
          }, 1000)
        } else {
          setOutput((prev) => [
            ...prev,
            "Available missions:",
            "  1 - Data Extraction (ISP Database)",
            "",
            "Usage: mission start <mission_id>",
            "",
          ])
        }
        break
      case "whoami":
        setOutput((prev) => [
          ...prev,
          "n0seC",
          "User ID: 1337",
          "Groups: hackers, admin",
          "Alias: n0seC",
          "Cover: IT Freelancer",
          "",
        ])
        break
      case "ifconfig":
        setOutput((prev) => [
          ...prev,
          "eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500",
          "        inet 192.168.1.5  netmask 255.255.255.0  broadcast 192.168.1.255",
          "        inet6 fe80::216:3eff:fe74:5e9a  prefixlen 64  scopeid 0x20<link>",
          "        ether 00:16:3e:74:5e:9a  txqueuelen 1000  (Ethernet)",
          "        RX packets 8762  bytes 1846132 (1.8 MB)",
          "        RX errors 0  dropped 0  overruns 0  frame 0",
          "        TX packets 5091  bytes 471876 (471.8 KB)",
          "        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0",
          "",
          "tun0: flags=4305<UP,POINTOPOINT,RUNNING,NOARP,MULTICAST>  mtu 1500",
          "        inet 10.8.0.6  netmask 255.255.255.0  destination 10.8.0.5",
          "        unspec 00-00-00-00-00-00-00-00-00-00-00-00-00-00-00-00  txqueuelen 100  (UNSPEC)",
          "        RX packets 124  bytes 12512 (12.5 KB)",
          "        RX errors 0  dropped 0  overruns 0  frame 0",
          "        TX packets 187  bytes 18254 (18.2 KB)",
          "        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0",
          "",
        ])
        break
      default:
        setOutput((prev) => [...prev, `Command not found: ${args[0]}`, ""])
    }
  }

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [output])

  return (
    <div className="h-full flex flex-col bg-black text-green-500 p-4 font-mono relative">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-bold">Terminal</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowHelp(!showHelp)}
          className="border-green-500 text-green-500 hover:bg-green-900"
        >
          <HelpCircle className="h-4 w-4 mr-1" />
          {showHelp ? "Hide Help" : "Show Help"}
        </Button>
      </div>

      {showHelp && (
        <div className="bg-black border border-green-500 p-4 mb-4 text-sm">
          <h3 className="font-bold mb-2">Terminal Commands:</h3>
          <ul className="list-disc pl-5">
            <li>help - Show available commands</li>
            <li>clear - Clear terminal screen</li>
            <li>ls - List files in current directory</li>
            <li>cat &lt;file&gt; - Display file contents</li>
            <li>nmap &lt;ip&gt; - Scan network for open ports</li>
            <li>ssh &lt;user&gt;@&lt;ip&gt; - Connect to remote server</li>
            <li>bitcoin - Check bitcoin wallet</li>
            <li>mission &lt;id&gt; - Start a hacking mission</li>
            <li>whoami - Display current user</li>
            <li>ifconfig - Display network configuration</li>
          </ul>
        </div>
      )}

      <div
        ref={terminalRef}
        className="flex-1 overflow-y-auto bg-black text-green-500 font-mono p-2 whitespace-pre-wrap"
      >
        {output.map((line, i) => (
          <div key={i} className="mb-1">
            {line}
          </div>
        ))}
      </div>

      <form onSubmit={handleCommand} className="mt-2 flex">
        <span className="mr-2">n0seC@echovoid:~$</span>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 bg-black text-green-500 border-none outline-none"
          autoFocus
        />
      </form>
    </div>
  )
}
