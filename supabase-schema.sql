-- DIVA Store CMS — شغّلي الملف بالكامل في Supabase SQL Editor
create extension if not exists pgcrypto;

create table if not exists public.diva_offers (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  badge text not null default '',
  date_label text not null default '',
  icon text not null default 'fa-bag-shopping',
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.diva_gallery (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null default 'new' check (category in ('casual','formal','new')),
  image_url text not null,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.diva_settings (
  key text primary key,
  value text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.diva_offers enable row level security;
alter table public.diva_gallery enable row level security;
alter table public.diva_settings enable row level security;

-- قائمة حسابات الإدارة المصرح لها فقط (لا تمنح صلاحية لمجرد التسجيل)
create table if not exists public.diva_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.diva_admins enable row level security;
drop policy if exists "Admin can read own admin record" on public.diva_admins;
create policy "Admin can read own admin record" on public.diva_admins
for select to authenticated using (user_id = auth.uid());

-- القراءة العامة للمحتوى المنشور فقط
drop policy if exists "Public read active offers" on public.diva_offers;
create policy "Public read active offers" on public.diva_offers for select using (active = true);
drop policy if exists "Public read active gallery" on public.diva_gallery;
create policy "Public read active gallery" on public.diva_gallery for select using (active = true);
drop policy if exists "Public read settings" on public.diva_settings;
create policy "Public read settings" on public.diva_settings for select using (true);

-- الإدارة: أي مستخدم مسجل دخول يمكنه التعديل. أنشئي حساب إدارة واحداً فقط في Auth.
drop policy if exists "Admin manage offers" on public.diva_offers;
drop policy if exists "Authenticated manage offers" on public.diva_offers;
create policy "Admin manage offers" on public.diva_offers for all to authenticated
using (exists (select 1 from public.diva_admins a where a.user_id = auth.uid()))
with check (exists (select 1 from public.diva_admins a where a.user_id = auth.uid()));
drop policy if exists "Admin manage gallery" on public.diva_gallery;
drop policy if exists "Authenticated manage gallery" on public.diva_gallery;
create policy "Admin manage gallery" on public.diva_gallery for all to authenticated
using (exists (select 1 from public.diva_admins a where a.user_id = auth.uid()))
with check (exists (select 1 from public.diva_admins a where a.user_id = auth.uid()));
drop policy if exists "Admin manage settings" on public.diva_settings;
drop policy if exists "Authenticated manage settings" on public.diva_settings;
create policy "Admin manage settings" on public.diva_settings for all to authenticated
using (exists (select 1 from public.diva_admins a where a.user_id = auth.uid()))
with check (exists (select 1 from public.diva_admins a where a.user_id = auth.uid()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('diva-media','diva-media',true,10485760,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=true, file_size_limit=10485760, allowed_mime_types=array['image/jpeg','image/png','image/webp'];

drop policy if exists "Public view diva media" on storage.objects;
create policy "Public view diva media" on storage.objects for select using (bucket_id = 'diva-media');
drop policy if exists "Authenticated upload diva media" on storage.objects;
create policy "Admin upload diva media" on storage.objects for insert to authenticated
with check (bucket_id = 'diva-media' and exists (select 1 from public.diva_admins a where a.user_id = auth.uid()));
drop policy if exists "Authenticated update diva media" on storage.objects;
create policy "Admin update diva media" on storage.objects for update to authenticated
using (bucket_id = 'diva-media' and exists (select 1 from public.diva_admins a where a.user_id = auth.uid()))
with check (bucket_id = 'diva-media' and exists (select 1 from public.diva_admins a where a.user_id = auth.uid()));
drop policy if exists "Authenticated delete diva media" on storage.objects;
create policy "Admin delete diva media" on storage.objects for delete to authenticated
using (bucket_id = 'diva-media' and exists (select 1 from public.diva_admins a where a.user_id = auth.uid()));

-- بيانات العروض الحالية كبداية (يمكن تعديلها أو حذفها من لوحة التحكم)
insert into public.diva_offers (title,description,badge,date_label,icon,active,sort_order) values
('فصل الصيف','تخفيض 30% على جميع ملابس الصيف','خصم 30%','حتى نهاية مايو','fa-bag-shopping',false,1),
('فساتين السهرة','خصم خاص على جميع فساتين السهرة','خصم 25%','عروض محدودة','fa-person-dress',false,2),
('الملابس الكاجوال','تخفيضات على التيشيرتات والبناطيل','خصم 20%','طول السنة','fa-shirt',false,3)
on conflict do nothing;
