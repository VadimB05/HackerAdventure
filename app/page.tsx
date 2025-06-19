import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-black text-white">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            INTRUSION
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Ein Hacker-Adventure-Spiel
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/game">
              <Button size="lg" className="bg-cyan-600 hover:bg-cyan-700">
                Spiel starten
              </Button>
            </Link>
            <Link href="/auth">
              <Button size="lg" variant="outline" className="border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-black">
                Anmelden
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-cyan-400">🎮 Missionen & Rätsel</CardTitle>
              <CardDescription className="text-gray-300">
                Löse komplexe Hacking-Herausforderungen und durchlaufe verschiedene Missionen
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-cyan-400">💻 Terminal & Tools</CardTitle>
              <CardDescription className="text-gray-300">
                Nutze realistische Terminal-Befehle und Hacking-Tools
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-cyan-400">🏆 Fortschritt & Belohnungen</CardTitle>
              <CardDescription className="text-gray-300">
                Sammle Erfahrungspunkte, Geld und verbessere deine Fähigkeiten
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Game Preview */}
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-8 text-cyan-400">
            Bereit für das Abenteuer?
          </h2>
          <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
            Tauche ein in die Welt des ethischen Hackings. Löse Rätsel, 
            durchlaufe Missionen und werde zum ultimativen Cyber-Sicherheitsexperten.
          </p>
          <Link href="/game">
            <Button size="lg" className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700">
              Jetzt spielen →
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
