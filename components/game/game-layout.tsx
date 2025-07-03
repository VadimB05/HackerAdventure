"use client"

import { useGame } from '@/lib/contexts/game-context'
import { useGameState } from '@/lib/contexts/game-context'
import GameState from "./game-state"
import Basement from "./basement"
import StoryPopup from "./story-popup"
import MoneyPopup from "./money-popup"
import RoomView from "./room-view"
import GameOverScreen from "./game-over-screen"
import IntroModal from "./intro-modal"
import { Button } from "@/components/ui/button"
import { Monitor, SmartphoneIcon, MessageSquare, Home, Server, MapPin } from "lucide-react"
import { useState, useEffect } from "react"
import { getInventory, type InventoryItem } from "@/lib/services/inventory-service"
import PuzzleSystem from "./puzzle-system"

interface GameLayoutProps {
  onIntroModalComplete?: () => void;
}

export default function GameLayout({ onIntroModalComplete }: GameLayoutProps) {
  const { currentView, setCurrentView, bitcoinBalance } = useGame()
  
  // Inventar-State
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoadingInventory, setIsLoadingInventory] = useState(true);
  
  // Aktueller Raum State
  const [currentRoomId, setCurrentRoomId] = useState<string>("intro");
  
  // Intro Modal State
  const [showIntroModal, setShowIntroModal] = useState(false);
  const [introModalChecked, setIntroModalChecked] = useState(false);

  // Puzzle State
  const [currentPuzzleId, setCurrentPuzzleId] = useState<string | null>(null);
  const [showPuzzle, setShowPuzzle] = useState(false);

  // Prüfe IntroModal-Status beim Laden
  useEffect(() => {
    console.log('[DEBUG] useEffect: checkIntroModal (GameLayout) MOUNTED');
    
    // Session-basierter Schutz: Prüfe ob der Check bereits in dieser Session durchgeführt wurde
    const sessionKey = 'introModalChecked';
    const hasCheckedThisSession = sessionStorage.getItem(sessionKey);
    
    if (hasCheckedThisSession) {
      console.log('[DEBUG] IntroModal-Check bereits in dieser Session durchgeführt, überspringe');
      setIntroModalChecked(true);
      return;
    }
    
    const checkIntroModal = async () => {
      try {
        console.log('[DEBUG] Führe IntroModal-Check durch...');
        const authResponse = await fetch('/api/auth/verify', {
          method: 'GET',
          credentials: 'include'
        });
        if (!authResponse.ok) {
          setShowIntroModal(true);
          setIntroModalChecked(true);
          sessionStorage.setItem(sessionKey, 'true');
          return;
        }
        const authData = await authResponse.json();
        if (!authData.user || !authData.user.id) {
          setShowIntroModal(true);
          setIntroModalChecked(true);
          sessionStorage.setItem(sessionKey, 'true');
          return;
        }
        const saveRes = await fetch(`/api/game/save?userId=${authData.user.id}`, {
          method: 'GET',
          credentials: 'include'
        });
        if (!saveRes.ok) {
          setShowIntroModal(true);
          setIntroModalChecked(true);
          sessionStorage.setItem(sessionKey, 'true');
          return;
        }
        const saveData = await saveRes.json();
        console.log('Save data for intro modal check:', saveData);
        const found = saveData.savePoints && saveData.savePoints.some((sp: any) => sp.eventType === 'intro_modal_completed');
        console.log('Found intro_modal_completed savepoint:', found);
        setShowIntroModal(!found);
        setIntroModalChecked(true);
        sessionStorage.setItem(sessionKey, 'true');
      } catch (e) {
        console.error('[DEBUG] Fehler beim IntroModal-Check:', e);
        setShowIntroModal(true);
        setIntroModalChecked(true);
        sessionStorage.setItem(sessionKey, 'true');
      }
    }
    checkIntroModal();
  }, []);

  // Inventar beim Laden abrufen
  useEffect(() => {
    console.log('[DEBUG] useEffect: loadInventory (GameLayout) MOUNTED');
    loadInventory();
  }, []);

  // Setze die richtige View basierend auf dem initialen Raum
  useEffect(() => {
    console.log('[DEBUG] useEffect: setCurrentView (GameLayout) MOUNTED');
    // Prüfe URL-Parameter für den initialen Raum
    const urlParams = new URLSearchParams(window.location.search);
    const initialRoom = urlParams.get('room');
    
    if (initialRoom) {
      setCurrentRoomId(initialRoom);
      switch (initialRoom) {
        case "basement":
          setCurrentView("basement");
          break;
        case "intro":
        default:
          setCurrentView("apartment");
          break;
      }
    }
  }, [setCurrentView]);

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

  // Objekt-Klick-Handler für Puzzle-Objekte
  const handleObjectClick = (object: any) => {
    console.log('Object clicked in GameLayout:', object.id, object.type, object.puzzleId);
    
    if (object.type === 'puzzle' && object.puzzleId) {
      console.log('Opening puzzle:', object.puzzleId);
      setCurrentPuzzleId(object.puzzleId);
      setShowPuzzle(true);
    }
  };

  // Puzzle-Lösungs-Handler
  const handlePuzzleSolve = (puzzleId: string, isCorrect: boolean) => {
    console.log('Puzzle solved:', puzzleId, 'Correct:', isCorrect);
    setShowPuzzle(false);
    setCurrentPuzzleId(null);
    
    if (isCorrect) {
      // Hier könnte man Belohnungen geben oder andere Aktionen ausführen
      console.log('Puzzle erfolgreich gelöst!');
    }
  };

  // Puzzle schließen
  const handlePuzzleClose = () => {
    setShowPuzzle(false);
    setCurrentPuzzleId(null);
  };

  // Bestimme den aktuellen Raum basierend auf der View
  const getCurrentRoomId = () => {
    switch (currentView) {
      case "apartment":
        return "intro"; // Das Apartment ist immer der intro-Raum
      case "basement":
        return "basement";
      case "city":
        // Verwende den aktuellen Raum State für die City-View
        return currentRoomId;
      default:
        return "intro";
    }
  };

  // Raumwechsel-Handler
  const handleRoomChange = (newRoomId: string) => {
    console.log('Room change requested to:', newRoomId);
    
    // Aktualisiere den aktuellen Raum State
    setCurrentRoomId(newRoomId);
    
    // Bestimme die entsprechende View basierend auf dem neuen Raum
    switch (newRoomId) {
      case "intro":
        setCurrentView("apartment");
        break;
      case "basement":
        setCurrentView("basement");
        break;
      case "city1":
      case "city2":
        setCurrentView("city");
        break;
      case "building1_server_farm":
      case "building2_office":
      case "building3_lab":
      case "building4_warehouse":
      case "building5_penthouse":
        // Gebäude-Räume zeigen auch die City-View (da sie zu city1 gehören)
        setCurrentView("city");
        break;
      default:
        // Für unbekannte Räume zur Apartment-View wechseln
        setCurrentView("apartment");
        break;
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
        {currentView === "city" && (
          <div className="bg-black/70 backdrop-blur-sm border border-green-500 rounded-lg px-3 py-2">
            <div className="text-center">
              <h3 className="text-green-400 font-bold text-sm">City District</h3>
              <p className="text-green-300 text-xs">Ein Stadtteil mit verschiedenen Gebäuden und Missionen.</p>
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
            roomId={getCurrentRoomId()} 
            inventory={inventory}
            onItemUse={handleItemUse}
            onInventoryUpdate={handleInventoryUpdate}
            onRoomChange={handleRoomChange}
            onObjectClick={handleObjectClick}
          />
        )}
        {currentView === "basement" && <Basement />}
        {currentView === "city" && (
          <RoomView 
            roomId={getCurrentRoomId()} 
            inventory={inventory}
            onItemUse={handleItemUse}
            onInventoryUpdate={handleInventoryUpdate}
            onRoomChange={handleRoomChange}
            onObjectClick={handleObjectClick}
          />
        )}
      </main>

      {/* Modals und Popups */}
      <IntroModal 
        isOpen={showIntroModal} 
        onClose={() => {
          setShowIntroModal(false);
          onIntroModalComplete?.();
        }} 
      />
      <StoryPopup />
      <MoneyPopup />
      <GameOverScreen />
      
      {/* Puzzle System */}
      {showPuzzle && currentPuzzleId && (
        <PuzzleSystem
          puzzleId={currentPuzzleId}
          onSolve={handlePuzzleSolve}
          onClose={handlePuzzleClose}
          useDebugApi={false}
        />
      )}
    </div>
  )
}
