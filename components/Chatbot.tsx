import React, { useState, useEffect, useRef } from 'react';
import { Message, Sender, ChatSession, UserProfile } from '../types';
import { UserIcon, BotIcon, SendIcon, AttachmentIcon, FileIcon, HistoryIcon, PlusIcon, TrashIcon, XIcon, MenuIcon } from './icons';
import { Language } from '../App';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleGenAI } from '@google/genai';
import { supabase } from '../supabaseClient';

interface ChatbotProps {
  language: Language;
  user: UserProfile | null;
  onUpgrade: () => void;
  onUsageUpdate: () => void;
}

interface StoredFile {
  name: string;
  mimeType: string;
  data: string; // Base64
}

const STORAGE_KEY = 'schisto_chat_history';

const Chatbot: React.FC<ChatbotProps> = ({ language, user, onUpgrade, onUsageUpdate }) => {
  const chatHistory = useRef<any[]>([]); 

  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [storedFiles, setStoredFiles] = useState<StoredFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  const [history, setHistory] = useState<ChatSession[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); 
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ... (Keep existing getSystemInstruction and useEffects for history loading)
  
  const getSystemInstruction = (lang: Language) => {
    let formatInstruction = ` At the end of your response, provide 3 short, relevant follow-up questions in this exact format: <<SUGGESTIONS>>["Question 1", "Question 2", "Question 3"]`;

    if (lang === 'sw') {
        formatInstruction = ` Mwishoni mwa jibu lako, toa maswali 3 mafupi ya kufuatilia katika muundo huu halisi: <<SUGGESTIONS>>["Swali 1", "Swali 2", "Swali 3"]`;
        return `Wewe ni msaidizi wa matibabu mwenye huruma na unayebobea katika ugonjwa wa kichocho (schistosomiasis). Toa maelezo wazi, sahihi, na rahisi kueleweka kuhusu sababu zake, dalili, kinga, na njia za matibabu.
  Maelezo Muhimu:
  - Sababu: Maambukizi ya vimelea vya Schistosoma kutoka kwa maji safi yaliyoambukizwa.
  - Dalili: Upele, homa, baridi, kikohozi, maumivu ya mwili. Maambukizi ya muda mrefu yanaweza kusababisha uharibifu mkubwa wa viungo.
  - Kinga: Epuka kuogelea au kutembea kwenye maji safi katika maeneo ambapo kichocho ni kawaida. Kunywa maji safi.
  - Utambuzi: Sampuli za choo au mkojo, vipimo vya damu.
  - Tiba: Praziquantel ndiyo dawa inayopendekezwa.
  
  DAKUKO: Ukipewa nyaraka, zitumie kujibu maswali ya mtumiaji.
  MUHIMU: Daima shauri watumiaji kuwasiliana na mtaalamu wa afya kwa utambuzi na matibabu. Usitoe ushauri wa kimatibabu unaoweza kuchukua nafasi ya daktari.${formatInstruction}`;
    }

    if (lang === 'luo') {
        formatInstruction = ` Gikoni mar wechego, chiw penjo 3 machuok manyalo konyo japenjo e fomu ni: <<SUGGESTIONS>>["Penjo 1", "Penjo 2", "Penjo 3"]`;
        return `In jatich manyalo konyo ji e weche mag Kichocho (Schistosomiasis). Wuo e dholuo maler kendo mayot winjo.
        
        Weche Madongo:
        - Gima kelo tuo: Pi man gi njokni mag kichocho.
        - Ranyisi: Dhendi nyalo kwiny, del lit, ahonda, kirowo. Ka tuo obedo e del kuom kinde malach, onyalo hinyo nyukta.
        - Geng'o: Kik iwuothi kata gweng'o e pi ma ok ler. Madh pi motwe.
        - Fwenyo: Itimo pimo mar cieth kata lach e ospital.
        - Thieth: Yath miluongo ni Praziquantel.
        
        Nyaraka: Ka oormi picha kata ndiko, ti godo e dwoko penjo.
        MUHIMU: Nyis ji ni gidhi e ospital mondo oneg-gi daktari. Kik ichiw thieth ka daktari ma oting'o rang'iny.${formatInstruction}`;
    }

    return `You are a helpful and compassionate medical assistant specializing in schistosomiasis, a disease caused by parasitic flatworms. Provide clear, accurate, and easy-to-understand information about its causes, symptoms, prevention, and treatment options. 
  Key Information to provide:
  - Cause: Infection with Schistosoma parasites from contaminated freshwater.
  - Symptoms: Rash, fever, chills, cough, muscle aches. Chronic infection can lead to severe organ damage.
  - Prevention: Avoid swimming or wading in freshwater in areas where schistosomiasis is common. Drink safe water.
  - Diagnosis: Stool or urine samples, blood tests.
  - Treatment: Praziquantel is the recommended drug.

  STORE: If documents are uploaded, use them to answer user queries accurately.
  IMPORTANT: Always strongly advise users to consult a healthcare professional for diagnosis and treatment. Do not provide medical advice that could replace a doctor's consultation. Your role is informational and supportive.${formatInstruction}`;
  };

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        try {
            setHistory(JSON.parse(saved));
        } catch (e) {
            console.error("Failed to parse history", e);
        }
    }
  }, []);

  useEffect(() => {
    if (messages.length === 0) {
        initChat();
    }
  }, [language]);

  const initChat = async () => {
    chatHistory.current = [
         { role: 'system', content: getSystemInstruction(language) }
    ];
    let initialText = "Hello! I am the Schisto-Care Assistant. You can upload documents to the Store for me to analyze, or ask me questions directly.";
    let suggestions = ["What are the symptoms?", "How is it treated?", "Is it contagious?"];

    if (language === 'sw') {
        initialText = "Hujambo! Mimi ni Msaidizi wa Schisto-Care. Unaweza kupakia nyaraka ili nichambue, au uniulize maswali moja kwa moja.";
        suggestions = ["Dalili ni zipi?", "Inatibiwaje?", "Je, inaambukiza?"];
    } else if (language === 'luo') {
        initialText = "Amosi! An Jakony mar Schisto-Care. Inyalo oro picha mag weche thieth kata penja penjo direct.";
        suggestions = ["Ranyisi gin mage?", "Ithiethe nade?", "Inyalo yude kuom ng'ato?"];
    }

    setMessages([
        {
          sender: Sender.Bot,
          text: initialText,
           suggestions: suggestions
        },
    ]);
    setStoredFiles([]); 
    setActiveSessionId(null);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (messages.length > 2) { 
        saveCurrentSessionToHistory();
    }
  }, [messages]);

  const saveCurrentSessionToHistory = () => {
      const firstUserMsg = messages.find(m => m.sender === Sender.User);
      const title = firstUserMsg ? firstUserMsg.text.substring(0, 30) + '...' : 'New Conversation';
      const now = Date.now();

      setHistory(prev => {
          let newHistory = [...prev];
          if (activeSessionId) {
              const index = newHistory.findIndex(h => h.id === activeSessionId);
              if (index >= 0) {
                  newHistory[index] = { ...newHistory[index], messages, date: now };
              }
          } else {
              const newId = crypto.randomUUID();
              setActiveSessionId(newId);
              newHistory = [{ id: newId, title, date: now, messages }, ...newHistory];
          }
          localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
          return newHistory;
      });
  };

  const handleNewChat = () => {
      initChat();
      if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const loadSession = (session: ChatSession) => {
      setMessages(session.messages);
      setActiveSessionId(session.id);
      chatHistory.current = [
          { role: 'system', content: getSystemInstruction(language) },
          ...session.messages.map(m => ({
              role: m.sender === Sender.User ? 'user' : 'assistant',
              content: m.text
          }))
      ];
      if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const deleteSession = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      const newHistory = history.filter(h => h.id !== id);
      setHistory(newHistory);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
      if (activeSessionId === id) {
          handleNewChat();
      }
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // ... (Keep handleFileUpload logic mostly same, but add check for limit if we want to count uploads as prompts)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
        // Check limit before upload
        if (user && !user.is_premium && user.prompt_count >= 15) {
            setMessages(prev => [...prev, { 
                sender: Sender.Bot, 
                text: "You have reached your free trial limit of 15 prompts. Please upgrade to Premium to continue analyzing documents." 
            }]);
            onUpgrade();
            return;
        }

        setIsUploading(true);
        const file = e.target.files[0];
        
        try {
            const base64Data = await convertFileToBase64(file);
            const newFile: StoredFile = {
                name: file.name,
                mimeType: file.type,
                data: base64Data
            };

            setStoredFiles(prev => [...prev, newFile]);

            let ingestionText = `I have uploaded a document: ${file.name}. Please analyze it and use it to answer future questions.`;
            if (language === 'sw') ingestionText = `Nimepakia waraka: ${file.name}. Tafadhali uchambue na uutumie kujibu maswali yajayo.`;
            if (language === 'luo') ingestionText = `Ase oro ndiko: ${file.name}. Noni kendo itigo kuom dwoko penjo mabiro.`;
            
            const uploadedLabel = language === 'en' ? 'Uploaded' : (language === 'sw' ? 'Imepakiwa' : 'Oor');

            setMessages(prev => [...prev, { 
                sender: Sender.User, 
                text: `📂 ${uploadedLabel}: ${file.name}` 
            }]);

            setIsLoading(true);
            
            let content: any[] = [{ type: 'text', text: ingestionText }];
            
            if (file.type.startsWith('image/')) {
                 content.push({
                    type: 'image_url',
                    image_url: { url: `data:${file.type};base64,${base64Data}` }
                 });
            } else if (file.type.startsWith('text/')) {
                 const textContent = atob(base64Data);
                 content[0].text += `\n\nContent of ${file.name}:\n${textContent}`;
            } else {
                 content[0].text += `\n\n[Attached file: ${file.name} (${file.type})]`;
            }

            chatHistory.current.push({ role: 'user', content: content });
            await streamResponse(chatHistory.current);
            
            // Increment count on successful upload analysis
            await incrementPromptCount();

        } catch (error) {
            console.error("Upload failed", error);
            const errorMsg = language === 'en' ? "Failed to process file." : (language === 'sw' ? "Imeshindwa kuchakata faili." : "Ok anyal nono failno.");
            setMessages(prev => [...prev, { sender: Sender.Bot, text: errorMsg }]);
        } finally {
            setIsUploading(false);
            setIsLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    }
  };

  const incrementPromptCount = async () => {
    if (user) {
        await supabase.rpc('increment_prompt_count');
        onUsageUpdate();
    }
  };

  const handleSendMessage = async (textOverride?: string) => {
    const textToSend = textOverride || userInput;
    if (!textToSend.trim() || isLoading) return;

    // Check Limit
    if (user && !user.is_premium && user.prompt_count >= 15) {
        setMessages(prev => [...prev, { 
            sender: Sender.Bot, 
            text: "You have reached your free trial limit of 15 prompts. Please upgrade to Premium to continue chatting." 
        }]);
        onUpgrade();
        return;
    }

    const userMessage: Message = { sender: Sender.User, text: textToSend };
    setMessages((prev) => [...prev, userMessage]);
    setUserInput('');
    setIsLoading(true);

    chatHistory.current.push({ role: 'user', content: textToSend });

    try {
      await streamResponse(chatHistory.current);
      // Increment count
      await incrementPromptCount();
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => [
        ...prev,
        { sender: Sender.Bot, text: "I encountered an error. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const streamResponse = async (messagesHistory: any[]) => {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

        const systemInstruction = getSystemInstruction(language);

        const historyForGemini = messagesHistory
            .filter(m => m.role !== 'system') 
            .slice(0, -1)
            .map(m => {
                const role = m.role === 'assistant' ? 'model' : 'user';
                let parts = [];
                if (typeof m.content === 'string') {
                    parts = [{ text: m.content }];
                } else if (Array.isArray(m.content)) {
                    parts = m.content.map((c: any) => {
                        if (c.type === 'image_url') {
                            const match = c.image_url.url.match(/^data:(.*);base64,(.*)$/);
                            if (match) {
                                return {
                                    inlineData: {
                                        mimeType: match[1],
                                        data: match[2]
                                    }
                                };
                            }
                        }
                        return { text: c.text };
                    });
                }
                return { role, parts };
            });

        const chat = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: { systemInstruction },
            history: historyForGemini
        });

        const lastMsg = messagesHistory[messagesHistory.length - 1];
        let messageParts = [];
        if (typeof lastMsg.content === 'string') {
            messageParts = [{ text: lastMsg.content }];
        } else if (Array.isArray(lastMsg.content)) {
            messageParts = lastMsg.content.map((c: any) => {
                if (c.type === 'image_url') {
                    const match = c.image_url.url.match(/^data:(.*);base64,(.*)$/);
                    if (match) {
                        return {
                            inlineData: {
                                mimeType: match[1],
                                data: match[2]
                            }
                        };
                    }
                }
                return { text: c.text };
            });
        }

        const resultStream = await chat.sendMessageStream({ message: messageParts });
        
        let botResponse = '';
        setMessages((prev) => [...prev, { sender: Sender.Bot, text: '' }]);

        for await (const chunk of resultStream) {
            const text = chunk.text;
            if (text) {
                botResponse += text;
                
                const separator = "<<SUGGESTIONS>>";
                let displayText = botResponse;
                let suggestions: string[] = [];

                if (botResponse.includes(separator)) {
                    const parts = botResponse.split(separator);
                    displayText = parts[0];
                    try {
                        suggestions = JSON.parse(parts[1]);
                    } catch (e) {
                        // Incomplete JSON
                    }
                }

                setMessages((prev) => {
                    const newMessages = [...prev];
                    const lastMsg = newMessages[newMessages.length - 1];
                    lastMsg.text = displayText;
                    if (suggestions.length > 0) {
                        lastMsg.suggestions = suggestions;
                    }
                    return newMessages;
                });
            }
        }
        
        const separator = "<<SUGGESTIONS>>";
        const cleanResponse = botResponse.split(separator)[0];
        chatHistory.current.push({ role: 'assistant', content: cleanResponse });

      } catch (e) {
          throw e;
      }
  };

  // ... (Keep render helpers like getHistoryLabel, etc.)
  const getHistoryLabel = () => {
    if(language === 'sw') return 'Historia';
    if(language === 'luo') return 'Weche Machon';
    return 'History';
  };

  const getNewChatLabel = () => {
    if(language === 'sw') return 'Chat Mpya';
    if(language === 'luo') return 'Chat Manyien';
    return 'New Chat';
  };

  const getPlaceholder = () => {
    if(language === 'sw') return 'Andika swali lako hapa...';
    if(language === 'luo') return 'Ndik penjo mari ka...';
    return 'Type your question here...';
  };

  return (
    <div className="flex h-full relative overflow-hidden bg-white md:rounded-3xl">
      {/* Sidebar Overlay (Mobile) */}
      <AnimatePresence>
        {isSidebarOpen && (
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/20 z-20 md:hidden backdrop-blur-sm" 
                onClick={() => setIsSidebarOpen(false)} 
            />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.div 
        className={`absolute md:static z-30 h-full w-72 bg-gray-50/80 backdrop-blur-md border-r border-gray-100 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white/50">
            <h2 className="font-bold text-gray-700 flex items-center gap-2 text-lg tracking-tight">
                <HistoryIcon className="w-5 h-5 text-blue-500" />
                {getHistoryLabel()}
            </h2>
            <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-gray-400">
                <XIcon className="w-6 h-6" />
            </button>
        </div>

        <div className="p-4">
            <motion.button 
                whileTap={{ scale: 0.95 }}
                onClick={handleNewChat}
                className="w-full flex items-center gap-2 justify-center bg-white hover:bg-blue-50 text-blue-600 border border-blue-100 py-3 px-4 rounded-xl transition-all shadow-sm hover:shadow-md font-semibold"
            >
                <PlusIcon className="w-5 h-5" />
                {getNewChatLabel()}
            </motion.button>
        </div>

        <div className="flex-grow overflow-y-auto px-3 pb-4 space-y-2">
            {history.length === 0 && (
                <div className="text-center text-gray-400 text-sm mt-8 italic">
                    {language === 'en' ? 'No history yet' : (language === 'sw' ? 'Hakuna historia' : 'Onge historia')}
                </div>
            )}
            {history.map((session) => (
                <motion.div 
                    whileHover={{ scale: 1.02 }}
                    key={session.id}
                    onClick={() => loadSession(session)}
                    className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${activeSessionId === session.id ? 'bg-white shadow-md border border-gray-100' : 'text-gray-600 hover:bg-white hover:shadow-sm'}`}
                >
                    <div className="truncate text-sm pr-2 font-medium">
                        {session.title}
                    </div>
                    <button 
                        onClick={(e) => deleteSession(e, session.id)}
                        className="opacity-0 group-hover:opacity-100 hover:text-red-500 p-1.5 rounded-full hover:bg-red-50 transition-all"
                        title="Delete"
                    >
                        <TrashIcon className="w-4 h-4" />
                    </button>
                </motion.div>
            ))}
        </div>
      </motion.div>

      {/* Main Chat Area */}
      <div className="flex-grow flex flex-col h-full w-full bg-[#F8FAFC] relative">
          
          {/* Mobile Menu Button */}
          <div className="md:hidden absolute top-4 left-4 z-10">
              <button onClick={() => setIsSidebarOpen(true)} className="bg-white p-2 rounded-xl shadow-md text-gray-600">
                  <MenuIcon className="w-6 h-6" />
              </button>
          </div>

        {/* Document Store Header / Info */}
        <AnimatePresence>
            {storedFiles.length > 0 && (
                <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="bg-white px-4 py-3 flex items-center gap-2 overflow-x-auto border-b border-gray-100 md:pl-6 pl-16 shadow-sm z-10"
                >
                    <span className="text-xs font-bold text-gray-400 uppercase whitespace-nowrap tracking-wider">
                        {language === 'en' ? 'Store:' : (language === 'sw' ? 'Hifadhi:' : 'Kano:')}
                    </span>
                    {storedFiles.map((f, i) => (
                        <motion.div 
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            key={i} 
                            className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-1.5 min-w-fit"
                        >
                            <FileIcon className="w-3.5 h-3.5 text-blue-500" />
                            <span className="text-xs text-blue-700 font-medium truncate max-w-[120px]">{f.name}</span>
                        </motion.div>
                    ))}
                </motion.div>
            )}
        </AnimatePresence>

        <div className="flex-grow p-4 md:p-8 overflow-y-auto pt-16 md:pt-6">
            <div className="space-y-6 max-w-3xl mx-auto">
            {messages.map((msg, index) => (
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={index} 
                    className={`flex items-end gap-3 ${msg.sender === Sender.User ? 'justify-end' : ''}`}
                >
                {msg.sender === Sender.Bot && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center shadow-lg shadow-blue-200">
                    <BotIcon className="w-5 h-5 text-white" />
                    </div>
                )}
                
                <div className="flex flex-col items-start gap-2 max-w-[85%] md:max-w-lg">
                    <div className={`p-5 rounded-2xl shadow-sm text-sm md:text-base leading-relaxed ${
                        msg.sender === Sender.User 
                            ? msg.text.startsWith('📂') 
                                ? 'bg-gray-100 text-gray-600 rounded-br-none italic border border-gray-200' 
                                : 'bg-blue-600 text-white rounded-br-none shadow-md shadow-blue-100' 
                            : 'bg-white text-gray-700 rounded-bl-none border border-gray-100'
                        }`}>
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                    </div>

                    {/* Suggestions */}
                    {msg.sender === Sender.Bot && msg.suggestions && msg.suggestions.length > 0 && (
                         <div className="flex flex-wrap gap-2 mt-1">
                            {msg.suggestions.map((suggestion, sIdx) => (
                                <motion.button
                                    key={sIdx}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: sIdx * 0.1 }}
                                    whileHover={{ y: -2, backgroundColor: "#F3F4F6" }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleSendMessage(suggestion)}
                                    disabled={isLoading}
                                    className="px-4 py-2 bg-white border border-gray-200 text-gray-600 text-xs md:text-sm rounded-full shadow-sm hover:shadow-md hover:text-blue-600 hover:border-blue-200 transition-all text-left"
                                >
                                    {suggestion}
                                </motion.button>
                            ))}
                         </div>
                    )}
                </div>

                {msg.sender === Sender.User && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                    <UserIcon className="w-5 h-5 text-gray-500" />
                    </div>
                )}
                </motion.div>
            ))}
            {isLoading && (
                <div className="flex items-end gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center">
                        <BotIcon className="w-5 h-5 text-white" />
                    </div>
                    <div className="p-4 rounded-2xl bg-white border border-gray-100 rounded-bl-none shadow-sm">
                        <div className="flex items-center space-x-1.5">
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-75"></div>
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-150"></div>
                        </div>
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
            </div>
        </div>
        
        <div className="p-4 md:p-6 bg-white border-t border-gray-100">
            <div className="max-w-3xl mx-auto flex items-center gap-3">
                <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*,application/pdf,text/plain"
                    className="hidden"
                />
                <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading || isUploading}
                    className="p-3 text-gray-400 hover:text-blue-500 bg-gray-50 rounded-xl transition-colors disabled:opacity-50"
                    title={language === 'en' ? "Upload to Store" : "Pakia kwenye Hifadhi"}
                >
                    <AttachmentIcon className="w-6 h-6" />
                </motion.button>
                
                <div className="flex-grow relative">
                    <input
                        type="text"
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder={getPlaceholder()}
                        className="w-full bg-gray-50 border-0 rounded-xl px-5 py-4 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all shadow-inner"
                        disabled={isLoading}
                    />
                </div>

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleSendMessage()}
                    disabled={isLoading || !userInput.trim()}
                    className="p-4 rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-200 disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none transition-all"
                >
                    <SendIcon className="w-5 h-5" />
                </motion.button>
            </div>
            {isUploading && <p className="text-xs text-blue-500 mt-2 text-center animate-pulse">{language === 'en' ? 'Uploading to Document Store...' : 'Inapakia...'}</p>}
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
