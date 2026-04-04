'use client';

import React, { useState, useEffect, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';
import { FirebaseApp } from 'firebase/app';
import { Auth } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';
import { ECGLoader } from '@/components/ecg-loader';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const [state, setState] = useState<{
    app: FirebaseApp | null;
    auth: Auth | null;
    firestore: Firestore | null;
    isInitialized: boolean;
  }>({
    app: null,
    auth: null,
    firestore: null,
    isInitialized: false,
  });

  useEffect(() => {
    // Initialize Firebase ONLY once on the client side
    const services = initializeFirebase();
    setState({
      app: services.firebaseApp,
      auth: services.auth,
      firestore: services.firestore,
      isInitialized: true,
    });
  }, []);

  // Show the ECG loader until the client-side handshake is complete
  if (!state.isInitialized || !state.app || !state.auth || !state.firestore) {
    return <ECGLoader />;
  }

  return (
    <FirebaseProvider
      firebaseApp={state.app}
      auth={state.auth}
      firestore={state.firestore}
    >
      {children}
    </FirebaseProvider>
  );
}
