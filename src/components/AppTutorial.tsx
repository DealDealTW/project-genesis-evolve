
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useTranslation } from '@/utils/translations';
import { cn } from "@/lib/utils";
import { useIsMobile } from '@/hooks/use-mobile';

// Tutorial step interface
interface TutorialStep {
  title: string;
  description: string;
  imagePath: string;
}

// Simplified tutorial steps - reduced from 15 to 8 key steps
const getTutorialSteps = (language: string): TutorialStep[] => {
  const isEnglish = language === 'en';
  
  return [
    // 1. Welcome page
    {
      title: isEnglish ? 'Welcome to WhatsLeft!' : '歡迎使用 WhatsLeft!',
      description: isEnglish 
        ? 'WhatsLeft helps you track food items, reduce waste, and save money. This quick guide will show you the essential features.' 
        : '探索 WhatsLeft 如何幫助您追蹤食品，減少浪費，並節省家居用品費用。本教學將引導您了解基本功能。',
      imagePath: '/tutorial/welcome.png'
    },
    
    // 2. Dashboard overview
    {
      title: isEnglish ? 'Your Dashboard' : '您的主控台',
      description: isEnglish 
        ? 'Your dashboard shows items by category and expiry date. Color-coded cards help you quickly identify items needing attention.' 
        : '您的主控台按類別和過期日期顯示物品。顏色編碼卡片幫助您迅速找出需要關注的物品。',
      imagePath: '/tutorial/dashboard.png'
    },
    
    // 3. Adding Items - prioritized as key task
    {
      title: isEnglish ? 'Adding Items' : '添加物品',
      description: isEnglish 
        ? 'Tap the "+" button to add new items. You can enter details manually, use voice input for multiple items, or scan barcodes.' 
        : '點擊"+"按鈕添加新物品。您可以手動輸入詳情，使用語音一次添加多個物品，或掃描條碼。',
      imagePath: '/tutorial/add_item.png'
    },
    
    // 4. Item details
    {
      title: isEnglish ? 'Item Details' : '物品詳情',
      description: isEnglish 
        ? 'Tap any item to view details. From here, you can mark items as used, edit information, adjust quantities, or add to shopping list.' 
        : '點擊任何物品查看詳情。在這裡，您可以標記物品為已使用，編輯信息，調整數量，或添加到購物清單。',
      imagePath: '/tutorial/item_view.png'
    },
    
    // 5. Shopping List - important feature 
    {
      title: isEnglish ? 'Shopping List' : '購物清單',
      description: isEnglish 
        ? 'Use the shopping list to track items you need to buy. Check items off as you shop and easily add them to your inventory.' 
        : '使用購物清單追蹤您需要購買的物品。購物時勾選物品，輕鬆將其添加到您的庫存中。',
      imagePath: '/tutorial/shopping_list.png'
    },
    
    // 6. Insights analytics
    {
      title: isEnglish ? 'Usage Insights' : '使用統計',
      description: isEnglish 
        ? 'The Insights tab shows your consumption patterns and waste statistics to help you shop smarter and reduce waste.' 
        : '統計分析標籤顯示您的消費模式和浪費統計，幫助您更明智地購物並減少浪費。',
      imagePath: '/tutorial/insights.png'
    },
    
    // 7. Settings & Notifications
    {
      title: isEnglish ? 'Settings & Alerts' : '設置和提醒',
      description: isEnglish 
        ? 'Customize notifications for expiring items and adjust app settings to match your preferences.' 
        : '自定義即將過期物品的通知，並調整應用設置以符合您的偏好。',
      imagePath: '/tutorial/settings.png'
    },
    
    // 8. Ready to start
    {
      title: isEnglish ? 'Ready to Start!' : '準備開始！',
      description: isEnglish 
        ? 'You\'re all set! Start adding your items to build your inventory. You can always revisit this tutorial from Settings.' 
        : '一切就緒！開始添加您的物品來建立您的庫存。您可以隨時從設置菜單重新訪問本教學。',
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
  const isMobile = useIsMobile();
  
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
      handleFinish();
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = () => {
    setCurrentStep(0);
    onClose();
    // Mark tutorial as completed
    localStorage.setItem('tutorialCompleted', 'true');
  };

  const step = tutorialSteps[currentStep];
  
  if (!isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] flex flex-col overflow-hidden p-0 gap-0">
        <DialogHeader className="p-4 pt-6 pb-3">
          <div className="relative flex items-center justify-center">
            <DialogTitle className="text-xl font-semibold text-center">
              {step.title}
            </DialogTitle>
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute right-0 top-0" 
              onClick={handleFinish}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex justify-center mt-3">
            {/* Progress indicator */}
            <div className="flex space-x-1.5">
              {tutorialSteps.map((_, index) => (
                <button
                  key={index}
                  className={`h-1.5 rounded-full transition-all ${
                    currentStep === index ? 'w-6 bg-primary' : 'w-1.5 bg-muted hover:bg-primary/30'
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
                  // Fallback if image fails to load
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
            size={isMobile ? "lg" : "default"}
            className="text-sm min-w-20"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            {t('previous')}
          </Button>
          
          {currentStep < tutorialSteps.length - 1 ? (
            <Button 
              onClick={handleNextStep} 
              className="text-sm bg-primary hover:bg-primary/90"
              size={isMobile ? "lg" : "default"}
              aria-label={t('next')}
              autoFocus
            >
              {t('next')}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button 
              onClick={handleFinish} 
              className="text-sm bg-primary hover:bg-primary/90"
              size={isMobile ? "lg" : "default"}
              aria-label={t('finish')}
              autoFocus
            >
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
