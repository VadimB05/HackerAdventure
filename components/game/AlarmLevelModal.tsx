import React from 'react';

interface AlarmLevelModalProps {
  isOpen: boolean;
  onClose: () => void;
  alarmLevel: number;
  puzzleName: string;
}

const AlarmLevelModal: React.FC<AlarmLevelModalProps> = ({
  isOpen,
  onClose,
  alarmLevel,
  puzzleName
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100]">
      <div className="bg-gray-900 border-2 border-red-500 rounded-lg p-8 max-w-md mx-4 relative">
        {/* Alarm-Icon */}
        <div className="text-center mb-6">
          <div className="text-red-500 text-6xl mb-4">🚨</div>
          <h2 className="text-2xl font-bold text-red-400 mb-2">ALARM LEVEL ERHÖHT!</h2>
          <div className="text-red-300 text-lg">Level {alarmLevel}/10</div>
        </div>

        {/* Erklärung */}
        <div className="text-gray-300 space-y-4 mb-6">
          <p className="text-center">
            <strong>Achtung!</strong> Du hast die maximalen Versuche im Rätsel 
            <span className="text-yellow-400 font-semibold"> "{puzzleName}" </span>
            erreicht.
          </p>
          
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-4">
            <h3 className="text-red-400 font-semibold mb-2">Was bedeutet das?</h3>
            <ul className="text-sm space-y-1">
              <li>• Dein Alarm-Level ist gestiegen</li>
              <li>• Bei Level 10 kommt das FBI und das Spiel endet</li>
              <li>• Sei vorsichtiger bei deinen nächsten Versuchen</li>
              <li>• Die Versuche wurden zurückgesetzt</li>
            </ul>
          </div>

          <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4">
            <h3 className="text-yellow-400 font-semibold mb-2">Tipp:</h3>
            <p className="text-sm">
              Nutze Hinweise und überlege dir deine Antworten gut, bevor du sie eingibst!
            </p>
          </div>
        </div>

        {/* Button */}
        <div className="text-center">
          <button
            onClick={onClose}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
          >
            Verstanden - Weiter spielen
          </button>
        </div>

        {/* Dekorative Elemente */}
        <div className="absolute top-2 right-2 text-red-500 text-xs">
          ⚠️ WICHTIG
        </div>
        <div className="absolute bottom-2 left-2 text-gray-600 text-xs">
          Spielstand gespeichert
        </div>
      </div>
    </div>
  );
};

export default AlarmLevelModal; 