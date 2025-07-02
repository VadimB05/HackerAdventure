'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import AdminLayout from '@/components/admin/admin-layout';
import ImageUpload from '@/components/admin/image-upload';
import { 
  MapPin, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  CheckCircle,
  XCircle,
  Lock,
  Unlock,
  Building2,
  Target
} from 'lucide-react';

interface Room {
  id: number;
  room_id: string;
  mission_id: string | null;
  city_id: string | null;
  name: string;
  description: string | null;
  background_image: string | null;
  is_locked: boolean;
  required_level: number;
  required_items: string[];
  required_puzzles: string[];
  connections: Record<string, any>;
  ambient_sound: string | null;
  mission_name: string | null;
  city_name: string | null;
  created_at: string;
  updated_at: string;
}

interface Mission {
  mission_id: string;
  name: string;
}

interface City {
  city_id: string;
  name: string;
}

interface RoomFormData {
  room_id: string;
  mission_id: string;
  city_id: string;
  name: string;
  description: string;
  background_image: string;
  is_locked: boolean;
  required_level: number;
  required_items: string[];
  required_puzzles: string[];
  connections: Record<string, any>;
  ambient_sound: string;
}

export default function RoomsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [formData, setFormData] = useState<RoomFormData>({
    room_id: '',
    mission_id: '',
    city_id: '',
    name: '',
    description: '',
    background_image: '',
    is_locked: false,
    required_level: 1,
    required_items: [],
    required_puzzles: [],
    connections: {},
    ambient_sound: ''
  });

  const loadData = useCallback(async () => {
    try {
      // Räume laden
      const roomsResponse = await fetch('/api/admin/rooms');
      if (roomsResponse.ok) {
        const roomsData = await roomsResponse.json();
        setRooms(roomsData.rooms);
      }

      // Missionen laden
      const missionsResponse = await fetch('/api/admin/missions');
      if (missionsResponse.ok) {
        const missionsData = await missionsResponse.json();
        setMissions(missionsData.missions);
      }

      // Städte laden
      const citiesResponse = await fetch('/api/admin/cities');
      if (citiesResponse.ok) {
        const citiesData = await citiesResponse.json();
        setCities(citiesData.cities);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Daten:', error);
      toast({
        title: "Fehler",
        description: "Daten konnten nicht geladen werden",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateRoom = async () => {
    try {
      const response = await fetch('/api/admin/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          mission_id: formData.mission_id || null,
          city_id: formData.city_id || null,
          ambient_sound: formData.ambient_sound || null
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setRooms([...rooms, data.room]);
        setIsCreateDialogOpen(false);
        resetForm();
        toast({
          title: "Erfolg",
          description: "Raum erfolgreich erstellt",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Fehler",
          description: error.error || "Raum konnte nicht erstellt werden",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Fehler beim Erstellen des Raums:', error);
      toast({
        title: "Fehler",
        description: "Raum konnte nicht erstellt werden",
        variant: "destructive"
      });
    }
  };

  const handleUpdateRoom = async () => {
    if (!editingRoom) return;

    try {
      const response = await fetch(`/api/admin/rooms/${editingRoom.room_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          mission_id: formData.mission_id || null,
          city_id: formData.city_id || null,
          ambient_sound: formData.ambient_sound || null
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setRooms(rooms.map(room => 
          room.id === editingRoom.id ? data.room : room
        ));
        setIsEditDialogOpen(false);
        setEditingRoom(null);
        resetForm();
        toast({
          title: "Erfolg",
          description: "Raum erfolgreich aktualisiert",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Fehler",
          description: error.error || "Raum konnte nicht aktualisiert werden",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Raums:', error);
      toast({
        title: "Fehler",
        description: "Raum konnte nicht aktualisiert werden",
        variant: "destructive"
      });
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    try {
      const response = await fetch(`/api/admin/rooms/${roomId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setRooms(rooms.filter(room => room.room_id !== roomId));
        toast({
          title: "Erfolg",
          description: "Raum erfolgreich gelöscht",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Fehler",
          description: error.error || "Raum konnte nicht gelöscht werden",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Fehler beim Löschen des Raums:', error);
      toast({
        title: "Fehler",
        description: "Raum konnte nicht gelöscht werden",
        variant: "destructive"
      });
    }
  };

  const openEditDialog = (room: Room) => {
    setEditingRoom(room);
    setFormData({
      room_id: room.room_id,
      mission_id: room.mission_id || '',
      city_id: room.city_id || '',
      name: room.name,
      description: room.description || '',
      background_image: room.background_image || '',
      is_locked: room.is_locked,
      required_level: room.required_level,
      required_items: room.required_items,
      required_puzzles: room.required_puzzles,
      connections: room.connections,
      ambient_sound: room.ambient_sound || ''
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      room_id: '',
      mission_id: '',
      city_id: '',
      name: '',
      description: '',
      background_image: '',
      is_locked: false,
      required_level: 1,
      required_items: [],
      required_puzzles: [],
      connections: {},
      ambient_sound: ''
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <AdminLayout title="Räume-Verwaltung" description="Verwalte alle Räume im Spiel">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Lade Räume...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Räume-Verwaltung" description="Verwalte alle Räume im Spiel">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Räume-Verwaltung</h1>
            <p className="text-gray-600">Verwalte alle Räume im Spiel</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="h-4 w-4 mr-2" />
                Neuer Raum
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Neuen Raum erstellen</DialogTitle>
                <DialogDescription>
                  Erstelle einen neuen Raum für das Spiel.
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="room_id">Raum-ID *</Label>
                  <Input
                    id="room_id"
                    value={formData.room_id}
                    onChange={(e) => setFormData({...formData, room_id: e.target.value})}
                    placeholder="z.B. intro, basement"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Raum-Name"
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="description">Beschreibung</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Raum-Beschreibung"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mission_id">Mission</Label>
                  <Select value={formData.mission_id || "none"} onValueChange={(value) => setFormData({...formData, mission_id: value === "none" ? "" : value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Mission auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Keine Mission</SelectItem>
                      {missions.map((mission) => (
                        <SelectItem key={mission.mission_id} value={mission.mission_id}>
                          {mission.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city_id">Stadt</Label>
                  <Select value={formData.city_id || "none"} onValueChange={(value) => setFormData({...formData, city_id: value === "none" ? "" : value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Stadt auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Keine Stadt</SelectItem>
                      {cities.map((city) => (
                        <SelectItem key={city.city_id} value={city.city_id}>
                          {city.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="background_image">Hintergrundbild</Label>
                  <ImageUpload
                    value={formData.background_image}
                    onChange={(value) => setFormData({...formData, background_image: value})}
                    placeholder="Hintergrundbild auswählen"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="required_level">Erforderliches Level</Label>
                  <Input
                    id="required_level"
                    type="number"
                    min="1"
                    value={formData.required_level}
                    onChange={(e) => setFormData({...formData, required_level: parseInt(e.target.value) || 1})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ambient_sound">Ambient-Sound</Label>
                  <Input
                    id="ambient_sound"
                    value={formData.ambient_sound}
                    onChange={(e) => setFormData({...formData, ambient_sound: e.target.value})}
                    placeholder="z.B. ambient/office.mp3"
                  />
                </div>
                <div className="space-y-2 flex items-center space-x-2">
                  <Switch
                    id="is_locked"
                    checked={formData.is_locked}
                    onCheckedChange={(checked) => setFormData({...formData, is_locked: checked})}
                  />
                  <Label htmlFor="is_locked">Gesperrt</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Abbrechen
                </Button>
                <Button onClick={handleCreateRoom}>
                  Erstellen
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Räume-Liste */}
        <div className="grid gap-4">
          {rooms.map((room) => (
            <Card key={room.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-xl">{room.name}</CardTitle>
                      <Badge variant={room.is_locked ? "destructive" : "default"}>
                        {room.is_locked ? (
                          <>
                            <Lock className="h-3 w-3 mr-1" />
                            Gesperrt
                          </>
                        ) : (
                          <>
                            <Unlock className="h-3 w-3 mr-1" />
                            Offen
                          </>
                        )}
                      </Badge>
                      <Badge variant="outline">
                        Level {room.required_level}
                      </Badge>
                    </div>
                    <CardDescription className="mt-2">
                      <div className="flex items-center gap-4 text-sm">
                        <span className="font-mono text-gray-500">ID: {room.room_id}</span>
                        {room.mission_name && (
                          <span className="flex items-center gap-1">
                            <Target className="h-3 w-3" />
                            {room.mission_name}
                          </span>
                        )}
                        {room.city_name && (
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {room.city_name}
                          </span>
                        )}
                      </div>
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(room)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Raum löschen</AlertDialogTitle>
                          <AlertDialogDescription>
                            Möchtest du den Raum &quot;{room.name}&quot; wirklich löschen? 
                            Diese Aktion kann nicht rückgängig gemacht werden.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteRoom(room.room_id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Löschen
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {room.description && (
                    <p className="text-gray-600">{room.description}</p>
                  )}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-semibold">Hintergrundbild:</span>
                      <p className="text-gray-600">{room.background_image || 'Standard'}</p>
                    </div>
                    <div>
                      <span className="font-semibold">Ambient-Sound:</span>
                      <p className="text-gray-600">{room.ambient_sound || 'Keiner'}</p>
                    </div>
                    <div>
                      <span className="font-semibold">Erforderliche Items:</span>
                      <p className="text-gray-600">
                        {room.required_items.length > 0 ? room.required_items.join(', ') : 'Keine'}
                      </p>
                    </div>
                    <div>
                      <span className="font-semibold">Erforderliche Rätsel:</span>
                      <p className="text-gray-600">
                        {room.required_puzzles.length > 0 ? room.required_puzzles.join(', ') : 'Keine'}
                      </p>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    Erstellt: {formatDate(room.created_at)} | 
                    Aktualisiert: {formatDate(room.updated_at)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Raum bearbeiten</DialogTitle>
              <DialogDescription>
                Bearbeite die Eigenschaften des Raums.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_room_id">Raum-ID *</Label>
                <Input
                  id="edit_room_id"
                  value={formData.room_id}
                  onChange={(e) => setFormData({...formData, room_id: e.target.value})}
                  placeholder="z.B. intro, basement"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_name">Name *</Label>
                <Input
                  id="edit_name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Raum-Name"
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="edit_description">Beschreibung</Label>
                <Textarea
                  id="edit_description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Raum-Beschreibung"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_mission_id">Mission</Label>
                <Select value={formData.mission_id || "none"} onValueChange={(value) => setFormData({...formData, mission_id: value === "none" ? "" : value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Mission auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Keine Mission</SelectItem>
                    {missions.map((mission) => (
                      <SelectItem key={mission.mission_id} value={mission.mission_id}>
                        {mission.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_city_id">Stadt</Label>
                <Select value={formData.city_id || "none"} onValueChange={(value) => setFormData({...formData, city_id: value === "none" ? "" : value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Stadt auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Keine Stadt</SelectItem>
                    {cities.map((city) => (
                      <SelectItem key={city.city_id} value={city.city_id}>
                        {city.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
                              <div className="space-y-2">
                  <Label htmlFor="edit_background_image">Hintergrundbild</Label>
                  <ImageUpload
                    value={formData.background_image}
                    onChange={(value) => setFormData({...formData, background_image: value})}
                    placeholder="Hintergrundbild auswählen"
                  />
                </div>
              <div className="space-y-2">
                <Label htmlFor="edit_required_level">Erforderliches Level</Label>
                <Input
                  id="edit_required_level"
                  type="number"
                  min="1"
                  value={formData.required_level}
                  onChange={(e) => setFormData({...formData, required_level: parseInt(e.target.value) || 1})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_ambient_sound">Ambient-Sound</Label>
                <Input
                  id="edit_ambient_sound"
                  value={formData.ambient_sound}
                  onChange={(e) => setFormData({...formData, ambient_sound: e.target.value})}
                  placeholder="z.B. ambient/office.mp3"
                />
              </div>
              <div className="space-y-2 flex items-center space-x-2">
                <Switch
                  id="edit_is_locked"
                  checked={formData.is_locked}
                  onCheckedChange={(checked) => setFormData({...formData, is_locked: checked})}
                />
                <Label htmlFor="edit_is_locked">Gesperrt</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button onClick={handleUpdateRoom}>
                Aktualisieren
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
} 