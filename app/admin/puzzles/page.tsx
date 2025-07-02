'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter,
  Code,
  List,
  Terminal,
  Clock,
  Zap,
  Eye,
  EyeOff,
  Star
} from 'lucide-react';
import PuzzleEditor from '@/components/admin/puzzle-editor';
import AdminLayout from '@/components/admin/admin-layout';

interface Puzzle {
  id: string;
  name: string;
  description: string;
  type: string;
  difficulty: number;
  roomId: string;
  roomName: string;
  maxAttempts: number;
  timeLimitSeconds?: number;
  isRequired: boolean;
  isHidden: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function PuzzlesPage() {
  const [puzzles, setPuzzles] = useState<Puzzle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterRoom, setFilterRoom] = useState<string>('all');
  const [rooms, setRooms] = useState<{ room_id: string; name: string }[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPuzzle, setEditingPuzzle] = useState<Puzzle | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Rätsel laden
  const loadPuzzles = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/puzzles', {
        headers: {
          'x-user-info': encodeURIComponent(JSON.stringify({ isAdmin: true }))
        }
      });

      if (!response.ok) {
        throw new Error('Fehler beim Laden der Rätsel');
      }

      const data = await response.json();
      setPuzzles(data.puzzles || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
    } finally {
      setLoading(false);
    }
  };

  // Räume laden
  const loadRooms = async () => {
    try {
      const response = await fetch('/api/admin/rooms', {
        headers: {
          'x-user-info': encodeURIComponent(JSON.stringify({ isAdmin: true }))
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRooms(data.rooms || []);
      }
    } catch (err) {
      console.error('Fehler beim Laden der Räume:', err);
    }
  };

  useEffect(() => {
    loadPuzzles();
    loadRooms();
  }, []);

  // Rätsel löschen
  const handleDelete = async (puzzleId: string) => {
    if (!confirm('Möchten Sie dieses Rätsel wirklich löschen?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/puzzles/${puzzleId}`, {
        method: 'DELETE',
        headers: {
          'x-user-info': encodeURIComponent(JSON.stringify({ isAdmin: true }))
        }
      });

      if (!response.ok) {
        throw new Error('Fehler beim Löschen des Rätsels');
      }

      await loadPuzzles();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Löschen');
    }
  };

  // Rätsel bearbeiten
  const handleEdit = (puzzle: Puzzle) => {
    setEditingPuzzle(puzzle);
    setShowEditModal(true);
  };

  // Hilfsfunktion für die Lösung je nach Typ
  function getSolutionForType(puzzleData: any) {
    switch (puzzleData.type) {
      case 'multiple_choice':
        // Korrekte Antwort als Array (wie API erwartet)
        return [puzzleData.data?.multiple_choice?.correct_answer || ''];
      case 'code':
        return [puzzleData.data?.code?.expected_input || ''];
      case 'terminal_command':
        return [puzzleData.data?.terminal?.expected_output || ''];
      case 'password':
        return [puzzleData.data?.password?.expected_hash || ''];
      case 'sequence':
        return [puzzleData.data?.sequence?.next_number || ''];
      case 'logic':
        return [puzzleData.data?.logic?.solution || ''];
      default:
        return [];
    }
  }

  // Nach Speichern
  const handleSave = async (puzzleData: any) => {
    try {
      console.log('PUZZLE DATA:', puzzleData); // Debug-Ausgabe
      const url = editingPuzzle 
        ? `/api/admin/puzzles/${editingPuzzle.id}`
        : '/api/admin/puzzles';
      
      const method = editingPuzzle ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-user-info': encodeURIComponent(JSON.stringify({ isAdmin: true }))
        },
        body: JSON.stringify({
          name: puzzleData.name,
          description: puzzleData.description,
          type: puzzleData.type,
          roomId: puzzleData.roomId,
          difficulty: puzzleData.difficulty,
          maxAttempts: puzzleData.maxAttempts,
          timeLimitSeconds: puzzleData.timeLimitSeconds,
          isRequired: puzzleData.isRequired,
          isHidden: puzzleData.isHidden,
          hints: puzzleData.hints.filter((hint: string) => hint.trim() !== ''),
          solution: getSolutionForType(puzzleData),
          data: puzzleData.data
        })
      });

      if (!response.ok) {
        throw new Error('Fehler beim Speichern des Rätsels');
      }

      await loadPuzzles();
      setShowCreateModal(false);
      setShowEditModal(false);
      setEditingPuzzle(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Speichern');
    }
  };

  // Gefilterte Rätsel
  const filteredPuzzles = puzzles.filter(puzzle => {
    const matchesSearch = puzzle.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         puzzle.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         puzzle.roomName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || puzzle.type === filterType;
    const matchesRoom = filterRoom === 'all' || puzzle.roomId === filterRoom;

    return matchesSearch && matchesType && matchesRoom;
  });

  // Typ-Icon
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'terminal':
      case 'terminal_command':
        return <Terminal className="w-4 h-4" />;
      case 'multiple_choice':
        return <List className="w-4 h-4" />;
      case 'code':
        return <Code className="w-4 h-4" />;
      default:
        return <Zap className="w-4 h-4" />;
    }
  };

  // Schwierigkeits-Badge
  const getDifficultyBadge = (difficulty: number) => {
    const colors = {
      1: 'bg-green-100 text-green-800',
      2: 'bg-yellow-100 text-yellow-800',
      3: 'bg-orange-100 text-orange-800',
      4: 'bg-red-100 text-red-800',
      5: 'bg-purple-100 text-purple-800'
    };
    return (
      <Badge className={colors[difficulty as keyof typeof colors] || colors[1]}>
        {difficulty}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2">Lade Rätsel...</p>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout title="Rätsel-Verwaltung">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Rätsel-Verwaltung</h1>
            <p className="text-gray-600">Verwalten Sie alle Rätsel im Spiel</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Neues Rätsel
          </Button>
        </div>

      {/* Filter und Suche */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Suche</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Rätsel suchen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Typ</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="all">Alle Typen</option>
                <option value="multiple_choice">Multiple Choice</option>
                <option value="code">Code</option>
                <option value="terminal">Terminal</option>
                <option value="terminal_command">Terminal Command</option>
                <option value="point_and_click">Point & Click</option>
                <option value="logic">Logik</option>
                <option value="password">Passwort</option>
                <option value="sequence">Sequenz</option>
                <option value="pattern">Muster</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Raum</label>
              <select
                value={filterRoom}
                onChange={(e) => setFilterRoom(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="all">Alle Räume</option>
                {rooms.map(room => (
                  <option key={room.room_id} value={room.room_id}>
                    {room.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <Badge variant="secondary" className="text-sm">
                {filteredPuzzles.length} von {puzzles.length} Rätseln
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fehler */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Rätsel-Tabelle */}
      <Card>
        <CardHeader>
          <CardTitle>Rätsel ({filteredPuzzles.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Name</th>
                  <th className="text-left p-2">Typ</th>
                  <th className="text-left p-2">Raum</th>
                  <th className="text-left p-2">Schwierigkeit</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Erstellt</th>
                  <th className="text-right p-2">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {filteredPuzzles.map(puzzle => (
                  <tr key={puzzle.id} className="border-b">
                    <td className="p-2">
                      <div>
                        <div className="font-medium">{puzzle.name}</div>
                        <div className="text-sm text-gray-600 truncate max-w-xs">
                          {puzzle.description}
                        </div>
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(puzzle.type)}
                        <span className="capitalize">{puzzle.type.replace('_', ' ')}</span>
                      </div>
                    </td>
                    <td className="p-2">
                      <span className="text-sm">{puzzle.roomName}</span>
                    </td>
                    <td className="p-2">
                      {getDifficultyBadge(puzzle.difficulty)}
                    </td>
                    <td className="p-2">
                      <div className="flex gap-1">
                        {puzzle.isRequired && (
                          <Badge variant="default" className="text-xs">
                            <Star className="w-3 h-3 mr-1" />
                            Erforderlich
                          </Badge>
                        )}
                        {puzzle.isHidden ? (
                          <Badge variant="secondary" className="text-xs">
                            <EyeOff className="w-3 h-3 mr-1" />
                            Versteckt
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            <Eye className="w-3 h-3 mr-1" />
                            Sichtbar
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="text-sm text-gray-600">
                        {new Date(puzzle.createdAt).toLocaleDateString('de-DE')}
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(puzzle)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(puzzle.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredPuzzles.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Keine Rätsel gefunden
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Neues Rätsel erstellen</DialogTitle>
          </DialogHeader>
          <PuzzleEditor
            roomId=""
            onSave={handleSave}
            onCancel={() => setShowCreateModal(false)}
            rooms={rooms}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Rätsel bearbeiten</DialogTitle>
          </DialogHeader>
          {editingPuzzle && (
            <PuzzleEditor
              roomId={editingPuzzle.roomId}
              onSave={handleSave}
              onCancel={() => setShowEditModal(false)}
              rooms={rooms}
              initialPuzzle={{
                puzzleId: editingPuzzle.id,
                roomId: editingPuzzle.roomId,
                name: editingPuzzle.name,
                description: editingPuzzle.description,
                type: editingPuzzle.type,
                difficulty: editingPuzzle.difficulty,
                maxAttempts: editingPuzzle.maxAttempts,
                timeLimitSeconds: editingPuzzle.timeLimitSeconds,
                rewardMoney: 0,
                rewardExp: 0,
                isRequired: editingPuzzle.isRequired,
                isHidden: editingPuzzle.isHidden,
                hints: [],
                data: {}
              }}
            />
          )}
        </DialogContent>
      </Dialog>
      </div>
    </AdminLayout>
  );
} 