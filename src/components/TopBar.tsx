import React from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Bell
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useTranslation } from '@/utils/translations';
import Notifications from './Notifications';
import '@fontsource/poppins';

const TopBar: React.FC = () => {
  const location = useLocation();
  const { language } = useApp();
  const t = useTranslation(language);
  
  const getTitle = () => {
    switch (location.pathname) {
      case '/':
        return t('appName');
      case '/stats':
        return t('insight');
      case '/settings':
        return t('settings');
      case '/shoplist':
        return 'ShopList';
      default:
        return t('appName');
    }
  };

  return (
    <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border/30 safe-area-top" role="banner" aria-label="顶部栏">
      <div className="max-w-md mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center">
          <h1 
            className="app-title relative"
            tabIndex={0}
            aria-label={getTitle()}
          >
            {getTitle()}
            <span className="absolute -bottom-1 left-0 w-1/3 h-0.5 bg-primary/40 rounded-full"></span>
          </h1>
        </div>
        {location.pathname === '/' && (
          <div className="flex items-center space-x-2">
            <Notifications />
          </div>
        )}
      </div>
    </div>
  );
};

export default TopBar;
