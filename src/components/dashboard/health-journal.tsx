'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mic, Square, Loader2, BookOpen, Clock, Tag, Plus, Trash2, Send, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { transcribeHealthDictation } from '@/ai/flows/transcribe-health-dictation';
import { tagJournalEntry } from '@/ai/flows/tag-journal-entry';
import { patientData } from '@/lib/data';
import { JournalEntry } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { t } from '@/lib/translations';

interface HealthJournalProps {
  language?: string;
  profile?: any;
}

export default function HealthJournal({ language = 'English', profile }: HealthJournalProps) {
  const [entries, setEntries] = useState<JournalEntry[]>(patientData.journalEntries || []);
  const [textInput, setTextInput] = useState('');
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
          await processVoiceEntry(base64Audio);
        };
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast({ 
        title: t('recordingStarted', language), 
        description: t('recordingDescription', language) 
      });
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

  const processVoiceEntry = async (audioDataUri: string) => {
    setIsProcessing(true);
    try {
      // 1. Transcribe the audio
      const transcriptionResult = await transcribeHealthDictation({
        audioDataUri,
        targetLanguage: language
      });

      // 2. Pass to tagging engine for deeper structure
      const taggingResult = await tagJournalEntry({
        entryText: transcriptionResult.transcription,
        sex: profile?.gender || 'Female',
        phase: patientData.cycleData.predictedPhase
      });

      const newEntry: JournalEntry = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date(),
        content: transcriptionResult.transcription,
        summary: taggingResult.summary_title,
        category: taggingResult.tags[0] || 'General',
        tags: taggingResult.tags,
        sentiment: taggingResult.sentiment,
        foodItem: taggingResult.food_item,
        flagForSynthesis: taggingResult.flag_for_synthesis
      };

      setEntries(prev => [newEntry, ...prev]);
      toast({
        title: t('entrySaved', language),
        description: t('entrySavedDesc', language),
      });
    } catch (error: any) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "AI Busy",
        description: "Could not process your dictation at this time.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTextSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!textInput.trim() || isProcessing) return;

    const content = textInput.trim();
    setTextInput('');
    setIsProcessing(true);

    try {
      const taggingResult = await tagJournalEntry({
        entryText: content,
        sex: profile?.gender || 'Female',
        phase: patientData.cycleData.predictedPhase
      });

      const newEntry: JournalEntry = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date(),
        content: content,
        summary: taggingResult.summary_title,
        category: taggingResult.tags[0] || 'General',
        tags: taggingResult.tags,
        sentiment: taggingResult.sentiment,
        foodItem: taggingResult.food_item,
        flagForSynthesis: taggingResult.flag_for_synthesis
      };

      setEntries(prev => [newEntry, ...prev]);
      toast({
        title: t('entrySaved', language),
        description: t('entrySavedDesc', language),
      });
    } catch (error) {
      console.error('Failed to process text entry', error);
      toast({
        variant: "destructive",
        title: "Processing Failed",
        description: "I'm having trouble reflecting on that note right now.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const deleteEntry = (id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id));
  };

  const getSentimentIcon = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive': return '✨';
      case 'low': return '☁️';
      default: return '👤';
    }
  };

  return (
    <Card className="shadow-md border-primary/10 bg-white overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl font-black tracking-tight">
              <BookOpen className="h-5 w-5 text-primary" />
              {t('healthJournal', language)}
            </CardTitle>
            <CardDescription>{t('journalSubtitle', language)}</CardDescription>
          </div>
          <Badge variant="secondary" className="bg-primary/5 text-primary text-[10px] font-bold uppercase tracking-widest px-3 py-1">
            Voice & Text
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Entry Input Area */}
        <div className="space-y-3">
          <form onSubmit={handleTextSubmit} className="relative group">
            <Input 
              placeholder="Write your thoughts..." 
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              className="h-14 rounded-2xl bg-muted/20 border-primary/5 pr-24 focus-visible:ring-primary/20"
              disabled={isProcessing}
            />
            <div className="absolute right-2 top-2 flex gap-1">
              <Button 
                type="button"
                variant={isRecording ? "destructive" : "ghost"}
                size="icon"
                className={cn(
                  "h-10 w-10 rounded-xl transition-all",
                  isRecording && "animate-pulse"
                )}
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isProcessing}
              >
                {isRecording ? <Square className="h-4 w-4" /> : <Mic className="h-5 w-5 text-primary" />}
              </Button>
              <Button 
                type="submit"
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-xl"
                disabled={!textInput.trim() || isProcessing}
              >
                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-5 w-5 text-primary" />}
              </Button>
            </div>
          </form>
          {isProcessing && (
            <p className="text-[10px] font-medium italic text-primary animate-pulse text-center">
              Nitya is listening and reflecting...
            </p>
          )}
        </div>

        <ScrollArea className="h-[350px] pr-4">
          <div className="space-y-4">
            {entries.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground italic text-sm border-2 border-dashed rounded-3xl bg-muted/5">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-20" />
                {t('noEntries', language)}
              </div>
            ) : (
              entries.map((entry) => (
                <div key={entry.id} className="p-5 rounded-3xl border bg-card hover:shadow-md transition-all group relative overflow-hidden">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg" title={entry.sentiment}>{getSentimentIcon(entry.sentiment)}</span>
                      <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-primary/10 text-primary/70">
                        {entry.category}
                      </Badge>
                      {entry.flagForSynthesis && (
                        <Badge className="bg-accent/10 text-accent border-accent/20 text-[8px] font-black uppercase tracking-tight">
                          Noted for Daily Read
                        </Badge>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1 opacity-60">
                      <Clock className="h-3 w-3" />
                      {mounted ? new Date(entry.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '...'}
                    </span>
                  </div>
                  <p className="text-sm font-bold mb-2 leading-tight text-foreground">{entry.summary}</p>
                  <p className="text-xs text-muted-foreground italic mb-4 leading-relaxed line-clamp-3">
                    "{entry.content}"
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {entry.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-[9px] h-5 bg-muted/50 border-transparent font-medium">
                        #{tag}
                      </Badge>
                    ))}
                    {entry.foodItem && (
                      <Badge variant="outline" className="text-[9px] h-5 border-emerald-100 bg-emerald-50 text-emerald-700 font-bold">
                        🍲 {entry.foodItem}
                      </Badge>
                    )}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute top-2 right-2 h-7 w-7 rounded-full bg-background border shadow-sm opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/5"
                    onClick={() => deleteEntry(entry.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
        
        <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 flex items-start gap-4">
          <div className="bg-white p-2 rounded-xl shadow-sm shrink-0 border border-primary/5">
            <Mic className="h-4 w-4 text-primary" />
          </div>
          <div className="space-y-1">
            <p className="text-[11px] font-black text-primary uppercase tracking-widest">{t('proTip', language)}</p>
            <p className="text-[10px] text-muted-foreground font-medium leading-relaxed italic">
              {t('proTipContent', language)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
