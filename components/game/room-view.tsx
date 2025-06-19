"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '@/lib/contexts/game-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Puzzle, 
  Package, 
  DoorOpen, 
  Lock, 
  Eye, 
  EyeOff,
  MapPin,
  Trophy,
  Coins,
  Zap
} from 'lucide-react';

interface InteractiveObject {
  id: string;
  type: 'puzzle' | 'item' | 'exit' | 'npc';
  name: string;
  description: string;
  x: number; // Prozentuale Position X (0-100)
  y: number; // Prozentuale Position Y (0-100)
  width: number; // Prozentuale Breite
  height: number; // Prozentuale Höhe
  isVisible: boolean;
  isInteractable: boolean;
  icon?: string;
  status?: 'completed' | 'locked' | 'available' | 'hidden';
  quantity?: number; // Für Items
}

interface RoomViewProps {
  roomId: string;
  onObjectClick?: (object: InteractiveObject) => void;
  onExitClick?: (exitId: string) => void;
}

function RoomView({ roomId, onObjectClick, onExitClick }: RoomViewProps) {
  const { loadRoomData } = useGame();
  const [showHints, setShowHints] = useState(false);
  const [hoveredObject, setHoveredObject] = useState<string | null>(null);
  const [tooltipData, setTooltipData] = useState<InteractiveObject | null>(null);

  // Mock-Raumdaten für das eigene Zimmer
  const roomData = {
    id: roomId,
    name: 'Mein Zimmer',
    description: 'Ein abgedunkeltes Zimmer mit Computer, Fenster und Smartphone.',
    background: '/room-bedroom.png', // Zimmer-Bild
    objects: [
      {
        id: 'computer',
        name: 'Computer',
        description: 'Mein Desktop-Computer. Hier kann ich hacken, Programme schreiben und Missionen starten.',
        type: 'puzzle' as const,
        x: 12, // Links mittig
        y: 35, // Etwas oberhalb der Mitte
        width: 20, // Breiter für Computer
        height: 15, // Höher für Computer
        status: 'available',
        icon: 'Zap'
      },
      {
        id: 'window',
        name: 'Fenster',
        description: 'Ein abgedunkeltes Fenster. Hier kann ich die Außenwelt beobachten und Informationen sammeln.',
        type: 'puzzle' as const,
        x: 47.5, // Rechts
        y: 10, // Oben
        width: 25, // Breit für Fenster
        height: 20, // Hoch für Fenster
        status: 'available',
        icon: 'Eye'
      },
      {
        id: 'smartphone',
        name: 'Smartphone',
        description: 'Mein Smartphone. Hier kann ich Nachrichten empfangen, Apps nutzen und Kontakte verwalten.',
        type: 'puzzle' as const,
        x: 30, // Links unten
        y: 60, // Unten
        width: 12, // Klein für Handy
        height: 8, // Klein für Handy
        status: 'available',
        icon: 'Package'
      },
      {
        id: 'door',
        name: 'Tür',
        description: 'Die Zimmertür. Hier kann ich das Zimmer verlassen und auf Missionen gehen.',
        type: 'exit' as const,
        x: 80, // Rechts unten
        y: 20, // Unten
        width: 12, // Standard für Tür
        height: 18, // Standard für Tür
        icon: 'DoorOpen'
      }
    ]
  };

  const interactiveObjects = roomData.objects.map((obj: any) => ({
    ...obj,
    isVisible: true,
    isInteractable: true
  }));

  // Icon-Helper-Funktionen
  const getPuzzleIcon = (puzzleType: string) => {
    switch (puzzleType) {
      case 'terminal': return 'Zap';
      case 'point_and_click': return 'Eye';
      case 'logic': return 'Puzzle';
      case 'password': return 'Lock';
      case 'sequence': return 'Trophy';
      default: return 'Puzzle';
    }
  };

  const getItemIcon = (itemType: string) => {
    switch (itemType) {
      case 'tool': return 'Package';
      case 'key': return 'Lock';
      case 'document': return 'MapPin';
      case 'consumable': return 'Coins';
      default: return 'Package';
    }
  };

  // Objekt-Klick-Handler
  const handleObjectClick = (object: InteractiveObject) => {
    if (!object.isInteractable) return;
    
    if (object.type === 'exit') {
      onExitClick?.(object.id);
    } else {
      onObjectClick?.(object);
    }
  };

  const handleObjectHover = (object: InteractiveObject, event: React.MouseEvent) => {
    setHoveredObject(object.id);
    
    // Setze Tooltip-Position auf Mausposition
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
            }`}
            style={{
              left: `${object.x}%`,
              top: `${object.y}%`,
              width: `${object.width}%`,
              height: `${object.height}%`,
            }}
            onClick={() => handleObjectClick(object)}
            onMouseEnter={(e) => handleObjectHover(object, e)}
            onMouseLeave={handleObjectLeave}
          >
            {/* Objekt-Icon */}
            <div className={`relative w-full h-full flex items-center justify-center ${
              object.status === 'completed' ? 'text-green-400' :
              object.status === 'locked' ? 'text-red-400' :
              'text-cyan-400'
            }`}>
              <div className="bg-black/50 backdrop-blur-sm rounded-lg p-2 border border-current/30 hover:bg-black/70 transition-colors">
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
            </div>
          </motion.div>
        ))}
      </div>

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
                        <Badge variant="outline" className="text-xs">
                          Menge: {tooltipData.quantity || 1}
                        </Badge>
                      )}
                      {tooltipData.type === 'exit' && (
                        <Badge variant="outline" className="text-xs text-blue-400 border-blue-400">
                          Ausgang
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hinweise (wenn aktiviert) */}
      {showHints && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute bottom-4 left-4 max-w-sm"
        >
          <Card className="bg-black/70 backdrop-blur-sm border-yellow-500">
            <CardContent className="p-4">
              <h3 className="font-semibold text-yellow-400 mb-2">Hinweise</h3>
              <ul className="text-sm text-gray-300 space-y-1">
                {interactiveObjects
                  .filter(obj => obj.type === 'puzzle' && obj.isInteractable)
                  .map(obj => (
                    <li key={obj.id}>• {obj.name} - {obj.description}</li>
                  ))}
              </ul>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

export default RoomView; 