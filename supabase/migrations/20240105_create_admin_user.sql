-- Create admin user directly in auth.users
-- Note: This requires manual password hash generation
-- For now, we'll use the edge function approach

-- First, ensure all existing events without user_id are ready for migration
UPDATE public.events
SET organizer_name = 'Admin',
    organizer_avatar = 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin'
WHERE user_id IS NULL;

-- Create a function to help with admin login
CREATE OR REPLACE FUNCTION public.get_admin_profile()
RETURNS TABLE (
  id UUID,
  username TEXT,
  email TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.username, p.email
  FROM public.profiles p
  WHERE p.username = 'admin'
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
