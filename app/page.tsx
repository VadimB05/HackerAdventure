"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { OptionsModal } from '@/components/ui/options-modal';
import { useGame } from '@/lib/contexts/game-context';
import { 
  Play, 
  RotateCcw, 
  Settings, 
  LogOut, 
  User, 
  Crown, 
  Zap, 
  Shield,
  Loader2,
  AlertTriangle
} from 'lucide-react';

export default function HomePage() {
  const { user, isLoading, hasGameProgress, startNewGame, continueGame, logout } = useGame();
  const [showOptions, setShowOptions] = useState(false);
  const [isStartingNew, setIsStartingNew] = useState(false);
  const [isContinuing, setIsContinuing] = useState(false);

  const handleStartNewGame = async () => {
    setIsStartingNew(true);
    try {
      await startNewGame();
    } catch (error) {
      console.error('Fehler beim Starten eines neuen Spiels:', error);
    } finally {
      setIsStartingNew(false);
    }
  };

  const handleContinueGame = async () => {
    setIsContinuing(true);
    try {
      await continueGame();
    } catch (error) {
      console.error('Fehler beim Fortsetzen des Spiels:', error);
    } finally {
      setIsContinuing(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-cyan-400" />
          <p className="text-lg text-gray-300">Lade Spiel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-black text-white relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-[url('/placeholder.jpg')] bg-cover bg-center opacity-20 animate-pulse"></div>
      
      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-black/30 to-black/50"></div>
      
      <div className="relative z-10 container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-7xl font-bold mb-6 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent animate-pulse">
            INTRUSION
          </h1>
          <p className="text-2xl text-gray-300 mb-4 font-light">
            Ein Hacker-Adventure-Spiel
          </p>
          {user && (
            <div className="flex items-center justify-center gap-2 text-cyan-400 mb-4">
              <User className="h-5 w-5" />
              <span className="text-lg">Willkommen zurück, {user.username}</span>
              {user.isAdmin && <Crown className="h-5 w-5 text-yellow-400" />}
            </div>
          )}
        </div>

        {/* Main Menu */}
        <div className="max-w-2xl mx-auto">
          <Card className="bg-gray-800/60 border-gray-700 backdrop-blur-sm">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl text-cyan-400 mb-2">Hauptmenü</CardTitle>
              <CardDescription className="text-gray-300">
                {user ? 'Wähle deine nächste Aktion' : 'Melde dich an, um zu spielen'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Neues Spiel - nur für angemeldete Benutzer */}
              {user ? (
                <Button
                  onClick={handleStartNewGame}
                  disabled={isStartingNew}
                  className="w-full h-16 text-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 border-2 border-green-500/50"
                >
                  {isStartingNew ? (
                    <>
                      <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                      Starte neues Spiel...
                    </>
                  ) : (
                    <>
                      <Play className="mr-3 h-6 w-6" />
                      Neues Spiel starten
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={() => window.location.href = '/auth'}
                  className="w-full h-16 text-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 border-2 border-green-500/50"
                >
                  <User className="mr-3 h-6 w-6" />
                  Anmelden & Spielen
                </Button>
              )}

              {/* Fortsetzen - nur für angemeldete Benutzer mit Spielstand */}
              {user && hasGameProgress && (
                <Button
                  onClick={handleContinueGame}
                  disabled={isContinuing}
                  className="w-full h-16 text-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 border-2 border-blue-500/50"
                >
                  {isContinuing ? (
                    <>
                      <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                      Lade Spielstand...
                    </>
                  ) : (
                    <>
                      <RotateCcw className="mr-3 h-6 w-6" />
                      Fortsetzen
                    </>
                  )}
                </Button>
              )}

              {/* Optionen */}
              <Button
                onClick={() => setShowOptions(true)}
                variant="outline"
                className="w-full h-16 text-xl border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-black"
              >
                <Settings className="mr-3 h-6 w-6" />
                Optionen
              </Button>

              {/* Abmelden - nur für angemeldete Benutzer */}
              {user && (
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="w-full h-16 text-xl border-red-400 text-red-400 hover:bg-red-400 hover:text-black"
                >
                  <LogOut className="mr-3 h-6 w-6" />
                  Abmelden
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Features Preview */}
        <div className="grid md:grid-cols-3 gap-8 mt-16">
          <Card className="bg-gray-800/40 border-gray-700 backdrop-blur-sm hover:bg-gray-800/60 transition-all">
            <CardHeader>
              <CardTitle className="text-cyan-400 flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Missionen & Rätsel
              </CardTitle>
              <CardDescription className="text-gray-300">
                Löse komplexe Hacking-Herausforderungen und durchlaufe verschiedene Missionen
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-gray-800/40 border-gray-700 backdrop-blur-sm hover:bg-gray-800/60 transition-all">
            <CardHeader>
              <CardTitle className="text-cyan-400 flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Terminal & Tools
              </CardTitle>
              <CardDescription className="text-gray-300">
                Nutze realistische Terminal-Befehle und Hacking-Tools
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-gray-800/40 border-gray-700 backdrop-blur-sm hover:bg-gray-800/60 transition-all">
            <CardHeader>
              <CardTitle className="text-cyan-400 flex items-center gap-2">
                <Crown className="h-5 w-5" />
                Fortschritt & Belohnungen
              </CardTitle>
              <CardDescription className="text-gray-300">
                Sammle Erfahrungspunkte, Geld und verbessere deine Fähigkeiten
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Warning for non-authenticated users */}
        {!user && (
          <div className="mt-8 text-center">
            <div className="inline-flex items-center gap-2 bg-yellow-500/20 border border-yellow-500/50 rounded-lg px-4 py-2 text-yellow-300">
              <AlertTriangle className="h-5 w-5" />
              <span>Melde dich an, um deinen Spielstand zu speichern</span>
            </div>
          </div>
        )}
      </div>

      {/* Options Modal */}
      <OptionsModal isOpen={showOptions} onClose={() => setShowOptions(false)} />
    </div>
  );
}
