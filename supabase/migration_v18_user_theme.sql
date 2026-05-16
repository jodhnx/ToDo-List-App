-- Focus — User Theme Preferences (Migration v18)
-- Im Supabase SQL Editor ausführen, damit Designs kontoübergreifend synchronisiert werden.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS app_theme TEXT NOT NULL DEFAULT 'modern-dark';

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_app_theme_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_app_theme_check
  CHECK (
    app_theme IN (
      'modern-dark',
      'modern-light',
      'apple-style',
      'minimal-clean',
      'family-warm',
      'blue-ocean',
      'emerald-green',
      'purple-night',
      'soft-beige',
      'senior-friendly',
      'high-contrast',
      'neon-dark'
    )
  );

CREATE INDEX IF NOT EXISTS profiles_app_theme_idx ON public.profiles (app_theme);
