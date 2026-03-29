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
  CheckCircle2
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
import { patientData } from '@/lib/data';
import { Medication } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { t } from '@/lib/translations';
import { useToast } from '@/hooks/use-toast';
import { analyzeMissedMedication, AnalyzeMissedMedicationOutput } from '@/ai/flows/analyze-missed-medication';
import { acknowledgeMedicationIntake } from '@/ai/flows/acknowledge-medication-intake';

interface MedicationReminderProps {
  language?: string;
  relationshipMaturity?: 'new' | 'developing' | 'established' | 'deep';
}

export default function MedicationReminder({ 
  language = 'English',
  relationshipMaturity = 'developing'
}: MedicationReminderProps) {
  const [meds, setMeds] = useState<Medication[]>(patientData.medications || [
    { id: '1', name: 'Vitamin D3', dosage: '2000 IU', frequency: 'Daily', priority: 'Supportive', reminderTime: '08:00 AM', streak: 5 },
    { id: '2', name: 'Magnesium', dosage: '250 mg', frequency: 'Daily', priority: 'Supportive', reminderTime: '09:00 PM', streak: 13 }
  ]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(false);
  const [analyzingMedId, setAnalyzingMedId] = useState<string | null>(null);
  const [processingIntakeId, setProcessingIntakeId] = useState<string | null>(null);
  const [nudges, setNudges] = useState<Record<string, AnalyzeMissedMedicationOutput>>({});
  const { toast } = useToast();
  
  const [newMed, setNewMed] = useState<Partial<Medication>>({
    priority: 'Essential',
  });

  const handleToggleNotifications = async () => {
    if (!isNotificationsEnabled) {
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          setIsNotificationsEnabled(true);
          toast({
            title: "Soft Reminders On",
            description: "I will nudge you with a generic 'Upcoming event' alert to keep your privacy safe.",
          });
        }
      }
    } else {
      setIsNotificationsEnabled(false);
      toast({
        title: "Reminders Paused",
        description: "I will stay quiet for now.",
      });
    }
  };

  const handleAddMed = () => {
    if (newMed.name && newMed.dosage) {
      const med: Medication = {
        id: Math.random().toString(36).substr(2, 9),
        name: newMed.name,
        dosage: newMed.dosage,
        frequency: newMed.frequency || 'Daily',
        priority: newMed.priority as any || 'Essential',
        reminderTime: newMed.reminderTime || '09:00 AM',
        streak: 0
      };
      setMeds([...meds, med]);
      setNewMed({ priority: 'Essential' });
      setIsAddOpen(false);
      toast({
        title: "Routine Updated",
        description: `${med.name} is now part of our rhythm.`,
      });
    }
  };

  const handleGetNudge = async (med: Medication) => {
    setAnalyzingMedId(med.id);
    try {
      const result = await analyzeMissedMedication({
        medicationName: med.name,
        missedCount: 1, 
        streakDays: med.streak || 0,
        relationshipMaturity,
        targetLanguage: language
      });
      setNudges(prev => ({ ...prev, [med.id]: result }));
    } catch (error) {
      console.error(error);
    } finally {
      setAnalyzingMedId(null);
    }
  };

  const handleConfirmIntake = async (med: Medication) => {
    setProcessingIntakeId(med.id);
    try {
      const newStreak = (med.streak || 0) + 1;
      const milestones = [7, 14, 30, 60, 90];
      const isMilestone = milestones.includes(newStreak);

      const result = await acknowledgeMedicationIntake({
        medicationName: med.name,
        newStreak,
        isMilestone,
        targetLanguage: language
      });

      // Update local state (mock)
      setMeds(prev => prev.map(m => m.id === med.id ? { 
        ...m, 
        streak: newStreak, 
        lastTaken: new Date().toISOString() 
      } : m));

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

  const removeMed = (id: string) => {
    setMeds(meds.filter(m => m.id !== id));
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
    <Card className="shadow-md border-primary/10">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Pill className="h-5 w-5 text-primary" />
            {t('medications', language)}
          </CardTitle>
          <CardDescription>Your daily sustenance and routine.</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className={cn("h-8 w-8 rounded-full", isNotificationsEnabled ? "text-primary bg-primary/10" : "text-muted-foreground")}
            onClick={handleToggleNotifications}
          >
            {isNotificationsEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
          </Button>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="h-8">
                <Plus className="h-4 w-4 mr-1" /> {t('addMedication', language)}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('addMedication', language)}</DialogTitle>
                <DialogDescription>
                  Help me understand your daily routine.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Name</Label>
                  <Input 
                    placeholder="e.g. Vitamin D" 
                    value={newMed.name || ''} 
                    onChange={e => setNewMed({...newMed, name: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>{t('dosage', language)}</Label>
                    <Input 
                      placeholder="e.g. 1 tab" 
                      value={newMed.dosage || ''} 
                      onChange={e => setNewMed({...newMed, dosage: e.target.value})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Nature</Label>
                    <Select 
                      value={newMed.priority} 
                      onValueChange={v => setNewMed({...newMed, priority: v as any})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Essential">Essential</SelectItem>
                        <SelectItem value="Supportive">Supportive</SelectItem>
                        <SelectItem value="Occasional">Occasional</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddMed} className="w-full">Save to Routine</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[350px] pr-4">
          <div className="space-y-4">
            {meds.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground italic text-sm border-2 border-dashed rounded-2xl bg-muted/5">
                 <Wind className="h-8 w-8 mx-auto mb-2 opacity-20" />
                 No routines added yet.
              </div>
            ) : (
              meds.map((med) => (
                <div key={med.id} className="space-y-2">
                  <div className="flex items-center justify-between p-3 rounded-xl border bg-card hover:shadow-sm transition-all group">
                    <div className="flex gap-3 items-start">
                      <div className={cn(
                        "mt-1 p-2 rounded-lg transition-colors",
                        isTakenToday(med) ? "bg-emerald-100 text-emerald-600" : "bg-primary/10 text-primary"
                      )}>
                        {isTakenToday(med) ? <CheckCircle2 className="h-4 w-4" /> : <Pill className="h-4 w-4" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm">{med.name}</p>
                          <Badge variant="outline" className="text-[10px] px-1.5 h-4 bg-primary/5 text-primary border-primary/20">
                            {med.priority}
                          </Badge>
                          {med.streak && med.streak > 0 && (
                            <Badge variant="secondary" className="text-[9px] px-1.5 h-4 bg-orange-50 text-orange-600 border-orange-100 font-bold">
                              {med.streak} day streak
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{med.dosage} · {med.frequency}</p>
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-1">
                          <Clock className="h-3 w-3" />
                          {med.reminderTime}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {!isTakenToday(med) ? (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 text-[10px] text-emerald-600 hover:bg-emerald-50 rounded-full font-bold"
                          onClick={() => handleConfirmIntake(med)}
                          disabled={processingIntakeId === med.id}
                        >
                          {processingIntakeId === med.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Mark Taken"}
                        </Button>
                      ) : (
                        <span className="text-[10px] font-bold text-emerald-600/60 px-3 py-1 bg-emerald-50 rounded-full">
                          Done
                        </span>
                      )}
                      
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 text-[10px] text-primary hover:bg-primary/5 rounded-full"
                        onClick={() => handleGetNudge(med)}
                        disabled={analyzingMedId === med.id}
                      >
                        {analyzingMedId === med.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 mr-1" />}
                        Nitya
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeMed(med.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {nudges[med.id] && (
                    <div className="p-4 rounded-xl border bg-primary/5 text-xs animate-in slide-in-from-top-2 flex gap-3 items-start relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-3 opacity-5">
                         <Sparkles className="h-10 w-10" />
                      </div>
                      <div className="bg-white p-2 rounded-lg border shadow-sm shrink-0">
                         <Wind className="h-4 w-4 text-primary" />
                      </div>
                      <div className="space-y-2 flex-1">
                        <p className="text-sm font-medium leading-relaxed italic text-foreground pr-6">
                          "{nudges[med.id].nudge}"
                        </p>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 w-fit text-[10px] text-muted-foreground hover:text-primary px-0" 
                          onClick={() => setNudges(prev => {
                            const updated = { ...prev };
                            delete updated[med.id];
                            return updated;
                          })}
                        >
                          Release
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
