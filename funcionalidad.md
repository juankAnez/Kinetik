# KINETIK — Documento Funcional Completo

> Versión: 1.0 — Junio 2026
> Propósito: Describir el funcionamiento integral de la plataforma para alineación con socios, inversionistas y equipo de desarrollo.

---

## Índice

1. [Visión General](#1-visión-general)
2. [Actores del Sistema](#2-actores-del-sistema)
3. [Flujo Completo de un Pedido](#3-flujo-completo-de-un-pedido)
4. [Sistema de Pagos](#4-sistema-de-pagos)
5. [Modelo de Negocio y Ganancias](#5-modelo-de-negocio-y-ganancias)
6. [Funcionalidades por Actor](#6-funcionalidades-por-actor)
7. [Casos Especiales y Excepciones](#7-casos-especiales-y-excepciones)
8. [Sistema de Métricas y Analytics](#8-sistema-de-métricas-y-analytics)
9. [Seguridad y Confianza](#9-seguridad-y-confianza)
10. [Mejoras Futuras y Roadmap](#10-mejoras-futuras-y-roadmap)
11. [Glosario](#11-glosario)

---

## 1. Visión General

**Kinetik** es una plataforma de domicilios multi-municipio que conecta **clientes**, **comercios** y **domiciliarios** para la compra, preparación y entrega de productos a domicilio.

### Propuesta de Valor

| Actor | Propuesta de Valor |
|-------|-------------------|
| **Cliente** | Acceder a múltiples comercios desde una sola app, seguimiento GPS en tiempo real, pagos flexibles |
| **Comercio** | Ampliar su alcance sin invertir en logística propia, dashboard de ventas y analytics, planes flexibles |
| **Domiciliario** | Trabajar por cuenta propia con horarios flexibles, pagos semanales, propinas |
| **Plataforma** | Comisión por transacción, suscripciones premium, economía de escala multi-municipio |

---

## 2. Actores del Sistema

### 2.1 Cliente

**Perfil:** Usuario final que solicita productos a domicilio.

**Atributos del perfil:**
- Nombre, teléfono, email, contraseña
- Direcciones de entrega guardadas (múltiples, con geolocalización)
- Municipio de residencia
- Historial de pedidos
- Métodos de pago guardados

**Capacidades:**
- Explorar tiendas y productos disponibles en su municipio
- Filtrar tiendas por categoría y cercanía
- Ver productos con precios, descripciones, imágenes y opciones
- Agregar productos al carrito con opciones personalizadas
- Crear pedidos con método de pago seleccionado (tarjeta/PSE/Nequi/transferencia/contraentrega)
- Seguir el estado del pedido en tiempo real: Pendiente → Aceptado → Preparando → Listo → Asignado → Recogido → Entregado
- Ver la ubicación GPS del domiciliario en el mapa cuando el pedido está en camino
- Chatear con el domiciliario durante el trayecto
- Recibir notificaciones push de cada cambio de estado
- Calificar al comercio y al domiciliario después de la entrega
- Abrir disputas si hay problemas con el pedido
- Ver historial completo de pedidos

### 2.2 Comercio

**Perfil:** Negocio que vende productos a través de la plataforma.

**Atributos del perfil:**
- Nombre del negocio, logo, banner, descripción
- Categoría (restaurante, farmacia, mercado, etc.)
- Ubicación georreferenciada del local
- Horarios de operación por día de la semana
- Plan de suscripción (Gratis/Básico/Premium)
- Tasa de comisión configurable
- Radio de entrega en kilómetros
- Cuenta bancaria para recibir pagos

**Capacidades:**
- Gestionar catálogo de productos (crear, editar, eliminar, activar/desactivar)
- Organizar productos en categorías
- Configurar opciones por producto (tamaños, extras, personalizaciones)
- Ver pedidos entrantes en tiempo real
- Aceptar o rechazar pedidos (con tiempo límite, ej: 3 minutos)
- Marcar pedidos como "En preparación" y "Listo para recoger"
- Ver dashboard de ventas: órdenes hoy, ingresos, productos más vendidos
- Recibir notificaciones de nuevos pedidos y cambios de estado
- Ver analytics históricos: ventas por día, tendencias, ticket promedio
- Configurar su cuenta bancaria para recibir pagos
- Ver historial de liquidaciones y pagos recibidos

### 2.3 Domiciliario

**Perfil:** Repartidor independiente que realiza las entregas.

**Atributos del perfil:**
- Nombre, teléfono, email
- Número de documento de identidad
- Número de licencia de conducción
- Tipo de vehículo (moto/bicicleta/carro)
- Ubicación GPS en tiempo real
- Disponibilidad (conectado/desconectado)
- Estadísticas: calificación promedio, tasa de completados, pedidos totales, ganancias

**Capacidades:**
- Conectarse/desconectarse de la plataforma
- Recibir asignaciones de pedidos cuando está disponible
- Aceptar o rechazar pedidos asignados (con sistema de racha: 3 rechazos seguidos = bloqueo 15 min)
- Ver detalles del pedido: dirección de recogida y entrega, productos, notas
- Ver la ruta óptima hacia el comercio y hacia el cliente
- Actualizar su ubicación GPS en tiempo real (consumo de batería adaptativo)
- Marcar pedidos como "Recogido" y "Entregado"
- Chatear con el cliente durante el trayecto
- Recibir notificaciones de nuevas asignaciones
- Ver su billetera (Wallet): saldo actual, historial de ganancias
- Solicitar retiro de su saldo a su cuenta bancaria

### 2.4 Administrador de la Plataforma

**Perfil:** Gestor de la plataforma con acceso completo.

**Capacidades:**
- Gestionar municipios (crear, activar/desactivar, configurar cobertura)
- Gestionar comercios (aprobar, suspender, configurar comisión)
- Gestionar domiciliarios (aprobar, suspender, ver historial)
- Ver dashboard global de analytics: pedidos totales, ingresos, usuarios activos
- Verificar comprobantes de pago por transferencia bancaria
- Configurar cuentas bancarias de la plataforma para transferencias
- Gestionar disputas entre clientes y comercios
- Ver reportes generados automáticamente (ventas diarias, rendimiento couriers, stats municipio)

---

## 3. Flujo Completo de un Pedido

### 3.1 Diagrama de Estados

```
PENDING ──→ ACCEPTED ──→ PREPARING ──→ READY ──→ ASSIGNED ──→ PICKED_UP ──→ DELIVERED
   │            │            │            │           │              │
   │            │            │            │           │              │
   └──── CANCELLED ←─────────┴────────────┴───────────┴──────────────┴── (en cualquier momento)
         (cliente)         (comercio)   (comercio)  (sistema)    (domiciliario) (domiciliario)
```

### 3.2 Paso a Paso Detallado

#### Fase 1: Exploración y Compra (Cliente)

1. **Cliente abre la app** → Ve lista de tiendas activas en su municipio
2. **Filtra por categoría o cercanía** → Puede ver tiendas cercanas con geolocalización
3. **Selecciona una tienda** → Ve su catálogo de productos con precios, imágenes y opciones
4. **Agrega productos al carrito** → Puede personalizar opciones (ej: tamaño, extras)
5. **Revisa carrito** → Ve subtotal, tarifa de domicilio, descuentos, total
6. **Selecciona dirección de entrega** → Puede usar una guardada o agregar nueva
7. **Selecciona método de pago** →
   - **Tarjeta/PSE/Nequi:** Paga en línea inmediatamente
   - **Transferencia:** Ve datos bancarios de la plataforma, paga y sube comprobante
   - **Contraentrega:** Pagará en efectivo al recibir
8. **Confirma el pedido** → Se crea la orden con estado `PENDING`

> **Nota:** Para pagos por transferencia, la orden queda en `PENDING` hasta que el administrador o comercio verifique el comprobante. Solo entonces el comercio puede aceptarla.

#### Fase 2: Preparación (Comercio)

1. **Comercio recibe notificación** de nuevo pedido pendiente
2. **Tiene 3 minutos para aceptar o rechazar** (configurable)
   - Si acepta → estado `ACCEPTED`
   - Si rechaza → estado `CANCELLED`, se notifica al cliente
   - Si no responde en 3 minutos → cancelación automática
3. **Comienza a preparar el pedido** → Marca estado `PREPARING`
4. **Cuando está listo** → Marca estado `READY`
5. El sistema recibe el estado `READY` y **dispara el algoritmo de asignación**

#### Fase 3: Asignación (Sistema Automático)

1. **Búsqueda:** Cada 5 segundos, el sistema busca pedidos en estado `READY`
2. **Filtro espacial:** Busca domiciliarios disponibles dentro del radio de cobertura del comercio
3. **Puntuación:** Calcula un score para cada candidato:

| Factor | Peso | Cálculo |
|--------|------|---------|
| Distancia al comercio | 40% | 1 - (distancia / radio_máximo) |
| Calificación promedio | 20% | rating / 5 × 20 |
| Carga de trabajo | 20% | (2 - pedidos_actuales) × 10 |
| Tiempo inactivo | 10% | min(minutos_inactivo / 10, 10) |
| Tasa de completados | 10% | tasa_completados × 10 |

4. **Asignación atómica:** Selecciona al mejor puntaje y asigna con bloqueo (evita doble asignación)
5. **Notificación:** El domiciliario recibe push con los detalles del pedido
6. **Tiene 30 segundos para aceptar o rechazar**
   - Acepta → estado `ASSIGNED`, se notifica al comercio y al cliente
   - Rechaza → se asigna al siguiente mejor puntaje
   - Si hay 3 rechazos consecutivos → bloqueo temporal de 15 minutos

#### Fase 4: Recogida y Entrega (Domiciliario + Cliente)

1. **Domiciliario va al comercio** → Marca `PICKED_UP` cuando recoge
2. **Inicia el tracking GPS:**
   - La app del domiciliario envía coordenadas cada 2-5 segundos (frecuencia adaptativa según velocidad)
   - El cliente ve la ubicación en tiempo real en un mapa
   - Se muestra el tiempo estimado de llegada (ETA)
3. **Cliente y domiciliario pueden chatear** durante el trayecto
4. **Domiciliario entrega el pedido** → Marca `DELIVERED`
5. **Cliente recibe notificación** de entrega exitosa
6. **Sistema libera pagos** automáticamente

#### Fase 5: Post-entrega

1. **Cliente califica:**
   - Calificación del comercio (1-5 estrellas + comentario opcional)
   - Calificación del domiciliario (1-5 estrellas + propina opcional)
   - Se recalcula automáticamente el promedio de ambos
2. **Si hay problema:** Cliente puede abrir una disputa (razón + descripción)
3. **Comercio y domiciliario** ven actualizadas sus estadísticas
4. **Plataforma registra** la transacción financiera completa

### 3.3 Temporizadores y Alertas

| Evento | Límite | Acción si se vence |
|--------|--------|-------------------|
| Comercio acepta pedido | 3 min | Cancelación automática + notificación al cliente |
| Domiciliario acepta asignación | 30 seg | Pasar al siguiente candidato |
| Domiciliario llega al comercio | 15 min (desde asignación) | Alerta al comercio, escalar si es necesario |
| Entrega completada | 45 min (desde recogida) | Alerta al cliente, escalar |
| Heartbeat domiciliario | 5 min sin ping | Marcar como desconectado |

---

## 4. Sistema de Pagos

### 4.1 Métodos de Pago

| Método | Cómo funciona | Comisión pasarela | Riesgo |
|--------|--------------|-------------------|--------|
| **Tarjeta (CARD)** | Pago online con débito/crédito vía pasarela | 2-3% | Bajo |
| **PSE** | Débito desde cuenta bancaria colombiana | 1-2% | Bajo |
| **Nequi** | Pago desde app Nequi | 1-1.5% | Bajo |
| **Transferencia** | Cliente transfiere a cuenta de la plataforma y sube comprobante | 0% | Medio (requiere verificación manual) |
| **Contraentrega (CASH)** | Cliente paga en efectivo al domiciliario | 0% pasarela | Alto (manejo de efectivo) |

### 4.2 Flujo Financiero para Cada Método

#### Tarjeta / PSE / Nequi

```
CLIENTE                        PLATAFORMA                      COMERCIO / DOMICILIARIO
   │                               │                                  │
   ├── Pago $100.000 ─────────────►│                                  │
   │    (vía pasarela)             │                                  │
   │                               ├── Pasarela descuenta 2-3%        │
   │                               │    (ej: $2.500)                  │
   │                               │                                  │
   │                               │  ┌── Plataforma retiene su       │
   │                               │  │   comisión (ej: 10% = $10.000)│
   │                               │  │                              │
   │                               ├──► Al DELIVERED:                 │
   │                               │   ├── Pago a comercio: $82.000   │
   │                               │   │   (a su cuenta bancaria)     │
   │                               │   └── Pago a domiciliario: $8.000│
   │                               │       (a su Wallet)             │
   │                               │                              │
   │                               ├── Plataforma se queda $10.000  │
   │                               │   (comisión)                  │
```

#### Contraentrega (Efectivo)

```
CLIENTE                        DOMICILIARIO                    COMERCIO / PLATAFORMA
   │                               │                                  │
   ├── Paga $100.000 en ──────────►│                                  │
   │    efectivo al domiciliario   │                                  │
   │                               ├── Domiciliario se queda          │
   │                               │    sus $8.000 de ganancia        │
   │                               │                                  │
   │                               ├── Domiciliario tiene que         │
   │                               │    entregar $92.000 a la         │
   │                               │    plataforma                     │
   │                               │                                  │
   │                               │  ┌── Esto se descuenta de su     │
   │                               │  │   Wallet (saldo acumulado)    │
   │                               │  │   o se declara como deuda     │
   │                               │  │                              │
   │                               ├── Plataforma recibe $92.000     │
   │                               │   ├── Paga al comercio: $82.000 │
   │                               │   └── Se queda: $10.000         │
```

> **Problema a resolver:** En contraentrega el domiciliario maneja efectivo. La plataforma necesita un mecanismo para que el domiciliario entregue el dinero. Soluciones posibles:
> - **Descuento automático de Wallet:** Los pagos contraentrega se descuentan del saldo acumulado del domiciliario en la plataforma
> - **Código QR de pago:** El domiciliario escanea un QR en la app que descuenta de su Wallet automáticamente
> - **Liquidación semanal:** Al final de la semana, se calcula cuánto debe entregar el domiciliario vs cuánto ha ganado

#### Transferencia Bancaria

```
CLIENTE                        PLATAFORMA                      COMERCIO
   │                               │                                  │
   ├── Ve datos bancarios ────────►│                                  │
   │    de la plataforma           │                                  │
   │                               │                                  │
   ├── Transfiere $100.000 ───────►│  (a la cuenta de la plataforma)  │
   │    (por su banco)            │                                  │
   │                               │                                  │
   ├── Sube comprobante ─────────►│                                  │
   │    (foto o PDF)              ├── Admin o comercio verifica       │
   │                               │    el comprobante                │
   │                               │    ✓ Válido → orden avanza       │
   │                               │    ✗ Inválido → se rechaza       │
   │                               │                                  │
   │                               ├── (misma distribución que digital)│
   │                               │   └── $82.000 comercio           │
   │                               │   └── $8.000 domiciliario       │
   │                               │   └── $10.000 plataforma        │
```

### 4.3 Wallet del Domiciliario

Cada domiciliario tiene una billetera virtual que acumula sus ganancias:

| Evento | Wallet |
|--------|--------|
| Pedido entregado (digital) | +$8.000 |
| Pedido entregado (efectivo) | +$8.000 (pero debe $92.000 a la plataforma) |
| Entrega de efectivo a plataforma | -$92.000 |
| Retiro solicitado | -saldo_retirado |
| Propina recibida | +propina |

**Reglas del Wallet:**
- El saldo se libera automáticamente después de cada entrega exitosa
- El domiciliario puede solicitar retiro cuando el saldo supere $50.000
- Los pagos se procesan cada semana (lunes) a la cuenta bancaria registrada
- El saldo no puede ser negativo: si debe efectivo, se descuenta de pedidos futuros

### 4.4 Liquidaciones a Comercios

- Período de liquidación: **semanal** (lunes a domingo, pago el lunes siguiente)
- Cada comercio ve en su dashboard el acumulado de la semana
- El pago se realiza a la cuenta bancaria registrada
- Se genera un comprobante de liquidación disponible para descargar

### 4.5 Comisiones de la Plataforma

| Plan del Comercio | Comisión Base | Beneficios |
|------------------|---------------|------------|
| **Gratis** | 15% por pedido | Catálogo básico, hasta 50 pedidos/mes |
| **Básico** | 10% por pedido | Catálogo completo, analytics, sin límite de pedidos |
| **Premium** | 7% por pedido | Prioridad en búsqueda, soporte prioritario, promociones |

> Adicional: la plataforma puede cobrar una tarifa fija por domicilio ($1.000-$2.000) que se suma al `delivery_fee`.

---

## 5. Modelo de Negocio y Ganancias

### 5.1 Fuentes de Ingreso de la Plataforma

| Fuente | Descripción | Ejemplo |
|--------|-------------|---------|
| **Comisión por pedido** | Porcentaje del total de cada orden | 10% de $100.000 = $10.000 |
| **Suscripciones premium** | Planes mensuales para comercios | Básico $50.000/mes, Premium $150.000/mes |
| **Tarifa de domicilio** | Cargo fijo por entrega | $1.500 por pedido |
| **Publicidad** | Comercios pagan por aparecer destacados | Próximamente |
| **Multi-municipio** | Comisión adicional por expansión | Próximamente |

### 5.2 Distribución de Cada Pedido ($100.000)

```
                    $100.000 (Cliente paga)
                           │
                ┌──────────┴──────────┐
                │                     │
           Pasarela 2.5%         $97.500
           ($2.500)                  │
                    ┌────────────────┼────────────────┐
                    │                │                │
              Plataforma         Comercio        Domiciliario
                $14.500          $73,500           $9,500
                    │                │                │
          ┌─────────┴──┐         ┌────┴────┐      ┌──┴───┐
          │            │         │         │      │      │
      Comisión    Tarifa     Neto     Paga     Gana  Descuenta
      10% +      $1.500    comercio  pasarela  $8.000  efectivo?
      $10.000              $74.000   $2.500   +      (si CASH)
                               │      (ya     propinas
                               │    descontado)
                               │
                          Recibe $74.000
                          (neto después de todo)
```

### 5.3 Ejemplo de Rentabilidad Mensual

Escenario: **500 pedidos/día**, ticket promedio **$80.000**, 30% CASH, 70% digital

| Concepto | Cálculo | Monto Mensual |
|----------|---------|---------------|
| Volumen total | 500 × 30 × $80.000 | $1.200M |
| Ingreso comisión (10% promedio) | $1.200M × 10% | $120M |
| Ingreso tarifa domicilio ($1.500) | 500 × 30 × $1.500 | $22.5M |
| Ingreso suscripciones | 50 comercios × $50.000 | $2.5M |
| **Ingreso bruto plataforma** | | **$145M** |
| Costo pasarela (2.5% × 70%) | $1.200M × 70% × 2.5% | ($21M) |
| Costo operación (servidores, personal) | Estimado | ($25M) |
| **Margen estimado** | | **~$99M/mes** |

---

## 6. Funcionalidades por Actor

### 6.1 App del Cliente (Mobile)

| Pantalla | Funcionalidades |
|----------|----------------|
| **Home** | Tiendas activas cerca, categorías, búsqueda, promociones |
| **Catálogo** | Productos por tienda, opciones, precios |
| **Carrito** | Resumen, editar cantidades, aplicar descuentos, elegir método de pago |
| **Checkout** | Dirección de entrega, método de pago, notas, confirmar |
| **Tracking** | Mapa con ubicación del domiciliario en tiempo real, ETA |
| **Chat** | Conversación con el domiciliario |
| **Historial** | Pedidos anteriores, estado, detalle |
| **Calificar** | Rating + comentario para comercio y domiciliario, propina |
| **Perfil** | Datos personales, direcciones guardadas, métodos de pago |

### 6.2 Web App del Comercio (Dashboard Web)

| Pantalla | Funcionalidades |
|----------|----------------|
| **Dashboard** | Pedidos hoy, ingresos hoy, pedidos pendientes, alertas |
| **Pedidos entrantes** | Lista en tiempo real, aceptar/rechazar, cambiar estados |
| **Catálogo** | CRUD de productos, categorías, opciones, precios, fotos |
| **Analytics** | Ventas por día/semana/mes, productos top, tendencias |
| **Liquidaciones** | Historial de pagos recibidos, próximos pagos, descargar reportes |
| **Configuración** | Horarios, radio de entrega, plan, cuenta bancaria, datos del negocio |

### 6.3 App del Domiciliario (Mobile)

| Pantalla | Funcionalidades |
|----------|----------------|
| **Disponibilidad** | Toggle conectado/desconectado |
| **Pedido asignado** | Detalles del pedido, dirección de recogida y entrega |
| **Navegación** | Ruta al comercio, ruta al cliente |
| **Tracking** | Envío automático de GPS (background) |
| **Chat** | Conversación con el cliente |
| **Estados** | Botones: Recogido, Entregado |
| **Historial** | Pedidos completados, ganancias, calificaciones |
| **Wallet** | Saldo actual, historial de transacciones, solicitar retiro |
| **Estadísticas** | Calificación promedio, tasa de completados, pedidos hoy |

### 6.4 Panel Administrativo (Web)

| Pantalla | Funcionalidades |
|----------|----------------|
| **Dashboard global** | Pedidos totales, ingresos, usuarios activos, mapa de calor |
| **Municipios** | CRUD de municipios, activar/desactivar, configurar radio |
| **Comercios** | Aprobar, suspender, configurar comisión y plan |
| **Domiciliarios** | Aprobar, suspender, ver historial y estadísticas |
| **Transferencias** | Ver comprobantes pendientes, verificar o rechazar |
| **Disputas** | Gestionar disputas abiertas, mediar, resolver |
| **Liquidaciones** | Procesar pagos a comercios y domiciliarios |
| **Reportes** | Exportar datos, generar reportes personalizados |

---

## 7. Casos Especiales y Excepciones

### 7.1 Cancelaciones

| Quién cancela | Cuándo | Consecuencia financiera |
|--------------|--------|------------------------|
| **Cliente** | Antes de `ACCEPTED` | Sin cargo, reembolso total si pagó |
| **Cliente** | Después de `ACCEPTED`, antes de `READY` | Cargo del 50% al cliente (penalización) |
| **Cliente** | Después de `READY` o asignado | Cargo del 100% al cliente |
| **Comercio** | Rechaza pedido | Sin cargo al cliente, posible penalización al comercio |
| **Plataforma** | Por alguna contingencia | Reembolso total al cliente |

### 7.2 Devoluciones y Reembolsos

- **Producto incorrecto/dañado:** Reembolso parcial o total al cliente
- **Pedido incompleto:** Reembolso proporcional de los items faltantes
- **Retraso extremo (>60 min):** Descuento del delivery_fee
- **Disputas resueltas:** El administrador decide el monto del reembolso

### 7.3 Bloqueo de Domiciliarios

| Condición | Acción |
|-----------|--------|
| 3 rechazos consecutivos | Bloqueo 15 minutos |
| Calificación < 3.0 por más de 30 días | Revisión del administrador |
| No reportar entrega en más de 2 horas | Alerta y posible suspensión |
| Quejas recurrentes de clientes | Suspensión temporal |

### 7.4 Suspención de Comercios

| Condición | Acción |
|-----------|--------|
| Rechazar más del 30% de pedidos en un día | Advertencia automática |
| Calificación < 2.5 por más de 15 días | Revisión, posible desactivación |
| Incumplimiento en entregas | Penalización, posible suspensión del plan Premium |

---

## 8. Sistema de Métricas y Analytics

### 8.1 Métricas en Tiempo Real (Dashboard)

| Métrica | Descripción | Alerta si |
|---------|-------------|-----------|
| Pedidos/hora | Órdenes creadas en la última hora | < 10 en hora pico |
| Tiempo promedio de entrega | Desde creación hasta DELIVERED | > 60 minutos |
| Tasa de asignación | Pedidos asignados / READY | < 80% |
| Domiciliarios conectados | Disponibles ahora | < 5 en el municipio |
| Tasa de cancelación | Cancelados / Totales | > 15% |

### 8.2 Reportes Automáticos (Celery)

| Reporte | Frecuencia | Datos |
|---------|------------|-------|
| Ventas diarias por tienda | Cada 12h | Órdenes, ingresos, comisión, ticket promedio |
| Rendimiento domiciliarios | Cada 12h | Entregas, ganancias, tiempo promedio, distancia |
| Estadísticas por municipio | Cada 12h | Órdenes, tiendas activas, couriers activos, ingresos |
| Liquidación semanal | Cada lunes | Resumen de pagos a comercios y domiciliarios |

### 8.3 Datos para el Administrador

- **Mapa de calor:** Concentración de pedidos por zona/municipio
- **Horas pico:** Distribución de pedidos por hora del día
- **Top comercios:** Por volumen, ingresos, calificación
- **Top domiciliarios:** Por entregas, calificación, eficiencia
- **Tendencias:** Crecimiento semanal/mensual de usuarios, pedidos, ingresos

---

## 9. Seguridad y Confianza

### 9.1 Autenticación

- **JWT** con access token (15 min) + refresh token (7 días)
- **HttpOnly cookies** para tokens (protección XSS)
- **Rate limiting** por IP y por usuario (100 POST/hora)
- **Verificación** de email y teléfono (opcional pero recomendada)

### 9.2 Protección de Pagos

- Los datos de tarjeta nunca tocan el servidor de Kinetik (van directo a la pasarela)
- Las cuentas bancarias de la plataforma solo las ve el administrador
- Los comprobantes de transferencia los ve solo el admin y el comercio involucrado
- Cada transacción queda registrada con auditoría (quién, cuándo, qué)

### 9.3 Protección de Datos

- Contraseñas hasheadas con PBKDF2 (Django default)
- Datos personales mínimos: solo lo necesario para el funcionamiento
- Cumplimiento de ley de protección de datos (Ley 1581 en Colombia)

### 9.4 Confianza en el Servicio

- SLA: 99.5% uptime para el backend
- Notificaciones push garantizadas para cambios de estado críticos
- Sistema de calificaciones público y transparente
- Disputas resueltas en máximo 48 horas

---

## 10. Mejoras Futuras y Roadmap

### 10.1 Mejoras Priorizadas (Corto Plazo — 3 meses)

| Prioridad | Mejora | Impacto |
|-----------|--------|---------|
| 🔴 Alta | **Integración real de pasarela de pagos** (Wompi/PayU) | Elimina la simulación, permite flujo real de dinero |
| 🔴 Alta | **Sistema de Wallet para domiciliarios** | Permite gestión de efectivo y pagos contraentrega |
| 🔴 Alta | **Notificaciones push reales** (FCM/APNs) | Mejora la experiencia del usuario |
| 🟡 Media | **Sistema de propinas** para domiciliarios | Aumenta ingresos de couriers, mejora retención |
| 🟡 Media | **Chat cliente ↔ comercio** | Comunicación directa para sustitutos o dudas |

### 10.2 Mejoras Estratégicas (Mediano Plazo — 6 meses)

| Prioridad | Mejora | Impacto |
|-----------|--------|---------|
| 🔴 Alta | **Sistema de suscripciones para comercios** | Ingreso recurrente para la plataforma |
| 🟡 Media | **Programa de fidelización (puntos)** | Retención de clientes |
| 🟡 Media | **Pedidos programados** | Mayor volumen de pedidos |
| 🟢 Baja | **Multi-idioma** (inglés, portugués) | Expansión internacional |
| 🟢 Baja | **Dashboard de marketing** (cupones, promociones) | Atracción de clientes |

### 10.3 Mejoras de Escalabilidad (Largo Plazo — 12 meses)

| Prioridad | Mejora | Impacto |
|-----------|--------|---------|
| 🔴 Alta | **Soporte multi-municipio completo** | Escalado a nuevas ciudades |
| 🟡 Media | **Algoritmo de asignación con H3** (Uber) | Optimización para >500 couriers |
| 🟡 Media | **Migración a microservicios** si aplica | Escalado independiente por servicio |
| 🟢 Baja | **Inteligencia artificial para ETA dinámico** | Precisión en tiempos de entrega |
| 🟢 Baja | **Optimización de rutas multi-pedido** | Un courier con múltiples entregas |

### 10.4 Ideas Innovadoras

| Idea | Descripción |
|------|-------------|
| **Modo "Express"** | Cliente paga tarifa extra para prioridad en asignación |
| **Suscripción "Delivery Ilimitado"** | Tarifa fija mensual para domicilios gratis |
| **Kinetik Market** | Comercio puede comprar insumos a mayoreo desde la plataforma |
| **Kinetik Fleet** | La plataforma ofrece vehículos en alquiler a domiciliarios |
| **Kinetik Pay** | Billetera digital dentro de la app para pagos rápidos |
| **Kinetik Ads** | Publicidad dentro de la app para comercios |
| **Cámaras en tiempo real** | El comercio puede mostrar su cocina en vivo (transparencia) |
| **Donación a organizaciones** | Redondear el total para donar a causas sociales |

### 10.5 Arquitectura Técnica Actual vs Futura

| Componente | Actual | Futuro (12 meses) |
|------------|--------|-------------------|
| **API** | Django monolítico (13 apps) | Posiblemente microservicios (pagos, órdenes, couriers) |
| **Base de datos** | PostgreSQL + PostGIS | PostgreSQL + read replicas + sharding por municipio |
| **Caché** | Redis (simple) | Redis Cluster |
| **Tareas** | Celery (single worker) | Celery + multiples workers por tipo |
| **WebSockets** | Daphne + Redis | Escalado horizontal con Channels |
| **Pagos** | Simulado | Wompi / PayU / Stripe real |
| **Búsqueda** | ORM queries | Elasticsearch para búsqueda de productos |
| **Frontend** | No implementado (estructura vacía) | React Native (mobile) + React web |
| **Infraestructura** | Docker Compose | Kubernetes (EKS) |
| **Monitoreo** | No implementado | Sentry + Prometheus + Grafana |
| **CI/CD** | No implementado | GitHub Actions + ArgoCD |

---

## 11. Glosario

| Término | Definición |
|---------|------------|
| **Cliente** | Usuario que solicita productos a domicilio |
| **Comercio** | Negocio que vende productos a través de la plataforma |
| **Domiciliario / Courier** | Repartidor que realiza las entregas |
| **Pedido / Orden** | Solicitud de compra con uno o más productos |
| **Wallet** | Billetera virtual del domiciliario para acumular ganancias |
| **Payout** | Pago a un comercio o domiciliario |
| **Settlement** | Liquidación periódica (semanal) de pagos |
| **Pasarela de pago** | Servicio externo que procesa pagos online (Stripe, Wompi, PayU) |
| **ETA** | Estimated Time of Arrival — Tiempo estimado de llegada |
| **Score de asignación** | Puntuación compuesta para elegir al mejor domiciliario |
| **Comisión** | Porcentaje que cobra la plataforma por cada pedido |
| **Contraentrega** | Pago en efectivo al momento de recibir el pedido |
| **Transferencia** | Pago mediante transferencia bancaria con verificación manual |
| **Disputa** | Reclamación formal de un cliente sobre un pedido |
| **Plan / Suscripción** | Nivel de servicio del comercio (Gratis/Básico/Premium) |
| **Municipio** | Ciudad o área geográfica donde opera la plataforma |
| **Radio de cobertura** | Distancia máxima desde el comercio para entregas |
| **Tracking GPS** | Seguimiento de ubicación del domiciliario en tiempo real |

---

*Documento generado para alineación estratégica con socios e inversionistas.*
*Kinetik — Plataforma de Domicilios Multi-Municipio*
