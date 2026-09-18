/**
 * Everything persists to localStorage. There is no account system and there is
 * not going to be one -- this is a two-person app that runs on two phones.
 */

const PREFIX = 'retire.v1.'

export function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (raw === null) return fallback
    return JSON.parse(raw) as T
  } catch {
    // Private mode, blocked storage, or a value we wrote in an older shape.
    return fallback
  }
}

export function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    // Out of quota or storage denied. Losing a preference is survivable;
    // throwing here would take the whole screen down, which is not.
  }
}

export function removeKey(key: string): void {
  try {
    localStorage.removeItem(PREFIX + key)
  } catch {
    /* see above */
  }
}
