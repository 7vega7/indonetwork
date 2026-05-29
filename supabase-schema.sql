-- INDONETWORK - Schema Database Supabase
-- Jalankan di Supabase SQL Editor

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users
CREATE TABLE IF NOT EXISTS public.users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username      VARCHAR(20) UNIQUE NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  balance       DECIMAL(15,2) NOT NULL DEFAULT 0,
  role          VARCHAR(10) NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin')),
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  referral_code VARCHAR(10) UNIQUE,
  referred_by   UUID REFERENCES public.users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login    TIMESTAMPTZ
);

-- Transactions
CREATE TABLE IF NOT EXISTS public.transactions (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type           VARCHAR(20) NOT NULL CHECK (type IN ('deposit','withdraw','bet','win','bonus')),
  amount         DECIMAL(15,2) NOT NULL,
  balance_before DECIMAL(15,2) NOT NULL,
  balance_after  DECIMAL(15,2) NOT NULL,
  description    TEXT,
  reference      VARCHAR(100),
  provider       VARCHAR(50),
  game_code      VARCHAR(100),
  txn_id         VARCHAR(100) UNIQUE,
  status         VARCHAR(20) NOT NULL DEFAULT 'success',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Deposits
CREATE TABLE IF NOT EXISTS public.deposits (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount      DECIMAL(15,2) NOT NULL,
  method      VARCHAR(20) NOT NULL,
  reference   VARCHAR(100) UNIQUE NOT NULL,
  status      VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','success','failed','expired')),
  payment_url TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_txn_id ON public.transactions(txn_id);
CREATE INDEX IF NOT EXISTS idx_deposits_user_id ON public.deposits(user_id);

-- Nonaktifkan RLS (kita pakai service key)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposits DISABLE ROW LEVEL SECURITY;
