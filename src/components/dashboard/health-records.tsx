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
import { ScanLine, FileText, ChevronRight, Info } from 'lucide-react';
import ScanDocumentDialog from './scan-document-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MedicalRecord } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default function HealthRecords() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(
    null
  );

  useEffect(() => {
    if (records.length > 0 && !selectedRecord) {
      setSelectedRecord(records[0]);
    }
  }, [records, selectedRecord]);

  const handleRecordScanned = (
    newRecord: Omit<MedicalRecord, 'id' | 'capturedAt'>
  ) => {
    const record: MedicalRecord = {
      id: new Date().toISOString(),
      capturedAt: new Date(),
      ...newRecord,
    };
    setRecords((prev) => {
      const newRecords = [record, ...prev];
      setSelectedRecord(newRecords[0]);
      return newRecords;
    });
    setIsDialogOpen(false);
  };

  return (
    <>
      <Card className="flex flex-col h-[650px] shadow-md border-primary/10">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              Health Records
            </CardTitle>
            <CardDescription>
              AI-powered simplified summaries of your medical documents.
            </CardDescription>
          </div>
          <Button
            size="sm"
            onClick={() => setIsDialogOpen(true)}
            className="hidden sm:flex"
          >
            <ScanLine className="mr-2 h-4 w-4" />
            Scan New
          </Button>
        </CardHeader>
        <CardContent className="flex-grow flex flex-col gap-4 overflow-hidden">
          {records.length === 0 ? (
            <div className="text-center text-muted-foreground p-12 flex-grow flex flex-col justify-center items-center border-2 border-dashed rounded-xl bg-secondary/20">
              <div className="bg-primary/10 p-4 rounded-full mb-4">
                <ScanLine className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">No records yet</h3>
              <p className="max-w-xs mb-6">
                Use our OCR scanner to upload and simplify your medical documents.
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <ScanLine className="mr-2 h-4 w-4" />
                Scan First Record
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
                          Record - {new Date(record.capturedAt).toLocaleDateString()}
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
                        {new Date(record.capturedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                          AI Simplified Summary
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Captured {new Date(selectedRecord.capturedAt).toLocaleString()}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-grow overflow-hidden">
                      <ScrollArea className="h-full pr-4">
                        <div className="space-y-6 pb-6">
                          <div className="relative group overflow-hidden rounded-xl border">
                             <img
                              src={selectedRecord.imageUrl}
                              alt="Scanned record"
                              className="w-full h-auto object-cover max-h-48 group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute bottom-2 right-2">
                               <Badge className="bg-black/60 backdrop-blur-md">Original Document</Badge>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                                <Info className="h-4 w-4 text-primary" />
                                Patient-Friendly Summary
                              </h4>
                              <p className="text-sm leading-relaxed text-muted-foreground bg-secondary/30 p-4 rounded-lg italic">
                                "{selectedRecord.summary}"
                              </p>
                            </div>

                            {selectedRecord.keyFindings && selectedRecord.keyFindings.length > 0 && (
                              <div className="space-y-2">
                                <h4 className="text-sm font-semibold">Key Findings</h4>
                                <ul className="grid grid-cols-1 gap-2">
                                  {selectedRecord.keyFindings.map((finding, idx) => (
                                    <li key={idx} className="flex items-start gap-2 text-sm bg-muted/50 p-2 rounded-md">
                                      <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                                      <span>{finding}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {selectedRecord.nextSteps && selectedRecord.nextSteps.length > 0 && (
                              <div className="space-y-2">
                                <h4 className="text-sm font-semibold">Suggested Next Steps</h4>
                                <div className="flex flex-wrap gap-2">
                                  {selectedRecord.nextSteps.map((step, idx) => (
                                    <Badge key={idx} variant="secondary" className="px-3 py-1 font-normal">
                                      {step}
                                    </Badge>
                                  ))}
                                </div>
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
                    <p>Select a record to view its simplified summary.</p>
                  </div>
                )}
              </div>
            </div>
          )}
          <Button
            className="w-full mt-2 sm:hidden"
            onClick={() => setIsDialogOpen(true)}
          >
            <ScanLine className="mr-2 h-4 w-4" />
            Scan New Medical Record
          </Button>
        </CardContent>
      </Card>
      <ScanDocumentDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onRecordScanned={handleRecordScanned}
      />
    </>
  );
}
