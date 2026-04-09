
'use client';

import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ShieldCheck, Info, User, Mail, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RegisterFormProps {
  onSubmit: (data: {
    fullName: string;
    email: string;
    mobile: string;
    isOntario: boolean;
    checkboxes: {
      healthDataProcessing: boolean;
      privacyPolicyAndTerms: boolean;
      notMedicalAdvice: boolean;
    };
  }) => void;
  isLoading?: boolean;
}

export function RegisterForm({ onSubmit, isLoading }: RegisterFormProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [isOntario, setIsOntario] = useState(false);
  
  const [agreedHealth, setAgreedHealth] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [agreedDisclaimer, setAgreedDisclaimer] = useState(false);

  const canSubmit = useMemo(() => {
    return fullName && email && mobile && agreedHealth && agreedTerms && agreedDisclaimer;
  }, [fullName, email, mobile, agreedHealth, agreedTerms, agreedDisclaimer]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    
    onSubmit({
      fullName,
      email,
      mobile,
      isOntario,
      checkboxes: {
        healthDataProcessing: agreedHealth,
        privacyPolicyAndTerms: agreedTerms,
        notMedicalAdvice: agreedDisclaimer
      }
    });
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-black tracking-tight text-primary">Begin Your Journey</h1>
        <p className="text-sm text-muted-foreground font-medium italic">Your health, protected and heard.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-[10px] font-black uppercase tracking-widest text-primary/60 ml-1">Full Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                id="fullName" 
                placeholder="Priya Sharma" 
                className="pl-10 h-12 rounded-2xl bg-muted/20 border-primary/5"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-primary/60 ml-1">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                id="email" 
                type="email"
                placeholder="priya@example.com" 
                className="pl-10 h-12 rounded-2xl bg-muted/20 border-primary/5"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mobile" className="text-[10px] font-black uppercase tracking-widest text-primary/60 ml-1">Mobile Number</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                id="mobile" 
                type="tel"
                placeholder="+91 XXXXX XXXXX" 
                className="pl-10 h-12 rounded-2xl bg-muted/20 border-primary/5"
                value={mobile}
                onChange={e => setMobile(e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        {/* JURISDICTIONAL DISCLAIMER BOX */}
        <div className="space-y-3">
          <Label className="text-[10px] font-black uppercase tracking-widest text-primary/60 ml-1">Health Data Consent & Disclaimer</Label>
          <ScrollArea className="h-32 w-full rounded-2xl border border-primary/10 bg-primary/5 p-4">
            <div className="text-[11px] leading-relaxed text-primary/80 space-y-3 font-medium">
              <p>
                Jeiva collects demographic data, cycle/recovery biometrics, and health signals to provide personalized preventive guidance. This information is processed strictly for wellness outcomes and is not used for clinical diagnosis.
              </p>
              <p className="font-bold">
                Jeiva is a wellness and prevention tool and is NOT a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician with any questions regarding a medical condition.
              </p>
              <p>
                Our data practices comply with India’s <span className="font-bold">Digital Personal Data Protection Act (DPDPA), 2023</span>. Users physically located in <span className="font-bold">Ontario, Canada</span> are also protected under <span className="font-bold">PHIPPA, 2004</span>.
              </p>
              <p className="italic">
                You may withdraw your consent at any time via the Settings menu. Withdrawing consent will pause data processing but Jeiva will maintain a record of your prior consent for legal audit purposes.
              </p>
            </div>
          </ScrollArea>
        </div>

        {/* CONSENT CHECKBOXES */}
        <div className="space-y-4 px-1">
          <div className="flex items-start space-x-3">
            <Checkbox 
              id="consent-health" 
              checked={agreedHealth} 
              onCheckedChange={v => setAgreedHealth(v === true)} 
              className="mt-1 rounded-md border-primary/20 data-[state=checked]:bg-primary"
            />
            <Label htmlFor="consent-health" className="text-xs leading-tight text-muted-foreground font-medium cursor-pointer">
              I consent to the collection and processing of my personal health data for preventive health guidance as described in the Privacy Policy.
            </Label>
          </div>

          <div className="flex items-start space-x-3">
            <Checkbox 
              id="consent-terms" 
              checked={agreedTerms} 
              onCheckedChange={v => setAgreedTerms(v === true)} 
              className="mt-1 rounded-md border-primary/20 data-[state=checked]:bg-primary"
            />
            <Label htmlFor="consent-terms" className="text-xs leading-tight text-muted-foreground font-medium cursor-pointer">
              I have read and agree to the <button type="button" className="text-primary font-bold hover:underline">Privacy Policy</button> and <button type="button" className="text-primary font-bold hover:underline">Terms of Service</button>.
            </Label>
          </div>

          <div className="flex items-start space-x-3">
            <Checkbox 
              id="consent-medical" 
              checked={agreedDisclaimer} 
              onCheckedChange={v => setAgreedDisclaimer(v === true)} 
              className="mt-1 rounded-md border-primary/20 data-[state=checked]:bg-primary"
            />
            <Label htmlFor="consent-medical" className="text-xs leading-tight text-muted-foreground font-medium cursor-pointer">
              I understand Jeiva is a wellness and prevention tool, not a medical service, and does not replace professional healthcare advice.
            </Label>
          </div>

          <div className="pt-2 flex items-center space-x-2">
            <Checkbox 
              id="ontario-check" 
              checked={isOntario} 
              onCheckedChange={v => setIsOntario(v === true)} 
              className="rounded-md border-primary/20"
            />
            <Label htmlFor="ontario-check" className="text-[10px] uppercase font-bold tracking-widest text-primary/40 cursor-pointer">
              I am currently located in Ontario, Canada
            </Label>
          </div>
        </div>

        <Button 
          type="submit" 
          disabled={!canSubmit || isLoading}
          className={cn(
            "w-full h-14 rounded-2xl font-black text-sm uppercase tracking-widest transition-all",
            canSubmit ? "bg-[#0B6E6E] text-white shadow-xl hover:shadow-2xl active:scale-[0.98]" : "bg-muted text-muted-foreground opacity-50"
          )}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Creating Account...
            </span>
          ) : (
            "Create My Account"
          )}
        </Button>

        <div className="flex justify-center items-center gap-2 pt-2 opacity-40">
          <ShieldCheck className="h-3 w-3" />
          <span className="text-[9px] font-black uppercase tracking-[0.2em]">End-to-End Encrypted</span>
        </div>
      </form>
    </div>
  );
}
