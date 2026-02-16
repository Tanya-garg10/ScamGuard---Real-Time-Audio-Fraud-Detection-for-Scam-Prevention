import { useState, useRef, useCallback } from 'react';

interface UseAudioRecorderReturn {
  isRecording: boolean;
  isPaused: boolean;
  audioBlob: Blob | null;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  error: string | null;
  audioLevel: number;
  transcript: string;
}

export const useAudioRecorder = (): UseAudioRecorderReturn => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [transcript, setTranscript] = useState('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);
  const isRecordingRef = useRef(false);
  const isPausedRef = useRef(false);

  const updateAudioLevel = useCallback(() => {
    if (analyserRef.current) {
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      setAudioLevel(average / 255);
    }
    animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
  }, []);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setTranscript('');

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Set up audio analysis
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        setAudioLevel(0);

        // Stop speech recognition
        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(100);

      // Start speech recognition
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript + ' ';
            } else {
              interimTranscript += transcript;
            }
          }

          setTranscript(prev => {
            const updated = prev + finalTranscript;
            return updated;
          });
        };

        recognition.onerror = (event: any) => {
          const err = event.error || 'unknown';
          // Ignore benign errors: no-speech (silence), aborted (intentional stop)
          if (err === 'no-speech' || err === 'aborted') return;

          console.error('Speech recognition error:', err);
          const messages: Record<string, string> = {
            'not-allowed': 'Microphone permission denied. Please allow access.',
            'audio-capture': 'No microphone found or microphone in use by another app.',
            'network': 'Network required for speech recognition. Check your connection.',
            'service-not-allowed': 'Speech recognition service blocked. Try a different browser.',
            'language-not-supported': 'Speech language not supported. Try speaking in English.',
          };
          setError(messages[err] || 'Speech recognition error. Analysis may be limited.');
        };

        recognition.onend = () => {
          // Auto-restart if still recording (use refs to avoid stale closure)
          if (isRecordingRef.current && !isPausedRef.current) {
            try {
              recognition.start();
            } catch (e) {
              console.log('Recognition restart failed:', e);
            }
          }
        };

        recognitionRef.current = recognition;
        recognition.start();
      } else {
        console.warn('Speech recognition not supported');
        setError('Speech recognition not supported in this browser. Using basic analysis.');
      }

      setIsRecording(true);
      setIsPaused(false);
      isRecordingRef.current = true;
      isPausedRef.current = false;
      updateAudioLevel();
    } catch (err) {
      setError('Could not access microphone. Please allow microphone access and try again.');
      console.error('Error accessing microphone:', err);
    }
  }, [updateAudioLevel, isRecording, isPaused]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      isRecordingRef.current = false;
      isPausedRef.current = false;
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
    }
  }, [isRecording]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      isPausedRef.current = true;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    }
  }, [isRecording, isPaused]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      isPausedRef.current = false;
      updateAudioLevel();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          console.log('Recognition restart failed:', e);
        }
      }
    }
  }, [isRecording, isPaused, updateAudioLevel]);

  return {
    isRecording,
    isPaused,
    audioBlob,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    error,
    audioLevel,
    transcript,
  };
};
