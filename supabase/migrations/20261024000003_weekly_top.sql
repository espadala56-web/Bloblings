-- Haftalık sıralama: bu hafta en çok altın üretenler ve oyuncunun kendi sırası.
-- Sadece sunucu (Edge Function, gizli anahtar) çağırabilir.
create or replace function public.weekly_top(wk text, me bigint)
returns jsonb
language sql
stable
set search_path = public
as $$
  with w as (
    select tg_id,
           coalesce(nullif(trim(first_name), ''), 'Oyuncu') as name,
           coalesce((state -> 'week' ->> 'earned')::numeric, 0) as earned
    from players
    where state -> 'week' ->> 'id' = wk
  ),
  r as (
    select *, rank() over (order by earned desc) as rk from w
  )
  select jsonb_build_object(
    'top', coalesce((
      select jsonb_agg(jsonb_build_object('name', left(name, 20), 'earned', floor(earned), 'rank', rk, 'me', tg_id = me) order by rk, tg_id)
      from (select * from r order by rk, tg_id limit 50) t
    ), '[]'::jsonb),
    'me', (select jsonb_build_object('rank', rk, 'earned', floor(earned)) from r where tg_id = me),
    'total', (select count(*) from w)
  );
$$;

revoke all on function public.weekly_top(text, bigint) from public, anon, authenticated;
