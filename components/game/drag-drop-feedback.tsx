'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X } from 'lucide-react';

interface DragDropFeedbackProps {
  isVisible: boolean;
  isValid: boolean;
  message?: string;
  position?: { x: number; y: number };
}

export default function DragDropFeedback({ 
  isVisible, 
  isValid, 
  message, 
  position 
}: DragDropFeedbackProps) {
  // Kein interner State mehr - die Komponente reagiert nur auf isVisible prop
  if (!isVisible) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`feedback-${isValid}-${message}`}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="fixed z-50 pointer-events-none"
        style={position ? { 
          left: position.x, 
          top: position.y,
          transform: 'translate(-50%, -50%)'
        } : {
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)'
        }}
      >
        {/* Hintergrund-Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          exit={{ opacity: 0 }}
          className={`absolute inset-0 rounded-lg ${
            isValid ? 'bg-green-500' : 'bg-red-500'
          } blur-sm`}
          style={{ 
            width: '160px', 
            height: '140px',
            transform: 'translate(-50%, -50%)'
          }}
        />
        
        {/* Haupt-Feedback */}
        <div className={`relative flex flex-col items-center justify-center min-w-32 min-h-24 px-4 py-3 rounded-lg border-2 ${
          isValid 
            ? 'bg-green-600/90 border-green-400 text-green-100' 
            : 'bg-red-600/90 border-red-400 text-red-100'
        } shadow-lg backdrop-blur-sm`}>
          
          {/* Icon */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.1, duration: 0.4, ease: "easeOut" }}
            className="mb-2"
          >
            {isValid ? (
              <Check className="h-8 w-8" />
            ) : (
              <X className="h-8 w-8" />
            )}
          </motion.div>
          
          {/* Message */}
          {message && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              className="text-sm font-medium text-center leading-relaxed"
            >
              {message}
            </motion.p>
          )}
        </div>
        
        {/* Pulse-Effekt */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0.8 }}
          animate={{ scale: 1.2, opacity: 0 }}
          transition={{ duration: 1, repeat: 2, ease: "easeOut" }}
          className={`absolute inset-0 rounded-lg border-2 ${
            isValid ? 'border-green-400' : 'border-red-400'
          }`}
          style={{ 
            width: '160px', 
            height: '140px',
            transform: 'translate(-50%, -50%)'
          }}
        />
      </motion.div>
    </AnimatePresence>
  );
} 