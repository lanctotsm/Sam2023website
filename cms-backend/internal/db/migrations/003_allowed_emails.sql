-- Table to store allowed email addresses for Google OAuth authentication
CREATE TABLE IF NOT EXISTS allowed_emails (
	id SERIAL PRIMARY KEY,
	email TEXT UNIQUE NOT NULL,
	is_base_admin BOOLEAN NOT NULL DEFAULT FALSE,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast email lookups
CREATE INDEX IF NOT EXISTS idx_allowed_emails_email ON allowed_emails(email);
CREATE INDEX IF NOT EXISTS idx_allowed_emails_base_admin ON allowed_emails(is_base_admin) WHERE is_base_admin = TRUE;

-- Function to seed base admin email from environment variable
-- This will be called programmatically, not via SQL directly
