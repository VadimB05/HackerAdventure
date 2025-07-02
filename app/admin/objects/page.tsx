'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getUploadUrl } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter,
  MapPin,
  Puzzle,
  DoorOpen,
  Package,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Move,
  MousePointer,
  Save,
  X
} from 'lucide-react';
import ObjectEditor from '@/components/admin/object-editor';
import AdminLayout from '@/components/admin/admin-layout';

interface RoomObject {
  id: string;
  roomId: string;
  roomName: string;
  name: string;
  description: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  icon: string;
  status: string;
  compatibleItems: string[];
  requiredItems: string[];
  requiredMissionsCompleted: boolean;
  puzzleId?: string;
  puzzleName?: string;
  exitRoomId?: string;
  exitRoomName?: string;
  createdAt: string;
  updatedAt: string;
}

interface Room {
  room_id: string;
  name: string;
  background_image?: string;
}

export default function ObjectsPage() {
  const [objects, setObjects] = useState<RoomObject[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [puzzles, setPuzzles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterRoom, setFilterRoom] = useState<string>('all');
  const [selectedRoom, setSelectedRoom] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingObject, setEditingObject] = useState<RoomObject | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPositionEditor, setShowPositionEditor] = useState(false);
  const [positioningObject, setPositioningObject] = useState<RoomObject | null>(null);
  const [roomBackground, setRoomBackground] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  // Objekte laden
  const loadObjects = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/objects', {
        headers: {
          'x-user-info': encodeURIComponent(JSON.stringify({ isAdmin: true }))
        }
      });

      if (!response.ok) {
        throw new Error('Fehler beim Laden der Objekte');
      }

      const data = await response.json();
      setObjects(data.objects || []);
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

  // Rätsel laden
  const loadPuzzles = async () => {
    try {
      const response = await fetch('/api/admin/puzzles', {
        headers: {
          'x-user-info': encodeURIComponent(JSON.stringify({ isAdmin: true }))
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPuzzles(data.puzzles || []);
      }
    } catch (err) {
      console.error('Fehler beim Laden der Rätsel:', err);
    }
  };

  useEffect(() => {
    loadObjects();
    loadRooms();
    loadPuzzles();
  }, []);

  // Objekt löschen
  const handleDelete = async (object: RoomObject) => {
    if (!confirm(`Möchten Sie das Objekt "${object.name}" wirklich löschen?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/objects/${object.id}?roomId=${object.roomId}`, {
        method: 'DELETE',
        headers: {
          'x-user-info': encodeURIComponent(JSON.stringify({ isAdmin: true }))
        }
      });

      if (!response.ok) {
        throw new Error('Fehler beim Löschen des Objekts');
      }

      await loadObjects();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Löschen');
    }
  };

  // Objekt bearbeiten
  const handleEdit = (object: RoomObject) => {
    setEditingObject(object);
    setShowEditModal(true);
  };

  // Positionierung starten
  const handlePosition = (object: RoomObject) => {
    setPositioningObject(object);
    setSelectedRoom(object.roomId);
    setRoomBackground(object.roomName);
    setShowPositionEditor(true);
  };

  // Nach Speichern
  const handleSave = async (objectData: any) => {
    try {
      const url = editingObject 
        ? `/api/admin/objects/${editingObject.id}?roomId=${editingObject.roomId}`
        : '/api/admin/objects';
      
      const method = editingObject ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-user-info': encodeURIComponent(JSON.stringify({ isAdmin: true }))
        },
        body: JSON.stringify(objectData)
      });

      if (!response.ok) {
        throw new Error('Fehler beim Speichern des Objekts');
      }

      await loadObjects();
      setShowCreateModal(false);
      setShowEditModal(false);
      setEditingObject(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Speichern');
    }
  };

  // Position speichern
  const handlePositionSave = async (x: number, y: number, width: number, height: number) => {
    if (!positioningObject) return;

    try {
      const response = await fetch(`/api/admin/objects/${positioningObject.id}?roomId=${positioningObject.roomId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-info': encodeURIComponent(JSON.stringify({ isAdmin: true }))
        },
        body: JSON.stringify({
          x,
          y,
          width,
          height
        })
      });

      if (!response.ok) {
        throw new Error('Fehler beim Speichern der Position');
      }

      await loadObjects();
      setShowPositionEditor(false);
      setPositioningObject(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Speichern der Position');
    }
  };

  // Gefilterte Objekte
  const filteredObjects = objects.filter(obj => {
    const matchesSearch = obj.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         obj.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         obj.roomName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || obj.type === filterType;
    const matchesRoom = filterRoom === 'all' || obj.roomId === filterRoom;

    return matchesSearch && matchesType && matchesRoom;
  });

  // Typ-Icon
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'puzzle':
        return <Puzzle className="w-4 h-4" />;
      case 'exit':
        return <DoorOpen className="w-4 h-4" />;
      case 'item':
        return <Package className="w-4 h-4" />;
      case 'decoration':
        return <Eye className="w-4 h-4" />;
      default:
        return <MapPin className="w-4 h-4" />;
    }
  };

  // Status-Badge
  const getStatusBadge = (status: string) => {
    const colors = {
      available: 'bg-green-100 text-green-800',
      locked: 'bg-red-100 text-red-800',
      hidden: 'bg-gray-100 text-gray-800'
    };
    return (
      <Badge className={colors[status as keyof typeof colors] || colors.available}>
        {status === 'available' ? 'Verfügbar' : status === 'locked' ? 'Gesperrt' : 'Versteckt'}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2">Lade Objekte...</p>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout title="Objekte & Items-Verwaltung">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Objekte & Items-Verwaltung</h1>
            <p className="text-gray-600">Verwalten Sie alle interaktiven Objekte in den Räumen</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Neues Objekt
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
                  placeholder="Objekte suchen..."
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
                <option value="puzzle">Rätsel</option>
                <option value="exit">Exit</option>
                <option value="item">Item</option>
                <option value="decoration">Dekoration</option>
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
                {filteredObjects.length} von {objects.length} Objekten
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

      {/* Objekte-Tabelle */}
      <Card>
        <CardHeader>
          <CardTitle>Objekte ({filteredObjects.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Name</th>
                  <th className="text-left p-2">Typ</th>
                  <th className="text-left p-2">Raum</th>
                  <th className="text-left p-2">Position</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Verknüpfungen</th>
                  <th className="text-right p-2">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {filteredObjects.map(obj => (
                  <tr key={`${obj.roomId}-${obj.id}`} className="border-b hover:bg-gray-50">
                    <td className="p-2">
                      <div>
                        <div className="font-medium">{obj.name}</div>
                        <div className="text-sm text-gray-600 truncate max-w-xs">
                          {obj.description}
                        </div>
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(obj.type)}
                        <span className="capitalize">{obj.type}</span>
                      </div>
                    </td>
                    <td className="p-2">
                      <span className="text-sm">{obj.roomName}</span>
                    </td>
                    <td className="p-2">
                      <div className="text-sm">
                        X: {obj.x}%, Y: {obj.y}%
                        <br />
                        {obj.width}% × {obj.height}%
                      </div>
                    </td>
                    <td className="p-2">
                      {getStatusBadge(obj.status)}
                    </td>
                    <td className="p-2">
                      <div className="space-y-1">
                        {obj.puzzleId && (
                          <Badge variant="outline" className="text-xs">
                            Rätsel: {obj.puzzleName}
                          </Badge>
                        )}
                        {obj.exitRoomId && (
                          <Badge variant="outline" className="text-xs">
                            Exit: {obj.exitRoomName}
                          </Badge>
                        )}
                        {obj.requiredMissionsCompleted && (
                          <Badge variant="secondary" className="text-xs">
                            Mission erforderlich
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePosition(obj)}
                          title="Position bearbeiten"
                        >
                          <Move className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(obj)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(obj)}
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

          {filteredObjects.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Keine Objekte gefunden
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Neues Objekt erstellen</DialogTitle>
          </DialogHeader>
          <ObjectEditor
            rooms={rooms}
            puzzles={puzzles}
            onSave={handleSave}
            onCancel={() => setShowCreateModal(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Objekt bearbeiten</DialogTitle>
          </DialogHeader>
          {editingObject && (
            <ObjectEditor
              rooms={rooms}
              puzzles={puzzles}
              onSave={handleSave}
              onCancel={() => setShowEditModal(false)}
              initialObject={editingObject}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Position Editor Modal */}
      <Dialog open={showPositionEditor} onOpenChange={setShowPositionEditor}>
        <DialogContent className="max-w-6xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Position bearbeiten: {positioningObject?.name}</DialogTitle>
          </DialogHeader>
          {positioningObject && (
            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                Raum: {positioningObject.roomName} | 
                Aktuelle Position: X: {positioningObject.x}%, Y: {positioningObject.y}% | 
                Größe: {positioningObject.width}% × {positioningObject.height}%
              </div>
              
              <div className="relative border-2 border-gray-300 rounded-lg overflow-hidden" style={{ height: '400px' }}>
                {/* Raum-Hintergrund */}
                <div 
                  className="absolute inset-0 bg-gray-100 flex items-center justify-center"
                  style={{
                    backgroundImage: roomBackground ? `url(${getUploadUrl(roomBackground)})` : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                >
                  {!roomBackground && (
                    <div className="text-gray-500">Raum-Hintergrund wird geladen...</div>
                  )}
                </div>

                {/* Positionierbares Objekt */}
                <div
                  className="absolute bg-blue-500 bg-opacity-50 border-2 border-blue-600 cursor-move"
                  style={{
                    left: `${positioningObject.x}%`,
                    top: `${positioningObject.y}%`,
                    width: `${positioningObject.width}%`,
                    height: `${positioningObject.height}%`,
                  }}
                  onMouseDown={(e) => {
                    setIsDragging(true);
                    const rect = e.currentTarget.parentElement?.getBoundingClientRect();
                    if (rect) {
                      setDragPosition({
                        x: e.clientX - rect.left,
                        y: e.clientY - rect.top
                      });
                    }
                  }}
                >
                  <div className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">
                    {positioningObject.name}
                  </div>
                </div>

                {/* Grid-Overlay für bessere Positionierung */}
                <div className="absolute inset-0 pointer-events-none">
                  {Array.from({ length: 10 }, (_, i) => (
                    <React.Fragment key={i}>
                      <div 
                        className="absolute bg-gray-300 opacity-20" 
                        style={{ 
                          left: `${i * 10}%`, 
                          top: 0, 
                          width: '1px', 
                          height: '100%' 
                        }} 
                      />
                      <div 
                        className="absolute bg-gray-300 opacity-20" 
                        style={{ 
                          left: 0, 
                          top: `${i * 10}%`, 
                          width: '100%', 
                          height: '1px' 
                        }} 
                      />
                    </React.Fragment>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">X-Position (%)</label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={positioningObject.x}
                    onChange={(e) => setPositioningObject(prev => prev ? {
                      ...prev,
                      x: Math.max(0, Math.min(100, parseInt(e.target.value) || 0))
                    } : null)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Y-Position (%)</label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={positioningObject.y}
                    onChange={(e) => setPositioningObject(prev => prev ? {
                      ...prev,
                      y: Math.max(0, Math.min(100, parseInt(e.target.value) || 0))
                    } : null)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Breite (%)</label>
                  <Input
                    type="number"
                    min="1"
                    max="50"
                    value={positioningObject.width}
                    onChange={(e) => setPositioningObject(prev => prev ? {
                      ...prev,
                      width: Math.max(1, Math.min(50, parseInt(e.target.value) || 1))
                    } : null)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Höhe (%)</label>
                  <Input
                    type="number"
                    min="1"
                    max="50"
                    value={positioningObject.height}
                    onChange={(e) => setPositioningObject(prev => prev ? {
                      ...prev,
                      height: Math.max(1, Math.min(50, parseInt(e.target.value) || 1))
                    } : null)}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowPositionEditor(false)}>
                  <X className="w-4 h-4 mr-2" />
                  Abbrechen
                </Button>
                <Button onClick={() => {
                  if (positioningObject) {
                    handlePositionSave(positioningObject.x, positioningObject.y, positioningObject.width, positioningObject.height);
                  }
                }}>
                  <Save className="w-4 h-4 mr-2" />
                  Position speichern
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </AdminLayout>
  );
} 