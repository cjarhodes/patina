import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { supabase } from '../lib/supabase';
import { useAuthStore } from './useAuthStore';

// expo-notifications is not supported in Expo Go — skip setup entirely
const isExpoGo = Constants.appOwnership === 'expo';

if (!isExpoGo) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export function usePushNotifications() {
  const session = useAuthStore((s) => s.session);

  useEffect(() => {
    if (!session || isExpoGo) return;
    registerForPushNotifications(session.user.id);
  }, [session?.user.id]);
}

async function registerForPushNotifications(userId: string) {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return;

  const tokenData = await Notifications.getExpoPushTokenAsync();
  const token = tokenData.data;

  // Upsert token to Supabase
  await supabase.from('push_tokens').upsert(
    { user_id: userId, token, platform: 'ios' },
    { onConflict: 'user_id,token' }
  );
}
