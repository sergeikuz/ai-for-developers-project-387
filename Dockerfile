# Stage 1: Build frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY tsconfig.json tsconfig.app.json tsconfig.node.json vite.config.ts index.html ./
COPY src/ src/

RUN npm run build

# Stage 2: Production
FROM python:3.12-slim AS production

WORKDIR /app

ENV PORT=4010

# Install backend dependencies
RUN pip install --no-cache-dir fastapi pydantic uvicorn

# Copy backend source
COPY backend/main.py ./
COPY backend/models.py ./
COPY backend/store.py ./

# Copy built frontend
COPY --from=frontend-builder /app/dist ./dist

EXPOSE ${PORT}

CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT}"]
