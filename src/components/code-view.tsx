
"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Download, Eye, Code, Clipboard, ClipboardCheck, Expand, Shrink, Monitor, Tablet, Smartphone, MoreVertical, Loader2, ArrowLeft, ExternalLink } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import JSZip from 'jszip';
import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import CodeMirror from '@uiw/react-codemirror';
import { html } from '@codemirror/lang-html';
import { javascript } from '@codemirror/lang-javascript';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import { EditorView } from "@codemirror/view"

export function CodeView({
  code,
  javascriptCode,
  onCodeChange,
  onJavascriptCodeChange,
  isTyping,
  viewMode,
  setViewMode,
  onNewPrompt,
}: {
  code: string;
  javascriptCode: string;
  onCodeChange: (code: string) => void;
  onJavascriptCodeChange: (code: string) => void;
  isTyping?: boolean;
  viewMode: 'preview' | 'code';
  setViewMode: (mode: 'preview' | 'code') => void;
  onNewPrompt: () => void;
}) {
  const [previewCode, setPreviewCode] = useState('');
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isExpanded, setIsExpanded] = useState(false);
  const [codeType, setCodeType] = useState<'html' | 'javascript'>('html');
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const prevIsTypingRef = useRef(isTyping);
  const [cmView, setCmView] = useState<EditorView>();


  const createStandardHtml = (bodyContent: string, jsContent: string) => `
    <html>
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>body { margin: 0; }</style>
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
        ${jsContent ? `<script>${jsContent}</script>` : ''}
      </body>
    </html>
  `;

  const createAnimatedHtml = (bodyContent: string, jsContent: string) => `
    <html>
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          body { margin: 0; }
          body > * {
            opacity: 0;
          }
        </style>
      </head>
      <body>
        ${bodyContent}
        <script>
          document.addEventListener('DOMContentLoaded', () => {
            const elements = document.querySelectorAll('body > *');
            let delay = 0.1;
            elements.forEach(el => {
              if (el.tagName && el.tagName.toLowerCase() !== 'script' && el.tagName.toLowerCase() !== 'style') {
                el.style.animation = \`fadeInUp 0.6s ease-out \${delay}s forwards\`;
                delay += 0.15;
              }
            });
          });
          
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
        ${jsContent ? `<script>${jsContent}</script>` : ''}
      </body>
    </html>
  `;

  const createLoadingHtml = () => `
    <html>
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body class="bg-gray-50 flex items-center justify-center h-screen text-gray-500 font-sans">
        <div class="text-center flex flex-col items-center gap-4 p-4">
          <svg class="animate-spin h-10 w-10 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <div>
            <h3 class="text-xl font-semibold text-gray-700">Building your design...</h3>
            <p class="text-gray-500">The live preview will appear here shortly.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  useEffect(() => {
    if (isTyping) {
      if (!prevIsTypingRef.current) {
        setPreviewCode(createLoadingHtml());
      }
    } else {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      
      debounceTimeoutRef.current = setTimeout(() => {
        const justFinishedTyping = prevIsTypingRef.current && !isTyping;
        if (justFinishedTyping) {
          setPreviewCode(createAnimatedHtml(code, javascriptCode));
        } else {
          setPreviewCode(createStandardHtml(code, javascriptCode));
        }
      }, 300);
    }

    prevIsTypingRef.current = isTyping;

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [code, javascriptCode, isTyping]);


  useEffect(() => {
    if (isTyping && cmView) {
      cmView.dispatch({
        effects: EditorView.scrollIntoView(cmView.state.doc.length, { y: "end" })
      })
    }
  }, [code, isTyping, cmView]);


  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isExpanded) {
        setIsExpanded(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isExpanded]);


  const handleDownload = async () => {
    const zip = new JSZip();
    
    // Create the complete HTML file with embedded JavaScript
    const completeHtml = createStandardHtml(code, javascriptCode);
    zip.file("index.html", completeHtml);
    
    // Also save JavaScript separately if it exists
    if (javascriptCode.trim()) {
      zip.file("script.js", javascriptCode);
    }
    
    const blob = await zip.generateAsync({ type: "blob" });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'promptcode-design.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    const completeCode = javascriptCode.trim() 
      ? `<!-- HTML -->\n${code}\n\n<!-- JavaScript -->\n<script>\n${javascriptCode}\n</script>`
      : code;
    navigator.clipboard.writeText(completeCode);
    setCopied(true);
    toast({ title: "Code copied to clipboard!" });
    setTimeout(() => setCopied(false), 2000);
  };

  const deviceWidths = {
    desktop: '100%',
    tablet: '768px',
    mobile: '375px',
  };

  return (
     <div
      className={cn(
        "h-full flex flex-col rounded-lg overflow-hidden bg-card transition-all border",
        isExpanded ? "fixed inset-0 z-50 border-0 rounded-none" : "relative"
      )}
    >
      <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'preview' | 'code')} className="h-full flex flex-col">
        <div className="flex items-center justify-between p-2 border-b bg-card gap-2">
            <div className="flex items-center gap-2">
                <TabsList>
                    <TabsTrigger value="preview"><Eye className="mr-2 h-4 w-4" />Preview</TabsTrigger>
                    <TabsTrigger value="code"><Code className="mr-2 h-4 w-4" />Code</TabsTrigger>
                </TabsList>
            </div>
          
            <div className="hidden xl:flex items-center gap-2" data-html2canvas-ignore>
                <Button onClick={() => setDevice('desktop')} variant={device === 'desktop' ? 'secondary' : 'outline'} size="icon" title="Desktop View" className="hover:bg-blue-600 hover:text-white focus:bg-blue-600 focus:text-white rounded-xl">
                    <Monitor className="h-5 w-5" />
                </Button>
                <Button onClick={() => setDevice('tablet')} variant={device === 'tablet' ? 'secondary' : 'outline'} size="icon" title="Tablet View" className="hover:bg-blue-600 hover:text-white focus:bg-blue-600 focus:text-white rounded-xl">
                    <Tablet className="h-5 w-5" />
                </Button>
                <Button onClick={() => setDevice('mobile')} variant={device === 'mobile' ? 'secondary' : 'outline'} size="icon" title="Mobile View" className="hover:bg-blue-600 hover:text-white focus:bg-blue-600 focus:text-white rounded-xl">
                    <Smartphone className="h-5 w-5" />
                </Button>

                <Separator orientation="vertical" className="h-6" />

                <Button onClick={handleDownload} variant="outline" size="sm" disabled={isTyping} className="hover:bg-blue-600 hover:text-white focus:bg-blue-600 focus:text-white rounded-xl">
                    <Download className="mr-2 h-4 w-4" />
                    Download
                </Button>
                <Button onClick={() => setIsExpanded(!isExpanded)} variant="outline" size="sm" className="hover:bg-blue-600 hover:text-white focus:bg-blue-600 focus:text-white rounded-xl">
                    {isExpanded ? <Shrink className="mr-2 h-4 w-4" /> : <Expand className="mr-2 h-4 w-4" />}
                    {isExpanded ? 'Exit' : 'Fullscreen'}
                </Button>
                <Button
                  onClick={() => {
                    const newWindow = window.open();
                    if (newWindow) {
                      newWindow.document.write(previewCode);
                      newWindow.document.close();
                    }
                  }}
                  variant="outline"
                  size="icon"
                  title="Open Preview in New Tab"
                  className="hover:bg-blue-600 hover:text-white focus:bg-blue-600 focus:text-white rounded-xl"
                  disabled={!previewCode}
                >
                  <ExternalLink className="h-5 w-5" />
                  <span className="sr-only">Open Preview in New Tab</span>
                </Button>
            </div>

            <div className="flex items-center gap-2 xl:hidden">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon">
                            <MoreVertical className="h-5 w-5" />
                            <span className="sr-only">More options</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[calc(100vw-2rem)] max-w-[20rem] min-w-[280px] z-50">
                        <DropdownMenuItem onClick={() => setDevice('desktop')} className="text-sm sm:text-base px-3 py-2">
                            <Monitor className="mr-2 h-4 w-4" /> Desktop View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setDevice('tablet')} className="text-sm sm:text-base px-3 py-2">
                            <Tablet className="mr-2 h-4 w-4" /> Tablet View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setDevice('mobile')} className="text-sm sm:text-base px-3 py-2">
                            <Smartphone className="mr-2 h-4 w-4" /> Mobile View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleDownload} disabled={isTyping} className="text-sm sm:text-base px-3 py-2">
                            <Download className="mr-2 h-4 w-4" /> Download
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setIsExpanded(!isExpanded)} className="text-sm sm:text-base px-3 py-2">
                            {isExpanded ? <Shrink className="mr-2 h-4 w-4" /> : <Expand className="mr-2 h-4 w-4" />}
                            {isExpanded ? 'Exit' : 'Fullscreen'}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            const newWindow = window.open();
                            if (newWindow) {
                              newWindow.document.write(previewCode);
                              newWindow.document.close();
                            }
                          }}
                          disabled={!previewCode}
                          className="text-sm sm:text-base px-3 py-2"
                        >
                          <ExternalLink className="mr-2 h-4 w-4" /> Open in New Tab
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
        <div className="flex-1 min-h-0">
          <TabsContent value="preview" className="h-full mt-0 data-[state=inactive]:hidden relative results-scrollbar">
             <div className="w-full h-full flex justify-center p-0 md:p-4 transition-all">
                <iframe
                    srcDoc={previewCode}
                    title="Preview"
                    sandbox="allow-scripts allow-same-origin"
                    className="border-0 bg-white shadow-lg mx-auto transition-all h-full"
                    style={{ width: deviceWidths[device] }}
                />
            </div>
          </TabsContent>
          <TabsContent value="code" className="h-full mt-0 relative data-[state=inactive]:hidden flex flex-col code-editor-scrollbar">
            <div className="flex items-center justify-between p-2 border-b bg-card">
              <Tabs value={codeType} onValueChange={(value) => setCodeType(value as 'html' | 'javascript')} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="html">HTML/CSS</TabsTrigger>
                  <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                </TabsList>
              </Tabs>
              <Button size="icon" variant="ghost" className="text-white hover:bg-gray-700 hover:text-white h-7 w-7" onClick={handleCopy} title="Copy Code">
                {copied ? <ClipboardCheck className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
              </Button>
            </div>
            <div className="flex-1 min-h-0">
              <TabsContent value="html" className="h-full mt-0 data-[state=inactive]:hidden">
                <CodeMirror 
                  value={code}
                  height="100%"
                  theme={vscodeDark}
                  extensions={[html({ matchClosingTags: true, autoCloseTags: true }), EditorView.lineWrapping]}
                  onChange={onCodeChange}
                  onCreateEditor={setCmView}
                  editable={!isTyping}
                  className="h-full w-full font-code text-sm rounded-none border-0"
                  basicSetup={{
                    lineNumbers: true,
                    foldGutter: true,
                    autocompletion: true,
                  }}
                />
              </TabsContent>
              <TabsContent value="javascript" className="h-full mt-0 data-[state=inactive]:hidden">
                <CodeMirror 
                  value={javascriptCode}
                  height="100%"
                  theme={vscodeDark}
                  extensions={[javascript(), EditorView.lineWrapping]}
                  onChange={onJavascriptCodeChange}
                  editable={!isTyping}
                  className="h-full w-full font-code text-sm rounded-none border-0"
                  basicSetup={{
                    lineNumbers: true,
                    foldGutter: true,
                    autocompletion: true,
                  }}
                />
              </TabsContent>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
