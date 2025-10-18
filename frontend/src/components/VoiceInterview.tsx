import React, { useState, useRef, useEffect } from 'react';

type Props = {
  sessionId: string;
  profile: {
    role: string;
    interviewType: string;
    yearsOfExperience: number | string;
  };
  onComplete: () => void;
};

export default function VoiceInterview({ sessionId, profile, onComplete }: Props) {
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [questionNumber, setQuestionNumber] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const isRecordingRef = useRef(false); // ✅ Ref to track recording state
  const animationFrameRef = useRef<number | null>(null); // ✅ Track animation frame

  const token = localStorage.getItem('token');
  const API_BASE = import.meta.env.VITE_API_BASE;

  useEffect(() => {
    console.log('Browser audio support:');
    const types = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg'];
    types.forEach(type => {
      console.log(`${type}: ${MediaRecorder.isTypeSupported(type)}`);
    });
  }, []);

  function getSupportedMimeType(): string {
    const types = [
      'audio/mp4',
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        console.log('✅ Using MIME type:', type);
        return type;
      }
    }

    console.warn('⚠️ No preferred MIME type supported, using browser default');
    return '';
  }

  async function fetchNextQuestion() {
    setIsProcessing(true);
    try {
      const res = await fetch(`${API_BASE}/interview/sessions/${sessionId}/next-question`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ yearsOfExperience: profile.yearsOfExperience }),
      });

      if (!res.ok) {
        const error = await res.text();
        console.error('Failed to fetch question:', error);
        throw new Error('Failed to load question');
      }

      const data = await res.json();
      setCurrentQuestion(data.question);
      setQuestionNumber(data.questionNumber);

      const audioBuffer = Uint8Array.from(atob(data.audioBase64), c => c.charCodeAt(0));
      const blob = new Blob([audioBuffer], { type: 'audio/mp3' });
      const audio = new Audio(URL.createObjectURL(blob));
      
      audio.onended = () => {
        setTimeout(() => startRecording(), 500);
      };
      
      await audio.play();
    } catch (err) {
      console.error('Failed to fetch question:', err);
      alert('Failed to load next question');
    } finally {
      setIsProcessing(false);
    }
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048;
      source.connect(analyserRef.current);

      const mimeType = getSupportedMimeType();
      const options: MediaRecorderOptions = mimeType ? { mimeType } : {};
      
      mediaRecorderRef.current = new MediaRecorder(stream, options);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.onstop = handleRecordingStop;
      mediaRecorderRef.current.start(100);
      
      setIsRecording(true);
      isRecordingRef.current = true; // ✅ Update ref
      setTranscript('Listening...');

      detectSilence();
    } catch (err: any) {
      console.error('Recording failed:', err);
      alert(`Microphone error: ${err.message}`);
    }
  }

  // ✅ FIXED: Improved silence detection using ref
  function detectSilence() {
    if (!analyserRef.current) return;

    const bufferLength = analyserRef.current.fftSize;
    const dataArray = new Uint8Array(bufferLength);
    let silenceStart: number | null = null;
    const SILENCE_THRESHOLD = 15; // Lower = more sensitive
    const SILENCE_DURATION = 2000; // 2 seconds

    const checkAudio = () => {
      // ✅ Use ref instead of state
      if (!isRecordingRef.current || !analyserRef.current) {
        console.log('Stopping silence detection');
        return;
      }

      analyserRef.current.getByteTimeDomainData(dataArray);

      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        const value = Math.abs(dataArray[i] - 128);
        sum += value;
      }
      const average = sum / bufferLength;

      // Log audio level occasionally for debugging
      if (Math.random() < 0.1) {
        console.log('Audio level:', average.toFixed(2));
      }

      if (average < SILENCE_THRESHOLD) {
        if (!silenceStart) {
          silenceStart = Date.now();
          console.log('Silence started');
        } else if (Date.now() - silenceStart > SILENCE_DURATION) {
          console.log('2 seconds of silence detected, stopping recording');
          stopRecording();
          return;
        }
      } else {
        if (silenceStart) {
          console.log('Sound detected, resetting silence timer');
        }
        silenceStart = null;
      }

      animationFrameRef.current = requestAnimationFrame(checkAudio);
    };

    checkAudio();
  }

  // ✅ FIXED: Proper cleanup
  function stopRecording() {
    console.log('Stopping recording...');
    isRecordingRef.current = false; // ✅ Update ref first
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    
    setIsRecording(false);
  }

  async function handleRecordingStop() {
    setIsProcessing(true);
    setTranscript('Processing your answer...');

    const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
    const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
    
    console.log('Audio blob size:', audioBlob.size, 'bytes');
    console.log('MIME type:', mimeType);
    
    const extension = mimeType.includes('mp4') ? 'mp4' : 'webm';
    
    const formData = new FormData();
    formData.append('audio', audioBlob, `answer.${extension}`);
    formData.append('questionNumber', questionNumber.toString());
    formData.append('yearsOfExperience', profile.yearsOfExperience.toString());

    try {
      const res = await fetch(`${API_BASE}/interview/sessions/${sessionId}/submit-answer`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error('Backend error:', errorText);
        throw new Error(`Server error: ${res.status}`);
      }

      const data = await res.json();
      console.log('Response data:', data);
      
      setTranscript(data.transcript || 'No transcript received');

      if (data.evaluation) {
        alert(`Score: ${data.evaluation.score}/100\n\n${data.evaluation.feedback}`);
      }

      setTimeout(() => {
        if (questionNumber < 5) {
          fetchNextQuestion();
        } else {
          completeInterview();
        }
      }, 2000);
    } catch (err: any) {
      console.error('Failed to submit answer:', err);
      alert(`Failed to process answer: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  }

  async function completeInterview() {
    try {
      await fetch(`${API_BASE}/interview/sessions/${sessionId}/complete`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      onComplete();
    } catch (err) {
      console.error('Failed to complete interview:', err);
    }
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 24 }}>
      <div style={{ marginBottom: 24, padding: 16, background: '#f3f4f6', borderRadius: 8 }}>
        <h2>Question {questionNumber} of 5</h2>
        <p style={{ fontSize: 18, lineHeight: 1.6, margin: '16px 0' }}>
          {currentQuestion || 'Loading question...'}
        </p>
      </div>

      <div style={{ marginBottom: 24, textAlign: 'center' }}>
        {!isRecording && !isProcessing && questionNumber === 0 && (
          <button
            onClick={fetchNextQuestion}
            style={{
              padding: '16px 32px',
              fontSize: 18,
              background: '#3b82f6',
              color: 'white',
              border: 0,
              borderRadius: 12,
              cursor: 'pointer',
            }}
          >
            Start Interview
          </button>
        )}

        {isRecording && (
          <>
            <div
              style={{
                width: 80,
                height: 80,
                margin: '0 auto 16px',
                background: '#ef4444',
                borderRadius: '50%',
                animation: 'pulse 1.5s infinite',
              }}
            />
            <p style={{ fontSize: 16, color: '#666' }}>
              🎤 Recording... (will auto-stop after 2s silence)
            </p>
            <button
              onClick={stopRecording}
              style={{
                padding: '12px 24px',
                background: '#6b7280',
                color: 'white',
                border: 0,
                borderRadius: 8,
                cursor: 'pointer',
                marginTop: 16,
              }}
            >
              Stop Manually
            </button>
          </>
        )}

        {isProcessing && (
          <p style={{ fontSize: 16, color: '#666' }}>⏳ Processing...</p>
        )}
      </div>

      {transcript && (
        <div style={{ padding: 20, background: '#f9fafb', borderRadius: 8, minHeight: 100 }}>
          <h3>Transcript</h3>
          <p style={{ lineHeight: 1.6 }}>{transcript}</p>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}
