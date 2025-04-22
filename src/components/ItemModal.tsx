import React, { useEffect, useState, useRef } from 'react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, Apple, CalendarIcon, Bell, PencilIcon, Trash2Icon, InfoIcon, CheckCircle, RotateCw, AlertTriangle, Tag, Timer, Package, BellRing, X, ShoppingCart, Home, Layers, Hash, Minus, Plus, XCircle, Siren, AlertCircle as MildAlertCircle, Sparkles, Utensils, Users } from 'lucide-react';
import { format, parseISO, differenceInDays, addDays } from 'date-fns';
import { useApp, formatDateWithUserPreference } from '@/contexts/AppContext';
import { Item, calculateDaysUntilExpiry, ItemCategory } from '@/contexts/AppContext';
import { useTranslation, TranslationKey } from '@/utils/translations';
import { cn } from '@/lib/utils';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CategoryConfig, detectCategoryAndSubcategoryByName } from '@/utils/categoryConfig';
import { Label } from "@/components/ui/label";

// 定義本地常數，以匹配 ItemForm.tsx 中的定義
const DEFAULT_AUTO_SCALE_SUBCATEGORIES_EN = ['Meat', 'Seafood', 'Fruits & Vegetables'];

// *** Define Props interface ***
interface ItemModalProps {
  onReAdd: (item: Item) => void;
}

// Modify component signature
const ItemModal: React.FC<ItemModalProps> = ({ onReAdd }) => {
  const {
    selectedItem: selectedItemId, 
    setSelectedItem,
    deleteItem,
    markItemAsUsed,
    recordPartialUsage,
    recordPartialWaste,
    language,
    settings,
    addToShopList,
    items,
    updateItem,
    categorySubcategories
  } = useApp();
  const t = useTranslation(language);
  
  const currentItem = items.find(item => item.id === selectedItemId?.id);
  
  const [activeAdjusterType, setActiveAdjusterType] = useState<'used' | 'wasted' | null>(null);
  const [partialQuantity, setPartialQuantity] = useState(1);
  
  const [justReachedZero, setJustReachedZero] = useState(false);
  const [itemSnapshotForZeroOptions, setItemSnapshotForZeroOptions] = useState<Item | null>(null);

  // --- State for Edit Mode ---
  const [isEditing, setIsEditing] = useState(false);
  const [editedItem, setEditedItem] = useState<Partial<Item>>({});
  
  // 添加自動調整家庭大小功能相關狀態
  const [showFamilySizeHint, setShowFamilySizeHint] = useState<boolean>(settings.autoAdjustFamilySize ?? false);
  const itemNameDebounceTimer = useRef<NodeJS.Timeout | null>(null);
  
  // --- Effect to initialize editedItem when editing starts or currentItem changes ---
  useEffect(() => {
    if (isEditing && currentItem) {
      setEditedItem({ ...currentItem });
      
      // 確保自動調整開關與全局設置一致
      setShowFamilySizeHint(settings.autoAdjustFamilySize ?? false);
    } else if (!isEditing) {
      setEditedItem({});
    }
  }, [isEditing, currentItem, settings.autoAdjustFamilySize]);

  // 當項目名稱變更時，自動檢測類別和子類別 (帶 debounce)
  useEffect(() => {
    if (itemNameDebounceTimer.current) {
      clearTimeout(itemNameDebounceTimer.current);
    }
    
    if (isEditing && editedItem?.name && editedItem.name.trim().length >= 2) {
      itemNameDebounceTimer.current = setTimeout(async () => {
        const detected = detectCategoryAndSubcategoryByName(editedItem.name.trim());
        if (detected) {
          handleEditInputChange('category', detected.category);
          
          const subcategoryName = detected.subcategory.name[language as 'en' | 'zh-TW' | 'zh-CN'];
          handleEditInputChange('subcategory', subcategoryName);
          
          // 更新過期天數
          const now = new Date();
          const expiryDate = addDays(now, detected.subcategory.defaultExpiryDays);
          handleEditInputChange('expiryDate', expiryDate);
        }
      }, 500);
    }
    
    return () => {
      if (itemNameDebounceTimer.current) {
        clearTimeout(itemNameDebounceTimer.current);
      }
    };
  }, [isEditing, editedItem?.name, language]);

  // --- Function to handle input changes during editing ---
  const handleEditInputChange = (field: keyof Item, value: any) => {
    setEditedItem(prev => ({ ...prev, [field]: value }));
  };

  // --- Function to handle saving edited item ---
  const handleSaveChanges = () => {
    if (currentItem && editedItem) {
      // Handle date conversion safely
      const getISOString = (date: any): string => {
        if (!date) return currentItem.expiryDate;
        
        // If it's already a string
        if (typeof date === 'string') {
          // If it's just a YYYY-MM-DD format, add time
          if (date.length === 10) {
            try {
              return parseISO(`${date}T00:00:00Z`).toISOString();
            } catch (e) {
              return currentItem.expiryDate;
            }
          }
          return date;
        }
        
        // If it's a Date object
        if (date instanceof Date && !isNaN(date.getTime())) {
          return date.toISOString();
        }
        
        return currentItem.expiryDate;
      };

      // 計算家庭大小調整的數量
      const effectiveFamilySize = settings.familySize || 1;
      const originalQuantity = editedItem.quantity ? parseInt(editedItem.quantity.toString(), 10) : parseInt(currentItem.quantity, 10);
      let finalQuantity = originalQuantity;
      
      // 只有啟用自動調整且有子類別時才進行計算
      if (showFamilySizeHint && editedItem.subcategory && effectiveFamilySize > 1 && originalQuantity >= 1) {
        const allSubcategories = [...(categorySubcategories?.['Food'] || []), ...(categorySubcategories?.['Household'] || [])];
        
        const currentSubcategoryConfig = allSubcategories.find(config => 
          config.name.en === editedItem.subcategory || 
          config.name[language as 'en' | 'zh-TW' | 'zh-CN'] === editedItem.subcategory
        );
        
        if (currentSubcategoryConfig) {
          const subcategoryNameEn = currentSubcategoryConfig.name.en;
          
          // 檢查是否啟用高級數量設置
          if (!settings.advancedQuantitySettings) {
            // 基本模式：僅對特定子類別進行調整，比例為1:1
            const shouldAutoScale = DEFAULT_AUTO_SCALE_SUBCATEGORIES_EN.includes(subcategoryNameEn);
            
            if (shouldAutoScale) {
              // 基本模式下使用1:1比例
              finalQuantity = originalQuantity * effectiveFamilySize;
            }
          } else {
            // 高級模式：所有子類別都可以調整，使用每人單位設置
            const multiplier = settings.subcategoryMultipliers?.[subcategoryNameEn] ?? 1;
            finalQuantity = Math.round(originalQuantity * effectiveFamilySize * multiplier);
          }
        }
      }
      
      const finalQuantityString = finalQuantity.toString();

      const updatedItemData: Partial<Item> = {
        ...editedItem,
        quantity: finalQuantityString,
        expiryDate: getISOString(editedItem.expiryDate),
        notifyDaysBefore: typeof editedItem.notifyDaysBefore === 'number' 
          ? editedItem.notifyDaysBefore 
          : (editedItem.notifyDaysBefore === '' ? -1 : currentItem.notifyDaysBefore),
      };
      
      // Only update if there are changes
      if (Object.keys(updatedItemData).length > 0) {
        updateItem(currentItem.id, updatedItemData);
      }
      setIsEditing(false);
    }
  };

  // --- Function to cancel editing ---
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedItem({});
  };

  // Reset states when currentItem changes
  useEffect(() => {
    if (currentItem) {
      const shouldShowZeroOptions = currentItem.quantity === '0';
      setJustReachedZero(shouldShowZeroOptions);
      
      if (!shouldShowZeroOptions) {
        setItemSnapshotForZeroOptions(null);
        setActiveAdjusterType(null);
      }
    } else {
      setJustReachedZero(false);
      setItemSnapshotForZeroOptions(null);
      setIsEditing(false);
    }
  }, [currentItem]);
  
  // Handle back button on native platforms
  useEffect(() => {
    if (!Capacitor.isNativePlatform() || !currentItem) {
      return;
    }
    
    let backButtonListener: any = null;
    
    const setup = async () => {
      try {
        await CapacitorApp.removeAllListeners();
        backButtonListener = await CapacitorApp.addListener('backButton', () => {
          if (currentItem) {
            setSelectedItem(null);
          }
        });
      } catch (error) {
        console.error('[返回鍵] 錯誤:', error);
      }
    };
    
    setup();
    
    return () => {
      if (backButtonListener) {
        backButtonListener.remove();
      }
    };
  }, [currentItem, setSelectedItem]);
  
  if (!currentItem) return null;
  
  const isUsed = currentItem?.used ?? false;
  const expiryDate = parseISO(currentItem.expiryDate);
  const dateUsedFormatted = isUsed && currentItem?.dateUsed 
    ? format(parseISO(currentItem.dateUsed), settings.dateFormat)
    : null;
  const daysRemaining = calculateDaysUntilExpiry(currentItem.expiryDate);
  
  // Get status info based on expiry
  const getStatusInfo = () => {
    if (!currentItem) return { colorClass: "text-gray-500", Icon: CheckCircle, text: '' };
    
    // Get days remaining (use edited date if in edit mode)
    let expiryISOString = currentItem.expiryDate;
    
    if (isEditing && editedItem.expiryDate) {
      if (typeof editedItem.expiryDate === 'string') {
        expiryISOString = editedItem.expiryDate;
      } else if (editedItem.expiryDate && typeof (editedItem.expiryDate as Date).toISOString === 'function') {
        expiryISOString = (editedItem.expiryDate as Date).toISOString();
      }
    }
    
    const days = calculateDaysUntilExpiry(expiryISOString);
    
    if (isUsed) return { colorClass: "text-gray-500", Icon: CheckCircle, text: t('used') };
    if (days <= 1) return { colorClass: "text-red-600", Icon: Siren, text: "Act Fast" };
    if (days <= 4) return { colorClass: "text-yellow-600", Icon: MildAlertCircle, text: "Expiring Soon" }; 
    return { colorClass: "text-green-700", Icon: Sparkles, text: "Fresh" };
  };
  
  const statusInfo = getStatusInfo();
  
  // Handlers for actions
  const handleDeleteConfirmed = () => {
    if (currentItem && !currentItem.used) {
      deleteItem(currentItem.id);
      setSelectedItem(null);
    }
  };

  const handleMarkAsUsedClick = () => {
    if (!currentItem) return;
    
    if (parseInt(currentItem.quantity, 10) === 1) {
      const snapshot = { ...currentItem };
      setItemSnapshotForZeroOptions(snapshot);
      markItemAsUsed(currentItem.id);
    } else {
      setActiveAdjusterType('used');
      setPartialQuantity(1);
    }
  };

  const handleMarkAsWastedClick = () => {
    if (!currentItem) return;
    
    if (parseInt(currentItem.quantity, 10) === 1) {
      const snapshot = { ...currentItem };
      setItemSnapshotForZeroOptions(snapshot);
      recordPartialWaste(currentItem.id, 1);
    } else {
      setActiveAdjusterType('wasted');
      setPartialQuantity(1);
    }
  };

  const handlePartialConfirm = () => {
    if (!currentItem || !activeAdjusterType) return;

    const adjustAmount = partialQuantity;
    const currentQuantityValue = parseInt(currentItem.quantity, 10);
    const remainingQuantity = currentQuantityValue - adjustAmount;

    if (remainingQuantity <= 0) {
      setItemSnapshotForZeroOptions({ ...currentItem });
    }

    if (activeAdjusterType === 'used') {
      recordPartialUsage(currentItem.id, adjustAmount);
    } else {
      recordPartialWaste(currentItem.id, adjustAmount);
    }

    setActiveAdjusterType(null);
  };

  const adjustPartialQuantity = (amount: number) => {
    if (!currentItem) return;
    const availableQuantity = parseInt(currentItem.quantity, 10);
    setPartialQuantity(prev => {
      const newQuantity = prev + amount;
      return Math.max(1, Math.min(newQuantity, availableQuantity));
    });
  };

  const handleReAddToInventory = () => {
    const itemToUse = itemSnapshotForZeroOptions || currentItem;
    if (itemToUse) {
      const itemToReAdd = { ...itemToUse };
      deleteItem(itemToUse.id);
      onReAdd(itemToReAdd);
      setItemSnapshotForZeroOptions(null);
      setSelectedItem(null);
    }
  };
  
  const handleAddToShopList = () => {
    const itemToUse = itemSnapshotForZeroOptions || currentItem;
    if (!itemToUse) return;
    
    addToShopList({
      name: itemToUse.name,
      quantity: itemToUse.quantity ?? '1',
      category: itemToUse.category,
      subcategory: itemToUse.subcategory,
      originItemId: itemToUse.id
    });
    
    deleteItem(itemToUse.id);
    setItemSnapshotForZeroOptions(null);
    setSelectedItem(null);
  };

  const handleMaybeLater = () => {
    const itemToUse = itemSnapshotForZeroOptions || currentItem;
    if (itemToUse) {
      deleteItem(itemToUse.id);
    }
    
    setItemSnapshotForZeroOptions(null);
    setJustReachedZero(false);
    setSelectedItem(null);
  };

  const handleStartEdit = () => {
    if (currentItem && !currentItem.used) {
      setIsEditing(true);
    }
  };
  
  return (
    <Dialog 
      open={!!currentItem}
      onOpenChange={(open) => {
        if (!open) {
          setActiveAdjusterType(null);
          setSelectedItem(null);
        }
      }}
    >
      <DialogContent className="sm:max-w-md dialog-content-no-close-button max-h-[90vh] w-[95vw] rounded-lg shadow-lg border border-orange-200 dark:border-orange-800/40 p-0 overflow-hidden">
        {/* Header */}
        <div className={cn(
          "bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/10 px-4 pt-4 pb-3 border-b border-orange-200/50 dark:border-orange-800/20 shadow-sm",
           isUsed && "opacity-70"
         )}>
          <div className="flex justify-between items-center mb-1">
            <DialogTitle className="text-lg font-bold text-foreground flex items-center">
              <span className={cn("mr-2", statusInfo.colorClass)}>
                <statusInfo.Icon className="h-5 w-5" />
              </span>
              {isEditing ? (
                <Input
                  value={editedItem.name || ''}
                  onChange={(e) => handleEditInputChange('name', e.target.value)}
                  className="h-8 text-lg font-bold border-b border-primary focus:border-primary focus:ring-0 bg-transparent p-0 m-0"
                  placeholder={t('itemName')}
                />
              ) : (
                currentItem.name
              )}
            </DialogTitle>
            <Badge variant="outline" className={cn("text-xs px-1.5 py-0.5", statusInfo.colorClass, {
                "bg-red-100 border-red-300 dark:bg-red-900/20 dark:border-red-700": statusInfo.colorClass === "text-red-600",
                "bg-yellow-100 border-yellow-300 dark:bg-yellow-900/20 dark:border-yellow-700": statusInfo.colorClass === "text-yellow-600",
                "bg-green-100 border-green-300 dark:bg-green-900/20 dark:border-green-700": statusInfo.colorClass === "text-green-700",
                "bg-gray-100 border-gray-300 dark:bg-gray-800 dark:border-gray-600": statusInfo.colorClass === "text-gray-500",
            })}>
              {statusInfo.text}
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground pl-7">
            {currentItem.category === 'Food' ? 
              <span className="inline-flex items-center">
                <Utensils className="h-3 w-3 mr-1 text-orange-500" />
                {t('food')}
              </span> : 
              <span className="inline-flex items-center">
                <Home className={`h-3 w-3 mr-1 ${statusInfo.colorClass}`} />
                {t('household')}
              </span>
            }
          </div>
           {isUsed && dateUsedFormatted && (
             <div className="text-xs text-muted-foreground pl-7 mt-1">
                Used: {dateUsedFormatted}
             </div>
           )}
        </div>
        
        {/* Main content area */}
        <div className={cn("px-3 py-2 space-y-2 overflow-y-auto max-h-[60vh]", (isUsed && !isEditing) && "opacity-70")}>
          {/* Item Image */} 
          {currentItem.image && (
            <div className="mb-2 rounded-lg overflow-hidden border shadow-sm aspect-video">
              <img src={currentItem.image} alt={currentItem.name} className="w-full h-full object-cover" />
            </div>
          )}

          {/* Quantity adjuster */}
          {activeAdjusterType && (
            <div className="bg-white dark:bg-slate-900 shadow-sm rounded-lg border border-gray-200 dark:border-gray-800 p-3 mb-2">
              <div className="flex flex-col">
                <div className="flex justify-between items-center mb-1">
                  <div className="text-sm font-semibold">
                    {activeAdjusterType === 'used' ? "Quantity Used" : "Quantity Wasted"}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 w-6 p-0"
                    onClick={() => setActiveAdjusterType(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex items-center justify-start gap-3 mt-2">
                  <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-md p-1">
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" 
                      onClick={() => adjustPartialQuantity(-1)} disabled={partialQuantity <= 1}>
                      <Minus className="h-4 w-4" />
                    </Button>
                    
                    <Input 
                      type="number" 
                      className="w-12 h-7 text-center border-0 bg-transparent text-base font-medium focus-visible:ring-0 focus-visible:ring-offset-0" 
                      value={partialQuantity} 
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (!isNaN(val) && currentItem) {
                          setPartialQuantity(Math.max(1, Math.min(val, parseInt(currentItem.quantity, 10))));
                        } else if (e.target.value === '') {
                          setPartialQuantity(1); 
                        }
                      }}
                      min="1"
                      max={currentItem ? parseInt(currentItem.quantity, 10) : 1} 
                    />
                    
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" 
                      onClick={() => adjustPartialQuantity(1)} 
                      disabled={!currentItem || partialQuantity >= parseInt(currentItem.quantity, 10)}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <span className="text-xs text-muted-foreground">
                    / {currentItem?.quantity} available
                  </span>
                  
                  <Button 
                    size="sm" 
                    onClick={handlePartialConfirm} 
                    className="ml-auto px-4 py-1 h-8 rounded-md"
                    variant={activeAdjusterType === 'used' ? "default" : "destructive"}
                  >
                    Confirm 
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          {/* Zero quantity options - 統一單項目和多項目的設計 */}
          {justReachedZero && (
            <div className="bg-white dark:bg-slate-900 shadow-sm rounded-lg border border-orange-200 dark:border-orange-800 p-0 mb-2 overflow-hidden">
              <div className="px-4 pt-4 pb-3 border-b bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/10">
                <div className="text-center">
                  <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-orange-50 mb-2">
                    <CheckCircle className="h-7 w-7 text-orange-500" />
                  </div>
                  <div className="text-xl font-bold text-black dark:text-white">
                    {language === 'en' 
                      ? `You've used all of ${currentItem.name}`
                      : `您已使用完 ${currentItem.name}`
                    }
                  </div>
                </div>
                
                <div className="text-center text-sm text-black dark:text-white mt-3">
                  {language === 'en' ? "What would you like to do next?" : "接下來您想做什麼？"}
                </div>
              </div>
              
              <div className="px-3 py-4 space-y-3">
                <Button 
                  variant="outline"
                  className="w-full flex items-center justify-center px-4 py-2 h-10 rounded-md border-orange-200 text-orange-700 bg-orange-50/80 hover:bg-orange-100 hover:border-orange-300 active:scale-[0.98] transition-all"
                  onClick={handleReAddToInventory}
                >
                  <RotateCw className="h-4 w-4 mr-2" />
                  {language === 'en' ? 'Re-add to Dashboard' : '重新添加到儀表板'}
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full flex items-center justify-center px-4 py-2 h-10 rounded-md border-orange-200 text-orange-700 bg-orange-50/80 hover:bg-orange-100 hover:border-orange-300 active:scale-[0.98] transition-all"
                  onClick={handleAddToShopList}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  {language === 'en' ? 'Add to Shop List' : '添加到購物清單'}
                </Button>
                
                <Button
                  variant="ghost"
                  className="w-full flex items-center justify-center px-4 py-2 h-10 rounded-md text-muted-foreground hover:text-accent-foreground hover:bg-gray-100/70 active:scale-[0.98] transition-all"
                  onClick={handleMaybeLater}
                >
                  {language === 'en' ? 'Close' : '關閉'}
                </Button>
              </div>
            </div>
          )}
          
          {/* Item details section */}
          {!activeAdjusterType && !justReachedZero && (
            isEditing ? (
              // Edit form
              <div className="space-y-3 p-1">
                {/* Quantity */}
                <div className="bg-white dark:bg-slate-900 shadow-sm rounded-lg p-2 border border-gray-100 dark:border-gray-800 mb-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium flex items-center text-slate-700 dark:text-slate-300">
                      <Hash className="h-4 w-4 mr-1.5 text-orange-500" />
                      {t('quantity')}
                    </Label>
                    {/* 自動調整開關 */}
                    <div className="flex items-center px-2 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                      <div className="flex items-center space-x-2.5">
                        <Users className="h-4 w-4 mr-1" />
                        
                        <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                          {language === 'en' ? 'Auto-adjust' : '自動調整'}
                        </span>
                        
                        <span className="text-xs px-1.5 py-0.5 rounded bg-orange-100 text-orange-600 font-medium flex-shrink-0">
                          x{settings.familySize || 1}
                        </span>
                        
                        <div className="relative h-6 w-9 flex items-center cursor-pointer flex-shrink-0">
                          {/* 背景軌道 */}
                          <div className={`absolute w-full h-4 rounded-full transition-colors ${
                            showFamilySizeHint ? 'bg-orange-300' : 'bg-gray-200 dark:bg-gray-600'
                          }`}></div>
                          
                          {/* 滑動旋鈕 */}
                          <div className={`absolute h-6 w-6 rounded-full shadow-md transform transition-transform ${
                            showFamilySizeHint 
                              ? 'translate-x-3 bg-orange-500' 
                              : 'translate-x-0 bg-white'
                          }`}></div>
                          
                          <input 
                            type="checkbox" 
                            checked={showFamilySizeHint}
                            onChange={(e) => {
                              setShowFamilySizeHint(e.target.checked);
                            }}
                            disabled={settings.familySize <= 1}
                            className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 數量控制元件 */}
                  <div className="flex items-center gap-2 mt-1.5"> 
                    <div className="flex items-center bg-white dark:bg-slate-900 border rounded-md overflow-hidden border-orange-200 w-1/2"> 
                      <Button 
                        type="button" 
                        variant="ghost" 
                        onClick={() => {
                          const current = parseInt(editedItem.quantity?.toString() || '1', 10);
                          handleEditInputChange('quantity', Math.max(1, current - 1).toString());
                        }}
                        className="h-8 w-8 rounded-none focus:ring-0 border-none flex-shrink-0"
                      >
                        <Minus className="h-4 w-4 text-orange-500" />
                      </Button>
                      
                      <div className="flex-1 text-center font-medium border-x border-orange-200 text-slate-700 dark:text-slate-300">
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={editedItem.quantity || '1'}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, '');
                            handleEditInputChange('quantity', val || '1');
                          }}
                          className="w-full h-8 text-center border-0 bg-transparent text-base font-medium focus-visible:ring-0 focus-visible:ring-offset-0 p-0"
                        />
                      </div>
                      
                      <Button 
                        type="button" 
                        variant="ghost" 
                        onClick={() => {
                          const current = parseInt(editedItem.quantity?.toString() || '1', 10);
                          handleEditInputChange('quantity', (current + 1).toString());
                        }}
                        className="h-8 w-8 rounded-none focus:ring-0 border-none flex-shrink-0"
                      >
                        <Plus className="h-4 w-4 text-orange-500" />
                      </Button>
                    </div>
                    
                    <div className="w-1/2 rounded-md border border-orange-200 flex items-center px-2.5 py-1 bg-orange-50/50 h-8">
                      {showFamilySizeHint && parseInt(editedItem.quantity?.toString() || '1', 10) > 0 ? (
                        <>
                          <Users className="h-3.5 w-3.5 mr-0.5 text-orange-500" />
                          <span className="mx-0.5 text-xs text-orange-700">{editedItem.quantity || '1'}</span>
                          <span className="mx-0.5 text-xs text-orange-700">x{settings.familySize || 1}</span>
                          <span className="mx-0.5 text-xs text-orange-700">→</span>
                          <span className="text-xs font-medium text-orange-700">
                            {parseInt(editedItem.quantity?.toString() || '1', 10) * (settings.familySize || 1)} {language === 'en' ? 'units' : '單位'}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-xs font-medium text-orange-700">
                            {editedItem.quantity || '1'} {language === 'en' ? 'units' : '單位'}
                          </span>
                        </>
                      )}
                      <div className="ml-1 rounded-full border border-orange-200 w-3.5 h-3.5 flex items-center justify-center cursor-help">
                        <span className="text-[8px] text-orange-500">i</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 新的類別和子類別設計 */}
                <div className="flex flex-wrap gap-3 mb-3 bg-white dark:bg-slate-900 shadow-sm rounded-lg p-3 border border-gray-100 dark:border-gray-800 items-start"> 
                  <div className="flex-shrink-0 w-[90px] min-w-[90px]"> 
                    <Label htmlFor="category-select" className="text-sm font-medium mb-2 block flex items-center text-slate-700 dark:text-slate-300"> 
                      <Layers className="h-[1.1rem] w-[1.1rem] mr-1.5 text-orange-500 flex-shrink-0" /> 
                      {t('category')}
                    </Label>
                    <div className="flex justify-start gap-1.5 mt-1 bg-orange-50/50 dark:bg-orange-900/10 p-1 rounded-lg"> 
                      <Button
                        type="button"
                        onClick={() => {
                          handleEditInputChange('category', 'Food');
                          if (editedItem.category !== 'Food') {
                            handleEditInputChange('subcategory', '');
                          }
                        }}
                        className={`px-1 h-7 text-xs ${editedItem.category === 'Food' ? 'bg-white text-orange-700 shadow-sm' : 'bg-transparent text-slate-600'} hover:bg-white/80 focus:outline-none rounded-md border border-transparent focus-visible:ring-2 focus-visible:ring-orange-500`}
                      >
                        <Apple className="h-[0.9rem] w-[0.9rem]" />
                      </Button>
                      <Button
                        type="button"
                        onClick={() => {
                          handleEditInputChange('category', 'Household');
                          if (editedItem.category !== 'Household') {
                            handleEditInputChange('subcategory', '');
                          }
                        }}
                        className={`px-1 h-7 text-xs ${editedItem.category === 'Household' ? 'bg-white text-orange-700 shadow-sm' : 'bg-transparent text-slate-600'} hover:bg-white/80 focus:outline-none rounded-md border border-transparent focus-visible:ring-2 focus-visible:ring-orange-500`}
                      >
                        <Home className="h-[0.9rem] w-[0.9rem]" />
                      </Button>
                    </div>
                  </div>

                  {/* 子類別選擇 */}
                  <div className="flex-1 self-stretch"> 
                    <Label htmlFor="subcategory-select" className="text-sm font-medium mb-2 block flex items-center text-slate-700 dark:text-slate-300">
                      <Tag className="h-4 w-4 mr-1.5 text-orange-500 flex-shrink-0" /> 
                      {t('subcategory')}
                    </Label>
                    <Select 
                      value={editedItem.subcategory || ''}
                      onValueChange={(value) => handleEditInputChange('subcategory', value)}
                      disabled={!editedItem.category || !categorySubcategories[editedItem.category as ItemCategory]?.length}
                    >
                      <SelectTrigger id="subcategory-select" className="h-8" disabled={!editedItem.category || !categorySubcategories[editedItem.category as ItemCategory]?.length}>
                        <SelectValue placeholder={t('selectSubcategory')} />
                      </SelectTrigger>
                      <SelectContent className="border-orange-200 max-h-[30vh]">
                        {editedItem.category && categorySubcategories[editedItem.category as ItemCategory]?.map((subcatConfig: CategoryConfig) => (
                          <SelectItem 
                            key={typeof subcatConfig.name === 'string' ? subcatConfig.name : subcatConfig.name[language]} 
                            value={typeof subcatConfig.name === 'string' ? subcatConfig.name : subcatConfig.name[language]}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span>{typeof subcatConfig.name === 'string' ? subcatConfig.name : subcatConfig.name[language]}</span>
                              <span className="ml-2 text-xs text-orange-700 font-semibold bg-orange-100 dark:bg-orange-900/30 dark:text-orange-300 px-1.5 py-0.5 rounded-full">
                                {subcatConfig.defaultExpiryDays} {t('days')}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Expiry Date */}
                <div className="border-t pt-2 mt-3 mb-1.5">
                  <div className="flex justify-between items-center">
                    <Label className="text-sm font-medium flex items-center">
                      <Timer className="h-4 w-4 mr-1.5 text-orange-500" />
                      {language === 'en' ? "Expires in" : "到期時間"}
                    </Label>
                  </div>
                  <div className="mt-1">
                    <div className="flex gap-1.5 items-center">
                      <div className="flex items-center w-[35%]">
                        <Input 
                          value={editedItem.daysUntilExpiry || calculateDaysUntilExpiry(editedItem.expiryDate as string)} 
                          onChange={(e) => {
                            const days = e.target.value === '' ? 0 : Math.max(0, parseInt(e.target.value, 10) || 0);
                            handleEditInputChange('daysUntilExpiry', days);
                            
                            // 更新過期日期
                            const newDate = addDays(new Date(), days);
                            handleEditInputChange('expiryDate', newDate);
                          }}
                          type="text"
                          pattern="[0-9]*"
                          inputMode="numeric"
                          className="h-9 w-[3.5rem] text-center border-orange-200 focus:border-orange-500 focus:ring-orange-500"
                          maxLength={3}
                        />
                        <span className="ml-1 text-xs text-muted-foreground whitespace-nowrap min-w-[30px]">
                          {language === 'en' ? "days" : "天"}
                        </span>
                      </div>
                      <div className="flex gap-0.5 flex-1 justify-evenly">
                        {[3, 7, 14, 30, 60].map(days => (
                          <Button 
                            key={days} 
                            type="button" 
                            variant="outline" 
                            size="sm" 
                            className={`w-[16%] h-7 text-xs p-0 transition-all duration-200 ${
                              (editedItem.daysUntilExpiry || calculateDaysUntilExpiry(editedItem.expiryDate as string)) === days 
                                ? "bg-white dark:bg-slate-800 text-orange-500 border-orange-300 shadow-sm" 
                                : "bg-orange-50/50 dark:bg-orange-900/10 border-orange-200/50 hover:bg-white dark:hover:bg-slate-800/30 text-muted-foreground hover:text-orange-500"
                            }`} 
                            onClick={() => {
                              handleEditInputChange('daysUntilExpiry', days);
                              // 同時更新日期
                              const newDate = addDays(new Date(), days);
                              handleEditInputChange('expiryDate', newDate);
                            }}
                          >
                            {days}d
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-1.5">
                      <div className="flex items-center">
                        <p className="text-xs text-muted-foreground mr-1">
                          {language === 'en' ? "Date:" : "日期:"} {formatDateWithUserPreference(
                            typeof editedItem.expiryDate === 'string' 
                              ? editedItem.expiryDate.split('T')[0] 
                              : format(
                                  (editedItem.expiryDate as Date) || new Date(), 
                                  'yyyy-MM-dd'
                                ), 
                            settings.dateFormat
                          )}
                        </p>
                        <div className="relative">
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm" 
                            className="h-5 p-1"
                            onClick={() => {
                              // 點擊顯示隱藏的原生日期選擇器
                              const dateInput = document.getElementById('item-modal-date-input');
                              if (dateInput) dateInput.click();
                            }}
                          >
                            <CalendarIcon className="h-3 w-3 text-orange-500" />
                          </Button>
                          <input 
                            id="item-modal-date-input"
                            type="date" 
                            value={typeof editedItem.expiryDate === 'string' 
                              ? editedItem.expiryDate.split('T')[0] 
                              : format((editedItem.expiryDate as Date) || new Date(), 'yyyy-MM-dd')} 
                            onChange={(e) => { 
                              const dateValue = e.target.value;
                              if (dateValue) {
                                const date = new Date(dateValue);
                                if (!isNaN(date.getTime())) { 
                                  handleEditInputChange('expiryDate', date); 
                                  // 同時更新天數
                                  const now = new Date();
                                  now.setHours(0, 0, 0, 0);
                                  const days = differenceInDays(date, now);
                                  handleEditInputChange('daysUntilExpiry', Math.max(0, days));
                                }
                              }
                            }} 
                            min={format(new Date(), 'yyyy-MM-dd')} 
                            className="opacity-0 absolute top-0 left-0 w-full h-full cursor-pointer" 
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Notify Days Before */}
                <div className="space-y-1 mb-3 border-t pt-2 mt-1">
                  <div className="flex justify-between items-center">
                    <Label className="text-sm font-medium flex items-center">
                      <BellRing className="h-4 w-4 mr-2 text-orange-500" />
                      {t('notifyMe')}
                    </Label>
                  </div>
                  <div className="mt-1">
                    <div className="flex gap-1.5 items-center">
                      <div className="flex items-center w-[35%]">
                        <Input 
                          value={editedItem.notifyDaysBefore === -1 || editedItem.notifyDaysBefore === undefined ? '0' : editedItem.notifyDaysBefore} 
                          onChange={(e) => {
                            const days = e.target.value === '' ? 0 : Math.max(0, parseInt(e.target.value, 10) || 0);
                            handleEditInputChange('notifyDaysBefore', days);
                          }}
                          type="text"
                          pattern="[0-9]*"
                          inputMode="numeric"
                          className="h-9 w-[3.5rem] text-center border-orange-200 focus:border-orange-500 focus:ring-orange-500"
                          maxLength={3}
                        />
                        <span className="ml-1 text-xs text-muted-foreground whitespace-nowrap min-w-[30px]">
                          {language === 'en' ? "days" : "天"}
                        </span>
                      </div>
                      <div className="flex gap-0.5 flex-1 justify-evenly">
                        {[1, 3, 7, 14, 30].map(days => (
                          <Button 
                            key={days} 
                            type="button" 
                            variant="outline" 
                            size="sm" 
                            className={`w-[16%] h-7 text-xs p-0 transition-all duration-200 ${
                              (editedItem.notifyDaysBefore === days) 
                                ? "bg-white dark:bg-slate-800 text-orange-500 border-orange-300 shadow-sm" 
                                : "bg-orange-50/50 dark:bg-orange-900/10 border-orange-200/50 hover:bg-white dark:hover:bg-slate-800/30 text-muted-foreground hover:text-orange-500"
                            }`} 
                            onClick={() => {
                              handleEditInputChange('notifyDaysBefore', days);
                            }}
                          >
                            {days}d
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {(editedItem.notifyDaysBefore === 0) && t('notificationDisabled')}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Static display
              <div className="space-y-2">
                <div className="bg-white dark:bg-slate-900 shadow-sm rounded-lg border border-gray-100 dark:border-gray-800 p-2">
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-orange-500" />
                    <div className="text-sm font-medium">{t('quantity')}: {currentItem.quantity}</div>
                  </div>
                </div>
                 
                {currentItem.subcategory && (
                  <div className="bg-white dark:bg-slate-900 shadow-sm rounded-lg border border-gray-100 dark:border-gray-800 p-2">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-orange-500" />
                      <div className="text-sm font-medium">{currentItem.subcategory}</div>
                    </div>
                  </div>
                )}

                <div className="bg-white dark:bg-slate-900 shadow-sm rounded-lg border border-gray-100 dark:border-gray-800 p-2">
                  <div className="flex items-center gap-2">
                    <Timer className={cn("h-4 w-4", statusInfo.colorClass)} />
                    <div className="text-sm font-medium">
                      {daysRemaining < 0 
                        ? `${t('expired')} ${formatDateWithUserPreference(format(expiryDate, 'yyyy-MM-dd'), settings.dateFormat)}`
                        : `Expires on ${formatDateWithUserPreference(format(expiryDate, 'yyyy-MM-dd'), settings.dateFormat)}`}
                    </div>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {daysRemaining < 0 
                        ? `(${Math.abs(daysRemaining)} ${t('days')} ${language === 'en' ? 'ago' : '前'})`
                        : daysRemaining === 0 
                          ? `(${t('today')})`
                          : `(${daysRemaining} ${t('days')} ${language === 'en' ? 'left' : '後'})`}
                    </span>
                  </div>
                </div>
  
                <div className="bg-white dark:bg-slate-900 shadow-sm rounded-lg border border-gray-100 dark:border-gray-800 p-2">
                  <div className="flex items-center gap-2">
                    <BellRing className="h-4 w-4 text-orange-500" />
                    <div className="text-sm font-medium">
                      {currentItem.notifyDaysBefore > 0 ? `Notify ${currentItem.notifyDaysBefore} days before` : (language === 'en' ? 'Notification Disabled' : '通知已禁用')}
                    </div>
                  </div>
                </div>
              </div>
            )
          )}
        </div>

        {/* Footer Actions */}
        {!activeAdjusterType && !justReachedZero && (
          <DialogFooter className="flex flex-row items-center gap-2 px-3 py-3 border-t bg-gradient-to-b from-gray-50 to-gray-100 dark:from-slate-900 dark:to-slate-950">
            {isEditing ? (
              <>
                <Button 
                  variant="ghost"
                  size="sm"
                  onClick={handleCancelEdit}
                  className="h-9 px-3"
                >
                  {t('cancel')}
                </Button>
                <Button 
                  size="sm"
                  onClick={handleSaveChanges}
                  className="h-9 px-4 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {t('saveChanges')}
                </Button>
              </>
            ) : (
              <>
                <div className="flex gap-2">
                  <Button 
                    variant="outline"
                    size="sm"
                    className="h-9 w-9 p-0 rounded-full hover:bg-orange-50 dark:hover:bg-orange-900/20 min-w-[44px] min-h-[44px] flex items-center justify-center"
                    onClick={handleStartEdit}
                    disabled={isUsed}
                    title={t('editItem')}
                  >
                    <PencilIcon className="h-4 w-4 text-orange-600" />
                  </Button>
                  <Button 
                    size="sm"
                    className="h-9 px-2.5 flex items-center gap-1 bg-gradient-to-br from-primary to-primary-light hover:from-primary-dark hover:to-primary active:scale-98 shadow-sm hover:shadow rounded-md"
                    onClick={handleMarkAsUsedClick}
                    disabled={isUsed}
                    title={t('used')}
                  >
                    <CheckCircle className="h-4 w-4 flex-shrink-0" /> 
                    <span className="text-xs">{t('used')}</span> 
                  </Button>
                </div>

                <div className="flex-grow"></div>
                
                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 px-2.5 flex items-center gap-1 text-red-500 border-red-200 bg-red-50 hover:bg-red-100 rounded-md"
                    onClick={handleMarkAsWastedClick}
                    disabled={isUsed}
                    title={t('wasted')}
                  >
                    <XCircle className="h-4 w-4 flex-shrink-0" />
                    <span className="text-xs">{t('wasted')}</span> 
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="destructive"
                        size="sm"
                        className="h-9 w-9 p-0 rounded-full min-w-[44px] min-h-[44px] flex items-center justify-center"
                        disabled={isUsed}
                        title={t('delete')}
                      >
                        <Trash2Icon className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t('deleteItemConfirm')}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t('deleteItemConfirmDesc')}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={handleDeleteConfirmed}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {t('delete')}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ItemModal;
