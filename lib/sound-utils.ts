/**
 * Utility function to play sounds with error handling
 */
export function playSound(soundPath: string, volume = 1.0): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const audio = new Audio(soundPath)
      audio.volume = volume

      audio.addEventListener("ended", () => {
        resolve()
      })

      audio.addEventListener("error", (e) => {
        console.error("Audio error:", e)
        reject(e)
      })

      audio.play().catch((err) => {
        console.error(`Failed to play sound ${soundPath}:`, err)
        reject(err)
      })
    } catch (err) {
      console.error("Error setting up audio:", err)
      reject(err)
    }
  })
}
