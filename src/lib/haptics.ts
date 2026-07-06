// Best-effort tactile feedback on supporting devices. No-op elsewhere.
export function haptic(pattern: number | number[] = 8): void {
  try {
    navigator.vibrate?.(pattern)
  } catch {
    /* ignore */
  }
}
