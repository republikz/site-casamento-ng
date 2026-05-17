create schema if not exists extensions;
create extension if not exists unaccent with schema extensions;

do $$ begin
  create type rsvp_status as enum ('pending', 'yes', 'no');
exception
  when duplicate_object then null;
end $$;

create table if not exists site_content (
  id text primary key default 'main',
  couple_names text not null default 'N & G',
  hero_title text not null,
  hero_subtitle text not null,
  story_title text not null,
  story_text text not null,
  closing_note text not null,
  updated_at timestamptz not null default now()
);

create table if not exists event_details (
  id text primary key default 'main',
  date_label text not null,
  time_label text not null,
  venue_name text not null,
  venue_address text not null,
  map_url text not null default '',
  dress_code text not null default '',
  notes text not null default '',
  updated_at timestamptz not null default now()
);

create table if not exists invitations (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  contact_name text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists guests (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references invitations(id) on delete cascade,
  full_name text not null,
  is_primary boolean not null default false,
  rsvp_status rsvp_status not null default 'pending',
  dietary_notes text not null default '',
  accessibility_notes text not null default '',
  updated_at timestamptz not null default now()
);

create table if not exists rsvp_messages (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references invitations(id) on delete cascade,
  message text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists gifts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  amount_label text not null default '',
  pix_code text not null default '',
  pix_qr_url text not null default '',
  mercado_pago_url text not null default '',
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists photos (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  image_url text not null,
  alt_text text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table site_content enable row level security;
alter table event_details enable row level security;
alter table invitations enable row level security;
alter table guests enable row level security;
alter table rsvp_messages enable row level security;
alter table gifts enable row level security;
alter table photos enable row level security;

drop policy if exists "Public reads site content" on site_content;
create policy "Public reads site content" on site_content for select using (true);

drop policy if exists "Public reads event details" on event_details;
create policy "Public reads event details" on event_details for select using (true);

drop policy if exists "Public reads active gifts" on gifts;
create policy "Public reads active gifts" on gifts for select using (is_active = true);

drop policy if exists "Public reads photos" on photos;
create policy "Public reads photos" on photos for select using (true);

drop policy if exists "Admins manage site content" on site_content;
create policy "Admins manage site content" on site_content for all to authenticated using (true) with check (true);

drop policy if exists "Admins manage event details" on event_details;
create policy "Admins manage event details" on event_details for all to authenticated using (true) with check (true);

drop policy if exists "Admins manage invitations" on invitations;
create policy "Admins manage invitations" on invitations for all to authenticated using (true) with check (true);

drop policy if exists "Admins manage guests" on guests;
create policy "Admins manage guests" on guests for all to authenticated using (true) with check (true);

drop policy if exists "Admins manage messages" on rsvp_messages;
create policy "Admins manage messages" on rsvp_messages for all to authenticated using (true) with check (true);

drop policy if exists "Admins manage gifts" on gifts;
create policy "Admins manage gifts" on gifts for all to authenticated using (true) with check (true);

drop policy if exists "Admins manage photos" on photos;
create policy "Admins manage photos" on photos for all to authenticated using (true) with check (true);

create or replace function public.public_search_invitations(search_term text)
returns table (
  id uuid,
  display_name text,
  contact_name text,
  notes text,
  guests jsonb
)
language sql
security definer
set search_path = public, extensions
as $$
  with matched_invitations as (
    select distinct i.id
    from invitations i
    left join guests g on g.invitation_id = i.id
    where length(trim(search_term)) >= 3
      and (
        unaccent(lower(i.display_name)) like '%' || unaccent(lower(trim(search_term))) || '%'
        or unaccent(lower(i.contact_name)) like '%' || unaccent(lower(trim(search_term))) || '%'
        or unaccent(lower(g.full_name)) like '%' || unaccent(lower(trim(search_term))) || '%'
      )
    order by i.id
    limit 8
  ),
  latest_messages as (
    select distinct on (invitation_id)
      invitation_id,
      message
    from rsvp_messages
    order by invitation_id, created_at desc
  )
  select
    i.id,
    i.display_name,
    i.contact_name,
    coalesce(m.message, '') as notes,
    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'id', g.id,
          'invitation_id', g.invitation_id,
          'full_name', g.full_name,
          'is_primary', g.is_primary,
          'rsvp_status', g.rsvp_status,
          'dietary_notes', g.dietary_notes,
          'accessibility_notes', g.accessibility_notes
        )
        order by g.is_primary desc, g.full_name
      ) filter (where g.id is not null),
      '[]'::jsonb
    ) as guests
  from matched_invitations mi
  join invitations i on i.id = mi.id
  left join guests g on g.invitation_id = i.id
  left join latest_messages m on m.invitation_id = i.id
  group by i.id, i.display_name, i.contact_name, m.message
  order by i.display_name;
$$;

create or replace function public.submit_rsvp(
  input_invitation_id uuid,
  input_guests jsonb,
  input_message text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  item jsonb;
begin
  for item in select * from jsonb_array_elements(input_guests)
  loop
    update guests
    set
      rsvp_status = case when (item ->> 'will_attend')::boolean then 'yes'::rsvp_status else 'no'::rsvp_status end,
      dietary_notes = coalesce(item ->> 'dietary_notes', ''),
      accessibility_notes = coalesce(item ->> 'accessibility_notes', ''),
      updated_at = now()
    where id = (item ->> 'guest_id')::uuid
      and invitation_id = input_invitation_id;
  end loop;

  insert into rsvp_messages (invitation_id, message)
  values (input_invitation_id, coalesce(input_message, ''));
end;
$$;

grant execute on function public.public_search_invitations(text) to anon, authenticated;
grant execute on function public.submit_rsvp(uuid, jsonb, text) to anon, authenticated;

insert into site_content (
  id,
  couple_names,
  hero_title,
  hero_subtitle,
  story_title,
  story_text,
  closing_note
)
values (
  'main',
  'N & G',
  'Uma nova aliança será celebrada',
  'Entre oliveiras, cartas antigas e uma promessa de casa, convidamos você para atravessar este capítulo conosco.',
  'Nossa história',
  'Edite este texto no painel admin para contar o caminho de vocês até o casamento.',
  'Venha celebrar como quem chega a um salão iluminado depois de uma longa jornada.'
)
on conflict (id) do nothing;

insert into event_details (
  id,
  date_label,
  time_label,
  venue_name,
  venue_address,
  dress_code,
  notes
)
values (
  'main',
  'Sábado, 18 de outubro de 2026',
  '16h30',
  'Local a confirmar',
  'Endereço completo será inserido no painel admin',
  'Traje passeio completo em tons terrosos, verdes, lavanda ou neutros',
  'Chegue com alguns minutos de antecedência para encontrar seu lugar com calma.'
)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('wedding-media', 'wedding-media', true)
on conflict (id) do nothing;

drop policy if exists "Public reads wedding media" on storage.objects;
create policy "Public reads wedding media"
on storage.objects for select
using (bucket_id = 'wedding-media');

drop policy if exists "Admins upload wedding media" on storage.objects;
create policy "Admins upload wedding media"
on storage.objects for insert to authenticated
with check (bucket_id = 'wedding-media');

drop policy if exists "Admins update wedding media" on storage.objects;
create policy "Admins update wedding media"
on storage.objects for update to authenticated
using (bucket_id = 'wedding-media')
with check (bucket_id = 'wedding-media');

drop policy if exists "Admins delete wedding media" on storage.objects;
create policy "Admins delete wedding media"
on storage.objects for delete to authenticated
using (bucket_id = 'wedding-media');
