# KINETIK - Plataforma de Domicilios
## Documento Funcional: ¿Qué hace y cómo funciona?

---

## 1. ¿Qué es Kinetik?

Kinetik es una plataforma de domicilios que conecta **clientes**, **comercios** y **domiciliarios** en un solo ecosistema. Permite a los usuarios pedir productos de tiendas locales y recibirlos en la puerta de su casa en minutos, a los comercios aumentar sus ventas sin necesidad de flota propia, y a los domiciliarios generar ingresos flexibles.

---

## 2. ¿Quiénes lo usan?

| Rol | Descripción | Dispositivo |
| :--- | :--- | :--- |
| **Cliente** | Persona que solicita domicilios | App Móvil (iOS + Android) |
| **Comercio** | Tienda que vende productos a domicilio | Web Dashboard |
| **Domiciliario** | Repartidor que entrega los pedidos | App Móvil (iOS + Android) |
| **Administrador** | Dueño/operador de la plataforma | Web Dashboard + Django Admin |

---

## 3. ¿Cómo funciona? (Flujo completo de un pedido)

### Paso 1: El cliente busca y selecciona

1. Abre la app y ve un mapa con tiendas cercanas.
2. Filtra por categoría (restaurantes, mercado, farmacia, etc.).
3. Selecciona una tienda y navega su catálogo de productos.
4. Agrega productos al carrito.
5. Revisa el resumen y confirma la dirección (puede ponerla en el mapa).
6. Elige método de pago: tarjeta, PSE, Nequi, efectivo contraentrega.
7. Hace clic en **"Pedir"**.

### Paso 2: El comercio recibe y prepara

1. El comercio escucha una notificación sonora en su Web Dashboard.
2. Ve el pedido entrar en la columna **"Nuevo"** del tablero Kanban.
3. Acepta el pedido y cambia el estado a **"Preparando"**.
4. Cuando la comida/producto está listo, hace clic en **"Listo"**.
5. El pedido pasa al pool de domiciliarios disponibles.

### Paso 3: El algoritmo asigna un domiciliario

1. El sistema busca domiciliarios disponibles en un radio de 5 km.
2. Calcula un puntaje basado en: distancia, calificación, carga actual, tiempo esperando.
3. Asigna el pedido al domiciliario con mayor puntaje.
4. El domiciliario recibe una notificación tipo popup con **15 segundos** para aceptar o rechazar.
5. Si rechaza o expira el tiempo, se asigna al siguiente mejor puntuado.

### Paso 4: El domiciliario recoge y entrega

1. El domiciliario acepta el pedido y ve en el mapa la ruta hacia el comercio.
2. Llega al comercio, confirma con botón **"Recogido"**.
3. El sistema traza la ruta hacia la dirección del cliente.
4. El domiciliario navega usando Google Maps integrado.
5. Llega al destino, entrega el pedido, presiona **"Entregado"**.
6. Opcional: toma foto como comprobante de entrega.

### Paso 5: El cliente sigue y califica

1. Desde que el pedido es asignado, el cliente ve en tiempo real:
   - Nombre y foto del domiciliario.
   - Mapa con la ubicación en vivo (actualiza cada 3-5 segundos).
   - Tiempo estimado de llegada (ETA).
2. Después de la entrega, califica del 1 al 5 y puede dejar propina.

---

## 4. Funcionalidades por Rol

### 4.1 Cliente (App Móvil)

| Funcionalidad | Descripción |
| :--- | :--- |
| **Registro e inicio de sesión** | Teléfono + SMS, o Google/Apple |
| **Ver tiendas cercanas** | Mapa y lista con distancia y tiempo estimado |
| **Buscar productos** | Búsqueda por nombre, categoría, tienda |
| **Catálogo con fotos** | Productos con precio, descripción, opciones |
| **Carrito de compras** | Agregar/quitar productos, ver total |
| **Múltiples direcciones** | Guardar direcciones frecuentes (casa, trabajo) |
| **Tracking en vivo** | Mapa con la ubicación del domiciliario en tiempo real |
| **Chat con domiciliario** | Mensajería en vivo (sin mostrar número real) |
| **Historial de pedidos** | Ver pedidos pasados y su estado |
| **Calificar y propinar** | Rating + propina opcional post-entrega |
| **Suscripción Premium** | Envíos gratis por suscripción mensual |
| **Modo offline** | Ver catálogo guardado sin conexión a internet |

### 4.2 Comercio (Web Dashboard)

| Funcionalidad | Descripción |
| :--- | :--- |
| **Gestión de productos** | CRUD de productos, precios, fotos, opciones |
| **Control de inventario** | Stock disponible, alertas de bajo inventario |
| **Tablero Kanban de pedidos** | Columnas: Nuevo, Preparando, Listo, Entregado |
| **Notificaciones sonoras** | Alarma cuando llega un pedido nuevo |
| **Historial de ventas** | Filtro por fecha, producto, domiciliario |
| **Estadísticas** | Pedidos/día, ingresos, producto más vendido |
| **Gestión de horarios** | Configurar horarios de atención |
| **Suscripciones** | Elegir plan (gratis, premium, premium+) |
| **Perfil de tienda** | Editar nombre, logo, dirección, teléfono |

### 4.3 Domiciliario (App Móvil)

| Funcionalidad | Descripción |
| :--- | :--- |
| **Conexión/Desconexión** | Botón para indicar si está disponible para recibir pedidos |
| **Asignación push** | Popup con tiempo, distancia y opción Aceptar/Rechazar |
| **Mapa de navegación** | Ruta optimizada hacia el comercio y el cliente |
| **Lista de pedidos** | Pedidos activos con dirección y productos |
| **Confirmación de estados** | Botones: Recogido, Entregado, Foto comprobante |
| **Ganancias del día** | Resumen de pedidos, ganancias, propinas |
| **Historial de pagos** | Desglose de pagos semanales |
| **Retiro de saldo** | Solicitar retiro a cuenta bancaria/Transfiya |
| **Calificación del cliente** | Ver su rating promedio |

### 4.4 Administrador (Web Dashboard)

| Funcionalidad | Descripción |
| :--- | :--- |
| **Dashboard en vivo** | Pedidos activos, domiciliarios conectados, ingresos del día |
| **Gestión de usuarios** | Activar/desactivar comercios, domiciliarios, clientes |
| **Gestión de pedidos** | Ver todos los pedidos, forzar cambios de estado |
| **Reportes analíticos** | Ventas por período, top comercios, top domiciliarios |
| **Configuración tarifas** | Comisiones, tarifas dinámicas, zonas de cobertura |
| **Auditoría** | Log de acciones críticas (cambios de estado, pagos) |
| **Gestión de municipios** | Agregar nuevos municipios/ciudades cuando expanda |
| **Django Admin** | Panel de control completo para soporte técnico |

---

## 5. Reglas de Negocio Clave

### Pedidos
- Un pedido solo puede estar en un estado a la vez.
- El cliente puede cancelar mientras el estado sea "Pendiente" o "Aceptado".
- El comercio tiene 5 minutos para aceptar un pedido; si no, se cancela automáticamente.
- El domiciliario tiene 15 segundos para aceptar una asignación.

### Domiciliarios
- Máximo 2 pedidos activos simultáneos por domiciliario.
- Después de rechazar 3 pedidos seguidos, queda desconectado por 15 minutos.
- La calificación se calcula como promedio móvil de los últimos 100 pedidos.

### Tarifas
- Tarifa base: $1.500 COP + $400 COP/km.
- Multiplicador dinámico: 1.2x en horas pico (12-2pm, 7-9pm), 1.5x en lluvia.
- Comisión al comercio: 20% flat en plan básico, 15% en premium.

### Pagos Contraentrega
- El domiciliario no debe gastar el efectivo recibido.
- El saldo se descuenta automáticamente de sus ganancias semanales.
- Si el saldo en efectivo supera los $200.000 COP, debe consignar antes de seguir recibiendo pedidos.

---

## 6. Notificaciones y Alertas

| Evento | Canal | Destinatario |
| :--- | :--- | :--- |
| Pedido realizado | Push + App | Comercio |
| Pedido listo para recoger | Push + App | Domiciliario asignado |
| Domiciliario asignado | Push + App + Mapa | Cliente |
| Domiciliario cerca (1 km) | Push | Cliente |
| Pedido entregado | Push | Cliente + Comercio |
| Nuevo mensaje de chat | Push + App | Destinatario |
| Recordatorio calificar | Push (1h después) | Cliente |

---

## 7. Monetización - ¿Cómo gana dinero la plataforma?

| Fuente de Ingreso | Cómo funciona |
| :--- | :--- |
| **Comisión por pedido** | 15%-25% del valor del pedido, pagado por el comercio |
| **Tarifa de domicilio** | $1.500 COP base + $400/km, pagado por el cliente |
| **Suscripción Premium** | $12.000 COP/mes para envíos gratis |
| **Publicidad CPC** | Comercios pagan por clic para aparecer destacados |
| **API B2B** | Sincronización de inventarios para cadenas grandes |

---

## 8. ¿Qué pasa si no hay internet?

| Situación | Qué pasa |
| :--- | :--- |
| **Cliente sin internet** | Puede ver el catálogo guardado localmente. Las acciones (pedir, pagar) se encolan y sincronizan cuando recupere conexión. |
| **Domiciliario sin internet** | Las coordenadas GPS se guardan localmente y se suben en lote al reconectar. |
| **Comercio sin internet** | No puede recibir pedidos nuevos. Los pedidos se mantienen en espera hasta que reconecte (máximo 30 minutos). |

---

## 9. Seguridad para el Usuario

- Los números de teléfono reales **nunca se muestran** entre clientes y domiciliarios; todo pasa por chat en la app.
- Los datos bancarios **nunca pasan por nuestros servidores**; van directamente a Stripe/Wompi.
- Cada usuario ve solo su propia información.
- Las ubicaciones en tiempo real solo se comparten mientras hay un pedido activo.
- El usuario puede solicitar la eliminación de sus datos en cualquier momento.

---

*Versión 1.0 - Documento Funcional Kinetik*
