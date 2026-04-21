import { test, expect } from '@playwright/test'

test.describe('Каталог событий', () => {
  test('отображает карточки типов событий', async ({ page }) => {
    await page.goto('/book')
    await expect(page.getByRole('heading', { name: 'Выберите тип события' })).toBeVisible()
    await expect(page.getByText('Tota')).toBeVisible()
    await expect(page.getByText('Встреча 15 минут')).toBeVisible()
    await expect(page.getByText('Встреча 30 минут')).toBeVisible()
  })

  test('карточка типа события ведёт на страницу бронирования', async ({ page }) => {
    await page.goto('/book')
    await page.getByText('Встреча 15 минут').click()
    await expect(page).toHaveURL(/.*\/book\/meeting-15/)
  })
})

async function bookSlot(page: import('@playwright/test').Page, name: string, email: string) {
  const slotsResponse = page.waitForResponse(
    (resp) => resp.url().includes('/slots') && resp.status() === 200
  )
  await page.goto('/book')
  await page.getByText('Встреча 15 минут').click()
  await expect(page).toHaveURL(/.*\/book\/meeting-15/)
  await expect(page.getByRole('heading', { name: 'Встреча 15 минут' })).toBeVisible()

  await slotsResponse

  await page.waitForSelector('text=Календарь')

  const dayWithSlots = page.locator('[data-testid^="calendar-day-"]').filter({ hasText: /\d+ св\./ }).first()
  await dayWithSlots.click()

  await page.waitForTimeout(500)

  const availableSlots = page.locator('[data-testid="slot-available"]')
  await expect(availableSlots.first()).toBeVisible({ timeout: 10000 })
  await availableSlots.first().click()

  await page.getByRole('button', { name: 'Продолжить' }).first().click()

  await expect(page.getByRole('dialog')).toBeVisible()
  await page.getByLabel('Имя').fill(name)
  await page.getByLabel('Email').fill(email)

  await page.getByRole('button', { name: 'Забронировать' }).click()

  await expect(page.getByText('Встреча забронирована!')).toBeVisible()
}

test.describe('Полный сценарий бронирования', () => {
  test('гость бронирует слот — полный путь от каталога до подтверждения', async ({ page }) => {
    await bookSlot(page, 'Иван Тестов', 'ivan@test.com')
  })

  test('забронированный слот отображается как Занято', async ({ page }) => {
    await bookSlot(page, 'Пётр Проверкин', 'petr@test.com')

    const slotsResponse = page.waitForResponse(
      (resp) => resp.url().includes('/slots') && resp.status() === 200
    )
    await page.goto('/book')
    await page.getByText('Встреча 15 минут').click()
    await slotsResponse
    await page.waitForSelector('text=Календарь')

    const dayWithSlots = page.locator('[data-testid^="calendar-day-"]').filter({ hasText: /\d+ св\./ }).first()
    await dayWithSlots.click()

    await page.waitForTimeout(500)

    const bookedSlots = page.locator('[data-testid="slot-booked"]')
    await expect(bookedSlots.first()).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Админка — просмотр бронирований', () => {
  test('забронированная встреча появляется в админке', async ({ page }) => {
    await bookSlot(page, 'Админ Тест', 'admin@test.com')

    await page.goto('/admin')
    await expect(page.getByText('Admin Dashboard')).toBeVisible()

    await expect(page.getByText('Админ Тест')).toBeVisible()
    await expect(page.getByText('admin@test.com')).toBeVisible()
    await expect(page.getByText('Встреча 15 минут').first()).toBeVisible()
  })
})
