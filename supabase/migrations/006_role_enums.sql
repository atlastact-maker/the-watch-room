-- Role and insignia become real Postgres enums. Run once in the
-- Supabase SQL editor (after 005).
--
-- Why: the Table editor renders an enum column as a dropdown when
-- inserting or editing a row, so assigning a role or insignia becomes a
-- selection instead of typing a string that a check constraint can only
-- reject after the fact.
--
-- icon also becomes nullable: empty meant "derive from the application"
-- and null says that more honestly. The app already treats null as
-- empty, so no code change rides with this.

do $$ begin
  if not exists (select 1 from pg_type where typname = 'access_role') then
    create type public.access_role as enum ('admin', 'operator', 'advisor');
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_type where typname = 'insignia_key') then
    create type public.insignia_key as enum
      ('fire', 'ambulance', 'police', 'control', 'specialist');
  end if;
end $$;

alter table public.user_roles
  drop constraint if exists user_roles_role_check;

alter table public.user_roles
  alter column role type public.access_role
  using role::public.access_role;

alter table public.user_roles
  alter column icon drop default;

alter table public.user_roles
  alter column icon drop not null;

-- Anything that isn't a valid key (an emoji from the earlier scheme, an
-- empty string) becomes null rather than failing the migration.
alter table public.user_roles
  alter column icon type public.insignia_key
  using (
    case
      when icon in ('fire', 'ambulance', 'police', 'control', 'specialist')
        then icon::public.insignia_key
      else null
    end
  );
