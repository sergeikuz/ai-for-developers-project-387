.PHONY: help install dev build lint typecheck preview typespec api-gen typespec-gen mock clean backend-install backend-dev backend-test e2e-test e2e-install test docker-build docker-run lighthouse-audit lighthouse-install

help:
	@echo "Calendar Booking App — Available commands:"
	@echo ""
	@echo "  make install      Install all dependencies (npm + uv)"
	@echo "  make dev          Start Vite dev server"
	@echo "  make build        Build frontend for production"
	@echo "  make lint         Run ESLint"
	@echo "  make typecheck    Run TypeScript typecheck (tsc -b --noEmit)"
	@echo "  make preview      Preview production build"
	@echo "  make typespec     Compile TypeSpec → OpenAPI"
	@echo "  make api-gen      Generate TypeScript API client from OpenAPI"
	@echo "  make typespec-gen Compile TypeSpec + generate TS client (full regen)"
	@echo "  make mock         Start Prism mock server"
	@echo "  make backend-install  Install Python backend dependencies (uv)"
	@echo "  make backend-dev  Start FastAPI backend (port 4010)"
	@echo "  make backend-test Run backend tests (pytest)"
	@echo "  make e2e-test     Run Playwright E2E tests"
	@echo "  make e2e-install  Install Playwright browsers (chromium)"
	@echo "  make test         Run all tests (lint + backend + e2e)"
	@echo "  make lighthouse-install  Install Lighthouse CLI globally"
	@echo "  make lighthouse-audit    Run Lighthouse audit on built app"
	@echo "  make clean        Remove build artifacts and caches"
	@echo "  make docker-build Build Docker image"
	@echo "  make docker-run   Run Docker container on port 4010"

install:
	npm install
	cd typespec && npm install
	cd backend && uv sync

dev:
	npm run dev

build:
	npm run build

lint:
	npm run lint

typecheck:
	npx tsc -b --noEmit

preview:
	npm run preview

typespec:
	cd typespec && npx tsp compile main.tsp

api-gen:
	npm run api:gen

typespec-gen: typespec api-gen

mock:
	npm run mock

backend-install:
	cd backend && uv sync

backend-dev:
	cd backend && uv run uvicorn main:app --host 0.0.0.0 --port 4010 --reload

backend-test:
	cd backend && uv run pytest -v

clean:
	rm -rf node_modules dist typespec/node_modules typespec/tsp-output typespec/.tsp src/api/generated backend/__pycache__ backend/.pytest_cache backend/.venv lighthouse-reports

e2e-test:
	npx playwright test

e2e-install:
	npx playwright install --with-deps chromium

test: lint backend-test e2e-test

docker-build:
	docker build -t calendar-booking .

docker-run:
	docker run -p 4010:4010 -e PORT=4010 calendar-booking

lighthouse-install:
	npm install -g lighthouse

lighthouse-audit: build
	cp -r dist backend/dist
	cd backend && uv run uvicorn main:app --host 0.0.0.0 --port 4010 &
	@sleep 3
	mkdir -p lighthouse-reports
	lighthouse http://localhost:4010/ --output json --output html --output-path ./lighthouse-reports/home --only-categories=performance,accessibility,best-practices,seo
	lighthouse http://localhost:4010/book --output json --output html --output-path ./lighthouse-reports/catalog --only-categories=performance,accessibility,best-practices,seo
	lighthouse http://localhost:4010/book/meeting-15 --output json --output html --output-path ./lighthouse-reports/booking --only-categories=performance,accessibility,best-practices,seo
	@echo "Reports saved to lighthouse-reports/"
	@pkill -f "uvicorn main:app" || true
