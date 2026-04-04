'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// IMPORTANT: Side-effect imports to ensure component registration
// This resolves "Component auth has not been registered yet"
import 'firebase/auth';
import 'firebase/firestore';

/**
 * Initializes Firebase services on the client side.
 * This function is idempotent and ensures that services are only 
 * instantiated in the browser environment to avoid registration errors.
 */
export function initializeFirebase() {
  if (typeof window === 'undefined') {
    return {
      firebaseApp: null as unknown as FirebaseApp,
      auth: null as unknown as Auth,
      firestore: null as unknown as Firestore,
    };
  }

  let firebaseApp: FirebaseApp;
  
  if (!getApps().length) {
    firebaseApp = initializeApp(firebaseConfig);
  } else {
    firebaseApp = getApp();
  }

  // Get service instances
  // Because of the side-effect imports above, these will succeed
  const auth = getAuth(firebaseApp);
  const firestore = getFirestore(firebaseApp);

  return { firebaseApp, auth, firestore };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
