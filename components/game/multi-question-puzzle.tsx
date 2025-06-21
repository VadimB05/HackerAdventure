'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Clock, Lightbulb, Trophy, ArrowLeft, ArrowRight } from 'lucide-react';
import { getMultiQuestionPuzzle, solveMultiQuestionPuzzleDebug, type MultiQuestionPuzzleData } from '@/lib/services/multi-question-puzzle-service';

interface MultiQuestionPuzzleProps {
  puzzleId: string;
  onSolve: (puzzleId: string, isCorrect: boolean) => void;
  onClose: () => void;
}

export default function MultiQuestionPuzzle({
  puzzleId,
  onSolve,
  onClose
}: MultiQuestionPuzzleProps) {
  const [puzzleData, setPuzzleData] = useState<MultiQuestionPuzzleData | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [currentHintIndex, setCurrentHintIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [completedQuestions, setCompletedQuestions] = useState<Set<string>>(new Set());
  const [allQuestionsCompleted, setAllQuestionsCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentQuestion = puzzleData?.questions[currentQuestionIndex];
  const selectedAnswer = currentQuestion ? (answers[currentQuestion.id] || '') : '';

  // Rätsel laden
  useEffect(() => {
    loadPuzzle();
  }, [puzzleId]);

  // Timer für Zeitlimit
  useEffect(() => {
    if (puzzleData?.timeLimitSeconds && !puzzleData.progress.isCompleted) {
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
  }, [puzzleData?.timeLimitSeconds, puzzleData?.progress.isCompleted]);

  const loadPuzzle = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await getMultiQuestionPuzzle(puzzleId);

      if (result.success && result.puzzle) {
        setPuzzleData(result.puzzle);
        setAttempts(result.puzzle.progress.attempts);
        setCompletedQuestions(new Set(result.puzzle.progress.completedQuestions));
      } else {
        setError(result.error || 'Fehler beim Laden des Rätsels');
      }
    } catch (error) {
      console.error('Fehler beim Laden des Rätsels:', error);
      setError('Netzwerkfehler beim Laden des Rätsels');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerChange = (answer: string) => {
    if (!currentQuestion) return;
    
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: answer
    }));
  };

  const handleSubmit = async () => {
    if (!selectedAnswer || !currentQuestion || isSubmitting || attempts >= (puzzleData?.maxAttempts || 0)) return;

    setIsSubmitting(true);

    try {
      const result = await solveMultiQuestionPuzzleDebug(puzzleId, {
        questionId: currentQuestion.id,
        answer: selectedAnswer,
        timeSpent: puzzleData?.timeLimitSeconds ? puzzleData.timeLimitSeconds - (timeRemaining || 0) : undefined
      });

      if (result.success) {
        setIsCorrect(result.isCorrect);
        setAttempts(result.attempts);
        setShowResult(true);
        
        // Fortschritt aktualisieren
        if (result.isCorrect) {
          const newCompletedQuestions = new Set(completedQuestions);
          newCompletedQuestions.add(currentQuestion.id.toString());
          setCompletedQuestions(newCompletedQuestions);
        }
        
        // Nur schließen, wenn alle Fragen gelöst wurden
        if (result.allCompleted) {
          setAllQuestionsCompleted(true);
          // Nicht automatisch schließen - Benutzer muss manuell schließen
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

  const handleNextQuestion = () => {
    setShowResult(false);
    setIsCorrect(false);
    
    if (puzzleData && currentQuestionIndex < puzzleData.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setShowResult(false);
      setIsCorrect(false);
    }
  };

  const handleHint = () => {
    if (puzzleData && currentHintIndex < puzzleData.hints.length) {
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

  const completedCount = completedQuestions.size;
  const totalQuestions = puzzleData.questions.length;

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
            
            <p className="text-gray-300 text-sm mb-4">{puzzleData.description}</p>

            {/* Fortschritt */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-400">
                <span>Frage {currentQuestionIndex + 1} von {totalQuestions}</span>
                <span>Gelöst: {completedCount}/{totalQuestions}</span>
                <span>Versuche: {attempts}/{puzzleData.maxAttempts}</span>
              </div>
              <div className="flex gap-1">
                {puzzleData.questions.map((_, index) => (
                  <div
                    key={index}
                    className={`h-2 flex-1 rounded ${
                      index === currentQuestionIndex 
                        ? 'bg-green-500' 
                        : completedQuestions.has(puzzleData.questions[index].id.toString())
                        ? 'bg-green-300'
                        : 'bg-gray-600'
                    }`}
                  />
                ))}
              </div>
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
                        ? `Richtige Antwort! Frage ${currentQuestionIndex + 1} gelöst!` 
                        : 'Falsche Antwort. Du kannst es nochmal versuchen!'
                      }
                    </AlertDescription>
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Alle Fragen gelöst */}
            {allQuestionsCompleted && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="p-4 bg-green-500/10 border border-green-500 rounded-lg text-center"
              >
                <Trophy className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-green-400 mb-2">Alle Fragen gelöst!</h3>
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

            {/* Frage - nur anzeigen wenn Rätsel nicht vollständig gelöst */}
            {currentQuestion && !allQuestionsCompleted && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">
                  {currentQuestion.question}
                </h3>

                {/* Antwortoptionen */}
                <RadioGroup
                  value={selectedAnswer}
                  onValueChange={handleAnswerChange}
                  disabled={isSubmitting || (showResult && isCorrect)}
                  className="space-y-3"
                >
                  {currentQuestion.options.map((option, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="flex items-center space-x-3 p-3 border border-gray-600 rounded-lg hover:border-green-500 transition-colors">
                        <RadioGroupItem
                          value={String.fromCharCode(97 + index)}
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
            )}

            {/* Navigation und Aktionen - nur anzeigen wenn Rätsel nicht vollständig gelöst */}
            {!allQuestionsCompleted && (
              <div className="flex justify-between items-center pt-4">
                <div className="flex gap-2">
                  {/* Zurück-Button */}
                  {currentQuestionIndex > 0 && (
                    <Button
                      onClick={handlePreviousQuestion}
                      variant="outline"
                      size="sm"
                      className="border-blue-500 text-blue-400 hover:bg-blue-500/10"
                      disabled={isSubmitting}
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Zurück
                    </Button>
                  )}

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
                  
                  {/* Weiter-Button nach korrekter Antwort */}
                  {showResult && isCorrect && (
                    <Button
                      onClick={handleNextQuestion}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {currentQuestionIndex < puzzleData.questions.length - 1 ? (
                        <>
                          <ArrowRight className="h-4 w-4 mr-2" />
                          Nächste Frage
                        </>
                      ) : (
                        'Abschließen'
                      )}
                    </Button>
                  )}
                  
                  {/* Antwort absenden Button */}
                  {!showResult ? (
                    <Button
                      onClick={handleSubmit}
                      disabled={!selectedAnswer || isSubmitting || attempts >= puzzleData.maxAttempts}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {isSubmitting ? 'Prüfe...' : 'Antwort absenden'}
                    </Button>
                  ) : null}
                </div>
              </div>
            )}

            {/* Maximale Versuche erreicht */}
            {attempts >= puzzleData.maxAttempts && !allQuestionsCompleted && (
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