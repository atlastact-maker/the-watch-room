-- Advisor questionnaire fields. Run once in the Supabase SQL editor
-- (after 002_advisors.sql). Existing advisor rows keep working — new
-- columns fill with defaults until the advisor updates their profile.

alter table public.advisors
  add column if not exists status text not null default '',
  add column if not exists force_area text not null default '',
  add column if not exists topics jsonb not null default '[]'::jsonb,
  add column if not exists involvement text not null default '',
  add column if not exists contact_ok boolean not null default false,
  add column if not exists discord text not null default '';
