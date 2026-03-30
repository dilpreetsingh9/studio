'use client';

import { Pill, Wind, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Medication } from '@/lib/types';
import { useFirestore, useUser } from '@/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { acknowledgeMedicationIntake } from '@/ai/flows/acknowledge-medication-intake';

interface RoutineStripProps {
  state: 'due' | 'missed';
  medication: Medication;
  firstName: string;
}

export function RoutineStrip({ state, medication, firstName }: RoutineStripProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const handleConfirm = async () => {
    if (!user) return;
    setIsProcessing(true);
    try {
      const medRef = doc(db, 'users', user.uid, 'medications', medication.id);
      const newStreak = (medication.streak || 0) + 1;
      
      await updateDoc(medRef, {
        lastTaken: new Date().toISOString(),
        streak: newStreak
      });

      const aiResponse = await acknowledgeMedicationIntake({
        medicationName: medication.name,
        newStreak,
        isMilestone: [7, 14, 30, 60, 90].includes(newStreak),
        targetLanguage: 'English'
      });

      toast({
        title: "Routine witnessed",
        description: aiResponse.acknowledgement,
      });
    } catch (error) {
      console.error('Failed to update routine', error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (state === 'due') {
    return (
      <div className="bg-primary/5 border border-primary/10 p-4 rounded-[2rem] flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-500">
        <div className="flex items-center gap-3">
          <div className="bg-primary p-2.5 rounded-2xl text-white shrink-0 shadow-sm">
            <Pill className="h-4 w-4" />
          </div>
          <div className="space-y-0.5">
            <p className="font-content text-voice italic leading-tight text-primary">
              "{firstName}, it is time for your {medication.name}."
            </p>
            <p className="text-[10px] font-black uppercase tracking-widest text-primary/40 font-ui">Scheduled for {medication.reminderTime}</p>
          </div>
        </div>
        <Button 
          size="sm" 
          onClick={handleConfirm}
          disabled={isProcessing}
          className="rounded-full h-10 px-5 text-label font-bold uppercase tracking-widest shadow-md transition-all active:scale-95"
        >
          {isProcessing ? <Loader2 className="h-3 w-3 animate-spin" /> : "Mark Taken"}
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-amber-50 border border-amber-100 p-4 rounded-[2rem] flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-500">
      <div className="flex items-center gap-3">
        <div className="bg-amber-500 p-2.5 rounded-2xl text-white shrink-0 shadow-sm">
          <Wind className="h-4 w-4" />
        </div>
        <div className="space-y-0.5">
          <p className="font-content text-voice italic leading-tight text-amber-900">
            "Your {medication.name} got away earlier. Today is a clean start."
          </p>
          <p className="text-[10px] font-black uppercase tracking-widest text-amber-600/40 font-ui">Missed at {medication.reminderTime}</p>
        </div>
      </div>
      <Button 
        variant="outline"
        size="sm" 
        onClick={handleConfirm}
        disabled={isProcessing}
        className="rounded-full h-10 px-5 text-label font-bold uppercase tracking-widest border-amber-200 text-amber-700 bg-white hover:bg-amber-100 shadow-sm transition-all active:scale-95"
      >
        {isProcessing ? <Loader2 className="h-3 w-3 animate-spin" /> : "Take Now"}
      </Button>
    </div>
  );
}
