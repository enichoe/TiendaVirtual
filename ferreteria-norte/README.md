# 🛠️ Ferretería Norte — Plantilla E-Commerce Moderna con Pedidos a WhatsApp

Una tienda virtual moderna, modular, ultrarrápida y responsive diseñada para negocios locales y ferreterías que buscan vender por internet sin la complejidad ni comisiones de pasarelas de pago tradicionales.

> **💡 Flujo Central:** El comprador navega por el catálogo, filtra por categoría, busca productos en tiempo real, añade artículos al carrito y finaliza su compra en un checkout amigable. Al presionar **"Completar pedido por WhatsApp"**, se genera automáticamente un enlace codificado con el detalle exacto de su compra y sus datos de entrega directo al WhatsApp del negocio.

---

## 🌟 Características Principales

- **Diseño Moderno & "Industrial Dark"**:
  - Paleta de colores seleccionada en tonos carbón, detalles en ámbar/naranja de advertencia ferretera y verde esmeralda para acciones de compra y WhatsApp.
  - Efectos de *Glassmorphism* (desenfoque de fondo y bordes translúcidos).
  - Micro-animaciones en tarjetas de productos, botones interactivos y modales flotantes.
  - Tipografía profesional (*Inter* para lectura nítida y *Space Grotesk* para titulares con personalidad técnica).
- **Carrito de Compras Persistente**:
  - Almacena automáticamente los artículos en `localStorage` para que el cliente no pierda su selección si recarga la página.
  - Drawer lateral deslizable con control de unidades (+ / -), vaciado de carrito y cálculo automático de subtotales.
- **Checkout Integrado para WhatsApp**:
  - Formulario con validación de nombre, dirección de despacho y teléfono.
  - Generación de mensaje codificado para WhatsApp con viñetas, desglose de cantidades, precios formateados en Soles (PEN) y total referencial.
- **Modal de Detalle Rápido de Producto**:
  - Vista expandida con descripción técnica completa, estado de stock en tiempo real y selector de cantidades.
- **Filtros y Búsqueda en Vivo**:
  - Barra de búsqueda instantánea por nombre o descripción.
  - Filtro por categorías con iconos.
  - Ordenamiento por: Destacados, Menor precio, Mayor precio o Nombre (A-Z).
- **Métodos de Pago Nacionales (Perú)**:
  - Información clara para pagos vía BCP, Interbank, BBVA, Yape y Plin con recordatorio de envío de comprobante.
- **Arquitectura Dual (Offline / Supabase)**:
  - Funciona al instante con datos de muestra locales (`src/data/products.js`).
  - Listo para conectarse a Supabase si deseas administrar tu inventario en la nube.
- **Código 100% Comentado**:
  - Cada archivo, función y bloque clave está documentado con JSDoc y notas pedagógicas para servir como plantilla y base para proyectos futuros.

---

## 📁 Estructura del Proyecto

```text
ferreteria-norte/
├── .env.example               # Plantilla de variables de entorno
├── index.html                 # HTML semántico, SEO, Open Graph y Google Fonts
├── package.json               # Dependencias (React 19, Vite, Lucide React, Supabase)
├── README.md                  # Manual completo del proyecto y arquitectura
├── src/
│   ├── main.jsx               # Punto de entrada de React con StrictMode
│   ├── App.jsx                # Componente principal (estado, header, catálogo, modales)
│   ├── styles.css             # Sistema de diseño con CSS moderno, variables y animaciones
│   ├── data/
│   │   ├── products.js        # Catálogo de muestra y esquema del producto
│   │   └── paymentDetails.js  # Configuración de cuentas bancarias y números de Yape/Plin
│   └── lib/
│       ├── supabase.js        # Cliente seguro de Supabase con fallback automático
│       └── whatsapp.js        # Generador de enlaces 'wa.me' con mensaje formateado
└── supabase/
    └── schema.sql             # Tablas, índices, triggers y políticas RLS para PostgreSQL
```

---

## 🚀 Inicio Rápido (Desarrollo Local)

### 1. Clonar o descargar el repositorio
```bash
git clone <url-del-repositorio>
cd ferreteria-norte
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno (Opcional)
Copia el archivo `.env.example` como `.env.local`:
```bash
cp .env.example .env.local
```

Configura tus variables en `.env.local`:
```env
# Número de WhatsApp del negocio (sin signos +, sin espacios ni guiones)
# Ejemplo para Perú (+51 987 654 321):
VITE_WHATSAPP_NUMBER=51987654321

# Nombre comercial que aparecerá en el encabezado y en los mensajes
VITE_STORE_NAME=Ferretería Norte

# (Opcional) Credenciales de tu proyecto Supabase:
# VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
# VITE_SUPABASE_ANON_KEY=eyJh......
```

> **Nota:** Si no configuras Supabase, la tienda cargará automáticamente el catálogo local de muestra incluido en `src/data/products.js`.

### 4. Iniciar el servidor local
```bash
npm run dev
```
Abre tu navegador en `http://localhost:5173`.

---

## 📱 Cómo Funciona el Flujo de WhatsApp

1. **Selección**: El cliente explora los productos y hace clic en **"Agregar"**.
2. **Revisión**: En el botón flotante o en el header abre el carrito para verificar sus productos y total.
3. **Checkout**: Presiona **"Ir a pagar"** y rellena su Nombre, Dirección y Teléfono.
4. **Envío de Orden**: Al presionar **"Completar pedido por WhatsApp"**, se ejecuta `buildWhatsAppUrl()` (`src/lib/whatsapp.js`) que:
   - Valida y limpia el número telefónico del comercio.
   - Crea un texto estructurado en Markdown de WhatsApp con emojis y saltos de línea.
   - Abre una pestaña con la URL oficial de WhatsApp (`https://wa.me/<número>?text=<mensaje_codificado>`).
5. **Cierre de Venta**: El asesor de la ferretería recibe el mensaje, confirma el stock físico, cotiza el flete según la dirección y le solicita el voucher de pago de Yape/Plin o transferencia bancaria.

---

## 🗄️ Conexión con Base de Datos (Supabase)

Si deseas gestionar tu catálogo desde una base de datos en la nube:

1. Crea una cuenta gratuita en [Supabase](https://supabase.com).
2. Crea un nuevo proyecto.
3. Dirígete a la sección **SQL Editor** en el panel de Supabase.
4. Pega y ejecuta el contenido completo del archivo [`supabase/schema.sql`](./supabase/schema.sql).
5. Copia tu **Project URL** y **anon key** desde *Project Settings > API*.
6. Colócalas en tu archivo `.env.local`.
7. Reinicia el servidor con `npm run dev`.

Las políticas de seguridad **RLS (Row Level Security)** ya vienen configuradas para que cualquier visitante pueda leer los productos activos, mientras que la modificación y eliminación están restringidas exclusivamente al administrador.

---

## 🎨 Guía de Adaptación para Futuros Proyectos

Para reutilizar esta plantilla en otro rubro (ej. tienda de ropa, repuestos, farmacia, florería):

1. **Colores y Estilo**:
   - En `src/styles.css`, ajusta las variables `--primary` (color de acento), `--bg-page` (fondo general) y `--font-heading` (tipografía de títulos).
2. **Nombre de la Tienda**:
   - Modifica `VITE_STORE_NAME` en `.env.local` y los metadatos en `index.html`.
3. **Cuentas de Pago**:
   - Edita `src/data/paymentDetails.js` con las cuentas bancarias y teléfonos de billeteras digitales correspondientes.
4. **Catálogo**:
   - Si es offline, edita los objetos en `src/data/products.js`.
   - Si es online, inserta los nuevos registros en tu tabla `productos` de Supabase.

---

## 📦 Construcción para Producción

Para compilar el proyecto optimizado para desplegar en Vercel, Netlify o cualquier servidor web:

```bash
npm run build
```

Los archivos finales listos para servir se generarán en la carpeta `dist/`.

---

© 2026 Ferretería Norte — Plantilla construida con React, Vite y CSS nativo de alto rendimiento.
