"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function TestRegisterPage() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password
        }),
      });

      const data = await response.json();
      setResult({
        status: response.status,
        data
      });
    } catch (error) {
      setResult({
        status: 'error',
        data: { error: 'Verbindungsfehler' }
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-black text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Test: Benutzerregistrierung</h1>

        <Card className="bg-gray-800/50 border-gray-700 mb-8">
          <CardHeader>
            <CardTitle>Registrierungsformular</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="username">Benutzername</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                  required
                />
              </div>

              <div>
                <Label htmlFor="email">E-Mail (optional)</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>

              <div>
                <Label htmlFor="password">Passwort</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                  required
                />
              </div>

              <div>
                <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? 'Registrieren...' : 'Registrieren'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {result && (
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle>API-Response</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <strong>Status Code:</strong> {result.status}
                </div>
                
                {result.data.success ? (
                  <Alert className="border-green-500 bg-green-500/10">
                    <AlertDescription className="text-green-300">
                      ✅ Registrierung erfolgreich!
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert className="border-red-500 bg-red-500/10">
                    <AlertDescription className="text-red-300">
                      ❌ {result.data.error}
                    </AlertDescription>
                  </Alert>
                )}

                <div>
                  <strong>Response Data:</strong>
                  <pre className="mt-2 p-4 bg-gray-900 rounded text-sm overflow-auto">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="mt-8 text-center">
          <a href="/auth" className="text-cyan-400 hover:text-cyan-300">
            ← Zurück zur Auth-Seite
          </a>
        </div>
      </div>
    </div>
  );
} 