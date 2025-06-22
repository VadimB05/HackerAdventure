'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, Clock, Lightbulb, Trophy, Coins } from 'lucide-react';

interface MultipleChoiceData {
  question: string;
  options: string[];
  correct_answer: string;
  explanation?: string;
}

interface PuzzleMultipleChoiceProps {
  puzzleId: string;
  puzzleData: {
    name: string;
    description: string;
    difficulty: number;
    maxAttempts: number;
    timeLimitSeconds?: number;
    rewardMoney: number;
    rewardExp: number;
    hints: string[];
    data: {
      multiple_choice: MultipleChoiceData;
    };
    progress: {
      isCompleted: boolean;
      attempts: number;
      hintsUsed: number;
    };
  };
  onSolve: (puzzleId: string, isCorrect: boolean) => void;
  onClose: () => void;
  useMockData?: boolean;
}

export default function PuzzleMultipleChoice({
  puzzleId,
  puzzleData,
  onSolve,
  onClose,
  useMockData = false
}: PuzzleMultipleChoiceProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [currentHintIndex, setCurrentHintIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [attempts, setAttempts] = useState(puzzleData.progress.attempts);

  // Timer für Zeitlimit
  useEffect(() => {
    if (puzzleData.timeLimitSeconds && !puzzleData.progress.isCompleted) {
      setTimeRemaining(puzzleData.timeLimitSeconds);
      
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
  }, [puzzleData.timeLimitSeconds, puzzleData.progress.isCompleted]);

  // Zeit abgelaufen
  useEffect(() => {
    if (timeRemaining === 0) {
      handleSubmit(''); // Leere Antwort bei Zeitablauf
    }
  }, [timeRemaining]);

  const handleSubmit = async (answer?: string) => {
    if (isSubmitting || attempts >= puzzleData.maxAttempts) return;
    
    const finalAnswer = answer !== undefined ? answer : selectedAnswer;
    if (!finalAnswer) return;

    setIsSubmitting(true);

    try {
      let result;
      
      if (useMockData) {
        // Mock-Logik für Test-Umgebung
        const correctAnswer = puzzleData.data.multiple_choice.correct_answer;
        const isCorrect = finalAnswer === correctAnswer;
        
        result = {
          success: true,
          isCorrect,
          message: isCorrect ? 'Richtige Antwort!' : 'Falsche Antwort!',
          attempts: attempts + 1
        };
      } else {
        // Echte API-Anfrage
        const response = await fetch(`/api/debug/puzzles/solve`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            puzzleId,
            questionId: '1', // Multiple-Choice-Rätsel haben nur eine "Frage"
            answer: finalAnswer,
            timeSpent: puzzleData.timeLimitSeconds ? puzzleData.timeLimitSeconds - (timeRemaining || 0) : undefined
          }),
        });

        result = await response.json();
      }

      if (result.success) {
        setIsCorrect(result.isCorrect);
        setAttempts(result.attempts);
        setShowResult(true);
        
        // Erfolgsmeldung nach kurzer Verzögerung
        setTimeout(() => {
          onSolve(puzzleId, result.isCorrect);
        }, 2000);
      } else {
        console.error('Fehler beim Lösen des Rätsels:', result.error);
      }
    } catch (error) {
      console.error('Netzwerkfehler:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleHint = () => {
    if (currentHintIndex < puzzleData.hints.length) {
      setShowHint(true);
      setCurrentHintIndex(prev => prev + 1);
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

  if (puzzleData.progress.isCompleted) {
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
        className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
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
            
            {puzzleData.description && (
              <p className="text-gray-300 text-sm mb-4">{puzzleData.description}</p>
            )}

            {/* Fortschritt */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-400">
                <span>Versuche: {attempts}/{puzzleData.maxAttempts}</span>
                <span>Hinweise: {puzzleData.progress.hintsUsed}</span>
              </div>
              <Progress 
                value={(attempts / puzzleData.maxAttempts) * 100} 
                className="h-2 bg-gray-700"
              />
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
                      {isCorrect ? 'Richtige Antwort!' : 'Falsche Antwort. Versuche es nochmal!'}
                    </AlertDescription>
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Frage */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">
                {puzzleData.data.multiple_choice.question}
              </h3>

              {/* Antwortoptionen */}
              <RadioGroup
                value={selectedAnswer}
                onValueChange={setSelectedAnswer}
                disabled={isSubmitting || showResult}
                className="space-y-3"
              >
                {puzzleData.data.multiple_choice.options.map((option, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="flex items-center space-x-3 p-3 border border-gray-600 rounded-lg hover:border-green-500 transition-colors">
                      <RadioGroupItem
                        value={String.fromCharCode(97 + index)} // a, b, c, d
                        id={`option-${index}`}
                        className="text-green-500 border-green-500"
                      />
                      <Label
                        htmlFor={`option-${index}`}
                        className="flex-1 cursor-pointer text-gray-300 hover:text-white transition-colors"
                      >
                        <span className="font-mono text-green-400 mr-2">
                          {String.fromCharCode(97 + index).toUpperCase()})
                        </span>
                        {option}
                      </Label>
                    </div>
                  </motion.div>
                ))}
              </RadioGroup>
            </div>

            {/* Erklärung */}
            {showResult && isCorrect && puzzleData.data.multiple_choice.explanation && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-green-500/10 border border-green-500 rounded-lg"
              >
                <h4 className="font-semibold text-green-400 mb-2">Erklärung:</h4>
                <p className="text-gray-300">{puzzleData.data.multiple_choice.explanation}</p>
              </motion.div>
            )}

            {/* Belohnungen */}
            {showResult && isCorrect && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex justify-center gap-4 p-4 bg-yellow-500/10 border border-yellow-500 rounded-lg"
              >
                {puzzleData.rewardMoney > 0 && (
                  <div className="flex items-center gap-2 text-yellow-400">
                    <Coins className="h-5 w-5" />
                    <span>+{puzzleData.rewardMoney} €</span>
                  </div>
                )}
                {puzzleData.rewardExp > 0 && (
                  <div className="flex items-center gap-2 text-blue-400">
                    <Trophy className="h-5 w-5" />
                    <span>+{puzzleData.rewardExp} XP</span>
                  </div>
                )}
              </motion.div>
            )}

            {/* Aktionen */}
            <div className="flex justify-between items-center pt-4">
              <div className="flex gap-2">
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
                  onClick={() => handleSubmit()}
                  disabled={!selectedAnswer || isSubmitting || attempts >= puzzleData.maxAttempts}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {isSubmitting ? 'Prüfe...' : 'Antwort absenden'}
                </Button>
              </div>
            </div>

            {/* Maximale Versuche erreicht */}
            {attempts >= puzzleData.maxAttempts && !puzzleData.progress.isCompleted && (
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