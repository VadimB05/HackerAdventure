"use client"

import { useState } from "react"
import { useGameState } from "./game-context"
import { Button } from "@/components/ui/button"
import { MessageSquare, Bitcoin, Shield, Grid3X3, ArrowLeft } from "lucide-react"

type App = "messages" | "bitcoin" | "vpn" | "home" | "message-detail"

interface SmsContact {
  id: string
  name: string | null
  phoneNumber: string
  messages: {
    content: string
    timestamp: string
    isIncoming: boolean
    isError?: boolean
    errorMessage?: string
  }[]
}

export default function Smartphone() {
  const { bitcoinBalance, bitcoinRate } = useGameState()
  const [currentApp, setCurrentApp] = useState<App>("home")
  const [selectedContact, setSelectedContact] = useState<SmsContact | null>(null)

  // SMS-Kontakte und Nachrichten
  const smsContacts: SmsContact[] = [
    {
      id: "1",
      name: null,
      phoneNumber: "+7 (495) 123-4567",
      messages: [
        {
          content: "Hey, ich vermisse dich",
          timestamp: new Date(Date.now() - 86400000 * 3).toISOString(), // 3 Tage alt
          isIncoming: true,
        },
        {
          content: "Lass mich in Ruhe",
          timestamp: new Date(Date.now() - 86400000 * 3 + 3600000).toISOString(), // 1 Stunde später
          isIncoming: false,
          isError: true,
          errorMessage: "Fehler: Nicht zustellbar",
        },
      ],
    },
    {
      id: "2",
      name: null,
      phoneNumber: "+7 (903) 555-1234",
      messages: [
        {
          content: "Bist du noch im Game?",
          timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 Tag alt
          isIncoming: true,
        },
      ],
    },
    {
      id: "3",
      name: "GameMaster",
      phoneNumber: "SYSTEM",
      messages: [
        {
          content: "Dein Account wurde aktiviert. Willkommen bei INTRUSION.",
          timestamp: new Date(Date.now() - 86400000 * 7).toISOString(), // 7 Tage alt
          isIncoming: true,
        },
      ],
    },
    {
      id: "4",
      name: "SecureNet",
      phoneNumber: "SYSTEM",
      messages: [
        {
          content: "Dein VPN-Abonnement läuft in 3 Tagen ab. Erneuere jetzt für kontinuierlichen Schutz.",
          timestamp: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 Tage alt
          isIncoming: true,
        },
      ],
    },
  ]

  const handleContactSelect = (contact: SmsContact) => {
    setSelectedContact(contact)
    setCurrentApp("message-detail")
  }

  const renderApp = () => {
    switch (currentApp) {
      case "messages":
        return (
          <div className="flex-1 overflow-y-auto p-4">
            <h3 className="text-lg font-bold mb-4">Messages</h3>
            {smsContacts.map((contact) => (
              <div
                key={contact.id}
                className="mb-4 p-3 rounded bg-gray-900 cursor-pointer hover:bg-gray-800"
                onClick={() => handleContactSelect(contact)}
              >
                <div className="flex justify-between mb-1">
                  <span className="font-bold">{contact.name || contact.phoneNumber}</span>
                  <span className="text-xs opacity-70">
                    {new Date(contact.messages[contact.messages.length - 1].timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="truncate text-sm">{contact.messages[contact.messages.length - 1].content}</p>
              </div>
            ))}
          </div>
        )
      case "message-detail":
        return (
          <div className="flex-1 overflow-y-auto p-4">
            <div className="flex items-center mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCurrentApp("messages")
                  setSelectedContact(null)
                }}
                className="mr-2 p-1"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h3 className="text-lg font-bold">{selectedContact?.name || selectedContact?.phoneNumber}</h3>
            </div>
            <div className="space-y-4">
              {selectedContact?.messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded max-w-[80%] ${msg.isIncoming ? "bg-gray-800" : "bg-green-900 ml-auto"}`}
                >
                  <p>{msg.content}</p>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs opacity-70">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                    {msg.isError && <span className="text-xs text-red-500">{msg.errorMessage}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      case "bitcoin":
        return (
          <div className="flex-1 overflow-y-auto p-4">
            <h3 className="text-lg font-bold mb-4">Bitcoin Wallet</h3>
            <div className="text-center mb-6">
              <div className="text-3xl font-bold mb-2">{bitcoinBalance.toFixed(4)} BTC</div>
              <div className="text-sm opacity-70">
                ≈ ${(bitcoinBalance * bitcoinRate).toLocaleString(undefined, { maximumFractionDigits: 2 })} USD
              </div>
            </div>

            <h4 className="font-bold mb-2">Price History</h4>
            <div className="h-32 bg-gray-900 mb-4 flex items-end p-2">
              {/* Placeholder for price chart */}
              <div className="w-full h-full flex items-end">
                {[30, 45, 40, 60, 55, 75, 65, 80, 70, 90].map((height, i) => (
                  <div key={i} className="flex-1 bg-green-500 mx-0.5" style={{ height: `${height}%` }}></div>
                ))}
              </div>
            </div>

            <div className="mb-4 p-3 bg-gray-900 rounded">
              <div className="flex justify-between items-center">
                <span className="font-bold">Current Rate</span>
                <span className="text-xl">${bitcoinRate.toLocaleString()} / BTC</span>
              </div>
              <div className="text-xs opacity-70 mt-1">Updates every 30 seconds</div>
            </div>

            <h4 className="font-bold mb-2">Recent Transactions</h4>
            <div className="space-y-2">
              <div className="p-2 bg-gray-900 rounded">
                <div className="flex justify-between">
                  <span>Received</span>
                  <span className="text-green-400">+0.1000 BTC</span>
                </div>
                <div className="text-xs opacity-70">From: DARKROOM</div>
              </div>
              <div className="p-2 bg-gray-900 rounded">
                <div className="flex justify-between">
                  <span>Received</span>
                  <span className="text-green-400">+0.1500 BTC</span>
                </div>
                <div className="text-xs opacity-70">From: UNKNOWN</div>
              </div>
            </div>
          </div>
        )
      case "vpn":
        return (
          <div className="flex-1 overflow-y-auto p-4">
            <h3 className="text-lg font-bold mb-4">Secure VPN</h3>
            <div className="text-center mb-6">
              <div className="inline-block p-4 rounded-full bg-green-900 mb-4">
                <Shield className="h-12 w-12 text-green-500" />
              </div>
              <div className="text-xl font-bold">Connected</div>
              <div className="text-sm opacity-70">IP: 185.213.155.XX</div>
              <div className="text-sm opacity-70">Location: Netherlands</div>
            </div>

            <div className="space-y-4">
              <div className="p-3 bg-gray-900 rounded">
                <div className="font-bold mb-1">Connection Statistics</div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Uptime:</div>
                  <div>3h 42m</div>
                  <div>Data Used:</div>
                  <div>1.2 GB</div>
                  <div>Encryption:</div>
                  <div>ChaCha20-Poly1305</div>
                </div>
              </div>

              <Button className="w-full bg-green-900 hover:bg-green-800">Change Location</Button>
            </div>
          </div>
        )
      case "home":
      default:
        return (
          <div className="flex-1 p-4">
            <div className="grid grid-cols-3 gap-4">
              <button
                onClick={() => setCurrentApp("messages")}
                className="flex flex-col items-center justify-center p-4 bg-gray-900 rounded hover:bg-gray-800"
              >
                <MessageSquare className="h-8 w-8 mb-2" />
                <span className="text-xs">Messages</span>
              </button>
              <button
                onClick={() => setCurrentApp("bitcoin")}
                className="flex flex-col items-center justify-center p-4 bg-gray-900 rounded hover:bg-gray-800"
              >
                <Bitcoin className="h-8 w-8 mb-2" />
                <span className="text-xs">Bitcoin</span>
              </button>
              <button
                onClick={() => setCurrentApp("vpn")}
                className="flex flex-col items-center justify-center p-4 bg-gray-900 rounded hover:bg-gray-800"
              >
                <Shield className="h-8 w-8 mb-2" />
                <span className="text-xs">VPN</span>
              </button>
              {/* Additional app placeholders */}
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="flex flex-col items-center justify-center p-4 bg-gray-900 rounded opacity-50">
                  <Grid3X3 className="h-8 w-8 mb-2" />
                  <span className="text-xs">App {i}</span>
                </div>
              ))}
            </div>
          </div>
        )
    }
  }

  return (
    <div className="h-full flex flex-col items-center justify-center bg-gray-950 p-4">
      <div className="w-full max-w-sm h-full max-h-[600px] bg-black border-4 border-gray-700 rounded-3xl overflow-hidden flex flex-col">
        {/* Phone status bar */}
        <div className="bg-gray-900 p-2 flex justify-between items-center text-xs">
          <span>4:20 PM</span>
          <div className="flex space-x-2">
            <span>5G</span>
            <span>100%</span>
          </div>
        </div>

        {/* Phone content area */}
        <div className="flex-1 flex flex-col bg-black text-green-500 overflow-hidden">
          {currentApp !== "home" && currentApp !== "message-detail" && (
            <div className="bg-gray-900 p-2 flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentApp("home")}
                className="text-green-500 hover:bg-green-900"
              >
                Back
              </Button>
              <h3 className="text-center flex-1">{currentApp.charAt(0).toUpperCase() + currentApp.slice(1)}</h3>
            </div>
          )}

          {renderApp()}
        </div>

        {/* Phone home button */}
        <div className="p-2 flex justify-center">
          <button
            onClick={() => setCurrentApp("home")}
            className="w-12 h-12 rounded-full border-2 border-gray-700 flex items-center justify-center"
          >
            <div className="w-8 h-1 bg-gray-700 rounded-full"></div>
          </button>
        </div>
      </div>
    </div>
  )
}
