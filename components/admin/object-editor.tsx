'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { 
  Plus, 
  Save, 
  Trash2, 
  Eye, 
  Puzzle,
  DoorOpen,
  Package,
  MapPin,
  Lock,
  Unlock,
  EyeOff,
  Zap,
  Target,
  Link,
  Unlink,
  Move,
  Settings,
  Palette
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { getUploadUrl } from '@/lib/utils';

interface RoomObject {
  id: string;
  roomId: string;
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
  exitRoomId?: string;
  itemId?: string;
  quantity?: number;
  isStackable?: boolean;
  maxStackSize?: number;
  rarity?: string;
  value?: number;
  unlockMessage?: string;
}

interface Room {
  room_id: string;
  name: string;
  background_image?: string;
}

interface Puzzle {
  id: string;
  name: string;
  type: string;
  roomId: string;
}

interface Item {
  id: string;
  name: string;
  type: string;
  rarity: string;
  value: number;
}

interface ObjectEditorProps {
  rooms: Room[];
  puzzles: Puzzle[];
  items?: Item[];
  onSave?: (object: RoomObject) => void;
  onCancel?: () => void;
  initialObject?: RoomObject;
}

const OBJECT_TYPES = [
  { value: 'puzzle', label: 'Rätsel', icon: Puzzle, description: 'Interaktives Rätsel-Objekt' },
  { value: 'exit', label: 'Exit', icon: DoorOpen, description: 'Übergang zu anderem Raum' },
  { value: 'item', label: 'Item', icon: Package, description: 'Aufhebbares Item' },
  { value: 'decoration', label: 'Dekoration', icon: Eye, description: 'Visuelles Objekt ohne Interaktion' },
  { value: 'container', label: 'Container', icon: Package, description: 'Behälter mit Items' },
  { value: 'trigger', label: 'Trigger', icon: Zap, description: 'Event-Auslöser' },
  { value: 'npc', label: 'NPC', icon: Target, description: 'Non-Player Character' }
];

const STATUS_OPTIONS = [
  { value: 'available', label: 'Verfügbar', icon: Unlock },
  { value: 'locked', label: 'Gesperrt', icon: Lock },
  { value: 'hidden', label: 'Versteckt', icon: EyeOff }
];

const ICON_OPTIONS = [
  'Zap', 'Eye', 'Package', 'DoorOpen', 'Puzzle', 'MapPin', 'Target', 'Settings',
  'Monitor', 'Smartphone', 'Window', 'Computer', 'Server', 'Building', 'Home',
  'ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'Star', 'Heart', 'Shield',
  'Sword', 'Key', 'Lock', 'Unlock', 'Search', 'Filter', 'Plus', 'Minus'
];

const RARITY_OPTIONS = [
  { value: 'common', label: 'Gewöhnlich', color: 'bg-gray-100 text-gray-800' },
  { value: 'uncommon', label: 'Ungewöhnlich', color: 'bg-green-100 text-green-800' },
  { value: 'rare', label: 'Selten', color: 'bg-blue-100 text-blue-800' },
  { value: 'epic', label: 'Episch', color: 'bg-purple-100 text-purple-800' },
  { value: 'legendary', label: 'Legendär', color: 'bg-orange-100 text-orange-800' }
];



export default function ObjectEditor({ 
  rooms, 
  puzzles, 
  items = [], 
  onSave, 
  onCancel, 
  initialObject 
}: ObjectEditorProps) {
  const [object, setObject] = useState<RoomObject>({
    id: '',
    roomId: '',
    name: '',
    description: '',
    type: 'puzzle',
    x: 50,
    y: 50,
    width: 10,
    height: 10,
    icon: 'Zap',
    status: 'available',
    compatibleItems: [],
    requiredItems: [],
    requiredMissionsCompleted: false,
    unlockMessage: ''
  });

  const [activeTab, setActiveTab] = useState('general');

  // State für Drag-and-Drop
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialObject) {
      setObject(initialObject);
    }
  }, [initialObject]);

  const handleInputChange = (field: keyof RoomObject, value: any) => {
    setObject(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayChange = (field: keyof RoomObject, value: string[]) => {
    setObject(prev => ({ ...prev, [field]: value }));
  };

  const addCompatibleItem = (itemId: string) => {
    if (!object.compatibleItems.includes(itemId)) {
      handleArrayChange('compatibleItems', [...object.compatibleItems, itemId]);
    }
  };

  const removeCompatibleItem = (itemId: string) => {
    handleArrayChange('compatibleItems', object.compatibleItems.filter(id => id !== itemId));
  };

  const addRequiredItem = (itemId: string) => {
    if (!object.requiredItems.includes(itemId)) {
      handleArrayChange('requiredItems', [...object.requiredItems, itemId]);
    }
  };

  const removeRequiredItem = (itemId: string) => {
    handleArrayChange('requiredItems', object.requiredItems.filter(id => id !== itemId));
  };

  const getTypeSpecificFields = () => {
    switch (object.type) {
      case 'puzzle':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="puzzleId">Verknüpftes Rätsel</Label>
              <Select 
                value={object.puzzleId || 'none'} 
                onValueChange={(value) => handleInputChange('puzzleId', value === 'none' ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Rätsel auswählen..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Kein Rätsel</SelectItem>
                  {puzzles
                    .filter(p => p.roomId === object.roomId)
                    .map(puzzle => (
                      <SelectItem key={puzzle.id} value={puzzle.id}>
                        {puzzle.name} ({puzzle.type})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="unlockMessage">Entsperr-Nachricht</Label>
              <Textarea
                id="unlockMessage"
                value={object.unlockMessage || ''}
                onChange={(e) => handleInputChange('unlockMessage', e.target.value)}
                placeholder="Nachricht die angezeigt wird, wenn das Rätsel gelöst wird..."
              />
            </div>
          </div>
        );

      case 'exit':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="exitRoomId">Ziel-Raum</Label>
              <Select 
                value={object.exitRoomId || 'none'} 
                onValueChange={(value) => handleInputChange('exitRoomId', value === 'none' ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Ziel-Raum auswählen..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Kein Ziel-Raum</SelectItem>
                  {rooms.map(room => (
                    <SelectItem key={room.room_id} value={room.room_id}>
                      {room.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="unlockMessage">Übergangs-Nachricht</Label>
              <Textarea
                id="unlockMessage"
                value={object.unlockMessage || ''}
                onChange={(e) => handleInputChange('unlockMessage', e.target.value)}
                placeholder="Nachricht die beim Betreten des Exits angezeigt wird..."
              />
            </div>
          </div>
        );

      case 'item':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="itemId">Item-Typ</Label>
              <Select 
                value={object.itemId || 'none'} 
                onValueChange={(value) => handleInputChange('itemId', value === 'none' ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Item auswählen..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Kein Item</SelectItem>
                  {items.map(item => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name} ({item.rarity})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quantity">Menge</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={object.quantity || 1}
                  onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 1)}
                />
              </div>
              <div>
                <Label htmlFor="value">Wert</Label>
                <Input
                  id="value"
                  type="number"
                  min="0"
                  step="0.01"
                  value={object.value || 0}
                  onChange={(e) => handleInputChange('value', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isStackable"
                checked={object.isStackable || false}
                onCheckedChange={(checked) => handleInputChange('isStackable', checked)}
              />
              <Label htmlFor="isStackable">Stapelbar</Label>
            </div>

            {object.isStackable && (
              <div>
                <Label htmlFor="maxStackSize">Max. Stapelgröße</Label>
                <Input
                  id="maxStackSize"
                  type="number"
                  min="1"
                  value={object.maxStackSize || 1}
                  onChange={(e) => handleInputChange('maxStackSize', parseInt(e.target.value) || 1)}
                />
              </div>
            )}
          </div>
        );

            case 'container':
        return (
          <div className="space-y-4">
            <div>
              <Label>Container-Funktionalität</Label>
              <div className="text-gray-500 text-sm">
                Container-Funktionalität wird in einer späteren Version implementiert.
              </div>
            </div>
          </div>
        );

      case 'trigger':
        return (
          <div className="space-y-4">
            <div>
              <Label>Trigger-Funktionalität</Label>
              <div className="text-gray-500 text-sm">
                Trigger-Funktionalität wird in einer späteren Version implementiert.
              </div>
            </div>
          </div>
        );

      case 'npc':
        return (
          <div className="space-y-4">
            <div>
              <Label>NPC-Funktionalität</Label>
              <div className="text-gray-500 text-sm">
                NPC-Funktionalität wird in einer späteren Version implementiert.
              </div>
            </div>
          </div>
        );

      default:
        return <div className="text-gray-500">Keine spezifischen Felder für diesen Typ</div>;
    }
  };

  const handleSave = () => {
    if (!object.name || !object.roomId) {
      alert('Name und Raum sind erforderlich!');
      return;
    }

    onSave?.(object);
  };

  // Hole das Hintergrundbild des ausgewählten Raums
  const selectedRoom = rooms.find(room => room.room_id === object.roomId);
  const roomBackground = selectedRoom?.background_image;

  // Dragging-Logik mit globalen Events
  useEffect(() => {
    if (!isDragging) return;
    const handleMove = (e: MouseEvent) => {
      if (!previewRef.current) return;
      const rect = previewRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100 - dragStart.x;
      const y = ((e.clientY - rect.top) / rect.height) * 100 - dragStart.y;
      handleInputChange('x', Math.max(0, Math.min(100 - object.width, x)));
      handleInputChange('y', Math.max(0, Math.min(100 - object.height, y)));
    };
    const handleUp = () => setIsDragging(false);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [isDragging, dragStart, object.width, object.height]);

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          {initialObject ? 'Objekt bearbeiten' : 'Neues Objekt erstellen'}
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general">Allgemein</TabsTrigger>
            <TabsTrigger value="position">Position</TabsTrigger>
            <TabsTrigger value="type">Typ & Verknüpfungen</TabsTrigger>
            <TabsTrigger value="items">Items</TabsTrigger>
            <TabsTrigger value="advanced">Erweitert</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="objectId">Objekt-ID *</Label>
                <Input
                  id="objectId"
                  value={object.id}
                  onChange={(e) => handleInputChange('id', e.target.value)}
                  placeholder="computer_desk"
                />
              </div>
              
              <div>
                <Label htmlFor="type">Objekt-Typ *</Label>
                <Select value={object.type} onValueChange={(value) => handleInputChange('type', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OBJECT_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <type.icon className="w-4 h-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="roomId">Raum *</Label>
              <Select value={object.roomId} onValueChange={(value) => handleInputChange('roomId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Raum auswählen..." />
                </SelectTrigger>
                <SelectContent>
                  {rooms.map(room => (
                    <SelectItem key={room.room_id} value={room.room_id}>
                      {room.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={object.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Computer-Schreibtisch"
              />
            </div>

            <div>
              <Label htmlFor="description">Beschreibung</Label>
              <Textarea
                id="description"
                value={object.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Beschreibe das Objekt..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="icon">Icon</Label>
                <Select value={object.icon} onValueChange={(value) => handleInputChange('icon', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ICON_OPTIONS.map(icon => {
                      const IconComponent = LucideIcons[icon] as React.ElementType;
                      return (
                        <SelectItem key={icon} value={icon}>
                          <div className="flex items-center gap-2">
                            {IconComponent ? <IconComponent className="w-4 h-4" /> : null}
                            {icon}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={object.status} onValueChange={(value) => handleInputChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map(status => (
                      <SelectItem key={status.value} value={status.value}>
                        <div className="flex items-center gap-2">
                          <status.icon className="w-4 h-4" />
                          {status.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="requiredMissionsCompleted"
                checked={object.requiredMissionsCompleted}
                onCheckedChange={(checked) => handleInputChange('requiredMissionsCompleted', checked)}
              />
              <Label htmlFor="requiredMissionsCompleted">Nur verfügbar wenn alle Missionen abgeschlossen</Label>
            </div>
          </TabsContent>

          <TabsContent value="position" className="space-y-4">
            {!object.roomId ? (
              <div className="text-center py-8 text-gray-500">
                <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Bitte wähle zuerst einen Raum aus dem "Allgemein"-Tab aus.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="x">X-Position (%)</Label>
                    <Input
                      id="x"
                      type="number"
                      min="0"
                      max="100"
                      value={object.x}
                      onChange={(e) => handleInputChange('x', Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="y">Y-Position (%)</Label>
                    <Input
                      id="y"
                      type="number"
                      min="0"
                      max="100"
                      value={object.y}
                      onChange={(e) => handleInputChange('y', Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="width">Breite (%)</Label>
                    <Input
                      id="width"
                      type="number"
                      min="1"
                      max="50"
                      value={object.width}
                      onChange={(e) => handleInputChange('width', Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="height">Höhe (%)</Label>
                    <Input
                      id="height"
                      type="number"
                      min="1"
                      max="50"
                      value={object.height}
                      onChange={(e) => handleInputChange('height', Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
                    />
                  </div>
                </div>

                <div className="border-2 border-gray-300 rounded-lg p-4 bg-gray-50">
                  <div className="text-sm font-medium mb-2">
                    Vorschau der Position: {selectedRoom?.name}
                  </div>
                  <div className="text-xs text-gray-500 mb-2">
                    Klicke und ziehe das blaue Objekt, um es zu positionieren
                  </div>
                  <div 
                    ref={previewRef}
                    className="relative w-full h-64 bg-white border border-gray-200 rounded overflow-hidden select-none"
                    style={{
                      backgroundImage: roomBackground ? `url(${getUploadUrl(roomBackground)})` : undefined,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat',
                      userSelect: 'none',
                    }}
                  >
                    {!roomBackground && (
                      <div className="absolute inset-0 flex items-center justify-center text-gray-400 select-none">
                        <div className="text-center">
                          <MapPin className="h-8 w-8 mx-auto mb-2" />
                          <p className="text-sm">Kein Hintergrundbild für diesen Raum</p>
                        </div>
                      </div>
                    )}
                    <div
                      className={`absolute bg-blue-500 bg-opacity-50 border-2 border-blue-600 cursor-move transition-all select-none ${
                        isDragging ? 'scale-105 shadow-lg' : 'hover:scale-105'
                      }`}
                      style={{
                        left: `${object.x}%`,
                        top: `${object.y}%`,
                        width: `${object.width}%`,
                        height: `${object.height}%`,
                        userSelect: 'none',
                      }}
                      onMouseDown={e => {
                        e.preventDefault();
                        e.stopPropagation();
                        const rect = previewRef.current!.getBoundingClientRect();
                        const x = ((e.clientX - rect.left) / rect.width) * 100;
                        const y = ((e.clientY - rect.top) / rect.height) * 100;
                        setDragStart({
                          x: x - object.x,
                          y: y - object.y
                        });
                        setIsDragging(true);
                      }}
                    >
                      <div className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold select-none">
                        {object.name || 'Objekt'}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="type" className="space-y-4">
            {getTypeSpecificFields()}
          </TabsContent>

          <TabsContent value="items" className="space-y-4">
            <div>
              <Label>Kompatible Items</Label>
              <div className="space-y-2">
                {object.compatibleItems.map(itemId => (
                  <div key={itemId} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <span className="flex-1">{items.find(i => i.id === itemId)?.name || itemId}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeCompatibleItem(itemId)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Select onValueChange={addCompatibleItem}>
                  <SelectTrigger>
                    <SelectValue placeholder="Kompatibles Item hinzufügen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {items
                      .filter(item => !object.compatibleItems.includes(item.id))
                      .map(item => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name} ({item.rarity})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Erforderliche Items</Label>
              <div className="space-y-2">
                {object.requiredItems.map(itemId => (
                  <div key={itemId} className="flex items-center gap-2 p-2 bg-red-50 rounded">
                    <span className="flex-1">{items.find(i => i.id === itemId)?.name || itemId}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeRequiredItem(itemId)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Select onValueChange={addRequiredItem}>
                  <SelectTrigger>
                    <SelectValue placeholder="Erforderliches Item hinzufügen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {items
                      .filter(item => !object.requiredItems.includes(item.id))
                      .map(item => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name} ({item.rarity})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            <div className="text-gray-500 text-sm">
              Erweiterte Optionen werden in einer späteren Version implementiert.
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