import { useEffect, useState, useRef } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { AppProvider, useApp } from "./contexts/AppContext";
import Dashboard from "./pages/Dashboard";
import Stats from "./pages/Stats";
import Settings from "./pages/Settings";
import ShopList from "./pages/ShopList";
import NotFound from "./pages/NotFound";
import TopBar from "./components/TopBar";
import BottomNav from "./components/BottomNav";
import AppTutorial from "./components/AppTutorial";
import MockAdBanner from '@/components/MockAdBanner';
import { AuthProvider } from './contexts/AuthContext';
import AuthCallback from './pages/AuthCallback';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { toast } from "@/components/ui/use-toast";
import ResetPasswordPage from './pages/ResetPasswordPage';

const queryClient = new QueryClient();

// 監聽路由變化的組件
const RouteChangeHandler = () => {
  const { setSelectedItem, language } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const doubleBackRef = useRef(false);
  const backHandlerRef = useRef<any>(null);

  useEffect(() => {
    setSelectedItem(null);
  }, [location.pathname, setSelectedItem]);

  // 全局返回鍵邏輯
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const handleBackButton = async () => {
      console.log('[全局返回鍵] 路徑:', location.pathname);
      
      // 檢查是否有打開的模態框（可以通過document.body的類或特定元素來檢測）
      const hasOpenModal = document.body.classList.contains('overflow-hidden') || 
                           document.querySelector('[role="dialog"]') !== null;
      
      // 檢查是否處於多選模式 - 通過DOM或特定的全局狀態
      const isInMultiSelectMode = document.body.classList.contains('multi-select-mode') || 
                                document.querySelector('.multi-select-active') !== null;
      
      if (hasOpenModal || isInMultiSelectMode) {
        // 1. 如果模態框/表單打開或處於多選模式：關閉它們
        console.log('[全局返回鍵] 模態框或多選模式活動，處理關閉邏輯');
        
        if (hasOpenModal) {
          // 觸發Escape鍵事件以關閉模態框/表單
          document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        }
        
        if (isInMultiSelectMode) {
          // 退出多選模式 - 通過自定義事件
          document.dispatchEvent(new CustomEvent('exit-multi-select'));
        }
        
        return true; // 阻止默認行為
      } else if (location.pathname !== '/') {
        // 2. 無模態框/表單，非Dashboard：導航回Dashboard
        console.log('[全局返回鍵] 非Dashboard頁面，返回Dashboard');
        navigate('/');
        return true; // 阻止默認行為
      } else {
        // 3. Dashboard頁面且無模態框/表單/非多選模式：顯示退出提示
        if (doubleBackRef.current) {
          // 已經按過一次返回，確認退出
          console.log('[全局返回鍵] 第二次按下返回，退出應用');
          return false; // 允許默認行為（退出應用）
        } else {
          console.log('[全局返回鍵] Dashboard頁面，顯示退出警告');
          toast({
            title: language === 'en' ? 'Exit App?' : '退出應用？',
            description: language === 'en' ? 'Press back again to exit' : '再次按返回鍵退出',
            variant: "default",
            duration: 2000
          });
          
          // 雙擊退出邏輯
          doubleBackRef.current = true;
          setTimeout(() => {
            doubleBackRef.current = false;
          }, 2000);
          
          return true; // 阻止默認行為（不退出應用，等待第二次按下）
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
        console.error('[全局返回鍵] 設置返回鍵監聽器失敗:', error);
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

  // 首次加載時檢查是否需要顯示教學
  useEffect(() => {
    const tutorialCompleted = localStorage.getItem('tutorialCompleted');
    if (!tutorialCompleted) {
      setShowTutorial(true);
    }
  }, [setShowTutorial]);

  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen">
        <TopBar />
        <main className="flex-1 pb-36">
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
            <Sonner />
            <AppContent />
            <MockAdBanner />
          </TooltipProvider>
        </AppProvider>
      </QueryClientProvider>
    </AuthProvider>
  );
}

// 因為 useApp 和 useLocation 必須在 AppProvider 和 Router 內部使用，所以需要單獨封裝
const RouteWrapper = () => {
  return (
    <Routes>
      <Route path="*" element={<RouteChangeHandler />} />
    </Routes>
  );
};

export default App;
