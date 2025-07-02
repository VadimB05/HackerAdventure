'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import AdminLayout from '@/components/admin/admin-layout';
import { 
  Users, 
  Search, 
  Plus, 
  ArrowLeft,
  Shield,
  User,
  Calendar,
  Activity
} from 'lucide-react';

interface User {
  id: number;
  username: string;
  email: string | null;
  is_admin: boolean;
  is_active: boolean;
  created_at: string;
  last_login: string | null;
}

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [updating, setUpdating] = useState<number | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    // Filtere Benutzer basierend auf Suchbegriff
    const filtered = users.filter(user =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredUsers(filtered);
  }, [users, searchTerm]);

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      } else {
        console.error('Failed to load users');
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAdminStatus = async (userId: number, currentStatus: boolean) => {
    setUpdating(userId);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_admin: !currentStatus
        })
      });

      if (response.ok) {
        // Lokalen State aktualisieren
        setUsers(users.map(user => 
          user.id === userId 
            ? { ...user, is_admin: !currentStatus }
            : user
        ));
      } else {
        console.error('Failed to update admin status');
      }
    } catch (error) {
      console.error('Error updating admin status:', error);
    } finally {
      setUpdating(null);
    }
  };

  const toggleActiveStatus = async (userId: number, currentStatus: boolean) => {
    setUpdating(userId);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_active: !currentStatus
        })
      });

      if (response.ok) {
        // Lokalen State aktualisieren
        setUsers(users.map(user => 
          user.id === userId 
            ? { ...user, is_active: !currentStatus }
            : user
        ));
      } else {
        console.error('Failed to update active status');
      }
    } catch (error) {
      console.error('Error updating active status:', error);
    } finally {
      setUpdating(null);
    }
  };

  const deleteUser = async (userId: number) => {
    if (!confirm('Möchtest du diesen Benutzer wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) {
      return;
    }

    setUpdating(userId);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        // Benutzer aus der Liste entfernen
        setUsers(users.filter(user => user.id !== userId));
      } else {
        console.error('Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
    } finally {
      setUpdating(null);
    }
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Benutzer werden geladen...</p>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout 
      title="Benutzerverwaltung" 
      description="Benutzer verwalten und Admin-Rechte zuweisen"
    >
      <div className="flex justify-between items-center mb-6">
        <Badge variant="secondary">
          {filteredUsers.length} von {users.length} Benutzern
        </Badge>
      </div>
        {/* Search and Filters */}
        <Card className="mb-6 bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center text-white">
              <Search className="h-5 w-5 mr-2" />
              Benutzer suchen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-4">
              <div className="flex-1">
                <Input
                  placeholder="Nach Benutzername oder E-Mail suchen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users List */}
        <div className="grid gap-4">
          {filteredUsers.map((user) => (
            <Card key={user.id} className="hover:shadow-md transition-shadow bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {user.is_admin ? (
                        <Shield className="h-8 w-8 text-red-400" />
                      ) : (
                        <User className="h-8 w-8 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-lg font-semibold text-white">{user.username}</h3>
                        {user.is_admin && (
                          <Badge variant="destructive">Admin</Badge>
                        )}
                        {!user.is_active && (
                          <Badge variant="secondary">Inaktiv</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-400">
                        {user.email || 'Keine E-Mail'}
                      </p>
                      <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                        <span className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          Registriert: {formatDate(user.created_at)}
                        </span>
                        {user.last_login && (
                          <span className="flex items-center">
                            <Activity className="h-3 w-3 mr-1" />
                            Letzter Login: {formatDate(user.last_login)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    {/* Admin Status Toggle */}
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-white">Admin</span>
                      <Switch
                        checked={user.is_admin}
                        onCheckedChange={() => toggleAdminStatus(user.id, user.is_admin)}
                        disabled={updating === user.id}
                      />
                    </div>
                    
                    {/* Active Status Toggle */}
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-white">Aktiv</span>
                      <Switch
                        checked={user.is_active}
                        onCheckedChange={() => toggleActiveStatus(user.id, user.is_active)}
                        disabled={updating === user.id}
                      />
                    </div>
                    
                    {/* Delete Button */}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteUser(user.id)}
                      disabled={updating === user.id}
                    >
                      Löschen
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredUsers.length === 0 && (
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-8 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">
                {searchTerm ? 'Keine Benutzer gefunden' : 'Keine Benutzer vorhanden'}
              </h3>
              <p className="text-gray-400">
                {searchTerm 
                  ? 'Versuche einen anderen Suchbegriff.' 
                  : 'Es sind noch keine Benutzer im System registriert.'
                }
              </p>
            </CardContent>
          </Card>
        )}
      </AdminLayout>
    );
} 