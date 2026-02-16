import React, { useState } from 'react';
import { Card } from './ui/card';
import { ScrollArea } from './ui/scroll-area';

interface TranscriptDisplayProps {
    transcript: string;
    isRecording: boolean;
    onManualAnalyze?: (text: string) => void;
}

export const TranscriptDisplay: React.FC<TranscriptDisplayProps> = ({
    transcript,
    isRecording,
    onManualAnalyze,
}) => {
    const [manualText, setManualText] = useState('');

    if (!isRecording && !transcript) {
        return null;
    }

    const handleAnalyze = () => {
        const text = manualText.trim();
        if (text.length >= 10 && onManualAnalyze) {
            onManualAnalyze(text);
        }
    };

    return (
        <Card className="p-4 bg-card/50 backdrop-blur">
            <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">📝</span>
                <h3 className="font-semibold text-sm">Live Transcript</h3>
                {isRecording && (
                    <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        Recording
                    </span>
                )}
            </div>
            <ScrollArea className="h-32 w-full rounded-md border border-border/50 bg-background/50 p-3">
                {transcript ? (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {transcript}
                    </p>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-2">
                        <div className="text-3xl opacity-50">🎤</div>
                        <p className="text-sm text-muted-foreground italic">
                            {isRecording ? 'Listening... Start speaking to see transcript' : 'Transcript will appear here'}
                        </p>
                        {isRecording && (
                            <p className="text-xs text-muted-foreground">
                                Speak clearly for better recognition
                            </p>
                        )}
                    </div>
                )}
            </ScrollArea>

            {/* Manual entry when speech recognition fails */}
            {isRecording && onManualAnalyze && (
                <div className="mt-3 pt-3 border-t border-border/50">
                    <p className="text-xs text-muted-foreground mb-2">
                        Speech not working? Type or paste what you heard:
                    </p>
                    <textarea
                        value={manualText}
                        onChange={(e) => setManualText(e.target.value)}
                        placeholder="e.g. Hey calling from your bank, share your OTP immediately or your account will be blocked."
                        className="w-full min-h-[60px] px-3 py-2 text-sm rounded-md border border-border bg-background resize-y"
                        rows={2}
                    />
                    <button
                        onClick={handleAnalyze}
                        disabled={manualText.trim().length < 10}
                        className="mt-2 px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Analyze Now
                    </button>
                </div>
            )}
        </Card>
    );
};
