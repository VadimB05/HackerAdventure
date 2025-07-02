import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';

// Hilfsfunktion für Zeitfilter
function getDateFilter(timeRange: string, field: string = 'created_at') {
  switch (timeRange) {
    case '7d':
      return `AND ${field} >= DATE_SUB(NOW(), INTERVAL 7 DAY)`;
    case '30d':
      return `AND ${field} >= DATE_SUB(NOW(), INTERVAL 30 DAY)`;
    case '90d':
      return `AND ${field} >= DATE_SUB(NOW(), INTERVAL 90 DAY)`;
    case 'all':
    default:
      return '';
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || 'all';
    const dateFilter = getDateFilter(timeRange, 'created_at');
    const sessionDateFilter = getDateFilter(timeRange, 'session_created_at');

    // Puzzle Analytics
    const puzzleAnalytics = await executeQuery(
      `SELECT * FROM puzzle_analytics` + (dateFilter ? ` WHERE 1=1 ${dateFilter}` : '')
    );

    // Mission Analytics
    const missionAnalytics = await executeQuery(
      `SELECT * FROM mission_analytics` + (dateFilter ? ` WHERE 1=1 ${dateFilter}` : '')
    );

    // Player Analytics
    const playerAnalytics = await executeQuery(
      `SELECT * FROM player_performance_analytics` + (sessionDateFilter ? ` WHERE 1=1 ${sessionDateFilter}` : '')
    );

    // Dashboard-Stats berechnen
    const totalUsers = playerAnalytics.length ?? 0;
    const activeUsers = playerAnalytics.filter((p: any) => p.total_sessions > 0).length ?? 0;
    const totalPuzzles = puzzleAnalytics.length ?? 0;
    const totalMissions = missionAnalytics.length ?? 0;
    const avgPuzzleSuccessRate = puzzleAnalytics.length > 0 ?
      puzzleAnalytics.reduce((sum: number, p: any) => sum + (p.success_rate_percent ?? 0), 0) / puzzleAnalytics.length : 0;
    const avgMissionCompletionRate = missionAnalytics.length > 0 ?
      missionAnalytics.reduce((sum: number, m: any) => sum + (m.completion_rate_percent ?? 0), 0) / missionAnalytics.length : 0;
    const totalPlaytime = playerAnalytics.reduce((sum: number, p: any) => sum + (p.total_playtime_seconds ?? 0), 0) ?? 0;
    const totalBitcoinsEarned = playerAnalytics.reduce((sum: number, p: any) => sum + (p.total_bitcoins_earned ?? 0), 0) ?? 0;

    const dashboardStats = {
      totalUsers: totalUsers ?? 0,
      activeUsers: activeUsers ?? 0,
      totalPuzzles: totalPuzzles ?? 0,
      totalMissions: totalMissions ?? 0,
      avgPuzzleSuccessRate: avgPuzzleSuccessRate ?? 0,
      avgMissionCompletionRate: avgMissionCompletionRate ?? 0,
      totalPlaytime: totalPlaytime ?? 0,
      totalBitcoinsEarned: totalBitcoinsEarned ?? 0
    };

    return NextResponse.json({
      puzzleAnalytics,
      missionAnalytics,
      playerAnalytics,
      dashboardStats
    });
  } catch (error) {
    console.error('Fehler beim Laden der Analytics:', error);
    return NextResponse.json({ success: false, error: 'Fehler beim Laden der Analytics' }, { status: 500 });
  }
} 