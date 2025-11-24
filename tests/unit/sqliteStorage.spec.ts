import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'

import { SqliteKeyValueStore } from '@/main/storage/sqlite'

describe('SqliteKeyValueStore', () => {
  let tempDir: string
  let store: SqliteKeyValueStore

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'tuui-sqlite-'))
    store = new SqliteKeyValueStore({
      filePath: join(tempDir, 'state.db')
    })
  })

  afterEach(async () => {
    await store?.dispose()
    rmSync(tempDir, { recursive: true, force: true })
  })

  it('persists and retrieves values', async () => {
    await store.setItem('foo', JSON.stringify({ value: 1 }))
    await expect(store.getItem('foo')).resolves.toBe(JSON.stringify({ value: 1 }))
  })

  it('overwrites existing keys on update', async () => {
    await store.setItem('foo', 'first')
    await store.setItem('foo', 'second')
    await expect(store.getItem('foo')).resolves.toBe('second')
  })

  it('removes individual keys', async () => {
    await store.setItem('foo', 'bar')
    await store.removeItem('foo')
    await expect(store.getItem('foo')).resolves.toBeNull()
  })

  it('clears the store', async () => {
    await store.setItem('foo', 'bar')
    await store.setItem('bar', 'baz')
    await store.clear()
    await expect(store.keys()).resolves.toEqual([])
    await expect(store.getItem('foo')).resolves.toBeNull()
  })

  it('lists stored keys in sorted order', async () => {
    await store.setItem('b-key', 'value-b')
    await store.setItem('a-key', 'value-a')
    await expect(store.keys()).resolves.toEqual(['a-key', 'b-key'])
  })
})
