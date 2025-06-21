'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Laptop, 
  Usb, 
  Key, 
  BookOpen, 
  Battery, 
  Lock, 
  Unlock, 
  Package,
  Zap,
  Eye,
  Puzzle,
  Trophy,
  MapPin,
  Coins,
  DoorOpen,
  Monitor,
  MessageSquare,
  Server
} from 'lucide-react';

interface InventoryItem {
  id: string;
  name: string;
  type: 'tool' | 'key' | 'document' | 'consumable' | 'equipment' | 'weapon' | 'armor';
  quantity: number;
  description: string;
  rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  icon?: string;
}

interface InventoryBarProps {
  items: InventoryItem[];
  onItemDragStart?: (item: InventoryItem, event: React.DragEvent) => void;
  onItemDragEnd?: (event: React.DragEvent) => void;
}

const getItemIcon = (iconName?: string, itemType?: string) => {
  switch (iconName) {
    case 'Laptop': return <Laptop className="h-5 w-5" />;
    case 'Usb': return <Usb className="h-5 w-5" />;
    case 'Key': return <Key className="h-5 w-5" />;
    case 'BookOpen': return <BookOpen className="h-5 w-5" />;
    case 'Battery': return <Battery className="h-5 w-5" />;
    case 'Package': return <Package className="h-5 w-5" />;
    case 'Zap': return <Zap className="h-5 w-5" />;
    case 'Eye': return <Eye className="h-5 w-5" />;
    case 'Puzzle': return <Puzzle className="h-5 w-5" />;
    case 'Trophy': return <Trophy className="h-5 w-5" />;
    case 'MapPin': return <MapPin className="h-5 w-5" />;
    case 'Coins': return <Coins className="h-5 w-5" />;
    case 'DoorOpen': return <DoorOpen className="h-5 w-5" />;
    case 'Monitor': return <Monitor className="h-5 w-5" />;
    case 'MessageSquare': return <MessageSquare className="h-5 w-5" />;
    case 'Server': return <Server className="h-5 w-5" />;
    default:
      // Fallback basierend auf Item-Typ
      switch (itemType) {
        case 'tool': return <Zap className="h-5 w-5" />;
        case 'key': return <Key className="h-5 w-5" />;
        case 'document': return <BookOpen className="h-5 w-5" />;
        case 'consumable': return <Battery className="h-5 w-5" />;
        case 'equipment': return <Package className="h-5 w-5" />;
        case 'weapon': return <Zap className="h-5 w-5" />;
        case 'armor': return <Package className="h-5 w-5" />;
        default: return <Package className="h-5 w-5" />;
      }
  }
};

const getRarityColor = (rarity?: string) => {
  switch (rarity) {
    case 'common': return 'text-green-400';
    case 'uncommon': return 'text-green-300';
    case 'rare': return 'text-green-200';
    case 'epic': return 'text-green-100';
    case 'legendary': return 'text-yellow-400';
    default: return 'text-green-400';
  }
};

const getRarityBorderColor = (rarity?: string) => {
  switch (rarity) {
    case 'common': return 'border-green-500';
    case 'uncommon': return 'border-green-400';
    case 'rare': return 'border-green-300';
    case 'epic': return 'border-green-200';
    case 'legendary': return 'border-yellow-500';
    default: return 'border-green-500';
  }
};

export default function InventoryBar({ items, onItemDragStart, onItemDragEnd }: InventoryBarProps) {
  const [draggedItem, setDraggedItem] = useState<InventoryItem | null>(null);

  const handleDragStart = (item: InventoryItem, event: React.DragEvent) => {
    setDraggedItem(item);
    event.dataTransfer.setData('application/json', JSON.stringify(item));
    event.dataTransfer.effectAllowed = 'copy';
    
    // Visuelles Feedback für das gezogene Item
    if (event.dataTransfer.setDragImage) {
      const dragImage = event.currentTarget.cloneNode(true) as HTMLElement;
      dragImage.style.opacity = '0.7';
      dragImage.style.transform = 'scale(0.8)';
      document.body.appendChild(dragImage);
      event.dataTransfer.setDragImage(dragImage, 25, 25);
      setTimeout(() => document.body.removeChild(dragImage), 0);
    }
    
    onItemDragStart?.(item, event);
  };

  const handleDragEnd = (event: React.DragEvent) => {
    setDraggedItem(null);
    onItemDragEnd?.(event);
  };

  return (
    <TooltipProvider>
      <div className="fixed left-4 bottom-4 z-40">
        <div className="bg-black/70 backdrop-blur-sm border border-green-500 rounded-lg shadow-xl">
          <div className="p-3">
            <div className="flex flex-col gap-2">
              <div className="text-center mb-2">
                <h3 className="text-green-400 font-bold text-xs">Inventar</h3>
                <p className="text-green-300 text-xs">{items.length} Items</p>
              </div>
              
              <div 
                className="flex flex-row gap-2 overflow-x-auto pb-3 px-1"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'rgb(34 197 94) transparent',
                  maxWidth: '320px',
                  paddingBottom: '12px'
                }}
              >
                <style jsx>{`
                  div::-webkit-scrollbar {
                    height: 6px;
                  }
                  div::-webkit-scrollbar-track {
                    background: transparent;
                  }
                  div::-webkit-scrollbar-thumb {
                    background: rgb(34 197 94);
                    border-radius: 3px;
                    opacity: 0.5;
                  }
                  div::-webkit-scrollbar-thumb:hover {
                    background: rgb(74 222 128);
                    opacity: 0.8;
                  }
                `}</style>
                
                <AnimatePresence>
                  {items.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.1, duration: 0.3 }}
                      className={`relative group flex-shrink-0 ${
                        draggedItem?.id === item.id ? 'opacity-50' : ''
                      }`}
                      style={{
                        // Platz für Hover-Animation reservieren
                        padding: '4px',
                        margin: '0 -4px'
                      }}
                    >
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            draggable
                            onDragStart={(e) => handleDragStart(item, e)}
                            onDragEnd={handleDragEnd}
                            className={`
                              w-12 h-12 rounded-lg border-2 cursor-grab active:cursor-grabbing
                              transition-all duration-200 hover:scale-110 hover:shadow-lg
                              flex items-center justify-center relative
                              bg-black border-green-500 text-green-500 hover:bg-green-900
                              ${draggedItem?.id === item.id ? 'ring-2 ring-green-400 ring-opacity-50' : ''}
                            `}
                          >
                            {getItemIcon(item.icon, item.type)}
                            
                            {/* Quantity Badge - im grünen Design */}
                            {item.quantity > 1 && (
                              <Badge className="absolute -top-1 -right-1 bg-green-600 text-white text-xs min-w-0 px-1 h-3 leading-none border border-green-400">
                                {item.quantity}
                              </Badge>
                            )}
                            
                            {/* Rarity Indicator - im grünen Design */}
                            {item.rarity && item.rarity !== 'common' && (
                              <div className="absolute -bottom-0.5 -right-0.5 w-1 h-1 rounded-full bg-green-400 opacity-80" />
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs bg-black border-green-500">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <div className="p-1 rounded text-green-400">
                                {getItemIcon(item.icon, item.type)}
                              </div>
                              <div>
                                <h4 className="font-semibold text-green-400">{item.name}</h4>
                                <p className="text-xs text-green-300 capitalize">{item.type}</p>
                              </div>
                            </div>
                            <p className="text-sm text-green-300">{item.description}</p>
                            {item.rarity && item.rarity !== 'common' && (
                              <Badge variant="outline" className="text-xs text-green-400 border-green-400 bg-black">
                                {item.rarity}
                              </Badge>
                            )}
                            <p className="text-xs text-green-400">Ziehen um zu verwenden</p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {items.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-4 flex-shrink-0"
                  >
                    <Package className="h-6 w-6 mx-auto text-green-500 mb-2" />
                    <p className="text-xs text-green-400">Inventar leer</p>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
} 