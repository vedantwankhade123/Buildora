"use client";

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Download, 
  Eye, 
  Code, 
  Clipboard, 
  ClipboardCheck, 
  Expand, 
  Shrink, 
  Monitor, 
  Tablet, 
  Smartphone, 
  MoreVertical, 
  Loader2, 
  ExternalLink,
  FolderOpen
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from '@/components/ui/separator';
import JSZip from 'jszip';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import CodeMirror from '@uiw/react-codemirror';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { javascript } from '@codemirror/lang-javascript';
import { json } from '@codemirror/lang-json';
import { markdown } from '@codemirror/lang-markdown';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import { EditorView } from "@codemirror/view";
import type { ProjectFile } from './file-explorer';

interface MultiFileEditorProps {
  files: ProjectFile[];
  selectedFile: string | null;
  onFileContentChange: (fileName: string, content: string) => void;
  isTyping?: boolean;
  viewMode: 'preview' | 'code';
  setViewMode: (mode: 'preview' | 'code') => void;
  onNewPrompt: () => void;
  fileExplorerOpen?: boolean;
  onToggleFileExplorer?: () => void;
}

export function MultiFileEditor({
  files,
  selectedFile,
  onFileContentChange,
  isTyping,
  viewMode,
  setViewMode,
  onNewPrompt,
  fileExplorerOpen,
  onToggleFileExplorer
}: MultiFileEditorProps) {
  const [previewCode, setPreviewCode] = useState('');
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isExpanded, setIsExpanded] = useState(false);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const codeEditorRef = useRef<HTMLDivElement>(null);
  const codeMirrorRef = useRef<any>(null);

  // Handle escape key to exit fullscreen
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isExpanded) {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll when in fullscreen
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [isExpanded]);

  const getLanguageExtension = (fileType: string) => {
    switch (fileType) {
      case 'html':
        return html({ matchClosingTags: true, autoCloseTags: true });
      case 'css':
        return css();
      case 'javascript':
        return javascript();
      case 'json':
        return json();
      case 'md':
        return markdown();
      default:
        return html();
    }
  };

  const getSelectedFile = () => {
    return files.find(file => file.name === selectedFile) || files[0];
  };

  const currentFile = getSelectedFile();

  // Enhanced auto-scroll to follow typing cursor
  React.useEffect(() => {
    if (isTyping && codeEditorRef.current) {
      let scrollInterval: NodeJS.Timeout;
      
      const scrollToBottom = () => {
        // Simple and reliable scroll to bottom
        const editorElement = codeEditorRef.current?.querySelector('.cm-editor');
        const scrollerElement = codeEditorRef.current?.querySelector('.cm-scroller');
        
        if (editorElement) {
          editorElement.scrollTop = editorElement.scrollHeight;
        }
        
        if (scrollerElement) {
          scrollerElement.scrollTop = scrollerElement.scrollHeight;
        }
        
        // Try CodeMirror's scrollIntoView as backup
        if (codeMirrorRef.current?.view) {
          try {
            const view = codeMirrorRef.current.view;
            const docLength = view.state.doc.length;
            if (docLength > 0) {
              view.dispatch({
                effects: EditorView.scrollIntoView(docLength, { 
                  y: "end",
                  yMargin: 50
                })
              });
            }
          } catch (error) {
            // Fallback to DOM scrolling if CodeMirror fails
            console.warn('CodeMirror scroll failed, using DOM fallback');
          }
        }
      };
      
      // Initial scroll
      scrollToBottom();
      
      // Set up continuous scrolling
      scrollInterval = setInterval(() => {
        scrollToBottom();
      }, 200); // Fixed interval for reliability
      
      return () => {
        clearInterval(scrollInterval);
      };
    }
  }, [currentFile?.content, isTyping]);

  const createPreviewHtml = () => {
    const htmlFile = files.find(file => file.name.includes('index.html') || file.name.includes('.html'));
    const cssFile = files.find(file => file.name.includes('.css'));
    const jsFile = files.find(file => file.name.includes('.js'));

    if (!htmlFile) {
      return `
        <html>
          <head>
            <title>No HTML file found</title>
            <script src="https://cdn.tailwindcss.com"></script>
          </head>
          <body>
            <div class="flex items-center justify-center h-screen">
              <h1 class="text-2xl">No HTML file found in the project</h1>
            </div>
          </body>
        </html>
      `;
    }

    let htmlContent = htmlFile.content;
    
    // If there's a separate CSS file, inject it
    if (cssFile) {
      const cssInjection = `<style>${cssFile.content}</style>`;
      htmlContent = htmlContent.replace('</head>', `${cssInjection}\n</head>`);
    }
    
    // If there's a separate JS file, inject it
    if (jsFile) {
      const jsInjection = `<script>${jsFile.content}</script>`;
      htmlContent = htmlContent.replace('</body>', `${jsInjection}\n</body>`);
    }

    // Add safety script to prevent navigation and form submissions
    const safetyScript = `
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
    `;
    
    htmlContent = htmlContent.replace('</body>', `${safetyScript}\n</body>`);

    return htmlContent;
  };

  React.useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    debounceTimeoutRef.current = setTimeout(() => {
      setPreviewCode(createPreviewHtml());
    }, 300);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [files]);

  const handleDownload = async () => {
    const zip = new JSZip();
    
    files.forEach(file => {
      zip.file(file.name, file.content);
    });
    
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'generated-project.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    const currentFile = getSelectedFile();
    if (currentFile) {
      navigator.clipboard.writeText(currentFile.content);
      setCopied(true);
      toast({ title: "Code copied to clipboard!" });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const deviceWidths = {
    desktop: '100%',
    tablet: '768px',
    mobile: '375px',
  };

  return (
    <div
      className={cn(
        "h-full flex flex-col rounded-lg overflow-hidden bg-gradient-to-br from-gray-900/50 to-gray-800/50 backdrop-blur-sm transition-all border border-gray-700/50 shadow-xl",
        isExpanded ? "fixed inset-0 z-[9999] border-0 rounded-none bg-black" : "relative w-full"
      )}
    >
      <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'preview' | 'code')} className="h-full flex flex-col">
        <div className="flex items-center justify-between p-2 border-b border-gray-700/50 bg-gradient-to-r from-gray-800/50 to-gray-700/50 gap-2">
          <div className="flex items-center gap-2">
            <TabsList className="bg-gray-800/50 border border-gray-600/50">
              <TabsTrigger value="preview" className="data-[state=active]:bg-blue-600/20 data-[state=active]:text-blue-300 data-[state=active]:border-blue-500/30"><Eye className="mr-2 h-4 w-4" />Preview</TabsTrigger>
              <TabsTrigger value="code" className="data-[state=active]:bg-blue-600/20 data-[state=active]:text-blue-300 data-[state=active]:border-blue-500/30"><Code className="mr-2 h-4 w-4" />Code</TabsTrigger>
            </TabsList>
          </div>
          
          <div className="hidden xl:flex items-center gap-2" data-html2canvas-ignore>
            <Button onClick={() => setDevice('desktop')} variant={device === 'desktop' ? 'secondary' : 'outline'} size="icon" title="Desktop View" className="bg-gradient-to-r from-blue-600/20 to-blue-500/20 hover:from-blue-600/30 hover:to-blue-500/30 border-blue-500/30 hover:border-blue-500/50 text-blue-300 hover:text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl">
              <Monitor className="h-5 w-5" />
            </Button>
            <Button onClick={() => setDevice('tablet')} variant={device === 'tablet' ? 'secondary' : 'outline'} size="icon" title="Tablet View" className="bg-gradient-to-r from-blue-600/20 to-blue-500/20 hover:from-blue-600/30 hover:to-blue-500/30 border-blue-500/30 hover:border-blue-500/50 text-blue-300 hover:text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl">
              <Tablet className="h-5 w-5" />
            </Button>
            <Button onClick={() => setDevice('mobile')} variant={device === 'mobile' ? 'secondary' : 'outline'} size="icon" title="Mobile View" className="bg-gradient-to-r from-blue-600/20 to-blue-500/20 hover:from-blue-600/30 hover:to-blue-500/30 border-blue-500/30 hover:border-blue-500/50 text-blue-300 hover:text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl">
              <Smartphone className="h-5 w-5" />
            </Button>

            <Separator orientation="vertical" className="h-6" />

            <Button onClick={handleDownload} variant="outline" size="sm" disabled={isTyping} className="bg-gradient-to-r from-emerald-600/20 to-emerald-500/20 hover:from-emerald-600/30 hover:to-emerald-500/30 border-emerald-500/30 hover:border-emerald-500/50 text-emerald-300 hover:text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl font-semibold">
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
            <Button onClick={() => setIsExpanded(!isExpanded)} variant="outline" size="sm" className="bg-gradient-to-r from-purple-600/20 to-purple-500/20 hover:from-purple-600/30 hover:to-purple-500/30 border-purple-500/30 hover:border-purple-500/50 text-purple-300 hover:text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl font-semibold">
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
                {onToggleFileExplorer && (
                  <DropdownMenuItem onClick={onToggleFileExplorer} className="text-sm sm:text-base px-3 py-2">
                    <FolderOpen className="mr-2 h-4 w-4" /> {fileExplorerOpen ? 'Hide' : 'Show'} Files
                  </DropdownMenuItem>
                )}
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
        
        <div className="flex-1 min-h-0 overflow-hidden">
          <TabsContent value="preview" className="h-full mt-0 data-[state=inactive]:hidden relative results-scrollbar overflow-hidden">
            <div className="w-full h-full flex justify-center p-0 md:p-2 transition-all">
              <iframe
                srcDoc={previewCode}
                title="Preview"
                sandbox="allow-scripts allow-same-origin"
                className="border-0 bg-white shadow-lg mx-auto transition-all h-full"
                style={{ width: deviceWidths[device] }}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="code" className="h-full mt-0 relative data-[state=inactive]:hidden flex flex-col code-editor-scrollbar overflow-hidden">
            {currentFile ? (
              <>
                <div className="flex items-center justify-between p-2 border-b bg-card">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{currentFile.name}</span>
                    <span className="text-xs text-muted-foreground px-2 py-1 bg-muted rounded">
                      {currentFile.type.toUpperCase()}
                    </span>
                    {isTyping && (
                      <div className="flex items-center gap-2 ml-2">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-gradient-to-r from-green-400 to-blue-500 rounded-full animate-pulse shadow-lg"></div>
                          <span className="text-xs bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent font-semibold animate-pulse">Writing Your Code</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-1 h-4 bg-gradient-to-b from-blue-400 to-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms', animationDuration: '1s' }}></div>
                          <div className="w-1 h-4 bg-gradient-to-b from-purple-400 to-pink-500 rounded-full animate-bounce" style={{ animationDelay: '200ms', animationDuration: '1s' }}></div>
                          <div className="w-1 h-4 bg-gradient-to-b from-pink-400 to-blue-500 rounded-full animate-bounce" style={{ animationDelay: '400ms', animationDuration: '1s' }}></div>
                        </div>
                      </div>
                    )}
                  </div>
                  <Button size="icon" variant="ghost" className="text-white hover:bg-gray-700 hover:text-white h-7 w-7" onClick={handleCopy} title="Copy Code">
                    {copied ? <ClipboardCheck className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
                  </Button>
                </div>
                <div className="flex-1 min-h-0 relative" ref={codeEditorRef}>
                  <CodeMirror 
                    ref={codeMirrorRef}
                    value={currentFile.content}
                    height="100%"
                    theme={vscodeDark}
                    extensions={[getLanguageExtension(currentFile.type), EditorView.lineWrapping]}
                    onChange={(value) => onFileContentChange(currentFile.name, value)}
                    editable={!isTyping}
                    className={cn(
                      "h-full w-full font-code text-sm rounded-none border-0 transition-all duration-300",
                      isTyping && "typing-active"
                    )}
                    basicSetup={{
                      lineNumbers: true,
                      foldGutter: true,
                      autocompletion: true,
                    }}
                  />
                  {isTyping && (
                    <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none">
                      <div className="w-full h-full bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full animate-ping"></div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <p>No file selected</p>
              </div>
            )}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
} 