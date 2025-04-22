import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, X, Plus, Filter, CheckSquare, Bell, ListChecks, ShoppingCart, BarChart2, Settings2, Calendar, GridIcon, ListIcon, AlignJustify, SlidersHorizontal, Search, Package, AlertTriangle, Clock, Siren, Apple, Home, Check, LayoutGrid, Edit, ChevronLeft, ChevronRight } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useTranslation } from '@/utils/translations';
import { cn } from "@/lib/utils";
import { Card, CardContent, CardFooter } from './ui/card';

// 描述教學步驟的介面
interface TutorialStep {
  title: string; // 標題
  description: string; // 描述
  imagePath: string; // 圖片路徑
}

// 定義所有教學步驟
const getTutorialSteps = (language: string): TutorialStep[] => {
  const isEnglish = language === 'en';
  
  return [
    // 1. 歡迎頁面
    {
      title: isEnglish ? 'Welcome to WhatsLeft!' : '歡迎使用 WhatsLeft!',
      description: isEnglish 
        ? 'Discover how WhatsLeft helps you track groceries, reduce waste, and save money on household items. This tutorial will guide you through all features of the app.' 
        : '探索 WhatsLeft 如何幫助您追蹤食品，減少浪費，並節省家居用品費用。本教學將引導您了解應用程式的所有功能。',
      imagePath: '/tutorial/welcome.png'
    },
    
    // 2. 主控台 - 概覽
    {
      title: isEnglish ? 'Dashboard Overview' : '主控台概覽',
      description: isEnglish 
        ? 'Your dashboard shows all your tracked items organized by category and urgency. Color-coded cards help you instantly identify expiring items that need attention.' 
        : '您的主控台按類別和緊急程度顯示所有追蹤的物品。顏色編碼的卡片幫助您立即識別需要注意的即將過期物品。',
      imagePath: '/tutorial/dashboard.png'
    },
    
    // 3. 導航
    {
      title: isEnglish ? 'Easy Navigation' : '便捷導航',
      description: isEnglish 
        ? 'Use the bottom tabs to quickly switch between Dashboard, Shopping List, Insights, and Settings. The tabs are always accessible for easy navigation throughout the app.' 
        : '使用底部標籤快速切換主控台、購物清單、統計分析和設置。這些標籤在應用程式中始終可見，便於導航。',
      imagePath: '/tutorial/navigation.png'
    },
    
    // 4. 添加物品
    {
      title: isEnglish ? 'Adding Items' : '添加物品',
      description: isEnglish 
        ? 'Tap the "+" button to add new food or household items. You can manually enter details, use voice input for multiple items at once, or scan barcodes for quick addition.' 
        : '點擊"+"按鈕添加新的食品或家居物品。您可以手動輸入詳情，使用語音輸入一次添加多個物品，或掃描條碼快速添加。',
      imagePath: '/tutorial/add_item.png'
    },
    
    // 5. 物品詳情
    {
      title: isEnglish ? 'Item Details' : '物品詳情',
      description: isEnglish 
        ? 'Tap any item to view its full details. From here, you can mark items as used or wasted, edit information, adjust quantities, or add them to your shopping list.' 
        : '點擊任何物品查看其完整詳情。在這裡，您可以標記物品為已使用或已浪費，編輯信息，調整數量，或將其添加到購物清單。',
      imagePath: '/tutorial/item_view.png'
    },
    
    // 6. 搜索和過濾
    {
      title: isEnglish ? 'Search & Filter' : '搜索和過濾',
      description: isEnglish 
        ? 'Use the search bar to find specific items by name. Apply filters to view items by category, subcategory, or expiry status. This helps you quickly find what you\'re looking for.' 
        : '使用搜索欄按名稱查找特定物品。應用過濾器按類別、子類別或過期狀態查看物品。這有助於您快速找到您要找的物品。',
      imagePath: '/tutorial/dashboard.png'
    },
    
    // 7. 視圖模式
    {
      title: isEnglish ? 'View Modes' : '視圖模式',
      description: isEnglish 
        ? 'Switch between grid, list, and compact views to customize how your items are displayed. Grid view shows more items at once, while list view provides more details for each item.' 
        : '在網格、列表和緊湊視圖之間切換，自定義物品的顯示方式。網格視圖一次顯示更多物品，而列表視圖為每個物品提供更多詳細信息。',
      imagePath: '/tutorial/dashboard.png'
    },
    
    // 8. 多選模式
    {
      title: isEnglish ? 'Multi-select Mode' : '多選模式',
      description: isEnglish 
        ? 'Tap "Select" to enter multi-select mode. Check multiple items to perform batch operations like marking several items as used at once or adding multiple items to your shopping list.' 
        : '點擊"選擇"進入多選模式。勾選多個物品以執行批量操作，如一次標記多個物品為已使用或將多個物品添加到購物清單。',
      imagePath: '/tutorial/dashboard.png'
    },
    
    // 9. 購物清單 - 創建
    {
      title: isEnglish ? 'Creating Shopping Lists' : '創建購物清單',
      description: isEnglish 
        ? 'Tap the ShopList tab to access your shopping list. Add items manually or directly from your dashboard when you\'re running low. Group items by category for easier shopping.' 
        : '點擊購物清單標籤訪問您的購物清單。手動添加物品或當您的庫存不足時直接從主控台添加。按類別分組物品以便於購物。',
      imagePath: '/tutorial/shopping_list.png'
    },
    
    // 10. 購物清單 - 管理
    {
      title: isEnglish ? 'Shopping Made Easy' : '輕鬆購物',
      description: isEnglish 
        ? 'Check off items as you shop. When you get home, one tap moves purchased items from your shopping list to your inventory with all details preserved.' 
        : '購物時勾選物品。回家後，一鍵將購買的物品從購物清單移動到您的庫存中，保留所有詳細信息。',
      imagePath: '/tutorial/move_items.png'
    },
    
    // 11. 統計分析
    {
      title: isEnglish ? 'Insight Analytics' : '統計分析',
      description: isEnglish 
        ? 'The Insights tab shows your consumption patterns and waste statistics. Track your efficiency, identify the most wasted items, and understand your usage by category.' 
        : '統計分析標籤顯示您的消費模式和浪費統計數據。追蹤您的效率，識別最常浪費的物品，並了解按類別的使用情況。',
      imagePath: '/tutorial/insights.png'
    },
    
    // 12. 浪費追蹤
    {
      title: isEnglish ? 'Waste Tracking' : '浪費追蹤',
      description: isEnglish 
        ? 'When items expire, mark them as wasted to track your waste patterns. The app will help you identify patterns and suggest improvements to reduce waste over time.' 
        : '當物品過期時，將其標記為已浪費以追蹤您的浪費模式。應用程式將幫助您識別模式並建議改進方法，隨時間減少浪費。',
      imagePath: '/tutorial/waste_tracking.png'
    },
    
    // 13. 家庭尺寸設置
    {
      title: isEnglish ? 'Family Size Settings' : '家庭尺寸設置',
      description: isEnglish 
        ? 'Adjust your family size in Settings to automatically calculate appropriate quantities for different food categories. This ensures you buy and store the right amount for your household.' 
        : '在設置中調整您的家庭人數，自動計算不同食品類別的適當數量。這確保您為家庭購買和存儲適量的物品。',
      imagePath: '/tutorial/family_size.png'
    },
    
    // 14. 通知設置
    {
      title: isEnglish ? 'Smart Notifications' : '智能通知',
      description: isEnglish 
        ? 'Set up expiry notifications to be alerted before items expire. Customize notification timing for different categories to ensure you use items before they go bad.' 
        : '設置過期通知，在物品過期前收到提醒。為不同類別自定義通知時間，確保您在物品變質前使用它們。',
      imagePath: '/tutorial/settings.png'
    },
    
    // 15. 開始使用
    {
      title: isEnglish ? 'Ready to Start!' : '準備開始！',
      description: isEnglish 
        ? 'You\'re all set! Start adding your items to build your inventory. Remember, you can revisit this tutorial anytime from the Settings menu if you need a refresher.' 
        : '一切就緒！開始添加您的物品來建立您的庫存。請記住，如果您需要複習，可以隨時從設置菜單重新訪問本教學。',
      imagePath: '/tutorial/ready.png'
    }
  ];
};

interface AppTutorialProps {
  isOpen: boolean;
  onClose: () => void;
}

const AppTutorial: React.FC<AppTutorialProps> = ({ isOpen, onClose }) => {
  const { language } = useApp();
  const t = useTranslation(language);
  const [currentStep, setCurrentStep] = useState(0);
  
  useEffect(() => {
    // Reset to first step when opening the tutorial
    if (isOpen) {
      setCurrentStep(0);
    }
  }, [isOpen]);

  const tutorialSteps = getTutorialSteps(language);

  const handleNextStep = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSkip(); // 最後一步時點擊 Next/Done 關閉
      // 標記教學已完成
      localStorage.setItem('tutorialCompleted', 'true');
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    setCurrentStep(0); // 重置步驟以便下次打開
    onClose();
    // 標記教學已完成
    localStorage.setItem('tutorialCompleted', 'true');
  };

  const step = tutorialSteps[currentStep];
  
  if (!isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="p-4 pb-0">
          <div className="relative flex items-center justify-center">
            <DialogTitle className="text-xl font-semibold text-center">
              {step.title}
            </DialogTitle>
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute right-0 top-0" 
              onClick={handleSkip}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex justify-center mt-3">
            {/* 進度指示器 */}
            <div className="flex space-x-1">
              {tutorialSteps.map((_, index) => (
                <button
                  key={index}
                  className={`h-1.5 rounded-full transition-all ${
                    currentStep === index ? 'w-4 bg-primary' : 'w-1.5 bg-muted hover:bg-primary/30'
                  }`}
                  onClick={() => setCurrentStep(index)}
                  aria-label={`Go to step ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </DialogHeader>
        
        <DialogDescription className="flex-grow overflow-auto px-6 py-4">
          <div className="flex flex-col items-center">
            <div className="w-full aspect-video overflow-hidden rounded-lg mb-4 bg-muted flex items-center justify-center">
              <img 
                src={step.imagePath} 
                alt={step.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // 如果圖片加載失敗，顯示一個占位符
                  (e.target as HTMLImageElement).src = `https://placehold.co/600x400/FFEECC/333333?text=${encodeURIComponent(step.title)}`;
                }}
              />
            </div>
            <p className="text-center text-muted-foreground">
              {step.description}
            </p>
          </div>
        </DialogDescription>
        
        <DialogFooter className="flex justify-between p-4 border-t">
          <Button
            variant="outline"
            onClick={handlePrevStep}
            disabled={currentStep === 0}
            className="text-sm"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            {t('previous')}
          </Button>
          
          {currentStep < tutorialSteps.length - 1 ? (
            <Button onClick={handleNextStep} className="text-sm bg-primary hover:bg-primary/90">
              {t('next')}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleSkip} className="text-sm bg-primary hover:bg-primary/90">
              {t('finish')}
              <Check className="h-4 w-4 ml-1" />
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AppTutorial;