import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { createBlob, decode, decodeAudioData } from '../services/geminiService';
import { MicrophoneIcon, StopIcon } from './icons';
import { Transcript } from '../types';
import { Language } from '../App';
import { motion, AnimatePresence } from 'framer-motion';

type SessionStatus = 'IDLE' | 'CONNECTING' | 'ACTIVE' | 'ERROR';

interface VoiceAssistantProps {
    language: Language;
}

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ language }) => {
  const [status, setStatus] = useState<SessionStatus>('IDLE');
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const microphoneStreamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);

  const currentInputTranscriptionRef = useRef('');
  const currentOutputTranscriptionRef = useRef('');

  const nextStartTimeRef = useRef(0);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  
  const getSystemInstruction = (lang: Language) => {
    if (lang === 'sw') {
        return `Wewe ni msaidizi wa sauti mwenye huruma unayebobea katika kichocho. Weka majibu yako mafupi na wazi. Toa maelezo kuhusu sababu zake, dalili, na kinga. Maliza kila jibu kwa kumkumbusha mtumiaji kuwasiliana na mtaalamu wa afya. Usitoe ushauri wa kimatibabu.`;
    }
    if (lang === 'luo') {
        return `In jakony ma wuoyo e dholuo kuom tuo mar Kichocho. Chiw dwoko machuok kendo maler. Wuo e wi gima kelo tuo, ranyisi, kod kaka igeng'e. Par ne ng'ato ni odhi one daktari. Kik ichiw thieth.`;
    }
    return `You are a helpful and compassionate voice assistant specializing in schistosomiasis. Keep your answers concise and clear. Provide information about its causes, symptoms, and prevention. Always end your response by reminding the user to consult a healthcare professional for a proper diagnosis and treatment. Do not provide medical advice.`;
  };

  const cleanUp = useCallback(() => {
    scriptProcessorRef.current?.disconnect();
    microphoneStreamRef.current?.getTracks().forEach(track => track.stop());
    
    if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
        inputAudioContextRef.current.close();
    }
    if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
        outputAudioContextRef.current.close();
    }
    
    scriptProcessorRef.current = null;
    microphoneStreamRef.current = null;
    inputAudioContextRef.current = null;
    outputAudioContextRef.current = null;
    
    audioSourcesRef.current.forEach(source => source.stop());
    audioSourcesRef.current.clear();
    nextStartTimeRef.current = 0;
  }, []);

  const handleStopSession = useCallback(async () => {
    if (sessionPromiseRef.current) {
        try {
            const session = await sessionPromiseRef.current;
            session.close();
        } catch (error) {
            console.error("Error closing session:", error);
        }
    }
    cleanUp();
    setStatus('IDLE');
    sessionPromiseRef.current = null;
  }, [cleanUp]);

  const handleStartSession = async () => {
    setStatus('CONNECTING');
    let introText = "Hello! I am your voice assistant. Press the stop button when you are finished.";
    if (language === 'sw') introText = "Hujambo! Mimi ni msaidizi wako wa sauti. Bonyeza kitufe cha kusimamisha utakapomaliza.";
    if (language === 'luo') introText = "Amosi! An Jakony ma Wuoyo. Di 'Stop' ka isetieko.";

    setTranscripts([{ 
        speaker: 'bot', 
        text: introText
    }]);
    currentInputTranscriptionRef.current = '';
    currentOutputTranscriptionRef.current = '';

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      microphoneStreamRef.current = stream;

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

      sessionPromiseRef.current = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
            systemInstruction: getSystemInstruction(language),
            inputAudioTranscription: {},
            outputAudioTranscription: {},
        },
        callbacks: {
          onopen: async () => {
            setStatus('ACTIVE');
            
            // Initialize Audio Contexts
            inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

            // CRITICAL: Ensure contexts are resumed after user gesture
            if (inputAudioContextRef.current.state === 'suspended') {
                await inputAudioContextRef.current.resume();
            }
            if (outputAudioContextRef.current.state === 'suspended') {
                await outputAudioContextRef.current.resume();
            }

            const source = inputAudioContextRef.current.createMediaStreamSource(stream);
            scriptProcessorRef.current = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
            
            scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
              const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              if (sessionPromiseRef.current) {
                sessionPromiseRef.current.then((session) => {
                    session.sendRealtimeInput({ media: pcmBlob });
                });
              }
            };

            source.connect(scriptProcessorRef.current);
            // Connect to destination but sound will be silent as we don't copy buffer
            // This is required for the script processor to fire events in some browsers
            scriptProcessorRef.current.connect(inputAudioContextRef.current.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
             if (message.serverContent?.outputTranscription) {
                currentOutputTranscriptionRef.current += message.serverContent.outputTranscription.text;
             }
             if (message.serverContent?.inputTranscription) {
                 currentInputTranscriptionRef.current += message.serverContent.inputTranscription.text;
             }
             if (message.serverContent?.turnComplete) {
                const fullInput = currentInputTranscriptionRef.current.trim();
                const fullOutput = currentOutputTranscriptionRef.current.trim();
                
                if (fullInput) {
                    setTranscripts(prev => {
                        // Prevent duplicates
                        const last = prev[prev.length-1];
                        if (last && last.speaker === 'user' && last.text === fullInput) return prev;
                        return [...prev, { speaker: 'user', text: fullInput }];
                    });
                }
                if (fullOutput) {
                    setTranscripts(prev => {
                         const last = prev[prev.length-1];
                        if (last && last.speaker === 'bot' && last.text === fullOutput) return prev;
                        return [...prev, { speaker: 'bot', text: fullOutput }];
                    });
                }
                currentInputTranscriptionRef.current = '';
                currentOutputTranscriptionRef.current = '';
             }

             const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
             if (audioData && outputAudioContextRef.current) {
                const outputCtx = outputAudioContextRef.current;
                
                // Ensure output context is running
                if (outputCtx.state === 'suspended') await outputCtx.resume();

                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
                const audioBuffer = await decodeAudioData(decode(audioData), outputCtx, 24000, 1);
                const source = outputCtx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(outputCtx.destination);
                source.addEventListener('ended', () => { audioSourcesRef.current.delete(source); });
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += audioBuffer.duration;
                audioSourcesRef.current.add(source);
             }
          },
          onclose: () => {
            cleanUp();
            setStatus('IDLE');
          },
          onerror: (e: ErrorEvent) => {
            console.error("Live API Error:", e);
            setStatus('ERROR');
            cleanUp();
          },
        },
      });
    } catch (error) {
      console.error("Failed to start session:", error);
      setStatus('ERROR');
      cleanUp();
    }
  };

  useEffect(() => {
    return () => {
        handleStopSession();
    };
  }, [handleStopSession]);

  const getStatusIndicator = () => {
    switch(status) {
        case 'IDLE': return <div className="text-gray-400 font-medium">{language === 'en' ? 'Tap microphone to start' : (language === 'sw' ? 'Gusa maikrofoni kuanza' : 'Guedh maik mondo ichak')}</div>;
        case 'CONNECTING': return <div className="text-blue-500 font-medium animate-pulse">{language === 'en' ? 'Connecting...' : (language === 'sw' ? 'Inaunganisha...' : 'Tudo...')}</div>;
        case 'ACTIVE': return <div className="text-green-500 font-medium animate-pulse">{language === 'en' ? 'Listening...' : (language === 'sw' ? 'Inasikiliza...' : 'Winjo...')}</div>;
        case 'ERROR': return <div className="text-red-500 font-medium">{language === 'en' ? 'Connection Error. Try Again.' : 'Hitilafu. Jaribu tena.'}</div>;
    }
  }

  return (
    <div className="flex flex-col h-full p-6 items-center justify-between bg-[#F8FAFC]">
       
       <div className="w-full max-w-2xl h-1/2 overflow-y-auto bg-white rounded-3xl p-6 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] border border-gray-100 space-y-4">
            <AnimatePresence>
            {transcripts.map((t, i) => (
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={i} 
                    className={`p-3 rounded-2xl text-sm leading-relaxed ${
                        t.speaker === 'user' 
                            ? 'bg-blue-50 text-blue-800 ml-8' 
                            : 'bg-gray-50 text-gray-700 mr-8'
                    }`}
                >
                    <span className="font-bold capitalize text-xs opacity-70 block mb-1">{t.speaker}</span>
                    {t.text}
                </motion.div>
            ))}
            </AnimatePresence>
            {transcripts.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-gray-300">
                    <MicrophoneIcon className="w-12 h-12 mb-2 opacity-20" />
                    <p className="text-sm">Conversation history will appear here</p>
                </div>
            )}
        </div>
      
      <div className="flex flex-col items-center gap-6 pb-8">
        <div className="relative">
            {/* Ripple Effect */}
            {status === 'ACTIVE' && (
                <>
                <motion.div 
                    animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
                    className="absolute inset-0 bg-green-400 rounded-full"
                />
                 <motion.div 
                    animate={{ scale: [1, 2], opacity: [0.3, 0] }}
                    transition={{ repeat: Infinity, duration: 2, delay: 0.5, ease: "easeOut" }}
                    className="absolute inset-0 bg-green-300 rounded-full"
                />
                </>
            )}

            {status === 'IDLE' || status === 'ERROR' ? (
            <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleStartSession} 
                className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-green-500 shadow-[0_10px_20px_rgba(34,197,94,0.2)] border-4 border-white z-10 relative"
            >
                <MicrophoneIcon className="w-10 h-10" />
            </motion.button>
            ) : (
            <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleStopSession} 
                className="w-24 h-24 bg-red-500 rounded-full flex items-center justify-center text-white shadow-[0_10px_20px_rgba(239,68,68,0.3)] border-4 border-white z-10 relative"
            >
                <StopIcon className="w-10 h-10" />
            </motion.button>
            )}
        </div>
        <div className="h-6 text-center">{getStatusIndicator()}</div>
      </div>
    </div>
  );
};

export default VoiceAssistant;
