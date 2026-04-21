# AGENTS.md

## Project
Calendar booking app — **Design First** approach. `typespec/main.tsp` is the single source of truth for the API contract.

## Stack
- **Frontend:** React 19 + TypeScript + Vite + Mantine + React Query + React Router + dayjs
- **Backend:** FastAPI (Python) + Pydantic + Uvicorn on port **4010** (managed by `uv`)
- **API contract:** TypeSpec → OpenAPI → generated TS client (`openapi-typescript-codegen --client fetch`)
- **Mock:** Prism on port **4010** (use when backend is not running)
- **E2E tests:** Playwright (Chromium) in `e2e/`
- **Performance audit:** Lighthouse CLI in `scripts/`

## Commands

```bash
make install          # npm install (root + typespec/) + uv sync (backend)
make dev              # Vite dev server
make build            # tsc -b && vite build (typecheck first)
make lint             # eslint .
make typespec         # cd typespec && npx tsp compile main.tsp
make api-gen          # regenerate TS client from openapi.yaml
make mock             # prism mock on port 4010
make backend-install  # uv sync (backend dependencies)
make backend-dev      # start FastAPI backend on port 4010
make backend-test     # run backend pytest tests
make e2e-test         # run Playwright E2E tests (starts dev + backend automatically)
make e2e-install      # install Playwright browsers (chromium)
make lighthouse-install  # install Lighthouse CLI globally
make lighthouse-audit    # build + run Lighthouse audit on 3 pages
make test             # run all tests (backend + e2e)
make clean            # removes node_modules, dist, tsp-output, src/api/generated, lighthouse-reports, backend caches
make docker-build     # build Docker image
make docker-run       # run Docker container on port 4010
```

## Docker

```bash
docker build -t calendar-booking .
docker run -p 4010:4010 calendar-booking
docker run -p 8080:8080 -e PORT=8080 calendar-booking  # custom port
```

- Multi-stage build: Node 20 (frontend) + Python 3.12-slim (backend)
- Port from `PORT` env var (default 4010)
- Backend serves built frontend static files + SPA fallback

**Gotcha:** `make clean` deletes `src/api/generated/`. After running it, you must run `make api-gen` before the app compiles.

**Gotcha:** The Makefile target is `api-gen` (hyphen), not `api:gen`. The colon breaks Make parsing.

## API URL config
- `.env` sets `VITE_API_URL=http://localhost:4010` (FastAPI backend or Prism mock)
- `src/api/index.ts` reads `VITE_API_URL` and sets `OpenAPI.BASE` — single point of API URL config
- Run `make backend-dev` for real backend, or `make mock` for Prism

## Architecture

```
src/
  api/
    generated/        # auto-generated — never edit, always regenerate via make api-gen
    hooks.ts          # React Query wrappers — all components use these, not raw services
    index.ts          # re-exports + OpenAPI.BASE config
  components/
    Layout.tsx        # Simple top navbar with Calendar logo + nav links
  pages/
    HomePage.tsx          # / — landing page with gradient, badge, CTA, features card
    EventCatalogPage.tsx  # /book — host profile + event type cards (15min, 30min)
    BookingPage.tsx       # /book/:id — 3-column: info panel, calendar grid, slot status
    AdminPage.tsx         # /admin — tabbed dashboard (bookings + event types)
    AdminBookingsPage.tsx     # bookings table
    AdminEventTypesPage.tsx   # event types CRUD (create/edit modal, delete)
  main.tsx            # entry: BrowserRouter + QueryClient + MantineProvider
  App.tsx             # Routes definition

backend/
  main.py             # FastAPI app + all endpoints + business logic
  models.py           # Pydantic models (matches TypeSpec contract)
  store.py            # In-memory storage + seed data
  test_main.py        # Pytest tests (functional + contract compliance)
  pyproject.toml      # uv project config

e2e/
  home.spec.ts        # Playwright E2E tests — home page
  booking.spec.ts     # Playwright E2E tests — booking flow + admin

scripts/
  lighthouse-check.js  # Parse Lighthouse JSON reports and create GitHub issues
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

## Conventions
- **Never edit `openapi.yaml`** — update `typespec/main.tsp` then `make typespec && make api-gen`
- **Never edit `src/api/generated/`** — always regenerate via `make api-gen`
- **Prism mock data** — examples are added directly to `openapi.yaml` responses (not via TypeSpec `@example` on operations)
- Components call hooks from `src/api/hooks.ts`, never the generated services directly
- Mantine CSS is imported in `main.tsx` (`@mantine/core/styles.css`, `@mantine/notifications/styles.css`)
- No auth — single predefined owner profile ("Tota")
- Two API roles: **Owner** (`/admin/*`) and **Guest** (public)
- Booking rules: no double-booking same slot (within one event type), 14-day availability window
- All UI text in Russian

## Architectural Invariants

### Layer Rules (Frontend)

```
Pages → Hooks → api/index.ts → generated/ → fetch → Backend
```

1. **Pages import ONLY hooks** — `src/pages/*.tsx` import from `../api/hooks.ts`, NEVER from `../api/generated/`
2. **Hooks import ONLY from api/index.ts** — `src/api/hooks.ts` imports services/types from `../api` (which resolves to `index.ts`)
3. **Generated is terminal** — `src/api/generated/` is auto-generated, never manually edited, never imports from app code
4. **No raw fetch** — components never call `fetch()` or `axios` directly; all HTTP goes through hooks → generated SDK
5. **No cross-page imports** — pages do not import from each other (except `AdminPage.tsx` → its tab children)
6. **Components are pure UI** — `src/components/` contains layout/UI shells, no API calls

### Layer Rules (Backend)

```
main.py → models.py → store.py
```

1. **One-way dependencies** — `main.py` imports from `models.py` and `store.py`; `store.py` imports from `models.py`; NO reverse imports
2. **No circular dependencies** — the dependency graph must be a strict DAG
3. **Models mirror TypeSpec** — every Pydantic model in `models.py` must match the corresponding TypeSpec model in `main.tsp`
4. **Endpoints mirror TypeSpec** — every route in `main.py` must match a route defined in `typespec/main.tsp` (verified by contract tests)
5. **App factory pattern** — `create_app(store=None)` enables test isolation; tests pass `fresh_store()`, production uses global store

### TypeSpec Contract

1. **Single source of truth** — `typespec/main.tsp` defines all models, routes, status codes, error shapes
2. **Change flow** — modify `.tsp` → `make typespec` → `make api-gen` → (manually sync `backend/models.py` if models changed)
3. **Contract tests** — `backend/test_main.py` reads generated `openapi.yaml` and verifies backend endpoints exist and return correct status codes

### Forbidden Dependencies

| From | → To | Forbidden |
|---|---|---|
| `src/pages/` | `src/api/generated/` | Direct import of generated services |
| `src/pages/` | `src/pages/` | Cross-page imports (except AdminPage → tabs) |
| `src/components/` | `src/api/` | API calls from layout components |
| `backend/` | `src/` | Backend importing anything from frontend |
| `src/` | `backend/` | Frontend importing anything from backend |
| `typespec/` | `src/` or `backend/` | TypeSpec never imports from generated code |
| Any layer | `openapi.yaml` (edit) | Never edit — regenerate from TypeSpec |

### Refactoring Workflow

1. **Commit before each change** — before starting any refactoring step, create a git commit describing what will be changed and why
2. **Run tests after each step** — execute relevant tests (`make backend-test`, `make e2e-test`, `make lint && make build`)
3. **Revert on failure** — if tests fail, revert the last commit (`git revert HEAD`) and try a different approach
4. **Small steps** — prefer multiple small commits over one large change; each commit should leave the codebase in a working state

### Verification

```bash
make lint && make build    # Frontend typecheck + lint
make backend-test           # 30 pytest tests (functional + contract compliance)
make e2e-test               # Playwright E2E (booking flow + admin)
make lighthouse-audit       # Lighthouse performance audit (3 pages)
```

All must pass. ESLint warnings from `src/api/generated/` are expected (from codegen directive comments).

### CI Workflows

| Workflow | Trigger | Description |
|---|---|---|
| `ci-tests.yml` | push/PR to main | lint + typecheck + build + backend tests + e2e |
| `lighthouse-nightly.yml` | daily 2:00 UTC + manual | Lighthouse audit on 3 pages, auto-creates issue on failure |
| `weekly_code_audit.yml` | weekly Tuesday 17:15 UTC | OpenCode audit for TODO/FIXME/HACK comments |
| `hexlet-check.yml` | push | Hexlet project check |
