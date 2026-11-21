
-- ==========================================
-- DIVA STORE CMS - COMPLETE SUPABASE SETUP
-- ==========================================

BEGIN;

-- 1. Extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- 2. Offers table
CREATE TABLE IF NOT EXISTS public.diva_offers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    description text NOT NULL DEFAULT '',
    badge text NOT NULL DEFAULT '',
    date_label text NOT NULL DEFAULT '',
    icon text NOT NULL DEFAULT 'fa-bag-shopping',
    active boolean NOT NULL DEFAULT true,
    sort_order integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now()
);


-- 3. Gallery table
CREATE TABLE IF NOT EXISTS public.diva_gallery (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    category text NOT NULL DEFAULT 'new',
    image_url text NOT NULL,
    active boolean NOT NULL DEFAULT true,
    sort_order integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Allow custom categories instead of only casual/formal/new
ALTER TABLE public.diva_gallery
DROP CONSTRAINT IF EXISTS diva_gallery_category_check;


-- 4. Settings table
CREATE TABLE IF NOT EXISTS public.diva_settings (
    key text PRIMARY KEY,
    value text NOT NULL DEFAULT '',
    updated_at timestamptz NOT NULL DEFAULT now()
);


-- 5. Admins table
CREATE TABLE IF NOT EXISTS public.diva_admins (
    user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now()
);


-- 6. Permissions
GRANT SELECT ON public.diva_offers,
                public.diva_gallery,
                public.diva_settings
TO anon, authenticated;

GRANT INSERT, UPDATE, DELETE
ON public.diva_offers,
   public.diva_gallery,
   public.diva_settings
TO authenticated;

GRANT SELECT ON public.diva_admins TO authenticated;


-- 7. Enable RLS
ALTER TABLE public.diva_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diva_gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diva_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diva_admins ENABLE ROW LEVEL SECURITY;


-- 8. Admins policies
DROP POLICY IF EXISTS "Admin can read own admin record"
ON public.diva_admins;

CREATE POLICY "Admin can read own admin record"
ON public.diva_admins
FOR SELECT
TO authenticated
USING (user_id = auth.uid());


-- 9. Public read policies

DROP POLICY IF EXISTS "Public read active offers"
ON public.diva_offers;

CREATE POLICY "Public read active offers"
ON public.diva_offers
FOR SELECT
TO anon, authenticated
USING (active = true);


DROP POLICY IF EXISTS "Public read active gallery"
ON public.diva_gallery;

CREATE POLICY "Public read active gallery"
ON public.diva_gallery
FOR SELECT
TO anon, authenticated
USING (active = true);


DROP POLICY IF EXISTS "Public read settings"
ON public.diva_settings;

CREATE POLICY "Public read settings"
ON public.diva_settings
FOR SELECT
TO anon, authenticated
USING (true);


-- 10. Admin offers management
DROP POLICY IF EXISTS "Admin manage offers"
ON public.diva_offers;

DROP POLICY IF EXISTS "Authenticated manage offers"
ON public.diva_offers;

CREATE POLICY "Admin manage offers"
ON public.diva_offers
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.diva_admins a
        WHERE a.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.diva_admins a
        WHERE a.user_id = auth.uid()
    )
);


-- 11. Admin gallery management
DROP POLICY IF EXISTS "Admin manage gallery"
ON public.diva_gallery;

DROP POLICY IF EXISTS "Authenticated manage gallery"
ON public.diva_gallery;

CREATE POLICY "Admin manage gallery"
ON public.diva_gallery
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.diva_admins a
        WHERE a.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.diva_admins a
        WHERE a.user_id = auth.uid()
    )
);


-- 12. Admin settings management
DROP POLICY IF EXISTS "Admin manage settings"
ON public.diva_settings;

DROP POLICY IF EXISTS "Authenticated manage settings"
ON public.diva_settings;

CREATE POLICY "Admin manage settings"
ON public.diva_settings
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.diva_admins a
        WHERE a.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.diva_admins a
        WHERE a.user_id = auth.uid()
    )
);


-- 13. Storage bucket
INSERT INTO storage.buckets (
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
)
VALUES (
    'diva-media',
    'diva-media',
    true,
    10485760,
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id)
DO UPDATE SET
    public = true,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];


-- 14. Remove old storage policies
DROP POLICY IF EXISTS "Public view diva media"
ON storage.objects;

DROP POLICY IF EXISTS "Authenticated upload diva media"
ON storage.objects;

DROP POLICY IF EXISTS "Authenticated update diva media"
ON storage.objects;

DROP POLICY IF EXISTS "Authenticated delete diva media"
ON storage.objects;

DROP POLICY IF EXISTS "Admin upload diva media"
ON storage.objects;

DROP POLICY IF EXISTS "Admin update diva media"
ON storage.objects;

DROP POLICY IF EXISTS "Admin delete diva media"
ON storage.objects;


-- 15. Public image viewing
CREATE POLICY "Public view diva media"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'diva-media');


-- 16. Admin image upload
CREATE POLICY "Admin upload diva media"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'diva-media'
    AND EXISTS (
        SELECT 1
        FROM public.diva_admins a
        WHERE a.user_id = auth.uid()
    )
);


-- 17. Admin image update
CREATE POLICY "Admin update diva media"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'diva-media'
    AND EXISTS (
        SELECT 1
        FROM public.diva_admins a
        WHERE a.user_id = auth.uid()
    )
)
WITH CHECK (
    bucket_id = 'diva-media'
    AND EXISTS (
        SELECT 1
        FROM public.diva_admins a
        WHERE a.user_id = auth.uid()
    )
);


-- 18. Admin image delete
CREATE POLICY "Admin delete diva media"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'diva-media'
    AND EXISTS (
        SELECT 1
        FROM public.diva_admins a
        WHERE a.user_id = auth.uid()
    )
);


-- 19. Import the six initial offers
-- Existing offers with the same title will not be duplicated.

INSERT INTO public.diva_offers (
    title,
    description,
    badge,
    date_label,
    icon,
    active,
    sort_order
)
SELECT
    v.title,
    v.description,
    v.badge,
    v.date_label,
    v.icon,
    true,
    v.sort_order
FROM (
    VALUES
    (
        'فصل الصيف',
        'تخفيض 30% على جميع ملابس الصيف',
        'خصم 30%',
        'حتى نهاية مايو',
        'fa-bag-shopping',
        1
    ),
    (
        'فساتين السهرة',
        'خصم خاص على جميع فساتين السهرة',
        'خصم 25%',
        'عروض محدودة',
        'fa-person-dress',
        2
    ),
    (
        'الملابس الكاجوال',
        'تخفيضات على التيشيرتات والبناطيل',
        'خصم 20%',
        'طول السنة',
        'fa-shirt',
        3
    ),
    (
        'عرض خاص',
        'عند شراء بلوزتين احصلي على ثالثة بنصف الثمن',
        'اشتري 2 بـ 1',
        'عرض محدود الوقت',
        'fa-gift',
        4
    ),
    (
        'الملابس الشتوية',
        'تخفيض على الجاكيتات والمعاطف',
        'خصم 15%',
        'في فصل الشتاء',
        'fa-snowflake',
        5
    ),
    (
        'المجموعة الجديدة',
        'أحدث التصاميم والألوان المميزة',
        'جديد',
        'وصول مستمر',
        'fa-wand-magic-sparkles',
        6
    )
) AS v(
    title,
    description,
    badge,
    date_label,
    icon,
    sort_order
)
WHERE NOT EXISTS (
    SELECT 1
    FROM public.diva_offers o
    WHERE o.title = v.title
);


COMMIT;

-- ==========================================
-- DIVA STORE CMS SETUP COMPLETED
-- ==========================================
