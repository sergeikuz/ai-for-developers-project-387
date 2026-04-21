# Calendar Booking App / Приложение для бронирования встреч

Приложение для онлайн-бронирования встреч. Дизайн-первый подход с TypeSpec как единым источником истины для API.

[![ci-tests](https://github.com/sergeikuz/ai-for-developers-project-387/actions/workflows/ci-tests.yml/badge.svg)](https://github.com/sergeikuz/ai-for-developers-project-387/actions/workflows/ci-tests.yml)
[![hexlet-check](https://github.com/sergeikuz/ai-for-developers-project-387/actions/workflows/hexlet-check.yml/badge.svg)](https://github.com/sergeikuz/ai-for-developers-project-387/actions/workflows/hexlet-check.yml)
[![lighthouse-nightly](https://github.com/sergeikuz/ai-for-developers-project-387/actions/workflows/lighthouse-nightly.yml/badge.svg)](https://github.com/sergeikuz/ai-for-developers-project-387/actions/workflows/lighthouse-nightly.yml)

## Stack

- **Frontend:** React 19 + TypeScript + Vite + Mantine + React Query + React Router + dayjs
- **Backend:** FastAPI (Python) + Pydantic + Uvicorn on port **4010**
- **API contract:** TypeSpec → OpenAPI → generated TS client (`openapi-typescript-codegen --client fetch`)
- **Mock:** Prism on port **4010** (use when backend is not running)
- **E2E tests:** Playwright (Chromium)

<details>
<summary><b>Подробнее о Vite</b></summary>

**Vite** — сборщик и dev-сервер для фронтенда. Быстрее Webpack благодаря нативным ES-модулям и esbuild.

### Как устроен в проекте

- **Конфиг** — `vite.config.ts` (7 строк, плагин `@vitejs/plugin-react`)
- **Dev-сервер** — `make dev` → `vite` на `localhost:5173` с HMR
- **Сборка** — `make build` → `tsc -b && vite build` → `dist/`
- **Переменные окружения** — `.env` с префиксом `VITE_`, доступны через `import.meta.env.VITE_API_URL`

### Архитектура

```
Разработка (vite dev)
├── Браузер запрашивает index.html
├── Vite отдаёт HTML с <script type="module">
├── Браузер запрашивает src/main.tsx
├── Vite транслирует TSX → JS на лету (esbuild)
├── Браузер запрашивает зависимости (react, mantine...)
├── Vite отдаёт их из node_modules/.vite (pre-bundled)
└── HMR: при изменении файла — только этот модуль обновляется

Продакшен (vite build)
├── Rollup бандлит всё приложение
├── esbuild минифицирует JS/CSS
├── Код-сплиттинг по динамическим импортам
├── Хеш-файлы для кэширования (main-abc123.js)
└── Вывод в dist/
```

</details>

<details>
<summary><b>Подробнее о Mantine</b></summary>

**Mantine** — UI-библиотека для React с 100+ компонентами, хуками и системой тем.

### Используемые пакеты

| Пакет | Версия | Для чего |
|---|---|---|
| `@mantine/core` | ^8.3.0 | Компоненты (Button, Card, Table, Modal, Tabs, TextInput...) |
| `@mantine/form` | ^8.3.0 | Валидация форм (`useForm` + `getInputProps`) |
| `@mantine/notifications` | ^8.3.0 | Тосты (`notifications.show({ title, message })`) |
| `@mantine/dates` | ^8.3.0 | ❌ Установлен, но не используется (календарь на dayjs) |
| `@mantine/hooks` | ^8.3.0 | ❌ Установлен, но не используется (raw `useState`) |

### Инициализация

```tsx
// main.tsx
const theme = createTheme({
  primaryColor: 'violet',
  fontFamily: 'system-ui, -apple-system, sans-serif',
})

<MantineProvider theme={theme}>
  <Notifications position="top-right" />
  <App />
</MantineProvider>
```

### Формы — `@mantine/form`

```tsx
const form = useForm({
  initialValues: { guestName: '', guestEmail: '' },
  validate: {
    guestName: (val) => (val.length > 0 ? null : 'Имя обязательно'),
    guestEmail: (val) => (/^\S+@\S+$/.test(val) ? null : 'Некорректный email'),
  },
})

<TextInput label="Имя" {...form.getInputProps('guestName')} />
<form onSubmit={form.onSubmit((values) => { ... })}>
```

### Стилизация

Проект использует два подхода одновременно:

- **Mantine shorthand props** — `gap`, `mb`, `c`, `fw`, `size`, `padding`
- **Inline стили** — `style={{ background: 'linear-gradient(...)', ... }}` для кастомного дизайна

### Адаптивность

```tsx
<SimpleGrid cols={{ base: 1, sm: 2 }}>  {/* 1 колонка mobile, 2 desktop */}
<Group wrap="nowrap" visibleFrom="sm">  {/* только десктоп */}
<Stack hiddenFrom="sm">                 {/* только мобильные */}
```

### Интеграция с React Router

```tsx
<Button component={Link} to="/book">Забронировать</Button>
<Card component={Link} to={`/book/${et.id}`}>...</Card>
```

</details>

<details>
<summary><b>Подробнее о Prism</b></summary>

**Prism** (от Stoplight) — HTTP-мокирующий сервер, который читает OpenAPI-спецификацию и автоматически создаёт mock-эндпоинты. Фронтенд работает с ним, пока реальный бэкенд ещё не написан.

### Как устроен в проекте

- **Установка** — `@stoplight/prism-cli` в `devDependencies`
- **Запуск** — `make mock` → `prism mock typespec/tsp-output/openapi/openapi.yaml`
- **Порт** — 4010 (тот же, что у FastAPI — одновременно не запускаются)
- **Подключение** — `.env` → `VITE_API_URL=http://localhost:4010`

### Когда используется

| Сценарий | Что запускается | Порт |
|---|---|---|
| Разработка фронтенда без бэкенда | `make mock` (Prism) | 4010 |
| Полная разработка | `make backend-dev` (FastAPI) | 4010 |
| E2E-тесты | FastAPI (в playwright.config.ts) | 4010 |

### Как Prism понимает, что возвращать

Prism читает `openapi.yaml` и использует:

1. **Схемы** (`schema`) — знает структуру ответа
2. **Примеры** (`examples`) — возвращает конкретные данные из спецификации
3. **Статус-коды** (`responses`) — может вернуть 200, 400, 404, 409

Если в спецификации нет `examples`, Prism генерирует данные на основе схемы.

### Преимущества в Design First подходе

```
1. Вы пишете TypeSpec (контракт)
2. Компилируете → openapi.yaml
3. Запускаете Prism → фронтенд работает
4. Параллельно пишете бэкенд
5. Когда бэкенд готов — переключаетесь на него
```

**Без Prism:** фронтенд ждёт, пока бэкенд будет готов.
**С Prism:** фронтенд и бэкенд разрабатываются параллельно.

### Ограничения

| Ограничение | Описание |
|---|---|
| Нет состояния | Каждый запрос независим — POST не сохраняет данные |
| Нет бизнес-логики | Не проверяет двойное бронирование, валидацию дат |
| Статические примеры | Возвращает то, что в `examples` |
| Нет авторизации | Не проверяет токены, роли |

Prism — заглушка для разработки, не замена бэкенду.

</details>

## Commands

```bash
make install          # npm install (root + typespec/) + uv sync (backend)
make dev              # Vite dev server
make build            # tsc -b && vite build (typecheck first)
make lint             # eslint .
make typecheck        # tsc -b --noEmit (typecheck without build)
make typespec         # cd typespec && npx tsp compile main.tsp
make api-gen          # regenerate TS client from openapi.yaml
make typespec-gen     # typespec + api-gen (full regeneration)
make mock             # prism mock on port 4010
make backend-install  # uv sync (backend dependencies)
make backend-dev      # start FastAPI backend on port 4010
make backend-test     # run backend pytest tests
make e2e-test         # run Playwright E2E tests (starts dev + backend automatically)
make e2e-install      # install Playwright browsers (chromium)
make test             # run all tests (lint + backend + e2e)
make lighthouse-install  # install Lighthouse CLI globally
make lighthouse-audit    # build + run Lighthouse audit on 3 pages
make clean            # removes node_modules, dist, tsp-output, src/api/generated, lighthouse-reports, backend caches
make docker-build     # build Docker image
make docker-run       # run Docker container on port 4010
```

## CI

Проект использует GitHub Actions для автоматической проверки:

| Workflow | Описание |
|---|---|
| [ci-tests.yml](.github/workflows/ci-tests.yml) | Полный CI: линт, тайпчек, сборка, backend pytest, Playwright E2E |
| [lighthouse-nightly.yml](.github/workflows/lighthouse-nightly.yml) | Ночной Lighthouse-аудит: сборка, запуск backend, проверка 3 страниц, авто-создание issue при проблемах |
| [hexlet-check.yml](.github/workflows/hexlet-check.yml) | Автоматическая проверка Hexlet |

Тесты запускаются на каждый push и pull request в `main`/`master`. Статус доступен во вкладке **Actions** репозитория.

### Тесты

**Backend (pytest):**
- CRUD типов событий (создание, чтение, обновление, удаление)
- Генерация и валидация слотов (рабочие часы, будни)
- Бронирование (создание, дубликаты, прошедшие даты, окно доступности)
- Контрактные тесты (соответствие TypeSpec спецификации)

**E2E (Playwright):**

- Главная страница: отображение CTA, навигация на /book
- Каталог событий: карточки типов событий, переход на бронирование
- Полный путь бронирования: выбор типа → дата → слот → форма → подтверждение
- Забронированный слот отображается как "Занято"
- Админка: бронирование появляется в таблице

### Lighthouse Nightly Audit

Ежедневно в 2:00 UTC (также доступен ручной запуск):
- Собирает production-версию фронтенда
- Запускает backend и проверяет 3 ключевые страницы через Lighthouse CLI
- Проверяет пороги: Performance ≥ 70, Accessibility ≥ 90, Best Practices ≥ 90, SEO ≥ 90
- При обнаружении проблем создаёт GitHub issue с таблицей метрик
- HTML-отчёты сохраняются как артефакты на 30 дней

**Локальный запуск:**
```bash
make lighthouse-install   # установка Lighthouse CLI
make lighthouse-audit     # сборка + аудит → отчёты в lighthouse-reports/
```

## Architecture

```
src/
  api/
    generated/        # auto-generated from OpenAPI — never edit
    hooks.ts          # React Query wrappers — all components use these
    index.ts          # re-exports + OpenAPI.BASE config
  components/
    Layout.tsx        # Simple top navbar with Calendar logo + nav links
  pages/
    HomePage.tsx          # / — landing page
    EventCatalogPage.tsx  # /book — host profile + event type cards
    BookingPage.tsx       # /book/:id — 3-column: info panel, calendar grid, slot status
    AdminPage.tsx         # /admin — tabbed dashboard
    AdminBookingsPage.tsx     # bookings table
    AdminEventTypesPage.tsx   # event types CRUD
  main.tsx            # entry: BrowserRouter + QueryClient + MantineProvider
  App.tsx             # Routes definition

backend/
  main.py             # FastAPI app factory + all endpoints + business logic
  models.py           # Pydantic models (matches TypeSpec contract)
  store.py            # In-memory storage + seed data
  test_main.py        # Pytest tests (functional + contract compliance)
  pyproject.toml      # uv project config

e2e/
  home.spec.ts        # Playwright E2E tests — home page
  booking.spec.ts     # Playwright E2E tests — booking flow + admin

typespec/
  main.tsp            # API contract (single source of truth)
```

### Data Flow

```
Pages → Hooks → api/index.ts → generated/ → fetch → Backend
main.py → models.py → store.py
```

## Routing

```
/              → HomePage (landing)
/book          → EventCatalogPage (select event type)
/book/:id      → BookingPage (pick date + slot + guest form)
/admin         → AdminPage (tabbed: bookings + event types)
```

## Design

- Cal.com-inspired UI with gradient backgrounds (`#dbeafe → #fef3e2 → #f9fafb`)
- Orange accent color (`#f76707`) for CTAs, selected states
- All text in Russian
- Gradient host avatar (orange/teal split)
- White cards with subtle borders on gradient backgrounds

## Architectural Invariants

Полные правила архитектуры описаны в [AGENTS.md](AGENTS.md). Кратко:

### Frontend Layer Rules

1. **Pages import ONLY hooks** — страницы импортируют из `../api/hooks.ts`, никогда из `../api/generated/`
2. **Generated is terminal** — `src/api/generated/` автогенерируется, никогда не редактируется вручную
3. **No raw fetch** — компоненты не вызывают `fetch()` напрямую
4. **No cross-page imports** — страницы не импортируют друг друга (кроме AdminPage → дочерние)

### Backend Layer Rules

1. **One-way dependencies** — `main.py → models.py → store.py`, без обратных импортов
2. **No circular dependencies** — граф зависимостей — строгий DAG
3. **Models mirror TypeSpec** — Pydantic модели соответствуют TypeSpec контракту
4. **Endpoints mirror TypeSpec** — маршруты в FastAPI совпадают с TypeSpec

### Forbidden Dependencies

| From | → To | Forbidden |
|---|---|---|
| `src/pages/` | `src/api/generated/` | Прямой импорт сгенерированных сервисов |
| `src/pages/` | `src/pages/` | Кросс-импорт страниц (кроме AdminPage → tabs) |
| `src/components/` | `src/api/` | API-вызовы из layout-компонентов |
| `backend/` | `src/` | Бэкенд импортирует что-либо из фронтенда |
| `src/` | `backend/` | Фронтенд импортирует что-либо из бэкенда |

## Docker

```bash
docker build -t calendar-booking .
docker run -p 4010:4010 calendar-booking
docker run -p 8080:8080 -e PORT=8080 calendar-booking  # custom port
```

Multi-stage build: Node 20 (frontend) + Python 3.12-slim (backend). Порт из переменной `PORT` (по умолчанию 4010). Бэкенд обслуживает собранный фронтенд + SPA fallback.

## Deploy

Приложение задеплоено:

**[https://ai-for-developers-project-386-xtsy.onrender.com](https://ai-for-developers-project-386-xtsy.onrender.com)**

Для деплоя используется Docker-образ. Конфигурация в `render.yaml`.
