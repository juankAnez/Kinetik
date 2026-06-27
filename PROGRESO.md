# Kinetik — Seguimiento de Progreso

> Actualizado: Junio 2026

---

## Resumen General

| Componente | Estado | Progreso |
|---|---|---|
| Backend Django (13 apps) | ✅ Completado | 100% (modelos, vistas, serializers, URLs, admin, tests) |
| Infraestructura Docker (dev) | ✅ Completo | 100% listo |
| Infraestructura Docker (prod) | ✅ Completo | 100% listo (multi-stage, Nginx+SSL, 7 servicios) |
| Mobile React Native (Expo) | 🟡 En desarrollo | ~40% (Auth, Catalog, Cart, Orders, infraestructura completa) |
| Web Dashboard React (Vite) | ❌ No iniciado | 0% |
| Scripts de automatización | 🟡 Parcial | Solo `seed_data` creado |
| Tests automatizados | ✅ 179 tests | 177 passed, 2 xfailed |

---

## 1. Backend — Estado por App

| App | % | Estado |
|---|---|---|
| `users` | 100% | Auth JWT, registro 4 tipos de perfil, login/refresh, endpoint `/me/`, admin completo, **19 tests** |
| `municipios` | 100% | CRUD ReadOnly (público), admin completo, **6 tests** |
| `stores` | 100% | CRUD tiendas, endpoint `nearby/` con PostGIS, addresses, admin completo, **8 tests** |
| `products` | 100% | CRUD productos con opciones/categorías, filtro por tienda, admin completo, **5 tests** |
| `orders` | 100% | Máquina de 8 estados, filtrado por rol (cliente/comercio/admin/domiciliario), timestamps por transición, **24 tests** |
| `payments` | 100% | PaymentMethod, Transaction, Wallet. PaymentViewSet funcional (intent + webhook). **17 tests** |
| `couriers` | 100% | AssignmentService completo (scoring PostGIS), CRUD CourierLocation/CourierStatus, toggle/accept/reject. **Tests via orders + aislados** |
| `tracking` | 100% | Consumer WebSocket real, TrackingPoints, Rutas (endpoint REST). **Tests vía WebSocket + REST** |
| `notifications` | 100% | Notificaciones push (DB), WebSocket, admin completo. **8 tests** |
| `chat` | 100% | Conversaciones por pedido, WebSocket, admin completo. **8 tests (REST + WebSocket)** |
| `reviews` | 100% | Calificaciones + disputas, actualiza promedios, admin completo. **11 tests** |
| `analytics` | 100% | Dashboard + DailySalesReport + CourierPerformance + MunicipioStats CRUD, admin completo. **11 tests** |
| `tasks` | 100% | `celery_tasks.py` con 5 tareas + schedule Celery Beat |

---

## 2. Módulo Compartido (`shared/`)

| Componente | Estado |
|---|---|
| `pagination.py` | ✅ StandardPagination (page_size=20, max=100) |
| `exceptions/handlers.py` | ✅ Manejador global de errores DRF |
| `permissions/__init__.py` | ✅ IsCliente, IsComercio, IsDomiciliario, IsAdminOrReadOnly |
| `filters/__init__.py` | ✅ MunicipioFilterBackend, IsActiveFilterBackend |
| `mixins/__init__.py` | ✅ SerializerByActionMixin |

---

## 3. Tests — 179 total

| App | Tests | Cobertura |
|---|---|---|
| `users` | 19 | Registro, login, refresh, perfiles, admin |
| `municipios` | 6 | CRUD admin, list público |
| `stores` | 8 | CRUD, nearby, addresses, filtros |
| `products` | 5 | CRUD, filtros, availability |
| `orders` | 26 | Ciclo completo, transiciones, wallet, permisos, timestamps |
| `orders (concurrency)` | 8 | Atomic assignment, webhook idempotency, wallet concurrencia, courier order count |
| `orders (integration)` | 7 | E2E: REST lifecycle (store→order→payment→status→courier→delivery→wallet), WebSocket chat, GPS tracking, notifications |
| `payments` | 17 | PaymentMethod CRUD, intent, webhook, transactions, wallet |
| `notifications` | 8 | List, mark_read, unread_count, aislamiento |
| `chat` | 8 | REST (conversaciones, mensajes) + WebSocket |
| `reviews` | 11 | Review CRUD, rating update, dispute CRUD |
| `analytics` | 11 | Dashboard, DailySales, CourierPerformance, MunicipioStats |
| `couriers` | 1 + 1 xfail | Score y asignación (xfail sin PostGIS) |
| `tracking` | 13 | REST (list, order_history, routes + isolation) + WebSocket (connect 3 roles, reject 3 escenarios, location update, assigned event) |
| `maps` | 4 | Geocode (cache, normalized key, TTL) + Reverse geocode (cache, key prefix) |
| `maps (directions)` | 9 | Directions CRUD, missing params, 502, fallback Google↔Nominatim, geolocator caching, Google limit, cache behavior |

**Resultado: 177 passed ✅, 2 xfailed ⚠️ (Pruebas de cercanía/PostGIS requieren base de datos espacial — se ejecutan en CI con PostGIS)**

---

## 4. Seed Data

| Comando | Estado |
|---|---|
| `python manage.py seed_data` | ✅ Creado — usa Faker en español colombiano |
| `python manage.py seed_data --clear` | ✅ Limpia y resiembra |

**Genera:**
- 5 municipios (Medellín, Bogotá, Cali, Barranquilla, Bucaramanga)
- 8 categorías de tienda
- 8 clientes, 3 comercios, 3 domiciliarios, 1 admin
- 8 tiendas con horarios completos
- ~35 productos
- 50 pedidos con items
- Métodos de pago, transacciones, wallets
- Tracking points, ubicaciones, rutas
- Notificaciones, reseñas, reportes analytics

---

## 5. Infraestructura

| Componente | Estado |
|---|---|
| Docker Compose dev | ✅ 7 servicios (db, redis, django, daphne, celery, celery-beat, nginx) |
| Dockerfile | ✅ Multi-stage con GDAL |
| Nginx config | ✅ Proxy reverso (API, WS, admin, estáticos) |
| .env | ✅ Configurado |
| Docker production | ✅ Multi-stage, Nginx+SSL, 7 servicios, image ~1.7GB |

---

## 6. Frontend Mobile — React Native (Expo)

| Módulo | Estado | Archivos |
|--------|--------|----------|
| **Scaffolding** | ✅ Completo | `package.json`, `app.json`, `tsconfig.json`, `babel.config.js`, `tailwind.config.js` |
| **Infraestructura** | ✅ Completo | Axios client + JWT refresh automático, Zustand stores (auth, cart), tipos `models.ts`/`api.ts`/`navigation.ts` |
| **Auth** | ✅ Login + Register | `LoginScreen`, `RegisterScreen`, Zod schemas, `useLogin`/`useRegister` hooks, SecureStore persist |
| **Catalog** | ✅ Home, StoreDetail, ProductDetail | FlatList tiendas, lista productos por tienda, selector de opciones, carrito |
| **Cart** | ✅ Pantalla de carrito | Ajustar cantidades, eliminar items, subtotal, resumen |
| **Checkout** | ✅ Confirmar pedido | Dirección, notas, resumen, crear orden vía API |
| **Order Detail** | ✅ Detalle de pedido | Estado, productos, total, tracking link |
| **API Services** | ✅ 10 módulos | `auth`, `stores`, `products`, `orders`, `tracking`, `chat`, `reviews`, `payments`, `couriers`, `notifications` |
| **Navigation** | ✅ Por rol | Auth (no auth) → Client/Domiciliario según `user_type` |
| **WebSocket** | ❌ Pendiente | Cliente para tracking/chat/notificaciones |
| **Courier** | 🟡 Esqueleto | Navigator creado, pantallas pendientes |
| **Profile** | ❌ Pendiente | Perfil, direcciones guardadas |
| **Chat** | ❌ Pendiente | WebSocket chat |
| **Reviews** | ❌ Pendiente | Calificar después de entrega |

**TypeScript:** ✅ Compila sin errores (0 errores)

### Estructura del proyecto mobile
```
mobile/
├── src/
│   ├── app/App.tsx              # Entry point, providers
│   ├── navigation/              # Root, Auth, Client, Courier
│   ├── modules/
│   │   ├── auth/                # Login, Register, schemas, hooks
│   │   ├── catalog/             # Home, StoreDetail, ProductDetail
│   │   ├── cart/                # CartScreen
│   │   ├── orders/              # Checkout, OrderDetail
│   │   ├── courier/             # Esqueleto
│   │   └── ...
│   ├── services/api/            # Axios client + 10 API modules
│   ├── services/storage/        # SecureStore session
│   ├── stores/                  # Zustand (auth, cart)
│   ├── shared/                  # Components, hooks, utils
│   └── types/                   # models.ts, api.ts, navigation.ts
```

---

## 7. Próximos Pasos

### Alta prioridad
1. **Pendiente: definición del modelo de pagos** — reunión con domiciliarios para definir:
   - Pago cliente → domiciliario (efectivo/transferencia directa)
   - Comisión domiciliario → plataforma por envío
   - Comisión comercio → plataforma por venta
   - Wallet y liquidaciones

### Media prioridad
3. **Mobile: WebSocket** (tracking en vivo, chat, notificaciones push)
4. **Mobile: Pantallas de domiciliario** (disponibilidad, asignación, wallet)
5. Iniciar Web Dashboard React (Vite + Tailwind)
6. Notificaciones push reales (FCM/APNs)
7. Wallet con retiros bancarios reales

### Features de negocio
7. Propinas para domiciliarios
8. Multi-municipio con django-pgschemas
9. H3 spatial indexing (Uber) >500 couriers

---

> Basado en análisis de `backend/`, `docker/`, `planificacion.txt`, `funcionalidad.md`, `arquitectura.md`
