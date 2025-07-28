import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { Header } from '@/components/header';
import { ApiKeyProvider } from '@/hooks/use-api-key';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import React from 'react';
import { UserProvider } from '@/hooks/use-user';

export const metadata: Metadata = {
  title: 'Buildora - AI-powered web page builder',
  description: 'Generate web pages from a text prompt with AI.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Source+Code+Pro&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@700&display=swap" rel="stylesheet" />
        {/* Favicons - replace these files with your own */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body className="font-body antialiased h-full bg-neutral-900" suppressHydrationWarning>
        <UserProvider>
          <ApiKeyProvider>
            <Header />
            <main className="h-full">{children}</main>
            <Toaster />
          </ApiKeyProvider>
        </UserProvider>
      </body>
    </html>
  );
}
