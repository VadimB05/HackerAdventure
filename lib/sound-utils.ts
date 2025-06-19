/**
 * Utility functions for sound management with error handling
 */

// Speichert aktive Audio-Objekte
const activeAudios = new Map<string, HTMLAudioElement>()

/**
 * Play a sound with error handling
 */
export function playSound(soundPath: string, volume = 1.0): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const audio = new Audio(soundPath)
      audio.volume = volume

      // Speichere das Audio-Objekt für späteren Zugriff
      activeAudios.set(soundPath, audio)

      audio.addEventListener("ended", () => {
        activeAudios.delete(soundPath)
        resolve()
      })

      audio.addEventListener("error", (e) => {
        activeAudios.delete(soundPath)
        // Stille Behandlung von Audio-Fehlern (z.B. fehlende Dateien)
        console.log(`Audio file not available: ${soundPath}`)
        reject(new Error(`Audio file not available: ${soundPath}`))
      })

      audio.play().catch((err) => {
        activeAudios.delete(soundPath)
        // Stille Behandlung von Playback-Fehlern
        console.log(`Failed to play sound ${soundPath}:`, err.message)
        reject(err)
      })
    } catch (err) {
      console.log("Error setting up audio:", err)
      reject(err)
    }
  })
}

/**
 * Stop a specific sound
 */
export function stopSound(soundPath: string): void {
  const audio = activeAudios.get(soundPath)
  if (audio) {
    audio.pause()
    audio.currentTime = 0
    activeAudios.delete(soundPath)
  }
}

/**
 * Stop all active sounds
 */
export function stopAllSounds(): void {
  activeAudios.forEach((audio, path) => {
    audio.pause()
    audio.currentTime = 0
  })
  activeAudios.clear()
}

/**
 * Check if a specific sound is currently playing
 */
export function isSoundPlaying(soundPath: string): boolean {
  const audio = activeAudios.get(soundPath)
  return audio ? !audio.paused : false
}
