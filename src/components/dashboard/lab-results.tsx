'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { patientData } from '@/lib/data';
import { ArrowDown, ArrowRight, ArrowUp, Microscope } from 'lucide-react';
import { t } from '@/lib/translations';

const TrendIcon = ({ trend }: { trend: 'up' | 'down' | 'stable' }) => {
  const className = "h-4 w-4 text-muted-foreground";
  if (trend === 'up') return <ArrowUp className={className} />;
  if (trend === 'down') return <ArrowDown className={className} />;
  return <ArrowRight className={className} />;
};

interface LabResultsProps {
  language?: string;
}

export default function LabResults({ language = 'English' }: LabResultsProps) {
  return (
    <Card className="shadow-sm border-primary/10">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <Microscope className="h-5 w-5 text-primary" />
          {t('labResults', language)}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {patientData.labResults.map((lab) => (
            <Card key={lab.name} className="flex flex-col justify-between p-4 border-primary/5 bg-accent/5 hover:bg-accent/10 transition-colors cursor-default relative overflow-hidden group">
              <div className="flex items-center justify-between relative z-10">
                <p className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">{lab.name}</p>
                <lab.icon className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
              </div>
              <div className="mt-2 relative z-10">
                <span className="text-2xl font-black">{lab.value}</span>
                <span className="ml-1 text-[10px] text-muted-foreground font-medium">{lab.unit}</span>
              </div>
              <div className="mt-1 flex items-center text-[10px] text-muted-foreground font-medium relative z-10">
                <TrendIcon trend={lab.trend} />
                <span className="ml-1 capitalize">{lab.trend}</span>
              </div>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
