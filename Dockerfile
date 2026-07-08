# Stage 1: Build the React frontend
FROM node:18-alpine AS frontend-build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --production=false
COPY public/ ./public/
COPY src/ ./src/
COPY tailwind.config.js postcss.config.js craco.config.js jsconfig.json ./
RUN npm run build

# Stage 2: Python backend + serve static build
FROM python:3.11-slim
WORKDIR /app

# Install Python dependencies
COPY api/requirements.txt ./api/requirements.txt
RUN pip install --no-cache-dir -r api/requirements.txt

# Copy backend code
COPY api/ ./api/

# Copy the built React frontend from Stage 1
COPY --from=frontend-build /app/build ./build

# Expose the port (Railway sets $PORT)
EXPOSE 8080

# Start the FastAPI server
CMD ["sh", "-c", "cd api && uvicorn server:app --host 0.0.0.0 --port ${PORT:-8080}"]
