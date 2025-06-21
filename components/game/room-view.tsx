'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap, Eye, Puzzle, Lock, Trophy, Package, MapPin, Coins, DoorOpen, Monitor, MessageSquare, MapPin as MapPinIcon, Server } from 'lucide-react';
import { useGameState } from './game-context';
import SmartphoneOverlay from './smartphone-overlay';
import ChoicePopup from './choice-popup';
import MessagePopup from './message-popup';
import InventoryBar from './inventory-bar';
import DragDropFeedback from './drag-drop-feedback';
import { pickItem, getRoomItems, useItem, type InventoryItem } from '@/lib/services/inventory-service';

interface InteractiveObject {
  id: string;
  type: 'puzzle' | 'item' | 'exit' | 'npc';
  name: string;
  description: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isVisible: boolean;
  isInteractable: boolean;
  icon?: string;
  status?: 'completed' | 'locked' | 'available' | 'hidden';
  quantity?: number;
  // Drag-and-Drop Kompatibilität
  compatibleItems?: string[]; // Array von Item-IDs die kompatibel sind
  requiredItems?: string[]; // Array von Item-IDs die benötigt werden
}

interface RoomViewProps {
  roomId: string;
  onObjectClick?: (object: InteractiveObject) => void;
  onExitClick?: (exitId: string) => void;
  inventory?: InventoryItem[];
  onItemUse?: (item: InventoryItem, target: InteractiveObject) => void;
  onInventoryUpdate?: (inventory: InventoryItem[]) => void;
}

export default function RoomView({ 
  roomId, 
  onObjectClick, 
  onExitClick, 
  inventory = [],
  onItemUse,
  onInventoryUpdate
}: RoomViewProps) {
  const { setCurrentView } = useGameState();
  const [hoveredObject, setHoveredObject] = useState<string | null>(null);
  const [tooltipData, setTooltipData] = useState<InteractiveObject | null>(null);
  const [isSmartphoneOpen, setIsSmartphoneOpen] = useState(false);
  
  // Popup States
  const [isComputerPopupOpen, setIsComputerPopupOpen] = useState(false);
  const [isDoorPopupOpen, setIsDoorPopupOpen] = useState(false);
  const [isWindowPopupOpen, setIsWindowPopupOpen] = useState(false);

  // Drag-and-Drop States
  const [draggedItem, setDraggedItem] = useState<InventoryItem | null>(null);
  const [dragOverObject, setDragOverObject] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackData, setFeedbackData] = useState<{
    isValid: boolean;
    message: string;
    position: { x: number; y: number };
  } | null>(null);

  // Room Items State
  const [roomItems, setRoomItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUsingItem, setIsUsingItem] = useState(false);

  // Feedback Timer Ref
  const feedbackTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  // Cleanup Timer beim Unmount
  React.useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current);
      }
    };
  }, []);

  // Raum-Items beim Laden abrufen
  useEffect(() => {
    loadRoomItems();
  }, [roomId]);

  const loadRoomItems = async () => {
    try {
      const result = await getRoomItems(roomId);
      if (result.success && result.items) {
        setRoomItems(result.items);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Raum-Items:', error);
    }
  };

  const clearFeedback = () => {
    setShowFeedback(false);
    setFeedbackData(null);
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
      feedbackTimerRef.current = null;
    }
  };

  const showFeedbackWithTimer = (data: {
    isValid: boolean;
    message: string;
    position: { x: number; y: number };
  }) => {
    // Vorheriges Feedback löschen
    clearFeedback();
    
    // Neues Feedback setzen
    setFeedbackData(data);
    setShowFeedback(true);
    
    // Timer für automatisches Ausblenden
    feedbackTimerRef.current = setTimeout(() => {
      clearFeedback();
    }, 2000);
  };

  // Item aufheben Funktion
  const handlePickItem = async (item: InventoryItem, position: { x: number; y: number }) => {
    if (isLoading) return;
    
    setIsLoading(true);
    
    try {
      const result = await pickItem({
        itemId: item.id,
        roomId: roomId
      });

      if (result.success) {
        // Erfolgreich aufgesammelt
        showFeedbackWithTimer({
          isValid: true,
          message: result.message || `${item.name} aufgesammelt!`,
          position
        });

        // Inventar aktualisieren
        if (result.inventory && onInventoryUpdate) {
          onInventoryUpdate(result.inventory);
        }

        // Item aus Raum-Items entfernen
        setRoomItems(prev => prev.filter(roomItem => roomItem.id !== item.id));

        // Eventuell Raum-Objekte aktualisieren (falls Item Teil eines Rätsels war)
        // Hier könnte Logik für Rätsel-Entwicklung implementiert werden

      } else {
        // Fehler beim Aufsammeln
        showFeedbackWithTimer({
          isValid: false,
          message: result.error || 'Fehler beim Aufsammeln',
          position
        });
      }
    } catch (error) {
      console.error('Fehler beim Aufsammeln des Items:', error);
      showFeedbackWithTimer({
        isValid: false,
        message: 'Netzwerkfehler beim Aufsammeln',
        position
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Mock-Raumdaten für das eigene Zimmer
  const roomData = {
    id: roomId,
    name: 'Mein Zimmer',
    description: 'Ein abgedunkeltes Zimmer mit Computer, Fenster und Smartphone.',
    background: '/room-bedroom.png',
    objects: [
      {
        id: 'computer',
        name: 'Computer',
        description: 'Mein Desktop-Computer. Hier kann ich hacken, Programme schreiben und Missionen starten.',
        type: 'puzzle' as const,
        x: 12,
        y: 35,
        width: 20,
        height: 15,
        status: 'available',
        icon: 'Zap',
        compatibleItems: ['laptop', 'usb_stick', 'hacking_manual'],
        requiredItems: []
      },
      {
        id: 'window',
        name: 'Fenster',
        description: 'Ein abgedunkeltes Fenster. Hier kann ich die Außenwelt beobachten und Informationen sammeln.',
        type: 'puzzle' as const,
        x: 47.5,
        y: 10,
        width: 25,
        height: 20,
        status: 'available',
        icon: 'Eye',
        compatibleItems: ['keycard', 'hacking_manual'],
        requiredItems: []
      },
      {
        id: 'smartphone',
        name: 'Smartphone',
        description: 'Mein Smartphone. Hier kann ich Nachrichten empfangen, Apps nutzen und Kontakte verwalten.',
        type: 'puzzle' as const,
        x: 30,
        y: 60,
        width: 12,
        height: 8,
        status: 'available',
        icon: 'Package',
        compatibleItems: ['usb_stick', 'energy_drink'],
        requiredItems: []
      },
      {
        id: 'door',
        name: 'Tür',
        description: 'Die Zimmertür. Hier kann ich das Zimmer verlassen und auf Missionen gehen.',
        type: 'exit' as const,
        x: 80,
        y: 20,
        width: 12,
        height: 18,
        icon: 'DoorOpen',
        compatibleItems: ['keycard'],
        requiredItems: ['keycard']
      }
    ]
  };

  const interactiveObjects = roomData.objects.map((obj: any) => ({
    ...obj,
    isVisible: true,
    isInteractable: true
  }));

  // Drag-and-Drop Handler
  const handleDragStart = (item: InventoryItem, event: React.DragEvent) => {
    setDraggedItem(item);
    event.dataTransfer.setData('application/json', JSON.stringify(item));
    event.dataTransfer.effectAllowed = 'copy';
    
    // Visuelles Feedback für das gezogene Item
    if (event.dataTransfer.setDragImage) {
      const dragImage = document.createElement('div');
      dragImage.className = 'bg-black/80 border border-green-500 rounded-lg p-2 text-green-400 text-sm';
      dragImage.textContent = item.name;
      dragImage.style.position = 'absolute';
      dragImage.style.top = '-1000px';
      document.body.appendChild(dragImage);
      event.dataTransfer.setDragImage(dragImage, 0, 0);
      setTimeout(() => document.body.removeChild(dragImage), 0);
    }
  };

  const handleDragEnd = (event: React.DragEvent) => {
    setDraggedItem(null);
    setDragOverObject(null);
  };

  const handleDragOver = (event: React.DragEvent, object: InteractiveObject) => {
    event.preventDefault();
    
    // Prüfen ob das gezogene Item mit diesem Objekt kompatibel ist
    const draggedItemData = event.dataTransfer.getData('application/json');
    if (draggedItemData) {
      try {
        const draggedItem: InventoryItem = JSON.parse(draggedItemData);
        const isCompatible = object.compatibleItems?.includes(draggedItem.id) || false;
        const isRequired = object.requiredItems?.includes(draggedItem.id) || false;
        
        if (isCompatible || isRequired) {
          event.dataTransfer.dropEffect = 'copy';
          setDragOverObject(object.id);
        } else {
          event.dataTransfer.dropEffect = 'none';
          setDragOverObject(null);
        }
      } catch (error) {
        event.dataTransfer.dropEffect = 'none';
        setDragOverObject(null);
      }
    }
  };

  const handleDragLeave = (event: React.DragEvent) => {
    setDragOverObject(null);
  };

  const handleDrop = async (event: React.DragEvent, object: InteractiveObject) => {
    event.preventDefault();
    
    if (isUsingItem) return;
    
    try {
      const itemData = event.dataTransfer.getData('application/json');
      const droppedItem: InventoryItem = JSON.parse(itemData);
      
      // Prüfen ob Item kompatibel ist
      const isCompatible = object.compatibleItems?.includes(droppedItem.id) || false;
      const isRequired = object.requiredItems?.includes(droppedItem.id) || false;
      
      // Position für Feedback berechnen
      const rect = event.currentTarget.getBoundingClientRect();
      const position = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      };
      
      if (isCompatible || isRequired) {
        setIsUsingItem(true);
        
        // API-Aufruf für Item-Verwendung
        const result = await useItem({
          itemId: droppedItem.id,
          targetObjectId: object.id,
          roomId: roomId
        });

        if (result.success) {
          // Erfolgreiche Interaktion
          showFeedbackWithTimer({
            isValid: true,
            message: result.message || 'Item erfolgreich verwendet!',
            position
          });
          
          // Inventar aktualisieren (falls Item verbraucht wurde)
          if (result.inventory && onInventoryUpdate) {
            onInventoryUpdate(result.inventory);
          }
          
          // Eventuelle Raum-Änderungen verarbeiten
          if (result.roomChanges) {
            console.log('Raum-Änderungen:', result.roomChanges);
            // Hier könnte die Raum-Ansicht aktualisiert werden
          }
          
          // Eventuelle neue Features freischalten
          if (result.unlockedFeatures) {
            console.log('Neue Features freigeschaltet:', result.unlockedFeatures);
            // Hier könnte das UI neue Funktionen anzeigen
          }
          
          // Eventuelle neue Rätsel anzeigen
          if (result.newPuzzles) {
            console.log('Neue Rätsel verfügbar:', result.newPuzzles);
            // Hier könnten neue Rätsel angezeigt werden
          }
          
          // Item verwenden (Callback)
          onItemUse?.(droppedItem, object);
          
        } else {
          // Fehler bei der Interaktion
          showFeedbackWithTimer({
            isValid: false,
            message: result.error || 'Fehler beim Verwenden des Items',
            position
          });
        }
      } else {
        // Nicht kompatible Interaktion
        showFeedbackWithTimer({
          isValid: false,
          message: 'Item nicht kompatibel',
          position
        });
      }
      
    } catch (error) {
      console.error('Fehler beim Verarbeiten des gedropten Items:', error);
      showFeedbackWithTimer({
        isValid: false,
        message: 'Netzwerkfehler beim Verwenden des Items',
        position: { x: 50, y: 50 }
      });
    } finally {
      setIsUsingItem(false);
      setDraggedItem(null);
      setDragOverObject(null);
    }
  };

  const handleItemUse = (item: InventoryItem, object: InteractiveObject) => {
    // Spezifische Logik für verschiedene Item-Objekt-Kombinationen
    console.log(`Item ${item.name} wird auf ${object.name} verwendet`);
    
    // Beispiel-Logik für verschiedene Kombinationen
    if (object.id === 'computer' && item.id === 'usb_stick') {
      console.log('USB-Stick wird in Computer eingesteckt');
      // Hier könnte ein neues Rätsel oder eine neue Funktion freigeschaltet werden
    } else if (object.id === 'door' && item.id === 'keycard') {
      console.log('Tür wird mit Zugangskarte geöffnet');
      // Tür könnte geöffnet werden
    } else if (object.id === 'smartphone' && item.id === 'energy_drink') {
      console.log('Energy Drink wird konsumiert');
      // Spieler könnte Energie bekommen
    }
  };

  // Objekt-Klick-Handler
  const handleObjectClick = (object: InteractiveObject) => {
    console.log('Object clicked:', object.id, object.type);
    if (!object.isInteractable) return;
    
    // Prüfen ob es ein aufhebbares Item ist
    const roomItem = roomItems.find(item => item.id === object.id);
    if (roomItem) {
      // Item aufheben
      const rect = document.querySelector(`[data-object-id="${object.id}"]`)?.getBoundingClientRect();
      const position = rect ? {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      } : { x: 50, y: 50 };
      
      handlePickItem(roomItem, position);
      return;
    }
    
    // Verbinde mit den vorhandenen Komponenten
    switch (object.id) {
      case 'computer':
        console.log('Opening computer popup');
        setIsComputerPopupOpen(true);
        break;
      case 'smartphone':
        console.log('Opening smartphone overlay');
        setIsSmartphoneOpen(true);
        break;
      case 'window':
        console.log('Opening window popup');
        setIsWindowPopupOpen(true);
        break;
      case 'door':
        console.log('Opening door popup');
        setIsDoorPopupOpen(true);
        break;
      default:
        if (object.type === 'exit') {
          onExitClick?.(object.id);
        } else {
          onObjectClick?.(object);
        }
    }
  };

  const handleObjectHover = (object: InteractiveObject, event: React.MouseEvent) => {
    setHoveredObject(object.id);
    setTooltipData(object);
  };

  const handleObjectLeave = () => {
    setHoveredObject(null);
    setTooltipData(null);
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-gray-900">
      {/* Hintergrundbild */}
      <AnimatePresence mode="wait">
        <motion.div
          key={roomId}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          {roomData.background ? (
            <img
              src={roomData.background}
              alt={roomData.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <MapPin className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h2 className="text-xl font-bold">{roomData.name}</h2>
                <p className="mt-2">{roomData.description}</p>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Interaktive Objekte */}
      <div className="absolute inset-0">
        {interactiveObjects.map((object) => (
          <motion.div
            key={object.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: object.isVisible ? 1 : 0, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.3 }}
            className={`absolute cursor-pointer transition-all duration-200 ${
              object.isInteractable 
                ? 'hover:scale-110 hover:brightness-125' 
                : 'opacity-50 cursor-not-allowed'
            } ${
              dragOverObject === object.id ? 'ring-2 ring-cyan-400 ring-opacity-75' : ''
            }`}
            style={{
              left: `${object.x}%`,
              top: `${object.y}%`,
              width: `${object.width}%`,
              height: `${object.height}%`,
            }}
            data-object-id={object.id}
            onClick={() => handleObjectClick(object)}
            onMouseEnter={(e) => handleObjectHover(object, e)}
            onMouseLeave={handleObjectLeave}
            onDragOver={(e) => handleDragOver(e, object)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, object)}
          >
            {/* Objekt-Icon */}
            <div className={`relative w-full h-full flex items-center justify-center ${
              object.status === 'completed' ? 'text-green-400' :
              object.status === 'locked' ? 'text-red-400' :
              'text-cyan-400'
            }`}>
              <div className={`bg-black/50 backdrop-blur-sm rounded-lg p-2 border border-current/30 hover:bg-black/70 transition-colors ${
                dragOverObject === object.id ? 'bg-cyan-500/20 border-cyan-400 scale-110' : ''
              }`}>
                {object.icon === 'Zap' && <Zap className="h-6 w-6" />}
                {object.icon === 'Eye' && <Eye className="h-6 w-6" />}
                {object.icon === 'Puzzle' && <Puzzle className="h-6 w-6" />}
                {object.icon === 'Lock' && <Lock className="h-6 w-6" />}
                {object.icon === 'Trophy' && <Trophy className="h-6 w-6" />}
                {object.icon === 'Package' && <Package className="h-6 w-6" />}
                {object.icon === 'MapPin' && <MapPin className="h-6 w-6" />}
                {object.icon === 'Coins' && <Coins className="h-6 w-6" />}
                {object.icon === 'DoorOpen' && <DoorOpen className="h-6 w-6" />}
              </div>
              
              {/* Status-Badge */}
              {object.status === 'completed' && (
                <Badge className="absolute -top-2 -right-2 bg-green-600 text-white text-xs">
                  ✓
                </Badge>
              )}
              
              {/* Drag-Over Indicator */}
              {dragOverObject === object.id && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="absolute inset-0 bg-cyan-400/20 rounded-lg border-2 border-cyan-400"
                />
              )}
              
              {/* Drop-Zone Indicator */}
              {draggedItem && (object.compatibleItems?.includes(draggedItem.id) || object.requiredItems?.includes(draggedItem.id)) && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="absolute inset-0 bg-green-400/10 rounded-lg border border-green-400/50"
                />
              )}
            </div>
          </motion.div>
        ))}

        {/* Aufhebbare Items im Raum */}
        <AnimatePresence>
          {roomItems.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3 }}
              className="absolute cursor-pointer transition-all duration-200 hover:scale-110 hover:brightness-125"
              style={{
                left: `${Math.random() * 60 + 20}%`, // Zufällige Position
                top: `${Math.random() * 60 + 20}%`,
                width: '8%',
                height: '8%',
              }}
              data-object-id={item.id}
              onClick={() => {
                const rect = document.querySelector(`[data-object-id="${item.id}"]`)?.getBoundingClientRect();
                const position = rect ? {
                  x: rect.left + rect.width / 2,
                  y: rect.top + rect.height / 2
                } : { x: 50, y: 50 };
                handlePickItem(item, position);
              }}
              onMouseEnter={(e) => {
                setHoveredObject(item.id);
                setTooltipData({
                  id: item.id,
                  type: 'item',
                  name: item.name,
                  description: `Klicken um ${item.name} aufzuheben`,
                  x: 0,
                  y: 0,
                  width: 0,
                  height: 0,
                  isVisible: true,
                  isInteractable: true,
                  quantity: item.quantity
                });
              }}
              onMouseLeave={handleObjectLeave}
            >
              <div className="relative w-full h-full flex items-center justify-center">
                <div className="bg-black/50 backdrop-blur-sm rounded-lg p-2 border-2 border-green-500 text-green-400 hover:bg-black/70 transition-colors animate-pulse">
                  <Package className="h-6 w-6" />
                </div>
                
                {/* Quantity Badge */}
                {item.quantity > 1 && (
                  <Badge className="absolute -top-1 -right-1 bg-green-600 text-white text-xs min-w-0 px-1 h-4 leading-none">
                    {item.quantity}
                  </Badge>
                )}
                
                {/* Rarity Indicator */}
                {item.rarity && item.rarity !== 'common' && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-green-400 opacity-80" />
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Inventar-Leiste */}
      <InventoryBar 
        items={inventory}
        onItemDragStart={handleDragStart}
        onItemDragEnd={handleDragEnd}
      />

      {/* Drag-and-Drop Feedback */}
      <DragDropFeedback
        isVisible={showFeedback}
        isValid={feedbackData?.isValid || false}
        message={feedbackData?.message}
        position={feedbackData?.position}
      />

      {/* Loading Overlay */}
      {(isLoading || isUsingItem) && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-black/80 border border-green-500 rounded-lg p-4">
            <div className="text-green-400 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-2"></div>
              <p className="text-sm">
                {isLoading ? 'Item wird aufgesammelt...' : 'Item wird verwendet...'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Notify-Fenster rechts mittig */}
      <AnimatePresence>
        {hoveredObject && tooltipData && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed right-4 bottom-4 z-50 pointer-events-none"
            style={{ maxWidth: '300px' }}
          >
            <Card className="bg-gray-800/95 backdrop-blur-sm border-gray-600 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className={`p-2 rounded-lg ${
                    tooltipData.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                    tooltipData.status === 'locked' ? 'bg-red-500/20 text-red-400' :
                    tooltipData.type === 'item' ? 'bg-green-500/20 text-green-400' :
                    'bg-cyan-500/20 text-cyan-400'
                  }`}>
                    {tooltipData.icon === 'Zap' && <Zap className="h-5 w-5" />}
                    {tooltipData.icon === 'Eye' && <Eye className="h-5 w-5" />}
                    {tooltipData.icon === 'Puzzle' && <Puzzle className="h-5 w-5" />}
                    {tooltipData.icon === 'Lock' && <Lock className="h-5 w-5" />}
                    {tooltipData.icon === 'Trophy' && <Trophy className="h-5 w-5" />}
                    {tooltipData.icon === 'Package' && <Package className="h-5 w-5" />}
                    {tooltipData.icon === 'MapPin' && <MapPin className="h-5 w-5" />}
                    {tooltipData.icon === 'Coins' && <Coins className="h-5 w-5" />}
                    {tooltipData.icon === 'DoorOpen' && <DoorOpen className="h-5 w-5" />}
                    {tooltipData.type === 'item' && <Package className="h-5 w-5" />}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white mb-2 truncate">{tooltipData.name}</h3>
                    <p className="text-sm text-gray-300 leading-relaxed mb-3">{tooltipData.description}</p>
                    
                    {/* Status-Badges */}
                    <div className="flex flex-wrap gap-2">
                      {tooltipData.type === 'puzzle' && (
                        <Badge variant="outline" className="text-xs">
                          {tooltipData.status === 'completed' ? 'Gelöst' : 'Verfügbar'}
                        </Badge>
                      )}
                      {tooltipData.type === 'item' && (
                        <Badge variant="outline" className="text-xs text-green-400 border-green-400">
                          Aufhebbar
                        </Badge>
                      )}
                      {tooltipData.type === 'exit' && (
                        <Badge variant="outline" className="text-xs text-blue-400 border-blue-400">
                          Ausgang
                        </Badge>
                      )}
                      {tooltipData.quantity && tooltipData.quantity > 1 && (
                        <Badge variant="outline" className="text-xs">
                          Menge: {tooltipData.quantity}
                        </Badge>
                      )}
                    </div>
                    
                    {/* Drag-and-Drop Hinweis */}
                    {tooltipData.compatibleItems && tooltipData.compatibleItems.length > 0 && (
                      <div className="mt-2 text-xs text-gray-400">
                        <p>Kompatible Items: {tooltipData.compatibleItems.join(', ')}</p>
                      </div>
                    )}
                    
                    {/* Drag-and-Drop Hinweis für gezogene Items */}
                    {draggedItem && (tooltipData.compatibleItems?.includes(draggedItem.id) || tooltipData.requiredItems?.includes(draggedItem.id)) && (
                      <div className="mt-2 p-2 bg-green-500/10 border border-green-500/30 rounded text-xs text-green-400">
                        <p>✓ {draggedItem.name} kann hier verwendet werden</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Computer-Auswahl-Popup */}
      <ChoicePopup
        isOpen={isComputerPopupOpen}
        title="Computer öffnen"
        description="Was möchtest du öffnen?"
        options={[
          {
            id: 'terminal',
            label: 'Terminal',
            description: 'Hacking, Programmierung, Missionen',
            icon: <Monitor className="h-5 w-5" />
          },
          {
            id: 'darkroom',
            label: 'DarkChat',
            description: 'Darknet-Kommunikation',
            icon: <MessageSquare className="h-5 w-5" />
          }
        ]}
        onSelect={(optionId) => {
          setIsComputerPopupOpen(false);
          setCurrentView(optionId as any);
        }}
        onCancel={() => setIsComputerPopupOpen(false)}
      />

      {/* Tür-Auswahl-Popup */}
      <ChoicePopup
        isOpen={isDoorPopupOpen}
        title="Wohin möchtest du gehen?"
        description="Wähle dein Ziel"
        options={[
          {
            id: 'basement',
            label: 'Basement',
            description: 'Untergrund-Hacking-Zentrale',
            icon: <Server className="h-5 w-5" />
          },
          {
            id: 'city',
            label: 'City',
            description: 'Außenwelt erkunden',
            icon: <MapPinIcon className="h-5 w-5" />
          }
        ]}
        onSelect={(optionId) => {
          setIsDoorPopupOpen(false);
          setCurrentView(optionId as any);
        }}
        onCancel={() => setIsDoorPopupOpen(false)}
      />

      {/* Fenster-Nachricht-Popup */}
      <MessagePopup
        isOpen={isWindowPopupOpen}
        title="Fenster"
        message="Du hast eine weile aus dem Fenster geschaut, mach dich wieder an die Arbeit"
        onClose={() => setIsWindowPopupOpen(false)}
      />

      {/* Smartphone-Overlay */}
      <SmartphoneOverlay 
        isOpen={isSmartphoneOpen} 
        onClose={() => setIsSmartphoneOpen(false)} 
      />
    </div>
  );
} 