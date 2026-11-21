-- DIVA: إدارة كل صور الموقع من لوحة التحكم
create table if not exists public.diva_site_images (
  id uuid primary key default gen_random_uuid(),
  image_key text unique,
  title text not null,
  category text not null default 'عام',
  image_url text not null,
  alt_text text not null default '',
  active boolean not null default true,
  show_in_gallery boolean not null default true,
  show_on_home boolean not null default false,
  storage_path text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.diva_site_images enable row level security;
grant select on public.diva_site_images to anon, authenticated;
grant insert, update, delete on public.diva_site_images to authenticated;
drop policy if exists "Public read active site images" on public.diva_site_images;
create policy "Public read active site images" on public.diva_site_images
for select to anon, authenticated using (active = true);
drop policy if exists "Admin manage site images" on public.diva_site_images;
create policy "Admin manage site images" on public.diva_site_images
for all to authenticated
using (exists (select 1 from public.diva_admins a where a.user_id = (select auth.uid())))
with check (exists (select 1 from public.diva_admins a where a.user_id = (select auth.uid())));

-- تسجيل الصور الموجودة بالفعل بالموقع. ON CONFLICT يحافظ على أي تعديلات سابقة.
insert into public.diva_site_images
(image_key,title,category,image_url,alt_text,active,show_in_gallery,show_on_home,sort_order)
values
('look-1','ملابس كاجوال','كاجوال','https://hebbkx1anhila5yf.public.blob.vercel-storage.com/1-aUjktiW3ErJLz4tkyvsa4HTBkCFZx0.jpeg','ملابس كاجوال',true,true,true,1),
('look-2','تشكيلة متنوعة','كاجوال','https://hebbkx1anhila5yf.public.blob.vercel-storage.com/2-jOWegoI2UBmmFeKE6QmVLagwVNogGm.jpeg','تشكيلة متنوعة',true,true,true,2),
('look-3','كنزة رياضية','سهرة','https://hebbkx1anhila5yf.public.blob.vercel-storage.com/3-viedtdzATvVnF4iAYGImmDRjiHBT92.jpeg','كنزة رياضية',true,true,true,3),
('look-4','قميص أخضر','سهرة','https://hebbkx1anhila5yf.public.blob.vercel-storage.com/4-DxPYZczU6OrNH8L3SYgnbURrVJEEMr.jpeg','قميص أخضر',true,true,true,4),
('look-5','تشكيلة الكنزات المخططة','جديد','https://hebbkx1anhila5yf.public.blob.vercel-storage.com/5-pXgCx76zBR4rVZe07y83fR97hQaMPY.jpg','تشكيلة الكنزات المخططة',true,true,true,5),
('look-6','فستان وردي مع جاكيت دينم','جديد','https://hebbkx1anhila5yf.public.blob.vercel-storage.com/6-oN1ckLCBlbGrdUWZAr3WwQX50xdlgz.jpg','فستان وردي مع جاكيت دينم',true,true,true,6),
('look-7','بلاوز مزخرفة','كاجوال','https://hebbkx1anhila5yf.public.blob.vercel-storage.com/7-v4dBW32fR8aqRGrkDjYAtQTyZKCW1s.jpeg','بلاوز مزخرفة',true,true,true,7),
('look-8','عرض محل ديفا','تصوير المحل','https://hebbkx1anhila5yf.public.blob.vercel-storage.com/8-7P7pwZtgT2wqL4mvX93mXCa0QgncTk.jpeg','عرض محل ديفا',true,true,false,8),
('look-9','كنزة رياضية رمادية','جديد','https://hebbkx1anhila5yf.public.blob.vercel-storage.com/9-hRsq5hbqhq1ufmZl6YsKnA9zTzhAVo.jpg','كنزة رياضية رمادية',true,true,false,9)
on conflict (image_key) do nothing;
