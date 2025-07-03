'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AdminLayout from '@/components/admin/admin-layout';
import { 
  Users, 
  Building2, 
  Target, 
  DoorOpen, 
  Puzzle, 
  Package, 
  Settings,
  BarChart3,
  Activity
} from 'lucide-react';

interface AdminStats {
  totalUsers: number;
  totalCities: number;
  totalMissions: number;
  totalRooms: number;
  totalPuzzles: number;
  totalItems: number;
}

export default function AdminPage() {
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAdminStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/verify');
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/auth');
        } else if (response.status === 403) {
          router.push('/game');
        } else {
          console.error('Admin check failed:', response.status);
        }
      }
    } catch (error) {
      console.error('Admin check failed:', error);
      router.push('/auth');
    }
  }, [router]);

  const loadAdminStats = useCallback(async () => {
    try {
      // Erst Admin-Status prüfen
      const verifyResponse = await fetch('/api/admin/verify');
      if (!verifyResponse.ok) {
        if (verifyResponse.status === 401) {
          router.push('/auth');
          return;
        } else if (verifyResponse.status === 403) {
          router.push('/game');
          return;
        }
      }

      // Dann Statistiken laden
      const statsResponse = await fetch('/api/admin/health');
      if (statsResponse.ok) {
        const data = await statsResponse.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    // Prüfen ob User Admin ist
    checkAdminStatus();
    // Stats laden
    loadAdminStats();
  }, [checkAdminStatus, loadAdminStats]);

  const navigationItems = [
    { 
      name: 'Dashboard', 
      icon: BarChart3, 
      href: '/admin', 
      description: 'Übersicht über das System' 
    },
    { 
      name: 'Benutzer', 
      icon: Users, 
      href: '/admin/users', 
      description: 'Benutzer verwalten und Admin-Rechte zuweisen' 
    },
    { 
      name: 'Städte', 
      icon: Building2, 
      href: '/admin/cities', 
      description: 'Städte anlegen und verwalten' 
    },
    { 
      name: 'Missionen', 
      icon: Target, 
      href: '/admin/missions', 
      description: 'Missionen erstellen und zuordnen' 
    },
    { 
      name: 'Räume', 
      icon: DoorOpen, 
      href: '/admin/rooms', 
      description: 'Räume anlegen und Objekte positionieren' 
    },
    { 
      name: 'Rätsel', 
      icon: Puzzle, 
      href: '/admin/puzzles', 
      description: 'Rätsel erstellen und konfigurieren' 
    },
    { 
      name: 'Objekte', 
      icon: Package, 
      href: '/admin/objects', 
      description: 'Items und Raum-Objekte verwalten' 
    },
    { 
      name: 'Einstellungen', 
      icon: Settings, 
      href: '/admin/settings', 
      description: 'System-Einstellungen' 
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Admin-Panel wird geladen...</p>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout 
      title="Dashboard" 
      description="Übersicht über das System"
    >
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white">Benutzer</CardTitle>
                <Users className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{stats.totalUsers}</div>
                <p className="text-xs text-gray-400">Registrierte Spieler</p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white">Städte</CardTitle>
                <Building2 className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{stats.totalCities}</div>
                <p className="text-xs text-gray-400">Verfügbare Städte</p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white">Missionen</CardTitle>
                <Target className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{stats.totalMissions}</div>
                <p className="text-xs text-gray-400">Aktive Missionen</p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white">Räume</CardTitle>
                <DoorOpen className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{stats.totalRooms}</div>
                <p className="text-xs text-gray-400">Erstellte Räume</p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white">Rätsel</CardTitle>
                <Puzzle className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{stats.totalPuzzles}</div>
                <p className="text-xs text-gray-400">Aktive Rätsel</p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white">Items</CardTitle>
                <Package className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{stats.totalItems}</div>
                <p className="text-xs text-gray-400">Verfügbare Items</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4 text-white">Schnellaktionen</h2>
          <div className="flex flex-wrap gap-4">
            <Button onClick={() => router.push('/admin/users')}>
              <Users className="h-4 w-4 mr-2" />
              Benutzer verwalten
            </Button>
            <Button variant="outline" className="text-gray-300 border-gray-600 hover:bg-gray-700 hover:text-white" onClick={() => router.push('/admin/cities')}>
              <Building2 className="h-4 w-4 mr-2" />
              Neue Stadt erstellen
            </Button>
            <Button variant="outline" className="text-gray-300 border-gray-600 hover:bg-gray-700 hover:text-white" onClick={() => router.push('/admin/missions')}>
              <Target className="h-4 w-4 mr-2" />
              Mission hinzufügen
            </Button>
          </div>
        </div>
      </AdminLayout>
    );
} 