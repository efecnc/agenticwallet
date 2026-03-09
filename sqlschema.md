-- ============================================================
-- PARAFIN-CLEO: AI Financial Assistant — Supabase Schema
-- Run this entire file in your Supabase SQL Editor (single execution)
-- ============================================================

-- 0. EXTENSIONS
-- ============================================================
-- Enable pgvector for the financial memory system (semantic search)
CREATE EXTENSION IF NOT EXISTS vector;
-- Enable pg_trgm for fuzzy text search on transactions
CREATE EXTENSION IF NOT EXISTS pg_trgm;
-- Enable uuid generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- 1. USERS TABLE
-- ============================================================
-- Minimal user table for local dev. Links to Supabase Auth uid.
CREATE TABLE IF NOT EXISTS users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_id         UUID UNIQUE,                              -- maps to supabase auth.users.id
    email           TEXT UNIQUE NOT NULL,
    display_name    TEXT NOT NULL DEFAULT 'User',
    avatar_url      TEXT,
    currency        TEXT NOT NULL DEFAULT 'TRY',              -- ISO 4217 currency code
    locale          TEXT NOT NULL DEFAULT 'tr-TR',
    timezone        TEXT NOT NULL DEFAULT 'Europe/Istanbul',
    onboarded_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- 2. WALLETS TABLE
-- ============================================================
-- Each user has one "main" wallet and N savings goal sub-wallets.
-- The agent can autonomously move money between them.
CREATE TYPE wallet_type AS ENUM ('main', 'savings_goal');

CREATE TABLE IF NOT EXISTS wallets (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type            wallet_type NOT NULL DEFAULT 'main',
    name            TEXT NOT NULL DEFAULT 'Main Balance',     -- e.g. "Emergency Fund", "Vacation"
    balance         NUMERIC(15, 2) NOT NULL DEFAULT 0.00,     -- deterministic, never LLM-calculated
    target_amount   NUMERIC(15, 2),                           -- only for savings_goal type
    color           TEXT DEFAULT '#6366f1',                    -- UI accent color for goal
    icon            TEXT DEFAULT 'wallet',                     -- lucide icon name
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Business rule: exactly one 'main' wallet per user
    CONSTRAINT chk_target_amount CHECK (
        (type = 'main' AND target_amount IS NULL) OR
        (type = 'savings_goal')
    )
);

CREATE UNIQUE INDEX idx_wallets_user_main
    ON wallets (user_id) WHERE type = 'main';

CREATE INDEX idx_wallets_user ON wallets (user_id);

CREATE TRIGGER trg_wallets_updated
    BEFORE UPDATE ON wallets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- 3. TRANSACTIONS TABLE
-- ============================================================
-- Mock financial transactions (salary, groceries, subscriptions, etc.)
-- The mock data generator (Step 2) will populate this.
CREATE TYPE transaction_type AS ENUM ('income', 'expense', 'transfer');

CREATE TABLE IF NOT EXISTS transactions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    wallet_id       UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
    type            transaction_type NOT NULL,
    amount          NUMERIC(15, 2) NOT NULL,                  -- always positive; type indicates direction
    currency        TEXT NOT NULL DEFAULT 'TRY',
    category        TEXT NOT NULL,                            -- e.g. 'groceries', 'rent', 'salary', 'subscription'
    subcategory     TEXT,                                     -- e.g. 'streaming', 'gym', 'coffee'
    merchant        TEXT,                                     -- e.g. 'Migros', 'Netflix', 'Starbucks'
    description     TEXT,
    occurred_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),       -- when the transaction happened
    is_recurring    BOOLEAN NOT NULL DEFAULT FALSE,
    metadata        JSONB DEFAULT '{}',                       -- flexible extra data
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indices for the Proactive Engine's queries
CREATE INDEX idx_txn_user_date ON transactions (user_id, occurred_at DESC);
CREATE INDEX idx_txn_user_category ON transactions (user_id, category);
CREATE INDEX idx_txn_user_merchant ON transactions (user_id, merchant);
CREATE INDEX idx_txn_type ON transactions (type);

-- GIN index for JSONB metadata queries
CREATE INDEX idx_txn_metadata ON transactions USING GIN (metadata);


-- 4. WALLET TRANSFERS TABLE
-- ============================================================
-- Audit log for every agent-initiated or manual transfer between wallets.
-- Critical for the "Agentic Wallet" feature.
CREATE TYPE transfer_status AS ENUM ('pending_confirmation', 'confirmed', 'rejected', 'executed');

CREATE TABLE IF NOT EXISTS wallet_transfers (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    from_wallet_id  UUID NOT NULL REFERENCES wallets(id),
    to_wallet_id    UUID NOT NULL REFERENCES wallets(id),
    amount          NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    status          transfer_status NOT NULL DEFAULT 'pending_confirmation',
    reason          TEXT,                                     -- AI-generated explanation
    initiated_by    TEXT NOT NULL DEFAULT 'agent',            -- 'agent' or 'user'
    confirmed_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_different_wallets CHECK (from_wallet_id != to_wallet_id)
);

CREATE INDEX idx_transfers_user ON wallet_transfers (user_id, created_at DESC);
CREATE INDEX idx_transfers_status ON wallet_transfers (status);


-- 5. USER MEMORY TABLE (Financial Knowledge Memory System)
-- ============================================================
-- Stores AI-extracted facts, preferences, and rules about the user.
-- Uses pgvector for semantic retrieval in Gemini's system prompt.
CREATE TYPE memory_type AS ENUM (
    'fact',           -- "User gets paid on the 15th"
    'preference',     -- "User hates Starbucks"
    'rule',           -- "User wants to save 20% of salary"
    'goal',           -- "User is saving for a car"
    'pattern'         -- "User spends more on weekends"
);

CREATE TABLE IF NOT EXISTS user_memory (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type            memory_type NOT NULL DEFAULT 'fact',
    content         TEXT NOT NULL,                            -- human-readable fact
    embedding       vector(768),                              -- Gemini text-embedding-004 output (768 dims)
    confidence      NUMERIC(3, 2) DEFAULT 1.00,               -- 0.00-1.00 confidence score
    source          TEXT DEFAULT 'conversation',              -- 'conversation', 'inferred', 'user_stated'
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,            -- soft delete / deactivate
    last_accessed   TIMESTAMPTZ DEFAULT NOW(),                -- for LRU-style relevance
    metadata        JSONB DEFAULT '{}',                       -- extra context
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- HNSW index for fast approximate nearest-neighbor search on embeddings
CREATE INDEX idx_memory_embedding ON user_memory
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 10);

CREATE INDEX idx_memory_user ON user_memory (user_id, is_active);
CREATE INDEX idx_memory_type ON user_memory (user_id, type);

CREATE TRIGGER trg_memory_updated
    BEFORE UPDATE ON user_memory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Helper function: semantic search over user memories
CREATE OR REPLACE FUNCTION match_user_memories(
    p_user_id UUID,
    p_embedding vector(768),
    p_match_count INT DEFAULT 5,
    p_match_threshold FLOAT DEFAULT 0.7
)
RETURNS TABLE (
    id UUID,
    type memory_type,
    content TEXT,
    confidence NUMERIC,
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        um.id,
        um.type,
        um.content,
        um.confidence,
        1 - (um.embedding <=> p_embedding) AS similarity
    FROM user_memory um
    WHERE um.user_id = p_user_id
      AND um.is_active = TRUE
      AND 1 - (um.embedding <=> p_embedding) > p_match_threshold
    ORDER BY um.embedding <=> p_embedding
    LIMIT p_match_count;
END;
$$;


-- 6. PROACTIVE INSIGHTS TABLE
-- ============================================================
-- Stores AI-generated alerts and suggestions from the Proactive Engine.
-- Displayed on the dashboard before the user asks anything.
CREATE TYPE insight_severity AS ENUM ('info', 'warning', 'alert', 'positive');

CREATE TABLE IF NOT EXISTS proactive_insights (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title           TEXT NOT NULL,                            -- "Food spending is up 40%"
    body            TEXT NOT NULL,                            -- detailed explanation
    severity        insight_severity NOT NULL DEFAULT 'info',
    category        TEXT,                                     -- relates to transaction category
    is_read         BOOLEAN NOT NULL DEFAULT FALSE,
    is_dismissed    BOOLEAN NOT NULL DEFAULT FALSE,
    expires_at      TIMESTAMPTZ,                              -- auto-expire old insights
    metadata        JSONB DEFAULT '{}',                       -- e.g. { "compared_period": "last_week" }
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_insights_user ON proactive_insights (user_id, is_dismissed, created_at DESC);


-- 7. CHAT HISTORY TABLE
-- ============================================================
-- Persists conversations for context continuity.
CREATE TYPE chat_role AS ENUM ('user', 'assistant', 'system', 'tool');

CREATE TABLE IF NOT EXISTS chat_messages (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id      UUID NOT NULL DEFAULT uuid_generate_v4(), -- groups messages in a session
    role            chat_role NOT NULL,
    content         TEXT NOT NULL,
    tool_calls      JSONB,                                    -- Gemini function call metadata
    token_count     INT,                                      -- for context window management
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chat_user_session ON chat_messages (user_id, session_id, created_at);


-- 8. ROW LEVEL SECURITY (Minimal for local dev)
-- ============================================================
-- Enable RLS on all tables but with permissive policies for dev.
-- In production, these would be locked to auth.uid().

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE proactive_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Dev-mode policies: allow all operations for authenticated and anon users
-- Replace these with proper auth-based policies for production!
DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOREACH tbl IN ARRAY ARRAY[
        'users', 'wallets', 'transactions', 'wallet_transfers',
        'user_memory', 'proactive_insights', 'chat_messages'
    ]
    LOOP
        EXECUTE format(
            'CREATE POLICY "dev_allow_all_select" ON %I FOR SELECT USING (true)',
            tbl
        );
        EXECUTE format(
            'CREATE POLICY "dev_allow_all_insert" ON %I FOR INSERT WITH CHECK (true)',
            tbl
        );
        EXECUTE format(
            'CREATE POLICY "dev_allow_all_update" ON %I FOR UPDATE USING (true) WITH CHECK (true)',
            tbl
        );
        EXECUTE format(
            'CREATE POLICY "dev_allow_all_delete" ON %I FOR DELETE USING (true)',
            tbl
        );
    END LOOP;
END;
$$;


-- 9. SEED: Default Dev User
-- ============================================================
-- Insert a default user so Step 2 (mock data) has a target.
INSERT INTO users (id, email, display_name, currency, onboarded_at)
VALUES (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'dev@parafin.local',
    'Efe',
    'TRY',
    NOW()
)
ON CONFLICT (email) DO NOTHING;

-- Create their main wallet with a starting balance
INSERT INTO wallets (id, user_id, type, name, balance)
VALUES (
    '01a2b3c4-d5e6-7890-abcd-ef1234567890',
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'main',
    'Ana Hesap',       -- "Main Account" in Turkish
    12500.00
)
ON CONFLICT DO NOTHING;

-- Create two starter savings goals
INSERT INTO wallets (user_id, type, name, balance, target_amount, color, icon) VALUES
(
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'savings_goal',
    'Acil Durum Fonu',      -- "Emergency Fund"
    3200.00,
    10000.00,
    '#10b981',
    'shield'
),
(
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'savings_goal',
    'Tatil',                -- "Vacation"
    850.00,
    5000.00,
    '#f59e0b',
    'plane'
)
ON CONFLICT DO NOTHING;


-- ============================================================
-- DONE. Run `SELECT * FROM users;` to verify the seed user.
-- Proceed to Step 2 (Mock Data Generator) after confirmation.
-- ============================================================