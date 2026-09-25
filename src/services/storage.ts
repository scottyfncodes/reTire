/**
 * Everything persists to localStorage. There is no account system and there is
 * not going to be one -- this is a two-person app that runs on two phones.
 */

const PREFIX = 'raytire.v1.'

/**
 * Keys written before the rename to RayTire. Saved trips, the log and the
 * profile live under this prefix on phones that installed the app earlier, and
 * a rename must not quietly wipe someone's adventure history.
 */
const LEGACY_PREFIX = 'retire.v1.'

type KeyValueStore = Pick<
  Storage,
  'length' | 'key' | 'getItem' | 'setItem' | 'removeItem'
>

/**
 * Copies every legacy key to the current prefix, then removes the original.
 * A value already present under the new prefix wins -- it is the newer write.
 * Returns the number of keys moved.
 */
export function migrateLegacyKeys(store: KeyValueStore): number {
  const legacy: string[] = []
  for (let i = 0; i < store.length; i++) {
    const key = store.key(i)
    if (key !== null && key.startsWith(LEGACY_PREFIX)) legacy.push(key)
  }
  for (const key of legacy) {
    const value = store.getItem(key)
    const target = PREFIX + key.slice(LEGACY_PREFIX.length)
    if (value !== null && store.getItem(target) === null) {
      store.setItem(target, value)
    }
    store.removeItem(key)
  }
  return legacy.length
}

let migrated = false

function storage(): Storage {
  const store = localStorage
  if (!migrated) {
    migrated = true
    try {
      migrateLegacyKeys(store)
    } catch {
      // A failed migration leaves the old keys in place for the next launch.
      migrated = false
    }
  }
  return store
}

export function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = storage().getItem(PREFIX + key)
    if (raw === null) return fallback
    return JSON.parse(raw) as T
  } catch {
    // Private mode, blocked storage, or a value we wrote in an older shape.
    return fallback
  }
}

export function writeJson(key: string, value: unknown): void {
  try {
    storage().setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    // Out of quota or storage denied. Losing a preference is survivable;
    // throwing here would take the whole screen down, which is not.
  }
}

export function removeKey(key: string): void {
  try {
    storage().removeItem(PREFIX + key)
  } catch {
    /* see above */
  }
}
