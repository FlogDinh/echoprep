-- EchoPrep online history: paste into Supabase → SQL Editor → Run (safe to run again).
-- The tables are closed to the public API (RLS on, no policies, no grants). The site only calls the three
-- functions below with a secret key: the student key may save, read and set the teacher password; the teacher key may only read.
-- Keys are stored as SHA-256 hashes; set them with supabase/set-keys.sql (made by scripts/make-cloud-keys.mjs).

create table if not exists public.echoprep_attempts (
  id text primary key check (length(id) between 1 and 100),
  record jsonb not null,
  submitted_at timestamptz not null,
  saved_at timestamptz not null default now()
);
create table if not exists public.echoprep_keys (
  role text primary key check (role in ('student', 'teacher')),
  key_hash text not null
);
alter table public.echoprep_attempts enable row level security;
alter table public.echoprep_keys enable row level security;
revoke all on public.echoprep_attempts, public.echoprep_keys from anon, authenticated;

-- Which role a key belongs to ('student', 'teacher' or null).
create or replace function public.echoprep_role(p_key text) returns text
language sql stable security definer set search_path = public as $$
  select role from public.echoprep_keys
  where p_key is not null and length(p_key) between 20 and 200
    and key_hash = encode(sha256(convert_to(p_key, 'UTF8')), 'hex');
$$;

-- Save (or replace) one attempt. Student key only.
create or replace function public.echoprep_save(p_key text, p_record jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  if public.echoprep_role(p_key) is distinct from 'student' then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if jsonb_typeof(p_record) <> 'object' or coalesce(p_record->>'id', '') = '' or length(p_record->>'id') > 100
     or pg_column_size(p_record) > 500000 or (p_record->>'submittedAt') is null then
    raise exception 'invalid_record' using errcode = '22023';
  end if;
  insert into public.echoprep_attempts (id, record, submitted_at)
  values (p_record->>'id', p_record, (p_record->>'submittedAt')::timestamptz)
  on conflict (id) do update set record = excluded.record, submitted_at = excluded.submitted_at, saved_at = now();
end;
$$;

-- All attempts, oldest first. Student or teacher key.
create or replace function public.echoprep_list(p_key text) returns setof jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if public.echoprep_role(p_key) is null then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return query select record from public.echoprep_attempts order by submitted_at, id;
end;
$$;

-- Lets the site check a key when it is first opened: returns 'student', 'teacher' or null.
create or replace function public.echoprep_whoami(p_key text) returns text
language sql stable security definer set search_path = public as $$
  select public.echoprep_role(p_key);
$$;

-- The student sets the teacher's password from the site: the site sends SHA-256 of the key derived from it
-- (sha256 hex of 'echoprep-teacher:' + password), so the password itself never leaves the browser. Student key only.
create or replace function public.echoprep_set_teacher(p_key text, p_teacher_hash text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if public.echoprep_role(p_key) is distinct from 'student' then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if p_teacher_hash is null or p_teacher_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'invalid_hash' using errcode = '22023';
  end if;
  insert into public.echoprep_keys (role, key_hash) values ('teacher', p_teacher_hash)
  on conflict (role) do update set key_hash = excluded.key_hash;
end;
$$;

-- Needed when the project does not grant API access automatically; gives no access to the tables.
grant usage on schema public to anon, authenticated;
revoke execute on function public.echoprep_role(text) from public, anon, authenticated;
revoke execute on function public.echoprep_save(text, jsonb), public.echoprep_list(text), public.echoprep_whoami(text), public.echoprep_set_teacher(text, text) from public;
grant execute on function public.echoprep_save(text, jsonb), public.echoprep_list(text), public.echoprep_whoami(text), public.echoprep_set_teacher(text, text) to anon, authenticated;
