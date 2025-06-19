'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap, Eye, Puzzle, Lock, Trophy, Package, MapPin, Coins, DoorOpen, Monitor, MessageSquare, MapPin as MapPinIcon, Server } from 'lucide-react';
import { useGameState } from './game-context';
import SmartphoneOverlay from './smartphone-overlay';
import ChoicePopup from './choice-popup';
import MessagePopup from './message-popup';

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
}

interface RoomViewProps {
  roomId: string;
  onObjectClick?: (object: InteractiveObject) => void;
  onExitClick?: (exitId: string) => void;
}

export default function RoomView({ roomId, onObjectClick, onExitClick }: RoomViewProps) {
  const { setCurrentView } = useGameState();
  const [hoveredObject, setHoveredObject] = useState<string | null>(null);
  const [tooltipData, setTooltipData] = useState<InteractiveObject | null>(null);
  const [isSmartphoneOpen, setIsSmartphoneOpen] = useState(false);
  
  // Popup States
  const [isComputerPopupOpen, setIsComputerPopupOpen] = useState(false);
  const [isDoorPopupOpen, setIsDoorPopupOpen] = useState(false);
  const [isWindowPopupOpen, setIsWindowPopupOpen] = useState(false);

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
        icon: 'Zap'
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
        icon: 'Eye'
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
        icon: 'Package'
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
        icon: 'DoorOpen'
      }
    ]
  };

  const interactiveObjects = roomData.objects.map((obj: any) => ({
    ...obj,
    isVisible: true,
    isInteractable: true
  }));

  // Objekt-Klick-Handler
  const handleObjectClick = (object: InteractiveObject) => {
    console.log('Object clicked:', object.id, object.type);
    if (!object.isInteractable) return;
    
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