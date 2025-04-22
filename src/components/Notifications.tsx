import React, { useState, useEffect } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Bell, MoreHorizontal, Apple, ShoppingBag, AlertCircle, Home, Tag, Utensils } from 'lucide-react';
import { useApp, Item, calculateDaysUntilExpiry, formatDateWithUserPreference } from '@/contexts/AppContext';
import { useTranslation } from '@/utils/translations';
import { format, parseISO } from 'date-fns';
import { cn } from "@/lib/utils";

const Notifications: React.FC = () => {
  const { items, language, selectedItem, setSelectedItem, settings } = useApp();
  const t = useTranslation(language);
  const [open, setOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [showAllNotifications, setShowAllNotifications] = useState(false);
  
  const getAttentionItems = (): Item[] => {
    return items.filter(item => {
      if (item.used) return false;
      if (item.deleted) return false;
      const daysUntil = calculateDaysUntilExpiry(item.expiryDate);
      return daysUntil <= item.notifyDaysBefore || daysUntil <= 4;
    }).sort((a, b) => {
      return calculateDaysUntilExpiry(a.expiryDate) - calculateDaysUntilExpiry(b.expiryDate);
    });
  };
  
  const attentionItems = getAttentionItems();
  
  useEffect(() => {
    setNotificationCount(attentionItems.length);
  }, [items, attentionItems.length]);
  
  useEffect(() => {
    // Reset showAllNotifications when popover is closed
    if (!open) {
      setShowAllNotifications(false);
    }
  }, [open]);
  
  const getItemStatus = (item: Item) => {
    const daysUntil = calculateDaysUntilExpiry(item.expiryDate);
    
    const isNotifyTriggered = daysUntil > 4 && daysUntil <= item.notifyDaysBefore;
    
    if (daysUntil < 0) {
      return {
        badgeClass: 'border-red-500 text-red-600 bg-red-100 dark:text-red-400 dark:border-red-600 dark:bg-red-900/20',
        textColorClass: 'text-red-600',
        textColorValue: '#DC2626',
        text: t('expired'),
        isNotifyTriggered: false
      };
    } else if (daysUntil === 0) {
      return {
        badgeClass: 'border-red-500 text-red-600 bg-red-100 dark:text-red-400 dark:border-red-600 dark:bg-red-900/20',
        textColorClass: 'text-red-600',
        textColorValue: '#DC2626',
        text: `${t('expiring')} ${t('today')}`,
        isNotifyTriggered: false
      };
    } else if (daysUntil === 1) {
      return {
        badgeClass: 'border-red-500 text-red-600 bg-red-100 dark:text-red-400 dark:border-red-600 dark:bg-red-900/20',
        textColorClass: 'text-red-600',
        textColorValue: '#DC2626',
        text: `${t('expiring')} ${t('tomorrow')}`,
        isNotifyTriggered: false
      };
    } else if (daysUntil <= 4) {
      return {
        badgeClass: 'border-yellow-500 text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:border-yellow-500 dark:bg-yellow-900/20',
        textColorClass: 'text-yellow-500',
        textColorValue: '#F59E0B',
        text: (language === 'zh-TW' || language === 'zh-CN') 
          ? `即將在${daysUntil}天過期` 
          : `${t('expiring')} ${t('in')} ${daysUntil} ${t('days')}`,
        isNotifyTriggered: false
      };
    } else if (isNotifyTriggered) {
      return {
        badgeClass: 'bg-primary/10 border-primary text-primary dark:bg-primary/20 dark:border-primary/70 dark:text-primary-foreground',
        textColorClass: 'text-primary',
        textColorValue: 'var(--primary)',
        text: (language === 'zh-TW' || language === 'zh-CN') 
          ? `即將在${daysUntil}天過期` 
          : `${t('expiring')} ${t('in')} ${daysUntil} ${t('days')}`,
        isNotifyTriggered: true
      };
    } else {
      return {
        badgeClass: 'bg-[#e5f5e0] border-green-600 text-green-800 dark:bg-green-950 dark:border-green-700 dark:text-green-500',
        textColorClass: 'text-green-800',
        textColorValue: '#166534',
        text: (language === 'zh-TW' || language === 'zh-CN') 
          ? `即將在${daysUntil}天過期` 
          : `${t('expiring')} ${t('in')} ${daysUntil} ${t('days')}`,
        isNotifyTriggered: false
      };
    }
  };

  const handleItemClick = (item: Item) => {
    setSelectedItem(item);
    setOpen(false);
  };

  const handleShowAllClick = () => {
    setShowAllNotifications(true);
  };

  const displayItems = showAllNotifications 
    ? attentionItems 
    : attentionItems.slice(0, 4);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative hover:bg-muted/50">
          <Bell className="h-5 w-5" />
          {notificationCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-600 text-white">
              {notificationCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 rounded-xl overflow-hidden shadow-lg border border-gray-100 dark:border-gray-800" align="end" sideOffset={5} side="top">
        <div className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/10 px-4 pt-4 pb-3 border-b shadow-sm">
          <h3 className="font-bold text-foreground flex items-center">
            <Bell className="h-4 w-4 mr-2 text-orange-500" />
            {t('notifications')}
          </h3>
        </div>
        
        {attentionItems.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            {t('noAttentionItems')}
          </div>
        ) : (
          <div className="max-h-[250px] overflow-auto">
            {displayItems.map(item => {
              const status = getItemStatus(item);
              
              return (
                <div 
                  key={item.id}
                  className="p-3 hover:bg-muted/50 cursor-pointer border-b border-gray-100 dark:border-gray-800 last:border-b-0"
                  onClick={() => handleItemClick(item)}
                >
                  <div className="flex justify-between items-center gap-2 mb-1"> 
                    <div className="flex items-center flex-1 min-w-0">
                      <span className={cn("mr-2", status.textColorClass)}> 
                        {item.category === 'Food' ? (
                          <Utensils className="h-4 w-4" />
                        ) : (
                          <Home className="h-4 w-4" />
                        )}
                      </span>
                      <h3 className="font-medium truncate"> 
                        {item.name}
                      </h3>
                    </div>
                    <div className="text-sm font-medium text-muted-foreground"> 
                      <span> 
                        x{item.quantity}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center mt-2">
                    <div className="text-xs text-muted-foreground flex items-center gap-1"> 
                      <span>
                        {formatDateWithUserPreference(item.expiryDate, settings.dateFormat)}
                      </span>
                      {status.isNotifyTriggered && (
                        <AlertCircle className="h-3 w-3 text-primary" />
                      )}
                    </div>
                    <Badge className={`text-xs ${status.badgeClass} border px-1.5 py-0.5`}> 
                      {status.text}
                    </Badge>
                  </div>
                </div>
              );
            })}
            {!showAllNotifications && attentionItems.length > 4 && (
              <button
                className="w-full p-3 text-center text-sm text-primary hover:bg-muted/50 cursor-pointer border-t border-gray-100 dark:border-gray-800"
                onClick={handleShowAllClick}
              >
                {language === 'en' 
                  ? `View ${attentionItems.length - 4} more notification${attentionItems.length - 4 > 1 ? 's' : ''}` 
                  : `查看更多 ${attentionItems.length - 4} 個通知`}
              </button>
            )}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default Notifications;