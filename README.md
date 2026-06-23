# Kinetik

Plataforma de domicilios multi-municipio (modelo Uber Eats / Rappi / Didi Food).

## Stack

| Capa | Tecnología |
|------|-----------|
| Backend | Django 5 + Django REST Framework + Channels |
| Base de datos | PostgreSQL 15 + PostGIS |
| Cache / Broker | Redis |
| Async tasks | Celery + Celery Beat |
| API | REST (JWT) + WebSockets (Daphne) |
| Proxy | Nginx |
| Contenedores | Docker Compose |
| Frontend (próximamente) | React Native (Expo) + React (Vite) |

## Arquitectura

```
nginx (:8080)
├── /api/* → Gunicorn (:8000) — REST API
├── /ws/*  → Daphne   (:8001) — WebSockets
└── /admin → Gunicorn (:8000) — Django Admin

Celery Worker → async tasks (assignments, notifications)
Celery Beat   → scheduled tasks (batch assign, heartbeats, reports)
```

### Apps

- `users` — Clientes, comercios, domiciliarios, perfiles
- `municipios` — Multi-tenancy preparado
- `stores` — Tiendas, horarios, direcciones
- `products` — Productos, categorías, opciones, inventario
- `orders` — Órdenes, items, log de estados
- `payments` — Métodos de pago, transacciones, billetera
- `couriers` — Ubicación, estado, log de asignaciones
- `tracking` — Tracking en tiempo real, rutas
- `notifications` — Notificaciones push, tokens
- `chat` — Conversaciones, mensajes
- `reviews` — Calificaciones, disputas
- `analytics` — Reportes diarios, estadísticas
- `tasks` — Tareas Celery (asignación batch, heartbeats, cleanup)

## Setup

### Requisitos

- Docker Desktop 4.x+
- WSL2 habilitado (Windows)

### Levantar entorno

```bash
cd docker/dev
docker compose up -d
docker compose exec django python manage.py migrate
docker compose exec django python manage.py createsuperuser
```

### Servicios

| Servicio | URL |
|----------|-----|
| API | http://localhost:8080/api/v1/ |
| Admin | http://localhost:8080/admin/ |
| Docs | http://localhost:8080/api/docs/ |
| Health | http://localhost:8080/health/ |

## Licencia

Proyecto privado — Kinetik
