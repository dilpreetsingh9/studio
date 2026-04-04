
'use client';

// CRITICAL: Explicit side-effect imports force Firebase to register its internal components
// during module evaluation. This resolves "Component auth has not been registered yet".
import 'firebase/auth';
import 'firebase/firestore';
import 'firebase/messaging';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getMessaging, Messaging } from 'firebase/messaging';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let firestore: Firestore | null = null;
let messaging: Messaging | null = null;

/**
 * Initializes Firebase services strictly on the client.
 * Uses a singleton pattern to ensure stability across Next.js HMR.
 */
export function initializeFirebase() {
  if (typeof window === 'undefined') {
    return { firebaseApp: null, auth: null, firestore: null, messaging: null };
  }

  if (!app) {
    try {
      app = getApps().length ? getApp() : initializeApp(firebaseConfig);
      auth = getAuth(app);
      firestore = getFirestore(app);
      
      // Messaging might not be supported in all browsers
      try {
        messaging = getMessaging(app);
      } catch (e) {
        console.warn('Firebase Messaging not supported in this environment', e);
      }
    } catch (error) {
      console.error('Firebase initialization failed', error);
      throw error;
    }
  }

  return { firebaseApp: app, auth, firestore, messaging };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
