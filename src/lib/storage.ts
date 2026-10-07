/**
 * sessionStorage with an in-memory fallback. Storage can throw (private mode, blocked site data,
 * embedded previews), so every access is wrapped. Nothing here leaves the device.
 */
const memory = new Map<string, string>();

export function readSession(key: string): string | null {
  try {
    const value = window.sessionStorage.getItem(key);
    if (value !== null) return value;
  } catch {
    // fall through to memory
  }
  return memory.get(key) ?? null;
}

export function writeSession(key: string, value: string): void {
  memory.set(key, value);
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    // memory copy is enough for this session
  }
}
