import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import PuzzleSystem from './puzzle-system';
import { useGameState } from './game-context';

interface MissionStep {
  id: string;
  type: 'text' | 'puzzle' | 'terminal';
  title: string;
  description: string;
  puzzleId?: string;
  terminalConfig?: any;
}

interface MissionData {
  missionId: string;
  name: string;
  description: string;
  steps: MissionStep[];
  rewardBitcoins: number;
  rewardExp: number;
}

interface GuidedMissionModalProps {
  missionId: string;
  isOpen: boolean;
  onClose: () => void;
  onMissionComplete?: () => void;
}

const GuidedMissionModal: React.FC<GuidedMissionModalProps> = ({ missionId, isOpen, onClose, onMissionComplete }) => {
  const [mission, setMission] = useState<MissionData | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showPuzzle, setShowPuzzle] = useState(false);
  const { setCurrentMission, alarmLevel, updateBitcoinBalance, setBitcoinBalance } = useGameState();
  const [error, setError] = useState<string | null>(null);
  const [puzzleProgress, setPuzzleProgress] = useState<{[key: string]: boolean}>({});
  const [lastAlarmLevel, setLastAlarmLevel] = useState(0);

  // Überwache Alarm-Level-Änderungen
  useEffect(() => {
    if (alarmLevel > lastAlarmLevel) {
      console.log(`Alarm-Level erhöht von ${lastAlarmLevel} auf ${alarmLevel} - Mission kann weitergehen`);
      setLastAlarmLevel(alarmLevel);
      
      // Mission-Modal NICHT schließen - nur Alarm-Level aktualisieren
      // Die Mission soll normal weitergehen können
    }
  }, [alarmLevel, lastAlarmLevel]);

  useEffect(() => {
    if (isOpen) {
      fetchMission();
    }
  }, [isOpen, missionId]);

  const fetchMission = async () => {
    setIsLoading(true);
    try {
      // Mission laden
      const missionRes = await fetch(`/api/game/missions/${missionId}`);
      
      if (!missionRes.ok) {
        throw new Error(`HTTP ${missionRes.status}: ${missionRes.statusText}`);
      }
      
      const missionData = await missionRes.json();
      console.log('Mission API response:', missionData);
      
      if (!missionData.success) {
        throw new Error(missionData.error || 'Unbekannter Fehler beim Laden der Mission');
      }

      // Puzzle-Fortschritt laden
      const progressRes = await fetch('/api/game/progress');
      const progressData = await progressRes.json();
      
      if (progressData.success) {
        const completedPuzzles = progressData.progress.puzzleProgress
          .filter((p: any) => p.isCompleted)
          .map((p: any) => p.puzzleId);
        
        const puzzleProgressMap: {[key: string]: boolean} = {};
        completedPuzzles.forEach((puzzleId: string) => {
          puzzleProgressMap[puzzleId] = true;
        });
        
        setPuzzleProgress(puzzleProgressMap);
        console.log('Gelöste Rätsel:', completedPuzzles);
        console.log('Puzzle Progress Map:', puzzleProgressMap);
        
        // Zum nächsten ungelösten Rätsel springen
        const mission = missionData.mission;
        let nextStep = 0;
        
        // Wenn keine Rätsel gelöst wurden, starte bei der Einführung (Schritt 0)
        if (completedPuzzles.length === 0) {
          nextStep = 0;
        } else {
          // Suche nach dem nächsten ungelösten Rätsel
          for (let i = 0; i < mission.steps.length; i++) {
            const step = mission.steps[i];
            console.log(`Prüfe Schritt ${i}: ${step.title}, puzzleId: ${step.puzzleId}, gelöst: ${puzzleProgressMap[step.puzzleId]}`);
            if (step.puzzleId && !puzzleProgressMap[step.puzzleId]) {
              nextStep = i;
              break;
            }
          }
          
          // Wenn alle Rätsel gelöst sind, setze auf den letzten Schritt
          if (nextStep === 0 && completedPuzzles.length > 0) {
            nextStep = mission.steps.length - 1;
          }
        }
        
        setCurrentStep(nextStep);
        console.log(`Springe zu Schritt ${nextStep + 1} (${mission.steps[nextStep]?.title})`);
      }
      
      setMission(missionData.mission);
      setIsCompleted(false);
      setShowPuzzle(false);
      
    } catch (error) {
      console.error('Fehler beim Laden der Mission:', error);
      setError(error instanceof Error ? error.message : 'Unbekannter Fehler');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextStep = async () => {
    if (!mission) return;
    
    // Aktuellen Schritt als gelöst markieren
    const currentStepData = mission.steps[currentStep];
    if (currentStepData.puzzleId) {
      setPuzzleProgress(prev => ({
        ...prev,
        [currentStepData.puzzleId!]: true
      }));
    }
    
    // Zum nächsten ungelösten Rätsel springen
    let nextStep = currentStep + 1;
    
    // Suche nach dem nächsten ungelösten Rätsel
    while (nextStep < mission.steps.length) {
      const step = mission.steps[nextStep];
      if (step.puzzleId && !puzzleProgress[step.puzzleId]) {
        break; // Ungelöstes Rätsel gefunden
      }
      nextStep++;
    }
    
    if (nextStep < mission.steps.length) {
      setCurrentStep(nextStep);
      setShowPuzzle(false);
      await saveMissionProgress(mission.missionId, mission.steps[nextStep].id);
      console.log(`Weiter zu Schritt ${nextStep + 1}: ${mission.steps[nextStep].title}`);
    } else {
      // Alle Rätsel gelöst
      setIsCompleted(true);
      await saveMissionProgress(mission.missionId, 'completed');
      console.log('Mission abgeschlossen!');
      
      // SOFORT Belohnungen vergeben - nicht erst beim Schließen!
      try {
        const response = await fetch(`/api/game/missions/${mission.missionId}/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });

        if (response.ok) {
          const result = await response.json();
          console.log('Mission-Belohnungen sofort vergeben:', result);
          
          // Bitcoin-Balance im Frontend sofort aktualisieren
          if (mission.rewardBitcoins && Number(mission.rewardBitcoins) > 0) {
            updateBitcoinBalance(mission.rewardBitcoins, `Mission abgeschlossen: ${mission.name}`, true);
          }
          
          // Aktuelle Balance aus dem Backend holen und setzen
          try {
            const stateRes = await fetch('/api/game/state', { credentials: 'include' });
            if (stateRes.ok) {
              const stateData = await stateRes.json();
              if (stateData.success && stateData.gameState) {
                if (typeof setBitcoinBalance === 'function') {
                  setBitcoinBalance(Number(stateData.gameState.bitcoins) || 0);
                }
              }
            }
          } catch (e) {
            console.error('Fehler beim Synchronisieren der Bitcoin-Balance:', e);
          }
          
          // Callback sofort aufrufen
          if (onMissionComplete) {
            onMissionComplete();
          }
        } else {
          console.error('Fehler beim Vergeben der Belohnungen');
        }
      } catch (error) {
        console.error('Fehler beim Vergeben der Belohnungen:', error);
      }
    }
  };

  const saveMissionProgress = async (missionId: string, stepId: string) => {
    try {
      await fetch('/api/game/progress/mission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ missionId, stepId }),
      });
    } catch (e) {
      // Fehler ignorieren
    }
  };

  const handleStartTerminalMission = () => {
    if (!mission) return;
    
    // Terminal-Schritt als Puzzle behandeln
    const currentStepData = mission.steps[currentStep];
    if (currentStepData.type === 'terminal' && currentStepData.puzzleId) {
      // Verwende das Terminal-Puzzle aus der Datenbank
      setShowPuzzle(true);
      console.log('Terminal-Puzzle gestartet:', currentStepData.puzzleId);
    } else {
      console.error('Kein Terminal-Puzzle für diesen Schritt gefunden');
      alert('Kein Terminal-Puzzle verfügbar');
    }
  };

  const handlePuzzleSolve = async (puzzleId: string, isCorrect: boolean) => {
    if (isCorrect) {
      setShowPuzzle(false);
      await handleNextStep();
    }
  };

  const handleStartPuzzle = () => {
    setShowPuzzle(true);
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        {isLoading ? (
          <>
            <DialogHeader>
              <DialogTitle className="sr-only">Mission wird geladen</DialogTitle>
            </DialogHeader>
            <div className="text-center p-8">Lade Mission...</div>
          </>
        ) : error ? (
          <>
            <DialogHeader>
              <DialogTitle className="sr-only">Fehler beim Laden</DialogTitle>
            </DialogHeader>
            <div className="text-center p-8">
              <h2 className="text-xl font-bold mb-4 text-red-400">Fehler beim Laden der Mission</h2>
              <p className="mb-4 text-gray-300">{error}</p>
              <div className="flex gap-2 justify-center">
                <Button onClick={fetchMission} className="bg-blue-600 hover:bg-blue-700">
                  Erneut versuchen
                </Button>
                <Button onClick={onClose} variant="outline">
                  Schließen
                </Button>
              </div>
            </div>
          </>
        ) : isCompleted ? (
          <>
            <DialogHeader>
              <DialogTitle className="sr-only">Mission abgeschlossen</DialogTitle>
            </DialogHeader>
            <div className="text-center p-8">
              <h2 className="text-xl font-bold mb-4">Mission abgeschlossen!</h2>
              <p className="mb-2">Belohnung: <b>{mission?.rewardBitcoins} BTC</b> & <b>{mission?.rewardExp} XP</b></p>
              <Button onClick={onClose}>Schließen</Button>
            </div>
          </>
        ) : showPuzzle && mission?.steps[currentStep].puzzleId ? (
          <PuzzleSystem 
            puzzleId={mission!.steps[currentStep].puzzleId!} 
            onSolve={handlePuzzleSolve} 
            onClose={() => setShowPuzzle(false)}
            useDebugApi={false}
          />
        ) : mission ? (
          <>
            <DialogHeader>
              <DialogTitle>{mission.name}</DialogTitle>
              <div className="text-sm text-gray-400 mb-2">{mission.description}</div>
              
              {/* Fortschritts-Anzeige */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                  <span>Fortschritt: {Object.keys(puzzleProgress).length} von {mission.steps.filter(step => step.puzzleId).length} Rätseln gelöst</span>
                  <span>{Math.round((Object.keys(puzzleProgress).length / mission.steps.filter(step => step.puzzleId).length) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(Object.keys(puzzleProgress).length / mission.steps.filter(step => step.puzzleId).length) * 100}%` }}
                  ></div>
                </div>
              </div>
            </DialogHeader>
            
            <div className="mb-4">
              <h3 className="font-semibold mb-2 flex items-center">
                {mission.steps[currentStep].title}
                {mission.steps[currentStep].puzzleId && puzzleProgress[mission.steps[currentStep].puzzleId!] && (
                  <span className="ml-2 text-green-400 text-sm">✓ Gelöst</span>
                )}
              </h3>
              <p className="mb-4 text-gray-300">{mission.steps[currentStep].description}</p>
              
              {/* Zeige alle Schritte mit Status */}
              <div className="mb-4 space-y-2">
                {mission.steps.map((step, index) => (
                  <div 
                    key={step.id} 
                    className={`flex items-center text-sm p-2 rounded ${
                      index === currentStep 
                        ? 'bg-blue-900/30 border border-blue-500' 
                        : index < currentStep 
                        ? 'bg-green-900/30 border border-green-500' 
                        : 'bg-gray-800/30 border border-gray-600'
                    }`}
                  >
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs mr-2
                      {index < currentStep 
                        ? 'bg-green-500 text-black' 
                        : index === currentStep 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-600 text-gray-300'
                      }">
                      {index < currentStep ? '✓' : index + 1}
                    </span>
                    <span className="flex-1">{step.title}</span>
                    {step.puzzleId && puzzleProgress[step.puzzleId] && (
                      <span className="text-green-400 text-xs">Gelöst</span>
                    )}
                  </div>
                ))}
              </div>
              
              {(mission.steps[currentStep].type === 'puzzle' || mission.steps[currentStep].type === 'terminal') && mission.steps[currentStep].puzzleId && (
                <Button onClick={handleStartPuzzle} className="mt-4 bg-blue-600 hover:bg-blue-700">
                  {mission.steps[currentStep].type === 'terminal' ? 'Terminal-Rätsel starten' : 'Rätsel starten'}
                </Button>
              )}
            </div>
            
            {mission.steps[currentStep].type === 'text' && (
              <Button onClick={handleNextStep} className="mt-4">Weiter</Button>
            )}
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

export default GuidedMissionModal; 