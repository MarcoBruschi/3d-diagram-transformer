-- Initial Migration: Multi-tenant PostgreSQL Schema + RLS + Functions

-- Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Organizations (Multi-Tenancy)
CREATE TABLE IF NOT EXISTS "organizations" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'free' CHECK ("plan" IN ('free', 'pro', 'enterprise')),
    "stripe_customer_id" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "organizations_slug_key" ON "organizations"("slug");

-- Users
CREATE TABLE IF NOT EXISTS "users" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "organization_id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "avatar_url" TEXT,
    "role" TEXT NOT NULL DEFAULT 'editor' CHECK ("role" IN ('admin', 'editor', 'viewer')),
    "provider" TEXT NOT NULL DEFAULT 'email',
    "provider_id" TEXT,
    "password_hash" TEXT,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "users_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");
CREATE INDEX IF NOT EXISTS "idx_users_org" ON "users"("organization_id");

-- Diagrams
CREATE TABLE IF NOT EXISTS "diagrams" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "organization_id" UUID NOT NULL,
    "created_by" UUID,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'custom',
    "data" JSONB NOT NULL DEFAULT '{"nodes":[],"connections":[]}',
    "node_count" INTEGER NOT NULL DEFAULT 0,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "share_token" TEXT,
    "thumbnail_url" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "diagrams_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "diagrams_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "diagrams_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "diagrams_share_token_key" ON "diagrams"("share_token");
CREATE INDEX IF NOT EXISTS "idx_diagrams_org" ON "diagrams"("organization_id");
CREATE INDEX IF NOT EXISTS "idx_diagrams_user" ON "diagrams"("created_by");
CREATE INDEX IF NOT EXISTS "idx_diagrams_share_token" ON "diagrams"("share_token") WHERE "share_token" IS NOT NULL;

-- Diagram Versions (History)
CREATE TABLE IF NOT EXISTS "diagram_versions" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "diagram_id" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "data" JSONB NOT NULL,
    "created_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "diagram_versions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "diagram_versions_diagram_id_fkey" FOREIGN KEY ("diagram_id") REFERENCES "diagrams"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "diagram_versions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "diagram_versions_diagram_id_version_key" ON "diagram_versions"("diagram_id", "version");
CREATE INDEX IF NOT EXISTS "idx_diagram_versions_diagram" ON "diagram_versions"("diagram_id");

-- Diagram Collaborators
CREATE TABLE IF NOT EXISTS "diagram_collaborators" (
    "diagram_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "permission" TEXT NOT NULL DEFAULT 'editor' CHECK ("permission" IN ('editor', 'viewer')),
    "invited_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "diagram_collaborators_pkey" PRIMARY KEY ("diagram_id","user_id"),
    CONSTRAINT "diagram_collaborators_diagram_id_fkey" FOREIGN KEY ("diagram_id") REFERENCES "diagrams"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "diagram_collaborators_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Audit Logs
CREATE TABLE IF NOT EXISTS "audit_logs" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID,
    "org_id" UUID,
    "action" TEXT NOT NULL,
    "resource_id" UUID,
    "metadata" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "audit_logs_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "idx_audit_logs_user" ON "audit_logs"("user_id", "created_at" DESC);

-- Row-Level Security (RLS)
ALTER TABLE diagrams ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagram_versions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'diagrams' AND policyname = 'diagrams_org_isolation'
    ) THEN
        CREATE POLICY diagrams_org_isolation ON diagrams
        USING (
            organization_id = NULLIF(current_setting('app.current_org_id', true), '')::UUID
            OR is_public = TRUE
        );
    END IF;
END $$;

-- Tenant Context Helper Function
CREATE OR REPLACE FUNCTION set_tenant_context(org_id UUID)
RETURNS VOID AS $$
BEGIN
    PERFORM set_config('app.current_org_id', org_id::TEXT, TRUE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
