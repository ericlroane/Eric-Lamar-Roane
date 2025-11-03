import React, { useState, useEffect, useRef, useCallback } from 'react';
import { connectLiveSession } from '../services/geminiService';
import { Mic, MicOff, Bot, User, Loader2 } from 'lucide-react';
import { LiveSession, LiveServerMessage } from '@google/genai';

// Audio decoding utilities from Gemini docs
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

type TranscriptionEntry = {
  author: 'user' | 'model';
  text: string;
  isFinal: boolean;
};

type SessionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

const SparkLive: React.FC = () => {
  const [status, setStatus] = useState<SessionStatus>('disconnected');
  const [transcript, setTranscript] = useState<TranscriptionEntry[]>([]);
  const sessionRef = useRef<LiveSession | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef(new Set<AudioBufferSourceNode>());
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    return () => {
      sessionRef.current?.close();
      outputAudioContextRef.current?.close();
    };
  }, []);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  const handleMessage = useCallback(async (message: LiveServerMessage) => {
    // Handle transcriptions
    if (message.serverContent?.inputTranscription || message.serverContent?.outputTranscription) {
        const isInput = !!message.serverContent.inputTranscription;
        const transcription = isInput ? message.serverContent.inputTranscription! : message.serverContent.outputTranscription!;
        const author = isInput ? 'user' : 'model';
        
        setTranscript(prev => {
            const newTranscript = [...prev];
            const lastEntry = newTranscript[newTranscript.length - 1];

            if (lastEntry && lastEntry.author === author && !lastEntry.isFinal) {
                lastEntry.text = transcription.text;
            } else {
                newTranscript.push({ author, text: transcription.text, isFinal: false });
            }
            return newTranscript;
        });
    }
    
    if (message.serverContent?.turnComplete) {
        setTranscript(prev => prev.map(entry => ({ ...entry, isFinal: true })));
    }

    // Handle audio playback
    const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
    if (base64Audio && outputAudioContextRef.current) {
      const ctx = outputAudioContextRef.current;
      nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
      const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.addEventListener('ended', () => sourcesRef.current.delete(source));
      source.start(nextStartTimeRef.current);
      nextStartTimeRef.current += audioBuffer.duration;
      sourcesRef.current.add(source);
    }
    
    if (message.serverContent?.interrupted) {
        for (const source of sourcesRef.current.values()) {
            source.stop();
            sourcesRef.current.delete(source);
        }
        nextStartTimeRef.current = 0;
    }

  }, []);

  const toggleSession = async () => {
    if (status === 'connected' || status === 'connecting') {
      sessionRef.current?.close();
      setStatus('disconnected');
    } else {
      setStatus('connecting');
      try {
        const session = await connectLiveSession({
          onOpen: async () => {
            setStatus('connected');
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            return {
              stream,
              stop: () => stream.getTracks().forEach(track => track.stop())
            }
          },
          onMessage: handleMessage,
          onError: (e) => {
            console.error(e);
            setStatus('error');
          },
          onClose: () => {
            setStatus('disconnected');
            sessionRef.current = null;
          }
        });
        sessionRef.current = session;
      } catch (err) {
        console.error("Failed to start session:", err);
        setStatus('error');
      }
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'connected': return 'Connected. Start speaking...';
      case 'connecting': return 'Connecting...';
      case 'error': return 'An error occurred. Please try again.';
      default: return 'Click the mic to start a conversation.';
    }
  }

  return (
    <div className="bg-vibe-bg-light border border-gray-700 rounded-lg h-full flex flex-col shadow-lg min-h-[70vh]">
      <div className="flex-grow p-4 overflow-y-auto">
        <div className="space-y-4">
            {transcript.map((entry, index) => (
                <div key={index} className={`flex items-start gap-3 ${entry.author === 'user' ? 'justify-end' : ''}`}>
                    {entry.author === 'model' && <div className="flex-shrink-0 w-8 h-8 rounded-full bg-vibe-primary flex items-center justify-center"><Bot size={20} className="text-white"/></div>}
                    <p className={`max-w-md p-3 rounded-lg ${entry.author === 'user' ? 'bg-gray-600' : 'bg-vibe-bg'} ${!entry.isFinal ? 'opacity-70' : ''}`}>
                        {entry.text}
                    </p>
                    {entry.author === 'user' && <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center"><User size={20} className="text-white"/></div>}
                </div>
            ))}
            <div ref={transcriptEndRef} />
        </div>
      </div>
      <div className="p-4 border-t border-gray-700 flex flex-col items-center justify-center gap-4">
        <button
          onClick={toggleSession}
          disabled={status === 'connecting'}
          className={`w-20 h-20 rounded-full flex items-center justify-center text-white transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-vibe-primary/50
            ${status === 'connected' ? 'bg-red-600 hover:bg-red-700 animate-pulse' : 'bg-vibe-primary hover:bg-vibe-primary-hover'}
            ${status === 'connecting' ? 'bg-gray-500 cursor-not-allowed' : ''}
          `}
        >
          {status === 'connecting' ? <Loader2 size={32} className="animate-spin" /> : (status === 'connected' ? <MicOff size={32} /> : <Mic size={32} />)}
        </button>
        <p className="text-sm text-vibe-text-secondary h-5">{getStatusText()}</p>
      </div>
    </div>
  );
};

export default SparkLive;
