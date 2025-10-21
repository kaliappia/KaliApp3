import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 200 });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Check if admin already exists
    const { data: existingAdmin } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', 'admin')
      .single();

    if (existingAdmin) {
      return new Response(
        JSON.stringify({ message: 'Admin account already exists', adminId: existingAdmin.id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Create admin user in auth.users
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'admin@socialcalendar.app',
      password: 'motdepasse',
      email_confirm: true,
      user_metadata: {
        username: 'admin',
        display_name: 'Admin',
        is_admin: true
      }
    });

    if (authError) throw authError;

    // Create admin profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        username: 'admin',
        display_name: 'Admin',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
        bio: 'System Administrator',
        calendar_visibility: 'public',
        is_admin: true
      })
      .select()
      .single();

    if (profileError) throw profileError;

    // Migrate all existing events to admin
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .is('user_id', null);

    if (!eventsError && events && events.length > 0) {
      const { error: updateError } = await supabase
        .from('events')
        .update({
          user_id: authData.user.id,
          organizer_id: authData.user.id,
          organizer_name: 'Admin',
          organizer_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin'
        })
        .is('user_id', null);

      if (updateError) console.error('Error migrating events:', updateError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Admin account created and data migrated',
        adminId: authData.user.id,
        migratedEvents: events?.length || 0,
        credentials: {
          username: 'admin',
          password: 'motdepasse',
          note: 'Use these credentials to login'
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});