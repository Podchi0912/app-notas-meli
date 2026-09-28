-- =====================================================================
-- Mi Cuadernito — base de datos (Supabase / PostgreSQL)
--
-- Cómo usarlo: entra en tu proyecto de Supabase, abre "SQL Editor",
-- pega TODO este archivo y pulsa "Run". Se puede volver a ejecutar sin
-- miedo: no borra nada de lo que ya haya.
--
-- Cada fila guarda el objeto entero en `datos` (jsonb). Así la app puede
-- seguir cambiando la forma de una nota (pegatinas, sujeción, colores...)
-- sin tener que tocar la base de datos cada vez.
--
-- `actualizado` lo pone el servidor, no el móvil ni el ordenador: los
-- relojes de los aparatos se desvían, y esa hora es la que decide qué
-- cambio gana cuando editas lo mismo en dos sitios.
--
-- `borrado` marca lo que se ha eliminado en lugar de quitar la fila. Si
-- se borrase de verdad, el otro aparato no se enteraría nunca y la nota
-- volvería a aparecer en la siguiente sincronización.
-- =====================================================================

-- --------------------------------------------------------------- tablas

create table if not exists public.notas (
    usuario     uuid        not null references auth.users on delete cascade,
    id          text        not null,
    datos       jsonb       not null,
    actualizado timestamptz not null default now(),
    borrado     timestamptz,
    primary key (usuario, id)
);

create table if not exists public.categorias (
    usuario     uuid        not null references auth.users on delete cascade,
    id          text        not null,
    datos       jsonb       not null,
    actualizado timestamptz not null default now(),
    borrado     timestamptz,
    primary key (usuario, id)
);

create table if not exists public.recordatorios (
    usuario     uuid        not null references auth.users on delete cascade,
    id          text        not null,
    datos       jsonb       not null,
    actualizado timestamptz not null default now(),
    borrado     timestamptz,
    primary key (usuario, id)
);

-- Los ajustes son uno solo por persona (tema, paleta, forma, nombre...)
create table if not exists public.ajustes (
    usuario     uuid        not null references auth.users on delete cascade,
    datos       jsonb       not null,
    actualizado timestamptz not null default now(),
    primary key (usuario)
);

-- Para pedir solo lo que ha cambiado desde la última vez
create index if not exists notas_por_fecha         on public.notas (usuario, actualizado);
create index if not exists categorias_por_fecha    on public.categorias (usuario, actualizado);
create index if not exists recordatorios_por_fecha on public.recordatorios (usuario, actualizado);

-- ------------------------------------------------- la hora la pone el servidor

create or replace function public.marcar_actualizado()
returns trigger
language plpgsql
as $funcion$
begin
    new.actualizado = now();
    return new;
end;
$funcion$;

drop trigger if exists notas_actualizado on public.notas;
create trigger notas_actualizado
    before insert or update on public.notas
    for each row execute function public.marcar_actualizado();

drop trigger if exists categorias_actualizado on public.categorias;
create trigger categorias_actualizado
    before insert or update on public.categorias
    for each row execute function public.marcar_actualizado();

drop trigger if exists recordatorios_actualizado on public.recordatorios;
create trigger recordatorios_actualizado
    before insert or update on public.recordatorios
    for each row execute function public.marcar_actualizado();

drop trigger if exists ajustes_actualizado on public.ajustes;
create trigger ajustes_actualizado
    before insert or update on public.ajustes
    for each row execute function public.marcar_actualizado();

-- --------------------------------------------- cada quien ve solo lo suyo
-- Esto es lo que hace que la clave pública que va dentro de la página sea
-- inofensiva: sin haber entrado con tu correo, esa clave no da acceso a
-- ninguna fila. Y si otra persona se crea una cuenta, tendrá su propio
-- cuaderno vacío, sin ver el tuyo.

alter table public.notas         enable row level security;
alter table public.categorias    enable row level security;
alter table public.recordatorios enable row level security;
alter table public.ajustes       enable row level security;

drop policy if exists notas_propias on public.notas;
create policy notas_propias on public.notas
    for all using (usuario = auth.uid()) with check (usuario = auth.uid());

drop policy if exists categorias_propias on public.categorias;
create policy categorias_propias on public.categorias
    for all using (usuario = auth.uid()) with check (usuario = auth.uid());

drop policy if exists recordatorios_propios on public.recordatorios;
create policy recordatorios_propios on public.recordatorios
    for all using (usuario = auth.uid()) with check (usuario = auth.uid());

drop policy if exists ajustes_propios on public.ajustes;
create policy ajustes_propios on public.ajustes
    for all using (usuario = auth.uid()) with check (usuario = auth.uid());
