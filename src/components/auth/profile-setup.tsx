'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFirestore, useUser } from '@/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Loader2, ClipboardList } from 'lucide-react';

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
        height: Number(formData.height),
        weight: Number(formData.weight),
        allergies: formData.allergies.split(',').map(a => a.trim()).filter(Boolean),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Profile save failed', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-svh flex items-center justify-center p-6 bg-secondary/10">
      <Card className="w-full max-w-2xl shadow-2xl border-none">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-primary/5 p-2 rounded-lg">
              <ClipboardList className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Complete Your Profile</CardTitle>
          </div>
          <CardDescription>
            Help us personalize your Hormone Intelligence experience.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === 1 && (
            <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-right-4">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Date of Birth</Label>
                <Input type="date" value={formData.dateOfBirth} onChange={e => setFormData({...formData, dateOfBirth: e.target.value})} />
              </div>
              <Button className="col-span-2 h-12 mt-4" onClick={() => setStep(2)}>Next Step</Button>
            </div>
          )}

          {step === 2 && (
            <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-right-4">
              <div className="space-y-2">
                <Label>Gender</Label>
                <Select value={formData.gender} onValueChange={v => setFormData({...formData, gender: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Other">Non-binary/Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Blood Type</Label>
                <Select value={formData.bloodType} onValueChange={v => setFormData({...formData, bloodType: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Height (cm)</Label>
                <Input type="number" value={formData.height} onChange={e => setFormData({...formData, height: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Weight (kg)</Label>
                <Input type="number" value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Allergies (comma separated)</Label>
                <Input placeholder="Peanuts, Penicillin..." value={formData.allergies} onChange={e => setFormData({...formData, allergies: e.target.value})} />
              </div>
              <div className="col-span-2 flex gap-3 mt-4">
                <Button variant="outline" className="flex-1 h-12" onClick={() => setStep(1)}>Back</Button>
                <Button className="flex-[2] h-12" onClick={handleSubmit} disabled={isLoading}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Complete Setup
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
