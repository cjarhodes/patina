import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import * as Linking from 'expo-linking';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../hooks/useAuthStore';
import { usePushNotifications } from '../hooks/usePushNotifications';

const queryClient = new QueryClient();

export default function RootLayout() {
  const setSession = useAuthStore((s) => s.setSession);
  usePushNotifications();

  useEffect(() => {
    async function checkOnboardingAndRoute(session: any) {
      if (!session) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_complete')
        .eq('id', session.user.id)
        .single();

      if (!profile?.onboarding_complete) {
        router.replace('/(auth)/onboarding');
      } else {
        router.replace('/(tabs)');
      }
    }

    // Initial session check — handles cold start and returning after email confirmation
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        checkOnboardingAndRoute(session);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        await checkOnboardingAndRoute(session);
      } else if (event === 'SIGNED_OUT') {
        router.replace('/(auth)/sign-in');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    // Handle deep links
    function handleDeepLink(event: { url: string }) {
      const parsed = Linking.parse(event.url);
      if (parsed.path?.startsWith('results/')) {
        const searchId = parsed.path.replace('results/', '');
        if (searchId) {
          router.push(`/results/${searchId}`);
        }
      }
    }

    // Handle link that opened the app
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink({ url });
    });

    // Handle links while app is open
    const subscription = Linking.addEventListener('url', handleDeepLink);
    return () => subscription.remove();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="results/[searchId]" options={{ presentation: 'card' }} />
      </Stack>
    </QueryClientProvider>
  );
}
