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
  AlertCircle,
  ChevronDown
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

export default function MedicationReminder() {
  const [meds, setMeds] = useState<Medication[]>(patientData.medications || []);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newMed, setNewMed] = useState<Partial<Medication>>({
    priority: 'Cannot Miss',
  });

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
    }
  };

  const removeMed = (id: string) => {
    setMeds(meds.filter(m => m.id !== id));
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
            Medications
          </CardTitle>
          <CardDescription>Daily reminders and schedule.</CardDescription>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="h-8">
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Medication</DialogTitle>
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
                  <Label htmlFor="dosage">Dosage</Label>
                  <Input 
                    id="dosage" 
                    placeholder="e.g. 500mg" 
                    value={newMed.dosage || ''} 
                    onChange={e => setNewMed({...newMed, dosage: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="priority">Priority</Label>
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
                  <Label htmlFor="frequency">Frequency</Label>
                  <Input 
                    id="frequency" 
                    placeholder="e.g. Once daily" 
                    value={newMed.frequency || ''} 
                    onChange={e => setNewMed({...newMed, frequency: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="time">Reminder Time</Label>
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
              <Button onClick={handleAddMed} className="w-full">Save Medication</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[280px] pr-4">
          <div className="space-y-3">
            {meds.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground italic text-sm">
                No medications added yet.
              </div>
            ) : (
              meds.map((med) => (
                <div 
                  key={med.id} 
                  className="flex items-center justify-between p-3 rounded-xl border bg-card hover:shadow-sm transition-all group"
                >
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
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="opacity-0 group-hover:opacity-100 h-8 w-8 text-muted-foreground hover:text-destructive transition-opacity"
                    onClick={() => removeMed(med.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
        
        <div className="mt-4 p-2 bg-secondary/30 rounded-lg flex items-start gap-2 border border-secondary">
          <AlertCircle className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
          <p className="text-[10px] text-muted-foreground leading-tight italic">
            Disclaimer: This reminder tool is an aid. Always refer to your actual prescription labels and pharmacist instructions.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
