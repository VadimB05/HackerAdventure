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
    case 'common': return 'text-gray-300';
    case 'uncommon': return 'text-green-400';
    case 'rare': return 'text-blue-400';
    case 'epic': return 'text-purple-400';
    case 'legendary': return 'text-yellow-400';
    default: return 'text-gray-300';
  }
};

const getRarityBorderColor = (rarity?: string) => {
  switch (rarity) {
    case 'common': return 'border-gray-500';
    case 'uncommon': return 'border-green-500';
    case 'rare': return 'border-blue-500';
    case 'epic': return 'border-purple-500';
    case 'legendary': return 'border-yellow-500';
    default: return 'border-gray-500';
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
      <div className="fixed left-4 top-1/2 transform -translate-y-1/2 z-40">
        <Card className="bg-gray-800/95 backdrop-blur-sm border-gray-600 shadow-xl">
          <CardContent className="p-3">
            <div className="flex flex-col gap-2 max-h-96">
              <div className="text-center mb-2">
                <h3 className="text-sm font-semibold text-white">Inventar</h3>
                <div className="text-xs text-gray-400">{items.length} Items</div>
              </div>
              
              <div 
                className="flex flex-col gap-2 overflow-y-auto"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'rgb(75 85 99) transparent',
                  maxHeight: '320px'
                }}
              >
                <style jsx>{`
                  div::-webkit-scrollbar {
                    width: 6px;
                  }
                  div::-webkit-scrollbar-track {
                    background: transparent;
                  }
                  div::-webkit-scrollbar-thumb {
                    background: rgb(75 85 99);
                    border-radius: 3px;
                  }
                  div::-webkit-scrollbar-thumb:hover {
                    background: rgb(107 114 128);
                  }
                `}</style>
                
                <AnimatePresence>
                  {items.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: index * 0.1, duration: 0.3 }}
                      className={`relative group ${
                        draggedItem?.id === item.id ? 'opacity-50' : ''
                      }`}
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
                              ${getRarityBorderColor(item.rarity)}
                              ${getRarityColor(item.rarity)}
                              bg-gray-700/80 hover:bg-gray-600/80
                              ${draggedItem?.id === item.id ? 'ring-2 ring-cyan-400 ring-opacity-50' : ''}
                            `}
                          >
                            {getItemIcon(item.icon, item.type)}
                            
                            {/* Quantity Badge - besser positioniert */}
                            {item.quantity > 1 && (
                              <Badge className="absolute -top-1 -right-1 bg-cyan-600 text-white text-xs min-w-0 px-1 h-4 leading-none">
                                {item.quantity}
                              </Badge>
                            )}
                            
                            {/* Rarity Indicator - kleiner und besser positioniert */}
                            {item.rarity && item.rarity !== 'common' && (
                              <div className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-current opacity-80" />
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-xs">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <div className={`p-1 rounded ${getRarityColor(item.rarity)}`}>
                                {getItemIcon(item.icon, item.type)}
                              </div>
                              <div>
                                <h4 className="font-semibold text-white">{item.name}</h4>
                                <p className="text-xs text-gray-400 capitalize">{item.type}</p>
                              </div>
                            </div>
                            <p className="text-sm text-gray-300">{item.description}</p>
                            {item.rarity && item.rarity !== 'common' && (
                              <Badge variant="outline" className={`text-xs ${getRarityColor(item.rarity)} ${getRarityBorderColor(item.rarity)}`}>
                                {item.rarity}
                              </Badge>
                            )}
                            <p className="text-xs text-gray-400">Ziehen um zu verwenden</p>
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
                    className="text-center py-4"
                  >
                    <Package className="h-6 w-6 mx-auto text-gray-500 mb-2" />
                    <p className="text-xs text-gray-400">Inventar leer</p>
                  </motion.div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
} 