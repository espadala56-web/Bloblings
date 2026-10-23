-- Oyuncular: tüm oyun durumu tek bir jsonb alanında tutulur.
-- Erişim sadece sunucu fonksiyonu (secret key) üzerinden; istemci tabloya doğrudan erişemez.
create table public.players (
  tg_id bigint primary key,
  username text,
  first_name text,
  lang text,
  is_premium boolean not null default false,
  state jsonb not null,
  version integer not null default 0,
  start_param text,
  referred_by bigint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.players is 'Bloblings oyuncuları. state: oyun durumu (store.js formatı). version: eşzamanlı yazma koruması.';

create index players_referred_by_idx on public.players (referred_by) where referred_by is not null;

alter table public.players enable row level security;

-- Olay günlüğü: analiz için (ilk giriş, senkron, reddedilen eylemler...)
create table public.events (
  id bigint generated always as identity primary key,
  tg_id bigint not null references public.players (tg_id) on delete cascade,
  type text not null,
  data jsonb,
  created_at timestamptz not null default now()
);

create index events_tg_id_created_idx on public.events (tg_id, created_at desc);
create index events_type_created_idx on public.events (type, created_at desc);

alter table public.events enable row level security;

-- Bilerek hiçbir RLS politikası tanımlanmadı: anon ve authenticated roller hiçbir satırı göremez/yazamaz.
revoke all on public.players from anon, authenticated;
revoke all on public.events from anon, authenticated;
