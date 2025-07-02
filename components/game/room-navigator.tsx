"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '@/lib/contexts/game-context';
import RoomView from './room-view';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  ArrowRight, 
  Map, 
  Home,
  Loader2
} from 'lucide-react';

interface RoomNavigatorProps {
  initialRoomId?: string;
  onRoomChange?: (roomId: string) => void;
  onPuzzleClick?: (puzzleId: string) => void;
  onItemClick?: (itemId: string) => void;
}

export default function RoomNavigator({ 
  initialRoomId, 
  onRoomChange, 
  onPuzzleClick, 
  onItemClick 
}: RoomNavigatorProps) {
  const { gameState, loadRoomData } = useGame();
  const [currentRoomId, setCurrentRoomId] = useState(initialRoomId || gameState?.currentRoom || 'intro');
  const [roomData, setRoomData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(false);

  // Raum laden
  const loadRoom = useCallback(async (roomId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await loadRoomData(roomId);
      if (data) {
        setRoomData(data);
        setCurrentRoomId(roomId);
        onRoomChange?.(roomId);
      } else {
        setError('Raum konnte nicht geladen werden');
      }
    } catch (err) {
      setError('Fehler beim Laden des Raums');
      console.error('Room loading error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [loadRoomData, onRoomChange]);

  // Initialen Raum laden
  useEffect(() => {
    if (currentRoomId) {
      loadRoom(currentRoomId);
    }
  }, [currentRoomId, loadRoom]);

  // Raumwechsel-Handler
  const handleExitClick = async (exitId: string) => {
    if (roomData?.room?.connections?.[exitId]) {
      await loadRoom(exitId);
    }
  };

  // Objekt-Klick-Handler
  const handleObjectClick = (object: any) => {
    if (object.type === 'puzzle') {
      onPuzzleClick?.(object.id);
    } else if (object.type === 'item') {
      onItemClick?.(object.id);
    }
  };

  // Zurück zum Hauptmenü
  const handleBackToMenu = () => {
    // Hier könnte man zum Hauptmenü navigieren
    console.log('Zurück zum Hauptmenü');
  };

  // Verfügbare Exits
  const availableExits = roomData?.room?.connections ? 
    Object.entries(roomData.room.connections).map(([id, data]: [string, any]) => ({
      id,
      name: data.name,
      description: data.description
    })) : [];

  return (
    <div className="relative w-full h-full bg-gray-900">
      {/* Loading-Overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
          >
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-cyan-400 mx-auto mb-4" />
              <p className="text-white">Wechsle Raum...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fehler-Overlay */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-4 left-4 right-4 z-40"
          >
            <Card className="bg-red-900/90 border-red-500">
              <CardContent className="p-4">
                <p className="text-red-200">{error}</p>
                <Button 
                  onClick={() => loadRoom(currentRoomId)} 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                >
                  Erneut versuchen
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Raum-View */}
      <RoomView
        roomId={currentRoomId}
        onObjectClick={handleObjectClick}
        onExitClick={handleExitClick}
      />

      {/* Navigation-Buttons */}
      <div className="absolute bottom-4 right-4 flex gap-2">
        {/* Karte */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowMap(!showMap)}
          className="bg-black/50 backdrop-blur-sm border-gray-600 text-white hover:bg-gray-800"
        >
          <Map className="h-4 w-4" />
        </Button>

        {/* Hauptmenü */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleBackToMenu}
          className="bg-black/50 backdrop-blur-sm border-gray-600 text-white hover:bg-gray-800"
        >
          <Home className="h-4 w-4" />
        </Button>
      </div>

      {/* Karte-Overlay */}
      <AnimatePresence>
        {showMap && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm z-30 flex items-center justify-center p-4"
            onClick={() => setShowMap(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-gray-800 rounded-lg p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold text-white mb-4">Raum-Karte</h2>
              
              {/* Aktueller Raum */}
              <div className="mb-4">
                <h3 className="font-semibold text-cyan-400 mb-2">Aktueller Raum</h3>
                <Card className="bg-gray-700 border-cyan-500">
                  <CardContent className="p-3">
                    <p className="text-white font-medium">{roomData?.room?.name}</p>
                    <p className="text-gray-300 text-sm">{roomData?.room?.description}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Verfügbare Exits */}
              {availableExits.length > 0 && (
                <div>
                  <h3 className="font-semibold text-green-400 mb-2">Verfügbare Ausgänge</h3>
                  <div className="space-y-2">
                    {availableExits.map((exit) => (
                      <Button
                        key={exit.id}
                        variant="outline"
                        className="w-full justify-start bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                        onClick={() => {
                          handleExitClick(exit.id);
                          setShowMap(false);
                        }}
                      >
                        <ArrowRight className="h-4 w-4 mr-2" />
                        {exit.name}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Mission-Info */}
              {roomData?.mission && (
                <div className="mt-4">
                  <h3 className="font-semibold text-yellow-400 mb-2">Aktuelle Mission</h3>
                  <Card className="bg-gray-700 border-yellow-500">
                    <CardContent className="p-3">
                      <p className="text-white font-medium">{roomData.mission.name}</p>
                      <p className="text-gray-300 text-sm">{roomData.mission.description}</p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          Schwierigkeit: {roomData.mission.difficulty}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          Level: {roomData.mission.requiredLevel}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              <Button
                variant="outline"
                className="w-full mt-4 bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                onClick={() => setShowMap(false)}
              >
                Schließen
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 