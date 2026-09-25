import { describe, expect, it } from 'vitest'
import { migrateLegacyKeys } from './storage'

function memoryStore(initial: Record<string, string>) {
  const map = new Map(Object.entries(initial))
  return {
    map,
    get length() {
      return map.size
    },
    key: (i: number) => [...map.keys()][i] ?? null,
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
  }
}

describe('migrateLegacyKeys', () => {
  it('moves data saved under the old reTire prefix', () => {
    const store = memoryStore({
      'retire.v1.trips': '[1]',
      'retire.v1.log': '[2]',
      unrelated: 'x',
    })
    expect(migrateLegacyKeys(store)).toBe(2)
    expect(Object.fromEntries(store.map)).toEqual({
      'raytire.v1.trips': '[1]',
      'raytire.v1.log': '[2]',
      unrelated: 'x',
    })
  })

  it('never overwrites a value already written under the new prefix', () => {
    const store = memoryStore({
      'retire.v1.trips': '["old"]',
      'raytire.v1.trips': '["new"]',
    })
    migrateLegacyKeys(store)
    expect(Object.fromEntries(store.map)).toEqual({
      'raytire.v1.trips': '["new"]',
    })
  })

  it('is a no-op on a fresh install', () => {
    const store = memoryStore({})
    expect(migrateLegacyKeys(store)).toBe(0)
    expect(store.map.size).toBe(0)
  })
})
