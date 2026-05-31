-- Function to create a notification when a new profile is activated (inserted)
CREATE OR REPLACE FUNCTION app.on_profile_activation_notify()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO app.notification_jobs (
        target_profile_id,
        channel,
        template_key,
        payload
    ) VALUES (
        NEW.id,
        'in_app',
        'ACCOUNT_ACTIVATED',
        jsonb_build_object(
            'title', 'Akun Berhasil Diaktifkan',
            'display_name', NEW.display_name,
            'email', NEW.email,
            'message', 'Akun Anda telah berhasil diaktifkan. Anda kini dapat berpartisipasi dalam ekosistem e-voting dan mengelola data pemilihan.'
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to fire on profile creation
DROP TRIGGER IF EXISTS on_profile_activated ON app.app_profiles;
CREATE TRIGGER on_profile_activated
AFTER INSERT ON app.app_profiles
FOR EACH ROW
EXECUTE FUNCTION app.on_profile_activation_notify();
