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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import AdminLayout from '@/components/admin/admin-layout';
import { 
  Building2, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface City {
  id: number;
  city_id: string;
  name: string;
  description: string | null;
  is_available: boolean;
  required_level: number;
  created_at: string;
  updated_at: string;
}

interface CityFormData {
  city_id: string;
  name: string;
  description: string;
  is_available: boolean;
  required_level: number;
}

export default function CitiesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCity, setEditingCity] = useState<City | null>(null);
  const [formData, setFormData] = useState<CityFormData>({
    city_id: '',
    name: '',
    description: '',
    is_available: true,
    required_level: 1
  });

  useEffect(() => {
    loadCities();
  }, []);

  const loadCities = async () => {
    try {
      const response = await fetch('/api/admin/cities');
      if (response.ok) {
        const data = await response.json();
        setCities(data.cities);
      } else {
        toast({
          title: "Fehler",
          description: "Städte konnten nicht geladen werden",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Fehler beim Laden der Städte:', error);
      toast({
        title: "Fehler",
        description: "Städte konnten nicht geladen werden",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCity = async () => {
    try {
      const response = await fetch('/api/admin/cities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        setCities([...cities, data.city]);
        setIsCreateDialogOpen(false);
        resetForm();
        toast({
          title: "Erfolg",
          description: "Stadt erfolgreich erstellt",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Fehler",
          description: error.error || "Stadt konnte nicht erstellt werden",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Fehler beim Erstellen der Stadt:', error);
      toast({
        title: "Fehler",
        description: "Stadt konnte nicht erstellt werden",
        variant: "destructive"
      });
    }
  };

  const handleUpdateCity = async () => {
    if (!editingCity) return;

    try {
      const response = await fetch(`/api/admin/cities/${editingCity.city_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        setCities(cities.map(city => 
          city.id === editingCity.id ? data.city : city
        ));
        setIsEditDialogOpen(false);
        setEditingCity(null);
        resetForm();
        toast({
          title: "Erfolg",
          description: "Stadt erfolgreich aktualisiert",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Fehler",
          description: error.error || "Stadt konnte nicht aktualisiert werden",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Stadt:', error);
      toast({
        title: "Fehler",
        description: "Stadt konnte nicht aktualisiert werden",
        variant: "destructive"
      });
    }
  };

  const handleDeleteCity = async (cityId: string) => {
    try {
      const response = await fetch(`/api/admin/cities/${cityId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setCities(cities.filter(city => city.city_id !== cityId));
        toast({
          title: "Erfolg",
          description: "Stadt erfolgreich gelöscht",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Fehler",
          description: error.error || "Stadt konnte nicht gelöscht werden",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Fehler beim Löschen der Stadt:', error);
      toast({
        title: "Fehler",
        description: "Stadt konnte nicht gelöscht werden",
        variant: "destructive"
      });
    }
  };

  const openEditDialog = (city: City) => {
    setEditingCity(city);
    setFormData({
      city_id: city.city_id,
      name: city.name,
      description: city.description || '',
      is_available: city.is_available,
      required_level: city.required_level
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      city_id: '',
      name: '',
      description: '',
      is_available: true,
      required_level: 1
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
      <AdminLayout title="Städte" description="Städte verwalten und erstellen">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
            <p>Städte werden geladen...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Städte" description="Städte verwalten und erstellen">
      {/* Header mit Aktionen */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Städte-Verwaltung</h1>
          <p className="text-gray-400">Verwalte die verfügbaren Städte im Spiel</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Neue Stadt
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-800 border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white">Neue Stadt erstellen</DialogTitle>
              <DialogDescription className="text-gray-400">
                Erstelle eine neue Stadt für das Spiel
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="city_id" className="text-white">Stadt-ID</Label>
                <Input
                  id="city_id"
                  value={formData.city_id}
                  onChange={(e) => setFormData({...formData, city_id: e.target.value})}
                  placeholder="z.B. city3"
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <div>
                <Label htmlFor="name" className="text-white">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="z.B. Industrial District"
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <div>
                <Label htmlFor="description" className="text-white">Beschreibung</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Beschreibung der Stadt..."
                  className="bg-gray-700 border-gray-600 text-white"
                  rows={3}
                />
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
              <div className="flex items-center space-x-2">
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
              <Button onClick={handleCreateCity}>
                Erstellen
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Städte-Liste */}
      <div className="grid gap-4">
        {cities.map((city) => (
          <Card key={city.id} className="bg-gray-800 border-gray-700">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-3">
                  <Building2 className="h-6 w-6 text-blue-400" />
                  <div>
                    <CardTitle className="text-white">{city.name}</CardTitle>
                    <CardDescription className="text-gray-400">
                      ID: {city.city_id} • Level {city.required_level}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {city.is_available ? (
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
                {city.description && (
                  <p className="text-gray-300">{city.description}</p>
                )}
                <div className="flex justify-between items-center text-sm text-gray-400">
                  <span>Erstellt: {formatDate(city.created_at)}</span>
                  <span>Aktualisiert: {formatDate(city.updated_at)}</span>
                </div>
                <div className="flex justify-end space-x-2">
                  <Dialog open={isEditDialogOpen && editingCity?.id === city.id} onOpenChange={setIsEditDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(city)}
                        className="text-gray-300 border-gray-600 hover:bg-gray-700 hover:text-white"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Bearbeiten
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-gray-800 border-gray-700">
                      <DialogHeader>
                        <DialogTitle className="text-white">Stadt bearbeiten</DialogTitle>
                        <DialogDescription className="text-gray-400">
                          Bearbeite die Stadt "{city.name}"
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="edit_city_id" className="text-white">Stadt-ID</Label>
                          <Input
                            id="edit_city_id"
                            value={formData.city_id}
                            onChange={(e) => setFormData({...formData, city_id: e.target.value})}
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
                        <div>
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
                        <div className="flex items-center space-x-2">
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
                        <Button onClick={handleUpdateCity}>
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
                        <AlertDialogTitle className="text-white">Stadt löschen</AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-400">
                          Möchtest du die Stadt "{city.name}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="text-gray-300 border-gray-600 hover:bg-gray-700 hover:text-white">
                          Abbrechen
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteCity(city.city_id)}
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

      {cities.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-300 mb-2">Keine Städte gefunden</h3>
          <p className="text-gray-400 mb-4">Erstelle deine erste Stadt um zu beginnen</p>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Erste Stadt erstellen
          </Button>
        </div>
      )}
    </AdminLayout>
  );
} 