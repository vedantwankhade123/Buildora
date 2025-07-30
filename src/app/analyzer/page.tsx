
"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Script from 'next/script';
import CodeMirror from '@uiw/react-codemirror';
import { html as htmlLang } from '@codemirror/lang-html';
import { css as cssLang } from '@codemirror/lang-css';
import { javascript as jsLang } from '@codemirror/lang-javascript';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import { autocompletion } from '@codemirror/autocomplete';
import type { CompletionContext } from '@codemirror/autocomplete';
import { ArrowLeft, Play, FilePlus2, Terminal, X, Download, Clipboard, MoreHorizontal, Trash2, Folder, File, FolderPlus, FolderOpen, RefreshCw, Eye, Monitor, Tablet, Smartphone, Sparkles, Loader2 } from 'lucide-react';
import Link from 'next/link';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
  type ImperativePanelGroupHandle,
} from "@/components/ui/resizable";
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import JSZip from 'jszip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useApiKey } from '@/hooks/use-api-key';
import { Chatbot } from '@/components/chatbot';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useSupabaseUser } from '@/hooks/use-supabase-user';
import { useUser } from '@/hooks/use-user';
import { cn } from '@/lib/utils';


export interface CodeFile {
  path: string;
  content: string;
}

interface FileSystemTree {
  [key: string]: FileSystemTree | CodeFile;
}

const initialFiles: CodeFile[] = [
    {
        path: 'index.html',
        content: `<!DOCTYPE html>
<html>
  <head>
    <title>HTML, CSS, JS Playground</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="stylesheet" href="style.css" />
  </head>
  <body>
    <h1>Hello, World!</h1>
    <p>This is a simple playground. Try editing the files!</p>
    <button id="my-button">Click Me</button>
    <script type="module" src="bundle.js"></script>
  </body>
</html>`
    },
    {
        path: 'style.css',
        content: `body {
  font-family: sans-serif;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  margin: 0;
}

button {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  font-size: 1rem;
  cursor: pointer;
  border: 1px solid #ccc;
  border-radius: 4px;
}`
    },
    {
        path: 'script.js',
        content: `// You can import libraries from CDNs!
// For example, let's use canvas-confetti
import confetti from 'canvas-confetti';

const button = document.getElementById('my-button');

button.addEventListener('click', () => {
  alert('Button clicked!');
  
  // And now for the confetti!
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 }
  });
});

console.log('Script loaded!');
`
    }
];

const consoleLoggerScript = `
  const _console = { log: console.log, warn: console.warn, error: console.error, info: console.info };
  const postMessage = (level, args) => {
    const serializedArgs = args.map(arg => {
      try {
        if (arg instanceof Error) {
          return { message: arg.message, stack: arg.stack, __isError: true };
        }
        if (typeof arg === 'undefined') return 'undefined';
        if (typeof arg === 'function') return 'function ' + arg.name;
        return JSON.parse(JSON.stringify(arg, (key, value) => 
            typeof value === 'object' && value !== null && value.constructor.name.startsWith('HTML') ? '[DOM Element]' : value, 2));
      } catch (e) { return 'Unserializable object'; }
    };
    window.parent.postMessage({ source: 'iframe-console', level: level, payload: serializedArgs }, '*');
  };
  console.log = (...args) => { _console.log.apply(console, args); postMessage('log', args); };
  console.warn = (...args) => { _console.warn.apply(console, args); postMessage('warn', args); };
  console.error = (...args) => { _console.error.apply(console, args); postMessage('error', args); };
  console.info = (...args) => { _console.info.apply(console, args); postMessage('info', args); };
  window.addEventListener('error', (event) => { postMessage('error', [event.error?.stack || event.message]); });
`;

const getLanguageFromPath = (path: string): 'html' | 'css' | 'javascript' => {
  if (path.endsWith('.html')) return 'html';
  if (path.endsWith('.css')) return 'css';
  if (path.endsWith('.js') || path.endsWith('.jsx') || path.endsWith('.ts') || path.endsWith('.tsx')) return 'javascript';
  return 'javascript';
};

const buildFileTree = (files: CodeFile[]) => {
  const tree: FileSystemTree = {};
  const sortedFiles = [...files].sort((a, b) => a.path.localeCompare(b.path));

  sortedFiles.forEach(file => {
    const parts = file.path.split('/').filter(p => p);
    let currentLevel = tree;
    parts.forEach((part, index) => {
      if (index === parts.length - 1) { // It's a file
        currentLevel[part] = file;
      } else { // It's a directory
        if (!currentLevel[part]) {
          currentLevel[part] = {};
        }
        currentLevel = currentLevel[part] as FileSystemTree;
      }
    });
  });
  return tree;
};


// Main Playground Component
export default function PlaygroundPage() {
  const { user, isCheckingAuth } = useUser();
  const [showAuth, setShowAuth] = React.useState(false);
  const [files, setFiles] = useState<CodeFile[]>([]);
  const [activeFilePath, setActiveFilePath] = useState<string>('index.html');
  const [srcDoc, setSrcDoc] = useState('');
  const [logs, setLogs] = useState<{level: string, message: string, timestamp: string}[]>([]);
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState<{type: 'file' | 'folder', parentPath: string} | null>(null);
  const [newItemName, setNewItemName] = useState("");
  const newFileInputRef = useRef<HTMLInputElement>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [previewKey, setPreviewKey] = useState(0);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(false);
  const [dontShowWelcome, setDontShowWelcome] = useState(false);
  const [transpilerState, setTranspilerState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [babelScriptKey, setBabelScriptKey] = useState(Date.now());
  const [terminalInput, setTerminalInput] = useState('');
  const { apiKey } = useApiKey();
  const activeFile = useMemo(() => files.find(file => file.path === activeFilePath), [files, activeFilePath]);
  const fileTree = useMemo(() => buildFileTree(files), [files]);
  useEffect(() => {
    const theme = typeof window !== 'undefined' ? localStorage.getItem('theme') || 'dark' : 'dark';
    if (typeof window !== 'undefined') {
      document.documentElement.className = theme;
    }
    setFiles(initialFiles);
    setActiveFilePath('index.html');
    const hideWelcome = typeof window !== 'undefined' ? localStorage.getItem('playground_hide_welcome') : null;
    setIsWelcomeModalOpen(!hideWelcome);
  }, []);
  useEffect(() => {
    if (isCreating && newFileInputRef.current) {
      newFileInputRef.current.focus();
    }
  }, [isCreating]);
  const postLog = useCallback((level: string, message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { level, message, timestamp }]);
  }, []);
  const formatLogMessage = useCallback((payload: any[]) => {
    return payload.map(arg => {
      if (arg && typeof arg === 'object') {
        if (arg.__isError) return `${arg.message}\n${arg.stack}`;
        return JSON.stringify(arg, null, 2);
      }
      return String(arg);
    }).join(' ');
  }, []);
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.source === 'iframe-console') {
        const { level, payload } = event.data;
        postLog(level, formatLogMessage(payload));
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [postLog, formatLogMessage]);
  
  const scanForDependencies = useCallback((allFiles: CodeFile[]): string[] => {
      const dependencies = new Set<string>();
      const importRegex = /import(?:[\s\S]*?)from\s*['"]((?![\.\/])[\w@/-]+)['"]/g;
      const requireRegex = /require\s*\(\s*['"]((?![\.\/])[\w@/-]+)['"]\s*\)/g;
      const hardcodedReact = ['react', 'react-dom', 'react-dom/client'];

      allFiles.forEach(file => {
          if (getLanguageFromPath(file.path) === 'javascript') {
              let match;
              while ((match = importRegex.exec(file.content)) !== null) {
                  if (!hardcodedReact.includes(match[1])) {
                      dependencies.add(match[1]);
                  }
              }
              while ((match = requireRegex.exec(file.content)) !== null) {
                  if (!hardcodedReact.includes(match[1])) {
                      dependencies.add(match[1]);
                  }
              }
          }
      }, []);

      return Array.from(dependencies);
  }, []);

  const updatePreview = useCallback(async () => {
      setLogs([]);
      setPreviewKey(prevKey => prevKey + 1);

      const babel = (window as any).Babel;
      if (transpilerState !== 'loaded' || !babel) {
          toast({ variant: 'destructive', title: "Transpiler not loaded", description: "Babel.js is required for previewing. Please wait or try reloading it." });
          setSrcDoc('<p>Error: Transpiler not ready.</p>');
          return;
      }

      try {
          const dependencies = scanForDependencies(files);
          const preloadScripts = dependencies.map(dep => 
              `<script type="module">
                  import * as module from 'https://cdn.skypack.dev/${dep}';
                  window.__preloaded_modules__ = window.__preloaded_modules__ || {};
                  window.__preloaded_modules__['${dep}'] = module.default || module;
              </script>`
          ).join('\n');

          const entryPointPath = files.some(f => f.path.endsWith('.tsx')) ? 'src/index.tsx' : 'script.js';
          let htmlTemplate = files.find(f => f.path.endsWith('.html'));

          if (!htmlTemplate) {
              // Fallback for projects without an index.html (like a single component)
              htmlTemplate = { path: 'index.html', content: `<!DOCTYPE html><html><head><meta charset="UTF-8" /><title>Preview</title></head><body><div id="root"></div><script src="bundle.js"></script></body></html>`};
          }

          const cssFiles = files.filter(f => f.path.endsWith('.css'));
          
          const modules: { [key: string]: string } = {};

          for (const file of files) {
              if (getLanguageFromPath(file.path) === 'javascript') {
                  try {
                      const result = babel.transform(file.content, {
                          presets: ['react', 'typescript'],
                          filename: file.path,
                          plugins: ["transform-modules-commonjs"]
                      });
                      modules[file.path] = result.code;
                  } catch (e: any) {
                      setSrcDoc(`<pre style="color:red;">Babel Error in ${file.path}:\n${e.message}</pre>`);
                      postLog('error', `Babel Error in ${file.path}:\n${e.message}`);
                      return;
                  }
              }
          }
          
          const bundleScript = `
              const preloadedModules = window.__preloaded_modules__ || {};
              const externalDependencies = {
                  'react': window.React,
                  'react-dom': window.ReactDOM,
                  'react-dom/client': window.ReactDOM,
                  ...preloadedModules
              };

              const modules = {
                  ${Object.entries(modules).map(([path, code]) => 
                      `'${path}': function(require, module, exports) { ${code} }`
                  ).join(',\n')}
              };
              const moduleCache = {};

              function resolvePath(currentPath, requirePath) {
                  if (!currentPath) return requirePath;
                  const pathParts = currentPath.split('/');
                  pathParts.pop();
                  
                  if (requirePath.startsWith('./')) requirePath = requirePath.substring(2);
                  
                  const requireParts = requirePath.split('/');
                  
                  for (const part of requireParts) {
                      if (part === '..') pathParts.pop();
                      else pathParts.push(part);
                  }
                  
                  let resolvedPath = pathParts.join('/');
                  const extensions = ['.js', '.ts', '.jsx', '.tsx'];
                  if (!extensions.some(ext => resolvedPath.endsWith(ext))) {
                      for (const ext of extensions) {
                          if (modules[resolvedPath + ext]) {
                              resolvedPath += ext;
                              break;
                          }
                      }
                  }
                  return resolvedPath;
              }

              const require = (path, currentPath) => {
                  if (path.endsWith('.css') || path.endsWith('.scss') || path.endsWith('.less')) {
                      return {};
                  }

                  if (externalDependencies.hasOwnProperty(path)) {
                      return externalDependencies[path];
                  }

                  let resolvedPath = path;
                  if (path.startsWith('.')) {
                      resolvedPath = resolvePath(currentPath, path);
                  }
                  
                  if (moduleCache[resolvedPath]) return moduleCache[resolvedPath].exports;
                  if (!modules[resolvedPath]) throw new Error('Module not found: ' + path + ' (required from ' + currentPath + ')');
                  
                  const module = { exports: {} };
                  moduleCache[resolvedPath] = module;
                  try {
                      modules[resolvedPath]((p) => require(p, resolvedPath), module, module.exports);
                  } catch(e) {
                      console.error('Error in module: ' + resolvedPath, e);
                      throw e;
                  }
                  return module.exports;
              };

              try {
                  if (modules['${entryPointPath}']) {
                    require('${entryPointPath}', '');
                  }
              } catch(e) {
                  console.error(e);
              }
          `;
          
          const finalHtml = htmlTemplate.content;

          const headWithPreload = finalHtml.includes('</head>') 
              ? finalHtml.replace('</head>', `${preloadScripts}</head>`)
              : `<head>${preloadScripts}</head>${finalHtml}`;

          const injectedCss = `<style>${cssFiles.map(f => f.content).join('\n\n')}</style>`;
          const withCss = headWithPreload.includes('</head>')
              ? headWithPreload.replace('</head>', `${injectedCss}</head>`)
              : headWithPreload + injectedCss;

          const injectedScripts = `<script>${consoleLoggerScript}</script>\n<script type="module">${bundleScript}</script>`;
          const withScripts = withCss.includes('</body>')
              ? withCss.replace('</body>', `${injectedScripts}</body>`)
              : withCss + injectedScripts;

          // Clean up original script/style tags if they exist
          let finalCleanedHtml = withScripts
              .replace(/<link.*href="style.css".*>/, '')
              .replace(/<script.*src="bundle.js".*><\/script>/, '');

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
          
          finalCleanedHtml = finalCleanedHtml.includes('</body>')
              ? finalCleanedHtml.replace('</body>', `${safetyScript}\n</body>`)
              : finalCleanedHtml + safetyScript;

          setSrcDoc(finalCleanedHtml);
      } catch (e: any) {
          setSrcDoc(`<p>Error building preview:</p><pre style="color:red;">${e.message}\n${e.stack}</pre>`);
          postLog('error', `Preview build error: ${e.message}`);
      }
  }, [files, toast, transpilerState, scanForDependencies]);
  

  const handleCodeChange = useCallback((value: string) => {
      setFiles(files.map(file => 
          file.path === activeFilePath ? { ...file, content: value } : file
      ));
  }, [files, activeFilePath]);

  const handleStartCreateItem = useCallback((type: 'file' | 'folder', parentPath: string) => {
      setIsCreating({ type, parentPath });
  }, []);

  const handleCreateItem = useCallback(() => {
      if (!isCreating) return;

      const name = newItemName.trim();
      const { type, parentPath } = isCreating;
      setIsCreating(null);
      setNewItemName("");

      if (!name) return;

      const newPath = parentPath ? `${parentPath}/${name}` : name;

      if (files.find(f => f.path === newPath || f.path.startsWith(newPath + '/'))) {
          toast({ variant: 'destructive', title: 'Error', description: 'A file or folder with that name already exists.' });
          return;
      }
      
      if (type === 'file') {
          const newFile: CodeFile = { path: newPath, content: '' };
          setFiles(prevFiles => [...prevFiles, newFile]);
          setActiveFilePath(newPath);
      } else { // folder
          const newFolderAsFile: CodeFile = { path: `${newPath}/.placeholder`, content: '' };
          setFiles(prevFiles => [...prevFiles, newFolderAsFile]);
      }
  }, [isCreating, newItemName, files, toast]);
  
  const handleDeleteItem = useCallback((path: string) => {
      if (files.length <= 1) {
          toast({ variant: 'destructive', title: 'Error', description: 'Cannot delete the last file.'});
          return;
      }
      setItemToDelete(path);
  }, [files, toast]);
  
  const confirmDelete = useCallback(() => {
      if (!itemToDelete) return;

      const isFolder = !files.some(f => f.path === itemToDelete);
      const pathToDelete = isFolder ? `${itemToDelete}/` : itemToDelete;

      const newFiles = files.filter(f => !f.path.startsWith(pathToDelete));
      
      if (newFiles.length === 0) {
          toast({ variant: 'destructive', title: 'Error', description: 'Cannot delete all files.'});
          setItemToDelete(null);
          return;
      }

      setFiles(newFiles);
      if (activeFilePath.startsWith(pathToDelete)) {
          setActiveFilePath(newFiles[0]?.path || '');
      }
      setItemToDelete(null);
  }, [files, activeFilePath, itemToDelete]);
  
  const handleDownloadAllFiles = useCallback(async () => {
      if (typeof window === 'undefined') return;
      
      const zip = new JSZip();
      files.filter(f => !f.path.endsWith('/.placeholder')).forEach(file => {
          zip.file(file.path, file.content);
      });
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'playground-project.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  }, [files]);

  const handleAiFileUpdates = useCallback((changes: {
      fileChanges?: { path: string; content: string }[];
      filesToDelete?: string[];
  }) => {
      const { fileChanges, filesToDelete } = changes;
      if (!fileChanges && !filesToDelete) return;

      setFiles(currentFiles => {
          let nextFiles = [...currentFiles];

          // Handle deletions
          if (filesToDelete && filesToDelete.length > 0) {
              nextFiles = nextFiles.filter(f => !filesToDelete.includes(f.path));
          }

          // Handle updates and creations
          if (fileChanges && fileChanges.length > 0) {
              fileChanges.forEach(change => {
                  const fileIndex = nextFiles.findIndex(f => f.path === change.path);
                  if (fileIndex !== -1) {
                      // Update existing file
                      nextFiles[fileIndex] = { ...nextFiles[fileIndex], content: change.content };
                  } else {
                      // Create new file
                      const newFile: CodeFile = { path: change.path, content: change.content };
                      nextFiles.push(newFile);
                  }
              });
          }
          
          // Logic to set active file
          if (filesToDelete?.includes(activeFilePath)) {
              setActiveFilePath(nextFiles[0]?.path || '');
          } else if (fileChanges && fileChanges.length > 0) {
              const lastChangedFile = fileChanges[fileChanges.length - 1].path;
              if (nextFiles.some(f => f.path === lastChangedFile)) {
                  setActiveFilePath(lastChangedFile);
              }
          }
          
          return nextFiles;
      });

      const changeSummary = [];
      if (fileChanges?.length) changeSummary.push(`Updated ${fileChanges.length} file(s)`);
      if (filesToDelete?.length) changeSummary.push(`Deleted ${filesToDelete.length} file(s)`);

      toast({
          title: 'AI Assistant',
          description: changeSummary.join(', ') || 'Changes applied.'
      });
  }, [activeFilePath, files]);

  const handleTerminalCommand = useCallback(() => {
    const command = terminalInput.trim();
    if (!command) return;

    postLog('info', `$ ${command}`);
    setTerminalInput('');

    const [cmd, ...args] = command.split(' ');

    switch (cmd) {
      case 'ls':
        // A more detailed ls is possible, but simple is fine for now
        postLog('log', files.map(f => f.path).join('\n'));
        break;
      case 'mkdir':
        if (!args[0]) {
          postLog('error', 'Usage: mkdir <directory_name>');
          break;
        }
        const newFolderPath = `${args[0]}/.placeholder`;
        if (files.some(f => f.path.startsWith(args[0] + '/'))) {
          postLog('error', `mkdir: ${args[0]}: File or directory exists`);
        } else {
          setFiles(f => [...f, { path: newFolderPath, content: '' }]);
          postLog('log', `Directory ${args[0]} created.`);
        }
        break;
      case 'touch':
          if (!args[0]) {
              postLog('error', 'Usage: touch <file_name>');
              break;
          }
          const newFilePath = args[0];
          if (files.some(f => f.path === newFilePath)) {
              postLog('error', `touch: ${newFilePath}: File exists`);
          } else {
              setFiles(f => [...f, { path: newFilePath, content: '' }]);
              setActiveFilePath(newFilePath);
              postLog('log', `File ${newFilePath} created.`);
          }
          break;
      case 'rm':
          if (!args[0]) {
              postLog('error', 'Usage: rm <file_or_directory>');
              break;
          }
          const pathToDelete = args[0];
          const isFolder = !files.some(f => f.path === pathToDelete) && files.some(f => f.path.startsWith(pathToDelete + '/'));
          const fullPathToDelete = isFolder ? `${pathToDelete}/` : pathToDelete;
          
          const originalLength = files.length;
          const newFiles = files.filter(f => !f.path.startsWith(fullPathToDelete));
          
          if (newFiles.length === originalLength) {
            postLog('error', `rm: ${pathToDelete}: No such file or directory`);
          } else {
            setFiles(newFiles);
            if (activeFilePath.startsWith(fullPathToDelete)) {
              setActiveFilePath(newFiles[0]?.path || '');
            }
            postLog('log', `Removed ${pathToDelete}`);
          }
          break;
      case 'clear':
          setLogs([]);
          break;
      default:
        postLog('error', `Command not found: ${cmd}`);
    }
  }, [files, activeFilePath, postLog]);
  
  const handlePreviewClick = useCallback(async () => {
      await updatePreview();
      setIsPreviewOpen(true);
  }, [updatePreview]);

  const languageExtensions = useMemo(() => ({
    html: [htmlLang({ matchClosingTags: true, autoCloseTags: true })],
    css: [cssLang()],
    javascript: [jsLang({ jsx: true, typescript: true })],
  }), []);

  // Remove the <Script> component for Babel and use a manual script injection
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    setTranspilerState('loading');
    // Remove any previous Babel script
    const prev = document.getElementById('babel-standalone-script');
    if (prev) prev.remove();
    // Create new script
    const script = document.createElement('script');
    script.id = 'babel-standalone-script';
    script.src = 'https://unpkg.com/@babel/standalone@7/babel.min.js';
    script.async = true;
    script.onload = () => {
      setTranspilerState('loaded');
      toast({ title: 'Transpiler Ready', description: 'You can now preview your code.' });
    };
    script.onerror = () => {
      setTranspilerState('error');
      toast({ variant: 'destructive', title: 'Transpiler Failed', description: 'Could not load Babel.js. Previews may not work correctly.' });
    };
    document.head.appendChild(script);
    return () => {
      script.remove();
    };
  }, [babelScriptKey]);

  useEffect(() => {
    // setIsCheckingAuth(false); // This line is removed as per the edit hint
  }, [user]);

  if (isCheckingAuth) {
    return <div className="flex items-center justify-center min-h-screen bg-neutral-900 text-white text-xl font-bold">Loading...</div>;
  }
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-900 text-white">
        <h2 className="text-2xl font-bold mb-4">Sign in to use the Playground</h2>
        <Button onClick={() => setShowAuth(true)} className="bg-primary text-primary-foreground font-bold py-2 px-6 rounded-lg">Sign In / Sign Up</Button>
        {/* Optionally, render the AuthModalForm here or trigger the global modal */}
      </div>
    );
  }

  const handleDontShowWelcome = (checked: boolean) => {
    setDontShowWelcome(checked);
  };

  const handleCloseWelcome = () => {
    setIsWelcomeModalOpen(false);
    if (dontShowWelcome && typeof window !== 'undefined') {
      localStorage.setItem('playground_hide_welcome', '1');
    } else if (!dontShowWelcome && typeof window !== 'undefined') {
      localStorage.removeItem('playground_hide_welcome');
    }
  };

  return (
      <div className="flex flex-col h-screen bg-neutral-900 text-foreground">
          {/* <Script ... /> removed, replaced by useEffect above */}
          <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-neutral-900 px-4 sm:px-6">
              <Button asChild variant="outline" size="sm" className="bg-zinc-900 text-white border border-zinc-800 hover:bg-zinc-800 hover:text-white transition-colors">
                  <Link href="/">
                      <ArrowLeft className="h-4 w-4" />
                      Go Back
                  </Link>
              </Button>
              <div className='flex-1'>
                  <h1 className="text-2xl font-bold font-headline tracking-tight bg-gradient-to-r from-primary to-blue-400 text-transparent bg-clip-text">Code Playground</h1>
              </div>
              <div className="flex items-center gap-2">
                  {/* Feature icon button */}
                  <TooltipProvider>
                      <Tooltip>
                          <TooltipTrigger asChild>
                              <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-blue-400 hover:bg-blue-900/30 hover:text-blue-500 focus:bg-blue-900/40 focus:text-blue-500 transition-colors"
                                  onClick={() => setIsWelcomeModalOpen(true)}
                                  title="Show Playground Features"
                              >
                                  <Sparkles className="h-5 w-5" />
                                  <span className="sr-only">Show Playground Features</span>
                              </Button>
                          </TooltipTrigger>
                          <TooltipContent>Show Playground Features</TooltipContent>
                      </Tooltip>
                  </TooltipProvider>
                  {transpilerState === 'error' && (
                      <Button onClick={() => setBabelScriptKey(Date.now())} size="sm" variant="destructive">
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Reload Transpiler
                      </Button>
                  )}
                  <TooltipProvider>
                      <Tooltip>
                          <TooltipTrigger asChild>
                              <div tabIndex={0}>
                              <Button onClick={handlePreviewClick} size="sm" disabled={transpilerState !== 'loaded'} className="bg-primary hover:bg-primary/90 text-black font-semibold rounded-full px-5 py-2 shadow-lg transition-colors border-0 flex items-center">
                                  <Eye className="mr-2 h-4 w-4 text-black" />
                                  Preview
                              </Button>
                              </div>
                          </TooltipTrigger>
                          {transpilerState !== 'loaded' && (
                              <TooltipContent>
                                  <p>Waiting for the transpiler to load...</p>
                              </TooltipContent>
                          )}
                      </Tooltip>
                  </TooltipProvider>
              </div>
          </header>
          <main className="flex-1 min-h-0 pt-4">
              <ResizablePanelGroup direction="horizontal" className="w-full h-full">
                  <ResizablePanel defaultSize={20} minSize={15}>
                      <div className="flex flex-col h-full bg-zinc-900/80 rounded-2xl shadow-lg border border-zinc-800 m-2 overflow-hidden">
                          <div className="flex justify-between items-center p-3 border-b border-zinc-800 sticky top-0 z-10 bg-zinc-900/90 backdrop-blur rounded-t-2xl">
                              {/* Explorer title */}
                              <h2 className="text-xs font-bold uppercase tracking-widest bg-gradient-to-r from-primary to-blue-400 text-transparent bg-clip-text">Explorer</h2>
                              <div className="flex items-center gap-1">
                                  <Button size="icon" variant="ghost" className="h-7 w-7 hover:bg-blue-900/40 focus:bg-blue-900/50 text-blue-300 hover:text-blue-500 focus:text-blue-500 transition-colors" onClick={handleDownloadAllFiles} title="Download Project as ZIP">
                                      <Download className="h-4 w-4" />
                                  </Button>
                                  <Button size="icon" variant="ghost" className="h-7 w-7 hover:bg-blue-900/40 focus:bg-blue-900/50 text-blue-300 hover:text-blue-500 focus:text-blue-500 transition-colors" onClick={() => handleStartCreateItem('folder', '')} title="New Folder">
                                      <FolderPlus className="h-4 w-4" />
                                  </Button>
                                  <Button size="icon" variant="ghost" className="h-7 w-7 hover:bg-blue-900/40 focus:bg-blue-900/50 text-blue-300 hover:text-blue-500 focus:text-blue-500 transition-colors" onClick={() => handleStartCreateItem('file', '')} title="New File">
                                      <FilePlus2 className="h-4 w-4" />
                                  </Button>
                              </div>
                          </div>
                          <div className="flex-1 overflow-y-auto p-2">
                              <FileTree 
                                  tree={fileTree}
                                  files={files}
                                  activeFilePath={activeFilePath}
                                  setActiveFilePath={setActiveFilePath}
                                  isCreating={isCreating}
                                  newFileInputRef={newFileInputRef}
                                  newItemName={newItemName}
                                  setNewItemName={setNewItemName}
                                  handleCreateItem={handleCreateItem}
                                  handleStartCreateItem={handleStartCreateItem}
                                  handleDeleteItem={handleDeleteItem}
                              />
                          </div>
                      </div>
                  </ResizablePanel>
                  <ResizableHandle withHandle />
                  <ResizablePanel defaultSize={80}>
                      <ResizablePanelGroup direction="vertical">
                          <ResizablePanel defaultSize={70}>
                              <div className="flex flex-col h-full">
                                  <div className="flex justify-between items-center p-2 border-b bg-neutral-900 h-10">
                                      <span className="text-sm font-medium text-muted-foreground">{activeFile?.path}</span>
                                      {activeFile && (
                                          <Button size="icon" variant="ghost" onClick={() => navigator.clipboard.writeText(activeFile.content).then(() => toast({title: 'Copied to clipboard'}))} title="Copy code" className="h-7 w-7 hover:bg-blue-900/40 focus:bg-blue-900/50 text-blue-300 hover:text-blue-500 focus:text-blue-500 transition-colors">
                                              <Clipboard className="h-4 w-4" />
                                          </Button>
                                      )}
                                  </div>
                                  <div className="flex-1 min-h-0">
                                    {activeFile ? <CodeMirror
                                        value={activeFile.content}
                                        height="100%"
                                        theme={vscodeDark}
                                        extensions={[languageExtensions[getLanguageFromPath(activeFile.path)], autocompletion()]}
                                        onChange={handleCodeChange}
                                        className="h-full w-full font-code text-sm"
                                    /> : <div className="flex items-center justify-center h-full text-muted-foreground">Select a file to start editing</div>}
                                  </div>
                              </div>
                          </ResizablePanel>
                          <ResizableHandle withHandle />
                          <ResizablePanel defaultSize={30} minSize={15}>
                              <div className="h-full flex flex-col">
                                  <div className="flex items-center p-2 border-b shrink-0 bg-neutral-900 h-10">
                                      <h3 className="font-semibold flex items-center gap-2 text-sm"><Terminal className="h-4 w-4" />Terminal</h3>
                                  </div>
                                  <div className="flex-1 min-h-0 flex flex-col">
                                      <div className="flex-1 min-h-0 bg-black text-white font-mono text-xs overflow-y-auto">
                                          <div className="p-2">
                                              <div className="flex justify-between items-center">
                                                  <p className="text-gray-500">Playground Terminal</p>
                                                  <Button variant="ghost" size="sm" className="text-xs h-6 px-1" onClick={() => setLogs([])}>Clear</Button>
                                              </div>
                                              {logs.map((log, index) => (
                                              <div key={index} className={`flex gap-2 items-start py-0.5 border-b border-gray-800/50 ${log.level === 'error' ? 'text-red-400' : log.level === 'warn' ? 'text-yellow-400' : 'text-gray-300'}`}>
                                                  {log.level !== 'info' && <span className="text-gray-600 shrink-0">{log.timestamp}</span>}
                                                  <span className="text-gray-500 shrink-0">{log.level === 'info' ? '' : '>'}</span>
                                                  <pre className="whitespace-pre-wrap break-all">{log.message}</pre>
                                              </div>
                                              ))}
                                          </div>
                                      </div>
                                      <div className="shrink-0 p-2 border-t bg-black/80 flex items-center gap-2">
                                          <span className="text-green-400 font-mono">$</span>
                                          <Input
                                              type="text"
                                              className="bg-transparent border-0 text-white font-mono text-sm focus-visible:ring-0 focus-visible:ring-offset-0 h-auto p-0"
                                              placeholder="Enter command..."
                                              value={terminalInput}
                                              onChange={(e) => setTerminalInput(e.target.value)}
                                              onKeyDown={(e) => e.key === 'Enter' && handleTerminalCommand()}
                                          />
                                      </div>
                                  </div>
                              </div>
                          </ResizablePanel>
                      </ResizablePanelGroup>
                  </ResizablePanel>
              </ResizablePanelGroup>
          </main>
          <Chatbot
              files={files}
              activeFileName={activeFilePath}
              onFilesUpdate={handleAiFileUpdates}
              apiKey={apiKey}
          />
          <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
              <AlertDialogContent>
                  <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete <span className="font-bold text-foreground">{itemToDelete}</span> and all its contents.
                      </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={confirmDelete}
                      >
                          Continue
                      </AlertDialogAction>
                  </AlertDialogFooter>
              </AlertDialogContent>
          </AlertDialog>
          <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
              <DialogContent className="max-w-none w-[90vw] h-[90vh] p-0 border-0 flex flex-col">
                  <DialogTitle className="sr-only">Code Preview</DialogTitle>
                  <div className="flex-shrink-0 p-2 bg-neutral-900 border-b rounded-t-lg flex justify-between items-center">
                      <div className="w-10"></div>
                      <div className="flex flex-col items-center gap-2">
                          <h3 className="font-semibold">Preview</h3>
                          <div className="flex items-center gap-1">
                              <Button onClick={() => setPreviewDevice('desktop')} variant={previewDevice === 'desktop' ? 'secondary' : 'ghost'} size="icon" title="Desktop View">
                                  <Monitor className="h-5 w-5" />
                              </Button>
                              <Button onClick={() => setPreviewDevice('tablet')} variant={previewDevice === 'tablet' ? 'secondary' : 'ghost'} size="icon" title="Tablet View">
                                  <Tablet className="h-5 w-5" />
                              </Button>
                              <Button onClick={() => setPreviewDevice('mobile')} variant={previewDevice === 'mobile' ? 'secondary' : 'ghost'} size="icon" title="Mobile View">
                                  <Smartphone className="h-5 w-5" />
                              </Button>
                          </div>
                      </div>
                      <div className="w-10"></div>
                  </div>
                  <div className="flex-1 overflow-auto bg-muted/40 flex justify-center items-start p-4">
                      {transpilerState === 'error' ? (
                        <div className="flex flex-col items-center justify-center w-full h-full text-red-500">
                          <p className="text-lg font-bold mb-2">Transpiler failed to load.</p>
                          <Button onClick={() => setBabelScriptKey(Date.now())} variant="destructive">Reload Transpiler</Button>
                        </div>
                      ) : srcDoc.startsWith('<p>Error') ? (
                        <div className="flex flex-col items-center justify-center w-full h-full text-red-500">
                          <div dangerouslySetInnerHTML={{ __html: srcDoc }} />
                        </div>
                      ) : (
                        <iframe
                          key={previewKey}
                          srcDoc={srcDoc}
                          title="output"
                          sandbox="allow-scripts allow-same-origin"
                          className="bg-white shadow-lg transition-all"
                          style={{
                              width: previewDevice === 'desktop' ? '100%' : (previewDevice === 'tablet' ? '768px' : '375px'),
                              height: '100%'
                          }}
                        />
                      )}
                  </div>
              </DialogContent>
          </Dialog>
          <Dialog open={isWelcomeModalOpen} onOpenChange={setIsWelcomeModalOpen}>
              <DialogContent className="w-full max-w-md mx-auto bg-zinc-900 text-white rounded-2xl shadow-2xl border border-blue-700/40 p-4 flex flex-col items-center justify-center">
                  <DialogHeader className="w-full text-center">
                      <DialogTitle className="text-2xl flex items-center gap-2 font-bold bg-gradient-to-r from-primary to-blue-400 text-transparent bg-clip-text mb-1"><Sparkles className="text-primary animate-bounce"/> Playground</DialogTitle>
                      <DialogDescription className="text-base text-blue-200 mb-2">Build, test, and experiment with web code!</DialogDescription>
                  </DialogHeader>
                  <div className="grid grid-cols-2 gap-3 w-full my-2">
                      <div className="bg-zinc-800 rounded-xl p-3 flex flex-col items-center text-center shadow border border-zinc-700">
                          <Monitor className="h-6 w-6 text-blue-400 mb-1" />
                          <span className="font-semibold">Edit Code</span>
                          <span className="text-xs text-blue-200 mt-1">HTML, CSS, JS, React & TSX</span>
                      </div>
                      <div className="bg-zinc-800 rounded-xl p-3 flex flex-col items-center text-center shadow border border-zinc-700">
                          <Eye className="h-6 w-6 text-blue-400 mb-1" />
                          <span className="font-semibold">Live Preview</span>
                          <span className="text-xs text-blue-200 mt-1">Test on any device</span>
                      </div>
                      <div className="bg-zinc-800 rounded-xl p-3 flex flex-col items-center text-center shadow border border-zinc-700">
                          <Folder className="h-6 w-6 text-blue-400 mb-1" />
                          <span className="font-semibold">File Explorer</span>
                          <span className="text-xs text-blue-200 mt-1">Organize files & folders</span>
                      </div>
                      <div className="bg-zinc-800 rounded-xl p-3 flex flex-col items-center text-center shadow border border-zinc-700">
                          <Terminal className="h-6 w-6 text-blue-400 mb-1" />
                          <span className="font-semibold">Terminal</span>
                          <span className="text-xs text-blue-200 mt-1">ls, touch, rm & more</span>
                      </div>
                      <div className="bg-zinc-800 rounded-xl p-3 flex flex-col items-center text-center shadow border border-zinc-700 col-span-2">
                          <Sparkles className="h-6 w-6 text-blue-400 mb-1 animate-bounce" />
                          <span className="font-semibold">AI Assistant</span>
                          <span className="text-xs text-blue-200 mt-1">Get help, add features, fix bugs</span>
                      </div>
                  </div>
                  <div className="flex items-center mt-4 gap-3 w-full">
                      <label className="flex items-center gap-2 cursor-pointer select-none text-blue-200">
                                                      <input
                                type="checkbox"
                                checked={dontShowWelcome}
                                onChange={e => handleDontShowWelcome(e.target.checked)}
                                className="accent-blue-500 w-4 h-4 rounded"
                            />
                          Don't show again
                      </label>
                      <div className="flex-1" />
                                              <Button
                           onClick={handleCloseWelcome}
                           className="bg-blue-700 hover:bg-blue-800 text-white font-bold px-5 py-2 rounded-xl shadow-lg transition-colors border-2 border-blue-500/40"
                        >
                          Start Coding
                      </Button>
                  </div>
              </DialogContent>
          </Dialog>
      </div>
  );
}

// FileTree and FileTreeItem Components
interface FileTreeProps {
    tree: FileSystemTree;
    files: CodeFile[];
    activeFilePath: string;
    setActiveFilePath: (path: string) => void;
    isCreating: { type: 'file' | 'folder', parentPath: string } | null;
    newFileInputRef: React.RefObject<HTMLInputElement>;
    newItemName: string;
    setNewItemName: (name: string) => void;
    handleCreateItem: () => void;
    handleStartCreateItem: (type: 'file' | 'folder', parentPath: string) => void;
    handleDeleteItem: (path: string) => void;
}

const FileTree: React.FC<FileTreeProps> = ({ tree, files, activeFilePath, setActiveFilePath, ...rest }) => (
    <div className="space-y-1">
        {Object.entries(tree).map(([name, node]) => (
            <FileTreeItem
                key={name}
                name={name}
                node={node}
                files={files}
                activeFilePath={activeFilePath}
                setActiveFilePath={setActiveFilePath}
                depth={0}
                currentPath=""
                {...rest}
            />
        ))}
        {rest.isCreating && rest.isCreating.parentPath === '' && (
            <NewItemInput {...rest} />
        )}
    </div>
);

interface FileTreeItemProps extends Omit<FileTreeProps, 'tree'> {
    name: string;
    node: FileSystemTree | CodeFile;
    depth: number;
    currentPath: string;
}

const FileTreeItem: React.FC<FileTreeItemProps> = ({ name, node, files, activeFilePath, setActiveFilePath, depth, currentPath, ...rest }) => {
    const path = currentPath ? `${currentPath}/${name}` : name;
    const isFolder = 'content' in node === false;
    const [isOpen, setIsOpen] = useState(true);

    if (name === '.placeholder') return null;

    if (isFolder) {
        return (
            <div key={path}>
                <div 
                    className="flex items-center group rounded-md cursor-pointer transition-all hover:bg-blue-900/30 hover:shadow-md"
                    style={{ paddingLeft: `${depth * 1}rem` }}
                >
                    <Button
                        variant='ghost'
                        className="w-full justify-start h-8 text-sm gap-2 px-2 flex-1 bg-transparent hover:bg-transparent"
                        onClick={() => setIsOpen(!isOpen)}
                    >
                        {isOpen ? <FolderOpen className="h-4 w-4 shrink-0 text-primary" /> : <Folder className="h-4 w-4 shrink-0 text-primary" />}
                        <span className="truncate group-hover:text-white">{name}</span>
                    </Button>
                    <div className="flex items-center">
                        <Button size="icon" variant="ghost" className="h-7 w-7 opacity-0 group-hover:opacity-100 flex-shrink-0 hover:bg-blue-900/40 focus:bg-blue-900/50 text-blue-300 hover:text-blue-500 focus:text-blue-500 transition-colors" onClick={(e) => { e.stopPropagation(); rest.handleStartCreateItem('folder', path); }} title="New Subfolder">
                            <FolderPlus className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 opacity-0 group-hover:opacity-100 flex-shrink-0 hover:bg-blue-900/40 focus:bg-blue-900/50 text-blue-300 hover:text-blue-500 focus:text-blue-500 transition-colors" onClick={(e) => { e.stopPropagation(); rest.handleStartCreateItem('file', path); }} title="New File in Folder">
                            <FilePlus2 className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button size="icon" variant="ghost" className="h-7 w-7 flex-shrink-0 text-white hover:bg-transparent hover:text-white" onClick={(e) => e.stopPropagation()}>
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()} className="w-[calc(100vw-2rem)] max-w-[20rem] min-w-[280px] z-50">
                                <DropdownMenuItem onClick={() => rest.handleDeleteItem(path)} className="text-destructive focus:text-destructive hover:bg-red-900/30 focus:bg-red-900/40 hover:text-red-400 focus:text-red-400 transition-colors text-sm sm:text-base px-3 py-2">
                                    <Trash2 className="mr-2 h-4 w-4" /> Delete Folder
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
                {isOpen && (
                    <div className="border-l border-dashed border-zinc-700">
                        {Object.entries(node).map(([childName, childNode]) => (
                            <FileTreeItem
                                key={childName}
                                name={childName}
                                node={childNode}
                                files={files}
                                activeFilePath={activeFilePath}
                                setActiveFilePath={setActiveFilePath}
                                depth={depth + 1}
                                currentPath={path}
                                {...rest}
                            />
                        ))}
                        {rest.isCreating && rest.isCreating.parentPath === path && (
                            <div style={{ paddingLeft: `${(depth + 1) * 1}rem` }}>
                                <NewItemInput {...rest} />
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    }

    if ('content' in node) {
        const fileNode = node as CodeFile;
    // It's a file
    return (
        <div 
            className={cn(
              "flex items-center group rounded-md cursor-pointer transition-all",
              activeFilePath === fileNode.path
                ? "bg-blue-900/40 text-white"
                : "hover:bg-gradient-to-r hover:from-primary hover:to-blue-400 hover:text-black"
            )}
            style={{ paddingLeft: `${depth * 1}rem` }}
        >
            <Button
                    variant='ghost'
                className="w-full justify-start h-8 text-sm gap-2 px-2 flex-1 bg-transparent hover:bg-transparent"
                    onClick={() => setActiveFilePath(fileNode.path)}
            >
                <File className={cn("h-4 w-4 shrink-0", activeFilePath === fileNode.path ? 'text-primary' : '')} />
                <span className={cn("truncate", activeFilePath === fileNode.path ? 'text-white' : '')}>{name}</span>
            </Button>
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button size="icon" variant="ghost" className="h-7 w-7 flex-shrink-0 text-white hover:bg-transparent hover:text-black">
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[calc(100vw-2rem)] max-w-[20rem] min-w-[280px] z-50">
                        <DropdownMenuItem onClick={() => rest.handleDeleteItem(fileNode.path)} className="text-destructive focus:text-destructive hover:bg-red-900/30 focus:bg-red-900/40 hover:text-red-400 focus:text-red-400 transition-colors text-sm sm:text-base px-3 py-2">
                        <Trash2 className="mr-2 h-4 w-4" /> Delete File
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
    }

    return null; // Should not happen for a valid file tree structure
};

interface NewItemInputProps extends Omit<FileTreeProps, 'tree' | 'files' | 'activeFilePath' | 'setActiveFilePath' | 'handleStartCreateItem' | 'handleDeleteItem'> {}

const NewItemInput: React.FC<NewItemInputProps> = ({ isCreating, newFileInputRef, newItemName, setNewItemName, handleCreateItem }) => {
    if (!isCreating) return null;
    return (
        <div className="flex items-center gap-2 p-1">
            {isCreating.type === 'folder' 
                ? <Folder className="h-4 w-4 shrink-0" /> 
                : <File className="h-4 w-4 shrink-0" />}
            <Input
                ref={newFileInputRef}
                type="text"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                onBlur={handleCreateItem}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateItem()}
                className="bg-transparent border border-input rounded-md px-2 py-0.5 text-sm h-7 w-full focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder={isCreating.type === 'folder' ? "Folder name..." : "File name..."}
            />
        </div>
    );
};

    
