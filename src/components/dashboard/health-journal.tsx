'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mic, Square, Loader2, BookOpen, Clock, Tag, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { transcribeHealthDictation } from '@/ai/flows/transcribe-health-dictation';
import { patientData } from '@/lib/data';
import { JournalEntry } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { t } from '@/lib/translations';

interface HealthJournalProps {
  language?: string;
}

export default function HealthJournal({ language = 'English' }: HealthJournalProps) {
  const [entries, setEntries] = useState<JournalEntry[]>(patientData.journalEntries || []);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { toast } = useToast();

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          await processDictation(base64Audio);
        };
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast({ title: "Recording Started", description: "Dictate your routine now." });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Mic Access Required",
        description: "Please enable microphone permissions to use Dictahealth.",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processDictation = async (audioDataUri: string) => {
    setIsProcessing(true);
    try {
      const result = await transcribeHealthDictation({
        audioDataUri,
        targetLanguage: language
      });

      const newEntry: JournalEntry = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date(),
        content: result.transcription,
        summary: result.summary,
        category: result.category,
        tags: result.tags,
      };

      setEntries(prev => [newEntry, ...prev]);
      toast({
        title: "Entry Saved",
        description: "Your health journal has been updated via Dictahealth.",
      });
    } catch (error: any) {
      console.error(error);
      const isQuotaError = error.message?.includes('429') || error.message?.toLowerCase().includes('quota');
      toast({
        variant: "destructive",
        title: isQuotaError ? "AI Busy" : "Transcription Failed",
        description: "Could not process your dictation at this time.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const deleteEntry = (id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id));
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Exercise': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Diet': return 'bg-green-100 text-green-700 border-green-200';
      case 'Mood': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Symptoms': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <Card className="shadow-md border-primary/10">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Health Journal
          </CardTitle>
          <CardDescription>Dictahealth: Voice-powered routine tracking.</CardDescription>
        </div>
        <Button 
          size="sm" 
          variant={isRecording ? "destructive" : "outline"}
          className={cn(
            "rounded-full transition-all px-4",
            isRecording && "animate-pulse"
          )}
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : isRecording ? (
            <Square className="h-4 w-4 mr-2" />
          ) : (
            <Mic className="h-4 w-4 mr-2" />
          )}
          {isRecording ? "Stop" : "Dictate"}
        </Button>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {entries.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground italic text-sm border-2 border-dashed rounded-xl bg-muted/5">
                <Mic className="h-8 w-8 mx-auto mb-2 opacity-20" />
                No entries yet. Start dictating your routine!
              </div>
            ) : (
              entries.map((entry) => (
                <div key={entry.id} className="p-4 rounded-xl border bg-card hover:shadow-sm transition-all group relative">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="outline" className={cn("text-[10px] uppercase tracking-wider", getCategoryColor(entry.category))}>
                      {entry.category}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {mounted ? new Date(entry.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '...'}
                    </span>
                  </div>
                  <p className="text-sm font-bold mb-1 leading-tight">{entry.summary}</p>
                  <p className="text-xs text-muted-foreground italic mb-3 line-clamp-2">
                    "{entry.content}"
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {entry.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-[9px] h-4 bg-muted/50 border-transparent">
                        <Tag className="h-2 w-2 mr-1" /> {tag}
                      </Badge>
                    ))}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-background border shadow-sm opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/5"
                    onClick={() => deleteEntry(entry.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
        
        <div className="mt-4 p-3 bg-primary/5 rounded-xl border border-primary/10 flex items-start gap-3">
          <div className="bg-primary/10 p-1.5 rounded-lg shrink-0">
            <Mic className="h-4 w-4 text-primary" />
          </div>
          <div className="space-y-0.5">
            <p className="text-[11px] font-bold text-primary">Pro Tip</p>
            <p className="text-[10px] text-muted-foreground leading-tight italic">
              Dictate things like "Had a salad for lunch and felt energetic" or "Slight knee pain after running". AI will tag and save it.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
