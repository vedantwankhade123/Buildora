'use client';

import React, { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from 'react';

const API_KEY_STORAGE_KEY = 'user-api-key';

interface ApiKeyContextType {
  apiKey: string | null;
  saveApiKey: (key: string) => void;
  clearApiKey: () => void;
  isUsingUserKey: boolean;
}

const ApiKeyContext = createContext<ApiKeyContextType | undefined>(undefined);

export function ApiKeyProvider({ children }: { children: ReactNode }) {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // This effect runs once on the client to safely access localStorage.
    try {
      const storedKey = localStorage.getItem(API_KEY_STORAGE_KEY);
      if (storedKey) {
        setApiKey(storedKey);
      }
    } catch (error) {
      console.warn("Could not access local storage for API key:", error);
    }
    setIsMounted(true);
  }, []);

  const saveApiKey = useCallback((key: string) => {
    try {
      localStorage.setItem(API_KEY_STORAGE_KEY, key);
      setApiKey(key);
    } catch (error) {
      console.warn("Could not save API key to local storage:", error);
    }
  }, []);

  const clearApiKey = useCallback(() => {
    try {
      localStorage.removeItem(API_KEY_STORAGE_KEY);
      setApiKey(null);
    } catch (error) {
      console.warn("Could not clear API key from local storage:", error);
    }
  }, []);
  
  const value = {
    apiKey: apiKey, // Remove the isMounted check to prevent hydration issues
    saveApiKey,
    clearApiKey,
    isUsingUserKey: !!apiKey,
  };

  return React.createElement(ApiKeyContext.Provider, { value: value }, children);
}

export function useApiKey() {
  const context = useContext(ApiKeyContext);
  if (context === undefined) {
    throw new Error('useApiKey must be used within an ApiKeyProvider');
  }
  return context;
}
