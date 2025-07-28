"use client";

import React, { useState, useEffect, useRef } from 'react';
import { MultiFileEditor } from '@/components/multi-file-editor';
import { FileExplorer, type ProjectFile } from '@/components/file-explorer';
// AI functions are now called via API routes
import { Loader2, Wand2, Mic, MicOff, Paperclip, X, RefreshCw, Pencil, Undo, StopCircle, ArrowLeft, Lightbulb, Bot, PencilRuler, DollarSign, ShoppingCart, LogIn, Quote, User, Mail, Twitter, Github, Linkedin, Send, Download, Share2, Code, FolderOpen } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import useSpeechRecognition from '@/hooks/use-speech-recognition';
import type { ImperativePanelGroupHandle } from "react-resizable-panels";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable"
import { useIsMobile } from '@/hooks/use-mobile';
import { TypeAnimation } from 'react-type-animation';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ComponentPreviewDialog } from '@/components/component-preview-dialog';
import type { Snippet } from '@/components/snippet-card';
import { useApiKey } from '@/hooks/use-api-key';
import { useSupabaseUser } from '@/hooks/use-supabase-user';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { AuthModalForm } from '@/components/header';
import { twMerge } from 'tailwind-merge';


const funMessages = [
  "Assembling your code...",
  "Consulting the AI wizards...",
  "Optimizing your design...",
  "Adding a touch of magic...",
  "Almost there!",
  "Rendering creativity...",
  "Polishing pixels...",
  "Summoning Buildora...",
];

const GenerationLoader = ({ onCancel }: { onCancel: () => void }) => {
  const [progress, setProgress] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);
  const progressRef = useRef<NodeJS.Timeout | null>(null);
  const messageRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setProgress(0);
    progressRef.current = setInterval(() => {
      setProgress((prev) => (prev < 98 ? prev + Math.random() * 2 : prev));
    }, 80);
    messageRef.current = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % funMessages.length);
    }, 1800);
    return () => {
      if (progressRef.current) clearInterval(progressRef.current);
      if (messageRef.current) clearInterval(messageRef.current);
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-neutral-900/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
      <div className="flex flex-col items-center">
        <div className="relative flex items-center justify-center">
          <img
            src="/LOGO.png"
            alt="Buildora Logo"
            className="h-20 w-20 animate-spin-pause-smooth drop-shadow-lg"
            style={{ filter: 'drop-shadow(0 0 16px #60a5fa)' }}
          />
          <span className="absolute inset-0 rounded-full animate-glow bg-blue-400/20" />
        </div>
        <h3 className="text-2xl font-semibold mt-6 bg-gradient-to-r from-primary to-blue-400 text-transparent bg-clip-text">Generating your design...</h3>
        <div className="w-64 mx-auto mt-4">
          <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
            <div
              className="h-2 bg-gradient-to-r from-blue-400 to-primary rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <p className="text-blue-200 mt-4 min-h-[28px] text-base font-medium transition-all duration-300">
          {funMessages[messageIndex]}
        </p>
      </div>
      <Button
        variant="destructive"
        className="mt-10 px-8 py-3 text-lg font-bold rounded-full shadow-lg hover:scale-105 transition-transform"
        onClick={onCancel}
      >
        <X className="mr-2 h-5 w-5" />
        Cancel Generation
      </Button>
      <style jsx global>{`
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 0 0 #60a5fa44; }
          50% { box-shadow: 0 0 32px 8px #60a5fa88; }
        }
        .animate-glow {
          animation: glow 2.5s ease-in-out infinite;
        }
        @keyframes spin-pause-smooth {
          0% { transform: rotate(0deg); }
          10% { transform: rotate(360deg); }
          100% { transform: rotate(360deg); }
        }
        .animate-spin-pause-smooth {
          animation: spin-pause-smooth 5.5s linear infinite;
          transform-origin: center;
        }
      `}</style>
    </div>
  );
};


export default function Home() {
  const [description, setDescription] = useState('');
  const [enhancementPrompt, setEnhancementPrompt] = useState('');
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('code');
  const [fileExplorerOpen, setFileExplorerOpen] = useState(false);
  const { toast } = useToast();
  const panelGroupRef = useRef<ImperativePanelGroupHandle>(null);
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const generationCancelled = useRef(false);
  const [isMounted, setIsMounted] = useState(false);
  const isMobile = useIsMobile();
  const [isInputActive, setIsInputActive] = useState(false);
  const user = useSupabaseUser();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [mobileView, setMobileView] = useState<'input' | 'code'>('code');

  const [descriptionImageDataUri, setDescriptionImageDataUri] = useState<string | null>(null);
  const [enhancementImageDataUri, setEnhancementImageDataUri] = useState<string | null>(null);
  const descFileInputRef = useRef<HTMLInputElement>(null);
  const enhanceFileInputRef = useRef<HTMLInputElement>(null);
  
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedSnippet, setSelectedSnippet] = useState<Snippet | null>(null);
  const { apiKey } = useApiKey();

  const promptSuggestions = [
    'An interactive dashboard for an expense tracker with charts and recent transactions.',
    'The main interface for a recipe generator app, including a search bar and featured recipes.',
    'A modern landing page for a SaaS product with a hero section and feature list.',
    'A user profile page for a social media app with a profile picture, bio, and a grid of posts.',
    'A flight booking interface with fields for origin, destination, dates, and passenger count.',
    'A minimalist blog homepage with a list of recent articles.',
    'A product page for an e-commerce store with an image gallery and "add to cart" button.',
    'A weather app UI with a 5-day forecast and current conditions.',
  ];

  const featuredComponents: Snippet[] = [
    {
        id: 'price-table',
        category: 'Marketing',
        icon: <DollarSign className="w-6 h-6 text-primary shrink-0" />,
        title: "Three-Tier Pricing Table",
        description: "A responsive pricing table with a highlighted popular option and detailed features for each plan.",
        code: `<div class="font-sans text-white p-4 sm:p-8">
  <div class="container mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
    <div class="border border-gray-700 bg-gray-800/50 p-8 rounded-xl shadow-lg flex flex-col h-full">
      <h3 class="text-2xl font-semibold text-white mb-4">Starter</h3>
      <p class="text-gray-400 mb-6">For individuals and small projects.</p>
      <p class="text-5xl font-bold text-white mb-6">$19<span class="text-xl font-medium text-gray-400">/mo</span></p>
      <ul class="space-y-4 text-gray-300 mb-8 flex-grow">
        <li class="flex items-center gap-3"><svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>10 Projects</li>
        <li class="flex items-center gap-3"><svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>50 Generations per Day</li>
        <li class="flex items-center gap-3"><svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>Community Support</li>
      </ul>
      <button class="w-full mt-auto bg-gray-700 text-white font-bold py-3 rounded-lg hover:bg-gray-600 transition-colors">Choose Plan</button>
    </div>
    <div class="border-2 border-primary p-8 rounded-xl shadow-2xl flex flex-col relative bg-gray-800 h-full">
      <span class="bg-primary text-primary-foreground text-xs font-bold uppercase px-3 py-1 rounded-full absolute -top-4 right-6">Most Popular</span>
      <h3 class="text-2xl font-semibold text-white mb-4">Pro</h3>
      <p class="text-gray-400 mb-6">For growing teams and businesses.</p>
      <p class="text-5xl font-bold text-white mb-6">$49<span class="text-xl font-medium text-gray-400">/mo</span></p>
      <ul class="space-y-4 text-gray-300 mb-8 flex-grow">
        <li class="flex items-center gap-3"><svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>Unlimited Projects</li>
        <li class="flex items-center gap-3"><svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>Unlimited Generations</li>
        <li class="flex items-center gap-3"><svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>Advanced Analytics</li>
        <li class="flex items-center gap-3"><svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>Priority Support</li>
      </ul>
      <button class="w-full mt-auto bg-primary text-primary-foreground font-bold py-3 rounded-lg hover:bg-primary/90 transition-colors">Choose Plan</button>
    </div>
    <div class="border border-gray-700 bg-gray-800/50 p-8 rounded-xl shadow-lg flex flex-col h-full">
      <h3 class="text-2xl font-semibold text-white mb-4">Enterprise</h3>
      <p class="text-gray-400 mb-6">For large-scale organizations.</p>
      <p class="text-5xl font-bold text-white mb-6">Custom</p>
      <ul class="space-y-4 text-gray-300 mb-8 flex-grow">
        <li class="flex items-center gap-3"><svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>Dedicated Infrastructure</li>
        <li class="flex items-center gap-3"><svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>Custom Integrations</li>
        <li class="flex items-center gap-3"><svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>24/7 Phone Support</li>
      </ul>
      <button class="w-full mt-auto bg-gray-700 text-white font-bold py-3 rounded-lg hover:bg-gray-600 transition-colors">Contact Us</button>
    </div>
  </div>
</div>`
    },
    {
        id: 'product-card',
        category: 'E-commerce',
        icon: <ShoppingCart className="w-6 h-6 text-primary shrink-0" />,
        title: "E-commerce Product Card",
        description: "A stylish product card with an image, rating, price, and add to cart button.",
        code: `<div class="font-sans flex items-center justify-center p-8">
  <div class="w-full max-w-xs bg-gray-800 border border-gray-700 rounded-lg shadow-md text-white">
      <a href="#">
          <img class="p-6 rounded-t-lg" src="https://placehold.co/400x400.png" data-ai-hint="product shoe" alt="product image" />
      </a>
      <div class="px-5 pb-5">
          <a href="#">
              <h5 class="text-xl font-semibold tracking-tight text-white truncate">Futuristic Running Sneaker</h5>
          </a>
          <div class="flex items-center mt-2.5 mb-5">
              <div class="flex items-center">
                  <svg class="w-4 h-4 text-yellow-300" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 22 20"><path d="M20.924 7.625a1.523 1.523 0 0 0-1.238-1.044l-5.051-.734-2.259-4.577a1.534 1.534 0 0 0-2.752 0L7.365 5.847l-5.051.734A1.535 1.535 0 0 0 1.455 8.7l3.656 3.563-.863 5.031a1.532 1.532 0 0 0 2.226 1.616L12 17.03l4.522 2.379a1.534 1.534 0 0 0 2.226-1.617l-.863-5.03L20.924 7.625Z"/></svg>
                  <svg class="w-4 h-4 text-yellow-300" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 22 20"><path d="M20.924 7.625a1.523 1.523 0 0 0-1.238-1.044l-5.051-.734-2.259-4.577a1.534 1.534 0 0 0-2.752 0L7.365 5.847l-5.051.734A1.535 1.535 0 0 0 1.455 8.7l3.656 3.563-.863 5.031a1.532 1.532 0 0 0 2.226 1.616L12 17.03l4.522 2.379a1.534 1.534 0 0 0 2.226-1.617l-.863-5.03L20.924 7.625Z"/></svg>
                  <svg class="w-4 h-4 text-yellow-300" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 22 20"><path d="M20.924 7.625a1.523 1.523 0 0 0-1.238-1.044l-5.051-.734-2.259-4.577a1.534 1.534 0 0 0-2.752 0L7.365 5.847l-5.051.734A1.535 1.535 0 0 0 1.455 8.7l3.656 3.563-.863 5.031a1.532 1.532 0 0 0 2.226 1.616L12 17.03l4.522 2.379a1.534 1.534 0 0 0 2.226-1.617l-.863-5.03L20.924 7.625Z"/></svg>
                  <svg class="w-4 h-4 text-yellow-300" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 22 20"><path d="M20.924 7.625a1.523 1.523 0 0 0-1.238-1.044l-5.051-.734-2.259-4.577a1.534 1.534 0 0 0-2.752 0L7.365 5.847l-5.051.734A1.535 1.535 0 0 0 1.455 8.7l3.656 3.563-.863 5.031a1.532 1.532 0 0 0 2.226 1.616L12 17.03l4.522 2.379a1.534 1.534 0 0 0 2.226-1.617l-.863-5.03L20.924 7.625Z"/></svg>
                  <svg class="w-4 h-4 text-gray-600" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 22 20"><path d="M20.924 7.625a1.523 1.523 0 0 0-1.238-1.044l-5.051-.734-2.259-4.577a1.534 1.534 0 0 0-2.752 0L7.365 5.847l-5.051.734A1.535 1.535 0 0 0 1.455 8.7l3.656 3.563-.863 5.031a1.532 1.532 0 0 0 2.226 1.616L12 17.03l4.522 2.379a1.534 1.534 0 0 0 2.226-1.617l-.863-5.03L20.924 7.625Z"/></svg>
              </div>
              <span class="bg-primary/20 text-primary text-xs font-semibold px-2.5 py-0.5 rounded ml-3">4.0</span>
          </div>
          <div class="flex justify-between items-center">
              <span class="text-3xl font-bold text-white">$129</span>
              <button class="text-white bg-primary hover:bg-primary/90 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center">Add to cart</button>
          </div>
      </div>
  </div>
</div>`
    },
    {
        id: 'login-form',
        category: 'Forms',
        icon: <LogIn className="w-6 h-6 text-primary shrink-0" />,
        title: "Modern Login Form",
        description: "A sleek, centered login form with social login options.",
        code: `<div class="font-sans text-white flex items-center justify-center p-4">
  <div class="bg-gray-800/50 p-10 rounded-2xl shadow-xl w-full max-w-md border border-gray-700">
    <h2 class="text-3xl font-bold text-white text-center mb-2">Welcome Back</h2>
    <p class="text-center text-gray-400 mb-8">Sign in to continue to your account.</p>
    <form class="space-y-6">
      <div>
        <label for="email" class="block text-sm font-medium text-gray-300">Email Address</label>
        <input type="email" id="email" class="mt-1 w-full p-3 border bg-gray-700 border-gray-600 rounded-lg focus:ring-primary focus:border-primary text-white" placeholder="you@example.com">
      </div>
      <div>
        <label for="password" class="block text-sm font-medium text-gray-300">Password</label>
        <input type="password" id="password" class="mt-1 w-full p-3 border bg-gray-700 border-gray-600 rounded-lg focus:ring-primary focus:border-primary text-white" placeholder="••••••••">
      </div>
      <div class="flex items-center justify-between">
        <a href="#" class="text-sm text-primary hover:underline">Forgot password?</a>
      </div>
      <button type="submit" class="w-full bg-primary text-primary-foreground font-bold py-3 rounded-lg hover:bg-primary/90 transition-colors">Log In</button>
    </form>
  </div>
</div>`
    },
    {
        id: 'testimonial-card',
        category: 'Social',
        icon: <Quote className="w-6 h-6 text-primary shrink-0" />,
        title: "Testimonial Card",
        description: "A stylish card to display customer testimonials.",
        code: `<div class="font-sans flex items-center justify-center p-12">
  <div class="bg-gray-800/50 rounded-xl shadow-lg p-8 max-w-lg border border-gray-700 relative">
    <svg class="w-16 h-16 text-primary/20 absolute top-6 left-6" fill="currentColor" viewBox="0 0 32 32"><path d="M9.33,22.42A4.22,4.22,0,0,1,6.5,21.5,3.42,3.42,0,0,1,5,18.91,5.2,5.2,0,0,1,5.43,16a10.87,10.87,0,0,1,3.29-3.79,11.33,11.33,0,0,1,4.88-2.62,1,1,0,0,1,.65.13,1,1,0,0,1,.35.88v.17a3.42,3.42,0,0,1-.58,2.1,4.52,4.52,0,0,1-1.3,1.69,12.75,12.75,0,0,0-2.43,2.69,9.33,9.33,0,0,0-1,3.42,1,1,0,0,1-.21.75A.87.87,0,0,1,9.33,22.42ZM22.67,22.42a4.22,4.22,0,0,1-2.83-.92,3.42,3.42,0,0,1-1.5-2.59,5.2,5.2,0,0,1,.43-2.91A10.87,10.87,0,0,1,22,12.2a11.33,11.33,0,0,1,4.88-2.62,1,1,0,0,1,.65.13,1,1,0,0,1,.35.88v.17a3.42,3.42,0,0,1-.58,2.1,4.52,4.52,0,0,1-1.3,1.69,12.75,12.75,0,0,0-2.43,2.69,9.33,9.33,0,0,0-1,3.42,1,1,0,0,1-.21.75A.87.87,0,0,1,22.67,22.42Z"/></svg>
    <div class="relative z-10">
        <img src="https://placehold.co/100x100.png" alt="User avatar" class="w-24 h-24 rounded-full mx-auto -mt-20 border-8 border-gray-800" data-ai-hint="person smiling">
        <p class="text-xl text-gray-300 italic mt-6 mb-6">"This tool has completely changed my workflow. I can now prototype and iterate on designs faster than ever before. It's an indispensable part of my toolkit."</p>
        <div class="text-center">
            <p class="font-bold text-lg text-white">Sarah Johnson</p>
            <p class="text-gray-400">Lead Designer at Innovate Co.</p>
        </div>
    </div>
  </div>
</div>`
    },
    {
        id: 'user-profile',
        category: 'Social',
        icon: <User className="w-6 h-6 text-primary shrink-0" />,
        title: "User Profile Header",
        description: "A header component for a user profile page with an avatar, stats, and follow button.",
        code: `<div class="font-sans flex items-center justify-center p-8">
  <div class="w-full max-w-md bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-700 text-white">
    <div class="flex items-center">
      <img class="w-24 h-24 rounded-full border-4 border-primary/50" src="https://placehold.co/100x100.png" data-ai-hint="person portrait" alt="Avatar">
      <div class="ml-6 flex-grow">
        <h2 class="text-2xl font-bold">Alex Drake</h2>
        <p class="text-gray-400">@alexdrake</p>
        <button class="mt-2 w-full bg-primary text-primary-foreground font-semibold py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors">Follow</button>
      </div>
    </div>
    <div class="mt-6 pt-6 border-t border-gray-700 flex justify-around text-center">
      <div>
        <p class="text-2xl font-bold text-primary">1.2k</p>
        <p class="text-sm text-gray-400">Followers</p>
      </div>
      <div>
        <p class="text-2xl font-bold text-primary">450</p>
        <p class="text-sm text-gray-400">Following</p>
      </div>
      <div>
        <p class="text-2xl font-bold text-primary">78</p>
        <p class="text-sm text-gray-400">Posts</p>
      </div>
    </div>
  </div>
</div>`
    },
    {
        id: 'newsletter-signup',
        category: 'Forms',
        icon: <Mail className="w-6 h-6 text-primary shrink-0" />,
        title: "Newsletter Signup",
        description: "A clean and modern form for capturing newsletter subscribers.",
        code: `<div class="font-sans flex items-center justify-center p-8">
  <div class="w-full max-w-lg bg-gray-800/50 p-8 rounded-2xl shadow-lg border border-gray-700 text-white text-center">
    <div class="flex justify-center items-center mb-6">
        <svg class="w-12 h-12 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
    </div>
    <h3 class="text-3xl font-bold mb-3">Join Our Newsletter</h3>
    <p class="text-gray-400 mb-8">Get weekly updates on the latest trends in AI and web development.</p>
    <form class="flex flex-col sm:flex-row gap-4">
      <input type="email" placeholder="Enter your email" class="flex-grow p-3 border bg-gray-700 border-gray-600 rounded-lg focus:ring-primary focus:border-primary text-white placeholder-gray-400">
      <button type="submit" class="bg-primary text-primary-foreground font-bold py-3 px-6 rounded-lg hover:bg-primary/90 transition-colors">Subscribe</button>
    </form>
    <p class="text-xs text-gray-500 mt-4">We respect your privacy. Unsubscribe at any time.</p>
  </div>
</div>`
    }
  ];

  const [suggestions, setSuggestions] = useState<string[]>([]);

  const getApiErrorMessage = (error: unknown): string => {
      const defaultMessage = 'Failed to generate code. Please try again.';
      if (error instanceof Error && (error.message.includes('503') || error.message.includes('overloaded') || error.message.toLowerCase().includes('rate limit'))) {
          return "The AI model is currently overloaded or has reached its rate limit. Please try again in a moment. If the problem persists, you can add your own API key in the Settings page.";
      }
      return defaultMessage;
  };

  const handleSuggestionClick = (suggestion: string) => {
    setDescription(suggestion);
    setIsInputActive(false);
  };

  const handleDemoClick = () => {
    const demoPrompt = "A modern landing page hero section for a new AI-powered app called 'Nexus'. It should have a dark, futuristic theme with a glowing title, a short tagline, two call-to-action buttons ('Get Started' and 'View Demo'), and a placeholder image on the right that looks like an abstract neural network.";
    setDescription(demoPrompt);
    handleGenerateCode(demoPrompt);
  }

  const refreshSuggestions = () => {
    const numSuggestions = 4;
    let newSuggestions: string[];
    do {
      newSuggestions = [...promptSuggestions]
        .sort(() => 0.5 - Math.random())
        .slice(0, numSuggestions);
    } while (
      suggestions.length > 0 &&
      newSuggestions.every(s => suggestions.includes(s)) &&
      suggestions.every(s => newSuggestions.includes(s))
    );
    
    // Only update if the suggestions are actually different
    if (JSON.stringify(newSuggestions) !== JSON.stringify(suggestions)) {
      setSuggestions(newSuggestions);
    }
  };

  const {
    text: recognizedText,
    isListening,
    startListening,
    stopListening,
    hasRecognitionSupport,
    error: recognitionError,
  } = useSpeechRecognition();

  useEffect(() => {
    if (!carouselApi) {
      return
    }

    const handleSelect = () => {
      if(carouselApi) setActiveIndex(carouselApi.selectedScrollSnap());
    }

    carouselApi.on('select', handleSelect)
    handleSelect();

    return () => {
      carouselApi.off('select', handleSelect)
    }
  }, [carouselApi])

  useEffect(() => {
    setIsMounted(true);
    refreshSuggestions();
    return () => {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (files.length > 0 || isTyping) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('on-homepage');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('on-homepage');
    }
    return () => {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.remove('on-homepage');
    };
  }, [files.length, isTyping]);
  
  useEffect(() => {
    if (!isListening && recognizedText) {
      if (files.length > 0) {
          setEnhancementPrompt(recognizedText);
      } else {
          setDescription(recognizedText);
      }
    }
  }, [isListening, recognizedText, files.length]);


  useEffect(() => {
    if (recognitionError) {
      toast({
        variant: 'destructive',
        title: 'Speech Recognition Error',
        description: recognitionError,
      });
    }
  }, [recognitionError, toast]);


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (uri: string | null) => void) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const MAX_WIDTH = 1024;
                const MAX_HEIGHT = 1024;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, 0, 0, width, height);
                    const dataUrl = canvas.toDataURL(file.type);
                    setter(dataUrl);
                } else {
                    setter(null);
                    toast({ variant: 'destructive', title: 'Error', description: 'Could not process image.' });
                }
            };
            if(event.target?.result) {
                img.src = event.target.result as string;
            }
        };
        reader.readAsDataURL(file);
    } else {
        setter(null);
        if (file) {
            toast({ variant: 'destructive', title: 'Invalid File', description: 'Please select an image file.' });
        }
    }
    if(e.target) e.target.value = '';
  };

  const startTypingEffect = (newFiles: ProjectFile[]) => {
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
    }
    setFiles([]);
    setIsTyping(true);
    
    let currentFileIndex = 0;
    let currentCharIndex = 0;
    const typingSpeed = 10;
    const charsPerInterval = 5;

    const typeNextFile = () => {
      if (currentFileIndex >= newFiles.length) {
        setIsTyping(false);
        setViewMode('preview');
        if (newFiles.length > 0) {
          setSelectedFile(newFiles[0].name);
        }
        return;
      }

      const currentFile = newFiles[currentFileIndex];
      const currentContent = currentFile.content;
      
      // Switch to current file when starting to type it
      if (currentCharIndex === 0) {
        setSelectedFile(currentFile.name);
      }
      
      if (currentCharIndex < currentContent.length) {
        const nextCharIndex = Math.min(currentCharIndex + charsPerInterval, currentContent.length);
        const partialContent = currentContent.substring(0, nextCharIndex);
        
        setFiles(prevFiles => {
          const newFilesArray = [...prevFiles];
          const existingFileIndex = newFilesArray.findIndex(f => f.name === currentFile.name);
          
          if (existingFileIndex >= 0) {
            newFilesArray[existingFileIndex] = { ...currentFile, content: partialContent };
          } else {
            newFilesArray.push({ ...currentFile, content: partialContent });
          }
          
          return newFilesArray;
        });
        
        currentCharIndex = nextCharIndex;
        typingIntervalRef.current = setTimeout(typeNextFile, typingSpeed);
      } else {
        currentFileIndex++;
        currentCharIndex = 0;
        typingIntervalRef.current = setTimeout(typeNextFile, typingSpeed);
      }
    };

    typeNextFile();
  };

  const handleGenerateCode = async (prompt?: string) => {
    if (!user) return;
    const currentDescription = typeof prompt === 'string' ? prompt : description;
    if (typeof currentDescription !== 'string' || !currentDescription.trim()) {
      toast({
        variant: 'destructive',
        title: 'Description is required',
        description: 'Please describe the design you want to generate.',
      });
      return;
    }

    setIsLoading(true);
    generationCancelled.current = false;
    setViewMode('code');
    setMobileView('code');
    if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
    setFiles([]);
    setSelectedFile(null);
    try {
      const response = await fetch('/api/generate-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: currentDescription,
          imageDataUri: descriptionImageDataUri,
          apiKey: apiKey || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (generationCancelled.current) {
        handleNewPrompt();
        return;
      }
      startTypingEffect(result.files);
    } catch (error) {
      console.error('Error generating code:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: getApiErrorMessage(error),
      });
      setIsTyping(false);
      handleNewPrompt();
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleEnhanceCode = async () => {
    if (!enhancementPrompt.trim()) {
      toast({
        variant: 'destructive',
        title: 'Follow-up command is required',
        description: 'Please describe the change you want to make.',
      });
      return;
    }

    setIsEnhancing(true);
    setViewMode('code');
    setMobileView('code');
    if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
    try {
      const htmlFile = files.find(f => f.type === 'html');
      const jsFile = files.find(f => f.type === 'javascript');
      
      const response = await fetch('/api/enhance-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description,
          codeSnippet: htmlFile?.content || '',
          javascriptSnippet: jsFile?.content || '',
          enhancementPrompt,
          imageDataUri: enhancementImageDataUri,
          apiKey: apiKey || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // Create updated files array
      const updatedFiles = files.map(file => {
        if (file.type === 'html') {
          return { ...file, content: result.enhancedCodeSnippet };
        }
        if (file.type === 'javascript') {
          return { ...file, content: result.enhancedJavascriptSnippet };
        }
        return file;
      });
      
      startTypingEffect(updatedFiles);
      setEnhancementPrompt('');
      setEnhancementImageDataUri(null);
      toast({
          title: "Code Enhanced!",
          description: "Your design has been updated with your changes."
      })
    } catch (error) {
      console.error('Error enhancing code:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: getApiErrorMessage(error),
      });
      setIsTyping(false);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleNewPrompt = () => {
      setFiles([]);
      setSelectedFile(null);
      setDescription('');
      setDescriptionImageDataUri(null);
      setEnhancementPrompt('');
      setEnhancementImageDataUri(null);
      setViewMode('code');
      setMobileView('code');
      refreshSuggestions();
  }

  const handleResetCode = () => {
    // Reset functionality will be handled differently with file system
    toast({
      title: "Reset Not Available",
      description: "Reset functionality is not available in file-based mode."
    });
  };
  
  const handleCancelGeneration = () => {
    generationCancelled.current = true;
    setIsLoading(false);
    handleNewPrompt();
  }

  const handleStopTyping = () => {
    if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
    }
    setIsTyping(false);
    toast({
        title: "Generation Stopped",
        description: "The AI has stopped writing code."
    });
  }

  return (
    <div className={cn('h-full', files.length === 0 && !isTyping && 'bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900', 'relative overflow-x-hidden')}
      >
      {/* Enhanced Background with Gradient Overlay */}
      {files.length === 0 && !isTyping && (
        <>
          <video
            className="fixed inset-0 w-full h-full object-cover z-0"
            src="/bg3.mp4"
            autoPlay
            loop
            muted
            playsInline
            aria-hidden="true"
          />
          <div className="fixed inset-0 bg-gradient-to-br from-black/70 via-black/50 to-black/70 z-0 pointer-events-none" />
          <div className="fixed inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/40 z-0 pointer-events-none" />
        </>
      )}
      {isLoading && <GenerationLoader onCancel={handleCancelGeneration} />}
        {files.length === 0 && !isTyping ? (
            <div className="on-homepage overflow-y-auto h-full text-foreground relative z-10">
              <div className="relative min-h-screen flex flex-col items-center justify-end text-center text-white px-2 sm:px-4 lg:px-8">
                {/* Enhanced Main Content */}
                <div className="relative flex flex-col flex-1 items-center justify-end pb-8 max-w-5xl mx-auto px-2 sm:px-4 w-full">
                      <div className="space-y-2 mb-auto absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[75%] w-full max-w-full overflow-visible px-0 sm:px-4">
                          <span className="inline-block mb-3 px-4 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold uppercase tracking-wider shadow-md">AI Powered Builder</span>
                          <h1 className="w-full max-w-none text-3xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.15] px-2 sm:px-0 py-2 mb-2 bg-gradient-to-r from-primary to-blue-400 text-transparent bg-clip-text whitespace-nowrap overflow-visible">
                              <TypeAnimation
                                sequence={[
                                  'Build instantly with AI.',
                                  1800,
                                  'Get readymade snippets.',
                                  1800,
                                ]}
                                wrapper="span"
                                speed={60}
                                repeat={Infinity}
                                cursor={true}
                                className="whitespace-nowrap bg-gradient-to-r from-primary to-blue-400 text-transparent bg-clip-text"
                              />
                          </h1>
                          <p className="text-lg sm:text-2xl max-w-2xl mx-auto px-3 text-center text-white leading-relaxed drop-shadow-sm mt-3">
                              From a simple prompt to a fully functional webpage. Describe your vision, and our AI agent will build it.
                          </p>
                      </div>
                      <div className="w-full max-w-3xl pt-4 mt-auto pb-20 sm:pb-0 mx-2 sm:mx-0">
                          <div className="relative">
                              <Textarea
                                  id="description"
                                  placeholder=""
                                  value={description}
                                  onChange={(e) => setDescription(e.target.value)}
                                  onFocus={() => {
                                    if (!user) {
                                      setAuthDialogOpen(true);
                                      return;
                                    }
                                    setIsInputActive(true);
                                  }}
                                  onBlur={() => setIsInputActive(false)}
                                  rows={2}
                                  className="bg-white/10 backdrop-blur-sm border-2 border-primary/30 shadow-2xl rounded-3xl text-base sm:text-base text-left text-white placeholder-gray-400 focus-visible:ring-4 focus-visible:ring-primary/30 focus-visible:ring-offset-0 focus-visible:border-primary/60 transition-all duration-300 resize-none p-4 sm:p-6 pb-20 min-h-[120px] sm:min-h-[160px] w-full hover:bg-white/15 hover:border-primary/40"
                              />
                              {!isInputActive && !description && (
                                  <div className="absolute top-4 left-4 text-sm sm:text-base text-gray-400 pointer-events-none w-[calc(100%-2rem)] overflow-hidden text-left">
                                      <TypeAnimation
                                          sequence={[
                                              'A pricing page with three tiers...',
                                              2000,
                                              'A modern landing page for a SaaS product...',
                                              2000,
                                              'An interactive dashboard for an expense tracker...',
                                              2000,
                                          ]}
                                          wrapper="span"
                                          speed={60}
                                          repeat={Infinity}
                                          cursor={true}
                                          className="whitespace-nowrap"
                                      />
                                  </div>
                              )}
                              <div className="absolute bottom-4 left-2 sm:left-4 flex items-center gap-3 flex-wrap">
                                <DropdownMenu onOpenChange={(open) => { if (open) refreshSuggestions(); }}>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="rounded-full bg-white/15 backdrop-blur-sm border-white/30 text-white hover:bg-white/25 hover:text-white hover:border-white/40 px-4 flex items-center group transition-all duration-300 shadow-lg hover:shadow-xl"
                                    >
                                      <Lightbulb className="h-5 w-5 sm:mr-2 text-white transition-colors duration-200" />
                                      <span className="hidden sm:inline">Build Ideas</span>
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent className="bg-gray-900/90 backdrop-blur-lg border border-gray-700 text-white rounded-xl shadow-2xl p-2 min-w-[16rem] animate-fade-in-up">
                                    {suggestions.map((s, i) => (
                                      <DropdownMenuItem key={i} onClick={() => handleSuggestionClick(s)} className="cursor-pointer rounded-lg px-3 py-2 transition-colors duration-150 hover:!bg-blue-600/80 hover:!text-white focus:!bg-blue-600/80 focus:!text-white">
                                        {s}
                                      </DropdownMenuItem>
                                    ))}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>

                              <div className="absolute bottom-4 right-2 sm:right-4 flex items-center gap-2 flex-wrap">
                                  <input type="file" ref={descFileInputRef} onChange={(e) => handleFileChange(e, setDescriptionImageDataUri)} accept="image/*" className="hidden" />
                                  <Button
                                      size="icon"
                                      variant="ghost"
                                      onClick={() => descFileInputRef.current?.click()}
                                      className="h-9 w-9 text-gray-300 hover:bg-blue-600 hover:text-white focus:bg-blue-600 focus:text-white transition-colors"
                                      title="Attach Image"
                                  >
                                      <Paperclip className="h-5 w-5" />
                                      <span className="sr-only">Attach Image</span>
                                  </Button>
                                  {isMounted && hasRecognitionSupport && (
                                  <Button
                                      size="icon"
                                      variant={isListening ? 'destructive' : 'ghost'}
                                      onClick={() => isListening ? stopListening() : startListening()}
                                      className={twMerge(
                                        'h-9 w-9 text-gray-300 transition-colors',
                                        isListening ? 'bg-red-600 text-white' : 'hover:bg-blue-600 hover:text-white focus:bg-blue-600 focus:text-white'
                                      )}
                                      title={isListening ? 'Stop listening' : 'Start listening'}
                                  >
                                      {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                                      <span className="sr-only">{isListening ? 'Stop listening' : 'Start listening'}</span>
                                  </Button>
                                  )}
                                  <Button type="button" onClick={() => user ? handleGenerateCode() : setAuthDialogOpen(true)} disabled={isLoading} size="lg" className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white font-bold hidden sm:flex rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 px-8 py-3">
                                    <Wand2 className="mr-2 h-5 w-5"/>
                                    {isLoading ? 'Generating...' : 'Generate'}
                                  </Button>
                                  <Button type="button" onClick={() => user ? handleGenerateCode() : setAuthDialogOpen(true)} disabled={isLoading} size="icon" className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white font-bold p-3 sm:hidden rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                                    <Send className="h-5 w-5" />
                                  </Button>
                              </div>
                          </div>
                          {descriptionImageDataUri && (
                              <div className="text-left mt-2 text-xs sm:text-sm text-gray-300 bg-black/30 p-1.5 rounded-md flex items-center gap-1 w-fit">
                                  <span className="pl-1">Image attached</span>
                                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setDescriptionImageDataUri(null)}>
                                      <X className="h-4 w-4" />
                                  </Button>
                              </div>
                          )}
                      </div>
                  </div>
              </div>
              <section className="w-full py-12 flex flex-col items-center relative px-2 sm:px-4">
                {/* Demo Section Content (no separate video/overlay) */}
                <div className="relative z-10 w-full flex flex-col items-center px-2 sm:px-4">
                  <h2 className="text-2xl sm:text-4xl font-extrabold text-white mb-4 text-center">See Buildora in Action</h2>
                  <p className="text-base sm:text-lg text-zinc-400 text-center max-w-xl mb-8">Watch this quick demo to see how easily you can turn your ideas into a live website with AI.</p>
                  <div className="w-full max-w-4xl aspect-video rounded-xl overflow-hidden shadow-lg border border-zinc-800 mb-6 mx-auto">
                    <video
                      src="/demo.mp4"
                      autoPlay
                      loop
                      muted
                      playsInline
                      poster="/LOGO.png"
                      className="w-full h-full object-cover"
                    >
                      Your browser does not support the video tag.
                    </video>
                  </div>
                  {/* CTA and Download/Share Buttons in a Single Row */}
                  <div className="flex flex-wrap justify-center gap-2 mb-6 w-full items-center px-2 sm:px-0">
                    <a href="/" className="bg-blue-600 text-white px-4 py-1.5 rounded-lg font-bold text-sm hover:bg-blue-700 transition shadow-md w-full sm:w-auto text-center">Try Buildora Now</a>
                    <a
                      href="/demo.mp4"
                      download
                      className="group bg-gradient-to-tr from-blue-500/80 to-blue-400/80 text-white p-2 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:from-blue-600 hover:to-blue-500 focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 outline-none hover:scale-110 w-full sm:w-auto"
                      title="Download Video"
                    >
                      <Download className="h-5 w-5 drop-shadow group-hover:scale-110 transition-transform duration-200" />
                    </a>
                    <button
                      onClick={() => {
                        if (navigator.share) {
                          navigator.share({
                            title: 'Buildora Demo',
                            text: 'Check out this Buildora AI demo!',
                            url: window.location.origin + '/demo.mp4',
                          });
                        } else {
                          navigator.clipboard.writeText(window.location.origin + '/demo.mp4');
                          alert('Link copied to clipboard!');
                        }
                      }}
                      className="group bg-gradient-to-tr from-blue-500/80 to-blue-400/80 text-white p-2 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:from-blue-600 hover:to-blue-500 focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 outline-none hover:scale-110 w-full sm:w-auto"
                      title="Share Video"
                    >
                      <Share2 className="h-5 w-5 drop-shadow group-hover:scale-110 transition-transform duration-200" />
                    </button>
                  </div>
                </div>
              </section>
              <div className="flex flex-col gap-[5px]">
                <footer className="border-t border-zinc-800 py-10 px-4 mt-10 w-full">
  <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 w-full px-2 sm:px-4">
    <div className="flex flex-col items-center md:items-start gap-2">
      <span className="flex items-center gap-2">
        <img src="/LOGO.png" alt="Buildora Logo" className="h-8 w-auto mr-2" />
        <span className="text-2xl font-extrabold bg-gradient-to-r from-primary to-blue-400 text-transparent bg-clip-text">Buildora</span>
      </span>
      <span className="text-zinc-400 text-sm">AI-powered web page builder</span>
    </div>
    
    {/* Contact Information */}
    <div className="flex flex-col items-center gap-3 text-center">
      <div className="flex flex-col gap-1">
        <span className="text-sm text-zinc-400">Contact Info</span>
        <a href="mailto:vedantwankhade47@gmail.com" className="text-xs text-zinc-500 hover:text-blue-400 transition-colors">
          vedantwankhade47@gmail.com
        </a>
        <a href="tel:+919175988560" className="text-xs text-zinc-500 hover:text-blue-400 transition-colors">
          +91-9175988560
        </a>
        <span className="text-xs text-zinc-500">Amravati, Maharashtra, India</span>
      </div>
    </div>
    
    {/* Social Media Links */}
    <div className="flex gap-4">
      <a 
        href="https://www.linkedin.com/in/vedant-wankhade123" 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-zinc-400 hover:text-blue-400 transition-colors p-2 rounded-full bg-zinc-800 hover:bg-blue-900/20 shadow"
        title="LinkedIn"
      >
        <Linkedin className="h-6 w-6" />
      </a>
      <a 
        href="https://github.com/vedantwankhade123" 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-zinc-400 hover:text-blue-400 transition-colors p-2 rounded-full bg-zinc-800 hover:bg-blue-900/20 shadow"
        title="GitHub"
      >
        <Github className="h-6 w-6" />
      </a>
    </div>
    
    <div className="flex flex-col items-center md:items-end gap-2">
      <span className="text-sm text-zinc-400">&copy; {new Date().getFullYear()} Buildora. All rights reserved.</span>
      <div className="flex gap-3">
        <a href="#" className="text-xs text-zinc-500 hover:text-blue-400">Privacy</a>
        <a href="#" className="text-xs text-zinc-500 hover:text-blue-400">Terms</a>
      </div>
      <span className="text-xs text-zinc-500 text-center mt-2">Built by Vedant with Cursor</span>
    </div>
  </div>
</footer>
              </div>
            </div>
        ) : (
          <div className="h-screen pt-16 flex flex-col">
            {/* Mobile Toggle */}
            <div className="md:hidden flex items-center justify-center p-3 border-b bg-neutral-900/95 backdrop-blur-sm">
              <div className="flex bg-neutral-800/50 rounded-2xl p-1.5 shadow-lg border border-neutral-700/50">
                <Button
                  variant={mobileView === 'input' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setMobileView('input')}
                  className={cn(
                    "text-xs px-6 py-2.5 rounded-xl font-semibold transition-all duration-300 relative overflow-hidden",
                    mobileView === 'input' 
                      ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/25 hover:from-blue-700 hover:to-blue-600" 
                      : "text-neutral-300 hover:text-white hover:bg-neutral-700/50"
                  )}
                >
                  {mobileView === 'input' && (
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-blue-600/20 animate-pulse" />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <Pencil className="h-3.5 w-3.5" />
                    Input
                  </span>
                </Button>
                <Button
                  variant={mobileView === 'code' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setMobileView('code')}
                  className={cn(
                    "text-xs px-6 py-2.5 rounded-xl font-semibold transition-all duration-300 relative overflow-hidden",
                    mobileView === 'code' 
                      ? "bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-lg shadow-purple-500/25 hover:from-purple-700 hover:to-purple-600" 
                      : "text-neutral-300 hover:text-white hover:bg-neutral-700/50"
                  )}
                >
                  {mobileView === 'code' && (
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-purple-600/20 animate-pulse" />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <Code className="h-3.5 w-3.5" />
                    Code
                  </span>
                </Button>
              </div>
            </div>

            {/* Desktop Layout */}
            <div className="hidden md:flex flex-1 min-h-0 w-full">
              {files.length > 0 || isTyping ? (
                <ResizablePanelGroup 
                  direction="horizontal" 
                  className="flex-1 min-h-0 w-full overflow-hidden"
                >
                <ResizablePanel defaultSize={30} minSize={20} maxSize={50} className="w-full">
                    <div className="flex h-full flex-col bg-gradient-to-br from-gray-900/50 to-gray-800/50 backdrop-blur-md border border-gray-700/50 shadow-2xl rounded-2xl m-2 p-0 transition-all overflow-hidden"
                         style={{ boxShadow: '0 8px 32px 0 rgba(0,0,0,0.20)' }}>
                        <div className="p-4 space-y-2">
                            <Label className="font-semibold text-base">Original Prompt</Label>
                            <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md max-h-40 overflow-y-auto">
                                {description}
                            </div>
                        </div>

                        <Separator />

                        <div className="p-4 flex flex-col gap-2 flex-1 min-h-0">
                            <Label htmlFor="enhancement-prompt" className="font-semibold text-base shrink-0">What do you want to change?</Label>
                            <div className="relative flex-1">
                                <Textarea
                                    id="enhancement-prompt"
                                    placeholder="e.g., 'Change the primary button color to orange' or 'Add a section about our team'"
                                    value={enhancementPrompt}
                                    onChange={(e) => setEnhancementPrompt(e.target.value)}
                                    className="bg-card pr-24 resize-none text-sm absolute inset-0 h-full w-full"
                                />
                                <div className="absolute bottom-2 right-2 flex items-center gap-2">
                                    <input type="file" ref={enhanceFileInputRef} onChange={(e) => handleFileChange(e, setEnhancementImageDataUri)} accept="image/*" className="hidden" />
                                    <Button
                                        size="icon"
                                        variant="outline"
                                        onClick={() => enhanceFileInputRef.current?.click()}
                                        className="h-8 w-8 hover:bg-blue-600 hover:text-white focus:bg-blue-600 focus:text-white transition-colors"
                                        title="Attach Image"
                                    >
                                        <Paperclip className="h-4 w-4" />
                                        <span className="sr-only">Attach Image</span>
                                    </Button>
                                    {isMounted && hasRecognitionSupport && (
                                        <Button
                                        size="icon"
                                        variant={isListening ? 'destructive' : 'outline'}
                                        onClick={() => isListening ? stopListening() : startListening()}
                                        className={twMerge(
                                          'h-8 w-8 transition-colors',
                                          isListening ? 'bg-red-600 text-white' : 'hover:bg-blue-600 hover:text-white focus:bg-blue-600 focus:text-white'
                                        )}
                                        title={isListening ? 'Stop listening' : 'Start listening'}
                                        >
                                        {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                                        <span className="sr-only">{isListening ? 'Stop listening' : 'Start listening'}</span>
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                        {enhancementImageDataUri && (
                            <div className="px-4 pb-4 flex items-center gap-2">
                                <div className="text-sm text-muted-foreground bg-muted p-1.5 rounded-md flex items-center gap-1 w-fit">
                                    <span className="pl-1">Image attached</span>
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setEnhancementImageDataUri(null)}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                        <div className="p-4 border-t bg-background space-y-2 mb-4">
                            {isTyping ? (
                                <Button variant="destructive" onClick={handleStopTyping} className="w-full">
                                    <StopCircle className="mr-2 h-4 w-4" /> Stop Generating
                                </Button>
                            ) : (
                                <div className="flex flex-row gap-2 w-full">
                                  <Button onClick={handleEnhanceCode} disabled={isLoading || isEnhancing} className="min-w-[44%] px-3 py-2 flex-1 rounded-xl">
                                    {isEnhancing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                                    <span className="hidden sm:inline">{isEnhancing ? 'Enhancing...' : 'Enhance Design'}</span>
                                  </Button>
                                  <Button variant="outline" onClick={handleResetCode} disabled={isTyping} size="icon" title="Reset Code" className="hover:bg-blue-600 hover:text-white focus:bg-blue-600 focus:text-white rounded-xl">
                                    <Undo className="h-4 w-4" />
                                    <span className="sr-only">Reset Code</span>
                                  </Button>
                                  <Button variant="outline" onClick={handleNewPrompt} size="icon" title="Start Over" className="hover:bg-blue-600 hover:text-white focus:bg-blue-600 focus:text-white rounded-xl">
                                    <Pencil className="h-4 w-4" />
                                    <span className="sr-only">Start Over</span>
                                  </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={70} minSize={50} className="w-full">
                  <div className="h-full w-full flex flex-col bg-gradient-to-br from-gray-900/50 to-gray-800/50 backdrop-blur-sm rounded-2xl m-2 mr-4 border border-gray-700/50 shadow-2xl overflow-hidden">
                    {/* Enhanced Results Header */}
                    <div className="flex items-center justify-between p-3 border-b border-gray-700/50 bg-gradient-to-r from-gray-800/50 to-gray-700/50 rounded-t-2xl">
                      <div className="flex items-center gap-3">
                        <Button 
                          onClick={handleNewPrompt}
                          variant="outline" 
                          size="icon" 
                          className="bg-gradient-to-r from-gray-600/20 to-gray-500/20 hover:from-gray-600/30 hover:to-gray-500/30 border-gray-500/30 hover:border-gray-500/50 text-gray-300 hover:text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
                          title="Back to Home"
                        >
                          <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <h3 className="text-lg font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">Results</h3>
                      </div>
                      <Button 
                        onClick={() => setFileExplorerOpen(!fileExplorerOpen)} 
                        variant={fileExplorerOpen ? 'secondary' : 'outline'} 
                        size="sm" 
                        className="bg-gradient-to-r from-blue-600/20 to-blue-500/20 hover:from-blue-600/30 hover:to-blue-500/30 border-blue-500/30 hover:border-blue-500/50 text-blue-300 hover:text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
                      >
                        <FolderOpen className="mr-2 h-4 w-4" />
                        Files
                      </Button>
                    </div>
                    
                    {/* Results Content */}
                    <div className="flex-1 p-2 overflow-hidden">
                      <MultiFileEditor 
                        files={files}
                        selectedFile={selectedFile}
                        onFileContentChange={(fileName, content) => {
                          setFiles(prevFiles => 
                            prevFiles.map(file => 
                              file.name === fileName ? { ...file, content } : file
                            )
                          );
                        }}
                        isTyping={isTyping} 
                        viewMode={viewMode}
                        setViewMode={setViewMode}
                        onNewPrompt={handleNewPrompt}
                        fileExplorerOpen={fileExplorerOpen}
                        onToggleFileExplorer={() => setFileExplorerOpen(!fileExplorerOpen)}
                      />
                    </div>
                  </div>
                </ResizablePanel>
              </ResizablePanelGroup>
              ) : (
                <div className="flex-1 min-h-0 w-full flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <p>Generate some code to see the canvas interface</p>
                  </div>
                </div>
              )}
            </div>

            {/* File Explorer */}
            <FileExplorer
              files={files}
              selectedFile={selectedFile}
              onFileSelect={setSelectedFile}
              isOpen={fileExplorerOpen}
              onToggle={() => setFileExplorerOpen(!fileExplorerOpen)}
            />

            {/* Mobile Layout */}
            <div className="md:hidden flex-1 min-h-0 w-full">
              {mobileView === 'input' ? (
                <div className="flex h-full flex-col bg-white/10 backdrop-blur-md border border-primary/40 shadow-lg rounded-2xl m-2 p-0 transition-all"
                     style={{ boxShadow: '0 4px 32px 0 rgba(0,0,0,0.10)', border: '1.5px solid var(--primary, #3b82f6)' }}>
                  <div className="p-3 space-y-2">
                    <Label className="font-semibold text-sm">Original Prompt</Label>
                    <div className="text-xs text-muted-foreground bg-muted p-2 rounded-md max-h-32 overflow-y-auto results-scrollbar">
                      {description}
                    </div>
                  </div>

                  <Separator />

                  <div className="p-3 flex flex-col gap-2 flex-1 min-h-0">
                    <Label htmlFor="enhancement-prompt-mobile" className="font-semibold text-sm shrink-0">What do you want to change?</Label>
                    <div className="relative flex-1">
                      <Textarea
                        id="enhancement-prompt-mobile"
                        placeholder="e.g., 'Change the primary button color to orange' or 'Add a section about our team'"
                        value={enhancementPrompt}
                        onChange={(e) => setEnhancementPrompt(e.target.value)}
                        className="bg-card pr-20 resize-none text-xs absolute inset-0 h-full w-full"
                      />
                      <div className="absolute bottom-2 right-2 flex items-center gap-1">
                        <input type="file" ref={enhanceFileInputRef} onChange={(e) => handleFileChange(e, setEnhancementImageDataUri)} accept="image/*" className="hidden" />
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => enhanceFileInputRef.current?.click()}
                          className="h-7 w-7 hover:bg-blue-600 hover:text-white focus:bg-blue-600 focus:text-white transition-colors"
                          title="Attach Image"
                        >
                          <Paperclip className="h-3 w-3" />
                          <span className="sr-only">Attach Image</span>
                        </Button>
                        {isMounted && hasRecognitionSupport && (
                          <Button
                            size="icon"
                            variant={isListening ? 'destructive' : 'outline'}
                            onClick={() => isListening ? stopListening() : startListening()}
                            className={twMerge(
                              'h-7 w-7 transition-colors',
                              isListening ? 'bg-red-600 text-white' : 'hover:bg-blue-600 hover:text-white focus:bg-blue-600 focus:text-white'
                            )}
                            title={isListening ? 'Stop listening' : 'Start listening'}
                          >
                            {isListening ? <MicOff className="h-3 w-3" /> : <Mic className="h-3 w-3" />}
                            <span className="sr-only">{isListening ? 'Stop listening' : 'Start listening'}</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                  {enhancementImageDataUri && (
                    <div className="px-3 pb-3 flex items-center gap-2">
                      <div className="text-xs text-muted-foreground bg-muted p-1 rounded-md flex items-center gap-1 w-fit">
                        <span className="pl-1">Image attached</span>
                        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setEnhancementImageDataUri(null)}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                  <div className="p-3 border-t bg-background space-y-2">
                    {isTyping ? (
                      <Button variant="destructive" onClick={handleStopTyping} className="w-full text-sm">
                        <StopCircle className="mr-2 h-4 w-4" /> Stop Generating
                      </Button>
                    ) : (
                      <div className="flex flex-row gap-2 w-full">
                        <Button onClick={handleEnhanceCode} disabled={isLoading || isEnhancing} className="min-w-[44%] px-2 py-2 flex-1 rounded-xl text-xs">
                          {isEnhancing ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Wand2 className="mr-1 h-3 w-3" />}
                          <span>{isEnhancing ? 'Enhancing...' : 'Enhance'}</span>
                        </Button>
                        <Button variant="outline" onClick={handleResetCode} disabled={isTyping} size="icon" title="Reset Code" className="hover:bg-blue-600 hover:text-white focus:bg-blue-600 focus:text-white rounded-xl h-8 w-8">
                          <Undo className="h-3 w-3" />
                          <span className="sr-only">Reset Code</span>
                        </Button>
                        <Button variant="outline" onClick={handleNewPrompt} size="icon" title="Start Over" className="hover:bg-blue-600 hover:text-white focus:bg-blue-600 focus:text-white rounded-xl h-8 w-8">
                          <Pencil className="h-3 w-3" />
                          <span className="sr-only">Start Over</span>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="h-full w-full p-2 results-scrollbar">
                  <MultiFileEditor 
                    files={files}
                    selectedFile={selectedFile}
                    onFileContentChange={(fileName, content) => {
                      setFiles(prevFiles => 
                        prevFiles.map(file => 
                          file.name === fileName ? { ...file, content } : file
                        )
                      );
                    }}
                    isTyping={isTyping} 
                    viewMode={viewMode}
                    setViewMode={setViewMode}
                    onNewPrompt={handleNewPrompt}
                    fileExplorerOpen={fileExplorerOpen}
                    onToggleFileExplorer={() => setFileExplorerOpen(!fileExplorerOpen)}
                  />
                </div>
              )}
            </div>
          </div>
        )}
        <ComponentPreviewDialog
            isOpen={!!selectedSnippet}
            onOpenChange={(open) => !open && setSelectedSnippet(null)}
            snippet={selectedSnippet}
        />
        <Dialog open={authDialogOpen} onOpenChange={setAuthDialogOpen}>
          <DialogContent className="p-0 bg-transparent border-0 shadow-none max-w-4xl w-full">
            <DialogTitle className="sr-only">Sign In or Sign Up</DialogTitle>
            <AuthModalForm onAuthSuccess={() => setAuthDialogOpen(false)} onClose={() => setAuthDialogOpen(false)} />
          </DialogContent>
        </Dialog>
    </div>
  );
}

    
