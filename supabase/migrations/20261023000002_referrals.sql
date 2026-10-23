-- Arkadaş daveti: kim kimi davet etti, ne zaman hak kazandı, hediye ne zaman teslim edildi.
create table if not exists public.referrals (
  referee bigint primary key references public.players (tg_id) on delete cascade,
  referrer bigint not null references public.players (tg_id) on delete cascade,
  created_at timestamptz not null default now(),
  qualified_at timestamptz,
  delivered_at timestamptz
);

comment on table public.referrals is 'Bloblings davetleri. Davet edilen 10 birleştirme yapınca qualified_at dolar, davet edene hediye gidince delivered_at dolar.';

create index if not exists referrals_pending_idx on public.referrals (referrer)
  where qualified_at is not null and delivered_at is null;

alter table public.referrals enable row level security;
revoke all on public.referrals from anon, authenticated;
