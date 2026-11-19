-- ==============================================================================
-- ForensIQ Evidence Vault - Supabase Schema Migration
-- Run this script in the Supabase Dashboard -> SQL Editor -> New query -> Run
-- ==============================================================================

-- 1. Create Evidence Vault Table
CREATE TABLE IF NOT EXISTS public.evidence_vault (
    case_id TEXT PRIMARY KEY,
    file_name TEXT NOT NULL,
    file_hash TEXT NOT NULL UNIQUE,
    file_size_bytes BIGINT NOT NULL,
    mime_type TEXT NOT NULL,
    tamper_probability INTEGER NOT NULL CHECK (tamper_probability >= 0 AND tamper_probability <= 100),
    verdict TEXT NOT NULL,
    classification_model TEXT NOT NULL,
    exif_software TEXT,
    camera_make TEXT,
    anomalies_json TEXT NOT NULL DEFAULT '[]',
    ela_base64_preview TEXT,
    timestamp_utc TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 2. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_evidence_vault_file_hash ON public.evidence_vault (file_hash);
CREATE INDEX IF NOT EXISTS idx_evidence_vault_timestamp ON public.evidence_vault (timestamp_utc DESC);
CREATE INDEX IF NOT EXISTS idx_evidence_vault_verdict ON public.evidence_vault (verdict);

-- 3. Row Level Security (RLS)
ALTER TABLE public.evidence_vault ENABLE ROW LEVEL SECURITY;

-- 4. Access Policies
-- Allow read access for everyone (anonymous & authenticated) to view forensic cases
CREATE POLICY "Allow public read access to evidence vault"
ON public.evidence_vault
FOR SELECT
TO anon, authenticated
USING (true);

-- Allow insertions (from backend API or authenticated client workflows)
CREATE POLICY "Allow insert access to evidence vault"
ON public.evidence_vault
FOR INSERT
TO anon, authenticated, service_role
WITH CHECK (true);

-- Allow updates only for authenticated/service role
CREATE POLICY "Allow update access to evidence vault"
ON public.evidence_vault
FOR UPDATE
TO authenticated, service_role
USING (true)
WITH CHECK (true);
