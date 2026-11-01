/**
 * ============================================================
 * products.js — Catálogo local de muestra y estructura de datos
 * ============================================================
 *
 * PROPÓSITO:
 * Sirve como fallback offline cuando Supabase no está conectado y como
 * referencia de la estructura de datos requerida para el catálogo.
 *
 * ESTRUCTURA DE UNA CATEGORÍA:
 * {
 *   id: string,       // Identificador único (slug en minúsculas)
 *   nombre: string,   // Nombre visible al cliente
 *   icono: string,    // Emoji o nombre de icono
 * }
 *
 * ESTRUCTURA DE UN PRODUCTO:
 * {
 *   id: string,              // Identificador único (ej. 'p-01' o UUID)
 *   nombre: string,          // Nombre comercial del producto
 *   descripcion: string,     // Descripción técnica o de uso
 *   precio: number,          // Precio de venta actual en Soles (PEN)
 *   precio_anterior: number, // (Opcional) Precio tachado para mostrar descuento
 *   imagen_url: string,      // Enlace a imagen en alta calidad (Unsplash / Supabase Storage)
 *   categoria_id: string,    // Relación con `sampleCategories.id`
 *   stock: number,           // Unidades disponibles para la venta
 *   destacado: boolean,      // Si aparece con prioridad o insignia destacada
 *   etiqueta: string,        // (Opcional) Badge visual: 'Más vendido', 'Oferta', etc.
 * }
 */

export const sampleCategories = [
  { id: 'herramientas', nombre: 'Herramientas', icono: '🔧' },
  { id: 'construccion', nombre: 'Construcción', icono: '🧱' },
  { id: 'electricidad', nombre: 'Electricidad', icono: '💡' },
  { id: 'pinturas', nombre: 'Pinturas', icono: '🪣' },
  { id: 'plomeria', nombre: 'Plomería', icono: '🚿' },
];

export const sampleProducts = [
  {
    id: 'p-01',
    nombre: 'Taladro percutor 650W',
    descripcion: 'Ideal para perforar madera, metal y mampostería. Incluye mandril de 13 mm y empuñadura auxiliar ergonómica.',
    precio: 189.9,
    precio_anterior: 229.9,
    imagen_url: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=1000&q=85',
    categoria_id: 'herramientas',
    stock: 12,
    destacado: true,
    etiqueta: 'Más vendido',
  },
  {
    id: 'p-02',
    nombre: 'Caja de herramientas 16”',
    descripcion: 'Organizador de alto impacto con compartimentos transparentes, bandeja extraíble y cierres metálicos.',
    precio: 79.9,
    imagen_url: 'https://images.unsplash.com/photo-1581147036324-c1c89c2c8a6b?auto=format&fit=crop&w=1000&q=85',
    categoria_id: 'herramientas',
    stock: 20,
    destacado: true,
  },
  {
    id: 'p-03',
    nombre: 'Set de destornilladores x6',
    descripcion: 'Puntas planas y Phillips magnetizadas de acero cromo-vanadio con mango ergonómico antideslizante.',
    precio: 34.5,
    imagen_url: 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?auto=format&fit=crop&w=1000&q=85',
    categoria_id: 'herramientas',
    stock: 18,
    destacado: false,
  },
  {
    id: 'p-04',
    nombre: 'Cemento Portland tipo I 42.5 kg',
    descripcion: 'Especialmente formulado para cimentaciones, estructuras, columnas y obras generales de alta resistencia.',
    precio: 32.9,
    imagen_url: 'https://images.unsplash.com/photo-1517581177682-a085bb7ffb15?auto=format&fit=crop&w=1000&q=85',
    categoria_id: 'construccion',
    stock: 60,
    destacado: true,
    etiqueta: 'Precio especial',
  },
  {
    id: 'p-05',
    nombre: 'Nivel de aluminio tubular 24”',
    descripcion: 'Cuerpo reforzado con tres burbujas de alta visibilidad para nivelación horizontal, vertical y a 45 grados.',
    precio: 49.9,
    imagen_url: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=1000&q=85',
    categoria_id: 'construccion',
    stock: 9,
    destacado: false,
  },
  {
    id: 'p-06',
    nombre: 'Reflector LED industrial 50W',
    descripcion: 'Luz blanca fría 6500K con protección IP65 a prueba de agua y polvo. Ahorro energético del 85%.',
    precio: 45.0,
    imagen_url: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1000&q=85',
    categoria_id: 'electricidad',
    stock: 24,
    destacado: true,
  },
  {
    id: 'p-07',
    nombre: 'Cable eléctrico THW 14 AWG · 100 m',
    descripcion: 'Conductor de cobre electrolítico de 99.9% de pureza, aislante antiflama para instalaciones seguras.',
    precio: 129.9,
    imagen_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1000&q=85',
    categoria_id: 'electricidad',
    stock: 8,
    destacado: false,
  },
  {
    id: 'p-08',
    nombre: 'Pintura látex lavable blanco 1 galón',
    descripcion: 'Pintura premium de gran poder cubriente, secado rápido y acabado mate lavable para interiores y fachadas.',
    precio: 68.9,
    imagen_url: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=1000&q=85',
    categoria_id: 'pinturas',
    stock: 15,
    destacado: true,
  },
  {
    id: 'p-09',
    nombre: 'Grifería monocomando cuello de ganso',
    descripcion: 'Acabado en cromo brillante con cartucho cerámico durable y aireador ahorrador de agua con giro 360 grados.',
    precio: 149.9,
    imagen_url: 'https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=1000&q=85',
    categoria_id: 'plomeria',
    stock: 7,
    destacado: false,
  },
  {
    id: 'p-10',
    nombre: 'Juego de llaves ajustables Francesa x2',
    descripcion: 'Fabricadas en acero forjado con escala milimétrica grabada con láser y mecanismo de ajuste suave.',
    precio: 59.9,
    imagen_url: 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?auto=format&fit=crop&w=1000&q=85',
    categoria_id: 'herramientas',
    stock: 14,
    destacado: false,
  },
];
