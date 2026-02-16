import { useState, useCallback, useRef, useEffect } from 'react';
import type { AnalysisResult, ScamIndicator, RiskLevel } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';

const scamPatterns: Omit<ScamIndicator, 'detected' | 'confidence'>[] = [
  {
    id: 'impersonation',
    type: 'impersonation',
    label: 'Caller Impersonation',
    description: 'Caller claims to be from bank, government, or trusted organization',
    severity: 'high',
  },
  {
    id: 'urgency',
    type: 'urgency',
    label: 'Urgency Pressure',
    description: 'Creating false urgency - "Act now or face consequences"',
    severity: 'high',
  },
  {
    id: 'emotional',
    type: 'emotional',
    label: 'Emotional Manipulation',
    description: 'Using fear, excitement, or sympathy to manipulate',
    severity: 'medium',
  },
  {
    id: 'authority',
    type: 'authority',
    label: 'Authority Pressure',
    description: 'Claiming legal authority or threatening arrest',
    severity: 'high',
  },
  {
    id: 'otp_request',
    type: 'otp_request',
    label: 'OTP Request',
    description: 'Asking for OTP, PIN, or password',
    severity: 'high',
  },
  {
    id: 'money_request',
    type: 'money_request',
    label: 'Money Request',
    description: 'Requesting money transfer or gift cards',
    severity: 'high',
  },
  {
    id: 'voice_pattern',
    type: 'voice_pattern',
    label: 'Suspicious Voice Pattern',
    description: 'Unusual stress, pitch changes, or scripted speech',
    severity: 'medium',
  },
];

const getLocalizedGuidance = (riskLevel: RiskLevel, lang: string): string[] => {
  const guidance: Record<string, Record<RiskLevel, string[]>> = {
    en: {
      low: [
        '✓ Call appears safe',
        '✓ No suspicious patterns detected',
        '✓ Continue with normal caution',
      ],
      medium: [
        '⚠️ Be careful with this call',
        '⚠️ Do not share personal information yet',
        '⚠️ Verify the caller\'s identity independently',
        '⚠️ If unsure, hang up and call back using official numbers',
      ],
      high: [
        '🚫 HIGH RISK - This could be a scam!',
        '🚫 DO NOT share any OTP or passwords',
        '🚫 DO NOT transfer any money',
        '🚫 End this call immediately',
        '🚫 Block this number',
        '📞 Contact your family or bank directly',
      ],
    },
    hi: {
      low: [
        '✓ कॉल सुरक्षित लगती है',
        '✓ कोई संदिग्ध पैटर्न नहीं मिला',
        '✓ सामान्य सावधानी के साथ जारी रखें',
      ],
      medium: [
        '⚠️ इस कॉल में सावधान रहें',
        '⚠️ अभी व्यक्तिगत जानकारी साझा न करें',
        '⚠️ कॉलर की पहचान स्वतंत्र रूप से सत्यापित करें',
        '⚠️ अगर संदेह हो, फोन काटें और आधिकारिक नंबर से कॉल करें',
      ],
      high: [
        '🚫 उच्च जोखिम - यह धोखाधड़ी हो सकती है!',
        '🚫 कोई भी OTP या पासवर्ड साझा न करें',
        '🚫 कोई पैसा ट्रांसफर न करें',
        '🚫 इस कॉल को तुरंत समाप्त करें',
        '🚫 इस नंबर को ब्लॉक करें',
        '📞 अपने परिवार या बैंक से सीधे संपर्क करें',
      ],
    },
    ta: {
      low: [
        '✓ அழைப்பு பாதுகாப்பானதாக தெரிகிறது',
        '✓ சந்தேகமான முறைகள் இல்லை',
        '✓ சாதாரண எச்சரிக்கையுடன் தொடரவும்',
      ],
      medium: [
        '⚠️ இந்த அழைப்பில் கவனமாக இருங்கள்',
        '⚠️ இன்னும் தனிப்பட்ட தகவல்களைப் பகிர வேண்டாம்',
        '⚠️ அழைப்பாளரின் அடையாளத்தை சுயாதீனமாக சரிபார்க்கவும்',
      ],
      high: [
        '🚫 அதிக ஆபத்து - இது மோசடியாக இருக்கலாம்!',
        '🚫 எந்த OTP அல்லது கடவுச்சொற்களையும் பகிர வேண்டாம்',
        '🚫 பணம் மாற்ற வேண்டாம்',
        '🚫 இந்த அழைப்பை உடனடியாக முடிக்கவும்',
      ],
    },
  };

  return guidance[lang]?.[riskLevel] || guidance.en[riskLevel];
};

/** Rule-based scam detection - works without API key */
const ruleBasedScamAnalysis = (
  transcript: string,
  language: string
): Omit<AnalysisResult, 'timestamp'> => {
  const text = transcript.toLowerCase().trim();
  const indicators: (ScamIndicator & { detected: boolean; confidence: number })[] = [];
  let riskScore = 0;

  const patterns: { id: string; keywords: string[]; weight: number }[] = [
    { id: 'impersonation', keywords: ['bank', 'bank se', 'from bank', 'rbi', 'government', 'police', 'tax department', 'income tax', 'sbi', 'hdfc', 'icici'], weight: 25 },
    { id: 'otp_request', keywords: ['otp', 'share otp', 'otp batao', 'otp bhejo', 'pin', 'cvv', 'password', 'verify code'], weight: 30 },
    { id: 'urgency', keywords: ['immediately', 'urgent', 'right now', 'account blocked', 'account will be blocked', 'suspend', 'act now'], weight: 25 },
    { id: 'authority', keywords: ['arrest', 'police', 'legal', 'case', 'fine', 'court'], weight: 20 },
    { id: 'money_request', keywords: ['transfer', 'upi', 'gift card', 'pay', 'send money'], weight: 25 },
    { id: 'emotional', keywords: ['emergency', 'help', 'save', 'fear', 'threat'], weight: 15 },
  ];

  for (const { id, keywords, weight } of patterns) {
    const found = keywords.some((kw) => text.includes(kw));
    const pattern = scamPatterns.find((p) => p.id === id)!;
    indicators.push({
      ...pattern,
      detected: found,
      confidence: found ? 0.85 : 0,
    });
    if (found) riskScore += weight;
  }

  indicators.push({
    ...scamPatterns.find((p) => p.id === 'voice_pattern')!,
    detected: false,
    confidence: 0,
  });

  riskScore = Math.min(100, riskScore);
  const riskLevel: RiskLevel = riskScore >= 50 ? 'high' : riskScore >= 25 ? 'medium' : 'low';

  return {
    riskLevel,
    riskScore: riskLevel === 'high' ? Math.max(riskScore, 75) : riskScore,
    indicators,
    guidance: getLocalizedGuidance(riskLevel, language),
  };
};

interface UseScamAnalysisReturn {
  isAnalyzing: boolean;
  analysis: AnalysisResult | null;
  startAnalysis: (initialTranscript?: string) => void;
  stopAnalysis: () => void;
  updateTranscript: (transcript: string) => void;
  analyzeTranscript: (transcript: string) => Promise<AnalysisResult>;
  analyzeAudio: (audioBlob: Blob) => Promise<AnalysisResult>;
}

export const useScamAnalysis = (): UseScamAnalysisReturn => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const firstCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const transcriptRef = useRef<string>('');
  const lastAnalyzedLengthRef = useRef<number>(0);
  const { language } = useLanguage();

  const analyzeTranscript = useCallback(async (transcript: string): Promise<AnalysisResult> => {
    // Use rule-based analysis directly - no API/key needed, works offline
    const ruleResult = ruleBasedScamAnalysis(transcript, language);
    const result: AnalysisResult = {
      ...ruleResult,
      timestamp: new Date(),
    };
    setAnalysis(result);
    return result;
  }, [language]);

  const startAnalysis = useCallback((initialTranscript: string = '') => {
    setIsAnalyzing(true);
    transcriptRef.current = initialTranscript;
    lastAnalyzedLengthRef.current = 0;

    console.log('🎬 Starting analysis system...');

    // Initial safe state
    setAnalysis({
      riskLevel: 'low',
      riskScore: 0,
      indicators: scamPatterns.map(p => ({ ...p, detected: false, confidence: 0 })),
      guidance: getLocalizedGuidance('low', language),
      timestamp: new Date(),
    });

    // Analyze transcript every 3 seconds if there's new content
    const ANALYZE_THRESHOLD = 15; // Minimum new chars to trigger analysis (catches short scam phrases like "Share OTP")

    const runIntervalCheck = async () => {
      const currentTranscript = transcriptRef.current;

      // Only analyze if we have new content (at least 15 characters - catches "Share OTP", "bank", etc.)
      if (currentTranscript.length >= ANALYZE_THRESHOLD && currentTranscript.length > lastAnalyzedLengthRef.current) {
        lastAnalyzedLengthRef.current = currentTranscript.length;

        try {
          await analyzeTranscript(currentTranscript);
        } catch (error) {
          console.error('Real-time analysis error:', error);
        }
      }
    };

    // Run first analysis sooner (after 2 sec) if we have content
    firstCheckTimeoutRef.current = setTimeout(runIntervalCheck, 2000);
    intervalRef.current = setInterval(runIntervalCheck, 3000);
  }, [language, analyzeTranscript]);

  const stopAnalysis = useCallback(async () => {
    setIsAnalyzing(false);
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    if (firstCheckTimeoutRef.current) {
      clearTimeout(firstCheckTimeoutRef.current);
      firstCheckTimeoutRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Final analysis with complete transcript
    const finalTranscript = transcriptRef.current;
    if (finalTranscript.length >= 15) {
      console.log('Running final analysis on complete transcript');
      try {
        await analyzeTranscript(finalTranscript);
      } catch (error) {
        console.error('Final analysis error:', error);
      }
    }

    transcriptRef.current = '';
    lastAnalyzedLengthRef.current = 0;
  }, [analyzeTranscript]);

  const analyzeAudio = useCallback(
    async (audioBlob: Blob): Promise<AnalysisResult> => {
      // For uploaded audio files, return a placeholder result
      // In production, you'd send to a speech-to-text service first
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const result: AnalysisResult = {
        riskLevel: 'medium',
        riskScore: 50,
        indicators: scamPatterns.map(p => ({ ...p, detected: false, confidence: 0 })),
        guidance: getLocalizedGuidance('medium', language),
        timestamp: new Date(),
      };

      setAnalysis(result);
      return result;
    },
    [language]
  );

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateTranscript = useCallback((newTranscript: string) => {
    transcriptRef.current = newTranscript;

    // Trigger analysis when speech produces new content (debounced 1 sec)
    if (newTranscript.trim().length >= 10) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        debounceRef.current = null;
        const current = transcriptRef.current;
        if (current.length > lastAnalyzedLengthRef.current) {
          lastAnalyzedLengthRef.current = current.length;
          analyzeTranscript(current).catch((e) => console.error('Speech analysis:', e));
        }
      }, 1000);
    }
  }, [analyzeTranscript]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (firstCheckTimeoutRef.current) clearTimeout(firstCheckTimeoutRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return {
    isAnalyzing,
    analysis,
    startAnalysis,
    stopAnalysis,
    updateTranscript,
    analyzeTranscript,
    analyzeAudio,
  };
};
