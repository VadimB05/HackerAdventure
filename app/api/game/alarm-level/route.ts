import { NextRequest, NextResponse } from 'next/server';
import { AlarmLevelService } from '@/lib/services/alarm-level-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = parseInt(searchParams.get('userId') || '1');

    const stats = await AlarmLevelService.getPlayerAlarmStats(userId);
    const history = await AlarmLevelService.getAlarmLevelHistory(userId, 10);

    return NextResponse.json({
      success: true,
      stats,
      history
    });
  } catch (error) {
    console.error('Fehler beim Abrufen der Alarm-Level-Daten:', error);
    return NextResponse.json({
      success: false,
      error: 'Fehler beim Abrufen der Alarm-Level-Daten'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, reason, puzzleId, missionId } = body;

    const result = await AlarmLevelService.increaseAlarmLevel(
      userId || 1,
      reason,
      puzzleId,
      missionId
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Fehler beim Erhöhen des Alarm-Levels:', error);
    return NextResponse.json({
      success: false,
      error: 'Fehler beim Erhöhen des Alarm-Levels'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    const result = await AlarmLevelService.resetAlarmLevel(userId || 1);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Fehler beim Zurücksetzen des Alarm-Levels:', error);
    return NextResponse.json({
      success: false,
      error: 'Fehler beim Zurücksetzen des Alarm-Levels'
    }, { status: 500 });
  }
} 