-- Optionale Uhrzeit für Aufgaben (HH:MM)
ALTER TABLE public.todos ADD COLUMN IF NOT EXISTS due_time TEXT;
