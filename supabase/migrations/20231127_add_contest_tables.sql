-- Migration: contest tables
-- Run via supabase db push or psql

-- Table for contest participants
CREATE TABLE IF NOT EXISTS public.contest_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  school TEXT NOT NULL,
  phone TEXT NOT NULL,
  subject TEXT NOT NULL DEFAULT 'Mathematics',
  status TEXT NOT NULL CHECK (status IN ('pending','confirmed','failed')) DEFAULT 'pending',
  checkout_request_id TEXT,
  payment_confirmed_at TIMESTAMP,
  marks INT,
  answer_url TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Table for contest configuration (e.g., active flag)
CREATE TABLE IF NOT EXISTS public.contest_config (
  id TEXT PRIMARY KEY,
  active BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);
