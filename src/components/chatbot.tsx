
'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, Paperclip, Mic, MicOff, Send, X, Loader2, User, Sparkles, FileDiff, Check, FilePlus2, Trash2, RefreshCw, Lightbulb } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import useSpeechRecognition from '@/hooks/use-speech-recognition';
import { chatWithPlaygroundAgent } from '@/ai/flows/playground-agent';
import { cn } from '@/lib/utils';
import CodeMirror from '@uiw/react-codemirror';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import { javascript } from '@codemirror/lang-javascript';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { EditorView } from '@codemirror/view';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


interface CodeFile {
  path: string;
  content: string;
}

interface ChatbotProps {
  files: CodeFile[];
  activeFileName: string;
  onFilesUpdate: (changes: { fileChanges?: { path: string; content: string }[]; filesToDelete?: string[] }) => void;
  apiKey: string | null;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  changes?: {
    fileChanges?: { path: string; content: string }[];
    filesToDelete?: string[];
  } | null;
  changesApplied?: boolean;
}

const MessageContent = ({
  content,
  isLastMessage,
  isAssistant,
  isTyping,
  onTypingComplete,
}: {
  content: string;
  isLastMessage: boolean;
  isAssistant: boolean;
  isTyping: boolean;
  onTypingComplete: () => void;
}) => {
  const [animatedContent, setAnimatedContent] = useState('');
  const [isAnimationDone, setIsAnimationDone] = useState(false);

  useEffect(() => {
    if (isLastMessage && isAssistant && isTyping) {
      setIsAnimationDone(false);
      setAnimatedContent('');
      let i = 0;
      
      const intervalId = setInterval(() => {
        if (i < content.length) {
          const chunkSize = Math.max(1, Math.floor(content.length / 150)); 
          const nextI = Math.min(i + chunkSize, content.length);
          setAnimatedContent(content.substring(0, nextI));
          i = nextI;
        } else {
          clearInterval(intervalId);
          setIsAnimationDone(true);
          onTypingComplete();
        }
      }, 15);
      
      return () => clearInterval(intervalId);
    } else {
      setAnimatedContent(content);
      setIsAnimationDone(true);
    }
  }, [content, isLastMessage, isAssistant, isTyping, onTypingComplete]);

  const getLanguageExtension = (lang: string) => {
    switch (lang?.toLowerCase()) {
      case 'html': return html();
      case 'css': return css();
      case 'js':
      case 'javascript': return javascript({ jsx: true });
      case 'tsx': return javascript({ jsx: true, typescript: true });
      default: return javascript({ jsx: true });
    }
  };
  
  const contentToRender = isLastMessage && isAssistant && isTyping ? animatedContent : content;
  
  const segments: {type: 'text' | 'code'; content: string; lang?: string}[] = [];
  let currentPos = 0;

  while (currentPos < contentToRender.length) {
    const nextCodeStart = contentToRender.indexOf('```', currentPos);

    if (nextCodeStart === -1) {
      segments.push({ type: 'text', content: contentToRender.substring(currentPos) });
      break;
    }

    if (nextCodeStart > currentPos) {
      segments.push({ type: 'text', content: contentToRender.substring(currentPos, nextCodeStart) });
    }

    const fenceEnd = contentToRender.indexOf('\n', nextCodeStart);
    if (fenceEnd === -1) {
      segments.push({ type: 'text', content: contentToRender.substring(nextCodeStart) });
      break;
    }

    const langMatch = contentToRender.substring(nextCodeStart + 3, fenceEnd).trim();
    const lang = langMatch || 'javascript';
    const nextCodeEnd = contentToRender.indexOf('```', fenceEnd);

    if (nextCodeEnd === -1) {
      const code = contentToRender.substring(fenceEnd + 1);
      segments.push({ type: 'code', lang, content: code });
      break;
    }
    
    const code = contentToRender.substring(fenceEnd + 1, nextCodeEnd);
    segments.push({ type: 'code', lang, content: code });
    currentPos = nextCodeEnd + 3;
  }
  
  return (
    <div className="whitespace-pre-wrap">
      {segments.map((segment, index) => {
        if (segment.type === 'code') {
          return (
            <div key={index} className="rounded-md overflow-hidden my-2 border bg-gray-900/50 text-sm">
              <CodeMirror
                value={segment.content}
                theme={vscodeDark}
                extensions={[getLanguageExtension(segment.lang || ''), EditorView.lineWrapping]}
                editable={false}
                readOnly={true}
                basicSetup={{ lineNumbers: false, foldGutter: false, highlightActiveLine: false, highlightSelectionMatches: false }}
              />
            </div>
          );
        } else {
          return <span key={index}>{segment.content}</span>;
        }
      })}
      {isLastMessage && isAssistant && isTyping && !isAnimationDone && (
        <span className="inline-block h-4 w-0.5 bg-current animate-pulse ml-px" />
      )}
    </div>
  );
};


export function Chatbot({ files, activeFileName, onFilesUpdate, apiKey }: ChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'initial',
      role: 'assistant',
      content: "Hello! I'm your AI assistant. How can I help you with your code today? You can ask me to add features, fix bugs, or explain concepts.",
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [imageDataUri, setImageDataUri] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const {
    text: recognizedText,
    isListening,
    startListening,
    stopListening,
    hasRecognitionSupport,
    error: recognitionError,
  } = useSpeechRecognition();
  
  const prevIsListeningRef = useRef(isListening);

  const [currentSuggestions, setCurrentSuggestions] = useState<string[]>([]);

  const allSuggestions = [
      `Explain the purpose of ${activeFileName || 'the active file'}`,
      `Find potential bugs in ${activeFileName || 'the active file'}`,
      'Add a button that shows an alert',
      'Refactor the javascript to be more efficient',
      'How can I improve the CSS?',
      'Delete the CSS file and put its styles in a <style> tag in index.html'
  ];

  const refreshSuggestions = () => {
      const shuffled = [...allSuggestions].sort(() => 0.5 - Math.random());
      setCurrentSuggestions(shuffled.slice(0, 4));
  };

  useEffect(() => {
      refreshSuggestions();
  }, [activeFileName]);

  useEffect(() => {
    if (prevIsListeningRef.current && !isListening && recognizedText) {
      setInputValue(recognizedText);
    }
    prevIsListeningRef.current = isListening;
  }, [isListening, recognizedText]);

  useEffect(() => {
    if (recognitionError) {
      toast({
        variant: 'destructive',
        title: 'Speech Recognition Error',
        description: recognitionError,
      });
    }
  }, [recognitionError, toast]);
  
  useEffect(() => {
    if (scrollAreaRef.current) {
        setTimeout(() => {
            const viewport = scrollAreaRef.current?.querySelector('div[data-radix-scroll-area-viewport]');
            if(viewport) {
                viewport.scrollTop = viewport.scrollHeight;
            }
        }, 100);
    }
  }, [messages, isLoading, isTyping]);

  const handleResetChat = () => {
    setIsLoading(false);
    setIsTyping(false);
    setMessages([
      {
        id: 'initial-reset',
        role: 'assistant',
        content: "Hello! How can I help you with your code today?",
      },
    ]);
    toast({ title: "Chat Reset", description: "The conversation has been cleared." });
  };


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageDataUri(reader.result as string);
        toast({ title: 'Image attached!', description: file.name });
      };
      reader.readAsDataURL(file);
    }
    if (e.target) e.target.value = '';
  };

  const handleSendMessage = async (promptOverride?: string) => {
    const prompt = promptOverride || inputValue.trim();
    if (!prompt && !imageDataUri) return;

    setIsTyping(false);
    if (!promptOverride) {
      setInputValue('');
    }
    setIsLoading(true);
    
    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: prompt };
    setMessages(prev => [...prev, userMessage]);

    const historyForApi = messages.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.content }],
    }));

    const playgroundFiles = files.map(f => ({ path: f.path, content: f.content }));

    try {
      const result = await chatWithPlaygroundAgent({
        prompt,
        files: playgroundFiles,
        activeFile: activeFileName,
        history: historyForApi,
        imageDataUri,
        apiKey: apiKey || undefined,
      });

      const assistantMessage: Message = { 
          id: Date.now().toString() + '-ai',
          role: 'assistant', 
          content: result.response,
          changes: (result.fileChanges && result.fileChanges.length > 0) || (result.filesToDelete && result.filesToDelete.length > 0) ? {
              fileChanges: result.fileChanges,
              filesToDelete: result.filesToDelete,
          } : null,
          changesApplied: false,
      };
      setIsLoading(false);
      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(true);
      setImageDataUri(null);

    } catch (error) {
      console.error('Error with AI agent:', error);
      let errorText = "Sorry, I encountered an error. Please try again.";
      if (error instanceof Error && (error.message.includes('503') || error.message.includes('overloaded') || error.message.toLowerCase().includes('rate limit'))) {
          errorText = "The AI model is currently overloaded or has reached its rate limit. Please try again in a moment. If the problem persists, you can add your own API key in the Settings page.";
      }
      const errorMessage: Message = { id: Date.now().toString() + '-err', role: 'assistant', content: errorText };
      setMessages(prev => [...prev, errorMessage]);
      setIsLoading(false);
      setIsTyping(false);
    }
  };
  
  const handleApplyChanges = (messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (message && message.changes) {
        onFilesUpdate(message.changes);
        setMessages(prev => prev.map(m => m.id === messageId ? { ...m, changesApplied: true } : m));
    }
  };

  const handleDiscardChanges = (messageId: string) => {
    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, changes: null } : m));
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button size="icon" className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-40 bg-zinc-900 text-white border border-zinc-800 hover:bg-zinc-800 hover:text-white transition-colors">
          <Sparkles className="h-7 w-7" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col p-0 gap-0 m-[10px] h-auto rounded-xl border border-zinc-800 bg-zinc-900 text-white backdrop-blur-xl">
        <SheetHeader className="py-3 pl-4 pr-12 border-b border-white/10 flex flex-row justify-between items-center">
          <SheetTitle className="flex items-center gap-2"><Bot /> Dezi</SheetTitle>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleResetChat} title="Reset Chat">
              <RefreshCw className="h-4 w-4" />
          </Button>
        </SheetHeader>
        <ScrollArea className="flex-1" ref={scrollAreaRef}>
          <div className="space-y-4 p-4">
            {messages.map((message, index) => (
              <div key={message.id} className="space-y-2">
                <div className={cn('flex items-start gap-3', message.role === 'user' ? 'justify-end' : '')}>
                    {message.role === 'assistant' && <div className="p-2 rounded-full bg-primary/20 shrink-0"><Bot className="h-5 w-5 text-primary" /></div>}
                    <div className={cn('rounded-lg px-4 py-2 max-w-[85%]', message.role === 'user' ? 'bg-primary/80 text-primary-foreground' : 'bg-white/10')}>
                        <MessageContent
                          content={message.content}
                          isLastMessage={index === messages.length - 1}
                          isAssistant={message.role === 'assistant'}
                          isTyping={isTyping}
                          onTypingComplete={() => setIsTyping(false)}
                        />
                    </div>
                    {message.role === 'user' && <div className="p-2 rounded-full bg-white/10 shrink-0"><User className="h-5 w-5 text-muted-foreground" /></div>}
                </div>
                {message.changes && !message.changesApplied && !isTyping && (
                  <div className="ml-10 bg-white/10 border-white/20 border-dashed rounded-lg p-3 space-y-3">
                    <h4 className="font-semibold text-sm flex items-center gap-2"><FileDiff className="h-4 w-4" /> Proposed Changes</h4>
                    <ul className="text-xs space-y-1 list-disc list-inside">
                        {message.changes.fileChanges?.map(c => <li key={c.path}><FilePlus2 className="inline h-3 w-3 mr-1" /> Modified/Created: <span className="font-mono bg-background/50 p-0.5 rounded-sm">{c.path}</span></li>)}
                        {message.changes.filesToDelete?.map(f => <li key={f}><Trash2 className="inline h-3 w-3 mr-1" /> Deleted: <span className="font-mono bg-background/50 p-0.5 rounded-sm">{f}</span></li>)}
                    </ul>
                    <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleApplyChanges(message.id)}><Check className="mr-2 h-4 w-4"/> Apply Changes</Button>
                        <Button size="sm" variant="outline" className="bg-transparent hover:bg-white/10" onClick={() => handleDiscardChanges(message.id)}><X className="mr-2 h-4 w-4"/> Discard</Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-primary/20 shrink-0"><Bot className="h-5 w-5 text-primary" /></div>
                <div className="rounded-lg px-4 py-3 max-w-[85%] bg-white/10 flex items-center">
                  <div className="flex space-x-1.5">
                    <span className="h-2 w-2 bg-muted-foreground rounded-full animate-pulse" style={{ animationDelay: '0s' }}></span>
                    <span className="h-2 w-2 bg-muted-foreground rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></span>
                    <span className="h-2 w-2 bg-muted-foreground rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        <div className="p-4 border-t border-white/10 bg-transparent">
            {imageDataUri && (
                <div className="mb-2 flex items-center gap-2 bg-white/10 p-2 rounded-md">
                    <img src={imageDataUri} alt="Attached preview" className="h-12 w-12 object-cover rounded-md" />
                    <p className="text-sm text-muted-foreground flex-1">Image attached. Ask the AI about it!</p>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setImageDataUri(null)}><X className="h-4 w-4" /></Button>
                </div>
            )}
             <div className="bg-white/10 border border-white/20 rounded-lg">
                <div className="relative">
                    <Textarea
                        placeholder="Ask me to add a feature, fix a bug..."
                        value={isListening ? recognizedText : inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                            }
                        }}
                        rows={1}
                        className="w-full bg-transparent border-none p-3 pr-4 pb-12 focus-visible:ring-0 focus-visible:ring-offset-0 resize-none min-h-[56px]"
                        disabled={isLoading || isTyping}
                    />
                     <div className="absolute bottom-3 left-3">
                        <DropdownMenu onOpenChange={(open) => { if (open) refreshSuggestions(); }}>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="bg-transparent hover:bg-white/20 hover:text-white" disabled={isLoading || isTyping}>
                                    <Lightbulb className="mr-2 h-4 w-4 text-primary" />
                                    Suggestions
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" side="top" className="bg-zinc-900 text-white border border-zinc-800">
                                {currentSuggestions.map((s, i) => (
                                    <DropdownMenuItem key={i} onClick={() => handleSendMessage(s)} className="hover:bg-zinc-800 hover:!text-white focus:bg-zinc-800 focus:!text-white">
                                        {s}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    <div className="absolute bottom-3 right-3 flex items-center gap-1">
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                        <Button size="icon" variant="ghost" onClick={() => fileInputRef.current?.click()} title="Attach Image" disabled={isLoading || isTyping} className="hover:bg-zinc-800 hover:text-white">
                            <Paperclip className="h-4 w-4" />
                        </Button>
                        {hasRecognitionSupport && (
                        <Button size="icon" variant={isListening ? "destructive" : "ghost"} onClick={isListening ? stopListening : startListening} title={isListening ? "Stop listening" : "Start voice input"} disabled={isLoading || isTyping} className="hover:bg-zinc-800 hover:text-white">
                            {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                        </Button>
                        )}
                        <Button onClick={() => handleSendMessage()} disabled={isLoading || isTyping} size="icon" title="Send" variant="ghost" className="hover:bg-zinc-800 hover:text-white">
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
