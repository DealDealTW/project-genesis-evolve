
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutGridIcon, BarChart3Icon, SettingsIcon, ShoppingCart } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useTranslation } from '@/utils/translations';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

const BottomNav: React.FC = () => {
  const location = useLocation();
  const { language, expiringItemsCount, shopItems } = useApp();
  const t = useTranslation(language);
  const isMobile = useIsMobile();
  
  // Calculate unchecked shopping list items
  const uncheckedShopItemsCount = shopItems.filter(item => !item.checked).length;
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  // Enhanced styling for better mobile UX
  const getNavItemStyles = (path: string) => {
    if (isActive(path)) {
      return 'text-primary font-medium after:content-[""] after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-1/2 after:h-1 after:bg-primary after:rounded-full transition-all duration-300';
    }
    return 'text-muted-foreground hover:text-foreground active:text-primary/70 transition-all duration-200';
  };
  
  return (
    <div className="fixed bottom-0 left-0 right-0 h-24 bg-background/95 backdrop-blur-sm border-t border-border/30 flex items-center justify-around z-50 safe-area-bottom shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
      <div className="max-w-md w-full mx-auto flex items-center justify-around" role="navigation" aria-label="Main navigation">
        <Link 
          to="/" 
          className={cn(
            "relative flex flex-col items-center justify-center w-20 h-full py-3 touch-feedback rounded-lg focus-visible:ring-2 focus-visible:ring-primary/70 focus:outline-none transition-all duration-200",
            getNavItemStyles('/')
          )}
          aria-current={isActive('/') ? "page" : undefined}
          aria-label={t('dashboard')}
        >
          <LayoutGridIcon className={`h-6 w-6 ${isActive('/') ? 'text-primary' : ''}`} />
          <span className="label-text mt-1 text-sm">{t('dashboard')}</span>
          {isActive('/') && (
            <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-10 h-1 bg-primary rounded-full animate-fade-in" />
          )}
        </Link>
        
        <Link 
          to="/stats" 
          className={cn(
            "relative flex flex-col items-center justify-center w-20 h-full py-3 touch-feedback rounded-lg focus-visible:ring-2 focus-visible:ring-primary/70 focus:outline-none transition-all duration-200",
            getNavItemStyles('/stats')
          )}
          aria-current={isActive('/stats') ? "page" : undefined}
          aria-label={t('insight')}
        >
          <BarChart3Icon className={`h-6 w-6 ${isActive('/stats') ? 'text-primary' : ''}`} />
          <span className="label-text mt-1 text-sm">{t('insight')}</span>
          {isActive('/stats') && (
            <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-10 h-1 bg-primary rounded-full animate-fade-in" />
          )}
        </Link>
        
        <Link 
          to="/shoplist" 
          className={cn(
            "relative flex flex-col items-center justify-center w-20 h-full py-3 touch-feedback rounded-lg focus-visible:ring-2 focus-visible:ring-primary/70 focus:outline-none transition-all duration-200",
            getNavItemStyles('/shoplist')
          )}
          aria-current={isActive('/shoplist') ? "page" : undefined}
          aria-label="ShopList"
        >
          <div className="relative">
            <ShoppingCart className={`h-6 w-6 ${isActive('/shoplist') ? 'text-primary' : ''}`} />
            {uncheckedShopItemsCount > 0 && (
              <span className="absolute -top-2 -right-2 flex items-center justify-center min-w-5 h-5 text-[10px] font-medium rounded-full bg-primary text-white animate-subtle-bounce">
                {uncheckedShopItemsCount}
              </span>
            )}
          </div>
          <span className="label-text mt-1 text-sm">ShopList</span>
          {isActive('/shoplist') && (
            <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-10 h-1 bg-primary rounded-full animate-fade-in" />
          )}
        </Link>
        
        <Link 
          to="/settings" 
          className={cn(
            "relative flex flex-col items-center justify-center w-20 h-full py-3 touch-feedback rounded-lg focus-visible:ring-2 focus-visible:ring-primary/70 focus:outline-none transition-all duration-200",
            getNavItemStyles('/settings')
          )}
          aria-current={isActive('/settings') ? "page" : undefined}
          aria-label={t('settings')}
        >
          <SettingsIcon className={`h-6 w-6 ${isActive('/settings') ? 'text-primary' : ''}`} />
          <span className="label-text mt-1 text-sm">{t('settings')}</span>
          {isActive('/settings') && (
            <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-10 h-1 bg-primary rounded-full animate-fade-in" />
          )}
        </Link>
      </div>
    </div>
  );
};

export default BottomNav;
