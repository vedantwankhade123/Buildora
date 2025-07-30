
'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Monitor, Tablet, Smartphone, Code, Eye, Clipboard, ClipboardCheck } from 'lucide-react';
import CodeMirror from '@uiw/react-codemirror';
import { html } from '@codemirror/lang-html';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';

import type { Snippet } from '@/components/snippet-card';

import { cn } from '@/lib/utils';

interface ComponentPreviewDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  snippet: Snippet | null;
}

const createPreviewHtml = (bodyContent: string) => `
  <html class="dark">
    <head>
      <script src="https://cdn.tailwindcss.com"></script>
      <style>
        body { margin: 0; background-color: #fff; }
        .dark body { background-color: #020817; }
      </style>
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

export function ComponentPreviewDialog({ isOpen, onOpenChange, snippet }: ComponentPreviewDialogProps) {
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setCopied(false);
    }
  }, [isOpen]);

  if (!snippet) {
    return null;
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(snippet.code);
    setCopied(true);
    toast({ title: 'Code copied to clipboard!' });
    setTimeout(() => setCopied(false), 2000);
  };

  const deviceWidths = {
    desktop: '100%',
    tablet: '768px',
    mobile: '375px',
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-[95vw] h-[95vh] sm:h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-4 sm:p-6 pb-0">
          <DialogTitle className="text-lg sm:text-2xl">{snippet.title}</DialogTitle>
          <DialogDescription className="text-sm sm:text-base">{snippet.description}</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="preview" className="flex-1 flex flex-col min-h-0 p-4 sm:p-6 pt-2">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="preview" className="text-xs sm:text-sm"><Eye className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />Preview</TabsTrigger>
              <TabsTrigger value="code" className="text-xs sm:text-sm"><Code className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />Code</TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-1 sm:gap-2" data-html2canvas-ignore>
                <Button onClick={() => setDevice('desktop')} variant={device === 'desktop' ? 'secondary' : 'ghost'} size="icon" title="Desktop View" className="h-8 w-8 sm:h-10 sm:w-10">
                    <Monitor className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
                <Button onClick={() => setDevice('tablet')} variant={device === 'tablet' ? 'secondary' : 'ghost'} size="icon" title="Tablet View" className="h-8 w-8 sm:h-10 sm:w-10">
                    <Tablet className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
                <Button onClick={() => setDevice('mobile')} variant={device === 'mobile' ? 'secondary' : 'ghost'} size="icon" title="Mobile View" className="h-8 w-8 sm:h-10 sm:w-10">
                    <Smartphone className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
            </div>
          </div>
          <TabsContent value="preview" className="flex-1 mt-0 rounded-md border bg-muted/20">
             <div className="w-full h-full flex justify-center items-center p-0 md:p-4 transition-all">
                <iframe
                    srcDoc={createPreviewHtml(snippet.code)}
                    title="Preview"
                    sandbox="allow-scripts allow-same-origin"
                    className="border shadow-lg mx-auto transition-all h-full bg-white dark:bg-gray-900"
                    style={{ width: deviceWidths[device] }}
                />
            </div>
          </TabsContent>
          <TabsContent value="code" className="flex-1 mt-0 relative rounded-md overflow-hidden border">
             <Button size="icon" variant="ghost" className="absolute top-2 right-2 z-10 text-white hover:bg-gray-700 hover:text-white h-8 w-8" onClick={handleCopy} title="Copy Code">
                {copied ? <ClipboardCheck className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
             </Button>
            <CodeMirror 
              value={snippet.code}
              height="100%"
              theme={vscodeDark}
              extensions={[html({ matchClosingTags: true, autoCloseTags: true })]}
              editable={false}
              className="h-full w-full font-code text-sm"
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
