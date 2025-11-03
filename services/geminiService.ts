import { GoogleGenAI, Chat, Modality, LiveServerMessage, Blob, Type } from '@google/genai';
import { ChatMessage, ChatAuthor } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

let chatSession: { chat: Chat | null; key: string | null } = {
  chat: null,
  key: null,
};

const startChatSession = (
  history: ChatMessage[],
  modelName: string,
  isThinkingMode: boolean,
  useWebSearch: boolean,
  useMapsSearch: boolean
) => {
  const tools = [];
  if (useWebSearch) {
    tools.push({ googleSearch: {} });
  }
  if (useMapsSearch) {
    tools.push({ googleMaps: {} });
  }

  const config = {
    systemInstruction: "You are 'Spark', a friendly and highly intelligent AI personal assistant created by Eric Lamar Roane for Vibe Coding of Augusta. Your mission is to help small business owners and individuals understand and leverage AI. Be encouraging, clear, and concise. Explain complex AI concepts in simple terms. Always maintain a positive and helpful vibe. The future is now!",
    ...(isThinkingMode && { thinkingConfig: { thinkingBudget: 32768 } }),
    ...(tools.length > 0 && { tools }),
  };

  chatSession.chat = ai.chats.create({
    model: modelName,
    config: config,
    history: history
      .filter(msg => msg.author !== ChatAuthor.SYSTEM)
      .map(msg => ({
        role: msg.author === ChatAuthor.USER ? 'user' : 'model',
        parts: [{ text: msg.content }],
      })),
  });
};

export async function* streamMessage(
  message: string,
  history: ChatMessage[],
  config: {
    isThinkingMode: boolean;
    useWebSearch: boolean;
    useMapsSearch: boolean;
    location: GeolocationPosition | null;
  }
): AsyncGenerator<{ text: string, groundingMetadata?: any }, void, undefined> {
  const { isThinkingMode, useWebSearch, useMapsSearch, location } = config;
  const targetModel = isThinkingMode ? 'gemini-2.5-pro' : 'gemini-2.5-flash';
  const sessionKey = `${targetModel}-${useWebSearch}-${useMapsSearch}`;
  
  if (chatSession.key !== sessionKey) {
    startChatSession(history, targetModel, isThinkingMode, useWebSearch, useMapsSearch);
    chatSession.key = sessionKey;
  }

  if (!chatSession.chat) {
    throw new Error("Chat session not initialized");
  }

  try {
    const toolConfig = useMapsSearch && location ? {
      retrievalConfig: {
        latLng: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        }
      }
    } : undefined;

    const responseStream = await chatSession.chat.sendMessageStream({ message, toolConfig });
    for await (const chunk of responseStream) {
      yield {
        text: chunk.text ?? '',
        groundingMetadata: chunk.candidates?.[0]?.groundingMetadata,
      };
    }
  } catch (error) {
    console.error("Error streaming message:", error);
    yield { text: "I'm sorry, I encountered an error. Please try again." };
  }
}

export const generateSpeech = async (text: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Say: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      throw new Error("No audio data returned from API.");
    }
    return base64Audio;
  } catch (error) {
    console.error("Error generating speech:", error);
    throw new Error("Failed to generate audio.");
  }
};

export const generateSalesEmails = async (
  product: string,
  audience: string,
  sellingPoints: string,
  tone: string
): Promise<{ cold: string; followup: string; thank_you: string; }> => {
  const prompt = `Generate 3 sales emails for a product/service.
  Product/Service: ${product}
  Target Audience: ${audience}
  Key Selling Points: ${sellingPoints}
  Tone: ${tone}

  Provide one cold outreach email, one follow-up email (assuming no reply to the first), and one thank-you email (after a demo/meeting).
  Return the response as a JSON object with keys "cold", "followup", and "thank_you". Each value should be the full email text including a subject line in the format "Subject: Your Subject Here".
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            cold: {
              type: Type.STRING,
              description: "The cold outreach email text, including a subject line.",
            },
            followup: {
              type: Type.STRING,
              description: "The follow-up email text, including a subject line.",
            },
            thank_you: {
              type: Type.STRING,
              description: "The thank-you email text, including a subject line.",
            },
          },
          required: ["cold", "followup", "thank_you"],
        },
      },
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText);
  } catch (error) {
    console.error("Error generating sales emails:", error);
    throw new Error("Failed to generate sales emails.");
  }
};


// --- Live API Service ---

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export const connectLiveSession = (callbacks: {
  onMessage: (message: LiveServerMessage) => void,
  onError: (error: ErrorEvent) => void,
  onClose: (event: CloseEvent) => void,
  onOpen: () => Promise<{stream: MediaStream, stop: () => void}>
}) => {
  const sessionPromise = ai.live.connect({
    model: 'gemini-2.5-flash-native-audio-preview-09-2025',
    callbacks: {
      onopen: async () => {
        const { stream, stop } = await callbacks.onOpen();
        const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        const source = inputAudioContext.createMediaStreamSource(stream);
        const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);

        scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
          const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
          const pcmBlob: Blob = {
            data: encode(new Uint8Array(new Int16Array(inputData.map(x => x * 32768)).buffer)),
            mimeType: 'audio/pcm;rate=16000',
          };
          sessionPromise.then((session) => {
            session.sendRealtimeInput({ media: pcmBlob });
          });
        };
        source.connect(scriptProcessor);
        scriptProcessor.connect(inputAudioContext.destination);

        sessionPromise.then(session => {
          const originalClose = session.close;
          session.close = () => {
             stop();
             scriptProcessor.disconnect();
             source.disconnect();
             inputAudioContext.close();
             originalClose.call(session);
          }
        });
      },
      onmessage: callbacks.onMessage,
      onerror: callbacks.onError,
      onclose: callbacks.onClose,
    },
    config: {
      responseModalities: [Modality.AUDIO],
      inputAudioTranscription: {},
      outputAudioTranscription: {},
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
      },
      systemInstruction: 'You are Spark, a friendly and helpful AI assistant from Vibe Coding of Augusta. Keep your responses concise and conversational.',
    },
  });
  return sessionPromise;
};