#!/bin/bash
set -e

echo "Running database migrations..."
python manage.py migrate --noinput

echo "Collecting static files..."
python manage.py collectstatic --noinput --clear 2>/dev/null || true

echo "Starting $KINETIK_SERVICE..."

case "$KINETIK_SERVICE" in
    django)
        exec gunicorn core.wsgi:application \
            --workers ${GUNICORN_WORKERS:-4} \
            --bind 0.0.0.0:8000 \
            --timeout ${GUNICORN_TIMEOUT:-120} \
            --max-requests ${GUNICORN_MAX_REQUESTS:-1000} \
            --max-requests-jitter 50 \
            --access-logfile - \
            --error-logfile - \
            --log-level ${LOG_LEVEL:-info}
        ;;
    daphne)
        exec daphne -b 0.0.0.0 -p 8001 \
            --access-log - \
            --verbosity ${LOG_LEVEL:-info} \
            core.asgi:application
        ;;
    celery)
        exec celery -A core worker \
            -l ${LOG_LEVEL:-info} \
            --concurrency=${CELERY_WORKERS:-4} \
            --max-tasks-per-child=${CELERY_MAX_TASKS:-1000} \
            --time-limit=${CELERY_TIME_LIMIT:-300}
        ;;
    celery-beat)
        exec celery -A core beat \
            -l ${LOG_LEVEL:-info} \
            --scheduler django_celery_beat.schedulers:DatabaseScheduler 2>/dev/null || \
        exec celery -A core beat \
            -l ${LOG_LEVEL:-info}
        ;;
    *)
        echo "Unknown service: $KINETIK_SERVICE"
        echo "Valid options: django, daphne, celery, celery-beat"
        exit 1
        ;;
esac
