
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFirestore, useUser } from '@/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Loader2, ClipboardList, Sparkles, ChevronRight, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

const FOCUS_OPTIONS = [
  "Energy and how I feel day to day",
  "Hormonal balance and my cycle",
  "Weight and metabolism",
  "Sleep and recovery",
  "Stress and mental clarity",
  "General prevention — I just want to stay ahead"
];

export function ProfileSetup() {
  const { user } = useUser();
  const db = useFirestore();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    bloodType: '',
    allergies: '',
    height: '',
    weight: '',
    healthFocus: '',
    cityTier: 'unknown',
  });

  const handleSubmit = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        id: user.uid,
        email: user.email,
        ...formData,
        height: Number(formData.height) || 0,
        weight: Number(formData.weight) || 0,
        allergies: formData.allergies.split(',').map(a => a.trim()).filter(Boolean),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        reEngagementCount: 0,
        lastOpenDate: serverTimestamp(),
      });
    } catch (error) {
      console.error('Profile save failed', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFocusSelect = (focus: string) => {
    setFormData({ ...formData, healthFocus: focus });
    setStep(4);
  };

  const handleSkipFocus = () => {
    setFormData({ ...formData, healthFocus: "General prevention — I just want to stay ahead" });
    setStep(4);
  };

  return (
    <div className="min-h-svh flex items-center justify-center p-6 bg-secondary/10">
      <Card className="w-full max-w-2xl shadow-2xl border-none overflow-hidden bg-white">
        <CardHeader className="pb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-primary/5 p-2 rounded-xl">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl font-black tracking-tight">Our Beginning</CardTitle>
              <CardDescription className="text-sm font-medium">
                Step {step} of 4 · Building your foundation
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">First Name</Label>
                  <Input 
                    placeholder="Saher"
                    className="h-12 rounded-2xl border-primary/10 bg-muted/5 focus-visible:ring-primary/20"
                    value={formData.firstName} 
                    onChange={e => setFormData({...formData, firstName: e.target.value})} 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Last Name</Label>
                  <Input 
                    placeholder="Sharma"
                    className="h-12 rounded-2xl border-primary/10 bg-muted/5 focus-visible:ring-primary/20"
                    value={formData.lastName} 
                    onChange={e => setFormData({...formData, lastName: e.target.value})} 
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Date of Birth</Label>
                  <Input 
                    type="date" 
                    className="h-12 rounded-2xl border-primary/10 bg-muted/5 focus-visible:ring-primary/20"
                    value={formData.dateOfBirth} 
                    onChange={e => setFormData({...formData, dateOfBirth: e.target.value})} 
                  />
                </div>
              </div>
              <Button 
                className="w-full h-14 rounded-2xl font-black text-lg shadow-lg hover:shadow-xl transition-all" 
                onClick={() => setStep(2)}
                disabled={!formData.firstName || !formData.dateOfBirth}
              >
                Next Step
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Gender</Label>
                  <Select value={formData.gender} onValueChange={v => setFormData({...formData, gender: v})}>
                    <SelectTrigger className="h-12 rounded-2xl border-primary/10 bg-muted/5">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Other">Non-binary/Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Blood Type</Label>
                  <Select value={formData.bloodType} onValueChange={v => setFormData({...formData, bloodType: v})}>
                    <SelectTrigger className="h-12 rounded-2xl border-primary/10 bg-muted/5">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(t => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Height (cm)</Label>
                  <Input 
                    type="number" 
                    placeholder="165"
                    className="h-12 rounded-2xl border-primary/10 bg-muted/5"
                    value={formData.height} 
                    onChange={e => setFormData({...formData, height: e.target.value})} 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Weight (kg)</Label>
                  <Input 
                    type="number" 
                    placeholder="60"
                    className="h-12 rounded-2xl border-primary/10 bg-muted/5"
                    value={formData.weight} 
                    onChange={e => setFormData({...formData, weight: e.target.value})} 
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Allergies (if any)</Label>
                  <Input 
                    placeholder="e.g. Peanuts, Penicillin..." 
                    className="h-12 rounded-2xl border-primary/10 bg-muted/5"
                    value={formData.allergies} 
                    onChange={e => setFormData({...formData, allergies: e.target.value})} 
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="ghost" className="flex-1 h-14 rounded-2xl font-bold" onClick={() => setStep(1)}>
                  <ArrowLeft className="mr-2 h-5 w-5" /> Back
                </Button>
                <Button className="flex-[2] h-14 rounded-2xl font-black text-lg shadow-lg hover:shadow-xl transition-all" onClick={() => setStep(3)}>
                  Almost There
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="space-y-1">
                <h3 className="text-xl font-black tracking-tight text-primary">What matters most to you right now?</h3>
                <p className="text-xs text-muted-foreground font-medium">Nitya uses this to decide what to surface first.</p>
              </div>

              <div className="grid gap-3">
                {FOCUS_OPTIONS.map((option) => (
                  <Button
                    key={option}
                    variant="outline"
                    className={cn(
                      "h-auto py-4 px-6 justify-start text-left rounded-2xl border-primary/10 hover:border-primary/40 hover:bg-primary/5 transition-all",
                      formData.healthFocus === option && "border-primary bg-primary/5"
                    )}
                    onClick={() => handleFocusSelect(option)}
                  >
                    <span className="text-sm font-bold">{option}</span>
                  </Button>
                ))}
              </div>

              <div className="pt-4 text-center space-y-4">
                <p className="text-[10px] text-muted-foreground italic">You can change this anytime.</p>
                <button 
                  onClick={handleSkipFocus}
                  className="text-xs font-black text-primary hover:underline underline-offset-4"
                >
                  Not sure yet — show me everything
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Where do you live?</Label>
                <Select value={formData.cityTier} onValueChange={v => setFormData({...formData, cityTier: v})}>
                  <SelectTrigger className="h-14 rounded-2xl border-primary/10 bg-muted/5 text-base font-bold">
                    <SelectValue placeholder="Select location tier" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem value="metro">Metro City (Mumbai, Delhi, etc.)</SelectItem>
                    <SelectItem value="tier2">Tier 2 City (Pune, Jaipur, etc.)</SelectItem>
                    <SelectItem value="tier3">Tier 3 City / Town</SelectItem>
                    <SelectItem value="unknown">I'd prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground italic px-1">This helps Nitya understand your daily rhythms and food options.</p>
              </div>

              <div className="flex gap-3">
                <Button variant="ghost" className="flex-1 h-14 rounded-2xl font-bold" onClick={() => setStep(3)}>
                  <ArrowLeft className="mr-2 h-5 w-5" /> Back
                </Button>
                <Button 
                  className="flex-[2] h-14 rounded-2xl font-black text-lg shadow-lg hover:shadow-xl transition-all" 
                  onClick={handleSubmit} 
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                  Begin Our Journey
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
