'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Lock, Unlock, MapPin, CheckCircle, AlertCircle } from 'lucide-react';
import RoomView from '@/components/game/room-view';
import { useRouter } from 'next/navigation';

export default function TestRoomSystem() {
  const router = useRouter();
  const [currentRoom, setCurrentRoom] = useState('bedroom');
  const [notifications, setNotifications] = useState<string[]>([]);

  const handleRoomChange = (newRoomId: string) => {
    console.log('Raumwechsel zu:', newRoomId);
    setCurrentRoom(newRoomId);
    addNotification(`Raum gewechselt zu: ${newRoomId}`);
  };

  const handleUnlockNotification = (message: string) => {
    addNotification(`Freischaltung: ${message}`);
  };

  const addNotification = (message: string) => {
    setNotifications(prev => [message, ...prev.slice(0, 4)]);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Raumwechsel-System Test</h1>
          <p className="text-gray-400">
            Teste das Raumwechsel-System mit Freischaltungen und Animationen
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Hauptspielbereich */}
          <div className="lg:col-span-2">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Aktueller Raum: {currentRoom}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-96 relative">
                  <RoomView
                    roomId={currentRoom}
                    onRoomChange={handleRoomChange}
                    onUnlockNotification={handleUnlockNotification}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Kontroll-Panel */}
          <div className="space-y-4">
            {/* Aktueller Status */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg">Aktueller Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-gray-400">Aktueller Raum:</p>
                  <p className="font-semibold">{currentRoom}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-400">Features:</p>
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      <span className="text-sm">Freischaltungs-Benachrichtigungen</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      <span className="text-sm">"Weiter"-Button</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      <span className="text-sm">Raumwechsel-Animationen</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Test-Kontrollen */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg">Test-Kontrollen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <p className="text-sm text-gray-400">Raum-Navigation:</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      size="sm" 
                      onClick={() => setCurrentRoom('bedroom')}
                      variant={currentRoom === 'bedroom' ? "default" : "outline"}
                    >
                      Schlafzimmer
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => setCurrentRoom('living_room')}
                      variant={currentRoom === 'living_room' ? "default" : "outline"}
                    >
                      Wohnzimmer
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-gray-400">Test-Benachrichtigung:</p>
                  <Button 
                    size="sm" 
                    onClick={() => addNotification('Test-Benachrichtigung!')}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Benachrichtigung testen
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Benachrichtigungen */}
        <div className="mt-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Benachrichtigungen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-sm text-gray-400">Keine Benachrichtigungen</p>
                ) : (
                  notifications.map((notification, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-gray-700 rounded">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      <span className="text-sm">{notification}</span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Zurück-Button */}
        <div className="mt-6">
          <Button 
            onClick={() => router.push('/')}
            className="bg-gray-700 hover:bg-gray-600"
          >
            <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
            Zurück zur Startseite
          </Button>
        </div>
      </div>
    </div>
  );
} 