-- ============================================================
-- FERRETERÍA NORTE / TIENDA VIRTUAL WHATSAPP - SCHEMA SUPABASE
-- ============================================================
-- Este archivo contiene la estructura completa de base de datos PostgreSQL
-- lista para ejecutar en el "SQL Editor" de tu proyecto en Supabase:
-- https://supabase.com/dashboard/project/pgmdobctvfjlbjchmhlo/sql
-- ============================================================

-- 1. Habilitar extensión para generación de identificadores UUID
create extension if not exists pgcrypto;

-- 2. TABLA: categorias
create table if not exists public.categorias (
  id text primary key,                   -- Slug en minúsculas (ej: 'herramientas')
  nombre text not null unique,           -- Nombre visible (ej: 'Herramientas')
  icono text,                            -- Emoji o identificador de icono (ej: '🔧')
  orden integer not null default 0,      -- Orden de visualización en la barra
  activa boolean not null default true,  -- Ocultar/mostrar categoría sin borrarla
  created_at timestamptz not null default now()
);

-- 3. TABLA: productos
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

-- 4. ÍNDICES PARA ALTA VELOCIDAD DE CONSULTA
create index if not exists productos_categoria_activo_idx on public.productos(categoria_id, activo);
create index if not exists productos_destacado_activo_idx on public.productos(destacado desc, activo);

-- 5. TRIGGER PARA ACTUALIZAR 'updated_at' AUTOMÁTICAMENTE
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

-- 6. POLÍTICAS DE SEGURIDAD (Row Level Security - RLS)
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

-- 7. INSERTAR CATEGORÍAS POR DEFECTO
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

-- 8. INSERTAR CATÁLOGO INICIAL DE PRODUCTOS
insert into public.productos (categoria_id, nombre, descripcion, precio, precio_anterior, imagen_url, stock, destacado, etiqueta) values
  ('herramientas', 'Taladro percutor 650W', 'Ideal para perforar madera, metal y mampostería. Incluye mandril de 13 mm y empuñadura auxiliar ergonómica.', 189.90, 229.90, 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=1000&q=85', 12, true, 'Más vendido'),
  ('herramientas', 'Caja de herramientas 16”', 'Organizador de alto impacto con compartimentos transparentes, bandeja extraíble y cierres metálicos.', 79.90, null, 'https://images.unsplash.com/photo-1581147036324-c1c89c2c8a6b?auto=format&fit=crop&w=1000&q=85', 20, true, null),
  ('herramientas', 'Set de destornilladores x6', 'Puntas planas y Phillips magnetizadas de acero cromo-vanadio con mango ergonómico antideslizante.', 34.50, null, 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?auto=format&fit=crop&w=1000&q=85', 18, false, null),
  ('construccion', 'Cemento Portland tipo I 42.5 kg', 'Especialmente formulado para cimentaciones, estructuras, columnas y obras generales de alta resistencia.', 32.90, null, 'https://images.unsplash.com/photo-1517581177682-a085bb7ffb15?auto=format&fit=crop&w=1000&q=85', 60, true, 'Precio especial'),
  ('construccion', 'Nivel de aluminio tubular 24”', 'Cuerpo reforzado con tres burbujas de alta visibilidad para nivelación horizontal, vertical y a 45 grados.', 49.90, null, 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=1000&q=85', 9, false, null),
  ('electricidad', 'Reflector LED industrial 50W', 'Luz blanca fría 6500K con protección IP65 a prueba de agua y polvo. Ahorro energético del 85%.', 45.00, null, 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1000&q=85', 24, true, null),
  ('electricidad', 'Cable eléctrico THW 14 AWG · 100 m', 'Conductor de cobre electrolítico de 99.9% de pureza, aislante antiflama para instalaciones seguras.', 129.90, null, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1000&q=85', 8, false, null),
  ('pinturas', 'Pintura látex lavable blanco 1 galón', 'Pintura premium de gran poder cubriente, secado rápido y acabado mate lavable para interiores y fachadas.', 68.90, null, 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=1000&q=85', 15, true, null),
  ('plomeria', 'Grifería monocomando cuello de ganso', 'Acabado en cromo brillante con cartucho cerámico durable y aireador ahorrador de agua con giro 360 grados.', 149.90, null, 'https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=1000&q=85', 7, false, null),
  ('herramientas', 'Juego de llaves ajustables Francesa x2', 'Fabricadas en acero forjado con escala milimétrica grabada con láser y mecanismo de ajuste suave.', 59.90, null, 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?auto=format&fit=crop&w=1000&q=85', 14, false, null);
