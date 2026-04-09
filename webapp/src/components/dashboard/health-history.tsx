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
import { ScanLine } from 'lucide-react';
import ScanDocumentDialog from './scan-document-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MedicalRecord } from '@/lib/types';
import { cn } from '@/lib/utils';

export default function HealthHistory() {
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
      <Card className="flex flex-col h-[550px]">
        <CardHeader>
          <CardTitle>Health History</CardTitle>
          <CardDescription>
            Upload and manage your medical records.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow flex flex-col">
          {records.length === 0 ? (
            <div className="text-center text-muted-foreground p-8 flex-grow flex flex-col justify-center items-center">
              <p>No medical records uploaded yet.</p>
              <p className="text-sm">
                Use the button below to scan your first document.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-grow min-h-0">
              <ScrollArea className="md:col-span-1 border rounded-md">
                <div className="p-2 space-y-2">
                  {records.map((record) => (
                    <div
                      key={record.id}
                      onClick={() => setSelectedRecord(record)}
                      className={cn(
                        'p-2 rounded-md cursor-pointer border-b',
                        selectedRecord?.id === record.id
                          ? 'bg-accent text-accent-foreground'
                          : 'hover:bg-secondary'
                      )}
                    >
                      <p className="font-semibold truncate">
                        Record -{' '}
                        {new Date(record.capturedAt).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(record.capturedAt).toLocaleTimeString()}
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <div className="md:col-span-2">
                {selectedRecord ? (
                  <Card className="h-full">
                    <CardHeader>
                      <CardTitle>AI Summary</CardTitle>
                      <CardDescription>
                        Scanned on{' '}
                        {new Date(selectedRecord.capturedAt).toLocaleString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="w-full overflow-hidden rounded-md">
                        <img
                          src={selectedRecord.imageUrl}
                          alt="Scanned record"
                          className="w-full h-auto object-cover max-h-40"
                        />
                      </div>
                      <ScrollArea className="h-32">
                        <p className="text-sm">{selectedRecord.summary}</p>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground rounded-md border">
                    <p>Select a record to view its summary.</p>
                  </div>
                )}
              </div>
            </div>
          )}
          <Button
            className="w-full mt-4 flex-shrink-0"
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
