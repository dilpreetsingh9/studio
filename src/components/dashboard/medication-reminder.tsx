
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
  XCircle,
  Wind
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
import { Medication, MedicationPriority } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { t } from '@/lib/translations';
import { useToast } from '@/hooks/use-toast';
import { analyzeMissedMedication, AnalyzeMissedMedicationOutput } from '@/ai/flows/analyze-missed-medication';

interface MedicationReminderProps {
  language?: string;
}

export default function MedicationReminder({ language = 'English' }: MedicationReminderProps) {
  const [meds, setMeds] = useState<Medication[]>(patientData.medications || []);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(false);
  const [analyzingMedId, setAnalyzingMedId] = useState<string | null>(null);
  const [missedAnalysis, setMissedAnalysis] = useState<Record<string, AnalyzeMissedMedicationOutput>>({});
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
            description: "I will nudge you gently when it is time.",
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

  const handleMarkMissed = async (med: Medication) => {
    setAnalyzingMedId(med.id);
    try {
      const analysis = await analyzeMissedMedication({
        medicationName: med.name,
        dosage: med.dosage,
        medicalHistory: patientData.medicalHistory,
        targetLanguage: language
      });
      setMissedAnalysis(prev => ({ ...prev, [med.id]: analysis }));
    } catch (error) {
      console.error(error);
    } finally {
      setAnalyzingMedId(null);
    }
  };

  const removeMed = (id: string) => {
    setMeds(meds.filter(m => m.id !== id));
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
              <div className="text-center py-10 text-muted-foreground italic text-sm">
                No routines added yet.
              </div>
            ) : (
              meds.map((med) => (
                <div key={med.id} className="space-y-2">
                  <div className="flex items-center justify-between p-3 rounded-xl border bg-card hover:shadow-sm transition-all group">
                    <div className="flex gap-3 items-start">
                      <div className="mt-1 bg-primary/10 p-2 rounded-lg">
                        <Pill className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm">{med.name}</p>
                          <Badge variant="outline" className="text-[10px] px-1.5 h-4 bg-primary/5 text-primary border-primary/20">
                            {med.priority}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{med.dosage} · {med.frequency}</p>
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-1">
                          <Clock className="h-3 w-3" />
                          {med.reminderTime}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 text-[10px] text-muted-foreground hover:text-primary"
                        onClick={() => handleMarkMissed(med)}
                        disabled={analyzingMedId === med.id}
                      >
                        {analyzingMedId === med.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5 mr-1" />}
                        Paused
                      </Button>
                    </div>
                  </div>

                  {missedAnalysis[med.id] && (
                    <div className="p-3 rounded-xl border bg-secondary/5 text-xs animate-in slide-in-from-top-2">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Wind className="h-3.5 w-3.5 text-primary" />
                        <span className="font-bold uppercase tracking-wider">Nitya's Thought</span>
                      </div>
                      <p className="mb-2 text-muted-foreground leading-relaxed">
                        {missedAnalysis[med.id].consequences}
                      </p>
                      <div className="bg-white/50 p-2 rounded border border-black/5">
                        <p className="font-bold text-foreground">Next Step:</p>
                        <p className="text-muted-foreground italic">{missedAnalysis[med.id].actionPlan}</p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 w-full mt-2 text-[10px]" 
                        onClick={() => setMissedAnalysis(prev => {
                          const updated = { ...prev };
                          delete updated[med.id];
                          return updated;
                        })}
                      >
                        Dismiss
                      </Button>
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
