'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Plus, 
  Pill, 
  Clock, 
  Trash2, 
  AlertCircle,
  Bell,
  BellOff,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle
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
    priority: 'Cannot Miss',
  });

  const handleToggleNotifications = async () => {
    if (!isNotificationsEnabled) {
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          setIsNotificationsEnabled(true);
          toast({
            title: "Notifications Enabled",
            description: "You will now receive push reminders for your medications.",
          });
        } else {
          toast({
            variant: "destructive",
            title: "Permission Denied",
            description: "Please allow notifications in your browser settings to use this feature.",
          });
        }
      }
    } else {
      setIsNotificationsEnabled(false);
      toast({
        title: "Notifications Disabled",
        description: "Push reminders have been turned off.",
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
        priority: newMed.priority as MedicationPriority,
        reminderTime: newMed.reminderTime || '09:00 AM',
      };
      setMeds([...meds, med]);
      setNewMed({ priority: 'Cannot Miss' });
      setIsAddOpen(false);
      toast({
        title: "Medication Added",
        description: `${med.name} has been scheduled.`,
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
      toast({
        variant: "destructive",
        title: "Safety Alert",
        description: `AI has analyzed the impact of missing ${med.name}.`,
      });
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: "Could not retrieve medical advice at this time.",
      });
    } finally {
      setAnalyzingMedId(null);
    }
  };

  const removeMed = (id: string) => {
    setMeds(meds.filter(m => m.id !== id));
    setMissedAnalysis(prev => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });
  };

  const getPriorityColor = (priority: MedicationPriority) => {
    switch (priority) {
      case 'Cannot Miss': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'Good to have': return 'bg-primary/10 text-primary border-primary/20';
      case 'Can Skip': return 'bg-muted text-muted-foreground border-transparent';
      default: return '';
    }
  };

  return (
    <Card className="shadow-md border-primary/10">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Pill className="h-5 w-5 text-primary" />
            {t('medications', language)}
          </CardTitle>
          <CardDescription>Daily reminders and safety schedule.</CardDescription>
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
                  Enter the details of your medication and its priority.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Medication Name</Label>
                  <Input 
                    id="name" 
                    placeholder="e.g. Metformin" 
                    value={newMed.name || ''} 
                    onChange={e => setNewMed({...newMed, name: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="dosage">{t('dosage', language)}</Label>
                    <Input 
                      id="dosage" 
                      placeholder="e.g. 500mg" 
                      value={newMed.dosage || ''} 
                      onChange={e => setNewMed({...newMed, dosage: e.target.value})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="priority">{t('priority', language)}</Label>
                    <Select 
                      value={newMed.priority} 
                      onValueChange={v => setNewMed({...newMed, priority: v as MedicationPriority})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Cannot Miss">Cannot Miss</SelectItem>
                        <SelectItem value="Good to have">Good to have</SelectItem>
                        <SelectItem value="Can Skip">Can Skip</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="frequency">{t('frequency', language)}</Label>
                    <Input 
                      id="frequency" 
                      placeholder="e.g. Once daily" 
                      value={newMed.frequency || ''} 
                      onChange={e => setNewMed({...newMed, frequency: e.target.value})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="time">{t('reminderTime', language)}</Label>
                    <Input 
                      id="time" 
                      type="time" 
                      value={newMed.reminderTime || ''} 
                      onChange={e => setNewMed({...newMed, reminderTime: e.target.value})}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddMed} className="w-full">{t('saveMedication', language)}</Button>
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
                No medications added yet.
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
                          <Badge variant="outline" className={cn("text-[10px] px-1.5 h-4", getPriorityColor(med.priority))}>
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
                        className="h-8 text-[10px] text-destructive hover:bg-destructive/5"
                        onClick={() => handleMarkMissed(med)}
                        disabled={analyzingMedId === med.id}
                      >
                        {analyzingMedId === med.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5 mr-1" />}
                        Missed
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="opacity-0 group-hover:opacity-100 h-8 w-8 text-muted-foreground hover:text-destructive transition-opacity"
                        onClick={() => removeMed(med.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {missedAnalysis[med.id] && (
                    <div className={cn(
                      "p-3 rounded-xl border-l-4 text-xs animate-in slide-in-from-top-2 duration-300",
                      missedAnalysis[med.id].seriousness === 'High' ? "bg-destructive/5 border-destructive" : 
                      missedAnalysis[med.id].seriousness === 'Medium' ? "bg-amber-50 border-amber-500" : "bg-blue-50 border-blue-500"
                    )}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <AlertTriangle className={cn("h-3.5 w-3.5", 
                          missedAnalysis[med.id].seriousness === 'High' ? "text-destructive" : 
                          missedAnalysis[med.id].seriousness === 'Medium' ? "text-amber-600" : "text-blue-600"
                        )} />
                        <span className="font-bold uppercase tracking-wider">
                          AI Safety Alert: {missedAnalysis[med.id].seriousness} Risk
                        </span>
                      </div>
                      <p className="mb-2 text-muted-foreground leading-relaxed">
                        {missedAnalysis[med.id].consequences}
                      </p>
                      <div className="bg-white/50 p-2 rounded border border-black/5">
                        <p className="font-bold text-foreground">Action Plan:</p>
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
                        Dismiss Analysis
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
        
        <div className="mt-4 p-3 bg-primary/5 rounded-xl flex items-start gap-3 border border-primary/10">
          <AlertCircle className="h-4 w-4 text-primary mt-0.5" />
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-primary">Compliance Tip</p>
            <p className="text-[10px] text-muted-foreground leading-tight italic">
              Our AI analyzes the "Downside Risk" based on your specific medical history. Never miss a dose of "Cannot Miss" medications.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
