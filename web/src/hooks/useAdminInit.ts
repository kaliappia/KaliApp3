import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export function useAdminInit() {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const initAdmin = async () => {
      try {
        // Check if already initialized
        const hasRun = localStorage.getItem('admin_initialized');
        if (hasRun) {
          setInitialized(true);
          return;
        }

        // Call init-admin edge function
        const { data, error } = await supabase.functions.invoke('supabase-functions-init-admin');

        if (error) {
          console.error('Admin init error:', error);
        } else {
          console.log('Admin initialized:', data);
          localStorage.setItem('admin_initialized', 'true');
        }
      } catch (error) {
        console.error('Failed to initialize admin:', error);
      } finally {
        setInitialized(true);
      }
    };

    initAdmin();
  }, []);

  return initialized;
}
