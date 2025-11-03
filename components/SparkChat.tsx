import React, { useState, useRef, useEffect, useCallback } from 'react';
import { streamMessage, generateSpeech } from '../services/geminiService';
import { ChatMessage, ChatAuthor, GroundingSource } from '../types';
import { Sparkles, User, Send, Bot, Loader2, Clipboard, Check, Volume2, BrainCircuit, Square, Globe, MapPin, Link as LinkIcon } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const welcomeMessages = [
  "Hello! I'm Spark, your AI Personal Assistant. How can I help you leverage AI today?",
  "Welcome to Vibe Coding! I'm Spark. What AI-powered solution can I help you explore?",
  "Greetings! Spark is here to assist you. Ready to unlock the power of AI for your business?",
];

const getRandomWelcomeMessage = () => {
  const randomIndex = Math.floor(Math.random() * welcomeMessages.length);
  return welcomeMessages[randomIndex];
};

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


const CodeCopyButton = ({ codeString }: { codeString: string }) => {
    const [isCopied, setIsCopied] = useState(false);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(codeString).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        });
    };

    return (
        <button 
            onClick={copyToClipboard}
            className="absolute top-2 right-2 p-1.5 rounded-md bg-vibe-bg text-vibe-text-secondary hover:bg-gray-600 hover:text-vibe-text transition-all duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100"
            aria-label={isCopied ? 'Copied!' : 'Copy code'}
        >
            {isCopied ? <Check size={16} /> : <Clipboard size={16} />}
        </button>
    );
};

interface AudioState {
  index: number;
  status: 'loading' | 'playing';
}

const ChatBubble: React.FC<{
  message: ChatMessage;
  index: number;
  audioState: AudioState | null;
  onAudioAction: (index: number, content: string) => void;
  isLoading: boolean;
}> = ({ message, index, audioState, onAudioAction, isLoading }) => {
  const isUser = message.author === ChatAuthor.USER;
  const isModel = message.author === ChatAuthor.MODEL;

  const isThisBubbleLoadingAudio = audioState?.index === index && audioState.status === 'loading';
  const isThisBubblePlayingAudio = audioState?.index === index && audioState.status === 'playing';

  return (
    <div className={`flex items-start gap-3 my-4 ${isUser ? 'justify-end' : ''}`}>
      {isModel && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-vibe-primary flex items-center justify-center">
          <Bot size={20} className="text-white" />
        </div>
      )}
      <div className="group relative max-w-xl">
        <div
          className={`p-4 rounded-2xl ${
            isUser
              ? 'bg-vibe-primary text-white rounded-br-none'
              : 'bg-vibe-bg-light text-vibe-text rounded-bl-none'
          }`}
        >
          <div className="prose prose-invert prose-sm max-w-none">
            <ReactMarkdown
               components={{
                code({ node, inline, className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || '');
                    const codeString = String(children).replace(/\n$/, '');

                    return !inline && match ? (
                        <div className="relative group/code my-2 not-prose">
                            <pre className="bg-vibe-bg border border-gray-600 rounded-lg p-4 pt-8 text-sm overflow-x-auto">
                                <code {...props} className={className}>{children}</code>
                            </pre>
                            <CodeCopyButton codeString={codeString} />
                        </div>
                    ) : (
                        <code className={`bg-vibe-primary/20 text-vibe-accent rounded px-1.5 py-0.5 mx-0.5 font-mono text-sm ${className}`} {...props}>
                            {children}
                        </code>
                    );
                },
            }}
            >{message.content}</ReactMarkdown>
            {isLoading && isModel && message.content === '' && (
              <div className="flex items-center justify-center">
                  <span className="w-2 h-2 ml-2 rounded-full bg-gray-400 animate-pulse [animation-delay:0s]"></span>
                  <span className="w-2 h-2 ml-2 rounded-full bg-gray-400 animate-pulse [animation-delay:0.2s]"></span>
                  <span className="w-2 h-2 ml-2 rounded-full bg-gray-400 animate-pulse [animation-delay:0.4s]"></span>
              </div>
            )}
          </div>
          {message.groundingSources && message.groundingSources.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-600">
              <h4 className="text-xs font-semibold text-vibe-text-secondary mb-2 flex items-center"><LinkIcon size={12} className="mr-1.5" /> Sources:</h4>
              <ul className="space-y-1">
                {message.groundingSources.map((source, i) => (
                  <li key={i}>
                    <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-xs text-vibe-primary hover:underline flex items-center gap-1.5">
                      {source.type === 'web' ? <Globe size={12} /> : <MapPin size={12} />}
                      <span className="truncate">{source.title || source.uri}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        {isModel && message.content && !isLoading && (
          <button
            onClick={() => onAudioAction(index, message.content)}
            disabled={isThisBubbleLoadingAudio}
            className="absolute -bottom-3 -right-3 p-1.5 rounded-full bg-vibe-bg-light border border-gray-600 text-vibe-text-secondary hover:bg-gray-600 hover:text-vibe-text transition-all duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100 disabled:opacity-50"
            aria-label={isThisBubblePlayingAudio ? "Stop audio" : "Play audio"}
          >
            {isThisBubblePlayingAudio ? <Square size={16} /> : (isThisBubbleLoadingAudio ? <Loader2 size={16} className="animate-spin" /> : <Volume2 size={16} />)}
          </button>
        )}
      </div>
      {isUser && (
         <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
          <User size={20} className="text-white" />
        </div>
      )}
    </div>
  );
};

const Toggle = ({ id, isChecked, onChange, label, icon, title }: { id: string, isChecked: boolean, onChange: () => void, label: string, icon: React.ReactNode, title?: string }) => (
  <div title={title}>
    <label htmlFor={id} className="flex items-center cursor-pointer">
      <span className={`mr-2 transition-colors ${isChecked ? 'text-vibe-primary' : 'text-vibe-text-secondary'}`}>{icon}</span>
      <span className={`mr-3 text-sm font-medium ${isChecked ? 'text-vibe-text' : 'text-vibe-text-secondary'}`}>{label}</span>
      <div className="relative">
        <input id={id} type="checkbox" className="sr-only" checked={isChecked} onChange={onChange} />
        <div className={`block w-10 h-6 rounded-full transition-colors ${isChecked ? 'bg-vibe-primary' : 'bg-gray-600'}`}></div>
        <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${isChecked ? 'transform translate-x-full' : ''}`}></div>
      </div>
    </label>
  </div>
);


const SparkChat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      author: ChatAuthor.MODEL,
      content: getRandomWelcomeMessage(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isThinkingMode, setIsThinkingMode] = useState(false);
  const [useWebSearch, setUseWebSearch] = useState(false);
  const [useMapsSearch, setUseMapsSearch] = useState(false);
  const [location, setLocation] = useState<GeolocationPosition | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [audioState, setAudioState] = useState<AudioState | null>(null);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const activeAudioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    return () => {
      activeAudioSourceRef.current?.stop();
      audioContextRef.current?.close();
    };
  }, []);

  useEffect(() => {
    chatContainerRef.current?.scrollTo(0, chatContainerRef.current.scrollHeight);
  }, [messages]);

  useEffect(() => {
    if (useMapsSearch && !location) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation(position);
          setLocationError(null);
        },
        (error) => {
          console.error("Geolocation error:", error);
          setLocationError("Could not get location. Please enable location services.");
          setUseMapsSearch(false); // Turn off toggle if permission is denied
        }
      );
    }
  }, [useMapsSearch, location]);
  
  const handleAudioAction = useCallback(async (index: number, content: string) => {
    if (activeAudioSourceRef.current) {
      activeAudioSourceRef.current.onended = null;
      activeAudioSourceRef.current.stop();
      activeAudioSourceRef.current = null;
    }
    if (audioState?.index === index) {
      setAudioState(null);
      return;
    }
    if (!audioContextRef.current) return;
    setAudioState({ index, status: 'loading' });
    try {
      const base64Audio = await generateSpeech(content);
      const audioBuffer = await decodeAudioData(decode(base64Audio), audioContextRef.current, 24000, 1);
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      source.onended = () => {
        if (activeAudioSourceRef.current === source) {
          setAudioState(null);
          activeAudioSourceRef.current = null;
        }
      };
      activeAudioSourceRef.current = source;
      source.start();
      setAudioState({ index, status: 'playing' });
    } catch (err) {
      console.error('Failed to play audio', err);
      setAudioState(prev => prev?.index === index ? null : prev);
    }
  }, [audioState]);


  const handleSendMessage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    activeAudioSourceRef.current?.stop();
    setAudioState(null);

    const userMessage: ChatMessage = { author: ChatAuthor.USER, content: input };
    const currentHistory = [...messages, userMessage];
    setMessages(currentHistory);
    setInput('');
    setIsLoading(true);

    let fullResponse = '';
    let groundingSources: GroundingSource[] = [];
    const modelMessageIndex = messages.length + 1;
    setMessages((prev) => [...prev, { author: ChatAuthor.MODEL, content: '' }]);

    try {
      const responseStream = streamMessage(input, currentHistory, { isThinkingMode, useWebSearch, useMapsSearch, location });
      for await (const chunk of responseStream) {
        fullResponse += chunk.text;
        if (chunk.groundingMetadata?.groundingChunks) {
          groundingSources = chunk.groundingMetadata.groundingChunks.map((c: any) => ({
            type: c.web ? 'web' : 'maps',
            uri: c.web?.uri || c.maps?.uri,
            title: c.web?.title || c.maps?.title,
          })).filter((s: GroundingSource) => s.uri);
        }

        setMessages((prev) => {
            const newMessages = [...prev];
            newMessages[modelMessageIndex] = { author: ChatAuthor.MODEL, content: fullResponse, groundingSources };
            return newMessages;
        });
      }
    } catch (error) {
      console.error(error);
      setMessages((prev) => {
        const newMessages = [...prev];
        newMessages[modelMessageIndex] = { author: ChatAuthor.MODEL, content: "Sorry, I'm having trouble connecting. Please try again." };
        return newMessages;
      });
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages, isThinkingMode, useWebSearch, useMapsSearch, location]);
  
  return (
    <div className="bg-vibe-bg-light border border-gray-700 rounded-lg h-full flex flex-col shadow-lg min-h-[70vh]">
       <div className="flex items-center p-4 border-b border-gray-700">
        <Sparkles className="text-vibe-primary mr-3" />
        <h3 className="text-xl font-bold text-white">Spark AI Assistant</h3>
      </div>
      <div ref={chatContainerRef} className="flex-grow p-4 overflow-y-auto">
        {messages.map((msg, index) => (
          <ChatBubble key={index} message={msg} index={index} audioState={audioState} onAudioAction={handleAudioAction} isLoading={isLoading && index === messages.length -1} />
        ))}
      </div>
      <div className="p-4 border-t border-gray-700">
        <div className="flex flex-wrap justify-end items-center gap-x-6 gap-y-2 mb-2 pr-2">
            <Toggle id="web-search-toggle" isChecked={useWebSearch} onChange={() => setUseWebSearch(!useWebSearch)} label="Web Search" icon={<Globe size={18} />} title="Enable to get up-to-date info from the web." />
            <Toggle id="maps-search-toggle" isChecked={useMapsSearch} onChange={() => setUseMapsSearch(!useMapsSearch)} label="Maps Search" icon={<MapPin size={18} />} title="Enable for location-aware answers."/>
            <Toggle id="thinking-mode-toggle" isChecked={isThinkingMode} onChange={() => setIsThinkingMode(!isThinkingMode)} label="Thinking Mode" icon={<BrainCircuit size={18} />} title="Enable for complex reasoning. Responses may be slower."/>
        </div>
        {locationError && <p className="text-xs text-red-400 text-right pr-2 mb-2">{locationError}</p>}
        <form onSubmit={handleSendMessage} className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Spark anything..."
            className="w-full bg-vibe-bg border border-gray-600 rounded-lg py-3 pl-4 pr-12 text-vibe-text focus:outline-none focus:ring-2 focus:ring-vibe-primary"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-vibe-primary hover:bg-vibe-primary-hover disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? <Loader2 size={20} className="animate-spin text-white" /> : <Send size={20} className="text-white" />}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SparkChat;