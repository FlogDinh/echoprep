-- EchoPrep shared history: anonymous visitors can read and append attempts.
-- Existing attempts cannot be updated or deleted through the frontend API.
-- Run once in the Supabase project's SQL Editor. Re-running is safe.
create table if not exists public.echoprep_attempts (
 id text primary key check (length(id) between 1 and 100),
 created_at timestamptz not null default now(),
 record jsonb not null,
 constraint attempt_id_matches check (record->>'id' = id),
 constraint attempt_size check (octet_length(record::text) <= 300000),
 constraint attempt_shape check (
   jsonb_typeof(record) = 'object' and
   record ?& array['id','module','vol','testId','submittedAt','elapsed','answers','result'] and
   record->>'module' in ('listening','reading') and
   record->>'vol' = '9' and
   ((record->>'module' = 'listening' and record->>'testId' in ('1','2')) or
    (record->>'module' = 'reading' and record->>'testId' = '1')) and
   jsonb_typeof(record->'answers') = 'object' and
   jsonb_typeof(record->'elapsed') = 'number' and (record->>'elapsed')::numeric >= 0 and
   record->'result' ?& array['rows','correct','wrong','blank'] and
   (record->'result'->>'correct')::int between 0 and 40 and
   (record->'result'->>'wrong')::int between 0 and 40 and
   (record->'result'->>'blank')::int between 0 and 40 and
   (record->'result'->>'correct')::int + (record->'result'->>'wrong')::int + (record->'result'->>'blank')::int = 40 and
   jsonb_typeof(record->'result'->'rows') = 'array' and jsonb_array_length(record->'result'->'rows') = 40 and
   not (record ?| array['username','account','password','token'])
 )
);
alter table public.echoprep_attempts enable row level security;
revoke all on public.echoprep_attempts from anon, authenticated;
grant usage on schema public to anon;
grant select on public.echoprep_attempts to anon;
grant insert (id, record) on public.echoprep_attempts to anon;
drop policy if exists echoprep_shared_read on public.echoprep_attempts;
create policy echoprep_shared_read on public.echoprep_attempts for select to anon using (true);
drop policy if exists echoprep_shared_append on public.echoprep_attempts;
create policy echoprep_shared_append on public.echoprep_attempts for insert to anon with check (true);
-- No UPDATE/DELETE grants or policies. Do not add them for the anon role.
