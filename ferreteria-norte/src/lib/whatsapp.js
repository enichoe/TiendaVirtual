/**
 * ============================================================
 * whatsapp.js — Generador de mensajes y enlaces para WhatsApp
 * ============================================================
 *
 * PROPÓSITO:
 * Este módulo se encarga de convertir los datos del carrito de compras
 * y la información del cliente en un mensaje estructurado y legible,
 * generando un enlace `wa.me` para abrir WhatsApp de forma inmediata.
 *
 * CÓMO FUNCIONA EL FLUJO:
 * 1. El cliente llena sus datos (Nombre, Dirección, Teléfono) en el Checkout.
 * 2. Esta función recibe los datos y normaliza el número de WhatsApp receptor
 *    (limpia cualquier caracter no numérico como espacios, guiones o signos +).
 * 3. Se formatea cada línea con negritas en markdown (`*TEXTO*`), viñetas (`•`)
 *    y formato de moneda peruana (PEN).
 * 4. La cadena completa se codifica usando `encodeURIComponent` para que sea
 *    un enlace web seguro y compatible con cualquier navegador o móvil.
 *
 * USO COMO BASE PARA OTROS PROYECTOS:
 * - Para cambiar la moneda: modifica `Intl.NumberFormat('es-PE', { ... })`.
 * - Para añadir campos al formulario (ej. RUC, DNI, Método de entrega):
 *   simplemente agrégalos a las líneas generadas en `lines`.
 */

// Formateador de moneda para Soles Peruanos (PEN)
const PEN = new Intl.NumberFormat('es-PE', {
  style: 'currency',
  currency: 'PEN',
});

/**
 * Genera el enlace de WhatsApp listo para abrir el chat con el pedido.
 *
 * @param {Object} params - Parámetros del pedido
 * @param {Object} params.customer - Información de contacto del comprador
 * @param {string} params.customer.nombre - Nombre completo o empresa
 * @param {string} params.customer.direccion - Dirección de despacho o entrega
 * @param {string} params.customer.telefono - Celular de contacto del comprador
 * @param {Array<{product: Object, quantity: number}>} params.items - Artículos en el carrito
 * @param {number} params.total - Importe total a pagar
 * @param {string} params.phone - Número de WhatsApp del negocio (ej. '51987654321')
 * @param {string} [params.storeName='Ferretería Norte'] - Nombre comercial de la tienda
 * @returns {string} URL formateada (https://wa.me/...) lista para window.open()
 */
export function buildWhatsAppUrl({ customer, items, total, phone, storeName = 'Ferretería Norte' }) {
  // WhatsApp espera el número internacional únicamente en dígitos (sin '+', espacios ni guiones)
  const normalizedPhone = String(phone || '').replace(/\D/g, '');

  if (!normalizedPhone) {
    throw new Error(
      'Configura VITE_WHATSAPP_NUMBER con el número internacional del negocio (ej. 51987654321).'
    );
  }

  // Estructura del mensaje en formato WhatsApp Markdown
  const lines = [
    `👋 *¡Hola! Quiero confirmar un pedido en ${storeName}:*`,
    '',
    '📋 *DATOS DEL CLIENTE*',
    `• *Nombre:* ${customer.nombre.trim()}`,
    `• *Dirección de envío:* ${customer.direccion.trim()}`,
    `• *Teléfono de contacto:* ${customer.telefono.trim()}`,
    '',
    '🛒 *DETALLE DEL PEDIDO*',
    ...items.map(
      ({ product, quantity }) =>
        `• ${quantity}x ${product.nombre} — ${PEN.format(product.precio * quantity)}`
    ),
    '',
    `💰 *TOTAL ESTIMADO: ${PEN.format(total)}*`,
    '',
    '📌 *PASOS SIGUIENTES:*',
    '1. Por favor confirmar disponibilidad y costo de envío a mi dirección.',
    '2. Enviaré el comprobante/voucher por este chat si pago vía Yape, Plin o Transferencia bancaria.',
    '',
    '¡Muchas gracias! 🙏',
  ];

  // Se une con saltos de línea y se escapa para parámetro URL query (?text=...)
  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(lines.join('\n'))}`;
}
