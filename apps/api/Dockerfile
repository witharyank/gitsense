# Stage 1: Build dependency environment
FROM python:3.12-slim AS builder

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Install build system tools for compiling potential C dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# Install dependencies into python user directory to isolate them
RUN pip install --no-cache-dir --user -r requirements.txt

# Stage 2: Minimal Production Runner
FROM python:3.12-slim AS runner

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000

# Create secure non-root system group and user
RUN groupadd -g 10001 appgroup && \
    useradd -r -u 10001 -g appgroup -m appuser

# Copy compiled python dependencies from builder to runner's user profile
COPY --from=builder --chown=appuser:appgroup /root/.local /home/appuser/.local
ENV PATH=/home/appuser/.local/bin:$PATH

# Copy backend application source files
COPY --chown=appuser:appgroup . .

# Run as non-root user for execution isolation
USER appuser

EXPOSE 8000

# Start FastAPI application via ASGI Uvicorn server
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
