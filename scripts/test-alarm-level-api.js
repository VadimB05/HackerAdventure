// Test-Script für Alarm-Level-API
// Führe aus mit: node scripts/test-alarm-level-api.js

const BASE_URL = 'http://localhost:3000';

async function testAlarmLevelAPI() {
  console.log('🧪 Teste Alarm-Level-API...\n');

  try {
    // Test 1: Alarm-Level erhöhen
    console.log('1. Erhöhe Alarm-Level...');
    const increaseResponse = await fetch(`${BASE_URL}/api/game/alarm-level`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: 1,
        reason: 'Test: Falscher Befehl im Terminal-Rätsel'
      }),
    });

    const increaseResult = await increaseResponse.json();
    console.log('✅ Erhöhen:', increaseResult);

    // Test 2: Alarm-Level-Daten abrufen
    console.log('\n2. Rufe Alarm-Level-Daten ab...');
    const getResponse = await fetch(`${BASE_URL}/api/game/alarm-level?userId=1`);
    const getResult = await getResponse.json();
    console.log('✅ Abrufen:', getResult);

    // Test 3: Alarm-Level zurücksetzen
    console.log('\n3. Setze Alarm-Level zurück...');
    const resetResponse = await fetch(`${BASE_URL}/api/game/alarm-level`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: 1
      }),
    });

    const resetResult = await resetResponse.json();
    console.log('✅ Zurücksetzen:', resetResult);

    console.log('\n🎉 Alle Tests erfolgreich!');

  } catch (error) {
    console.error('❌ Test fehlgeschlagen:', error);
  }
}

// Nur ausführen wenn direkt aufgerufen
if (require.main === module) {
  testAlarmLevelAPI();
}

module.exports = { testAlarmLevelAPI }; 