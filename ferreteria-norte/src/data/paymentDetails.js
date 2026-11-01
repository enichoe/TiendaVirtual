/**
 * ============================================================
 * paymentDetails.js — Configuración de Métodos de Pago
 * ============================================================
 *
 * PROPÓSITO:
 * Centralizar la información bancaria y billeteras digitales del negocio.
 * Esta información se muestra en la sección de métodos de pago y dentro del
 * modal de confirmación para facilitar el pago al comprador antes de enviar el voucher.
 *
 * CÓMO ADAPTARLO PARA FUTUROS PROYECTOS:
 * 1. Sustituye los textos de ejemplo por las cuentas y teléfonos oficiales.
 * 2. Si manejas otros bancos (Scotiabank, BanBif, Banco de la Nación),
 *    puedes agregar un nuevo objeto dentro del array `banks`.
 * 3. Si tienes códigos QR de Yape/Plin, puedes agregar la propiedad `qrImage`
 *    y renderizarla en la interfaz.
 */

export const paymentDetails = {
  // Transferencias interbancarias y depósitos bancarios
  banks: [
    {
      name: 'BCP (Banco de Crédito del Perú)',
      account: '191-XXXXXXXX-0-XX',
      cci: '002-191-XXXXXXXXXXXX-XX',
      beneficiary: 'Ferretería Norte S.A.C.',
    },
    {
      name: 'Interbank',
      account: '200-XXXXXXXXXX',
      cci: '003-200-XXXXXXXXXXXX-XX',
      beneficiary: 'Ferretería Norte S.A.C.',
    },
    {
      name: 'BBVA',
      account: '0011-XXXX-XXXXXXXXXX',
      cci: '011-XXX-XXXXXXXXXXXXXXXX-XX',
      beneficiary: 'Ferretería Norte S.A.C.',
    },
  ],

  // Billeteras móviles (pago instantáneo con número de celular o código QR)
  wallets: [
    {
      name: 'Yape',
      phone: '987 654 321',
      holder: 'Ferretería Norte',
    },
    {
      name: 'Plin',
      phone: '987 654 321',
      holder: 'Ferretería Norte',
    },
  ],
};
