'use client';

import { useState, useMemo } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LifeStage } from '@/lib/types';
import { 
  RefreshCw, 
  Smartphone,
  ClipboardList,
  Scale,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  Settings2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { patientData } from '@/lib/data';

const TrendIcon = ({ trend }: { trend: 'up' | 'down' | 'stable' }) => {
  const className = "h-4 w-4 text-muted-foreground";
  if (trend === 'up') return <ArrowUp className={className} />;
  if (trend === 'down') return <ArrowDown className={className} />;
  return <ArrowRight className={className} />;
};

export default function PatientProfile({ language = 'English', profile }: { language?: string; profile?: any }) {
  const [lifeStage, setLifeStage] = useState<LifeStage>(profile?.lifeStage || 'Regular');
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      toast({
        title: "Biometrics Updated",
        description: "Synced latest temperature and sleep data.",
      });
    }, 2000);
  };

  const bmi = useMemo(() => {
    if (profile?.height && profile?.weight) {
      const heightInMeters = profile.height / 100;
      return (profile.weight / (heightInMeters * heightInMeters)).toFixed(1);
    }
    return null;
  }, [profile]);

  return (
    <Card className="shadow-md border-primary/5 overflow-hidden bg-white">
      <CardHeader className="pb-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16 border-2 border-primary/10 shrink-0">
              <AvatarFallback className="text-xl font-bold">{profile?.firstName?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <CardTitle className="text-2xl font-black tracking-tight">{profile?.firstName} {profile?.lastName}</CardTitle>
              <CardDescription className="text-sm font-medium text-muted-foreground">
                {profile?.dateOfBirth ? `${new Date().getFullYear() - new Date(profile.dateOfBirth).getFullYear()} years` : '...'} · {profile?.gender}
              </CardDescription>
              {profile?.gender !== 'Male' && (
                <div className="mt-2">
                  <Select value={lifeStage} onValueChange={(v) => setLifeStage(v as LifeStage)}>
                    <SelectTrigger className="h-7 w-[160px] text-[10px] uppercase font-bold tracking-wider rounded-full bg-secondary/20 border-transparent">
                      <Settings2 className="h-3 w-3 mr-1" />
                      <SelectValue placeholder="Select Life Stage" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Regular">Regular Intelligence</SelectItem>
                      <SelectItem value="TTC">Trying to Conceive</SelectItem>
                      <SelectItem value="Pregnancy">Pregnancy Support</SelectItem>
                      <SelectItem value="Perimenopause">Perimenopause Tracking</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className={cn(
              "h-9 gap-2 rounded-2xl border-primary/10 transition-all shrink-0",
              isSyncing && "bg-secondary/20 animate-pulse"
            )}
            onClick={handleSync}
            disabled={isSyncing}
          >
            {isSyncing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Smartphone className="h-4 w-4" />}
            <span className="text-xs font-bold">Sync Wearables</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="bg-muted/30 p-4 rounded-2xl border border-muted">
          <h4 className="font-bold text-xs mb-1.5 flex items-center gap-2 uppercase tracking-widest text-muted-foreground">
            <ClipboardList className="h-3.5 w-3.5" />
            Medical History Summary
          </h4>
          <p className="text-sm text-foreground leading-relaxed italic">
            "{profile?.allergies?.length ? `Allergic to: ${profile.allergies.join(', ')}. ` : ''} Blood Type: ${profile?.bloodType}. Focus on overall wellness and biometric monitoring."
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {patientData.vitals.map((vital) => (
            <div key={vital.name} className="flex flex-col justify-between p-3 rounded-2xl border bg-secondary/5 hover:bg-secondary/10 transition-all group relative">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{vital.name}</span>
                <vital.icon className="h-3.5 w-3.5 text-primary group-hover:scale-110 transition-transform" />
              </div>
              <div>
                <div className="flex items-baseline gap-0.5">
                  <span className="text-lg font-black">{vital.value}</span>
                  <span className="text-[9px] text-muted-foreground font-bold">{vital.unit}</span>
                </div>
                <div className="flex items-center mt-0.5">
                  <TrendIcon trend={vital.trend} />
                  <span className="text-[9px] ml-1 text-muted-foreground capitalize">{vital.trend}</span>
                </div>
              </div>
            </div>
          ))}
          {bmi && (
            <div className="flex flex-col justify-between p-3 rounded-2xl border bg-accent/20 hover:bg-accent/30 transition-all group">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">BMI</span>
                <Scale className="h-3.5 w-3.5 text-primary group-hover:scale-110 transition-transform" />
              </div>
              <div>
                <div className="flex items-baseline gap-0.5">
                  <span className="text-lg font-black">{bmi}</span>
                  <span className="text-[9px] text-muted-foreground font-bold">kg/m²</span>
                </div>
                <div className="flex items-center mt-0.5">
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-[9px] ml-1 text-muted-foreground">Optimal</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
