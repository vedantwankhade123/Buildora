
"use client";

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Wand2, Clipboard, ClipboardCheck, Loader2, Mic, MicOff, Code, Eye, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { enhanceCodeSnippet } from '@/ai/flows/enhance-code-snippets';
import useSpeechRecognition from '@/hooks/use-speech-recognition';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import CodeMirror from '@uiw/react-codemirror';
import { html } from '@codemirror/lang-html';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import { Badge } from '@/components/ui/badge';
import { useApiKey } from '@/hooks/use-api-key';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { EditorView } from '@codemirror/view';


export interface Snippet {
  id: string;
  title: string;
  code: string;
  description: string;
  category: string;
  icon?: React.ReactNode;
}

interface SnippetCardProps {
  snippet: Snippet;
}

export function SnippetCard({ snippet }: SnippetCardProps) {
  const [enhancementPrompt, setEnhancementPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [code, setCode] = useState(snippet.code);
  const [copied, setCopied] = useState(false);
  const [previewCode, setPreviewCode] = useState('');
  const { toast } = useToast();
  const { apiKey } = useApiKey();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'preview' | 'code'>('preview');

  const {
    text: recognizedText,
    isListening,
    startListening,
    stopListening,
    hasRecognitionSupport,
    error: recognitionError,
  } = useSpeechRecognition();
  
  const prevIsListeningRef = useRef(isListening);

  const createPreviewHtml = (bodyContent: string) => `
    <html class="dark">
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>body { margin: 0; background-color: transparent; }</style>
      </head>
      <body>
        ${bodyContent}
        <script>
          // Prevent all link navigation within the preview
          document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href]');
            if (link) {
              e.preventDefault();
              e.stopPropagation();
              const href = link.getAttribute('href');
              if (href) {
                // Show a message that links are disabled in preview
                console.log('Link clicked:', href, '- Links are disabled in preview mode');
                // Optionally show a visual indicator
                const originalText = link.textContent;
                link.textContent = 'Link (disabled in preview)';
                link.style.color = '#999';
                link.style.textDecoration = 'line-through';
                setTimeout(() => {
                  link.textContent = originalText;
                  link.style.color = '';
                  link.style.textDecoration = '';
                }, 2000);
              }
            }
          }, true);

          // Prevent form submissions
          document.addEventListener('submit', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Form submission prevented in preview mode');
          }, true);

          // Prevent window.open calls from user code
          const originalWindowOpen = window.open;
          window.open = function(url, target, features) {
            console.log('window.open prevented in preview mode:', url);
            return null;
          };
        </script>
      </body>
    </html>
  `;
  
  useEffect(() => {
    setPreviewCode(createPreviewHtml(code));
  }, []);

  useEffect(() => {
    setPreviewCode(createPreviewHtml(code));
  }, [code]);

  useEffect(() => {
    if (prevIsListeningRef.current && !isListening && recognizedText) {
      setEnhancementPrompt(recognizedText);
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

  const handleEnhanceClick = async () => {
    if (!enhancementPrompt.trim()) {
      toast({ variant: 'destructive', title: 'Prompt is empty', description: 'Please enter what you want to change.' });
      return;
    }
    setIsLoading(true);
    try {
        const result = await enhanceCodeSnippet({ description: snippet.description, codeSnippet: code, enhancementPrompt, apiKey: apiKey || undefined });
        setCode(result.enhancedCodeSnippet);
        toast({ title: 'Snippet Enhanced!', description: 'Your component has been updated.' });
        setEnhancementPrompt('');
    } catch(e) {
        let description = 'Failed to enhance snippet. Please try again.';
        if (e instanceof Error && (e.message.includes('503') || e.message.includes('overloaded') || e.message.toLowerCase().includes('rate limit'))) {
          description = 'The AI model is currently overloaded or has reached its rate limit. Please try again in a moment. If the problem persists, you can add your own API key in the Settings page.';
        }
        toast({ variant: 'destructive', title: 'Error', description });
    }
    setIsLoading(false);
  };
  
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast({ title: "Code copied to clipboard!" });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <Card className="flex flex-col bg-zinc-900 border border-zinc-800 text-white hover:shadow-2xl transition-shadow duration-300 rounded-2xl">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl font-bold text-white">{snippet.title}</CardTitle>
            <Badge variant="outline" className="border-zinc-700 bg-zinc-800 text-white">{snippet.category}</Badge>
          </div>
          <CardDescription className="text-zinc-300">{snippet.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 flex-1 flex flex-col">
          <div className="relative group flex-1 flex flex-col">
            <Tabs defaultValue="preview" className="flex-1 flex flex-col min-h-0">
              <TabsList className="grid w-full grid-cols-2 bg-zinc-800 rounded-full p-1 text-lg font-semibold">
                <TabsTrigger value="preview" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all duration-200"> <Eye className="mr-2 h-5 w-5"/>Preview</TabsTrigger>
                <TabsTrigger value="code" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all duration-200"> <Code className="mr-2 h-5 w-5"/>Code</TabsTrigger>
              </TabsList>
              <TabsContent value="preview" className="flex-1 mt-2 rounded-md border border-zinc-800 bg-zinc-800 overflow-hidden relative">
                <iframe
                  srcDoc={previewCode}
                  title="Preview"
                  sandbox="allow-scripts allow-same-origin"
                  className="w-full h-full border-0"
                  style={{height: '250px'}}
                />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/40 z-10">
                  <Button className="bg-primary text-primary-foreground font-semibold rounded-full px-6 py-3 text-lg shadow-lg" onClick={() => setModalOpen(true)}>
                    View Snippet
                  </Button>
                </div>
              </TabsContent>
              <TabsContent value="code" className="flex-1 mt-2 min-h-0 bg-zinc-800 rounded-md border border-zinc-800">
                <div className="relative h-[250px]">
                  <Button size="icon" variant="ghost" className="absolute top-2 right-2 z-10 text-white hover:bg-gray-700 hover:text-white h-7 w-7" onClick={handleCopy}>
                    {copied ? <ClipboardCheck className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
                  </Button>
                  <CodeMirror 
                    value={code}
                    height="250px"
                    theme={vscodeDark}
                    extensions={[html({ matchClosingTags: true, autoCloseTags: true }), EditorView.lineWrapping]}
                    editable={false}
                    className="h-full w-full font-code text-sm rounded-md overflow-auto border-0"
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-3xl w-[95vw] h-[95vh] sm:h-[80vh] bg-zinc-900 border border-zinc-800 rounded-2xl p-0 overflow-hidden">
          <div className="flex flex-col h-full">
            <div className="flex justify-between items-center px-4 sm:px-6 py-4 border-b border-zinc-800 bg-zinc-900">
              <DialogTitle className="text-lg sm:text-xl font-bold text-white">{snippet.title}</DialogTitle>
              <Button size="icon" variant="ghost" className="text-white hover:bg-zinc-800" onClick={() => setModalOpen(false)}>
                <span className="sr-only">Close</span>
                <X className="h-5 w-5 sm:h-6 sm:w-6" />
              </Button>
            </div>
            <div className="flex-1 flex flex-col p-4 sm:p-6">
              <Tabs value={modalTab} onValueChange={v => setModalTab(v as 'preview' | 'code')} className="flex-1 flex flex-col min-h-0">
                <TabsList className="sticky top-0 z-20 grid w-full grid-cols-2 bg-zinc-800 rounded-full p-1 text-base sm:text-xl font-bold mb-4 shadow-lg">
                  <TabsTrigger value="preview" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all duration-200 text-xs sm:text-base"> <Eye className="mr-1 sm:mr-2 h-3 w-3 sm:h-5 sm:w-5"/>Preview</TabsTrigger>
                  <TabsTrigger value="code" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all duration-200 text-xs sm:text-base"> <Code className="mr-1 sm:mr-2 h-3 w-3 sm:h-5 sm:w-5"/>Code</TabsTrigger>
                </TabsList>
                <TabsContent value="preview" className="flex-1 rounded-md border border-zinc-800 bg-zinc-800 overflow-hidden">
                  <iframe
                    srcDoc={previewCode}
                    title="Preview"
                    sandbox="allow-scripts allow-same-origin"
                    className="w-full h-full border-0"
                    style={{height: '50vh'}}
                  />
                </TabsContent>
                <TabsContent value="code" className="flex-1 min-h-0 bg-zinc-800 rounded-md border border-zinc-800">
                  <div className="relative h-[50vh]">
                    <Button size="icon" variant="ghost" className="absolute top-2 right-2 z-10 text-white hover:bg-gray-700 hover:text-white h-7 w-7" onClick={handleCopy}>
                      {copied ? <ClipboardCheck className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
                    </Button>
                    <CodeMirror 
                      value={code}
                      height="50vh"
                      theme={vscodeDark}
                      extensions={[html({ matchClosingTags: true, autoCloseTags: true }), EditorView.lineWrapping]}
                      editable={false}
                      className="h-full w-full font-code text-sm rounded-md overflow-auto border-0"
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
