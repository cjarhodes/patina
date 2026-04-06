import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { useAuthStore } from '../hooks/useAuthStore';
import { supabase } from '../lib/supabase';

export default function Index() {
  const session = useAuthStore((s) => s.session);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);

  useEffect(() => {
    if (!session) return;
    supabase
      .from('profiles')
      .select('id')
      .eq('id', session.user.id)
      .maybeSingle()
      .then(({ data }) => setHasProfile(!!data));
  }, [session?.user.id]);

  if (!session) return <Redirect href="/(auth)/sign-in" />;
  if (hasProfile === null) return null; // loading
  if (!hasProfile) return <Redirect href="/(auth)/onboarding" />;
  return <Redirect href="/(tabs)" />;
}
