"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useGameState } from "./game-context"
import { Button } from "@/components/ui/button"
import { Send } from "lucide-react"

export default function DarkroomChat() {
  const { messages, addMessage } = useGameState()
  const [input, setInput] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    // Add user message
    addMessage("n0seC", input)

    // Simulate response based on user input
    setTimeout(() => {
      let response = "I don't understand. Please be more specific."

      const lowerInput = input.toLowerCase()

      if (lowerInput.includes("mission") || lowerInput.includes("task")) {
        response =
          "Your current mission is to extract customer records for Alexander Volkov from the local ISP database. Use your terminal to scan the network and find a way in."
      } else if (lowerInput.includes("payment") || lowerInput.includes("bitcoin") || lowerInput.includes("money")) {
        response = "Payment of 0.15 BTC will be transferred upon successful completion of the mission. No advances."
      } else if (lowerInput.includes("help") || lowerInput.includes("stuck")) {
        response =
          "Try using nmap to scan the target IP. Look for open ports, especially SSH or database ports. Check your terminal for more information."
      } else if (lowerInput.includes("who") || lowerInput.includes("identity")) {
        response = "Who I am is not important. Focus on the mission, n0seC. Your skills are what matter here."
      }

      addMessage("DARKROOM", response)
    }, 1000)

    setInput("")
  }

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  return (
    <div className="h-full flex flex-col bg-black text-green-500 p-4">
      <div className="mb-4">
        <h2 className="text-xl font-bold">DARKROOM CHAT</h2>
        <p className="text-xs opacity-70">Encrypted Connection • Last Activity: 2 hours ago</p>
      </div>

      <div className="flex-1 overflow-y-auto mb-4 bg-gray-950 p-4 rounded">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`mb-4 max-w-[80%] ${msg.sender === "n0seC" ? "ml-auto bg-green-900" : "bg-gray-900"} p-3 rounded`}
          >
            <div className="font-bold mb-1">{msg.sender}</div>
            <p>{msg.content}</p>
            <div className="text-right text-xs opacity-70 mt-1">{new Date(msg.timestamp).toLocaleTimeString()}</div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="flex">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 bg-gray-900 text-green-500 p-2 rounded-l outline-none"
        />
        <Button type="submit" className="bg-green-900 hover:bg-green-800 rounded-l-none">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  )
}
