'use client';

import { Activity } from 'lucide-react';

export function ECGLoader() {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-[100] flex flex-col items-center justify-center gap-6">
      <div className="relative">
        <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-ecg" />
        <Activity className="h-16 w-16 text-primary animate-ecg relative z-10" />
      </div>
      <div className="space-y-2 text-center">
        <h2 className="text-xl font-bold tracking-tight text-primary">Healthea</h2>
        <p className="text-sm text-muted-foreground animate-pulse">Initializing Hormone Intelligence...</p>
      </div>
      <svg className="absolute bottom-20 w-64 h-20 opacity-20" viewBox="0 0 100 20">
        <path
          d="M0 10 L10 10 L15 2 L20 18 L25 10 L40 10 L45 5 L50 15 L55 10 L70 10 L75 0 L80 20 L85 10 L100 10"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.5"
          className="text-primary"
          style={{
            strokeDasharray: 200,
            strokeDashoffset: 200,
            animation: 'dash 3s linear infinite'
          }}
        />
        <style>{`
          @keyframes dash {
            to { strokeDashoffset: 0; }
          }
        `}</style>
      </svg>
    </div>
  );
}
