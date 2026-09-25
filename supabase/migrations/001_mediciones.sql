-- Tabla de mediciones por usuario.
-- Pegá este archivo completo en Supabase → SQL Editor → New query → Run.

create table if not exists public.mediciones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  fecha timestamptz not null,
  genero text not null check (genero in ('hombre', 'mujer')),
  porcentaje numeric(5, 2) not null check (porcentaje between 0 and 80),
  peso_kg numeric(6, 2) not null check (peso_kg between 20 and 400),
  masa_grasa_kg numeric(6, 2) not null,
  masa_magra_kg numeric(6, 2) not null,
  creado_en timestamptz not null default now(),
  -- Evita duplicados al subir el historial local más de una vez.
  unique (user_id, fecha)
);

create index if not exists mediciones_user_fecha_idx on public.mediciones (user_id, fecha desc);

-- Seguridad por fila: cada usuario solo ve, crea y borra sus propias mediciones.
alter table public.mediciones enable row level security;

drop policy if exists "ver mis mediciones" on public.mediciones;
create policy "ver mis mediciones" on public.mediciones
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "crear mis mediciones" on public.mediciones;
create policy "crear mis mediciones" on public.mediciones
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "borrar mis mediciones" on public.mediciones;
create policy "borrar mis mediciones" on public.mediciones
  for delete to authenticated using ((select auth.uid()) = user_id);
