
'use client';

import React, { useState, useEffect, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';
import { FirebaseApp } from 'firebase/app';
import { Auth } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';
import { Messaging } from 'firebase/messaging';
import { ECGLoader } from '@/components/ecg-loader';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const [state, setState] = useState<{
    app: FirebaseApp | null;
    auth: Auth | null;
    firestore: Firestore | null;
    messaging: Messaging | null;
    isInitialized: boolean;
    error: string | null;
  }>({
    app: null,
    auth: null,
    firestore: null,
    messaging: null,
    isInitialized: false,
    error: null,
  });

  const performHandshake = () => {
    setState(prev => ({ ...prev, error: null, isInitialized: false }));
    try {
      const services = initializeFirebase();
      
      // Ensure critical services are available
      if (!services.auth || !services.firestore) {
        throw new Error("Critical Firebase components (Auth/Firestore) could not be registered.");
      }

      setState({
        app: services.firebaseApp,
        auth: services.auth,
        firestore: services.firestore,
        messaging: services.messaging,
        isInitialized: true,
        error: null,
      });
    } catch (e: any) {
      console.error('Initialization handshake failed:', e);
      setState(prev => ({
        ...prev,
        isInitialized: true,
        error: e.message || "Component registration failure"
      }));
    }
  };

  useEffect(() => {
    performHandshake();
  }, []);

  if (!state.isInitialized) {
    return <ECGLoader />;
  }

  if (state.error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#F8F7FB] p-6 z-[200]">
        <div className="max-w-md w-full bg-white rounded-[2rem] p-8 shadow-2xl border border-red-100 text-center space-y-6">
          <div className="bg-red-50 p-4 rounded-3xl inline-block">
            <AlertCircle className="h-12 w-12 text-red-500" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black tracking-tight text-primary">Initialization Issue</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Jeiva had trouble establishing a connection to the clinical backend.
            </p>
            <div className="p-3 bg-muted/30 rounded-xl text-[10px] font-mono text-left overflow-auto mt-4 border">
              {state.error}
            </div>
          </div>
          <Button 
            onClick={performHandshake} 
            className="w-full h-14 rounded-2xl font-black uppercase tracking-widest shadow-lg"
          >
            <RotateCcw className="mr-2 h-5 w-5" />
            Retry Connection
          </Button>
        </div>
      </div>
    );
  }

  return (
    <FirebaseProvider
      firebaseApp={state.app!}
      auth={state.auth!}
      firestore={state.firestore!}
      messaging={state.messaging}
    >
      {children}
    </FirebaseProvider>
  );
}
