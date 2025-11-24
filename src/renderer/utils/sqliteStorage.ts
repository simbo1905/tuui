export const sqliteStorage = {
  getItem: async <T>(key: string): Promise<T | null> => {
    const value = await window.mainApi.invoke('storage:getItem', key)
    if (value === null) return null
    try {
      return JSON.parse(value)
    } catch {
      return value as unknown as T
    }
  },
  setItem: async (key: string, value: any): Promise<void> => {
    const stringValue = JSON.stringify(value)
    return await window.mainApi.invoke('storage:setItem', key, stringValue)
  },
  removeItem: async (key: string): Promise<void> => {
    return await window.mainApi.invoke('storage:removeItem', key)
  },
  clear: async (): Promise<void> => {
    return await window.mainApi.invoke('storage:clear')
  },
  length: async (): Promise<number> => {
    return await window.mainApi.invoke('storage:length')
  },
  keys: async (): Promise<string[]> => {
    return await window.mainApi.invoke('storage:keys')
  },
  key: async (n: number): Promise<string> => {
    const keys = await window.mainApi.invoke('storage:keys')
    return keys[n]
  }
}
