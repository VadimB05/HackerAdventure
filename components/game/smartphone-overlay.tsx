'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Power } from 'lucide-react';
import Smartphone from './smartphone';

interface SmartphoneOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SmartphoneOverlay({ isOpen, onClose }: SmartphoneOverlayProps) {
  React.useEffect(() => {
    const handleCloseSmartphone = () => {
      onClose();
    };

    window.addEventListener('closeSmartphone', handleCloseSmartphone);
    
    return () => {
      window.removeEventListener('closeSmartphone', handleCloseSmartphone);
    };
  }, [onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Hintergrund-Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          
          {/* Smartphone-Container */}
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ 
              type: "spring", 
              damping: 25, 
              stiffness: 200,
              duration: 0.5 
            }}
            className="fixed inset-0 z-50 flex items-end justify-center"
          >
            {/* Linker Klickbereich */}
            <div className="flex-1 h-full cursor-pointer" onClick={onClose} />
            
            {/* Smartphone-Inhalt */}
            <div className="w-full max-w-sm h-full bg-transparent rounded-t-3xl overflow-hidden relative">
              {/* Smartphone-Komponente */}
              <div className="w-full h-full">
                <Smartphone />
              </div>
            </div>
            
            {/* Rechter Klickbereich */}
            <div className="flex-1 h-full cursor-pointer" onClick={onClose} />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
} 