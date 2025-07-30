
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FileCode, Code, Wrench, VenetianMask, BookOpen, LifeBuoy, User, LogIn, Settings, Menu, X, Eye, EyeOff, Mail, Twitter, Github, Linkedin, Send, Download, Share2, ArrowLeft, Bot, AlertTriangle } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { TypeAnimation } from 'react-type-animation';
import React, { useState, useEffect } from 'react';
import { useForm } from "react-hook-form";
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogTrigger, DialogContent, DialogTitle } from '@/components/ui/dialog';
import SettingsPage from '@/app/settings/page';
import { FcGoogle } from 'react-icons/fc';
import { useRouter } from 'next/navigation';
import { Dialog as HeadlessDialog } from '@headlessui/react';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/hooks/use-user';
import { useApiKey } from '@/hooks/use-api-key';

function AuthModalForm({ onAuthSuccess, onClose }: { onAuthSuccess: () => void; onClose: () => void; }) {
  const [mode, setMode] = React.useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [info, setInfo] = React.useState<string | null>(null);
  const [showPassword, setShowPassword] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: `${firstName} ${lastName}`.trim(),
            },
          },
        });
        if (error) {
          if (error.message.toLowerCase().includes('already registered')) {
            setError('User already exists, please sign in instead.');
            setMode('signin');
          } else {
            setError(error.message || 'Signup failed');
          }
          setLoading(false);
          return;
        }
        setInfo('Signup successful! Please check your email for a confirmation link.');
        onAuthSuccess();
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          if (error.message.toLowerCase().includes('invalid login credentials')) {
            setError('Invalid credentials. If you signed up with Google, please use "Continue with Google".');
          } else if (error.message.toLowerCase().includes('user not found')) {
            setError('No account found with this email. Please sign up first.');
          } else if (error.message.toLowerCase().includes('email not confirmed')) {
            setError('Please confirm your email before signing in.');
          } else {
            setError(error.message || 'Authentication failed');
          }
          setLoading(false);
          return;
        }
        setInfo('Sign in successful!');
        onAuthSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
      if (error) throw error;
      onAuthSuccess();
    } catch (err: any) {
      setError(err.message || 'Google sign in failed');
    } finally {
      setLoading(false);
    }
  };

  const AppleIcon = (props: any) => (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      height="1.2em"
      width="1.2em"
      {...props}
    >
      <path d="M19.39 10.22C19.36 6.3 17.38 4.31 15.32 4.31C13.23 4.31 11.96 5.66 11.12 5.66C10.27 5.66 9.19 4.31 7.25 4.31C5.2 4.31 3.12 6.33 3.12 10.32C3.12 15.35 6.33 20.09 8.61 20.09C10.06 20.09 10.79 19.31 12.23 19.31C13.67 19.31 14.33 20.09 15.86 20.09C18.14 20.09 21.35 15.35 21.35 10.42C21.35 10.32 21.35 10.22 19.39 10.22M12.23 3.41C13.05 2.5 14.03 1.91 15.11 1.91C15.22 1.91 16.59 2.07 17.58 3.29C16.51 4 15.52 4.63 14.41 4.63C13.31 4.63 12.42 4 12.23 3.41M8.78 3.22C7.79 2 6.38 1.91 6.22 1.91C5.15 1.91 4.16 2.5 3.34 3.41C4.16 4 5.09 4.54 6.22 4.54C7.22 4.54 8.04 4 8.78 3.22Z" />
    </svg>
  );

  return (
    <div className="flex w-full bg-[#18181B] rounded-2xl overflow-hidden shadow-2xl min-h-[70vh]">
      {/* Left Panel */}
      <div className="w-1/2 relative hidden md:block">
        <video
          src="/bg3.mp4"
          autoPlay
          loop
          muted
          className="absolute top-0 left-0 w-full h-full object-cover"
        />
        <div className="absolute top-0 left-0 w-full h-full bg-black/40" />
        <div className="relative z-10 flex flex-col justify-between h-full p-10 text-white">
          <div>
            <div className="flex items-center gap-3">
              <img src="/LOGO.png" alt="Buildora Logo" className="h-8 w-auto" />
              <span className="text-2xl font-extrabold bg-gradient-to-r from-primary to-blue-400 text-transparent bg-clip-text">Buildora</span>
            </div>
            <button 
              onClick={onClose}
              className="absolute top-8 right-8 bg-white/20 hover:bg-white/30 text-white text-sm font-semibold py-2 px-4 rounded-full backdrop-blur-sm transition-colors duration-200">
              Back to website →
            </button>
          </div>
          <div className="text-center">
            <h2 className="text-4xl font-bold">Build your vision, instantly.</h2>
            <p className="text-4xl font-bold text-gray-300">From prompt to production.</p>
            <div className="flex justify-center gap-2 mt-6">
              <span className="w-6 h-1 bg-white/50 rounded-full" />
              <span className="w-6 h-1 bg-white/50 rounded-full" />
              <span className="w-6 h-1 bg-white rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-full md:w-1/2 p-8 sm:p-12 flex flex-col justify-center bg-[#2C2C3A] text-white">
        <div>
          <h2 className="text-3xl font-bold mb-2">
            {mode === 'signup' ? 'Create an account' : 'Sign In'}
          </h2>
          <p className="text-gray-400 mb-8">
            {mode === 'signup' ? 'Already have an account? ' : "Don't have an account? "}
            <button
              onClick={() => setMode(mode === 'signup' ? 'signin' : 'signup')}
              className="font-semibold text-blue-400 hover:underline"
            >
              {mode === 'signup' ? 'Log in' : 'Sign up'}
            </button>
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div className="flex gap-4">
                <input
                  type="text"
                  placeholder="First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full p-3 bg-[#3A3A4A] rounded-lg border border-transparent focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 outline-none text-white"
                  required
                />
                <input
                  type="text"
                  placeholder="Last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full p-3 bg-[#3A3A4A] rounded-lg border border-transparent focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 outline-none text-white"
                  required
                />
              </div>
            )}
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 bg-[#3A3A4A] rounded-lg border border-transparent focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 outline-none text-white"
              required
            />
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 bg-[#3A3A4A] rounded-lg border border-transparent focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 outline-none pr-12 text-white"
                required
              />
              <button
                type="button"
                tabIndex={-1}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            
            {mode === 'signup' && (
              <div className="flex items-center">
                <input id="terms" type="checkbox" className="h-4 w-4 rounded bg-[#3A3A4A] border-gray-500 text-blue-500 focus:ring-blue-500" required />
                <label htmlFor="terms" className="ml-2 text-sm text-gray-400">
                  I agree to the <a href="#" className="underline hover:text-white">Terms & Conditions</a>
                </label>
              </div>
            )}
            
            {error && <div className="text-red-400 text-sm text-center font-semibold">{error}</div>}
            {info && <div className="text-green-400 text-sm text-center font-semibold">{info}</div>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Processing...' : (mode === 'signup' ? 'Create account' : 'Sign In')}
            </button>
          </form>

          <div className="flex items-center my-6">
            <div className="flex-grow border-t border-gray-600" />
            <span className="flex-shrink-0 mx-4 text-gray-400 text-sm">Or continue with</span>
            <div className="flex-grow border-t border-gray-600" />
          </div>

          <button
            onClick={handleGoogle}
            disabled={loading}
            className="w-full flex justify-center items-center gap-3 bg-white text-gray-900 font-semibold py-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <FcGoogle size={20} /> Continue with Google
          </button>
        </div>
      </div>
    </div>
  );
}

export { AuthModalForm };

export function Header() {
  // All hooks must be called at the top, before any early return
  const pathname = usePathname();
  const isHome = pathname === '/';
  const isSettings = pathname === '/settings';
  const { user } = useUser();
  const { apiKey } = useApiKey();
  const [open, setOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [mode, setMode] = React.useState<'signin' | 'signup'>('signin');
  const setModeHandler = (mode: 'signin' | 'signup') => setMode(mode);
  const [imgError, setImgError] = React.useState(false);
  React.useEffect(() => { setImgError(false); }, [user?.user_metadata?.avatar_url]);

  // API Key warning banner state
  const [showApiKeyWarning, setShowApiKeyWarning] = useState(false);

  // Hide-on-scroll logic
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          setScrolled(currentScrollY > 10);
          if (currentScrollY < 50) {
            setShowHeader(true);
          } else if (currentScrollY > lastScrollY) {
            setShowHeader(false); // scrolling down
          } else {
            setShowHeader(true); // scrolling up
          }
          setLastScrollY(currentScrollY);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Check if API key warning should be shown
  useEffect(() => {
    // Check if user has dismissed the warning before
    let hasDismissedWarning = false;
    try {
      hasDismissedWarning = localStorage.getItem('apiKeyWarningDismissed') === 'true';
    } catch (error) {
      // localStorage might not be available (SSR, disabled, etc.)
      console.warn('localStorage not available:', error);
    }
    
    if (user && !apiKey && !isSettings && !hasDismissedWarning) {
      setShowApiKeyWarning(true);
    } else {
      setShowApiKeyWarning(false);
    }
  }, [user, apiKey, isSettings]);

  // Reset dismissed state when user adds an API key or logs out
  useEffect(() => {
    try {
      if (user && apiKey) {
        localStorage.removeItem('apiKeyWarningDismissed');
      } else if (!user) {
        // Clear dismissed state when user logs out
        localStorage.removeItem('apiKeyWarningDismissed');
      }
    } catch (error) {
      // localStorage might not be available (SSR, disabled, etc.)
      console.warn('localStorage not available:', error);
    }
  }, [user, apiKey]);

  // Helper to get initials
  function getInitials(user: any) {
    if (user?.user_metadata?.full_name) {
      const parts = user.user_metadata.full_name.trim().split(' ');
      if (parts.length === 1) return parts[0][0].toUpperCase();
      return (parts[0][0] + (parts[1][0] || '')).toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  }

  React.useEffect(() => {
    if (!open) return;
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const navButtonClass = cn(
    'md:w-auto md:px-3',
    (isHome || isSettings) && 'bg-transparent text-white hover:bg-white/10 hover:text-white'
  );

  // Helper to handle protected navigation
  const handleProtectedNav = (href: string) => (e: React.MouseEvent) => {
    if (!user) {
      e.preventDefault();
      setAuthModalOpen(true); // Open the authentication modal
    } else {
      router.push(href);
    }
  };

  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);
  const [authModalOpen, setAuthModalOpen] = React.useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = React.useState(false);

  // Only render header if not on /analyzer
  const shouldShowHeader = !pathname.startsWith('/analyzer');

  if (!shouldShowHeader) return null;

  return (
    <>
      <header
        className={cn(
          'fixed top-2.5 left-0 right-0 z-50 transition-all duration-300',
          'mx-[10px] rounded-xl',
          'px-2 md:px-4',
          showHeader ? 'translate-y-0' : '-translate-y-[120%]',
          scrolled ? 'bg-black/70 backdrop-blur-md shadow-lg' : 'bg-transparent'
        )}
        style={{ willChange: 'transform, background' }}
      >
        <div className="flex h-16 items-center px-2 md:px-4 justify-between flex-wrap gap-x-2 w-full">
          {/* Mobile: Logo left, actions right */}
          <div className="flex items-center w-full md:w-auto justify-between">
            <Link href="/" className="flex items-center gap-1 md:gap-0 flex-shrink-0">
              <img src="/LOGO.png" alt="Buildora Logo" className="h-8 w-auto md:h-14 -mr-2 md:-mr-3 animate-spin-pause" />
              <div className="flex items-center gap-1.5">
                <span className="text-xl md:text-3xl font-extrabold ml-1 md:ml-2 bg-gradient-to-r from-primary to-blue-400 text-transparent bg-clip-text drop-shadow-md" style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 900 }}>
                  Buildora
                </span>
                <span className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[10px] md:text-xs font-semibold px-1.5 py-0.5 rounded-md shadow-sm border border-emerald-400/20 backdrop-blur-sm">
                  BETA
                </span>
              </div>
            </Link>
            <div className="flex items-center gap-1 md:hidden">
              {user ? (
                <>
                  <Avatar className="h-8 w-8 border-2 border-primary shadow-md">
                    <AvatarImage src={user.user_metadata?.avatar_url || undefined} alt={user.user_metadata?.full_name || user.email || 'User'} />
                    <AvatarFallback>{getInitials(user)}</AvatarFallback>
                  </Avatar>
                  <button className="flex items-center justify-center p-2 rounded-md text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-primary ml-1" onClick={() => setMobileNavOpen(true)}>
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Open navigation</span>
                  </button>
                </>
              ) : (
                <Button size="sm" className="rounded-full font-semibold px-3 py-1 text-xs" onClick={() => setAuthModalOpen(true)}>
                  Get Started
                </Button>
              )}
            </div>
          </div>
          {/* Desktop: Logo left, nav center, actions right (unchanged) */}
          <nav className="hidden md:flex items-center gap-2 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex-wrap">
            {(!isHome || user) && (
              <></>
            )}
            {/* Snippet Library button will be moved to the right section */}
          </nav>
          <div className="hidden md:flex items-center gap-2 mr-2 md:mr-10 relative z-10 flex-row-reverse md:flex-row flex-wrap">
            {/* Profile dropdown: only show on desktop */}
            {user && (
              <>
                {/* Snippet Library button to the left of profile */}
                <Button variant={'ghost'} className={navButtonClass} asChild>
                  <a href="/snippets">
                    <Code className="h-4 w-4 md:mr-2" />
                    <span className="sr-only md:not-sr-only">Snippet Library</span>
                  </a>
                </Button>
                <div className="relative hidden md:block" ref={dropdownRef}>
                  <button
                    className={
                      navButtonClass +
                      ' flex items-center gap-3 px-2 py-1 rounded-full transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 hover:bg-white/10 hover:text-white'
                    }
                    onClick={() => setOpen(o => !o)}
                  >
                    <Avatar className="h-8 w-8 border-2 border-primary shadow-md">
                      <AvatarImage src={user.user_metadata?.avatar_url || undefined} alt={user.user_metadata?.full_name || user.email || 'User'} />
                      <AvatarFallback>{getInitials(user)}</AvatarFallback>
                    </Avatar>
                    <span className="font-semibold text-white text-base max-w-[120px] truncate hidden lg:block">{user.user_metadata?.full_name || user.email || 'User'}</span>
                    <svg className="h-4 w-4 text-primary transition-transform duration-200 group-hover:rotate-180" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                  </button>
                    {open && (
                      <div className="absolute right-0 mt-2 w-80 bg-black/90 backdrop-blur-lg text-white rounded-2xl shadow-2xl z-50 border border-zinc-800 animate-fade-in flex flex-col overflow-hidden ring-1 ring-primary/20">
                        <div className="px-6 py-5 flex items-center gap-4 bg-white/5 border-b border-zinc-800">
                          <Avatar className="h-14 w-14 border-2 border-primary shadow-lg">
                            <AvatarImage src={user.user_metadata?.avatar_url || undefined} alt={user.user_metadata?.full_name || user.email || 'User'} />
                            <AvatarFallback className="text-2xl">{getInitials(user)}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col min-w-0">
                            <span className="text-lg font-bold text-white truncate">{user.user_metadata?.full_name || 'User'}</span>
                            <span className="text-sm text-zinc-300 truncate">{user.email}</span>
                          </div>
                        </div>
                        <div className="border-t border-zinc-800" />
                        <div className="py-3 flex flex-col gap-1 bg-black/60">
                          <Link href="/settings" className="flex items-center gap-3 w-full text-left px-6 py-3 rounded-lg font-medium hover:bg-primary/10 hover:text-primary transition-all duration-150 group focus:outline-none focus:ring-2 focus:ring-primary">
                            <Settings className="h-5 w-5 text-primary/80 group-hover:text-primary" />
                            Settings
                          </Link>
                          <button className="flex items-center gap-3 w-full text-left px-6 py-3 rounded-lg font-medium hover:bg-red-900/30 hover:text-red-400 transition-all duration-150 group focus:outline-none focus:ring-2 focus:ring-red-400" onClick={async () => { await supabase.auth.signOut(); setOpen(false); router.refresh(); }}>
                            <LogIn className="h-5 w-5 text-red-400 group-hover:text-red-500 rotate-180" />
                            Log out
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
              </>
            )}
            {!user && isHome && (
              <div className="flex gap-2">
                {/* <Button variant={'ghost'} className={navButtonClass} asChild>
                  <a href="/docs">
                    <LifeBuoy className="h-4 w-4 sm:mr-2" />
                    <span className="sr-only sm:not-sr-only">Docs</span>
                  </a>
                </Button> */}
                <Button className="ml-0 rounded-full font-semibold" onClick={() => setAuthModalOpen(true)}>
                  Get Started
                </Button>
              </div>
            )}
            {!user && !isHome && (
              <Button className="ml-auto rounded-full font-semibold" onClick={() => setAuthModalOpen(true)}>
                Get Started
              </Button>
            )}
          </div>
          {/* Mobile nav modal */}
          <HeadlessDialog open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} className="fixed inset-0 z-[100]">
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" aria-hidden="true" onClick={() => setMobileNavOpen(false)} />
            <div className="fixed top-0 right-0 w-full max-w-xs h-full bg-gradient-to-b from-zinc-900 via-zinc-900/95 to-black shadow-2xl z-[101] overflow-hidden">
              {/* Header with close button */}
              <div className="flex items-center justify-between p-6 border-b border-zinc-800/50 bg-zinc-900/50 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <img src="/LOGO.png" alt="Buildora Logo" className="h-8 w-auto animate-spin-pause" />
                  <span className="text-xl font-extrabold bg-gradient-to-r from-primary to-blue-400 text-transparent bg-clip-text">Buildora</span>
                </div>
                <button 
                  className="p-2.5 rounded-xl bg-gradient-to-r from-zinc-800/60 to-zinc-700/60 hover:from-zinc-700/60 hover:to-zinc-600/60 text-white transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-zinc-500/20 border border-zinc-700/50 hover:border-zinc-600/70" 
                  onClick={() => setMobileNavOpen(false)}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Content area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* User profile section */}
                {user && (
                  <div className="bg-gradient-to-r from-zinc-800/50 to-zinc-700/50 rounded-2xl p-6 border border-zinc-700/50 backdrop-blur-sm">
                    <div className="flex items-center gap-4 mb-4">
                      <Avatar className="h-16 w-16 border-2 border-primary/50 shadow-lg">
                        <AvatarImage 
                          src={user.user_metadata?.avatar_url || undefined} 
                          alt={user.user_metadata?.full_name || user.email || 'User'} 
                          onError={() => setImgError(true)} 
                        />
                        <AvatarFallback className="text-2xl font-bold">{getInitials(user)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-white truncate">{user.user_metadata?.full_name || 'User'}</h3>
                        <p className="text-sm text-zinc-400 truncate">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link 
                        href="/settings" 
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gradient-to-r from-blue-600/80 to-blue-500/80 hover:from-blue-600 hover:to-blue-500 text-white rounded-lg font-medium text-sm transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25 border border-blue-500/30 hover:border-blue-400/50" 
                        onClick={() => setMobileNavOpen(false)}
                      >
                        <Settings className="h-3.5 w-3.5" />
                        Settings
                      </Link>
                      <button
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gradient-to-r from-red-600/80 to-red-500/80 hover:from-red-600 hover:to-red-500 text-white rounded-lg font-medium text-sm transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-red-500/25 border border-red-500/30 hover:border-red-400/50"
                        onClick={async () => { await supabase.auth.signOut(); setMobileNavOpen(false); router.refresh(); }}
                      >
                        <LogIn className="h-3.5 w-3.5 rotate-180" />
                        Log out
                      </button>
                    </div>
                  </div>
                )}

                {/* Navigation links */}
                <div className="space-y-2">
                  {user && (
                    <Link 
                      href="/snippets" 
                      className="flex items-center gap-3 w-full p-4 bg-gradient-to-r from-zinc-800/50 to-zinc-700/50 hover:from-zinc-700/50 hover:to-zinc-600/50 text-white rounded-xl font-semibold transition-all duration-300 hover:scale-[1.02] group border border-zinc-700/50 hover:border-zinc-600/70 hover:shadow-lg hover:shadow-zinc-500/10" 
                      onClick={() => setMobileNavOpen(false)}
                    >
                      <div className="p-2.5 bg-gradient-to-r from-blue-500/30 to-purple-500/30 rounded-xl group-hover:from-blue-500/40 group-hover:to-purple-500/40 transition-all duration-300 shadow-lg">
                        <Code className="h-5 w-5 text-blue-300 group-hover:text-blue-200" />
                      </div>
                      <span>Snippet Library</span>
                      <ArrowLeft className="h-4 w-4 ml-auto text-zinc-500 group-hover:text-zinc-300 transition-all duration-300 rotate-180 group-hover:translate-x-1" />
                    </Link>
                  )}
                  
                  {/* Add more navigation items here */}
                  <div className="flex items-center gap-3 w-full p-4 bg-gradient-to-r from-zinc-800/30 to-zinc-700/30 text-zinc-500 rounded-xl border border-zinc-700/30 opacity-75">
                    <div className="p-2.5 bg-gradient-to-r from-zinc-600/30 to-zinc-500/30 rounded-xl shadow-lg">
                      <Bot className="h-5 w-5 text-zinc-500" />
                    </div>
                    <span className="font-medium">AI Features</span>
                    <span className="ml-auto text-xs bg-gradient-to-r from-zinc-700/50 to-zinc-600/50 px-3 py-1.5 rounded-full font-medium border border-zinc-600/50">Coming Soon</span>
                  </div>
                </div>

                {/* Footer */}
                <div className="pt-6 border-t border-zinc-800/50">
                  <div className="text-center text-zinc-500 text-sm">
                    <p className="mb-2">Built with ❤️ by Vedant</p>
                    <p className="text-xs">Powered by Cursor AI</p>
                  </div>
                </div>
              </div>
            </div>
          </HeadlessDialog>
          <Dialog open={authModalOpen} onOpenChange={setAuthModalOpen}>
            <DialogContent className="bg-transparent p-0 border-0 max-w-4xl w-full">
              <DialogTitle className="sr-only">Authentication</DialogTitle>
              <AuthModalForm onAuthSuccess={() => setAuthModalOpen(false)} onClose={() => setAuthModalOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
        {/* Dashboard Modal removed */}
      </header>

      {/* API Key Warning Banner - Small rectangular modal below header */}
      {showApiKeyWarning && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-40 bg-gradient-to-r from-amber-600 to-orange-600 text-white px-4 py-3 rounded-lg shadow-lg border border-amber-500/30 max-w-md w-full mx-4">
          <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Unable to generate code?</span>
                  <span className="text-xs opacity-90">Add your API key to unlock AI features • Won't show again</span>
                </div>
              </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => router.push('/settings?section=integrations')}
                className="bg-white/20 hover:bg-white/30 text-white border-white/30 hover:border-white/50 text-xs font-medium px-3 py-1.5 rounded transition-all duration-200 hover:scale-105"
              >
                Add API Key
              </Button>
              <button
                onClick={() => {
                  setShowApiKeyWarning(false);
                  try {
                    localStorage.setItem('apiKeyWarningDismissed', 'true');
                  } catch (error) {
                    // localStorage might not be available (SSR, disabled, etc.)
                    console.warn('localStorage not available:', error);
                  }
                }}
                className="text-white/80 hover:text-white p-1 rounded transition-colors duration-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

<style jsx global>{`
@keyframes spin-pause {
  0% { transform: rotate(0deg); }
  80% { transform: rotate(360deg); }
  100% { transform: rotate(360deg); }
}
.animate-spin-pause {
  animation: spin-pause 2.5s linear infinite;
}
`}</style>
