"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  FileCode, 
  FileType, 
  FileCode2, 
  FileJson, 
  FileText as FileMarkdown, 
  FolderOpen,
  Folder,
  ChevronRight,
  ChevronDown,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ProjectFile {
  name: string;
  content: string;
  type: 'html' | 'css' | 'javascript' | 'json' | 'md' | 'txt';
  path?: string;
}

interface FileExplorerProps {
  files: ProjectFile[];
  selectedFile: string | null;
  onFileSelect: (fileName: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const getFileIcon = (type: string, name: string) => {
  switch (type) {
    case 'html':
      return <FileCode className="h-4 w-4 text-orange-500" />;
    case 'css':
      return <FileType className="h-4 w-4 text-blue-500" />;
    case 'javascript':
      return <FileCode2 className="h-4 w-4 text-yellow-500" />;
    case 'json':
      return <FileJson className="h-4 w-4 text-green-500" />;
    case 'md':
      return <FileMarkdown className="h-4 w-4 text-purple-500" />;
    default:
      return <FileText className="h-4 w-4 text-gray-500" />;
  }
};

const getFileTypeLabel = (type: string) => {
  switch (type) {
    case 'html':
      return 'HTML';
    case 'css':
      return 'CSS';
    case 'javascript':
      return 'JavaScript';
    case 'json':
      return 'JSON';
    case 'md':
      return 'Markdown';
    default:
      return 'Text';
  }
};

export function FileExplorer({ files, selectedFile, onFileSelect, isOpen, onToggle }: FileExplorerProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['root']));

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const organizeFiles = (files: ProjectFile[]) => {
    const organized: { [key: string]: ProjectFile[] } = {
      'root': [],
      'styles': [],
      'scripts': [],
      'docs': [],
      'config': []
    };

    files.forEach(file => {
      if (file.name.includes('style') || file.name.includes('css')) {
        organized.styles.push(file);
      } else if (file.name.includes('script') || file.name.includes('js')) {
        organized.scripts.push(file);
      } else if (file.name.includes('readme') || file.name.includes('.md')) {
        organized.docs.push(file);
      } else if (file.name.includes('config') || file.name.includes('.json')) {
        organized.config.push(file);
      } else {
        organized.root.push(file);
      }
    });

    return organized;
  };

  const organizedFiles = organizeFiles(files);

  const renderFileItem = (file: ProjectFile) => (
    <div
      key={file.name}
      className={cn(
        "flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground rounded-md transition-colors",
        selectedFile === file.name && "bg-accent text-accent-foreground"
      )}
      onClick={() => onFileSelect(file.name)}
    >
      {getFileIcon(file.type, file.name)}
      <span className="truncate">{file.name}</span>
    </div>
  );

  const renderSection = (title: string, files: ProjectFile[], sectionKey: string) => {
    if (files.length === 0) return null;
    
    const isExpanded = expandedSections.has(sectionKey);
    
    return (
      <div key={sectionKey} className="space-y-1">
        <button
          className="flex items-center gap-2 px-2 py-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-full"
          onClick={() => toggleSection(sectionKey)}
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
          <FolderOpen className="h-4 w-4" />
          {title}
        </button>
        {isExpanded && (
          <div className="ml-4 space-y-1">
            {files.map(renderFileItem)}
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-y-0 left-0 w-64 bg-background border-r z-50 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">Project Files</h2>
        <Button variant="ghost" size="sm" onClick={onToggle}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {renderSection('Root Files', organizedFiles.root, 'root')}
          {renderSection('Styles', organizedFiles.styles, 'styles')}
          {renderSection('Scripts', organizedFiles.scripts, 'scripts')}
          {renderSection('Documentation', organizedFiles.docs, 'docs')}
          {renderSection('Configuration', organizedFiles.config, 'config')}
        </div>
      </ScrollArea>
      
      <div className="p-4 border-t">
        <div className="text-xs text-muted-foreground">
          {files.length} files generated
        </div>
      </div>
    </div>
  );
} 