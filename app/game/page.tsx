"use client";

import GameLayout from "@/components/game/game-layout"
import { GameProvider } from "@/components/game/game-context"
import IntroStory from "@/components/game/intro-story"
import { useSearchParams } from 'next/navigation'
import { useState, useEffect, Suspense } from 'react'

function GamePageContent() {
  const searchParams = useSearchParams();
  const continueGame = searchParams.get('continue') === 'true';
  const roomId = searchParams.get('room') || 'intro';
  const bitcoins = searchParams.get('bitcoins') || '0';
  const exp = searchParams.get('exp') || '0';
  const level = searchParams.get('level') || '1';
  const mission = searchParams.get('mission');
  
  const [showIntroStory, setShowIntroStory] = useState(false);
  const [introModalCompleted, setIntroModalCompleted] = useState(false);

  return (
    <GameProvider 
      continueGame={continueGame}
      initialRoom={roomId}
      initialBitcoins={parseFloat(bitcoins)}
      initialExp={parseInt(exp)}
      initialLevel={parseInt(level)}
      initialMission={mission}
    >
      <GameLayout onIntroModalComplete={() => setShowIntroStory(true)} />
      {showIntroStory && <IntroStory />}
    </GameProvider>
  )
}

export default function GamePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <GamePageContent />
    </Suspense>
  )
} 