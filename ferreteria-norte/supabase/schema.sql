-- ============================================================
-- FERRETERÍA NORTE / TIENDA VIRTUAL WHATSAPP - SCHEMA SUPABASE
-- ============================================================
-- Este archivo contiene la estructura completa de base de datos PostgreSQL
-- lista para ejecutar en el "SQL Editor" de tu proyecto en https://supabase.com
--
-- CARACTERÍSTICAS DE SEGURIDAD:
-- 1. Tablas protegidas con RLS (Row Level Security).
-- 2. Lectura pública (SELECT) limitada únicamente a productos y categorías marcados como "activos".
-- 3. Inserción, actualización y borrado bloqueados para visitantes públicos (anon).
--    Solo administradores desde Supabase Dashboard pueden modificar datos.
-- 4. Las cuentas bancarias y números de WhatsApp NO se guardan en BD pública;
--    se configuran en variables de entorno o archivos protegidos.
-- ============================================================

-- Habilitar extensión para generación de identificadores UUID
create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- 1. TABLA: categorias
-- ------------------------------------------------------------
create table if not exists public.categorias (
  id text primary key,                   -- Slug en minúsculas (ej: 'herramientas')
  nombre text not null unique,           -- Nombre visible (ej: 'Herramientas')
  icono text,                            -- Emoji o identificador de icono (ej: '🔧')
  orden integer not null default 0,      -- Orden de visualización en la barra
  activa boolean not null default true,  -- Ocultar/mostrar categoría sin borrarla
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 2. TABLA: productos
-- ------------------------------------------------------------
create table if not exists public.productos (
  id uuid primary key default gen_random_uuid(),
  categoria_id text references public.categorias(id) on update cascade on delete set null,
  nombre text not null,                                   -- Nombre comercial
  descripcion text not null default '',                   -- Detalle / ficha técnica
  precio numeric(10,2) not null check (precio >= 0),      -- Precio actual en Soles (PEN)
  precio_anterior numeric(10,2) check (precio_anterior is null or precio_anterior >= 0), -- Para tachar
  imagen_url text,                                        -- URL pública de la foto
  stock integer not null default 0 check (stock >= 0),    -- Unidades en inventario
  destacado boolean not null default false,               -- Mostrar en carrusel / destacados
  etiqueta text,                                          -- Badge: 'Más vendido', 'Oferta', etc.
  activo boolean not null default true,                   -- Si está publicado en catálogo
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 3. ÍNDICES PARA ALTA VELOCIDAD DE CONSULTA
-- ------------------------------------------------------------
create index if not exists productos_categoria_activo_idx on public.productos(categoria_id, activo);
create index if not exists productos_destacado_activo_idx on public.productos(destacado desc, activo);

-- ------------------------------------------------------------
-- 4. TRIGGER PARA ACTUALIZAR 'updated_at' AUTOMÁTICAMENTE
-- ------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin 
  new.updated_at = now(); 
  return new; 
end;
$$;

drop trigger if exists productos_set_updated_at on public.productos;
create trigger productos_set_updated_at 
before update on public.productos
for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- 5. POLÍTICAS DE SEGURIDAD (Row Level Security - RLS)
-- ------------------------------------------------------------
alter table public.categorias enable row level security;
alter table public.productos enable row level security;

-- Política: Visitantes y usuarios autenticados pueden LEER categorías activas
drop policy if exists "Public can read active categories" on public.categorias;
create policy "Public can read active categories" on public.categorias
for select to anon, authenticated using (activa = true);

-- Política: Visitantes y usuarios autenticados pueden LEER productos activos
drop policy if exists "Public can read active products" on public.productos;
create policy "Public can read active products" on public.productos
for select to anon, authenticated using (activo = true);

-- ------------------------------------------------------------
-- 6. DATOS INICIALES (CATEGORÍAS POR DEFECTO)
-- ------------------------------------------------------------
insert into public.categorias (id, nombre, icono, orden) values
  ('herramientas', 'Herramientas', '🔧', 1),
  ('construccion', 'Construcción', '🧱', 2),
  ('electricidad', 'Electricidad', '💡', 3),
  ('pinturas', 'Pinturas', '🪣', 4),
  ('plomeria', 'Plomería', '🚿', 5)
on conflict (id) do update set 
  nombre = excluded.nombre, 
  icono = excluded.icono, 
  orden = excluded.orden;

-- ------------------------------------------------------------
-- 7. PRODUCTOS DE EJEMPLO (OPCIONAL)
-- Descomenta y ejecuta si deseas poblar tu base de datos de inmediato:
-- ------------------------------------------------------------
/*
insert into public.productos (categoria_id, nombre, descripcion, precio, precio_anterior, imagen_url, stock, destacado, etiqueta) values
  ('herramientas', 'Taladro percutor 650W', 'Ideal para perforar madera, metal y mampostería. Mandril 13mm.', 189.90, 229.90, 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=1000&q=85', 12, true, 'Más vendido'),
  ('herramientas', 'Caja de herramientas 16”', 'Organizador de alto impacto con compartimentos.', 79.90, null, 'https://images.unsplash.com/photo-1581147036324-c1c89c2c8a6b?auto=format&fit=crop&w=1000&q=85', 20, true, null),
  ('construccion', 'Cemento Portland tipo I 42.5 kg', 'Para obras generales, cimientos y estructuras.', 32.90, null, 'https://images.unsplash.com/photo-1517581177682-a085bb7ffb15?auto=format&fit=crop&w=1000&q=85', 60, true, 'Precio especial'),
  ('electricidad', 'Reflector LED industrial 50W', 'Luz blanca fría 6500K protección IP65.', 45.00, null, 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1000&q=85', 24, true, null),
  ('pinturas', 'Pintura látex lavable blanco 1 galón', 'Gran poder cubriente y secado rápido.', 68.90, null, 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=1000&q=85', 15, true, null);
*/
