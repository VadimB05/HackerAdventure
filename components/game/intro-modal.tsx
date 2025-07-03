import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Code, Brain, Zap, ArrowRight } from 'lucide-react';
import { autoSave } from '@/lib/services/save-service';

interface IntroModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const IntroModal: React.FC<IntroModalProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isTyping, setIsTyping] = useState(false);

  const steps = [
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Willkommen, n0seC",
      content: "Hier beginnt deine Reise als Ethischer Hacker. Diese Simulation ist für Lernzwecke gebaut."
    },
    {
      icon: <Code className="h-8 w-8" />,
      title: "Lernumgebung",
      content: "Google, KI und andere Hilfsmittel sind erlaubt. Achte aber darauf, dass du verstehst, warum du etwas verwendest."
    },
    {
      icon: <Brain className="h-8 w-8" />,
      title: "Verstehen statt Auswendiglernen",
      content: "Das Ziel ist nicht, Antworten zu finden, sondern zu verstehen, wie Sicherheitssysteme funktionieren."
    },
    {
      icon: <Zap className="h-8 w-8" />,
      title: "Bereit für deine Mission?",
      content: "Klicke auf 'Start' um deine erste Hacking-Mission zu beginnen."
    }
  ];

  useEffect(() => {
    if (isOpen) {
      console.log('[DEBUG] useEffect: IntroModal geöffnet, setCurrentStep(0)');
      setCurrentStep(0);
      setIsTyping(true);
    }
  }, [isOpen]);

  const saveIntroCompletion = async () => {
    console.log('[DEBUG] saveIntroCompletion aufgerufen');
    
    // Session-basierter Schutz: Prüfe ob der Speichervorgang bereits in dieser Session durchgeführt wurde
    const sessionKey = 'introModalSaved';
    const hasSavedThisSession = sessionStorage.getItem(sessionKey);
    
    if (hasSavedThisSession) {
      console.log('[DEBUG] IntroModal-Speichervorgang bereits in dieser Session durchgeführt, überspringe');
      return;
    }
    
    try {
      const authResponse = await fetch('/api/auth/verify', {
        method: 'GET',
        credentials: 'include'
      });
      
      if (authResponse.ok) {
        const authData = await authResponse.json();
        if (authData.user && authData.user.id) {
          await autoSave(authData.user.id, {
            type: 'intro_modal_completed',
            data: { reason: 'Intro-Modal abgeschlossen' },
            timestamp: new Date().toISOString()
          });
          sessionStorage.setItem(sessionKey, 'true');
        }
      }
    } catch (e) {
      console.error('Fehler beim Speichern des Intro-Modal-Speicherpunkts:', e);
      // Auch bei Fehler als "durchgeführt" markieren, um weitere Versuche zu vermeiden
      sessionStorage.setItem(sessionKey, 'true');
    }
  };

  const handleNext = async () => {
    console.log('[DEBUG] handleNext aufgerufen, currentStep:', currentStep);
    if (currentStep < steps.length - 1) {
      setIsTyping(false);
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
        setIsTyping(true);
      }, 200);
    } else {
      await saveIntroCompletion();
      onClose();
    }
  };

  const handleSkip = async () => {
    console.log('[DEBUG] handleSkip aufgerufen');
    await saveIntroCompletion();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-gradient-to-br from-gray-900 via-black to-gray-900 border-2 border-green-500/50 shadow-2xl">
        {/* Accessibility: DialogTitle für Screenreader */}
        <DialogTitle className="sr-only">Willkommen bei Intrusion</DialogTitle>
        <div className="relative overflow-hidden">
          {/* Animated background grid */}
          <div className="absolute inset-0 opacity-10">
            <div className="grid grid-cols-8 grid-rows-8 h-full">
              {Array.from({ length: 64 }).map((_, i) => (
                <div key={i} className="border border-green-500/20"></div>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="relative z-10 p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="text-center"
              >
                {/* Icon */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="flex justify-center mb-6"
                >
                  <div className="p-4 bg-green-500/20 border-2 border-green-500/50 rounded-full text-green-400">
                    {steps[currentStep].icon}
                  </div>
                </motion.div>

                {/* Title */}
                <motion.h2
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="text-2xl font-bold text-green-400 mb-4"
                >
                  {steps[currentStep].title}
                </motion.h2>

                {/* Content */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="text-lg text-gray-300 leading-relaxed mb-8"
                >
                  {steps[currentStep].content}
                </motion.p>

                {/* Progress dots */}
                <div className="flex justify-center space-x-2 mb-6">
                  {steps.map((_, index) => (
                    <motion.div
                      key={index}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
                      className={`w-3 h-3 rounded-full ${
                        index === currentStep
                          ? 'bg-green-500'
                          : index < currentStep
                          ? 'bg-green-500/50'
                          : 'bg-gray-600'
                      }`}
                    />
                  ))}
                </div>

                {/* Buttons */}
                <div className="flex justify-center space-x-4">
                  <Button
                    onClick={handleSkip}
                    variant="outline"
                    className="border-gray-600 text-gray-400 hover:bg-gray-800 hover:text-white"
                  >
                    Überspringen
                  </Button>
                  <Button
                    onClick={handleNext}
                    className="bg-green-600 hover:bg-green-700 text-white border-green-500"
                  >
                    {currentStep === steps.length - 1 ? (
                      <>
                        <Zap className="mr-2 h-4 w-4" />
                        Start
                      </>
                    ) : (
                      <>
                        Weiter
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Decorative elements */}
          <div className="absolute top-0 left-0 w-20 h-20 border-l-2 border-t-2 border-green-500/30"></div>
          <div className="absolute top-0 right-0 w-20 h-20 border-r-2 border-t-2 border-green-500/30"></div>
          <div className="absolute bottom-0 left-0 w-20 h-20 border-l-2 border-b-2 border-green-500/30"></div>
          <div className="absolute bottom-0 right-0 w-20 h-20 border-r-2 border-b-2 border-green-500/30"></div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default IntroModal; 