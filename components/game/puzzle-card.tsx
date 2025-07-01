'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Code, 
  List, 
  Terminal, 
  Play, 
  Clock, 
  Zap,
  Bitcoin
} from 'lucide-react';

interface PuzzleCardProps {
  puzzle: {
    id: string;
    name: string;
    description: string;
    type: 'multiple_choice' | 'code' | 'terminal';
    difficulty: number;
    timeLimitSeconds?: number;
    maxAttempts: number;
    hints?: string[];
    isCompleted?: boolean;
  };
  onSelect: (puzzleId: string) => void;
  onSolve?: (puzzleId: string, isCorrect: boolean) => void;
}

export default function PuzzleCard({ puzzle, onSelect, onSolve }: PuzzleCardProps) {
  const getPuzzleIcon = (type: string) => {
    switch (type) {
      case 'multiple_choice': return <List className="w-5 h-5" />;
      case 'code': return <Code className="w-5 h-5" />;
      case 'terminal': return <Terminal className="w-5 h-5" />;
      default: return <List className="w-5 h-5" />;
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

  return (
    <Card 
      className={`cursor-pointer transition-all duration-200 hover:scale-105 ${
        puzzle.isCompleted
          ? 'bg-green-900/20 border-green-500'
          : 'bg-gray-800 border-gray-700 hover:border-blue-500'
      }`}
      onClick={() => onSelect(puzzle.id)}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getPuzzleIcon(puzzle.type)}
            <CardTitle className="text-white text-lg">
              {puzzle.name}
            </CardTitle>
          </div>
          {puzzle.isCompleted && (
            <Badge className="bg-green-500 text-white">Gelöst</Badge>
          )}
        </div>
        <p className="text-gray-300 text-sm">
          {puzzle.description}
        </p>
      </CardHeader>
      
      <CardContent>
        <div className="flex items-center justify-between mb-3">
          <Badge className={getDifficultyColor(puzzle.difficulty)}>
            {getDifficultyText(puzzle.difficulty)}
          </Badge>
          <div className="flex items-center gap-1 text-sm text-gray-400">
            <span>Versuche: {puzzle.maxAttempts}</span>
          </div>
        </div>
        
        {puzzle.timeLimitSeconds && (
          <div className="flex items-center gap-1 text-sm text-blue-400 mb-3">
            <Clock className="w-4 h-4" />
            <span>{puzzle.timeLimitSeconds}s Zeitlimit</span>
          </div>
        )}

        <div className="flex justify-between items-center">
          <Button
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(puzzle.id);
            }}
          >
            <Play className="w-4 h-4 mr-1" />
            Starten
          </Button>
          
          {puzzle.hints && puzzle.hints.length > 0 && (
            <span className="text-xs text-gray-400">
              {puzzle.hints.length} Hinweise verfügbar
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 