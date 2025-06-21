/**
 * Inventory Service für Frontend-Operationen
 */

export interface InventoryItem {
  id: string;
  name: string;
  type: 'tool' | 'key' | 'document' | 'consumable' | 'equipment' | 'weapon' | 'armor';
  quantity: number;
  description: string;
  rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  value?: number;
  isStackable?: boolean;
  maxStackSize?: number;
  icon?: string;
}

export interface PickItemRequest {
  itemId: string;
  roomId: string;
}

export interface PickItemResponse {
  success: boolean;
  message?: string;
  error?: string;
  item?: InventoryItem;
  inventory?: InventoryItem[];
  count?: number;
}

export interface UseItemRequest {
  itemId: string;
  targetObjectId: string;
  roomId: string;
}

export interface UseItemResponse {
  success: boolean;
  message?: string;
  error?: string;
  inventory?: InventoryItem[];
  unlockedFeatures?: string[];
  newPuzzles?: any[];
  roomChanges?: any;
  itemConsumed?: boolean;
}

/**
 * Item aus einem Raum aufsammeln
 */
export async function pickItem(request: PickItemRequest): Promise<PickItemResponse> {
  try {
    const response = await fetch('/api/game/pick', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(request),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Fehler beim Aufsammeln des Items'
      };
    }

    return {
      success: true,
      message: data.message,
      item: data.item,
      inventory: data.inventory,
      count: data.count
    };
  } catch (error) {
    console.error('Fehler beim Aufsammeln des Items:', error);
    return {
      success: false,
      error: 'Netzwerkfehler beim Aufsammeln des Items'
    };
  }
}

/**
 * Item auf ein Objekt im Raum verwenden (Drag&Drop)
 */
export async function useItem(request: UseItemRequest): Promise<UseItemResponse> {
  try {
    const response = await fetch('/api/game/use-item', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(request),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Fehler beim Verwenden des Items'
      };
    }

    return {
      success: true,
      message: data.message,
      inventory: data.inventory,
      unlockedFeatures: data.unlockedFeatures,
      newPuzzles: data.newPuzzles,
      roomChanges: data.roomChanges,
      itemConsumed: data.itemConsumed
    };
  } catch (error) {
    console.error('Fehler beim Verwenden des Items:', error);
    return {
      success: false,
      error: 'Netzwerkfehler beim Verwenden des Items'
    };
  }
}

/**
 * Spieler-Inventar abrufen
 */
export async function getInventory(): Promise<{
  success: boolean;
  inventory?: InventoryItem[];
  count?: number;
  error?: string;
}> {
  try {
    const response = await fetch('/api/game/inventory', {
      method: 'GET',
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Fehler beim Abrufen des Inventars'
      };
    }

    return {
      success: true,
      inventory: data.inventory,
      count: data.count
    };
  } catch (error) {
    console.error('Fehler beim Abrufen des Inventars:', error);
    return {
      success: false,
      error: 'Netzwerkfehler beim Abrufen des Inventars'
    };
  }
}

/**
 * Items in einem Raum abrufen
 */
export async function getRoomItems(roomId: string): Promise<{
  success: boolean;
  items?: InventoryItem[];
  count?: number;
  error?: string;
}> {
  try {
    const response = await fetch(`/api/game/room?id=${encodeURIComponent(roomId)}&items=true`, {
      method: 'GET',
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Fehler beim Abrufen der Raum-Items'
      };
    }

    return {
      success: true,
      items: data.items || [],
      count: data.items?.length || 0
    };
  } catch (error) {
    console.error('Fehler beim Abrufen der Raum-Items:', error);
    return {
      success: false,
      error: 'Netzwerkfehler beim Abrufen der Raum-Items'
    };
  }
} 