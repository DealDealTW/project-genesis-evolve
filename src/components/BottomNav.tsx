import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutGridIcon, BarChart3Icon, SettingsIcon, ShoppingCart } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useTranslation } from '@/utils/translations';
import { cn } from '@/lib/utils';

const BottomNav: React.FC = () => {
  const location = useLocation();
  const { language, expiringItemsCount, shopItems } = useApp();
  const t = useTranslation(language);
  
  // 計算未勾選的購物清單項目數量
  const uncheckedShopItemsCount = shopItems.filter(item => !item.checked).length;
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const getNavItemStyles = (path: string) => {
    if (isActive(path)) {
      return 'text-primary after:content-[""] after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-1/2 after:h-0.5 after:bg-primary after:rounded-full transition-all duration-300';
    }
    return 'text-muted-foreground hover:text-foreground active:text-primary/70 transition-all duration-200';
  };
  
  return (
    <div className="fixed bottom-[50px] left-0 right-0 h-20 bg-background/95 backdrop-blur-sm border-t border-border/30 flex items-center justify-around z-50 safe-area-bottom">
      <div className="max-w-md w-full mx-auto flex items-center justify-around" role="navigation" aria-label="主导航">
        <Link 
          to="/" 
          className={cn(
            "relative flex flex-col items-center justify-center w-20 h-full py-3 touch-feedback rounded-lg focus-visible:ring-2 focus-visible:ring-primary/70 focus:outline-none transition-all duration-200",
            getNavItemStyles('/')
          )}
          tabIndex={0}
          aria-current={isActive('/') ? "page" : undefined}
          aria-label={t('dashboard')}
        >
          <LayoutGridIcon className="h-6 w-6" />
          <span className="label-text mt-1 font-medium">{t('dashboard')}</span>
          {isActive('/') && (
            <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-9 h-0.5 bg-primary rounded-full animate-slide-up-fade" />
          )}
        </Link>
        
        <Link 
          to="/stats" 
          className={cn(
            "relative flex flex-col items-center justify-center w-20 h-full py-3 touch-feedback rounded-lg focus-visible:ring-2 focus-visible:ring-primary/70 focus:outline-none transition-all duration-200",
            getNavItemStyles('/stats')
          )}
          tabIndex={0}
          aria-current={isActive('/stats') ? "page" : undefined}
          aria-label={t('insight')}
        >
          <BarChart3Icon className="h-6 w-6" />
          <span className="label-text mt-1 font-medium">{t('insight')}</span>
          {isActive('/stats') && (
            <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-9 h-0.5 bg-primary rounded-full animate-slide-up-fade" />
          )}
        </Link>
        
        <Link 
          to="/shoplist" 
          className={cn(
            "relative flex flex-col items-center justify-center w-20 h-full py-3 touch-feedback rounded-lg focus-visible:ring-2 focus-visible:ring-primary/70 focus:outline-none transition-all duration-200",
            getNavItemStyles('/shoplist')
          )}
          tabIndex={0}
          aria-current={isActive('/shoplist') ? "page" : undefined}
          aria-label="ShopList"
        >
          <div className="relative">
            <ShoppingCart className="h-6 w-6" />
            {uncheckedShopItemsCount > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-4 h-4 text-[10px] font-medium rounded-full bg-primary text-white animate-subtle-bounce">
                {uncheckedShopItemsCount}
              </span>
            )}
          </div>
          <span className="label-text mt-1 font-medium">ShopList</span>
          {isActive('/shoplist') && (
            <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-9 h-0.5 bg-primary rounded-full animate-slide-up-fade" />
          )}
        </Link>
        
        <Link 
          to="/settings" 
          className={cn(
            "relative flex flex-col items-center justify-center w-20 h-full py-3 touch-feedback rounded-lg focus-visible:ring-2 focus-visible:ring-primary/70 focus:outline-none transition-all duration-200",
            getNavItemStyles('/settings')
          )}
          tabIndex={0}
          aria-current={isActive('/settings') ? "page" : undefined}
          aria-label={t('settings')}
        >
          <SettingsIcon className="h-6 w-6" />
          <span className="label-text mt-1 font-medium">{t('settings')}</span>
          {isActive('/settings') && (
            <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-9 h-0.5 bg-primary rounded-full animate-slide-up-fade" />
          )}
        </Link>
      </div>
    </div>
  );
};

export default BottomNav;
