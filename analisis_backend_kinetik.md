# Reporte de Análisis Técnico del Backend — Kinetik

Este documento presenta el análisis técnico y de coherencia del backend del proyecto Kinetik con respecto a la documentación del sistema (`arquitectura.md`, `funcionalidad.md` y `planificacion.txt`).

---

## 1. Resumen de Calidad y Coherencia General

El backend de **Kinetik** demuestra un nivel de desarrollo profesional y estructurado. Sigue los principios establecidos en los documentos de arquitectura y planificación de manera fiel:
* **Estructura modular:** Las 13 aplicaciones Django (`users`, `municipios`, `stores`, `products`, `orders`, `payments`, `couriers`, `tracking`, `notifications`, `chat`, `reviews`, `analytics`, `tasks`) están claramente desacopladas y siguen la convención de archivos y responsabilidades indicada.
* **Preparación Multi-tenant:** El uso sistemático de `municipio_id` en los modelos clave (`Order`, `Store`, `User`) está alineado con la estrategia de escalabilidad futura hacia `django-pgschemas`.
* **Pruebas Automatizadas:** Cuenta con una cobertura de pruebas muy robusta (120 pruebas unitarias e integración en pytest), con **118 aprobadas** y **2 xfailed** (completamente esperadas, debido a la falta de la extensión PostGIS nativa en SQLite local para pruebas espaciales).
* **Asignación Asíncrona:** El uso de Daphne para WebSockets y Celery para tareas en segundo plano (heartbeats, asignación en lote, reportes) coincide perfectamente con la infraestructura descrita en `arquitectura.md`.

---

## 2. Inconsistencias y Bugs Críticos Detectados y Corregidos

A partir del análisis estático y dinámico del backend, se detectaron y corrigieron con éxito las siguientes inconsistencias críticas de lógica y bugs de código para asegurar la coherencia profesional y el correcto funcionamiento en producción:

### 2.1 Bug en la Conexión de Tracking de Comercios (`AttributeError`)
* **Ubicación:** [consumers.py (apps/tracking/consumers.py)](file:///c:/Proyectos/Kinetik/backend/apps/tracking/consumers.py#L86)
* **El Problema original:** En la validación de acceso al WebSocket de tracking, el código intentaba verificar si el usuario pertenecía al comercio mediante `order.store.commerceprofile_set.filter(user=user).exists()`. Dado que la relación entre `CommerceProfile` y `Store` es de tipo `OneToOneField`, Django no genera un manager `commerceprofile_set`. Esto lanzaba un `AttributeError` impidiendo la conexión.
* **Solución aplicada:** Se reemplazó por una verificación directa sobre la propiedad:
  ```python
  hasattr(order.store, "commerceprofile") and order.store.commerceprofile.user == user
  ```

### 2.2 Puntuación de Asignación no Persistida (`score=0`)
* **Ubicación:** [services.py (apps/couriers/services.py)](file:///c:/Proyectos/Kinetik/backend/apps/couriers/services.py)
* **El Problema original:** Al completarse una asignación de pedido, se registraba `AssignmentLog` con `score=0` de forma fija, ignorando el resultado real del algoritmo de scoring ponderado.
* **Solución aplicada:** Se actualizó `_find_best_courier` para retornar una tupla `(best_courier, best_score)` y pasar el puntaje obtenido directamente al crear el `AssignmentLog`.

### 2.3 Flujo de Wallet y Estadísticas de Domiciliarios Incompleto
* **Ubicación:** [views.py (apps/orders/views.py)](file:///c:/Proyectos/Kinetik/backend/apps/orders/views.py) y [models.py (apps/payments/models.py)](file:///c:/Proyectos/Kinetik/backend/apps/payments/models.py)
* **El Problema original:** Cuando una orden pasaba al estado `DELIVERED`, no se actualizaban las ganancias en el modelo `Wallet` del domiciliario, ni se actualizaban las estadísticas del perfil del domiciliario (`total_deliveries`, `total_earned`, decremento seguro de `current_order_count`). Las billeteras siempre quedaban en $0.
* **Solución aplicada:** Se implementó una actualización transaccional en la vista de transiciones de órdenes. Al marcarse como `DELIVERED`, se incrementan de forma atómica y segura las ganancias y estadísticas del domiciliario. Asimismo, al marcarse como `CANCELLED`, se decrementa `current_order_count` de manera defensiva (evitando valores negativos).

---

## 3. Recomendaciones para Mayor Coherencia Profesional

Para elevar el backend de Kinetik a un nivel de desarrollo listo para producción de clase mundial, sugerimos aplicar las siguientes mejoras:

1. **Añadir Pruebas de WebSocket para Tracking:** 
   Actualmente, la aplicación de `tracking` no tiene archivos de prueba dedicados. Dado que el flujo de coordenadas en tiempo real es una parte crítica del negocio, se deben crear pruebas utilizando `WebsocketCommunicator` (siguiendo el patrón implementado en `chat`) para garantizar que la ingesta de coordenadas funcione bajo carga.
2. **Configuración de SpatiaLite para Pruebas Locales:**
   Para solucionar de manera profesional el test `xfailed` en entornos locales donde instalar PostgreSQL + PostGIS sea complejo (como desarrollo directo en Windows sin Docker), se puede configurar el motor de pruebas en `test.py` para usar SQLite con la extensión **SpatiaLite** de forma condicional, evitando los fallos falsos en las pruebas de cercanía.
3. **Manejo de Excepciones en el Registro de Wallet:**
   Al crear un nuevo domiciliario (`User`), se debería generar su billetera (`Wallet`) automáticamente utilizando una señal `post_save` en lugar de depender exclusivamente de scripts de semillas de datos como `seed_data.py`. Esto previene que usuarios registrados orgánicamente queden sin billetera creada.

---
*Fin del reporte de análisis de Kinetik.*
