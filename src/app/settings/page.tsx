"use client";

import { useState, useEffect, useRef, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Sun, KeyRound, Trash2, Wand2, Pencil, Eye, EyeOff, Loader2, Lock, Users, CreditCard, X, Mail } from 'lucide-react';
import { useApiKey } from '@/hooks/use-api-key';
import { useSupabaseUser } from '@/hooks/use-supabase-user';
import { supabase } from '@/lib/supabase';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const navItems = [
  { label: 'General', icon: Sun, id: 'general' },
  { label: 'Account', icon: Wand2, id: 'account' },
  { label: 'Workspace', icon: Users, id: 'workspace' },
  { label: 'Integrations', icon: KeyRound, id: 'integrations' },
  { label: 'Subscription', icon: CreditCard, id: 'subscription' },
  { label: 'Danger Zone', icon: Trash2, id: 'danger' },
];

const passwordRequirements = [
  { label: 'At least 8 characters', test: (pw: string) => pw.length >= 8 },
  { label: 'At least one uppercase letter', test: (pw: string) => /[A-Z]/.test(pw) },
  { label: 'At least one number', test: (pw: string) => /[0-9]/.test(pw) },
  { label: 'At least one special character', test: (pw: string) => /[^A-Za-z0-9]/.test(pw) },
];

function PasswordStrengthMeter({ password }: { password: string }) {
  let strength = 0;
  if (password.length > 7) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;
  const colors = ['bg-red-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];
  const texts = ['Very Weak', 'Weak', 'Medium', 'Strong'];
  return (
    <div className="mt-1">
      <div className="h-2 w-full bg-zinc-700 rounded">
        <div className={`h-2 rounded transition-all duration-300 ${colors[strength-1] || 'bg-zinc-700'}`} style={{ width: `${strength * 25}%` }} />
      </div>
      <div className="text-xs mt-1 text-zinc-400">{password ? texts[strength-1] || 'Very Weak' : ''}</div>
    </div>
  );
}

function SettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useSupabaseUser();
  const [apiKeyInput, setApiKeyInput] = useState('');
  const { apiKey, saveApiKey, clearApiKey } = useApiKey();
  const [isMounted, setIsMounted] = useState(false);
  const { toast } = useToast();
  const [imageLoadError, setImageLoadError] = useState(false);
  const [name, setName] = useState(user?.user_metadata?.full_name || '');
  const [savingName, setSavingName] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);
  const [apiKeySuccess, setApiKeySuccess] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [lastDeletedSnippets, setLastDeletedSnippets] = useState<string | null>(null);
  const undoTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [activeSection, setActiveSection] = useState('general');
  const [editingName, setEditingName] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  useEffect(() => {
    if (apiKey) setApiKeyInput(apiKey);
    setIsMounted(true);
  }, [apiKey]);

  useEffect(() => { setImageLoadError(false); }, [user?.user_metadata?.avatar_url]);

  // Handle URL search params for section
  useEffect(() => {
    const section = searchParams.get('section');
    if (section && navItems.some(item => item.id === section)) {
      setActiveSection(section);
    }
  }, [searchParams]);

  const handleApiKeySave = () => {
    if (!apiKeyInput.trim()) {
      setApiKeyError("API Key is required.");
      setApiKeySuccess(null);
      return;
    }
    if (!/^AI[a-zA-Z0-9_-]{10,}$/.test(apiKeyInput.trim())) {
      setApiKeyError("Invalid API Key format.");
      setApiKeySuccess(null);
      return;
    }
    saveApiKey(apiKeyInput);
    setApiKeyError(null);
    setApiKeySuccess("API Key saved and will be used for all AI features.");
    toast({ title: "API Key Saved", description: "Your personal API key will now be used for all AI features." });
  };

  const handleClearKey = () => {
    clearApiKey();
    setApiKeyInput('');
    toast({ title: "API Key Cleared", description: "The application will now use the default API key." });
  };

  const handleClearSnippets = () => {
    const prevSnippets = localStorage.getItem('all-snippets');
    setLastDeletedSnippets(prevSnippets);
    localStorage.removeItem('all-snippets');
    toast({
      title: "Component Library Cleared",
      description: (
        <span>Your saved snippets have been removed. <button className="underline text-blue-400 ml-2" onClick={handleUndoClearSnippets}>Undo</button></span>
      ),
      duration: 5000,
    });
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    undoTimeoutRef.current = setTimeout(() => { setLastDeletedSnippets(null); }, 5000);
  };

  const handleUndoClearSnippets = () => {
    if (lastDeletedSnippets) {
      localStorage.setItem('all-snippets', lastDeletedSnippets);
      setLastDeletedSnippets(null);
      toast({ title: "Undo Successful", description: "Your component library has been restored." });
    }
  };

  const handleNameSave = async () => {
    if (!name.trim()) {
      setNameError('Name is required.');
      return;
    }
    setSavingName(true);
    const { error } = await supabase.auth.updateUser({ data: { full_name: name } });
    setSavingName(false);
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } else {
      toast({ title: 'Name updated', description: 'Your display name has been updated.' });
      window.location.reload();
    }
  };

  const handlePasswordUpdate = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({ variant: 'destructive', title: 'Missing fields', description: 'Please fill in all password fields.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ variant: 'destructive', title: 'Passwords do not match', description: 'Please make sure your new passwords match.' });
      return;
    }
    if (!user || !user.email) {
      toast({ variant: 'destructive', title: 'Error', description: 'No email found for user.' });
      setUpdatingPassword(false);
      return;
    }
    setUpdatingPassword(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: user.email, password: currentPassword });
    if (signInError) {
      setUpdatingPassword(false);
      toast({ variant: 'destructive', title: 'Incorrect current password', description: 'The current password you entered is incorrect.' });
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setUpdatingPassword(false);
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } else {
      toast({ title: 'Password updated', description: 'Your password has been changed.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  function getInitials(user: any) {
    if (user?.user_metadata?.full_name) {
      const parts = user.user_metadata.full_name.trim().split(' ');
      if (parts.length === 1) return parts[0][0].toUpperCase();
      return (parts[0][0] + (parts[1][0] || '')).toUpperCase();
    }
    if (user?.email) return user.email[0]?.toUpperCase() ?? 'U';
    return 'U';
  }

  if (!isMounted) return null;

  return (
    <Dialog open={true} onOpenChange={open => { if (!open) router.back(); }}>
      <DialogContent className="max-w-5xl w-full h-full sm:h-[90vh] p-0 bg-neutral-950 border border-zinc-800 rounded-none sm:rounded-3xl overflow-hidden shadow-2xl">
        <DialogTitle className="sr-only">Settings</DialogTitle>
        <div className="relative w-full h-full flex flex-col lg:flex-row">
          {/* Mobile Header */}
          <div className="lg:hidden flex items-center justify-between p-3 sm:p-4 border-b border-zinc-800 bg-neutral-900">
            <div className="flex items-center gap-2">
              <img src="/LOGO.png" alt="Buildora Logo" className="h-5 w-auto sm:h-6" />
              <span className="text-base sm:text-lg font-extrabold bg-gradient-to-r from-primary to-blue-400 text-transparent bg-clip-text">Settings</span>
            </div>
            <button
              className="bg-neutral-800 hover:bg-neutral-700 text-white rounded-full p-1.5 sm:p-2"
              onClick={() => router.back()}
              aria-label="Close settings"
            >
              <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>
          </div>

          {/* Mobile Navigation Dropdown */}
          <div className="lg:hidden border-b border-zinc-800 bg-neutral-900 p-3 sm:p-4">
            <Select value={activeSection} onValueChange={setActiveSection}>
              <SelectTrigger className="w-full bg-neutral-800 border-zinc-700 text-white">
                <SelectValue placeholder="Select a section" />
              </SelectTrigger>
              <SelectContent className="bg-neutral-800 border-zinc-700 text-white">
                {navItems.map(({ label, icon: Icon, id }) => (
                  <SelectItem 
                    key={id} 
                    value={id}
                    className="text-white hover:bg-neutral-700 focus:bg-neutral-700 cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-primary" />
                      <span>{label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Desktop Sidebar Navigation */}
          <aside className="hidden lg:flex flex-col w-64 bg-neutral-900 border-r border-zinc-800 py-8 px-4 z-10 mt-[10px] ml-[10px] mb-[10px] rounded-2xl">
            <div className="mb-8 text-2xl font-extrabold bg-gradient-to-r from-primary to-blue-400 text-transparent bg-clip-text px-2">Settings</div>
            <nav className="flex flex-col gap-2">
              {navItems.map(({ label, icon: Icon, id }) => (
                <button
                  key={id}
                  onClick={() => setActiveSection(id)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-base font-medium hover:bg-neutral-800/80 focus:bg-neutral-800/80 ${activeSection === id ? 'bg-neutral-800/80 text-primary' : 'text-zinc-300'}`}
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </button>
              ))}
            </nav>
            <div className="flex-1" />
            <div className="mt-8 px-2 flex items-center gap-2 text-xs">
              <img src="/LOGO.png" alt="Buildora Logo" className="h-5 w-auto" />
              <span className="font-extrabold bg-gradient-to-r from-primary to-blue-400 text-transparent bg-clip-text" style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 900, fontSize: '1rem' }}>
                Buildora
              </span>
              <span className="text-zinc-500 ml-1">&copy; {new Date().getFullYear()}</span>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-3 md:py-4 lg:py-6 w-full max-w-3xl mx-auto overflow-y-auto">
            {/* Mobile Section Header */}
            <div className="lg:hidden mb-4">
              <div className="flex items-center gap-2 px-2">
                {(() => {
                  const currentItem = navItems.find(item => item.id === activeSection);
                  const Icon = currentItem?.icon;
                  return (
                    <>
                      {Icon && <Icon className="h-5 w-5 text-primary" />}
                      <h1 className="text-lg font-semibold text-white">{currentItem?.label}</h1>
                    </>
                  );
                })()}
              </div>
            </div>
            {activeSection === 'general' && (
              <section id="general">
                <Card className="mb-3 sm:mb-4 bg-neutral-900 border-zinc-800 text-white">
                  <CardHeader className="pb-3 sm:pb-4 px-3 sm:px-4 md:px-6">
                    <div className="flex items-center gap-2">
                      <Sun className="h-5 w-5 text-primary flex-shrink-0" />
                      <CardTitle className="text-base sm:text-lg md:text-xl">General</CardTitle>
                    </div>
                    <CardDescription className="text-sm sm:text-base">Customize your app preferences.</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0 px-3 sm:px-4 md:px-6 pb-4 sm:pb-6">
                    {/* Notification Preferences */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 sm:p-4 bg-neutral-800/50 rounded-lg">
                        <div className="flex-1">
                          <Label htmlFor="notifications-toggle" className="text-sm sm:text-base font-medium">Enable Notifications</Label>
                          <p className="text-xs sm:text-sm text-zinc-400 mt-1">Choose how and when you want to receive notifications.</p>
                        </div>
                        <Switch id="notifications-toggle" checked={true} onCheckedChange={() => {}} />
                      </div>
                      
                      <div className="flex items-center justify-between p-3 sm:p-4 bg-neutral-800/50 rounded-lg">
                        <div className="flex-1">
                          <Label htmlFor="dark-mode-toggle" className="text-sm sm:text-base font-medium">Dark Mode</Label>
                          <p className="text-xs sm:text-sm text-zinc-400 mt-1">Switch between light and dark themes.</p>
                        </div>
                        <Switch id="dark-mode-toggle" checked={true} onCheckedChange={() => {}} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </section>
            )}
            {activeSection === 'account' && user && (
              <section id="account">
                <Card className="mb-3 sm:mb-4 bg-neutral-900 border-zinc-800 text-white">
                  <CardHeader className="pb-3 sm:pb-4 px-3 sm:px-4 md:px-6">
                    <div className="flex items-center gap-2">
                      <Wand2 className="h-5 w-5 text-primary flex-shrink-0" />
                      <CardTitle className="text-base sm:text-lg md:text-xl">Account</CardTitle>
                    </div>
                    <CardDescription className="text-sm sm:text-base">Manage your personal information and preferences.</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0 px-3 sm:px-4 md:px-6 pb-4 sm:pb-6">
                    {/* Profile Section */}
                    <div className="bg-neutral-800/50 rounded-lg p-4 sm:p-5 mb-4 sm:mb-6">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-zinc-700 flex items-center justify-center text-lg sm:text-xl md:text-2xl font-bold text-zinc-300 flex-shrink-0">
                          {user?.user_metadata?.avatar_url && !imageLoadError ? (
                            <img src={String(user.user_metadata?.avatar_url || '')} alt="Profile" className="w-full h-full object-cover rounded-full" />
                          ) : (
                            getInitials(user)
                          )}
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="text-sm sm:text-base md:text-lg font-semibold text-white flex items-center gap-2">
                            <span className="truncate">{user.user_metadata?.full_name || name || 'User'}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="transition-colors duration-200 hover:bg-zinc-600 focus:bg-zinc-600 flex-shrink-0 p-1.5 sm:p-2"
                              onClick={() => setEditingName(v => !v)}
                              aria-label="Edit display name"
                            >
                              <Pencil className="h-4 w-4 text-zinc-400 transition-colors duration-200 group-hover:text-primary" />
                            </Button>
                          </span>
                          <span className="text-sm text-zinc-400 flex items-center gap-2 mt-1">
                            <Mail className="h-4 w-4 text-zinc-400 flex-shrink-0" />
                            <span className="truncate">{user.email ?? ''}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                    {/* Display Name Edit Field (toggle) */}
                    {editingName && (
                      <div className="bg-neutral-800/50 rounded-lg p-4 sm:p-5 mb-4 sm:mb-6">
                        <Label htmlFor="display-name" className="text-sm sm:text-base font-medium mb-3 block">Display Name</Label>
                        <div className="relative flex items-center mb-3">
                          <Input
                            id="display-name"
                            type="text"
                            value={name}
                            onChange={e => {
                              setName(e.target.value);
                              setNameError(null);
                            }}
                            className={`bg-zinc-700 border ${name.length > 0 && name.length <= 40 ? 'border-green-500' : 'border-red-500'} text-white placeholder-zinc-400 pr-16 text-sm sm:text-base h-10 sm:h-11`}
                            placeholder="Enter your name"
                            maxLength={40}
                          />
                          <span className={`absolute right-3 text-xs ${name.length > 0 && name.length <= 40 ? 'text-green-400' : 'text-red-400'}`}>{name.length}/40</span>
                        </div>
                        {nameError && <span className="text-xs text-red-400 mb-3 block">{nameError}</span>}
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button 
                            variant="ghost" 
                            onClick={() => { setEditingName(false); setName(user.user_metadata?.full_name || ''); }}
                            className="order-2 sm:order-1 h-10 sm:h-11 text-sm"
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleNameSave}
                            className="bg-primary text-primary-foreground font-semibold px-4 sm:px-6 order-1 sm:order-2 h-10 sm:h-11 text-sm"
                            disabled={savingName || !(name.length > 0 && name.length <= 40)}
                          >
                            {savingName ? <span className="animate-spin mr-2"><Loader2 className="h-4 w-4" /></span> : null}
                            Save
                          </Button>
                        </div>
                      </div>
                    )}
                    {/* Change Password Toggle */}
                    <div className="border-t border-zinc-800 pt-4 sm:pt-5 mt-4">
                      <Button
                        variant="outline"
                        className={`w-full mb-3 border-primary text-primary font-semibold bg-zinc-800 hover:bg-primary/10 hover:text-white hover:scale-[1.02] transition-all duration-300 ease-in-out h-11 sm:h-12 ${showPasswordForm ? 'shadow-lg scale-[1.01]' : ''}`}
                        onClick={() => setShowPasswordForm(v => !v)}
                        aria-expanded={showPasswordForm}
                        aria-controls="change-password-form"
                      >
                        <Lock className="h-4 w-4 sm:h-5 sm:w-5 mr-2 transition-transform duration-300" style={{ transform: showPasswordForm ? 'rotate(-15deg) scale(1.1)' : 'none', color: '#3b82f6' }} />
                        <span className="text-sm sm:text-base font-semibold">{showPasswordForm ? 'Hide Password Form' : 'Change Password'}</span>
                      </Button>
                      <div
                        id="change-password-form"
                        className={`overflow-hidden transition-all duration-500 ${showPasswordForm ? 'max-h-[800px] opacity-100 translate-y-0 bg-zinc-900/80 rounded-xl shadow-lg mt-2' : 'max-h-0 opacity-0 -translate-y-2 pointer-events-none'}`}
                        style={{ willChange: 'max-height, opacity, transform' }}
                      >
                        {showPasswordForm && (
                          <div className="bg-neutral-800/50 rounded-lg p-4 sm:p-5">
                            <div className="text-sm sm:text-base font-semibold mb-4 flex items-center gap-2">
                              <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-primary" /> Change Password
                            </div>
                            <form className="space-y-4" onSubmit={e => { e.preventDefault(); handlePasswordUpdate(); }}>
                              <div className="relative">
                                <Label htmlFor="current-password" className="text-sm font-medium mb-2 block">Current Password</Label>
                                <Input
                                  id="current-password"
                                  type={showCurrentPassword ? 'text' : 'password'}
                                  value={currentPassword}
                                  onChange={e => setCurrentPassword(e.target.value)}
                                  className="bg-zinc-700 border-zinc-600 text-white placeholder-zinc-400 pr-10 text-sm sm:text-base h-10 sm:h-11"
                                  placeholder="Current password"
                                  autoComplete="current-password"
                                />
                                <button
                                  type="button"
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-primary focus:outline-none p-1"
                                  onClick={() => setShowCurrentPassword(v => !v)}
                                  tabIndex={-1}
                                  aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
                                >
                                  {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                              </div>
                              <div className="relative">
                                <Label htmlFor="new-password" className="text-sm font-medium mb-2 block">New Password</Label>
                                <Input
                                  id="new-password"
                                  type={showNewPassword ? 'text' : 'password'}
                                  value={newPassword}
                                  onChange={e => setNewPassword(e.target.value)}
                                  className="bg-zinc-700 border-zinc-600 text-white placeholder-zinc-400 pr-10 text-sm sm:text-base h-10 sm:h-11"
                                  placeholder="New password"
                                  autoComplete="new-password"
                                />
                                <button
                                  type="button"
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-primary focus:outline-none p-1"
                                  onClick={() => setShowNewPassword(v => !v)}
                                  tabIndex={-1}
                                  aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                                >
                                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                                <PasswordStrengthMeter password={newPassword} />
                              </div>
                              <div className="relative">
                                <Label htmlFor="confirm-password" className="text-sm font-medium mb-2 block">Confirm New Password</Label>
                                <Input
                                  id="confirm-password"
                                  type={showConfirmPassword ? 'text' : 'password'}
                                  value={confirmPassword}
                                  onChange={e => setConfirmPassword(e.target.value)}
                                  className="bg-zinc-700 border-zinc-600 text-white placeholder-zinc-400 pr-10 text-sm sm:text-base h-10 sm:h-11"
                                  placeholder="Confirm new password"
                                  autoComplete="new-password"
                                />
                                <button
                                  type="button"
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-primary focus:outline-none p-1"
                                  onClick={() => setShowConfirmPassword(v => !v)}
                                  tabIndex={-1}
                                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                                >
                                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                                {confirmPassword && newPassword !== confirmPassword && (
                                  <div className="text-xs text-red-400 mt-2" aria-live="polite">Passwords do not match.</div>
                                )}
                              </div>
                              <div className="bg-zinc-700/50 rounded-lg p-3 sm:p-4">
                                <h4 className="text-sm font-medium mb-2">Password Requirements</h4>
                                <ul className="text-xs space-y-1 text-zinc-300">
                                  {passwordRequirements.map(req => (
                                    <li key={req.label} className={`flex items-center gap-2 ${req.test(newPassword) ? 'text-green-400' : 'text-zinc-400'}`}>
                                      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-xs ${req.test(newPassword) ? 'bg-green-500 text-white' : 'bg-zinc-600 text-zinc-400'}`}>
                                        {req.test(newPassword) ? '✓' : '✗'}
                                      </span>
                                      {req.label}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              <div className="flex flex-col sm:flex-row gap-3">
                                <Button
                                  type="submit"
                                  className="flex-1 bg-primary text-primary-foreground font-semibold h-11 sm:h-12 text-sm"
                                  disabled={
                                    updatingPassword ||
                                    !currentPassword ||
                                    !newPassword ||
                                    !confirmPassword ||
                                    newPassword !== confirmPassword ||
                                    !passwordRequirements.every(req => req.test(newPassword))
                                  }
                                  aria-disabled={
                                    updatingPassword ||
                                    !currentPassword ||
                                    !newPassword ||
                                    !confirmPassword ||
                                    newPassword !== confirmPassword ||
                                    !passwordRequirements.every(req => req.test(newPassword))
                                  }
                                >
                                  {updatingPassword && <span className="animate-spin mr-2"><Loader2 className="h-4 w-4" /></span>}
                                  {updatingPassword ? 'Updating...' : 'Update Password'}
                                </Button>
                                <Button
                                  variant="outline"
                                  className="flex-1 border-primary text-primary font-semibold bg-zinc-700 hover:bg-primary/10 hover:text-white transition-all duration-300 ease-in-out h-11 sm:h-12 text-sm"
                                  onClick={() => setShowPasswordForm(false)}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </form>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </section>
            )}
            {activeSection === 'workspace' && (
              <section id="workspace">
                <Card className="mb-2 sm:mb-3 md:mb-4 bg-neutral-900 border-zinc-800 text-white">
                  <CardHeader className="pb-2 sm:pb-3 md:pb-4 px-2 sm:px-3 md:px-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                      <CardTitle className="text-sm sm:text-base md:text-lg">Workspace</CardTitle>
                    </div>
                    <CardDescription className="text-xs sm:text-sm md:text-base">Manage your workspace and team members.</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0 px-2 sm:px-3 md:px-4 pb-2 sm:pb-3 md:pb-4">
                    <div className="text-zinc-400 text-xs sm:text-sm md:text-base">Workspace settings and team management coming soon.</div>
                  </CardContent>
                </Card>
              </section>
            )}
            {activeSection === 'integrations' && (
              <section id="integrations">
                <Card className="mb-2 sm:mb-3 md:mb-4 bg-neutral-900 border-zinc-800 text-white">
                  <CardHeader className="pb-2 sm:pb-3 md:pb-4 px-2 sm:px-3 md:px-4">
                    <div className="flex items-center gap-2">
                      <KeyRound className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                      <CardTitle className="text-sm sm:text-base md:text-lg">Integrations</CardTitle>
                    </div>
                    <CardDescription className="text-xs sm:text-sm md:text-base">Connect with external services and AI providers.</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0 px-2 sm:px-3 md:px-4 pb-2 sm:pb-3 md:pb-4">
                    <div className="flex items-center justify-between mb-2 sm:mb-3">
                      <span className="text-xs sm:text-sm md:text-base font-semibold text-white">Google AI API Key</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setApiKeyInput('')}
                        className="text-white hover:text-blue-400 focus:text-blue-400 border border-transparent hover:border-blue-500 focus:border-blue-500 bg-transparent hover:bg-transparent focus:bg-transparent transition-colors p-1 sm:p-2"
                        title="Clear API Key"
                      >
                        <KeyRound className="h-4 w-4 sm:h-5 sm:w-5" />
                      </Button>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-2">
                      <Input
                        id="api-key"
                        type="password"
                        value={apiKeyInput}
                        onChange={e => setApiKeyInput(e.target.value)}
                        className="bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500 text-xs sm:text-sm md:text-base h-8 sm:h-9 md:h-10"
                      />
                      {apiKey && (
                        <Button variant="ghost" className="text-destructive text-xs sm:text-sm md:text-base h-8 sm:h-9 md:h-10" onClick={handleClearKey}>Clear</Button>
                      )}
                    </div>
                    {apiKeyError && <span className="text-xs text-red-400 mt-1">{apiKeyError}</span>}
                    {apiKeySuccess && <span className="text-xs text-green-400 mt-1">{apiKeySuccess}</span>}
                    <div className="flex gap-2 mt-2 sm:mt-3">
                      <Button onClick={handleApiKeySave} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold flex-1 text-xs sm:text-sm md:text-base h-8 sm:h-9 md:h-10">Save</Button>
                    </div>
                    <span className="text-xs text-zinc-400 mt-2">Your API key is stored only in your browser and never shared.</span>
                  </CardContent>
                </Card>
              </section>
            )}
            {activeSection === 'subscription' && (
              <section id="subscription">
                <Card className="mb-2 sm:mb-3 md:mb-4 bg-neutral-900 border-zinc-800 text-white">
                  <CardHeader className="pb-2 sm:pb-3 md:pb-4 px-2 sm:px-3 md:px-4">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                      <CardTitle className="text-sm sm:text-base md:text-lg">Subscription</CardTitle>
                    </div>
                    <CardDescription className="text-xs sm:text-sm md:text-base">Manage your subscription and billing details.</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0 px-2 sm:px-3 md:px-4 pb-2 sm:pb-3 md:pb-4">
                    <div className="text-zinc-400 text-xs sm:text-sm md:text-base">Subscription and billing management coming soon.</div>
                  </CardContent>
                </Card>
              </section>
            )}
            {activeSection === 'danger' && (
              <section id="danger">
                <Card className="mb-2 sm:mb-3 md:mb-4 bg-red-950/60 border-red-600 text-white">
                  <CardHeader className="pb-2 px-2 sm:px-3 md:px-4">
                    <div className="flex items-center gap-2 text-red-500">
                      <Trash2 className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                      <CardTitle className="text-red-500 text-sm sm:text-base md:text-lg">Danger Zone</CardTitle>
                    </div>
                    <CardDescription className="text-xs text-red-300">Dangerous actions. Proceed with caution.</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0 px-2 sm:px-3 md:px-4 pb-2 sm:pb-3 md:pb-4">
                    <div className="flex flex-col gap-2 sm:gap-3">
                      <Button
                        variant="destructive"
                        className="w-full flex items-center justify-center gap-1.5 sm:gap-2 py-2 text-xs sm:text-sm md:text-base font-semibold bg-red-700 hover:bg-red-800 border-none shadow-none h-9 sm:h-10 md:h-11"
                        onClick={handleClearSnippets}
                      >
                        <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Clear Component Library
                      </Button>
                      <div className="text-xs text-red-300 text-center mt-1 px-2">
                        This will permanently delete all your saved snippets from your browser's local storage. This action cannot be undone.
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </section>
            )}
          </main>
          <button
            className="absolute top-4 right-4 z-10 bg-neutral-800 hover:bg-neutral-700 text-white rounded-full p-2 shadow-lg hidden lg:block"
            onClick={() => router.back()}
            aria-label="Close settings"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SettingsContent />
    </Suspense>
  );
}
