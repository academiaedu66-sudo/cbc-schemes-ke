-- Migration: add revenue growth related tables and columns
-- Run via supabase db push or psql

-- Extend customers table
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS vip_until TIMESTAMP,
  ADD COLUMN IF NOT EXISTS homework_used INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS homework_reset_at TIMESTAMP;

-- Table for VIP subscriptions (optional separate tracking)
CREATE TABLE IF NOT EXISTS public.vip_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Table for school invoices
CREATE TABLE IF NOT EXISTS public.school_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  grades TEXT[] NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending','paid','cancelled')),
  payment_intent_id TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  paid_at TIMESTAMP
);

-- Table for teacher‑created assets (marketplace)
CREATE TABLE IF NOT EXISTS public.teacher_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Table for teacher subscriptions (if they also buy VIP)
CREATE TABLE IF NOT EXISTS public.teacher_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  vip_until TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Table for quiz tournament entries
CREATE TABLE IF NOT EXISTS public.quiz_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL,
  entry_time TIMESTAMP NOT NULL DEFAULT now(),
  paid BOOLEAN NOT NULL DEFAULT FALSE
);

-- Table for order bumps
CREATE TABLE IF NOT EXISTS public.order_bumps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  bump_type TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Simple wallet table for teachers / tutors
CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);
