
import React, { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { AppProvider, useApp } from "@/contexts/AppContext";
import Dashboard from "./Dashboard";
import Stats from "./Stats";
import Settings from "./Settings";
import ShopList from "./ShopList";
import NotFound from "./NotFound";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import AppTutorial from "@/components/AppTutorial";
import MockAdBanner from '@/components/MockAdBanner';
import { AuthProvider } from '@/contexts/AuthContext';
import AuthCallback from './AuthCallback';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { toast } from "@/components/ui/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import ResetPasswordPage from './ResetPasswordPage';

const queryClient = new QueryClient();

// Route change handler component
const RouteChangeHandler = () => {
  const { setSelectedItem, language } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const doubleBackRef = useRef(false);
  const backHandlerRef = useRef(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    setSelectedItem(null);
  }, [location.pathname, setSelectedItem]);

  // Global back button logic for mobile apps
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const handleBackButton = async () => {
      console.log('[Back Button] Path:', location.pathname);
      
      // Check for open modals
      const hasOpenModal = document.body.classList.contains('overflow-hidden') || 
                           document.querySelector('[role="dialog"]') !== null;
      
      // Check for multi-select mode
      const isInMultiSelectMode = document.body.classList.contains('multi-select-mode') || 
                                document.querySelector('.multi-select-active') !== null;
      
      if (hasOpenModal || isInMultiSelectMode) {
        // Close modals or exit multi-select mode
        console.log('[Back Button] Modal or multi-select active, handling close logic');
        
        if (hasOpenModal) {
          document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        }
        
        if (isInMultiSelectMode) {
          document.dispatchEvent(new CustomEvent('exit-multi-select'));
        }
        
        return true; // Prevent default behavior
      } else if (location.pathname !== '/') {
        // Navigate back to Dashboard if not on Dashboard
        console.log('[Back Button] Not on Dashboard, returning to Dashboard');
        navigate('/');
        return true; // Prevent default behavior
      } else {
        // Handle exit confirmation when on Dashboard
        if (doubleBackRef.current) {
          console.log('[Back Button] Second back press, exiting app');
          return false; // Allow default behavior (exit app)
        } else {
          console.log('[Back Button] Dashboard page, showing exit warning');
          toast({
            title: language === 'en' ? 'Exit App?' : '退出應用？',
            description: language === 'en' ? 'Press back again to exit' : '再次按返回鍵退出',
            variant: "default",
            duration: 2000
          });
          
          // Double-tap exit logic
          doubleBackRef.current = true;
          setTimeout(() => {
            doubleBackRef.current = false;
          }, 2000);
          
          return true; // Prevent default behavior
        }
      }
    };

    const setupBackButton = async () => {
      if (backHandlerRef.current) {
        await backHandlerRef.current.remove();
      }
      
      try {
        backHandlerRef.current = await CapacitorApp.addListener('backButton', handleBackButton);
      } catch (error) {
        console.error('[Back Button] Setup failed:', error);
      }
    };

    setupBackButton();
    return () => {
      if (backHandlerRef.current) {
        backHandlerRef.current.remove();
      }
    };
  }, [location.pathname, navigate, language]);

  return null;
};

const AppContent = () => {
  const { showTutorial, setShowTutorial } = useApp();
  const isMobile = useIsMobile();

  // Show tutorial on first load
  useEffect(() => {
    const tutorialCompleted = localStorage.getItem('tutorialCompleted');
    if (!tutorialCompleted) {
      setShowTutorial(true);
    }
  }, [setShowTutorial]);

  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen bg-background">
        <TopBar />
        <main className={`flex-1 ${isMobile ? 'pb-32' : 'pb-20'} mx-auto w-full max-w-md`}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/stats" element={<Stats />} />
            <Route path="/shoplist" element={<ShopList />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <BottomNav />
        <RouteWrapper />
        <AppTutorial isOpen={showTutorial} onClose={() => setShowTutorial(false)} />
      </div>
    </BrowserRouter>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <AppProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner position="top-center" closeButton richColors />
            <AppContent />
            <MockAdBanner />
          </TooltipProvider>
        </AppProvider>
      </QueryClientProvider>
    </AuthProvider>
  );
}

// Wrapper component for route handling
const RouteWrapper = () => {
  return (
    <Routes>
      <Route path="*" element={<RouteChangeHandler />} />
    </Routes>
  );
};

export default App;
