export interface StorageBridge {
  get: (key: string) => Promise<string | null>
  set: (key: string, value: string) => Promise<void>
  delete: (key: string) => Promise<void>
  clear: () => Promise<void>
  keys: () => Promise<string[]>
}
