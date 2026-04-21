import { test, expect } from '@playwright/test'

test.describe('Главная страница', () => {
  test('отображает главную страницу с CTA-кнопкой', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Calendar' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Записаться' }).first()).toBeVisible()
  })

  test('кнопка Записаться ведёт на /book', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: 'Записаться' }).first().click()
    await expect(page).toHaveURL(/.*\/book/)
  })
})
