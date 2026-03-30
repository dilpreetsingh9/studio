'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mic, Square, Loader2, BookOpen, Clock, Tag, Plus, Trash2, Send, MessageSquare, Flame, Sparkles, AlertCircle, RotateCcw, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { transcribeHealthDictation } from '@/ai/flows/transcribe-health-dictation';
import { tagJournalEntry } from '@/ai/flows/tag-journal-entry';
import { confirmLogEntry } from '@/ai/flows/confirm-log-entry';
import { generateVoiceObservation } from '@/ai/flows/generate-voice-observation';
import { patientData } from '@/lib/data';
import { JournalEntry } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { t } from '@/lib/translations';
import { useCheckInPrompt } from '@/hooks/use-checkin-prompt';

interface HealthJournalProps {
  language?: string;
  profile?: any;
}

interface ReviewData {
  transcript: string;
  tags: string[];
  observation: string;
  sentiment: 'positive' | 'neutral' | 'low';
  flagForSynthesis: boolean;
}

export default function HealthJournal({ language = 'English', profile }: HealthJournalProps) {
  const [entries, setEntries] = useState<JournalEntry[]>(patientData.journalEntries || []);
  const [textInput, setTextInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorState, setErrorState] = useState<string | null>(null);
  const [reviewData, setReviewData] = useState<ReviewData | null>(null);
  const [mounted, setMounted] = useState(false);
  const { toast } = useToast();
  
  const dynamicPrompt = useCheckInPrompt();

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setRecordingDuration(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  const startRecording = async () => {
    setErrorState(null);
    setReviewData(null);
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
    } catch (err) {
      setErrorState(t('micPermissionDenied', language));
      toast({
        variant: "destructive",
        title: "Mic Access Required",
        description: t('micPermissionDenied', language),
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
    setErrorState(null);
    try {
      const timeOfDay = new Date().getHours() < 12 ? 'Morning' : (new Date().getHours() < 17 ? 'Afternoon' : 'Evening');
      
      const transcriptionResult = await transcribeHealthDictation({
        audioDataUri,
        targetLanguage: language
      });

      if (!transcriptionResult.transcription || transcriptionResult.transcription.trim().length < 2) {
        throw new Error("EMPTY_SPEECH");
      }

      const taggingResult = await tagJournalEntry({
        entryText: transcriptionResult.transcription,
        sex: profile?.gender || 'Female',
        phase: patientData.cycleData.predictedPhase
      });

      const observationResult = await generateVoiceObservation({
        transcript: transcriptionResult.transcription,
        tags: taggingResult.tags,
        timeOfDay,
        phase: patientData.cycleData.predictedPhase,
        energyScore: 3,
        targetLanguage: language
      });

      setReviewData({
        transcript: transcriptionResult.transcription,
        tags: taggingResult.tags.slice(0, 3).map(tag => tag.toLowerCase().replace(/^#/, '')),
        observation: observationResult.observation,
        sentiment: taggingResult.sentiment,
        flagForSynthesis: taggingResult.flag_for_synthesis
      });

    } catch (error: any) {
      console.error(error);
      if (error.message === "EMPTY_SPEECH") {
        setErrorState(t('speechNotRecognized', language));
      } else {
        toast({
          variant: "destructive",
          title: "Jeiva is busy",
          description: "Could not process your dictation at this time.",
        });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveReview = async () => {
    if (!reviewData) return;
    
    setIsProcessing(true);
    try {
      const timeOfDay = new Date().getHours() < 12 ? 'Morning' : (new Date().getHours() < 17 ? 'Afternoon' : 'Evening');
      
      const confirmationResult = await confirmLogEntry({
        logType: 'voice',
        logValue: reviewData.transcript,
        timeOfDay,
        isFirst: entries.length === 0,
        streak: entries.length + 1,
        patternFlag: false,
        sex: profile?.gender || 'Female',
        targetLanguage: language
      });

      const newEntry: JournalEntry = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date(),
        content: reviewData.transcript,
        summary: reviewData.observation,
        category: reviewData.tags[0] || 'General',
        tags: reviewData.tags,
        sentiment: reviewData.sentiment,
        flagForSynthesis: reviewData.flagForSynthesis
      };

      setEntries(prev => [newEntry, ...prev]);
      setReviewData(null);
      toast({
        title: "Check-In witnessed",
        description: confirmationResult.confirmation,
      });
    } catch (error) {
      console.error('Failed to save review', error);
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
    setErrorState(null);

    try {
      const timeOfDay = new Date().getHours() < 12 ? 'Morning' : (new Date().getHours() < 17 ? 'Afternoon' : 'Evening');
      
      const taggingResult = await tagJournalEntry({
        entryText: content,
        sex: profile?.gender || 'Female',
        phase: patientData.cycleData.predictedPhase
      });

      const confirmationResult = await confirmLogEntry({
        logType: 'other',
        logValue: content,
        timeOfDay,
        isFirst: entries.length === 0,
        streak: entries.length + 1,
        patternFlag: false,
        sex: profile?.gender || 'Female',
        targetLanguage: language
      });

      const newEntry: JournalEntry = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date(),
        content: content,
        summary: taggingResult.summary_title,
        category: taggingResult.tags[0] || 'General',
        tags: taggingResult.tags.slice(0, 3).map(t => t.toLowerCase().replace(/^#/, '')),
        sentiment: taggingResult.sentiment,
        flagForSynthesis: taggingResult.flag_for_synthesis
      };

      setEntries(prev => [newEntry, ...prev]);
      toast({
        title: "Check-In received",
        description: confirmationResult.confirmation,
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
            <CardDescription className="text-primary font-bold italic mt-1">
              {reviewData ? "Check your entry" : dynamicPrompt}
            </CardDescription>
          </div>
          <Badge variant="secondary" className="bg-primary/5 text-primary text-[10px] font-bold uppercase tracking-widest px-3 py-1">
            Voice & Text
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* REVIEW SCREEN */}
        {reviewData ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 bg-secondary/5 p-6 rounded-[2rem] border border-primary/5">
            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary/60">Here's what Jeiva heard</p>
                <p className="text-lg font-medium text-foreground leading-relaxed italic">"{reviewData.transcript}"</p>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {reviewData.tags.map(tag => (
                  <Badge key={tag} className="rounded-full bg-primary/10 text-primary border-none px-3 py-1 lowercase font-bold text-[10px] tracking-tight">
                    {tag}
                  </Badge>
                ))}
              </div>

              <div className="pt-4 border-t border-primary/5">
                <p className="text-sm text-muted-foreground italic font-medium leading-relaxed">
                  {reviewData.observation}
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button 
                variant="outline" 
                className="flex-1 h-14 rounded-2xl border-primary/10 font-bold" 
                onClick={() => setReviewData(null)}
                disabled={isProcessing}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Try again
              </Button>
              <Button 
                className="flex-[2] h-14 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg" 
                onClick={handleSaveReview}
                disabled={isProcessing}
              >
                {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="mr-2 h-5 w-5" />}
                Save it
              </Button>
            </div>
          </div>
        ) : (
          /* INPUT FORM */
          <div className="space-y-3">
            <form onSubmit={handleTextSubmit} className="relative group">
              <Input 
                placeholder="Write your thoughts..." 
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                className="h-14 rounded-2xl bg-muted/20 border-primary/5 pr-24 focus-visible:ring-primary/20"
                disabled={isProcessing || isRecording}
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
                  disabled={!textInput.trim() || isProcessing || isRecording}
                >
                  {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-5 w-5 text-primary" />}
                </Button>
              </div>
            </form>

            <div className="min-h-[40px] flex flex-col items-center justify-center">
              {isRecording && (
                <div className="text-center space-y-1 animate-in fade-in zoom-in-95 duration-300">
                  <p className="text-sm font-black text-primary animate-pulse">{t('recordingMain', language)}</p>
                  <p className="text-[10px] font-bold text-muted-foreground italic">
                    {recordingDuration >= 60 ? t('recordingLimitReached', language) : t('recordingSubtitle', language)}
                  </p>
                  <p className="text-[9px] font-black text-primary/40 uppercase tracking-widest mt-1">
                    {recordingDuration}s · {t('tapToFinish', language)}
                  </p>
                </div>
              )}

              {isProcessing && (
                <div className="flex flex-col items-center gap-1 animate-pulse">
                  <p className="text-[10px] font-black text-primary uppercase tracking-widest">
                    {t('transcribing', language)}
                  </p>
                  <div className="flex gap-1">
                    <div className="h-1 w-1 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <div className="h-1 w-1 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <div className="h-1 w-1 bg-primary rounded-full animate-bounce" />
                  </div>
                </div>
              )}

              {errorState && !isRecording && !isProcessing && (
                <div className="bg-destructive/5 p-3 rounded-xl border border-destructive/10 flex items-start gap-3 animate-in slide-in-from-top-2">
                  <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                  <p className="text-[10px] font-bold text-destructive leading-tight">
                    {errorState}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {entries.length === 0 && !reviewData ? (
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
                  
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Your Voice</p>
                      <p className="text-sm font-medium italic text-foreground leading-relaxed">
                        "{entry.content}"
                      </p>
                    </div>

                    <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10 relative overflow-hidden group/obs">
                      <div className="absolute top-0 right-0 p-2 opacity-5">
                        <Sparkles className="h-8 w-8 text-primary" />
                      </div>
                      <div className="flex gap-3 items-start">
                        <MessageSquare className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-primary/60 uppercase tracking-widest">Jeiva's Thought</p>
                          <p className="text-sm font-bold leading-tight text-primary italic">
                            {entry.summary}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {entry.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-[9px] h-5 bg-muted/50 border-transparent font-bold lowercase px-2 rounded-full">
                        {tag}
                      </Badge>
                    ))}
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
