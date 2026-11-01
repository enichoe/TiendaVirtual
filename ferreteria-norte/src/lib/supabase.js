/**
 * ============================================================
 * supabase.js — Inicialización del cliente Supabase
 * ============================================================
 *
 * PROPÓSITO:
 * Conectar la aplicación web con la base de datos PostgreSQL en la nube de Supabase.
 * Permite cargar las categorías y los productos de forma dinámica y en tiempo real.
 *
 * ARQUITECTURA "ZERO-FAIL":
 * Si las variables de entorno `VITE_SUPABASE_URL` o `VITE_SUPABASE_ANON_KEY`
 * no están definidas, este cliente devolverá `null` de forma segura.
 * Cuando es `null`, la tienda automáticamente recurre a los datos locales
 * de muestra (`src/data/products.js`), permitiendo que el proyecto funcione
 * al 100% como catálogo de prueba sin necesidad de crear una cuenta en Supabase.
 *
 * CÓMO CONFIGURAR SUPABASE:
 * 1. Crea un proyecto gratuito en https://supabase.com
 * 2. Ve al SQL Editor y ejecuta el script que viene en `supabase/schema.sql`.
 * 3. Copia la URL del proyecto y la anon/public key desde Project Settings > API.
 * 4. Crea un archivo `.env.local` en la raíz del proyecto y escribe:
 *      VITE_SUPABASE_URL=https://tu-id-aqui.supabase.co
 *      VITE_SUPABASE_ANON_KEY=tu-clave-anon-aqui
 * 5. Reinicia el servidor con `npm run dev`.
 *
 * SEGURIDAD:
 * Nunca coloques claves con rol `service_role` ni contraseñas maestras aquí.
 * La clave `anon` es pública y segura gracias a las políticas RLS (Row Level Security)
 * definidas en `schema.sql`.
 */

import { createClient } from '@supabase/supabase-js';

// Lectura de variables de entorno inyectadas por Vite (prefijo VITE_)
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Verificamos que existan y que no contengan los valores por defecto del ejemplo
export const supabase =
  url && key && !url.includes('TU-PROYECTO')
    ? createClient(url, key)
    : null;
