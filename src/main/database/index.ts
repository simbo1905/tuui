import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'
import { ensureDirSync } from 'fs-extra'

export class DatabaseManager {
  private static instance: DatabaseManager
  private db: Database.Database

  private constructor() {
    try {
      const userDataPath = app.getPath('userData')
      const dbDir = join(userDataPath, 'database')
      ensureDirSync(dbDir)
      const dbPath = join(dbDir, 'storage.sqlite')

      console.log(`Initializing SQLite database at ${dbPath}`)
      this.db = new Database(dbPath)
      this.init()
    } catch (e) {
      console.error('Failed to initialize database', e)
      throw e
    }
  }

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager()
    }
    return DatabaseManager.instance
  }

  private init() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS kv_store (
        key TEXT PRIMARY KEY,
        value TEXT
      )
    `)
  }

  public getItem(key: string): string | null {
    const stmt = this.db.prepare('SELECT value FROM kv_store WHERE key = ?')
    const row = stmt.get(key) as { value: string } | undefined
    return row ? row.value : null
  }

  public setItem(key: string, value: string): void {
    const stmt = this.db.prepare('INSERT OR REPLACE INTO kv_store (key, value) VALUES (?, ?)')
    stmt.run(key, value)
  }

  public removeItem(key: string): void {
    const stmt = this.db.prepare('DELETE FROM kv_store WHERE key = ?')
    stmt.run(key)
  }

  public clear(): void {
    const stmt = this.db.prepare('DELETE FROM kv_store')
    stmt.run()
  }

  public getAllKeys(): string[] {
    const stmt = this.db.prepare('SELECT key FROM kv_store')
    const rows = stmt.all() as { key: string }[]
    return rows.map((r) => r.key)
  }

  public getLength(): number {
    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM kv_store')
    const row = stmt.get() as { count: number }
    return row.count
  }
}
