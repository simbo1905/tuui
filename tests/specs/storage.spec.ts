import { test, expect, beforeAll, afterAll } from '../fixtures.mts'

test.beforeAll(beforeAll)
test.afterAll(afterAll)

test('Storage persistence check', async ({ page, util }) => {
  try {
    const key = 'test-persistence-key'
    const value = 'test-persistence-value'

    // Set item
    await page.evaluate(
      async ({ key, value }) => {
        await window.mainApi.invoke('storage:setItem', key, JSON.stringify(value))
      },
      { key, value }
    )

    // Read item
    const storedValue = await page.evaluate(async (key) => {
      return await window.mainApi.invoke('storage:getItem', key)
    }, key)

    expect(JSON.parse(storedValue)).toBe(value)

    // Reload page to simulate app restart (in terms of renderer)
    await page.reload()

    // Read item again
    const reloadedValue = await page.evaluate(async (key) => {
      return await window.mainApi.invoke('storage:getItem', key)
    }, key)

    expect(JSON.parse(reloadedValue)).toBe(value)

    // Clean up
    await page.evaluate(async (key) => {
      await window.mainApi.invoke('storage:removeItem', key)
    }, key)
  } catch (error) {
    throw await util.onTestError(error)
  }
})
