'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import Smartphone from './smartphone';

interface SmartphoneOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SmartphoneOverlay({ isOpen, onClose }: SmartphoneOverlayProps) {
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
            className="fixed inset-0 z-50 flex items-end"
          >
            {/* Smartphone-Inhalt */}
            <div className="w-full h-full bg-black rounded-t-3xl overflow-hidden relative">
              {/* Schließen-Button */}
              <Button
                onClick={onClose}
                variant="ghost"
                size="sm"
                className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full w-10 h-10 p-0"
              >
                <X className="h-5 w-5" />
              </Button>
              
              {/* Smartphone-Komponente */}
              <div className="w-full h-full">
                <Smartphone />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
} 