'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Zap, Eye, Puzzle, Lock, Trophy, Package, MapPin, Coins, DoorOpen, Monitor, MessageSquare, MapPin as MapPinIcon, Server, ArrowRight, CheckCircle } from 'lucide-react';
import SmartphoneOverlay from './smartphone-overlay';
import MessagePopup from './message-popup';
import InventoryBar from './inventory-bar';
import DragDropFeedback from './drag-drop-feedback';
import { pickItem, getRoomItems, useItem, type InventoryItem } from '@/lib/services/inventory-service';
import { changeRoom, getGameProgress } from '@/lib/services/progress-service';
import GuidedMissionModal from './GuidedMissionModal';
import Image from 'next/image';
import { useGameState } from '@/lib/contexts/game-context'
import { AlarmNotifyPopup } from './money-popup';

interface InteractiveObject {
  id: string;
  type: 'puzzle' | 'item' | 'exit' | 'npc';
  name: string;
  description: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isVisible: boolean;
  isInteractable: boolean;
  icon?: string;
  status?: 'completed' | 'locked' | 'available' | 'hidden';
  quantity?: number;
  // Drag-and-Drop Kompatibilität
  compatibleItems?: string[]; // Array von Item-IDs die kompatibel sind
  requiredItems?: string[]; // Array von Item-IDs die benötigt werden
  // Exit-spezifische Felder
  exit_room_id?: string; // Ziel-Raum für Exit-Objekte
  // Puzzle-spezifische Felder
  puzzleId?: string; // Verknüpfung zu Rätsel
}

interface RoomViewProps {
  roomId: string;
  onObjectClick?: (object: InteractiveObject) => void;
  onExitClick?: (exitId: string) => void;
  inventory?: InventoryItem[];
  onItemUse?: (item: InventoryItem, target: InteractiveObject) => void;
  onInventoryUpdate?: (inventory: InventoryItem[]) => void;
  onRoomChange?: (newRoomId: string) => void;
  onUnlockNotification?: (message: string) => void;
}

export default function RoomView({ 
  roomId, 
  onObjectClick, 
  onExitClick, 
  inventory = [],
  onItemUse,
  onInventoryUpdate,
  onRoomChange,
  onUnlockNotification
}: RoomViewProps) {
  const [hoveredObject, setHoveredObject] = useState<string | null>(null);
  const [tooltipData, setTooltipData] = useState<InteractiveObject | null>(null);
  const [isSmartphoneOpen, setIsSmartphoneOpen] = useState(false);
  
  // Popup States
  const [isComputerPopupOpen, setIsComputerPopupOpen] = useState(false);
  const [isDoorPopupOpen, setIsDoorPopupOpen] = useState(false);
  const [isWindowPopupOpen, setIsWindowPopupOpen] = useState(false);

  // Drag-and-Drop States
  const [draggedItem, setDraggedItem] = useState<InventoryItem | null>(null);
  const [dragOverObject, setDragOverObject] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackData, setFeedbackData] = useState<{
    isValid: boolean;
    message: string;
    position: { x: number; y: number };
  } | null>(null);

  // Room Items State
  const [roomItems, setRoomItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUsingItem, setIsUsingItem] = useState(false);

  // Room Change States
  const [availableExits, setAvailableExits] = useState<Array<{
    id: string;
    name: string;
    description: string;
    roomId: string;
    isUnlocked: boolean;
    unlockMessage?: string;
  }>>([]);
  const [isChangingRoom, setIsChangingRoom] = useState(false);
  const [showUnlockNotification, setShowUnlockNotification] = useState(false);
  const [unlockMessage, setUnlockMessage] = useState('');
  const [gameProgress, setGameProgress] = useState<any>(null);

  // Feedback Timer Ref
  const feedbackTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  // Mission Modal State
  const [isMissionModalOpen, setIsMissionModalOpen] = useState(false);
  const [missionCompleted, setMissionCompleted] = useState<boolean | undefined>(undefined);
  const [currentMissionId, setCurrentMissionId] = useState<string>("mission1_crypto_bank");
  const [completedMissions, setCompletedMissions] = useState<Set<string>>(new Set());

  // City Mission Status State
  const [cityMissionStatus, setCityMissionStatus] = useState<{
    allMissionsCompleted: boolean;
    totalMissions: number;
    completedMissions: number;
    missions: Array<{
      missionId: string;
      buildingNumber: number;
      buildingName: string;
      isRequired: boolean;
      isCompleted: boolean;
      completedAt: string | null;
    }>;
  } | null>(null);

  // Room Objects State
  const [roomObjects, setRoomObjects] = useState<InteractiveObject[]>([]);

  // Cleanup Timer beim Unmount
  React.useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current);
      }
    };
  }, []);

  const loadRoomData = useCallback(async () => {
    console.log('[DEBUG] useEffect: room-view.tsx MOUNTED, roomId:', roomId);
    setIsLoadingRoom(true);
    setRoomError(null);
    
    try {
      const response = await fetch(`/api/game/rooms/${roomId}`, {
        credentials: 'include'
      });
      
      console.log('[DEBUG] fetch: /api/game/rooms/', roomId, 'Response:', response);
      
      const data = await response.json();
      
      if (data.success && data.room) {
        setRoomData(data.room);
        console.log('Raum-Daten geladen:', data.room);
        console.log('Background-Pfad:', data.room.background);
      } else {
        setRoomError(data.error || 'Fehler beim Laden des Raums');
        console.error('Fehler beim Laden des Raums:', data.error);
      }
    } catch (error) {
      setRoomError('Netzwerkfehler beim Laden des Raums');
      console.error('Netzwerkfehler beim Laden des Raums:', error);
    } finally {
      setIsLoadingRoom(false);
    }
  }, [roomId]);

  const loadRoomItems = useCallback(async () => {
    try {
      const result = await getRoomItems(roomId);
      if (result.success && result.items) {
        setRoomItems(result.items);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Raum-Items:', error);
    }
  }, [roomId]);

  const loadGameProgress = useCallback(async () => {
    try {
      // TODO: Echte User-ID verwenden
      const userId = 1;
      const result = await getGameProgress(userId);
      if (result.success && result.progress) {
        setGameProgress(result.progress);
        
        // Prüfen ob die erste Mission abgeschlossen ist
        checkMissionCompletion();
      }
    } catch (error) {
      console.error('Fehler beim Laden des Spieler-Fortschritts:', error);
    }
  }, []);

  // Prüfen ob Missionen abgeschlossen sind
  const checkMissionCompletion = async () => {
    try {
      console.log('[DEBUG] checkMissionCompletion: Starte Mission-Progress-Check');
      const response = await fetch('/api/game/progress');
      console.log('[DEBUG] fetch: /api/game/progress Response:', response);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const missionProgress = data.progress.missionProgress;
          console.log('[DEBUG] checkMissionCompletion: Mission-Progress geladen:', missionProgress);
          
          // Sammle alle abgeschlossenen Missionen
          const completed = new Set<string>();
          missionProgress.forEach((m: any) => {
            if (m.isCompleted) {
              completed.add(m.missionId);
              console.log('[DEBUG] checkMissionCompletion: Mission abgeschlossen:', m.missionId);
            }
          });
          
          setCompletedMissions(completed);
          
          // Spezielle Behandlung für Mission 1 (für Kompatibilität)
          const mission1Progress = missionProgress.find((m: any) => m.missionId === 'mission1_crypto_bank');
          if (mission1Progress) {
            setMissionCompleted(mission1Progress.isCompleted);
          } else {
            setMissionCompleted(false);
          }
          
          console.log('[DEBUG] checkMissionCompletion: Completed missions:', Array.from(completed));
        } else {
          console.error('[DEBUG] checkMissionCompletion: API-Fehler:', data.error);
        }
      } else {
        console.error('[DEBUG] checkMissionCompletion: API-Fehler:', response.statusText);
      }
    } catch (error) {
      console.error('[DEBUG] checkMissionCompletion: Netzwerkfehler:', error);
      setMissionCompleted(false);
    }
  };

  // Neue Funktion: Prüfe spezifische Mission-Status
  const checkSpecificMissionStatus = async (missionId: string): Promise<boolean> => {
    try {
      console.log('[DEBUG] checkSpecificMissionStatus: Prüfe Mission:', missionId);
      
      // Direkte Abfrage der Mission-Progress-Daten
      const response = await fetch(`/api/game/progress/mission`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          missionId: missionId,
          stepId: 'check'
        }),
      });
      
      console.log('[DEBUG] fetch: /api/game/progress/mission Response:', response);
      
      const data = await response.json();
      console.log('[DEBUG] checkSpecificMissionStatus: Response:', data);
      
      if (data.success) {
        const isCompleted = data.isCompleted || false;
        console.log('[DEBUG] checkSpecificMissionStatus: Mission abgeschlossen?', isCompleted);
        return isCompleted;
      } else {
        console.error('[DEBUG] checkSpecificMissionStatus: API-Fehler:', data.error);
        return false;
      }
    } catch (error) {
      console.error('[DEBUG] checkSpecificMissionStatus: Netzwerkfehler:', error);
      return false;
    }
  };

  const loadAvailableExits = async () => {
    try {
      // Mock-Exits für jetzt - später aus API laden
      const mockExits = [
        {
          id: 'door_to_living_room',
          name: 'Tür zum Wohnzimmer',
          description: 'Führe zum Wohnzimmer',
          roomId: 'living_room',
          isUnlocked: true,
          unlockMessage: 'Wohnzimmer freigeschaltet!'
        },
        {
          id: 'door_to_kitchen',
          name: 'Tür zur Küche',
          description: 'Führe zur Küche',
          roomId: 'kitchen',
          isUnlocked: false,
          unlockMessage: 'Küche freigeschaltet!'
        }
      ];
      setAvailableExits(mockExits);
    } catch (error) {
      console.error('Fehler beim Laden der verfügbaren Exits:', error);
    }
  };

  const loadCityMissionStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/game/city/${roomId}/missions-status`, {
        credentials: 'include'
      });
      
      console.log('[DEBUG] fetch: /api/game/city/', roomId, '/missions-status Response:', response);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCityMissionStatus(data.status);
        }
      }
    } catch (error) {
      console.error('Fehler beim Laden des City Mission Status:', error);
    }
  }, [roomId]);

  // Raum laden
  useEffect(() => {
    console.log('[DEBUG] useEffect: room-view.tsx MOUNTED, roomId:', roomId);
    loadRoomData();
    loadRoomItems();
    loadGameProgress();
    loadAvailableExits();
    loadCityMissionStatus();
  }, [roomId, loadRoomData, loadRoomItems, loadGameProgress, loadCityMissionStatus]);

  const clearFeedback = () => {
    setShowFeedback(false);
    setFeedbackData(null);
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
      feedbackTimerRef.current = null;
    }
  };

  const showFeedbackWithTimer = (data: {
    isValid: boolean;
    message: string;
    position: { x: number; y: number };
  }) => {
    // Vorheriges Feedback löschen
    clearFeedback();
    
    // Neues Feedback setzen
    setFeedbackData(data);
    setShowFeedback(true);
    
    // Timer für automatisches Ausblenden
    feedbackTimerRef.current = setTimeout(() => {
      clearFeedback();
    }, 2000);
  };

  // Item aufheben Funktion
  const handlePickItem = async (item: InventoryItem, position: { x: number; y: number }) => {
    if (isLoading) return;
    
    setIsLoading(true);
    
    try {
      const result = await pickItem({
        itemId: item.id,
        roomId: roomId
      });

      console.log('[DEBUG] fetch: /api/game/use-item Response:', result);

      if (result.success) {
        // Erfolgreich aufgesammelt
        showFeedbackWithTimer({
          isValid: true,
          message: result.message || `${item.name} aufgesammelt!`,
          position
        });

        // Inventar aktualisieren
        if (result.inventory && onInventoryUpdate) {
          onInventoryUpdate(result.inventory);
        }

        // Item aus Raum-Items entfernen
        setRoomItems(prev => prev.filter(roomItem => roomItem.id !== item.id));

        // Item-Objekt aus Raumobjekten entfernen (falls vorhanden)
        setRoomObjects(prev => prev.filter(obj => obj.id !== item.id));

        // Eventuell Raum-Objekte aktualisieren (falls Item Teil eines Rätsels war)
        // Hier könnte Logik für Rätsel-Entwicklung implementiert werden

      } else {
        // Fehler beim Aufsammeln
        showFeedbackWithTimer({
          isValid: false,
          message: result.error || 'Fehler beim Aufsammeln',
          position
        });
      }
    } catch (error) {
      console.error('Fehler beim Aufsammeln des Items:', error);
      showFeedbackWithTimer({
        isValid: false,
        message: 'Netzwerkfehler beim Aufsammeln',
        position
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Raum-Daten State
  const [roomData, setRoomData] = useState<{
    id: string;
    name: string;
    description: string;
    background: string;
    isLocked: boolean;
    requiredLevel: number;
    missionId: string;
    connections: any;
    objects: any[];
    puzzles: any[];
  } | null>(null);
  const [isLoadingRoom, setIsLoadingRoom] = useState(true);
  const [roomError, setRoomError] = useState<string | null>(null);

  const interactiveObjects = roomData?.objects?.map((obj: any) => {
    // Prüfen ob Objekt Mission-Abschluss erfordert
    const requiresMissionsCompleted = obj.required_missions_completed === true;
    
    // Wenn Mission-Abschluss erforderlich ist, prüfen ob alle Missionen abgeschlossen sind
    let isVisible = true;
    let isInteractable = true;
    
    if (requiresMissionsCompleted) {
      if (cityMissionStatus) {
        // Für Intro-Raum: Prüfe nur die erste Mission
        if (roomId === 'intro') {
          const introMission = cityMissionStatus.missions?.[0];
          isVisible = introMission?.isCompleted || false;
          isInteractable = introMission?.isCompleted || false;
        } else {
          // Für City-Räume: Prüfe alle Missionen
          isVisible = cityMissionStatus.allMissionsCompleted;
          isInteractable = cityMissionStatus.allMissionsCompleted;
        }
      } else {
        // Wenn Status noch nicht geladen ist, verstecken
        isVisible = false;
        isInteractable = false;
      }
    }
    
    return {
      ...obj,
      // Feldzuordnung korrigieren - API gibt 'type' zurück, nicht 'object_type'
      type: obj.type || 'item', // API gibt bereits 'type' zurück
      exit_room_id: obj.exitRoomId || obj.exit_room_id,
      puzzleId: obj.puzzleId, // Puzzle-ID übernehmen
      isVisible: isVisible && obj.isVisible !== false,
      isInteractable: isInteractable && obj.isInteractable !== false
    };
  }) || [];

  // Filter für sichtbare Objekte: Items nur anzeigen, wenn sie in roomItems existieren
  const visibleObjects = interactiveObjects.filter(obj => {
    if (obj.type === 'item') {
      return roomItems.some(item => item.id === obj.id);
    }
    return true;
  });

  // Drag-and-Drop Handler
  const handleDragStart = (item: InventoryItem, event: React.DragEvent) => {
    setDraggedItem(item);
    event.dataTransfer.setData('application/json', JSON.stringify(item));
    event.dataTransfer.effectAllowed = 'copy';
    
    // Visuelles Feedback für das gezogene Item
    if (event.dataTransfer.setDragImage) {
      const dragImage = document.createElement('div');
      dragImage.className = 'bg-black/80 border border-green-500 rounded-lg p-2 text-green-400 text-sm';
      dragImage.textContent = item.name;
      dragImage.style.position = 'absolute';
      dragImage.style.top = '-1000px';
      document.body.appendChild(dragImage);
      event.dataTransfer.setDragImage(dragImage, 0, 0);
      setTimeout(() => document.body.removeChild(dragImage), 0);
    }
  };

  const handleDragEnd = (event: React.DragEvent) => {
    setDraggedItem(null);
    setDragOverObject(null);
  };

  const handleDragOver = (event: React.DragEvent, object: InteractiveObject) => {
    event.preventDefault();
    
    // Prüfen ob das gezogene Item mit diesem Objekt kompatibel ist
    const draggedItemData = event.dataTransfer.getData('application/json');
    if (draggedItemData) {
      try {
        const draggedItem: InventoryItem = JSON.parse(draggedItemData);
        const isCompatible = object.compatibleItems?.includes(draggedItem.id) || false;
        const isRequired = object.requiredItems?.includes(draggedItem.id) || false;
        
        if (isCompatible || isRequired) {
          event.dataTransfer.dropEffect = 'copy';
          setDragOverObject(object.id);
        } else {
          event.dataTransfer.dropEffect = 'none';
          setDragOverObject(null);
        }
      } catch (error) {
        event.dataTransfer.dropEffect = 'none';
        setDragOverObject(null);
      }
    }
  };

  const handleDragLeave = (event: React.DragEvent) => {
    setDragOverObject(null);
  };

  const handleDrop = async (event: React.DragEvent, object: InteractiveObject) => {
    event.preventDefault();
    
    if (isUsingItem) return;
    
    try {
      const itemData = event.dataTransfer.getData('application/json');
      const droppedItem: InventoryItem = JSON.parse(itemData);
      
      // Prüfen ob Item kompatibel ist
      const isCompatible = object.compatibleItems?.includes(droppedItem.id) || false;
      const isRequired = object.requiredItems?.includes(droppedItem.id) || false;
      
      // Position für Feedback berechnen
      const rect = event.currentTarget.getBoundingClientRect();
      const position = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      };
      
      if (isCompatible || isRequired) {
        setIsUsingItem(true);
        
        // API-Aufruf für Item-Verwendung
        const result = await fetch('/api/game/use-item', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            itemId: droppedItem.id,
            targetObjectId: object.id,
            roomId: roomId
          }),
        }).then(res => res.json());

        console.log('[DEBUG] fetch: /api/game/use-item Response:', result);

        if (result.success) {
          // Erfolgreiche Interaktion
          showFeedbackWithTimer({
            isValid: true,
            message: result.message || 'Item erfolgreich verwendet!',
            position
          });
          
          // Inventar aktualisieren (falls Item verbraucht wurde)
          if (result.inventory && onInventoryUpdate) {
            onInventoryUpdate(result.inventory);
          }
          
          // Eventuelle Raum-Änderungen verarbeiten
          if (result.roomChanges) {
            console.log('Raum-Änderungen:', result.roomChanges);
            // Hier könnte die Raum-Ansicht aktualisiert werden
          }
          
          // Eventuelle neue Features freischalten
          if (result.unlockedFeatures) {
            console.log('Neue Features freigeschaltet:', result.unlockedFeatures);
            // Hier könnte das UI neue Funktionen anzeigen
          }
          
          // Eventuelle neue Rätsel anzeigen
          if (result.newPuzzles) {
            console.log('Neue Rätsel verfügbar:', result.newPuzzles);
            // Hier könnten neue Rätsel angezeigt werden
          }
          
          // Item verwenden (Callback)
          onItemUse?.(droppedItem, object);
          
        } else {
          // Fehler bei der Interaktion
          showFeedbackWithTimer({
            isValid: false,
            message: result.error || 'Fehler beim Verwenden des Items',
            position
          });
        }
      } else {
        // Nicht kompatible Interaktion
        showFeedbackWithTimer({
          isValid: false,
          message: 'Item nicht kompatibel',
          position
        });
      }
      
    } catch (error) {
      console.error('Fehler beim Verarbeiten des gedropten Items:', error);
      showFeedbackWithTimer({
        isValid: false,
        message: 'Netzwerkfehler beim Verwenden des Items',
        position: { x: 50, y: 50 }
      });
    } finally {
      setIsUsingItem(false);
      setDraggedItem(null);
      setDragOverObject(null);
    }
  };

  const handleItemUse = (item: InventoryItem, object: InteractiveObject) => {
    // Spezifische Logik für verschiedene Item-Objekt-Kombinationen
    console.log(`Item ${item.name} wird auf ${object.name} verwendet`);
    
    // Beispiel-Logik für verschiedene Kombinationen
    if (object.id === 'computer' && item.id === 'usb_stick') {
      console.log('USB-Stick wird in Computer eingesteckt');
      // Hier könnte ein neues Rätsel oder eine neue Funktion freigeschaltet werden
    } else if (object.id === 'door' && item.id === 'keycard') {
      console.log('Tür wird mit Zugangskarte geöffnet');
      // Tür könnte geöffnet werden
    } else if (object.id === 'smartphone' && item.id === 'energy_drink') {
      console.log('Energy Drink wird konsumiert');
      // Spieler könnte Energie bekommen
    }
  };

  // Objekt-Klick-Handler
  const handleObjectClick = async (object: InteractiveObject) => {
    console.log('Object clicked:', object.id, object.type);

    if (!object.isInteractable) {
      return;
    }

    // Fenster immer Popup öffnen
    if (object.id === 'window') {
      setIsWindowPopupOpen(true);
      return;
    }
    // Smartphone immer Overlay öffnen
    if (object.id === 'smartphone') {
      setIsSmartphoneOpen(true);
      return;
    }

    // Prüfen ob es ein aufhebbares Item ist
    const roomItem = roomItems.find(item => item.id === object.id);
    if (roomItem) {
      // Item aufheben
      const rect = document.querySelector(`[data-object-id="${object.id}"]`)?.getBoundingClientRect();
      const position = rect ? {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      } : { x: 50, y: 50 };
      handlePickItem(roomItem, position);
      return;
    }

    // Prüfen ob es ein Item-Objekt ist (object.type === 'item')
    if (object.type === 'item') {
      console.log('Item object clicked:', object.id);
      
      // Versuche das Item aus roomItems zu finden
      let itemToPick = roomItems.find(item => item.id === object.id);
      
      if (!itemToPick) {
        // Wenn nicht in roomItems gefunden, erstelle ein Mock-Item basierend auf dem Objekt
        itemToPick = {
          id: object.id,
          name: object.name,
          type: 'tool', // Default type
          quantity: 1,
          description: object.description,
          rarity: 'common',
          value: 0
        };
      }
      
      const rect = document.querySelector(`[data-object-id="${object.id}"]`)?.getBoundingClientRect();
      const position = rect ? {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      } : { x: 50, y: 50 };
      
      handlePickItem(itemToPick, position);
      return;
    }
    
    // Exit-Behandlung
    if (object.type === 'exit') {
      // Spezielle Behandlung für Tür im Intro-Raum
      if (object.id === 'door' && roomId === 'intro' && object.exit_room_id) {
        // Direkt zu city1 wechseln
        handleRoomChange('door', object.exit_room_id);
        return;
      }
      
      // Allgemeine Exit-Behandlung für alle Exit-Objekte mit exit_room_id
      if (object.exit_room_id) {
        // Direkt zum Ziel-Raum wechseln
        handleRoomChange(object.id, object.exit_room_id);
        return;
      }
      
      const exit = availableExits.find(e => e.id === object.id);
      if (exit) {
        if (exit.isUnlocked) {
          // Raumwechsel durchführen
          handleRoomChange(exit.id, exit.roomId);
        } else {
          // Exit ist noch gesperrt
          showFeedbackWithTimer({
            isValid: false,
            message: 'Dieser Ausgang ist noch gesperrt',
            position: { x: 50, y: 50 }
          });
        }
      } else {
        // Standard Exit-Behandlung
        onExitClick?.(object.id);
      }
      return;
    }
    
    // Puzzle-Objekte behandeln
    if (object.type === 'puzzle') {
      console.log('[DEBUG] handleObjectClick: Puzzle-Objekt angeklickt:', object.id);
      console.log('[DEBUG] handleObjectClick: Raum-Daten:', roomData);
      
      // Dynamische Mission-Logik: Prüfe ob der aktuelle Raum zu einer Mission gehört
      if (roomData?.missionId) {
        const missionId = roomData.missionId;
        console.log('[DEBUG] handleObjectClick: Mission-ID gefunden:', missionId);
        
        // Spezifische Mission-Status-Prüfung für bessere Genauigkeit
        const isCurrentMissionCompleted = await checkSpecificMissionStatus(missionId);
        console.log('[DEBUG] handleObjectClick: Mission abgeschlossen?', isCurrentMissionCompleted);
        
        if (isCurrentMissionCompleted) {
          const rect = document.querySelector(`[data-object-id="${object.id}"]`)?.getBoundingClientRect();
          const position = rect ? {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
          } : { x: 50, y: 50 };
          showFeedbackWithTimer({
            isValid: true,
            message: 'Hier ist gerade nichts zu tun',
            position: position
          });
        } else {
          setCurrentMissionId(missionId);
          setIsMissionModalOpen(true);
        }
        return;
      }
      
      console.log('[DEBUG] handleObjectClick: Keine Mission-ID gefunden, verwende Standard-Logik');
      // Fallback: Standard-Logik für Räume ohne Mission
      onObjectClick?.(object);
      return;
    }
    
    // Verbinde mit den vorhandenen Komponenten
    switch (object.id) {
      case 'door':
        setIsDoorPopupOpen(true);
        break;
      default:
        onObjectClick?.(object);
    }
  };

  const handleObjectHover = (object: InteractiveObject, event: React.MouseEvent) => {
    setHoveredObject(object.id);
    setTooltipData(object);
  };

  const handleObjectLeave = () => {
    setHoveredObject(null);
    setTooltipData(null);
  };

  // Raumwechsel-Funktion
  const handleRoomChange = async (exitId: string, targetRoomId: string) => {
    if (isChangingRoom) return;
    
    setIsChangingRoom(true);
    
    try {
      // TODO: Echte User-ID verwenden
      const userId = 1;
      const result = await changeRoom(userId, targetRoomId);
      
      if (result.success) {
        // Erfolgreicher Raumwechsel
        onRoomChange?.(targetRoomId);
        
        // Animation und Übergang
        setTimeout(() => {
          setIsChangingRoom(false);
        }, 1000);
      } else {
        // Raumwechsel gesperrt - Objekt rot blinken lassen
        console.log('Raumwechsel gesperrt:', result.error);
        setIsChangingRoom(false);
        
        // Rotes Blinken für das Objekt
        const objectElement = document.querySelector(`[data-object-id="${exitId}"]`);
        if (objectElement) {
          const iconElement = objectElement.querySelector('.bg-black\\/50');
          if (iconElement) {
            iconElement.classList.add('animate-red-blink');
            setTimeout(() => {
              iconElement.classList.remove('animate-red-blink');
            }, 1000);
          }
        }
      }
    } catch (error) {
      console.error('Netzwerkfehler beim Raumwechsel:', error);
      setIsChangingRoom(false);
    }
  };

  // Freischaltungs-Benachrichtigung anzeigen
  const displayUnlockNotification = (message: string) => {
    setUnlockMessage(message);
    setShowUnlockNotification(true);
    
    // Automatisch ausblenden nach 3 Sekunden
    setTimeout(() => {
      setShowUnlockNotification(false);
    }, 3000);
    
    // Callback aufrufen
    onUnlockNotification?.(message);
  };

  // Prüfen ob ein Exit freigeschaltet wurde
  const checkForUnlocks = () => {
    availableExits.forEach(exit => {
      if (exit.isUnlocked && exit.unlockMessage) {
        displayUnlockNotification(exit.unlockMessage);
      }
    });
  };

  // Loading State
  if (isLoadingRoom) {
    return (
      <div className="relative w-full h-full overflow-hidden bg-gray-900 flex items-center justify-center">
        <div className="text-center text-gray-400">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-bold">Lade Raum...</h2>
          <p className="mt-2">Raum wird vorbereitet</p>
        </div>
      </div>
    );
  }

  // Error State
  if (roomError || !roomData) {
    return (
      <div className="relative w-full h-full overflow-hidden bg-gray-900 flex items-center justify-center">
        <div className="text-center text-gray-400">
          <MapPin className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <h2 className="text-xl font-bold text-red-400">Fehler beim Laden des Raums</h2>
          <p className="mt-2">{roomError || 'Unbekannter Fehler'}</p>
          <Button 
            onClick={loadRoomData} 
            className="mt-4 bg-blue-600 hover:bg-blue-700"
          >
            Erneut versuchen
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden bg-gray-900">
      {/* Hintergrundbild */}
      <AnimatePresence mode="wait">
        <motion.div
          key={roomId}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          {roomData.background ? (
            <Image
              src={roomData.background}
              alt={roomData.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <MapPin className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h2 className="text-xl font-bold">{roomData.name}</h2>
                <p className="mt-2">{roomData.description}</p>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Interaktive Objekte */}
      <div className="absolute inset-0">
        {visibleObjects.map((object) => (
          <motion.div
            key={object.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: object.isVisible ? 1 : 0, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.3 }}
            className={`absolute cursor-pointer transition-all duration-200 ${
              object.isInteractable 
                ? 'hover:scale-110 hover:brightness-125' 
                : 'opacity-50 cursor-not-allowed'
            } ${
              dragOverObject === object.id ? 'ring-2 ring-cyan-400 ring-opacity-75' : ''
            }`}
            style={{
              left: `${object.x}%`,
              top: `${object.y}%`,
              width: `${object.width}%`,
              height: `${object.height}%`,
            }}
            data-object-id={object.id}
            onClick={() => handleObjectClick(object)}
            onMouseEnter={(e) => handleObjectHover(object, e)}
            onMouseLeave={handleObjectLeave}
            onDragOver={(e) => handleDragOver(e, object)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, object)}
          >
            {/* Objekt-Icon */}
            <div className={`relative w-full h-full flex items-center justify-center ${
              object.status === 'completed' ? 'text-green-400' :
              object.status === 'locked' ? 'text-red-400' :
              'text-cyan-400'
            }`}>
              <div className={`bg-black/50 backdrop-blur-sm rounded-lg p-2 border border-current/30 hover:bg-black/70 transition-colors ${
                dragOverObject === object.id ? 'bg-cyan-500/20 border-cyan-400 scale-110' : ''
              }`}>
                {object.icon === 'Zap' && <Zap className="h-6 w-6" />}
                {object.icon === 'Eye' && <Eye className="h-6 w-6" />}
                {object.icon === 'Puzzle' && <Puzzle className="h-6 w-6" />}
                {object.icon === 'Lock' && <Lock className="h-6 w-6" />}
                {object.icon === 'Trophy' && <Trophy className="h-6 w-6" />}
                {object.icon === 'Package' && <Package className="h-6 w-6" />}
                {object.icon === 'MapPin' && <MapPin className="h-6 w-6" />}
                {object.icon === 'Coins' && <Coins className="h-6 w-6" />}
                {object.icon === 'DoorOpen' && <DoorOpen className="h-6 w-6" />}
                {object.icon === 'ArrowRight' && <ArrowRight className="h-6 w-6" />}
                {object.icon === 'Home' && <MapPinIcon className="h-6 w-6" />}
                {object.icon === 'Building' && <Server className="h-6 w-6" />}
                {object.icon === 'Monitor' && <Monitor className="h-6 w-6" />}
              </div>
              
              {/* Status-Badge */}
              {object.status === 'completed' && (
                <Badge className="absolute -top-2 -right-2 bg-green-600 text-white text-xs">
                  ✓
                </Badge>
              )}
              
              {/* Step Forward Badge - nur anzeigen wenn alle Missionen abgeschlossen sind */}
              {object.id === 'step_forward' && cityMissionStatus?.allMissionsCompleted && (
                <Badge className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs animate-pulse">
                  →
                </Badge>
              )}
              
              {/* Mission Progress Badge für Step Forward */}
              {object.id === 'step_forward' && cityMissionStatus && !cityMissionStatus.allMissionsCompleted && (
                <Badge className="absolute -top-2 -right-2 bg-gray-600 text-white text-xs">
                  {cityMissionStatus.completedMissions}/{cityMissionStatus.totalMissions}
                </Badge>
              )}
              

              
              {/* Drag-Over Indicator */}
              {dragOverObject === object.id && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="absolute inset-0 bg-cyan-400/20 rounded-lg border-2 border-cyan-400"
                />
              )}
              
              {/* Drop-Zone Indicator */}
              {draggedItem && (object.compatibleItems?.includes(draggedItem.id) || object.requiredItems?.includes(draggedItem.id)) && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="absolute inset-0 bg-green-400/10 rounded-lg border border-green-400/50"
                />
              )}
            </div>
          </motion.div>
        ))}

        {/* Aufhebbare Items im Raum */}
        <AnimatePresence>
          {roomItems.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3 }}
              className="absolute cursor-pointer transition-all duration-200 hover:scale-110 hover:brightness-125"
              style={{
                left: `${Math.random() * 60 + 20}%`, // Zufällige Position
                top: `${Math.random() * 60 + 20}%`,
                width: '8%',
                height: '8%',
              }}
              data-object-id={item.id}
              onClick={() => {
                const rect = document.querySelector(`[data-object-id="${item.id}"]`)?.getBoundingClientRect();
                const position = rect ? {
                  x: rect.left + rect.width / 2,
                  y: rect.top + rect.height / 2
                } : { x: 50, y: 50 };
                handlePickItem(item, position);
              }}
              onMouseEnter={(e) => {
                setHoveredObject(item.id);
                setTooltipData({
                  id: item.id,
                  type: 'item',
                  name: item.name,
                  description: `Klicken um ${item.name} aufzuheben`,
                  x: 0,
                  y: 0,
                  width: 0,
                  height: 0,
                  isVisible: true,
                  isInteractable: true,
                  quantity: item.quantity
                });
              }}
              onMouseLeave={handleObjectLeave}
            >
              <div className="relative w-full h-full flex items-center justify-center">
                <div className="bg-black/50 backdrop-blur-sm rounded-lg p-2 border-2 border-green-500 text-green-400 hover:bg-black/70 transition-colors animate-pulse">
                  <Package className="h-6 w-6" />
                </div>
                
                {/* Quantity Badge */}
                {item.quantity > 1 && (
                  <Badge className="absolute -top-1 -right-1 bg-green-600 text-white text-xs min-w-0 px-1 h-4 leading-none">
                    {item.quantity}
                  </Badge>
                )}
                
                {/* Rarity Indicator */}
                {item.rarity && item.rarity !== 'common' && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-green-400 opacity-80" />
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Inventar-Leiste */}
      <InventoryBar 
        items={inventory}
        onItemDragStart={handleDragStart}
        onItemDragEnd={handleDragEnd}
      />

      {/* Drag-and-Drop Feedback */}
      <DragDropFeedback
        isVisible={showFeedback}
        isValid={feedbackData?.isValid || false}
        message={feedbackData?.message}
        position={feedbackData?.position}
      />

      {/* Loading Overlay */}
      {(isLoading || isUsingItem) && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-black/80 border border-green-500 rounded-lg p-4">
            <div className="text-green-400 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-2"></div>
              <p className="text-sm">
                {isLoading ? 'Item wird aufgesammelt...' : 'Item wird verwendet...'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Notify-Fenster rechts mittig */}
      <AnimatePresence>
        {hoveredObject && tooltipData && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed right-4 bottom-4 z-50 pointer-events-none"
            style={{ maxWidth: '300px' }}
          >
            <Card className="bg-gray-800/95 backdrop-blur-sm border-gray-600 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className={`p-2 rounded-lg ${
                    tooltipData.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                    tooltipData.status === 'locked' ? 'bg-red-500/20 text-red-400' :
                    tooltipData.type === 'item' ? 'bg-green-500/20 text-green-400' :
                    'bg-cyan-500/20 text-cyan-400'
                  }`}>
                    {tooltipData.icon === 'Zap' && <Zap className="h-5 w-5" />}
                    {tooltipData.icon === 'Eye' && <Eye className="h-5 w-5" />}
                    {tooltipData.icon === 'Puzzle' && <Puzzle className="h-5 w-5" />}
                    {tooltipData.icon === 'Lock' && <Lock className="h-5 w-5" />}
                    {tooltipData.icon === 'Trophy' && <Trophy className="h-5 w-5" />}
                    {tooltipData.icon === 'Package' && <Package className="h-5 w-5" />}
                    {tooltipData.icon === 'MapPin' && <MapPin className="h-5 w-5" />}
                    {tooltipData.icon === 'Coins' && <Coins className="h-5 w-5" />}
                    {tooltipData.icon === 'DoorOpen' && <DoorOpen className="h-5 w-5" />}
                    {tooltipData.type === 'item' && <Package className="h-5 w-5" />}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white mb-2 truncate">{tooltipData.name}</h3>
                    <p className="text-sm text-gray-300 leading-relaxed mb-3">{tooltipData.description}</p>
                    
                    {/* Status-Badges */}
                    <div className="flex flex-wrap gap-2">
                      {tooltipData.type === 'puzzle' && (
                        <Badge variant="outline" className="text-xs">
                          {tooltipData.status === 'completed' ? 'Gelöst' : 'Verfügbar'}
                        </Badge>
                      )}
                      {tooltipData.type === 'item' && (
                        <Badge variant="outline" className="text-xs text-green-400 border-green-400">
                          Aufhebbar
                        </Badge>
                      )}
                      {tooltipData.type === 'exit' && (
                        <Badge variant="outline" className="text-xs text-blue-400 border-blue-400">
                          Ausgang
                        </Badge>
                      )}
                      {tooltipData.quantity && tooltipData.quantity > 1 && (
                        <Badge variant="outline" className="text-xs">
                          Menge: {tooltipData.quantity}
                        </Badge>
                      )}
                    </div>
                    
                    {/* Drag-and-Drop Hinweis */}
                    {tooltipData.compatibleItems && tooltipData.compatibleItems.length > 0 && (
                      <div className="mt-2 text-xs text-gray-400">
                        <p>Kompatible Items: {tooltipData.compatibleItems.join(', ')}</p>
                      </div>
                    )}
                    
                    {/* Drag-and-Drop Hinweis für gezogene Items */}
                    {draggedItem && (tooltipData.compatibleItems?.includes(draggedItem.id) || tooltipData.requiredItems?.includes(draggedItem.id)) && (
                      <div className="mt-2 p-2 bg-green-500/10 border border-green-500/30 rounded text-xs text-green-400">
                        <p>✓ {draggedItem.name} kann hier verwendet werden</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fenster-Nachricht-Popup */}
      <MessagePopup
        isOpen={isWindowPopupOpen}
        title="Fenster"
        message="Du hast eine weile aus dem Fenster geschaut, mach dich wieder an die Arbeit"
        onClose={() => setIsWindowPopupOpen(false)}
      />

      {/* Smartphone-Overlay */}
      <SmartphoneOverlay 
        isOpen={isSmartphoneOpen} 
        onClose={() => setIsSmartphoneOpen(false)} 
      />

      {/* Freischaltungs-Benachrichtigung */}
      <AnimatePresence>
        {showUnlockNotification && (
          <motion.div
            initial={{ opacity: 0, y: -100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -100, scale: 0.8 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50"
          >
            <Card className="bg-green-900/90 backdrop-blur-sm border-green-500 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-6 w-6 text-green-400" />
                  <div>
                    <h3 className="font-semibold text-green-400">Neuer Bereich freigeschaltet!</h3>
                    <p className="text-sm text-green-300">{unlockMessage}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Raumwechsel-Animation */}
      <AnimatePresence>
        {isChangingRoom && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          >
            <div className="text-center text-white">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500 mx-auto mb-4"></div>
              <h2 className="text-xl font-bold mb-2">Raumwechsel...</h2>
              <p className="text-gray-300">Lade neuen Bereich</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mission Modal */}
      <GuidedMissionModal
        missionId={currentMissionId}
        isOpen={isMissionModalOpen}
        onClose={() => setIsMissionModalOpen(false)}
        onMissionComplete={async () => {
          setMissionCompleted(true);
          setIsMissionModalOpen(false);
          
          // Mission-Status sofort aktualisieren
          await checkMissionCompletion();
        }}
      />

      <AlarmNotifyPopup />
    </div>
  );
} 