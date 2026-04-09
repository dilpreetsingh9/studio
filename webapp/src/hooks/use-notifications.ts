
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useMessaging, useUser, useFirestore } from '@/firebase';
import { getToken, onMessage } from 'firebase/messaging';
import { doc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';
import { useToast } from './use-toast';

/**
 * Handles Push Notification permissions and FCM token management.
 */
export function useNotifications() {
  const messaging = useMessaging();
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    setIsSupported(!!messaging && 'Notification' in window);
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, [messaging]);

  const requestPermission = useCallback(async () => {
    if (!messaging || !user) return false;

    try {
      const status = await Notification.requestPermission();
      setPermission(status);

      if (status === 'granted') {
        // Register Service Worker explicitly if needed, but Firebase usually handles it
        // Get the token
        const token = await getToken(messaging, {
          vapidKey: 'BM_placeholder_vapid_key_for_studio' // In prod, replace with real key
        });

        if (token) {
          // Store token in Firestore for this user
          const userRef = doc(db, 'users', user.uid);
          await updateDoc(userRef, {
            fcmTokens: arrayUnion(token),
            notificationsEnabled: true,
            updatedAt: new Date().toISOString()
          });
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Failed to enable notifications:', error);
      return false;
    }
  }, [messaging, user, db]);

  const disableNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        notificationsEnabled: false,
        updatedAt: new Date().toISOString()
      });
      setPermission('default');
    } catch (error) {
      console.error('Failed to disable notifications:', error);
    }
  }, [user, db]);

  // Listen for foreground messages
  useEffect(() => {
    if (!messaging) return;
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Message received in foreground: ', payload);
      toast({
        title: payload.notification?.title || "Jeiva Nudge",
        description: payload.notification?.body || "A new update is available.",
      });
    });
    return () => unsubscribe();
  }, [messaging, toast]);

  return {
    isSupported,
    permission,
    requestPermission,
    disableNotifications
  };
}
