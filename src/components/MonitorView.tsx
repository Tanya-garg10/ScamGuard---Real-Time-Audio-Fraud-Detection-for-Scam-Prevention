import React, { useRef, useState } from 'react';
import { RecordingControls } from './RecordingControls';
import { RiskMeter } from './RiskMeter';
import { GuidancePanel } from './GuidancePanel';
import { IndicatorList } from './IndicatorList';
import { TranscriptDisplay } from './TranscriptDisplay';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { useScamAnalysis } from '@/hooks/useScamAnalysis';
import { useLanguage } from '@/contexts/LanguageContext';
import type { CallRecord } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface MonitorViewProps {
  onCallComplete: (call: CallRecord) => void;
}

export const MonitorView: React.FC<MonitorViewProps> = ({ onCallComplete }) => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const startTimeRef = useRef<Date | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [quickText, setQuickText] = useState('');
  const [showUploadTranscript, setShowUploadTranscript] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [uploadTranscriptText, setUploadTranscriptText] = useState('');

  const {
    isRecording,
    isPaused,
    audioLevel,
    transcript,
    startRecording: startAudioRecording,
    stopRecording: stopAudioRecording,
    pauseRecording,
    resumeRecording,
    error: recorderError,
  } = useAudioRecorder();

  const {
    isAnalyzing,
    analysis,
    startAnalysis,
    stopAnalysis,
    updateTranscript,
    analyzeTranscript,
    analyzeAudio,
  } = useScamAnalysis();

  // Update transcript in analysis hook whenever it changes
  React.useEffect(() => {
    if (isRecording && transcript) {
      console.log('📝 Transcript updated:', transcript.substring(0, 100), `(${transcript.length} chars)`);
      updateTranscript(transcript);
    }
  }, [transcript, isRecording, updateTranscript]);

  const handleStartRecording = async () => {
    console.log('🎬 handleStartRecording called');
    await startAudioRecording();
    console.log('🎤 Audio recording started');
    startAnalysis(''); // Start with empty transcript
    console.log('📊 Analysis system started');
    startTimeRef.current = new Date();
    toast({
      title: t('toast.monitoringStarted'),
      description: t('toast.listeningForScams'),
    });
  };

  // Manual test function for debugging
  const handleManualAnalyze = async (text: string) => {
    updateTranscript(text);
    try {
      const result = await analyzeTranscript(text);
      toast({
        title: 'Analysis complete',
        description: `${result.riskLevel === 'high' ? '⚠️ SCAM DETECTED' : result.riskLevel === 'medium' ? 'Caution' : 'Safe'} - ${result.riskScore}%`,
        variant: result.riskLevel === 'high' ? 'destructive' : 'default',
      });
    } catch (error) {
      toast({ title: 'Analysis failed', description: String(error), variant: 'destructive' });
    }
  };

  const handleStopRecording = () => {
    stopAudioRecording();
    stopAnalysis();

    if (analysis && startTimeRef.current) {
      const duration = Math.floor(
        (new Date().getTime() - startTimeRef.current.getTime()) / 1000
      );

      const callRecord: CallRecord = {
        id: crypto.randomUUID(),
        date: startTimeRef.current,
        duration,
        riskLevel: analysis.riskLevel,
        riskScore: analysis.riskScore,
        indicators: analysis.indicators.filter((i) => i.detected),
      };

      onCallComplete(callRecord);

      toast({
        title: t('toast.monitoringComplete'),
        description: `${t('risk.' + analysis.riskLevel)} - ${analysis.riskScore}%`,
        variant: analysis.riskLevel === 'high' ? 'destructive' : 'default',
      });
    }
  };

  const handleUploadAudio = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFileName(file.name);
    setUploadTranscriptText('');
    setShowUploadTranscript(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUploadTranscriptAnalyze = async () => {
    const text = uploadTranscriptText.trim();
    if (text.length < 10) {
      toast({ title: 'Enter at least 10 characters', variant: 'destructive' });
      return;
    }
    const result = await analyzeTranscript(text);
    const callRecord: CallRecord = {
      id: crypto.randomUUID(),
      date: new Date(),
      duration: 60,
      riskLevel: result.riskLevel,
      riskScore: result.riskScore,
      indicators: result.indicators.filter((i) => i.detected),
    };
    onCallComplete(callRecord);
    toast({
      title: t('toast.analysisComplete'),
      description: `${t('risk.' + result.riskLevel)} - ${result.riskScore}%`,
      variant: result.riskLevel === 'high' ? 'destructive' : 'default',
    });
    setShowUploadTranscript(false);
    setUploadTranscriptText('');
  };

  return (
    <div className="space-y-6">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Upload transcript - shown after selecting audio file */}
      {showUploadTranscript && (
        <div className="rounded-xl border-2 border-primary/40 bg-primary/5 p-5 animate-fade-in">
          <h3 className="font-semibold text-base mb-1 flex items-center gap-2">
            <span>🎧</span> Uploaded: {uploadedFileName}
          </h3>
          <p className="text-sm text-muted-foreground mb-3">
            Type what you heard in this recording:
          </p>
          <textarea
            value={uploadTranscriptText}
            onChange={(e) => setUploadTranscriptText(e.target.value)}
            placeholder="e.g. Hey calling from your bank, share your OTP immediately or your account will be blocked."
            className="w-full min-h-[80px] px-3 py-2 text-sm rounded-lg border border-border bg-background resize-y mb-3"
            rows={3}
          />
          <div className="flex gap-2">
            <button
              onClick={handleUploadTranscriptAnalyze}
              disabled={uploadTranscriptText.trim().length < 10}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
            >
              Analyze & Save
            </button>
            <button
              onClick={() => setShowUploadTranscript(false)}
              className="px-4 py-2 border border-border rounded-lg hover:bg-muted text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Quick Analyze - Always visible, no recording needed */}
      <div className="rounded-xl border-2 border-primary/40 bg-primary/5 p-5">
        <h3 className="font-semibold text-base mb-1 flex items-center gap-2">
          <span>📋</span> Quick Analyze
        </h3>
        <p className="text-sm text-muted-foreground mb-3">
          Type or paste what you heard on the call (works without microphone)
        </p>
        <textarea
          value={quickText}
          onChange={(e) => setQuickText(e.target.value)}
          placeholder="e.g. Hey calling from your bank, share your OTP immediately or your account will be blocked."
          className="w-full min-h-[80px] px-3 py-2 text-sm rounded-lg border border-border bg-background resize-y mb-3"
          rows={3}
        />
        <div className="flex gap-2">
          <button
            onClick={() => quickText.trim().length >= 10 && handleManualAnalyze(quickText.trim())}
            disabled={quickText.trim().length < 10}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
          >
            Analyze
          </button>
          <button
            onClick={() => {
              setQuickText("I am calling from your bank. Share your OTP immediately or your account will be blocked.");
            }}
            className="px-4 py-2 border border-border rounded-lg hover:bg-muted text-sm"
          >
            Try sample scam phrase
          </button>
        </div>
      </div>

      {/* Recording Controls */}
      <RecordingControls
        isRecording={isRecording}
        isPaused={isPaused}
        audioLevel={audioLevel}
        onStartRecording={handleStartRecording}
        onStopRecording={handleStopRecording}
        onPauseRecording={pauseRecording}
        onResumeRecording={resumeRecording}
        onUploadAudio={handleUploadAudio}
        error={recorderError}
      />

      {/* Live Transcript Display */}
      {(isRecording || transcript) && (
        <TranscriptDisplay
          transcript={transcript}
          isRecording={isRecording}
          onManualAnalyze={handleManualAnalyze}
        />
      )}

      {/* Analysis Results */}
      {analysis && (
        <div className="space-y-6 animate-fade-in">
          {/* Risk Meter */}
          <RiskMeter
            riskLevel={analysis.riskLevel}
            riskScore={analysis.riskScore}
            isAnalyzing={isAnalyzing}
          />

          {/* Guidance Panel */}
          <GuidancePanel
            riskLevel={analysis.riskLevel}
            guidance={analysis.guidance}
          />

          {/* Indicator List */}
          <div className="rounded-2xl border-2 border-border bg-card p-6">
            <IndicatorList indicators={analysis.indicators} />
          </div>
        </div>
      )}

      {/* Recording - prompt to type what you hear */}
      {isRecording && !analysis && (
        <div className="rounded-2xl border-2 border-amber-500/40 bg-amber-500/10 p-8 text-center">
          <h3 className="text-lg font-semibold mb-2">📝 Type what you hear</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Use <strong>Quick Analyze</strong> above: type what the caller says, click <strong>Analyze</strong>, then Stop.
          </p>
          <p className="text-xs text-muted-foreground">
            (Speech-to-text may not work in all browsers - typing gives accurate results)
          </p>
        </div>
      )}

      {/* Recording - has analysis */}
      {isRecording && analysis && (
        <div className="rounded-lg bg-green-500/10 border border-green-500/30 p-3 text-center text-sm">
          ✓ Analysis ready - Click Stop to save this call
        </div>
      )}

      {/* Initial State - No Analysis */}
      {!isRecording && !analysis && (
        <div className="space-y-6">
          <div className="rounded-2xl border-2 border-dashed border-border p-8 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              <span className="text-4xl">🛡️</span>
            </div>
            <h3 className="text-xl font-bold">{t('ready.title')}</h3>
            <p className="mt-2 text-muted-foreground text-lg">
              {t('ready.description')}
            </p>
          </div>

          {/* Quick Guide */}
          <div className="rounded-2xl border-2 border-border bg-card/50 p-6">
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <span>💡</span>
              <span>How it works</span>
            </h4>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold">1</span>
                <p><strong>Quick Analyze:</strong> Type what you heard on a call and click Analyze</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold">2</span>
                <p><strong>During call:</strong> Start Monitoring → type what caller says in Quick Analyze → Analyze → Stop</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold">3</span>
                <p><strong>Upload recording:</strong> Select audio file → type what you heard → Analyze & Save</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold">4</span>
                <p>Get instant scam detection (bank, OTP, urgency, etc.)</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
