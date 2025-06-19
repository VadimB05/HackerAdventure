'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface ChoiceOption {
  id: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
}

interface ChoicePopupProps {
  isOpen: boolean;
  title: string;
  description?: string;
  options: ChoiceOption[];
  onSelect: (optionId: string) => void;
  onCancel: () => void;
}

export default function ChoicePopup({ 
  isOpen, 
  title, 
  description, 
  options, 
  onSelect, 
  onCancel 
}: ChoicePopupProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Hintergrund-Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onCancel}
          />
          
          {/* Popup-Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ 
              type: "spring", 
              damping: 25, 
              stiffness: 300,
              duration: 0.3 
            }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="w-full max-w-md bg-gray-800/95 backdrop-blur-sm border-gray-600 shadow-2xl">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-lg">{title}</CardTitle>
                  <Button
                    onClick={onCancel}
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-white p-1 h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                {description && (
                  <p className="text-gray-300 text-sm mt-1">{description}</p>
                )}
              </CardHeader>
              
              <CardContent className="space-y-3">
                {options.map((option) => (
                  <Button
                    key={option.id}
                    onClick={() => onSelect(option.id)}
                    variant="outline"
                    className="w-full justify-start h-auto p-4 bg-gray-700/50 border-gray-600 hover:bg-gray-600/50 hover:border-gray-500 text-white"
                  >
                    <div className="flex items-center gap-3">
                      {option.icon && (
                        <div className="text-cyan-400">
                          {option.icon}
                        </div>
                      )}
                      <div className="text-left">
                        <div className="font-medium">{option.label}</div>
                        {option.description && (
                          <div className="text-sm text-gray-400 mt-1">
                            {option.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </Button>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
} 