
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Plus, 
  Pill, 
  Clock, 
  Trash2, 
  Bell,
  BellOff,
  Loader2,
  Wind,
  Sparkles,
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Medication } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { t } from '@/lib/translations';
import { useToast } from '@/hooks/use-toast';
import { analyzeMissedMedication, AnalyzeMissedMedicationOutput } from '@/ai/flows/analyze-missed-medication';
import { acknowledgeMedicationIntake } from '@/ai/flows/acknowledge-medication-intake';
import { acknowledgeNewMedication } from '@/ai/flows/acknowledge-new-medication';
import { useFirestore, useUser } from '@/firebase';
import { doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { useNotifications } from '@/hooks/use-notifications';

interface MedicationReminderProps {
  language?: string;
  relationshipMaturity?: 'new' | 'developing' | 'established' | 'deep';
  medications: Medication[];
}

export default function MedicationReminder({ 
  language = 'English',
  relationshipMaturity = 'developing',
  medications = []
}: MedicationReminderProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [analyzingMedId, setAnalyzingMedId] = useState<string | null>(null);
  const [processingIntakeId, setProcessingIntakeId] = useState<string | null>(null);
  const [nudges, setNudges] = useState<Record<string, AnalyzeMissedMedicationOutput>>({});
  
  const { toast } = useToast();
  const db = useFirestore();
  const { user } = useUser();
  const { isSupported, permission, requestPermission, disableNotifications } = useNotifications();
  
  const [newMed, setNewMed] = useState<Partial<Medication>>({
    priority: 'Essential',
    reminderTime: '09:00 AM'
  });

  const isNotificationsEnabled = permission === 'granted';

  const handleToggleNotifications = async () => {
    if (!isNotificationsEnabled) {
      const success = await requestPermission();
      if (success) {
        toast({
          title: "Soft Reminders On",
          description: "I will nudge you with privacy-safe 'Upcoming event' alerts.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Permission Denied",
          description: "Please check your browser settings to allow Jeiva to send notifications.",
        });
      }
    } else {
      await disableNotifications();
      toast({
        title: "Reminders Paused",
        description: "I will stay quiet for now.",
      });
    }
  };

  const handleAddMed = async () => {
    if (!user) return;
    if (newMed.name && newMed.dosage) {
      setIsAdding(true);
      try {
        const medId = Math.random().toString(36).substr(2, 9);
        const medRef = doc(db, 'users', user.uid, 'medications', medId);
        
        const med: Medication = {
          id: medId,
          name: newMed.name,
          dosage: newMed.dosage,
          frequency: newMed.frequency || 'Daily',
          priority: newMed.priority as any || 'Essential',
          reminderTime: newMed.reminderTime || '09:00 AM',
          streak: 0
        };

        const isHormonal = med.name.toLowerCase().includes('pill') || 
                          med.name.toLowerCase().includes('estrogen') || 
                          med.name.toLowerCase().includes('progesterone');

        const result = await acknowledgeNewMedication({
          medicationName: med.name,
          medicationType: med.priority,
          scheduledTime: med.reminderTime,
          isHormonal,
          targetLanguage: language
        });

        await setDoc(medRef, med);
        setNewMed({ priority: 'Essential', reminderTime: '09:00 AM' });
        setIsAddOpen(false);
        
        toast({
          title: "Routine Updated",
          description: result.acknowledgement,
        });
      } catch (error) {
        console.error('Failed to add medication', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "I couldn't add that routine right now. Please try again.",
        });
      } finally {
        setIsAdding(false);
      }
    }
  };

  const handleConfirmIntake = async (med: Medication) => {
    if (!user) return;
    setProcessingIntakeId(med.id);
    try {
      const medRef = doc(db, 'users', user.uid, 'medications', med.id);
      const newStreak = (med.streak || 0) + 1;
      const milestones = [7, 14, 30, 60, 90];
      const isMilestone = milestones.includes(newStreak);

      const result = await acknowledgeMedicationIntake({
        medicationName: med.name,
        newStreak,
        isMilestone,
        targetLanguage: language
      });

      await updateDoc(medRef, {
        streak: newStreak,
        lastTaken: new Date().toISOString()
      });

      toast({
        title: "Routine witnessed",
        description: result.acknowledgement,
      });
    } catch (error) {
      console.error('Failed to acknowledge intake', error);
    } finally {
      setProcessingIntakeId(null);
    }
  };

  const removeMed = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'medications', id));
    } catch (error) {
      console.error('Failed to remove medication', error);
    }
  };

  const isTakenToday = (med: Medication) => {
    if (!med.lastTaken) return false;
    const lastTaken = new Date(med.lastTaken);
    const today = new Date();
    return lastTaken.getDate() === today.getDate() &&
           lastTaken.getMonth() === today.getMonth() &&
           lastTaken.getFullYear() === today.getFullYear();
  };

  return (
    <Card className="shadow-md border-primary/10 overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="space-y-1">
          <CardTitle className="text-xl font-black tracking-tight flex items-center gap-2">
            <Pill className="h-5 w-5 text-primary" />
            {t('medications', language)}
          </CardTitle>
          <CardDescription className="text-xs font-medium italic">Your daily sustenance and routine.</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          {isSupported && (
            <Button 
              variant="ghost" 
              size="icon" 
              className={cn(
                "h-10 w-10 rounded-2xl transition-all", 
                isNotificationsEnabled ? "text-primary bg-primary/5 border border-primary/10" : "text-muted-foreground bg-muted/5 border border-transparent"
              )}
              onClick={handleToggleNotifications}
            >
              {isNotificationsEnabled ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
            </Button>
          )}
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="h-10 rounded-2xl border-primary/10 bg-primary/5 text-primary font-bold px-4">
                <Plus className="h-4 w-4 mr-1.5" /> {t('addMedication', language)}
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-[2.5rem] p-8 border-none shadow-2xl">
              <DialogHeader className="text-left space-y-2">
                <DialogTitle className="text-2xl font-black tracking-tight">{t('addMedication', language)}</DialogTitle>
                <DialogDescription className="font-medium italic">
                  Help me understand your daily routine.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Routine Name</Label>
                  <Input 
                    placeholder="e.g. Vitamin D" 
                    className="h-12 rounded-2xl bg-muted/20 border-primary/5"
                    value={newMed.name || ''} 
                    onChange={e => setNewMed({...newMed, name: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t('dosage', language)}</Label>
                    <Input 
                      placeholder="e.g. 1 tab" 
                      className="h-12 rounded-2xl bg-muted/20 border-primary/5"
                      value={newMed.dosage || ''} 
                      onChange={e => setNewMed({...newMed, dosage: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Nature</Label>
                    <Select 
                      value={newMed.priority} 
                      onValueChange={v => setNewMed({...newMed, priority: v as any})}
                    >
                      <SelectTrigger className="h-12 rounded-2xl bg-muted/20 border-primary/5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl">
                        <SelectItem value="Essential">Essential</SelectItem>
                        <SelectItem value="Supportive">Supportive</SelectItem>
                        <SelectItem value="Occasional">Occasional</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Reminder Time</Label>
                  <Input 
                    type="time"
                    className="h-12 rounded-2xl bg-muted/20 border-primary/5"
                    value={newMed.reminderTime || '09:00'} 
                    onChange={e => setNewMed({...newMed, reminderTime: e.target.value})}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddMed} className="w-full h-14 rounded-2xl font-black text-lg shadow-lg" disabled={isAdding}>
                  {isAdding ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                  Save to Routine
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {isNotificationsEnabled && (
          <div className="bg-primary/5 p-4 rounded-3xl border border-primary/10 flex items-center gap-3">
            <ShieldCheck className="h-4 w-4 text-primary opacity-60" />
            <p className="text-[10px] font-bold text-primary/60 uppercase tracking-widest leading-tight">
              Soft Reminders Active · Privacy Protected
            </p>
          </div>
        )}

        <ScrollArea className="h-[350px] pr-4">
          <div className="space-y-4">
            {medications.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground italic text-small border-2 border-dashed rounded-3xl bg-muted/5 font-content">
                 <Wind className="h-10 w-10 mx-auto mb-3 opacity-20" />
                 No routines added yet.
              </div>
            ) : (
              medications.map((med) => (
                <div key={med.id} className="space-y-2">
                  <div className="flex items-center justify-between p-4 rounded-3xl border bg-card hover:shadow-md transition-all group relative overflow-hidden">
                    <div className="flex gap-4 items-start relative z-10">
                      <div className={cn(
                        "mt-1 p-3 rounded-2xl transition-colors shadow-sm",
                        isTakenToday(med) ? "bg-emerald-100 text-emerald-600 border border-emerald-200" : "bg-primary/10 text-primary border border-primary/5"
                      )}>
                        {isTakenToday(med) ? <CheckCircle2 className="h-5 w-5" /> : <Pill className="h-5 w-5" />}
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm text-primary">{med.name}</p>
                          <Badge variant="outline" className="text-[9px] px-1.5 h-4 bg-primary/5 text-primary/60 border-primary/10 uppercase font-black">
                            {med.priority}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground font-medium italic">{med.dosage} · {med.frequency}</p>
                        <div className="flex items-center gap-1.5 text-[10px] font-black text-primary/40 uppercase tracking-widest mt-1">
                          <Clock className="h-3 w-3" />
                          {med.reminderTime}
                          {med.streak && med.streak > 0 && (
                            <span className="ml-2 text-orange-600/60 lowercase">· {med.streak} day streak</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1.5 relative z-10">
                      {!isTakenToday(med) ? (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-10 px-4 rounded-full text-xs font-black uppercase tracking-widest text-emerald-600 hover:bg-emerald-50"
                          onClick={() => handleConfirmIntake(med)}
                          disabled={processingIntakeId === med.id}
                        >
                          {processingIntakeId === med.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Mark Taken"}
                        </Button>
                      ) : (
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600/40 px-4 py-2 bg-emerald-50 rounded-full border border-emerald-100">
                          Done
                        </span>
                      )}
                      
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-10 w-10 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"
                        onClick={() => removeMed(med.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
