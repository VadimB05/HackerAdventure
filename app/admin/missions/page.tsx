'use client';

import { useState, useEffect } from 'react';
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
import { 
  Target, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  CheckCircle,
  XCircle,
  Star,
  Coins,
  Zap
} from 'lucide-react';

interface Mission {
  id: number;
  mission_id: string;
  name: string;
  description: string | null;
  difficulty: number;
  required_level: number;
  reward_bitcoins: string;
  reward_exp: number;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

interface MissionFormData {
  mission_id: string;
  name: string;
  description: string;
  difficulty: number;
  required_level: number;
  reward_bitcoins: string;
  reward_exp: number;
  is_available: boolean;
}

export default function MissionsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingMission, setEditingMission] = useState<Mission | null>(null);
  const [formData, setFormData] = useState<MissionFormData>({
    mission_id: '',
    name: '',
    description: '',
    difficulty: 1,
    required_level: 1,
    reward_bitcoins: '0.00000000',
    reward_exp: 0,
    is_available: true
  });

  useEffect(() => {
    loadMissions();
  }, []);

  const loadMissions = async () => {
    try {
      const response = await fetch('/api/admin/missions');
      if (response.ok) {
        const data = await response.json();
        setMissions(data.missions);
      } else {
        toast({
          title: "Fehler",
          description: "Missionen konnten nicht geladen werden",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Fehler beim Laden der Missionen:', error);
      toast({
        title: "Fehler",
        description: "Missionen konnten nicht geladen werden",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMission = async () => {
    try {
      const response = await fetch('/api/admin/missions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        setMissions([...missions, data.mission]);
        setIsCreateDialogOpen(false);
        resetForm();
        toast({
          title: "Erfolg",
          description: "Mission erfolgreich erstellt",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Fehler",
          description: error.error || "Mission konnte nicht erstellt werden",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Fehler beim Erstellen der Mission:', error);
      toast({
        title: "Fehler",
        description: "Mission konnte nicht erstellt werden",
        variant: "destructive"
      });
    }
  };

  const handleUpdateMission = async () => {
    if (!editingMission) return;

    try {
      const response = await fetch(`/api/admin/missions/${editingMission.mission_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        setMissions(missions.map(mission => 
          mission.id === editingMission.id ? data.mission : mission
        ));
        setIsEditDialogOpen(false);
        setEditingMission(null);
        resetForm();
        toast({
          title: "Erfolg",
          description: "Mission erfolgreich aktualisiert",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Fehler",
          description: error.error || "Mission konnte nicht aktualisiert werden",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Mission:', error);
      toast({
        title: "Fehler",
        description: "Mission konnte nicht aktualisiert werden",
        variant: "destructive"
      });
    }
  };

  const handleDeleteMission = async (missionId: string) => {
    try {
      const response = await fetch(`/api/admin/missions/${missionId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMissions(missions.filter(mission => mission.mission_id !== missionId));
        toast({
          title: "Erfolg",
          description: "Mission erfolgreich gelöscht",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Fehler",
          description: error.error || "Mission konnte nicht gelöscht werden",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Fehler beim Löschen der Mission:', error);
      toast({
        title: "Fehler",
        description: "Mission konnte nicht gelöscht werden",
        variant: "destructive"
      });
    }
  };

  const openEditDialog = (mission: Mission) => {
    setEditingMission(mission);
    setFormData({
      mission_id: mission.mission_id,
      name: mission.name,
      description: mission.description || '',
      difficulty: mission.difficulty,
      required_level: mission.required_level,
      reward_bitcoins: mission.reward_bitcoins,
      reward_exp: mission.reward_exp,
      is_available: mission.is_available
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      mission_id: '',
      name: '',
      description: '',
      difficulty: 1,
      required_level: 1,
      reward_bitcoins: '0.00000000',
      reward_exp: 0,
      is_available: true
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

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty <= 2) return 'bg-green-600';
    if (difficulty <= 4) return 'bg-yellow-600';
    return 'bg-red-600';
  };

  const getDifficultyText = (difficulty: number) => {
    if (difficulty <= 2) return 'Einfach';
    if (difficulty <= 4) return 'Mittel';
    return 'Schwer';
  };

  if (loading) {
    return (
      <AdminLayout title="Missionen" description="Missionen verwalten und erstellen">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
            <p>Missionen werden geladen...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Missionen" description="Missionen verwalten und erstellen">
      {/* Header mit Aktionen */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Missionen-Verwaltung</h1>
          <p className="text-gray-400">Verwalte die verfügbaren Missionen im Spiel</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Neue Mission
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-800 border-gray-700 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-white">Neue Mission erstellen</DialogTitle>
              <DialogDescription className="text-gray-400">
                Erstelle eine neue Mission für das Spiel
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="mission_id" className="text-white">Mission-ID</Label>
                <Input
                  id="mission_id"
                  value={formData.mission_id}
                  onChange={(e) => setFormData({...formData, mission_id: e.target.value})}
                  placeholder="z.B. mission7_lab"
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <div>
                <Label htmlFor="name" className="text-white">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="z.B. Labor Mission"
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="description" className="text-white">Beschreibung</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Beschreibung der Mission..."
                  className="bg-gray-700 border-gray-600 text-white"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="difficulty" className="text-white">Schwierigkeit</Label>
                <Select value={formData.difficulty.toString()} onValueChange={(value) => setFormData({...formData, difficulty: parseInt(value)})}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    <SelectItem value="1">1 - Einfach</SelectItem>
                    <SelectItem value="2">2 - Einfach</SelectItem>
                    <SelectItem value="3">3 - Mittel</SelectItem>
                    <SelectItem value="4">4 - Mittel</SelectItem>
                    <SelectItem value="5">5 - Schwer</SelectItem>
                    <SelectItem value="6">6 - Schwer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="required_level" className="text-white">Erforderliches Level</Label>
                <Input
                  id="required_level"
                  type="number"
                  min="1"
                  value={formData.required_level}
                  onChange={(e) => setFormData({...formData, required_level: parseInt(e.target.value)})}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <div>
                <Label htmlFor="reward_bitcoins" className="text-white">Bitcoin-Belohnung</Label>
                <Input
                  id="reward_bitcoins"
                  type="number"
                  step="0.00000001"
                  min="0"
                  value={parseFloat(formData.reward_bitcoins)}
                  onChange={(e) => setFormData({...formData, reward_bitcoins: e.target.value})}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <div>
                <Label htmlFor="reward_exp" className="text-white">EXP-Belohnung</Label>
                <Input
                  id="reward_exp"
                  type="number"
                  min="0"
                  value={formData.reward_exp}
                  onChange={(e) => setFormData({...formData, reward_exp: parseInt(e.target.value)})}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <div className="col-span-2 flex items-center space-x-2">
                <Switch
                  id="is_available"
                  checked={formData.is_available}
                  onCheckedChange={(checked) => setFormData({...formData, is_available: checked})}
                />
                <Label htmlFor="is_available" className="text-white">Verfügbar</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="text-gray-300 border-gray-600 hover:bg-gray-700 hover:text-white">
                Abbrechen
              </Button>
              <Button onClick={handleCreateMission}>
                Erstellen
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Missionen-Liste */}
      <div className="grid gap-4">
        {missions.map((mission) => (
          <Card key={mission.id} className="bg-gray-800 border-gray-700">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-3">
                  <Target className="h-6 w-6 text-red-400" />
                  <div>
                    <CardTitle className="text-white">{mission.name}</CardTitle>
                    <CardDescription className="text-gray-400">
                      ID: {mission.mission_id} • Level {mission.required_level}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={getDifficultyColor(mission.difficulty)}>
                    <Star className="h-3 w-3 mr-1" />
                    {getDifficultyText(mission.difficulty)}
                  </Badge>
                  {mission.is_available ? (
                    <Badge variant="default" className="bg-green-600">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Verfügbar
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-gray-600">
                      <XCircle className="h-3 w-3 mr-1" />
                      Gesperrt
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mission.description && (
                  <p className="text-gray-300">{mission.description}</p>
                )}
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-1 text-yellow-400">
                    <Coins className="h-4 w-4" />
                    <span>{parseFloat(mission.reward_bitcoins).toFixed(8)} BTC</span>
                  </div>
                  <div className="flex items-center space-x-1 text-blue-400">
                    <Zap className="h-4 w-4" />
                    <span>{mission.reward_exp} EXP</span>
                  </div>
                </div>
                <div className="flex justify-between items-center text-sm text-gray-400">
                  <span>Erstellt: {formatDate(mission.created_at)}</span>
                  <span>Aktualisiert: {formatDate(mission.updated_at)}</span>
                </div>
                <div className="flex justify-end space-x-2">
                  <Dialog open={isEditDialogOpen && editingMission?.id === mission.id} onOpenChange={setIsEditDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(mission)}
                        className="text-gray-300 border-gray-600 hover:bg-gray-700 hover:text-white"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Bearbeiten
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-gray-800 border-gray-700 max-w-2xl">
                      <DialogHeader>
                        <DialogTitle className="text-white">Mission bearbeiten</DialogTitle>
                        <DialogDescription className="text-gray-400">
                          Bearbeite die Mission "{mission.name}"
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="edit_mission_id" className="text-white">Mission-ID</Label>
                          <Input
                            id="edit_mission_id"
                            value={formData.mission_id}
                            onChange={(e) => setFormData({...formData, mission_id: e.target.value})}
                            className="bg-gray-700 border-gray-600 text-white"
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit_name" className="text-white">Name</Label>
                          <Input
                            id="edit_name"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            className="bg-gray-700 border-gray-600 text-white"
                          />
                        </div>
                        <div className="col-span-2">
                          <Label htmlFor="edit_description" className="text-white">Beschreibung</Label>
                          <Textarea
                            id="edit_description"
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                            className="bg-gray-700 border-gray-600 text-white"
                            rows={3}
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit_difficulty" className="text-white">Schwierigkeit</Label>
                          <Select value={formData.difficulty.toString()} onValueChange={(value) => setFormData({...formData, difficulty: parseInt(value)})}>
                            <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-700 border-gray-600">
                              <SelectItem value="1">1 - Einfach</SelectItem>
                              <SelectItem value="2">2 - Einfach</SelectItem>
                              <SelectItem value="3">3 - Mittel</SelectItem>
                              <SelectItem value="4">4 - Mittel</SelectItem>
                              <SelectItem value="5">5 - Schwer</SelectItem>
                              <SelectItem value="6">6 - Schwer</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="edit_required_level" className="text-white">Erforderliches Level</Label>
                          <Input
                            id="edit_required_level"
                            type="number"
                            min="1"
                            value={formData.required_level}
                            onChange={(e) => setFormData({...formData, required_level: parseInt(e.target.value)})}
                            className="bg-gray-700 border-gray-600 text-white"
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit_reward_bitcoins" className="text-white">Bitcoin-Belohnung</Label>
                          <Input
                            id="edit_reward_bitcoins"
                            type="number"
                            step="0.00000001"
                            min="0"
                            value={parseFloat(formData.reward_bitcoins)}
                            onChange={(e) => setFormData({...formData, reward_bitcoins: e.target.value})}
                            className="bg-gray-700 border-gray-600 text-white"
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit_reward_exp" className="text-white">EXP-Belohnung</Label>
                          <Input
                            id="edit_reward_exp"
                            type="number"
                            min="0"
                            value={formData.reward_exp}
                            onChange={(e) => setFormData({...formData, reward_exp: parseInt(e.target.value)})}
                            className="bg-gray-700 border-gray-600 text-white"
                          />
                        </div>
                        <div className="col-span-2 flex items-center space-x-2">
                          <Switch
                            id="edit_is_available"
                            checked={formData.is_available}
                            onCheckedChange={(checked) => setFormData({...formData, is_available: checked})}
                          />
                          <Label htmlFor="edit_is_available" className="text-white">Verfügbar</Label>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="text-gray-300 border-gray-600 hover:bg-gray-700 hover:text-white">
                          Abbrechen
                        </Button>
                        <Button onClick={handleUpdateMission}>
                          Speichern
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-400 border-red-600 hover:bg-red-600 hover:text-white"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Löschen
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-gray-800 border-gray-700">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-white">Mission löschen</AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-400">
                          Möchtest du die Mission "{mission.name}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="text-gray-300 border-gray-600 hover:bg-gray-700 hover:text-white">
                          Abbrechen
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteMission(mission.mission_id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Löschen
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {missions.length === 0 && (
        <div className="text-center py-12">
          <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-300 mb-2">Keine Missionen gefunden</h3>
          <p className="text-gray-400 mb-4">Erstelle deine erste Mission um zu beginnen</p>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Erste Mission erstellen
          </Button>
        </div>
      )}
    </AdminLayout>
  );
} 