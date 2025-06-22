import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { CheckCircle, XCircle, Clock, Lightbulb, Trophy, Lock, Eye, EyeOff } from 'lucide-react';
import { solvePuzzle, type PuzzleData } from '@/lib/services/puzzle-service';

interface PuzzleCodeInputProps {
  puzzleId: string;
  onSolve: (puzzleId: string, isCorrect: boolean) => void;
  onClose: () => void;
}

export default function PuzzleCodeInput({
  puzzleId,
  onSolve,
  onClose
}: PuzzleCodeInputProps) {
  const [puzzleData, setPuzzleData] = useState<PuzzleData | null>(null);
  const [codeInput, setCodeInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [currentHintIndex, setCurrentHintIndex] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showTrophy, setShowTrophy] = useState(false);

  // Timer für Zeitlimit
  useEffect(() => {
    if (puzzleData?.timeLimitSeconds && timeRemaining !== null) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev === null || prev <= 0) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [puzzleData?.timeLimitSeconds, timeRemaining]);

  // Rätsel laden
  const loadPuzzle = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await fetch(`/api/debug/puzzles/${puzzleId}`);
      const data = await result.json();

      if (result.ok && data.success) {
        // Debug-API Format zu Code-Format konvertieren
        const puzzle = data.puzzle;
        setPuzzleData({
          puzzleId: puzzle.puzzleId || puzzle.id,
          roomId: puzzle.roomId || 'bedroom',
          name: puzzle.name,
          description: puzzle.description,
          type: puzzle.type || 'code',
          difficulty: puzzle.difficulty,
          maxAttempts: puzzle.maxAttempts,
          timeLimitSeconds: puzzle.timeLimitSeconds,
          rewardMoney: puzzle.rewardMoney || 0.0001,
          rewardExp: puzzle.rewardExp,
          isRequired: puzzle.isRequired || false,
          isHidden: puzzle.isHidden || false,
          hints: puzzle.hints || [],
          data: puzzle.questions || {},
          progress: {
            attempts: 0,
            hintsUsed: 0,
            isCompleted: false,
            bestTimeSeconds: null,
            completedAt: null
          }
        });
        setAttempts(0);
        
        // Timer starten wenn Zeitlimit vorhanden
        if (puzzle.timeLimitSeconds) {
          setTimeRemaining(puzzle.timeLimitSeconds);
        }
      } else {
        // Fallback zu Mock-Daten
        setPuzzleData({
          puzzleId: puzzleId,
          roomId: 'bedroom',
          name: 'Code-Rätsel',
          description: 'Finde das versteckte Passwort im Code',
          type: 'code',
          difficulty: 2,
          maxAttempts: 3,
          timeLimitSeconds: 300,
          rewardMoney: 0.0003,
          rewardExp: 100,
          isRequired: false,
          isHidden: false,
          hints: ['Tipp 1: Schaue dir die Variablen an', 'Tipp 2: Versuche "password"'],
          data: {},
          progress: {
            attempts: 0,
            hintsUsed: 0,
            isCompleted: false,
            bestTimeSeconds: null,
            completedAt: null
          }
        });
        setAttempts(0);
        setTimeRemaining(300);
      }
    } catch (error) {
      console.error('Fehler beim Laden des Rätsels:', error);
      // Fallback zu Mock-Daten bei Fehler
      setPuzzleData({
        puzzleId: puzzleId,
        roomId: 'bedroom',
        name: 'Code-Rätsel',
        description: 'Finde das versteckte Passwort im Code',
        type: 'code',
        difficulty: 2,
        maxAttempts: 3,
        timeLimitSeconds: 300,
        rewardMoney: 0.0003,
        rewardExp: 100,
        isRequired: false,
        isHidden: false,
        hints: ['Tipp 1: Schaue dir die Variablen an', 'Tipp 2: Versuche "password"'],
        data: {},
        progress: {
          attempts: 0,
          hintsUsed: 0,
          isCompleted: false,
          bestTimeSeconds: null,
          completedAt: null
        }
      });
      setAttempts(0);
      setTimeRemaining(300);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPuzzle();
  }, [puzzleId]);

  const handleCodeChange = (value: string) => {
    setCodeInput(value);
    // Reset result wenn neuer Code eingegeben wird
    if (showResult) {
      setShowResult(false);
      setIsCorrect(false);
    }
  };

  const handleSubmit = async () => {
    if (!codeInput.trim() || isSubmitting || attempts >= (puzzleData?.maxAttempts || 0)) return;

    setIsSubmitting(true);

    try {
      // Debug-Solve-API verwenden (ohne Authentifizierung)
      const response = await fetch('/api/debug/puzzles/solve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          puzzleId,
          questionId: '1', // Code-Rätsel haben nur eine "Frage"
          answer: codeInput.trim(),
          timeSpent: puzzleData?.timeLimitSeconds ? puzzleData.timeLimitSeconds - (timeRemaining || 0) : undefined
        }),
      });

      const result = await response.json();

      if (result.success) {
        setIsCorrect(result.isCorrect);
        setAttempts(result.attempts);
        setShowResult(true);
        
        if (result.isCorrect) {
          // Bei richtiger Antwort: Trophäe anzeigen
          setTimeout(() => {
            setShowResult(false);
            setShowTrophy(true);
          }, 2000);
        } else {
          // Bei falscher Antwort: Ergebnis nach 3 Sekunden ausblenden und Input zurücksetzen
          setTimeout(() => {
            setShowResult(false);
            setCodeInput('');
          }, 3000);
        }
      } else {
        console.error('Fehler beim Lösen des Rätsels:', result.error);
        setError(result.error || 'Unbekannter Fehler beim Lösen des Rätsels');
      }
    } catch (error) {
      console.error('Netzwerkfehler:', error);
      setError('Netzwerkfehler beim Lösen des Rätsels');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleHint = () => {
    if (puzzleData && currentHintIndex < puzzleData.hints.length) {
      setShowHint(true);
      setCurrentHintIndex(prev => prev + 1);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isSubmitting) {
      handleSubmit();
    }
  };

  const getDifficultyColor = (difficulty: number) => {
    switch (difficulty) {
      case 1: return 'bg-green-500';
      case 2: return 'bg-yellow-500';
      case 3: return 'bg-orange-500';
      case 4: return 'bg-red-500';
      case 5: return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getDifficultyText = (difficulty: number) => {
    switch (difficulty) {
      case 1: return 'Einfach';
      case 2: return 'Leicht';
      case 3: return 'Mittel';
      case 4: return 'Schwer';
      case 5: return 'Sehr schwer';
      default: return 'Unbekannt';
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-black/80 border border-green-500 rounded-lg p-8">
          <div className="text-green-400 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
            <p className="text-lg">Lade Rätsel...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-black/80 border border-red-500 rounded-lg p-8 max-w-md mx-4">
          <div className="text-red-400 text-center">
            <h3 className="text-xl font-bold mb-4">Fehler</h3>
            <p className="mb-6">{error}</p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={loadPuzzle}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
              >
                Erneut versuchen
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded"
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!puzzleData) {
    return null;
  }

  if (puzzleData.progress?.isCompleted) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-2xl mx-4"
        >
          <Card className="bg-black/90 border-green-500 text-green-400">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <Trophy className="h-16 w-16 text-yellow-400" />
              </div>
              <CardTitle className="text-2xl text-green-400">Rätsel bereits gelöst!</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-gray-300">
                Du hast dieses Rätsel bereits erfolgreich gelöst.
              </p>
              <div className="flex justify-center gap-4">
                <Button onClick={onClose} variant="outline" className="border-green-500 text-green-400">
                  Schließen
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-2xl mx-4"
      >
        <Card className="bg-black/90 border-green-500 text-green-400">
          <CardHeader>
            <div className="flex items-center justify-between mb-4">
              <CardTitle className="text-xl text-green-400">{puzzleData.name}</CardTitle>
              <div className="flex items-center gap-2">
                <Badge className={`${getDifficultyColor(puzzleData.difficulty)} text-white`}>
                  {getDifficultyText(puzzleData.difficulty)}
                </Badge>
                {puzzleData.timeLimitSeconds && (
                  <Badge variant="outline" className="border-yellow-500 text-yellow-400">
                    <Clock className="h-3 w-3 mr-1" />
                    {timeRemaining !== null ? `${Math.floor(timeRemaining / 60)}:${(timeRemaining % 60).toString().padStart(2, '0')}` : '--:--'}
                  </Badge>
                )}
              </div>
            </div>
            
            <p className="text-gray-300 text-sm mb-4">{puzzleData.description}</p>

            {/* Versuche */}
            <div className="flex justify-between text-xs text-gray-400">
              <span>Versuche: {attempts}/{puzzleData.maxAttempts}</span>
              {puzzleData.timeLimitSeconds && timeRemaining !== null && (
                <span>Zeit: {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}</span>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Zeitlimit-Warnung */}
            {timeRemaining !== null && timeRemaining <= 30 && timeRemaining > 0 && (
              <Alert className="border-red-500 bg-red-500/10">
                <Clock className="h-4 w-4 text-red-400" />
                <AlertDescription className="text-red-400">
                  Nur noch {timeRemaining} Sekunden!
                </AlertDescription>
              </Alert>
            )}

            {/* Hinweis */}
            {showHint && puzzleData.hints[currentHintIndex - 1] && (
              <Alert className="border-yellow-500 bg-yellow-500/10">
                <Lightbulb className="h-4 w-4 text-yellow-400" />
                <AlertDescription className="text-yellow-400">
                  {puzzleData.hints[currentHintIndex - 1]}
                </AlertDescription>
              </Alert>
            )}

            {/* Ergebnis */}
            <AnimatePresence>
              {showResult && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                >
                  <Alert className={isCorrect ? "border-green-500 bg-green-500/10" : "border-red-500 bg-red-500/10"}>
                    {isCorrect ? (
                      <CheckCircle className="h-4 w-4 text-green-400" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-400" />
                    )}
                    <AlertDescription className={isCorrect ? "text-green-400" : "text-red-400"}>
                      {isCorrect 
                        ? 'Richtige Antwort! Rätsel gelöst!' 
                        : 'Falsche Antwort. Versuche es nochmal!'
                      }
                    </AlertDescription>
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Trophäe - Rätsel gelöst */}
            {showTrophy && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="p-4 bg-green-500/10 border border-green-500 rounded-lg text-center"
              >
                <Trophy className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-green-400 mb-2">Rätsel gelöst!</h3>
                <p className="text-gray-300 mb-4">Glückwunsch! Du hast das Rätsel erfolgreich abgeschlossen.</p>
                <div className="flex justify-center mb-4">
                  <div className="flex items-center gap-2 text-blue-400">
                    <Trophy className="h-5 w-5" />
                    <span>+{puzzleData.rewardExp} XP</span>
                  </div>
                </div>
                <Button
                  onClick={() => onSolve(puzzleId, true)}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Rätsel schließen
                </Button>
              </motion.div>
            )}

            {/* Code-Eingabe */}
            {!showTrophy && (
              <div className="space-y-4">
                <div className="text-center">
                  <Lock className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Code eingeben
                  </h3>
                  <p className="text-gray-400 text-sm">
                    Gib den korrekten Code oder Wert ein
                  </p>
                </div>

                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={codeInput}
                    onChange={(e) => handleCodeChange(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Code eingeben..."
                    className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-green-500 focus:ring-green-500"
                    disabled={isSubmitting || (showResult && isCorrect)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    disabled={isSubmitting}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            )}

            {/* Aktionen */}
            {!showTrophy && (
              <div className="flex justify-between items-center pt-4">
                <div className="flex gap-2">
                  {/* Hinweis-Button */}
                  {puzzleData.hints.length > 0 && currentHintIndex < puzzleData.hints.length && (
                    <Button
                      onClick={handleHint}
                      variant="outline"
                      size="sm"
                      className="border-yellow-500 text-yellow-400 hover:bg-yellow-500/10"
                      disabled={isSubmitting}
                    >
                      <Lightbulb className="h-4 w-4 mr-2" />
                      Hinweis ({currentHintIndex + 1}/{puzzleData.hints.length})
                    </Button>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={onClose}
                    variant="outline"
                    className="border-gray-500 text-gray-400 hover:bg-gray-500/10"
                    disabled={isSubmitting}
                  >
                    Abbrechen
                  </Button>
                  
                  <Button
                    onClick={handleSubmit}
                    disabled={!codeInput.trim() || isSubmitting || attempts >= puzzleData.maxAttempts}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {isSubmitting ? 'Prüfe...' : 'Code absenden'}
                  </Button>
                </div>
              </div>
            )}

            {/* Maximale Versuche erreicht */}
            {attempts >= puzzleData.maxAttempts && (
              <Alert className="border-red-500 bg-red-500/10">
                <XCircle className="h-4 w-4 text-red-400" />
                <AlertDescription className="text-red-400">
                  Maximale Anzahl Versuche erreicht. Das Rätsel ist gescheitert.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
} 