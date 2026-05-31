-- Create platform_settings table
CREATE TABLE IF NOT EXISTS app.platform_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform_name TEXT NOT NULL DEFAULT 'VoteIn e-Voting',
    default_language TEXT NOT NULL DEFAULT 'Bahasa Indonesia',
    network_name TEXT NOT NULL DEFAULT 'Base Sepolia',
    rpc_url TEXT,
    registry_address TEXT,
    gas_limit INTEGER NOT NULL DEFAULT 50,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

-- Enable RLS
ALTER TABLE app.platform_settings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "platform_settings_select_all" ON app.platform_settings
    FOR SELECT USING (true);

CREATE POLICY "platform_settings_manage_superadmin" ON app.platform_settings
    FOR ALL USING (
        app.has_role(ARRAY['super_admin'::app.app_role])
    );

-- Trigger for updated_at
CREATE TRIGGER set_platform_settings_updated_at
BEFORE UPDATE ON app.platform_settings
FOR EACH ROW EXECUTE FUNCTION app.set_updated_at();

-- Insert default row
INSERT INTO app.platform_settings (platform_name, default_language, network_name, gas_limit)
VALUES ('VoteIn e-Voting', 'Bahasa Indonesia', 'Base Sepolia', 50)
ON CONFLICT DO NOTHING;
