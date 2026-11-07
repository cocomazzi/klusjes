-- Execute once in the Supabase SQL Editor.
create table public.series (
 id uuid primary key,
 owner_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
 rules jsonb not null default '[]'::jsonb check(jsonb_typeof(rules)='array'),
 created_at timestamptz not null default now()
);
create table public.occurrences (
 series_id uuid not null references public.series(id) on delete cascade,
 day date not null,
 owner_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
 done boolean not null default false,
 title text,
 deleted boolean not null default false,
 primary key(series_id,day)
);
alter table public.series enable row level security;
alter table public.occurrences enable row level security;
create policy "Own household series" on public.series for all to authenticated using(owner_id=auth.uid()) with check(owner_id=auth.uid());
create policy "Own household occurrences" on public.occurrences for all to authenticated using(owner_id=auth.uid()) with check(owner_id=auth.uid() and exists(select 1 from public.series s where s.id=series_id and s.owner_id=auth.uid()));
grant select,insert,update,delete on public.series,public.occurrences to authenticated;
alter publication supabase_realtime add table public.series,public.occurrences;
