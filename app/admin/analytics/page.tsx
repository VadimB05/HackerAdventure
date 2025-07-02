'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Puzzle, 
  Target, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Download,
  RefreshCw,
  Calendar,
  Filter
} from 'lucide-react';
import AdminLayout from '@/components/admin/admin-layout';

interface PuzzleAnalytics {
  puzzle_id: string;
  name: string;
  puzzle_type: string;
  difficulty: number;
  room_name: string;
  mission_name: string;
  total_interactions: number;
  times_started: number;
  total_attempts: number;
  failed_attempts: number;
  times_solved: number;
  times_skipped: number;
  times_timeout: number;
  hints_used: number;
  times_abandoned: number;
  avg_time_seconds: number;
  unique_users: number;
  success_rate_percent: number;
  created_at?: string;
}

interface MissionAnalytics {
  mission_id: string;
  name: string;
  difficulty: number;
  reward_bitcoins: number;
  reward_exp: number;
  total_interactions: number;
  times_started: number;
  times_completed: number;
  times_abandoned: number;
  times_failed: number;
  unique_users: number;
  avg_time_seconds: number;
  completion_rate_percent: number;
}

interface PlayerAnalytics {
  id: number;
  username: string;
  created_at: string;
  total_sessions: number;
  total_playtime_seconds: number;
  total_puzzles_attempted: number;
  total_puzzles_solved: number;
  total_missions_started: number;
  total_missions_completed: number;
  total_rooms_visited: number;
  total_items_collected: number;
  total_bitcoins_earned: number;
  total_exp_earned: number;
  avg_session_duration_seconds: number;
  puzzle_success_rate_percent: number;
  mission_success_rate_percent: number;
}

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalPuzzles: number;
  totalMissions: number;
  avgPuzzleSuccessRate: number;
  avgMissionCompletionRate: number;
  totalPlaytime: number;
  totalBitcoinsEarned: number;
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [puzzleAnalytics, setPuzzleAnalytics] = useState<PuzzleAnalytics[]>([]);
  const [missionAnalytics, setMissionAnalytics] = useState<MissionAnalytics[]>([]);
  const [playerAnalytics, setPlayerAnalytics] = useState<PlayerAnalytics[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [timeRange, setTimeRange] = useState('7d'); // 7d, 30d, 90d, all
  const [activeTab, setActiveTab] = useState('overview');

  // Analytics laden
  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/analytics?timeRange=${timeRange}`, {
        headers: {
          'x-user-info': encodeURIComponent(JSON.stringify({ isAdmin: true }))
        }
      });

      if (!response.ok) {
        throw new Error('Fehler beim Laden der Analytics');
      }

      const data = await response.json();
      setPuzzleAnalytics(data.puzzleAnalytics || []);
      setMissionAnalytics(data.missionAnalytics || []);
      setPlayerAnalytics(data.playerAnalytics || []);
      setDashboardStats(data.dashboardStats || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  // Hilfsfunktionen für Formatierung
  const formatTime = (seconds: number) => {
    if (!seconds) return '0s';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  };

  const formatBitcoins = (btc: number) => {
    return `${btc.toFixed(8)} BTC`;
  };

  const getDifficultyColor = (difficulty: number) => {
    const colors = {
      1: 'bg-green-100 text-green-800',
      2: 'bg-blue-100 text-blue-800',
      3: 'bg-yellow-100 text-yellow-800',
      4: 'bg-orange-100 text-orange-800',
      5: 'bg-red-100 text-red-800',
      6: 'bg-purple-100 text-purple-800'
    };
    return colors[difficulty as keyof typeof colors] || colors[1];
  };

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600';
    if (rate >= 60) return 'text-yellow-600';
    if (rate >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <AdminLayout title="Analytics">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2">Lade Analytics...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Analytics">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Analytics & Statistiken</h1>
            <p className="text-gray-600">Spielmetriken und Performance-Analysen</p>
          </div>
          <div className="flex gap-2">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="p-2 border border-gray-300 rounded-md"
            >
              <option value="7d">Letzte 7 Tage</option>
              <option value="30d">Letzte 30 Tage</option>
              <option value="90d">Letzte 90 Tage</option>
              <option value="all">Alle Zeit</option>
            </select>
            <Button onClick={loadAnalytics} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Aktualisieren
            </Button>
          </div>
        </div>

        {/* Dashboard Stats */}
        {dashboardStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Aktive Spieler</p>
                    <p className="text-2xl font-bold">{dashboardStats.activeUsers}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Rätsel-Erfolgsrate</p>
                    <p className="text-2xl font-bold">{(dashboardStats.avgPuzzleSuccessRate ?? 0).toFixed(1)}%</p>
                  </div>
                  <Puzzle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Mission-Abschlussrate</p>
                    <p className="text-2xl font-bold">{(dashboardStats.avgMissionCompletionRate ?? 0).toFixed(1)}%</p>
                  </div>
                  <Target className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Gesamt-Spielzeit</p>
                    <p className="text-2xl font-bold">{formatTime(dashboardStats.totalPlaytime ?? 0)}</p>
                  </div>
                  <Clock className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Übersicht</TabsTrigger>
            <TabsTrigger value="puzzles">Rätsel-Analytics</TabsTrigger>
            <TabsTrigger value="missions">Mission-Analytics</TabsTrigger>
            <TabsTrigger value="players">Spieler-Analytics</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Problem-Rätsel */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    Problem-Rätsel
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {puzzleAnalytics
                      .filter(p => p.success_rate_percent < 50)
                      .slice(0, 5)
                      .map(puzzle => (
                        <div key={puzzle.puzzle_id + '-' + (puzzle.created_at ?? '')} className="flex justify-between items-center p-3 analytics-problem-bg rounded-lg hover:analytics-problem-hover">
                          <div>
                            <p className="font-medium">{puzzle.name}</p>
                            <p className="text-sm text-gray-600">{puzzle.room_name}</p>
                          </div>
                          <div className="text-right">
                            <p className={`font-bold ${getSuccessRateColor(puzzle.success_rate_percent)}`}>
                              {puzzle.success_rate_percent}%
                            </p>
                            <p className="text-sm text-gray-600">{puzzle.failed_attempts} Fehler</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              {/* Top Erfolgs-Rätsel */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    Erfolgs-Rätsel
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {puzzleAnalytics
                      .filter(p => p.success_rate_percent > 80)
                      .slice(0, 5)
                      .map(puzzle => (
                        <div key={puzzle.puzzle_id + '-' + (puzzle.created_at ?? '')} className="flex justify-between items-center p-3 analytics-success-bg rounded-lg hover:analytics-success-hover">
                          <div>
                            <p className="font-medium">{puzzle.name}</p>
                            <p className="text-sm text-gray-600">{puzzle.room_name}</p>
                          </div>
                          <div className="text-right">
                            <p className={`font-bold ${getSuccessRateColor(puzzle.success_rate_percent)}`}>
                              {puzzle.success_rate_percent}%
                            </p>
                            <p className="text-sm text-gray-600">{puzzle.times_solved} gelöst</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Puzzles Tab */}
          <TabsContent value="puzzles" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Rätsel-Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Rätsel</th>
                        <th className="text-left p-2">Typ</th>
                        <th className="text-left p-2">Schwierigkeit</th>
                        <th className="text-left p-2">Erfolgsrate</th>
                        <th className="text-left p-2">Versuche</th>
                        <th className="text-left p-2">Fehler</th>
                        <th className="text-left p-2">Gelöst</th>
                        <th className="text-left p-2">Ø Zeit</th>
                        <th className="text-left p-2">Hinweise</th>
                      </tr>
                    </thead>
                    <tbody>
                      {puzzleAnalytics.map(puzzle => (
                        <tr key={puzzle.puzzle_id + '-' + (puzzle.created_at ?? '')} className="border-b hover:analytics-table-hover">
                          <td className="p-2">
                            <div>
                              <div className="font-medium">{puzzle.name}</div>
                              <div className="text-sm text-gray-600">{puzzle.room_name}</div>
                            </div>
                          </td>
                          <td className="p-2">
                            <Badge variant="outline" className="capitalize">
                              {puzzle.puzzle_type.replace('_', ' ')}
                            </Badge>
                          </td>
                          <td className="p-2">
                            <Badge className={getDifficultyColor(puzzle.difficulty)}>
                              {puzzle.difficulty}
                            </Badge>
                          </td>
                          <td className="p-2">
                            <span className={`font-bold ${getSuccessRateColor(puzzle.success_rate_percent)}`}>
                              {puzzle.success_rate_percent}%
                            </span>
                          </td>
                          <td className="p-2">{puzzle.total_attempts}</td>
                          <td className="p-2 text-red-600">{puzzle.failed_attempts}</td>
                          <td className="p-2 text-green-600">{puzzle.times_solved}</td>
                          <td className="p-2">{formatTime(puzzle.avg_time_seconds || 0)}</td>
                          <td className="p-2">{puzzle.hints_used}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Missions Tab */}
          <TabsContent value="missions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Mission-Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Mission</th>
                        <th className="text-left p-2">Schwierigkeit</th>
                        <th className="text-left p-2">Abschlussrate</th>
                        <th className="text-left p-2">Gestartet</th>
                        <th className="text-left p-2">Abgeschlossen</th>
                        <th className="text-left p-2">Abgebrochen</th>
                        <th className="text-left p-2">Ø Zeit</th>
                        <th className="text-left p-2">Belohnung</th>
                      </tr>
                    </thead>
                    <tbody>
                      {missionAnalytics.map(mission => (
                        <tr key={mission.mission_id} className="border-b hover:analytics-table-hover">
                          <td className="p-2">
                            <div className="font-medium">{mission.name}</div>
                          </td>
                          <td className="p-2">
                            <Badge className={getDifficultyColor(mission.difficulty)}>
                              {mission.difficulty}
                            </Badge>
                          </td>
                          <td className="p-2">
                            <span className={`font-bold ${getSuccessRateColor(mission.completion_rate_percent)}`}>
                              {mission.completion_rate_percent}%
                            </span>
                          </td>
                          <td className="p-2">{mission.times_started}</td>
                          <td className="p-2 text-green-600">{mission.times_completed}</td>
                          <td className="p-2 text-red-600">{mission.times_abandoned}</td>
                          <td className="p-2">{formatTime(mission.avg_time_seconds || 0)}</td>
                          <td className="p-2">
                            <div className="text-sm">
                              <div>{formatBitcoins(mission.reward_bitcoins)}</div>
                              <div>{mission.reward_exp} XP</div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Players Tab */}
          <TabsContent value="players" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Spieler-Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Spieler</th>
                        <th className="text-left p-2">Sessions</th>
                        <th className="text-left p-2">Spielzeit</th>
                        <th className="text-left p-2">Rätsel-Erfolg</th>
                        <th className="text-left p-2">Mission-Erfolg</th>
                        <th className="text-left p-2">Gelöste Rätsel</th>
                        <th className="text-left p-2">Abgeschlossene Missionen</th>
                        <th className="text-left p-2">Verdiente BTC</th>
                      </tr>
                    </thead>
                    <tbody>
                      {playerAnalytics.map(player => (
                        <tr key={player.id} className="border-b hover:analytics-table-hover">
                          <td className="p-2">
                            <div className="font-medium">{player.username}</div>
                            <div className="text-sm text-gray-600">
                              Seit {new Date(player.created_at).toLocaleDateString('de-DE')}
                            </div>
                          </td>
                          <td className="p-2">{player.total_sessions}</td>
                          <td className="p-2">{formatTime(player.total_playtime_seconds || 0)}</td>
                          <td className="p-2">
                            <span className={`font-bold ${getSuccessRateColor(player.puzzle_success_rate_percent)}`}>
                              {player.puzzle_success_rate_percent}%
                            </span>
                          </td>
                          <td className="p-2">
                            <span className={`font-bold ${getSuccessRateColor(player.mission_success_rate_percent)}`}>
                              {player.mission_success_rate_percent}%
                            </span>
                          </td>
                          <td className="p-2">{player.total_puzzles_solved}</td>
                          <td className="p-2">{player.total_missions_completed}</td>
                          <td className="p-2">{formatBitcoins(player.total_bitcoins_earned)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <style jsx global>{`
        .analytics-problem-bg {
          background-color: transparent !important;
          transition: background 0.2s;
        }
        .analytics-success-bg {
          background-color: transparent !important;
          transition: background 0.2s;
        }
        .analytics-problem-hover:hover {
          background-color: transparent !important;
        }
        .analytics-success-hover:hover {
          background-color: transparent !important;
        }
        .analytics-table-hover:hover {
          background-color:rgba(248, 249, 250, 0.13) !important;
        }
      `}</style>
    </AdminLayout>
  );
} 