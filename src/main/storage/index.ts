import { app, ipcMain } from 'electron'
import { join } from 'path'
import { SqliteKeyValueStore } from './sqlite'

const STORAGE_CHANNELS = {
  get: 'storage:get',
  set: 'storage:set',
  delete: 'storage:delete',
  clear: 'storage:clear',
  keys: 'storage:keys'
} as const

let storageInstance: SqliteKeyValueStore | null = null

function resolveDatabasePath() {
  const dataDir = join(app.getPath('userData'), 'storage')
  return join(dataDir, 'tuui-state.db')
}

export function getStorage(): SqliteKeyValueStore {
  if (!storageInstance) {
    storageInstance = new SqliteKeyValueStore({
      filePath: resolveDatabasePath()
    })
  }
  return storageInstance
}

export function registerStorageHandlers() {
  const store = getStorage()

  ipcMain.handle(STORAGE_CHANNELS.get, (_event, key: string) => {
    return store.getItem(key)
  })

  ipcMain.handle(STORAGE_CHANNELS.set, (_event, key: string, value: string) => {
    store.setItem(key, value)
    return null
  })

  ipcMain.handle(STORAGE_CHANNELS.delete, (_event, key: string) => {
    store.removeItem(key)
    return null
  })

  ipcMain.handle(STORAGE_CHANNELS.clear, () => {
    store.clear()
    return null
  })

  ipcMain.handle(STORAGE_CHANNELS.keys, () => {
    return store.keys()
  })
}

export { STORAGE_CHANNELS }
