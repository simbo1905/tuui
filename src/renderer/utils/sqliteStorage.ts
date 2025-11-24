import type { StorageBridge } from '@/types/storage'

type PiniaStorage = {
  getItem: (key: string) => Promise<string | null>
  setItem: (key: string, value: string) => Promise<void>
  removeItem: (key: string) => Promise<void>
}

function getBridge(): StorageBridge | undefined {
  return window.storageApi
}

export const sqlitePersistStorage: PiniaStorage = {
  async getItem(key: string) {
    const bridge = getBridge()
    if (!bridge) {
      return null
    }
    return bridge.get(key)
  },
  async setItem(key: string, value: string) {
    const bridge = getBridge()
    if (!bridge) {
      return
    }
    await bridge.set(key, value)
  },
  async removeItem(key: string) {
    const bridge = getBridge()
    if (!bridge) {
      return
    }
    await bridge.delete(key)
  }
}
