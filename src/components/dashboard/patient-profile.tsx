'use client';

import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { patientData } from '@/lib/data';
import { t } from '@/lib/translations';
import { translateText } from '@/ai/flows/translate-text';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PatientProfileProps {
  language?: string;
}

export default function PatientProfile({ language = 'English' }: PatientProfileProps) {
  const [translatedHistory, setTranslatedHistory] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    async function translateHistory() {
      if (language === 'English') {
        setTranslatedHistory(null);
        return;
      }
      setIsTranslating(true);
      try {
        const result = await translateText({ 
          text: patientData.medicalHistory, 
          targetLanguage: language 
        });
        setTranslatedHistory(result.translatedText);
      } catch (error: any) {
        console.error('Translation failed', error);
        const isQuotaError = error.message?.includes('429') || error.message?.toLowerCase().includes('quota');
        if (isQuotaError) {
          toast({
            variant: 'destructive',
            title: 'Translation Quota Reached',
            description: 'Could not translate history due to AI rate limits. Please try again later.',
          });
        }
      } finally {
        setIsTranslating(false);
      }
    }
    translateHistory();
  }, [language, toast]);

  return (
    <Card className="shadow-sm border-primary/10">
      <CardHeader>
        <div className="flex items-start gap-4">
          <Avatar className="h-20 w-20 border-2 border-primary/20">
            <AvatarImage src={patientData.avatarUrl} alt={patientData.name} data-ai-hint="woman portrait" />
            <AvatarFallback>{patientData.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <CardTitle className="text-3xl font-bold">{patientData.name}</CardTitle>
            <CardDescription className="text-base text-muted-foreground">
              {patientData.details.age} {t('age', language)} · {patientData.details.gender} · {t('bloodType', language)}: {patientData.details.bloodType}
            </CardDescription>
            <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="font-semibold text-sm">{t('allergies', language)}:</span>
                {patientData.details.allergies.map(allergy => (
                    <Badge key={allergy} variant="secondary" className="bg-destructive/10 text-destructive hover:bg-destructive/20 border-transparent text-[10px]">
                      {allergy}
                    </Badge>
                ))}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="bg-secondary/20 p-4 rounded-xl border border-secondary">
          <h4 className="font-bold text-sm mb-1 flex items-center gap-2">
            {t('medicalHistory', language)}
            {isTranslating && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
          </h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {translatedHistory || patientData.medicalHistory}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
