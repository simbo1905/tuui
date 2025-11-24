import initSqlJs, { Database, SqlJsStatic } from 'sql.js'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'

export interface SqliteKeyValueStoreOptions {
  filePath: string
  tableName?: string
}

const TABLE_NAME_REGEX = /^[a-z0-9_]+$/i

export class SqliteKeyValueStore {
  private static sqlJsInstance: Promise<SqlJsStatic> | null = null
  private static readonly nodeRequire = createRequire(import.meta.url)

  private readonly filePath: string
  private readonly tableName: string
  private readonly dbPromise: Promise<Database>
  private disposed = false

  constructor({ filePath, tableName = 'kv_store' }: SqliteKeyValueStoreOptions) {
    if (!TABLE_NAME_REGEX.test(tableName)) {
      throw new Error(`Invalid table name "${tableName}" supplied for SqliteKeyValueStore`)
    }

    this.filePath = filePath
    this.tableName = tableName
    this.dbPromise = this.initialize()
  }

  private static resolveWasmPath(file: string) {
    if (file === 'sql-wasm.wasm') {
      return SqliteKeyValueStore.nodeRequire.resolve('sql.js/dist/sql-wasm.wasm')
    }
    return SqliteKeyValueStore.nodeRequire.resolve(`sql.js/dist/${file}`)
  }

  private static async getSqlJs() {
    if (!SqliteKeyValueStore.sqlJsInstance) {
      SqliteKeyValueStore.sqlJsInstance = initSqlJs({
        locateFile: (file) => SqliteKeyValueStore.resolveWasmPath(file)
      })
    }
    return SqliteKeyValueStore.sqlJsInstance
  }

  private async initialize(): Promise<Database> {
    const SQL = await SqliteKeyValueStore.getSqlJs()
    const directory = dirname(this.filePath)
    if (!existsSync(directory)) {
      mkdirSync(directory, { recursive: true })
    }

    const database = existsSync(this.filePath)
      ? new SQL.Database(readFileSync(this.filePath))
      : new SQL.Database()

    database.run(`
      CREATE TABLE IF NOT EXISTS ${this.tableName} (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `)

    if (!existsSync(this.filePath)) {
      this.persist(database)
    }

    return database
  }

  private async withDb<T>(callback: (db: Database) => T | Promise<T>): Promise<T> {
    if (this.disposed) {
      throw new Error('SqliteKeyValueStore has already been disposed')
    }
    const db = await this.dbPromise
    return callback(db)
  }

  private persist(db: Database) {
    const data = db.export()
    writeFileSync(this.filePath, Buffer.from(data))
  }

  async getItem(key: string): Promise<string | null> {
    this.ensureKey(key)
    return this.withDb((db) => {
      const statement = db.prepare(`SELECT value FROM ${this.tableName} WHERE key = ?1`)
      statement.bind([key])
      const result = statement.step() ? (statement.getAsObject().value as string) : null
      statement.free()
      return result ?? null
    })
  }

  async setItem(key: string, value: string): Promise<void> {
    this.ensureKey(key)
    if (typeof value !== 'string') {
      throw new Error('SqliteKeyValueStore.setItem expects value to be a string')
    }
    await this.withDb((db) => {
      db.run(
        `
        INSERT INTO ${this.tableName} (key, value, updated_at)
        VALUES (?1, ?2, ?3)
        ON CONFLICT(key) DO UPDATE SET
          value = excluded.value,
          updated_at = excluded.updated_at
      `,
        [key, value, Date.now()]
      )
      this.persist(db)
    })
  }

  async removeItem(key: string): Promise<void> {
    this.ensureKey(key)
    await this.withDb((db) => {
      db.run(`DELETE FROM ${this.tableName} WHERE key = ?1`, [key])
      this.persist(db)
    })
  }

  async clear(): Promise<void> {
    await this.withDb((db) => {
      db.run(`DELETE FROM ${this.tableName}`)
      this.persist(db)
    })
  }

  async keys(): Promise<string[]> {
    return this.withDb((db) => {
      const statement = db.prepare(`SELECT key FROM ${this.tableName} ORDER BY key ASC`)
      const keys: string[] = []
      while (statement.step()) {
        keys.push(statement.getAsObject().key as string)
      }
      statement.free()
      return keys
    })
  }

  async dispose() {
    if (this.disposed) {
      return
    }
    const db = await this.dbPromise
    db.close()
    this.disposed = true
  }

  private ensureKey(key: string) {
    if (!key || typeof key !== 'string') {
      throw new Error('SqliteKeyValueStore requires a non-empty string key')
    }
  }
}
