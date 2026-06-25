# Stage 1: Build dependencies
FROM python:3.11-slim AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    gdal-bin \
    libgdal-dev \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY backend/requirements/ requirements/
RUN pip install --no-cache-dir -r requirements/production.txt

# Stage 2: Runtime image
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DJANGO_SETTINGS_MODULE=core.settings.production \
    APP_HOME=/app \
    APP_USER=kinetik

RUN apt-get update && apt-get install -y --no-install-recommends \
    gdal-bin \
    libgdal-dev \
    && rm -rf /var/lib/apt/lists/*

RUN groupadd -r $APP_USER && useradd -r -g $APP_USER -d $APP_HOME -s /sbin/nologin $APP_USER

WORKDIR $APP_HOME

COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

COPY backend/ .

RUN mkdir -p $APP_HOME/static $APP_HOME/media && \
    python manage.py collectstatic --noinput --clear 2>/dev/null || true

COPY docker/production/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

USER $APP_USER

EXPOSE 8000 8001

ENTRYPOINT ["/entrypoint.sh"]
