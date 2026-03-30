'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScanLine, FileText, ChevronRight, Info, MessageSquare, Sparkles } from 'lucide-react';
import ScanDocumentDialog from './scan-document-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MedicalRecord } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface HealthRecordsProps {
  records: MedicalRecord[];
  onRecordScanned: (record: Omit<MedicalRecord, 'id' | 'capturedAt'>) => void;
  language?: string;
}

export default function HealthRecords({ 
  records, 
  onRecordScanned,
  language = 'English'
}: HealthRecordsProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (records.length > 0 && !selectedRecord) {
      setSelectedRecord(records[0]);
    }
  }, [records, selectedRecord]);

  return (
    <>
      <Card className="flex flex-col h-[700px] shadow-md border-primary/10">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              Health Records
            </CardTitle>
            <CardDescription>
              Your clinical history simplified by AI in {language}.
            </CardDescription>
          </div>
          <Button
            size="sm"
            onClick={() => setIsDialogOpen(true)}
            className="hidden sm:flex"
          >
            <ScanLine className="mr-2 h-4 w-4" />
            Scan New Record
          </Button>
        </CardHeader>
        <CardContent className="flex-grow flex flex-col gap-4 overflow-hidden">
          {records.length === 0 ? (
            <div className="text-center text-muted-foreground p-12 flex-grow flex flex-col justify-center items-center border-2 border-dashed rounded-xl bg-secondary/20">
              <div className="bg-primary/10 p-4 rounded-full mb-4">
                <ScanLine className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">No records found</h3>
              <p className="max-w-xs mb-6 text-sm">
                Scan your medical reports to generate patient-friendly summaries in {language}.
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <ScanLine className="mr-2 h-4 w-4" />
                Start First Scan
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 flex-grow overflow-hidden">
              <ScrollArea className="md:col-span-4 border rounded-xl bg-muted/30">
                <div className="p-3 space-y-2">
                  {records.map((record) => (
                    <div
                      key={record.id}
                      onClick={() => setSelectedRecord(record)}
                      className={cn(
                        'p-4 rounded-lg cursor-pointer transition-all border group relative',
                        selectedRecord?.id === record.id
                          ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                          : 'bg-card hover:border-primary/50 border-transparent shadow-none'
                      )}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <p className="font-bold text-sm truncate pr-4">
                          Report - {mounted ? new Date(record.capturedAt).toLocaleDateString() : '...'}
                        </p>
                        <ChevronRight className={cn(
                          "h-4 w-4 transition-transform",
                          selectedRecord?.id === record.id ? "rotate-90" : "group-hover:translate-x-1"
                        )} />
                      </div>
                      <p className={cn(
                        "text-xs",
                        selectedRecord?.id === record.id ? "text-primary-foreground/80" : "text-muted-foreground"
                      )}>
                        {mounted ? new Date(record.capturedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              
              <div className="md:col-span-8 overflow-hidden h-full">
                {selectedRecord ? (
                  <Card className="h-full flex flex-col border-primary/5">
                    <CardHeader className="py-4">
                      <div className="flex justify-between items-center">
                        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                          AI Analysis ({language})
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {mounted ? new Date(selectedRecord.capturedAt).toLocaleString() : '...'}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-grow overflow-hidden">
                      <ScrollArea className="h-full pr-4">
                        <div className="space-y-6 pb-6">
                          {selectedRecord.interpretation && (
                            <div className="bg-primary/5 p-5 rounded-[2rem] border border-primary/10 relative overflow-hidden group/obs">
                              <div className="absolute top-0 right-0 p-4 opacity-5">
                                <Sparkles className="h-12 w-12 text-primary" />
                              </div>
                              <div className="flex gap-4 items-start relative z-10">
                                <div className="bg-white p-2 rounded-xl shadow-sm border border-primary/5 shrink-0">
                                  <MessageSquare className="h-5 w-5 text-primary" />
                                </div>
                                <div className="space-y-1">
                                  <p className="text-[10px] font-black text-primary/60 uppercase tracking-widest">Jeiva's Perspective</p>
                                  <p className="text-base font-bold leading-relaxed text-primary italic">
                                    "{selectedRecord.interpretation}"
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="relative group overflow-hidden rounded-xl border shadow-sm">
                             <img
                              src={selectedRecord.imageUrl}
                              alt="Scanned record"
                              className="w-full h-auto object-cover max-h-48"
                            />
                            <div className="absolute bottom-2 right-2">
                               <Badge className="bg-black/60 backdrop-blur-md text-[10px] border-none">Source Document</Badge>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="bg-secondary/30 p-4 rounded-xl border border-primary/10">
                              <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                                <Info className="h-4 w-4 text-primary" />
                                Patient Summary
                              </h4>
                              <p className="text-sm leading-relaxed text-muted-foreground">
                                {selectedRecord.summary}
                              </p>
                            </div>

                            {selectedRecord.keyFindings && selectedRecord.keyFindings.length > 0 && (
                              <div className="space-y-2">
                                <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] ml-1">Notable Points</h4>
                                <ul className="grid grid-cols-1 gap-2">
                                  {selectedRecord.keyFindings.map((finding, idx) => (
                                    <li key={idx} className="flex items-start gap-3 text-sm bg-muted/20 p-3 rounded-lg border border-transparent hover:border-primary/10 transition-colors">
                                      <div className="h-1.5 w-1.5 rounded-full bg-primary/40 mt-2 shrink-0" />
                                      <span className="font-medium">{finding}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground rounded-xl border border-dashed bg-muted/10">
                    <FileText className="h-12 w-12 opacity-20 mb-2" />
                    <p>Select a record to view details</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      <ScanDocumentDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onRecordScanned={onRecordScanned}
        language={language}
      />
    </>
  );
}
