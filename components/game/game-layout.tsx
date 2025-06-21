"use client"

import { useGameState } from "./game-context"
import Terminal from "./terminal"
import Smartphone from "./smartphone"
import PointAndClick from "./point-and-click"
import DarknetChat from "./darknet-chat"
import GameState from "./game-state"
import Basement from "./basement"
import DecisionModal from "./decision-modal"
import StoryPopup from "./story-popup"
import HackingMission from "./hacking-mission"
import TerminalMission from "./terminal-mission"
import MoneyPopup from "./money-popup"
import CityView from "./city-view" // Neue Komponente für die Stadt
import RoomView from "./room-view"
import { Button } from "@/components/ui/button"
import { Monitor, SmartphoneIcon, MessageSquare, Home, Server, MapPin } from "lucide-react"
import { useState, useEffect } from "react"
import { getInventory, type InventoryItem } from "@/lib/services/inventory-service"

export default function GameLayout() {
  const { currentView, setCurrentView } = useGameState()
  
  // Inventar-State
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoadingInventory, setIsLoadingInventory] = useState(true);

  // Inventar beim Laden abrufen
  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      setIsLoadingInventory(true);
      const result = await getInventory();
      if (result.success && result.inventory) {
        setInventory(result.inventory);
      }
    } catch (error) {
      console.error('Fehler beim Laden des Inventars:', error);
      // Fallback zu Mock-Daten bei Fehler
      setInventory([
        {
          id: 'laptop',
          name: 'Laptop',
          type: 'tool',
          quantity: 1,
          description: 'Ein alter aber funktionsfähiger Laptop',
          rarity: 'common',
          icon: 'Laptop'
        },
        {
          id: 'usb_stick',
          name: 'USB-Stick',
          type: 'tool',
          quantity: 2,
          description: 'Ein USB-Stick mit unbekanntem Inhalt',
          rarity: 'uncommon',
          icon: 'Usb'
        },
        {
          id: 'keycard',
          name: 'Zugangskarte',
          type: 'key',
          quantity: 1,
          description: 'Eine magnetische Zugangskarte',
          rarity: 'rare',
          icon: 'Key'
        },
        {
          id: 'hacking_manual',
          name: 'Hacking-Handbuch',
          type: 'document',
          quantity: 1,
          description: 'Ein detailliertes Handbuch für ethisches Hacking',
          rarity: 'uncommon',
          icon: 'BookOpen'
        },
        {
          id: 'energy_drink',
          name: 'Energy Drink',
          type: 'consumable',
          quantity: 3,
          description: 'Gibt dir Energie für längere Hacking-Sessions',
          rarity: 'common',
          icon: 'Battery'
        }
      ]);
    } finally {
      setIsLoadingInventory(false);
    }
  };

  // Inventar-Update-Handler
  const handleInventoryUpdate = (newInventory: InventoryItem[]) => {
    setInventory(newInventory);
  };

  const handleItemUse = (item: InventoryItem, target: any) => {
    console.log(`Item ${item.name} wird auf ${target.name} verwendet`);
    
    // Hier könnte die Logik für das Verwenden von Items implementiert werden
    // Zum Beispiel: Item aus Inventar entfernen, neue Funktionen freischalten, etc.
    
    // Beispiel: Energy Drink wird konsumiert
    if (item.id === 'energy_drink') {
      setInventory(prev => prev.map(invItem => 
        invItem.id === item.id 
          ? { ...invItem, quantity: Math.max(0, invItem.quantity - 1) }
          : invItem
      ).filter(invItem => invItem.quantity > 0));
    }
  };

  return (
    <div className="flex flex-col h-screen bg-black text-green-500 font-mono">
      {/* Game header with navigation */}
      <header className="border-b border-green-900 p-4 flex justify-between items-center">
        <div className="flex space-x-4">
          {/* Orte */}
          <div className="flex space-x-2 mr-4">
            <Button
              variant={currentView === "apartment" ? "default" : "outline"}
              onClick={() => setCurrentView("apartment")}
              className="bg-black border-green-500 text-green-500 hover:bg-green-900"
            >
              <Home className="mr-2 h-4 w-4" />
              Apartment
            </Button>
            <Button
              variant={currentView === "basement" ? "default" : "outline"}
              onClick={() => setCurrentView("basement")}
              className="bg-black border-green-500 text-green-500 hover:bg-green-900"
            >
              <Server className="mr-2 h-4 w-4" />
              Basement
            </Button>
            <Button
              variant={currentView === "city" ? "default" : "outline"}
              onClick={() => setCurrentView("city")}
              className="bg-black border-green-500 text-green-500 hover:bg-green-900"
            >
              <MapPin className="mr-2 h-4 w-4" />
              City
            </Button>
          </div>

          {/* Digitale Tools */}
          <div className="flex space-x-2">
            <Button
              variant={currentView === "terminal" ? "default" : "outline"}
              onClick={() => setCurrentView("terminal")}
              className="bg-black border-green-500 text-green-500 hover:bg-green-900"
            >
              <Monitor className="mr-2 h-4 w-4" />
              Terminal
            </Button>
            <Button
              variant={currentView === "smartphone" ? "default" : "outline"}
              onClick={() => setCurrentView("smartphone")}
              className="bg-black border-green-500 text-green-500 hover:bg-green-900"
            >
              <SmartphoneIcon className="mr-2 h-4 w-4" />
              Phone
            </Button>
            <Button
              variant={currentView === "darkroom" ? "default" : "outline"}
              onClick={() => setCurrentView("darkroom")}
              className="bg-black border-green-500 text-green-500 hover:bg-green-900"
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Darknet
            </Button>
          </div>
        </div>

        {/* Raum-Informationen */}
        {currentView === "apartment" && (
          <div className="bg-black/70 backdrop-blur-sm border border-green-500 rounded-lg px-3 py-2">
            <div className="text-center">
              <h3 className="text-green-400 font-bold text-sm">Mein Zimmer</h3>
              <p className="text-green-300 text-xs">Ein abgedunkeltes Zimmer mit Computer, Fenster und Smartphone.</p>
            </div>
          </div>
        )}
      </header>

      {/* Game state display (day counter, bitcoin, etc.) */}
      <GameState />

      {/* Main game content area */}
      <main className="flex-1 overflow-hidden">
        {currentView === "apartment" && (
          <RoomView 
            roomId="intro" 
            inventory={inventory}
            onItemUse={handleItemUse}
            onInventoryUpdate={handleInventoryUpdate}
          />
        )}
        {currentView === "terminal" && <Terminal />}
        {currentView === "smartphone" && <Smartphone />}
        {currentView === "darkroom" && <DarknetChat />}
        {currentView === "basement" && <Basement />}
        {currentView === "city" && <CityView />}
      </main>

      {/* Modals und Popups */}
      <DecisionModal />
      <StoryPopup />
      <HackingMission />
      <TerminalMission />
      <MoneyPopup />
    </div>
  )
}
