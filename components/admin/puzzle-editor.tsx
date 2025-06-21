'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Save, Trash2, Eye } from 'lucide-react';

interface PuzzleData {
  puzzleId: string;
  roomId: string;
  name: string;
  description: string;
  type: string;
  difficulty: number;
  maxAttempts: number;
  timeLimitSeconds?: number;
  rewardMoney: number;
  rewardExp: number;
  isRequired: boolean;
  isHidden: boolean;
  hints: string[];
  data: any;
}

interface PuzzleEditorProps {
  roomId: string;
  onSave?: (puzzle: PuzzleData) => void;
  onCancel?: () => void;
  initialPuzzle?: PuzzleData;
}

export default function PuzzleEditor({ roomId, onSave, onCancel, initialPuzzle }: PuzzleEditorProps) {
  const [puzzle, setPuzzle] = useState<PuzzleData>({
    puzzleId: '',
    roomId: roomId,
    name: '',
    description: '',
    type: 'multiple_choice',
    difficulty: 1,
    maxAttempts: 3,
    timeLimitSeconds: undefined,
    rewardMoney: 0,
    rewardExp: 0,
    isRequired: false,
    isHidden: false,
    hints: [''],
    data: {}
  });

  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    if (initialPuzzle) {
      setPuzzle(initialPuzzle);
    }
  }, [initialPuzzle]);

  const handleInputChange = (field: keyof PuzzleData, value: any) => {
    setPuzzle(prev => ({ ...prev, [field]: value }));
  };

  const handleHintChange = (index: number, value: string) => {
    const newHints = [...puzzle.hints];
    newHints[index] = value;
    setPuzzle(prev => ({ ...prev, hints: newHints }));
  };

  const addHint = () => {
    setPuzzle(prev => ({ ...prev, hints: [...prev.hints, ''] }));
  };

  const removeHint = (index: number) => {
    const newHints = puzzle.hints.filter((_, i) => i !== index);
    setPuzzle(prev => ({ ...prev, hints: newHints }));
  };

  const handleDataChange = (key: string, value: any) => {
    setPuzzle(prev => ({
      ...prev,
      data: {
        ...prev.data,
        [puzzle.type]: {
          ...prev.data[puzzle.type],
          [key]: value
        }
      }
    }));
  };

  const getTypeSpecificFields = () => {
    switch (puzzle.type) {
      case 'multiple_choice':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="question">Frage</Label>
              <Textarea
                id="question"
                value={puzzle.data.multiple_choice?.question || ''}
                onChange={(e) => handleDataChange('question', e.target.value)}
                placeholder="Stelle deine Frage hier..."
              />
            </div>
            
            <div>
              <Label>Antwortoptionen</Label>
              {['a', 'b', 'c', 'd'].map((option) => (
                <div key={option} className="flex gap-2 mt-2">
                  <Input
                    value={puzzle.data.multiple_choice?.options?.[option.charCodeAt(0) - 97] || ''}
                    onChange={(e) => {
                      const options = [...(puzzle.data.multiple_choice?.options || ['', '', '', ''])];
                      options[option.charCodeAt(0) - 97] = e.target.value;
                      handleDataChange('options', options);
                    }}
                    placeholder={`Option ${option.toUpperCase()}`}
                  />
                  <Button
                    type="button"
                    variant={puzzle.data.multiple_choice?.correct_answer === option ? 'default' : 'outline'}
                    onClick={() => handleDataChange('correct_answer', option)}
                    className="w-20"
                  >
                    {option.toUpperCase()}
                  </Button>
                </div>
              ))}
            </div>

            <div>
              <Label htmlFor="explanation">Erklärung</Label>
              <Textarea
                id="explanation"
                value={puzzle.data.multiple_choice?.explanation || ''}
                onChange={(e) => handleDataChange('explanation', e.target.value)}
                placeholder="Erklärung für die richtige Antwort..."
              />
            </div>
          </div>
        );

      case 'code':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="code_snippet">Code-Snippet</Label>
              <Textarea
                id="code_snippet"
                value={puzzle.data.code?.code_snippet || ''}
                onChange={(e) => handleDataChange('code_snippet', e.target.value)}
                placeholder="Code hier einfügen..."
                className="font-mono"
                rows={8}
              />
            </div>
            
            <div>
              <Label htmlFor="expected_input">Erwartete Eingabe</Label>
              <Input
                id="expected_input"
                value={puzzle.data.code?.expected_input || ''}
                onChange={(e) => handleDataChange('expected_input', e.target.value)}
                placeholder="admin123"
              />
            </div>

            <div className="flex gap-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="case_sensitive"
                  checked={puzzle.data.code?.case_sensitive || false}
                  onChange={(e) => handleDataChange('case_sensitive', e.target.checked)}
                />
                <Label htmlFor="case_sensitive">Groß-/Kleinschreibung beachten</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="allow_partial"
                  checked={puzzle.data.code?.allow_partial || false}
                  onChange={(e) => handleDataChange('allow_partial', e.target.checked)}
                />
                <Label htmlFor="allow_partial">Teilweise Übereinstimmung erlauben</Label>
              </div>
            </div>

            <div>
              <Label htmlFor="language">Programmiersprache</Label>
              <Select
                value={puzzle.data.code?.language || 'javascript'}
                onValueChange={(value) => handleDataChange('language', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="javascript">JavaScript</SelectItem>
                  <SelectItem value="python">Python</SelectItem>
                  <SelectItem value="java">Java</SelectItem>
                  <SelectItem value="cpp">C++</SelectItem>
                  <SelectItem value="sql">SQL</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'terminal_command':
        return (
          <div className="space-y-4">
            <div>
              <Label>Erlaubte Befehle</Label>
              <div className="space-y-2">
                {['ls', 'ls -la', 'ls -l', 'dir'].map((cmd, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={puzzle.data.terminal?.allowed_commands?.[index] || cmd}
                      onChange={(e) => {
                        const commands = [...(puzzle.data.terminal?.allowed_commands || ['ls', 'ls -la', 'ls -l', 'dir'])];
                        commands[index] = e.target.value;
                        handleDataChange('allowed_commands', commands);
                      }}
                      placeholder="Befehl"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="expected_output">Erwartete Ausgabe</Label>
              <Input
                id="expected_output"
                value={puzzle.data.terminal?.expected_output || ''}
                onChange={(e) => handleDataChange('expected_output', e.target.value)}
                placeholder="file1.txt file2.txt secret.txt"
              />
            </div>

            <div>
              <Label htmlFor="working_directory">Arbeitsverzeichnis</Label>
              <Input
                id="working_directory"
                value={puzzle.data.terminal?.working_directory || ''}
                onChange={(e) => handleDataChange('working_directory', e.target.value)}
                placeholder="/home/user/documents"
              />
            </div>
          </div>
        );

      case 'password':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="hash_type">Hash-Typ</Label>
              <Select
                value={puzzle.data.password?.hash_type || 'md5'}
                onValueChange={(value) => handleDataChange('hash_type', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="md5">MD5</SelectItem>
                  <SelectItem value="sha1">SHA1</SelectItem>
                  <SelectItem value="sha256">SHA256</SelectItem>
                  <SelectItem value="plain">Plain Text</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="expected_hash">Hash (oder Plain Text)</Label>
              <Input
                id="expected_hash"
                value={puzzle.data.password?.expected_hash || ''}
                onChange={(e) => handleDataChange('expected_hash', e.target.value)}
                placeholder="5f4dcc3b5aa765d61d8327deb882cf99"
              />
            </div>

            <div>
              <Label htmlFor="plaintext">Plain Text (für Referenz)</Label>
              <Input
                id="plaintext"
                value={puzzle.data.password?.plaintext || ''}
                onChange={(e) => handleDataChange('plaintext', e.target.value)}
                placeholder="password"
              />
            </div>

            <div>
              <Label htmlFor="hint_text">Hinweis-Text</Label>
              <Input
                id="hint_text"
                value={puzzle.data.password?.hint_text || ''}
                onChange={(e) => handleDataChange('hint_text', e.target.value)}
                placeholder="Das Passwort ist ein sehr häufiges Wort"
              />
            </div>
          </div>
        );

      case 'sequence':
        return (
          <div className="space-y-4">
            <div>
              <Label>Zahlenfolge</Label>
              <div className="flex gap-2 flex-wrap">
                {[2, 4, 8, 16, 32].map((num, index) => (
                  <Input
                    key={index}
                    value={puzzle.data.sequence?.sequence?.[index] || num}
                    onChange={(e) => {
                      const sequence = [...(puzzle.data.sequence?.sequence || [2, 4, 8, 16, 32])];
                      sequence[index] = parseInt(e.target.value) || 0;
                      handleDataChange('sequence', sequence);
                    }}
                    className="w-16"
                    type="number"
                  />
                ))}
                <Badge variant="outline" className="flex items-center">?</Badge>
              </div>
            </div>

            <div>
              <Label htmlFor="next_number">Nächste Zahl</Label>
              <Input
                id="next_number"
                value={puzzle.data.sequence?.next_number || ''}
                onChange={(e) => handleDataChange('next_number', parseInt(e.target.value) || 0)}
                type="number"
                placeholder="64"
              />
            </div>

            <div>
              <Label htmlFor="pattern">Muster</Label>
              <Input
                id="pattern"
                value={puzzle.data.sequence?.pattern || ''}
                onChange={(e) => handleDataChange('pattern', e.target.value)}
                placeholder="multiply_by_2"
              />
            </div>

            <div>
              <Label htmlFor="pattern_description">Muster-Beschreibung</Label>
              <Input
                id="pattern_description"
                value={puzzle.data.sequence?.pattern_description || ''}
                onChange={(e) => handleDataChange('pattern_description', e.target.value)}
                placeholder="Jede Zahl wird mit 2 multipliziert"
              />
            </div>
          </div>
        );

      case 'logic':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="problem_text">Problem-Text</Label>
              <Textarea
                id="problem_text"
                value={puzzle.data.logic?.problem_text || ''}
                onChange={(e) => handleDataChange('problem_text', e.target.value)}
                placeholder="Wenn x + 10 = 52, was ist dann x?"
              />
            </div>

            <div>
              <Label htmlFor="solution">Lösung</Label>
              <Input
                id="solution"
                value={puzzle.data.logic?.solution || ''}
                onChange={(e) => handleDataChange('solution', e.target.value)}
                placeholder="42"
              />
            </div>

            <div>
              <Label htmlFor="logic_type">Logik-Typ</Label>
              <Select
                value={puzzle.data.logic?.logic_type || 'mathematical'}
                onValueChange={(value) => handleDataChange('logic_type', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mathematical">Mathematisch</SelectItem>
                  <SelectItem value="logical">Logisch</SelectItem>
                  <SelectItem value="pattern">Muster</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="equation">Gleichung (optional)</Label>
              <Input
                id="equation"
                value={puzzle.data.logic?.equation || ''}
                onChange={(e) => handleDataChange('equation', e.target.value)}
                placeholder="x + 10 = 52"
              />
            </div>
          </div>
        );

      default:
        return <div>Rätseltyp nicht unterstützt</div>;
    }
  };

  const handleSave = () => {
    if (!puzzle.name || !puzzle.puzzleId) {
      console.error('Name und Puzzle-ID sind erforderlich');
      return;
    }

    onSave?.(puzzle);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          {initialPuzzle ? 'Rätsel bearbeiten' : 'Neues Rätsel erstellen'}
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">Allgemein</TabsTrigger>
            <TabsTrigger value="content">Inhalt</TabsTrigger>
            <TabsTrigger value="rewards">Belohnungen</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="puzzleId">Puzzle-ID *</Label>
                <Input
                  id="puzzleId"
                  value={puzzle.puzzleId}
                  onChange={(e) => handleInputChange('puzzleId', e.target.value)}
                  placeholder="intro_quiz_1"
                />
              </div>
              
              <div>
                <Label htmlFor="type">Rätseltyp *</Label>
                <Select value={puzzle.type} onValueChange={(value) => handleInputChange('type', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                    <SelectItem value="code">Code-Analyse</SelectItem>
                    <SelectItem value="terminal_command">Terminal-Befehl</SelectItem>
                    <SelectItem value="password">Passwort/Hash</SelectItem>
                    <SelectItem value="sequence">Zahlenfolge</SelectItem>
                    <SelectItem value="logic">Logik-Rätsel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={puzzle.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Hacking-Grundlagen Quiz"
              />
            </div>

            <div>
              <Label htmlFor="description">Beschreibung</Label>
              <Textarea
                id="description"
                value={puzzle.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Beschreibe das Rätsel..."
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="difficulty">Schwierigkeit</Label>
                <Select value={puzzle.difficulty.toString()} onValueChange={(value) => handleInputChange('difficulty', parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - Einfach</SelectItem>
                    <SelectItem value="2">2 - Leicht</SelectItem>
                    <SelectItem value="3">3 - Mittel</SelectItem>
                    <SelectItem value="4">4 - Schwer</SelectItem>
                    <SelectItem value="5">5 - Sehr schwer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="maxAttempts">Max. Versuche</Label>
                <Input
                  id="maxAttempts"
                  type="number"
                  min="1"
                  max="10"
                  value={puzzle.maxAttempts}
                  onChange={(e) => handleInputChange('maxAttempts', parseInt(e.target.value))}
                />
              </div>

              <div>
                <Label htmlFor="timeLimit">Zeitlimit (Sekunden)</Label>
                <Input
                  id="timeLimit"
                  type="number"
                  min="0"
                  value={puzzle.timeLimitSeconds || ''}
                  onChange={(e) => handleInputChange('timeLimitSeconds', e.target.value ? parseInt(e.target.value) : undefined)}
                  placeholder="Optional"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isRequired"
                  checked={puzzle.isRequired}
                  onChange={(e) => handleInputChange('isRequired', e.target.checked)}
                />
                <Label htmlFor="isRequired">Erforderlich</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isHidden"
                  checked={puzzle.isHidden}
                  onChange={(e) => handleInputChange('isHidden', e.target.checked)}
                />
                <Label htmlFor="isHidden">Versteckt</Label>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="content" className="space-y-4">
            {getTypeSpecificFields()}
            
            <div className="border-t pt-4">
              <Label>Hinweise</Label>
              <div className="space-y-2">
                {puzzle.hints.map((hint, index) => (
                  <div key={index} className="flex gap-2">
                    <Textarea
                      value={hint}
                      onChange={(e) => handleHintChange(index, e.target.value)}
                      placeholder={`Hinweis ${index + 1}`}
                      rows={2}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeHint(index)}
                      disabled={puzzle.hints.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addHint}>
                  <Plus className="h-4 w-4 mr-2" />
                  Hinweis hinzufügen
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="rewards" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="rewardMoney">Geld-Belohnung</Label>
                <Input
                  id="rewardMoney"
                  type="number"
                  min="0"
                  step="0.01"
                  value={puzzle.rewardMoney}
                  onChange={(e) => handleInputChange('rewardMoney', parseFloat(e.target.value) || 0)}
                />
              </div>

              <div>
                <Label htmlFor="rewardExp">Erfahrungspunkte</Label>
                <Input
                  id="rewardExp"
                  type="number"
                  min="0"
                  value={puzzle.rewardExp}
                  onChange={(e) => handleInputChange('rewardExp', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>

            <div>
              <Label>Item-Belohnungen</Label>
              <Textarea
                value={JSON.stringify(puzzle.data.rewardItems || [], null, 2)}
                onChange={(e) => {
                  try {
                    const items = JSON.parse(e.target.value);
                    handleDataChange('rewardItems', items);
                  } catch {
                    // Ignore invalid JSON
                  }
                }}
                placeholder='["item_id_1", "item_id_2"]'
                rows={3}
              />
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onCancel}>
            Abbrechen
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Speichern
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 