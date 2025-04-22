import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useApp, ShopItem } from '@/contexts/AppContext';
import { useTranslation, TranslationKey } from '@/utils/translations';
import { 
  ShoppingCart, 
  Plus, 
  X, 
  Trash2, 
  ShoppingBag, 
  Apple, 
  Check, 
  ArrowUpRight, 
  MoveUp, 
  Square, 
  CheckSquare,
  ListChecks,
  ShoppingBasket,
  Minus,
  Home,
  Users,
  ArrowRight,
  Hash,
  Tag,
  Package as PackageIcon,
  Search,
  Expand,
  Pencil,
  Layers,
  ChevronDown,
  LayoutPanelLeft,
  Utensils,
  Eye,
  Save,
  Copy,
  PlusCircle
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
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
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import FloatingAddButton from '@/components/FloatingAddButton';
import ItemForm from '@/components/ItemForm';
import { determineSubcategory, detectCategoryAndSubcategoryByName } from '@/utils/categoryConfig';
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const ShopList: React.FC = () => {
  const { 
    shopItems, 
    addToShopList,
    removeFromShopList, 
    toggleShopItemCheck,
    clearCheckedShopItems,
    language,
    updateShopItem,
    moveShopItemToDashboard,
    moveMultipleShopItemsToDashboard,
    showTutorial,
    settings,
    currentUser,
    categorySubcategories,
    shopListGroupBySubcategory,
    setShopListGroupBySubcategory,
  } = useApp();
  
  const t = useTranslation(language);
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<'Food' | 'Household'>('Food');
  const [newItemQuantity, setNewItemQuantity] = useState(1);
  const [newItemSubcategory, setNewItemSubcategory] = useState('');
  const [showFamilySizeHint, setShowFamilySizeHint] = useState(settings.autoAdjustFamilySize ?? false);
  const [finalCalculatedQuantity, setFinalCalculatedQuantity] = useState('1');
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isItemFormOpen, setIsItemFormOpen] = useState(false);
  const [adjustedItemIds, setAdjustedItemIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const longPressTimers = useRef<Record<string, NodeJS.Timeout>>({});
  const [isLongPressTriggeredMap, setIsLongPressTriggeredMap] = useState<Record<string, boolean>>({});

  const DEFAULT_AUTO_SCALE_SUBCATEGORIES_EN = ['Meat', 'Seafood', 'Fruits & Vegetables'];

  useEffect(() => {
    if (newItemName.length > 2) {
      console.log('[Inline Form] Detecting subcategory for:', newItemName, newItemCategory);
      const detected = detectCategoryAndSubcategoryByName(newItemName);
      if (detected) {
        console.log('[Inline Form] Detected full category & subcategory:', detected.category, detected.subcategory.name[language as 'en' | 'zh-TW' | 'zh-CN']);
        if (detected.category === 'Household') {
          setNewItemCategory('Household');
        } else {
          setNewItemCategory('Food');
        }
        setNewItemSubcategory(detected.subcategory.name[language as 'en' | 'zh-TW' | 'zh-CN']);
      } else {
        const subCategoryOnly = determineSubcategory(newItemName, newItemCategory);
        if (subCategoryOnly) {
          console.log('[Inline Form] Fallback subcategory detection:', newItemCategory, subCategoryOnly.name[language as 'en' | 'zh-TW' | 'zh-CN']);
          setNewItemSubcategory(subCategoryOnly.name[language as 'en' | 'zh-TW' | 'zh-CN']);
        }
      }
    } else if (newItemName.length === 0) {
      setNewItemSubcategory('');
    }
  }, [newItemName, newItemCategory, language]);
  
  useEffect(() => {
    if (!showFamilySizeHint) {
      setFinalCalculatedQuantity(newItemQuantity.toString());
      return;
    }

    const effectiveFamilySize = settings.familySize || 1;
    let calculatedQty = newItemQuantity;

    const foodSubcategories = categorySubcategories?.['Food'] || [];
    const householdSubcategories = categorySubcategories?.['Household'] || [];
    const allSubcategories = [...foodSubcategories, ...householdSubcategories];
    
    console.log(`[ShopList Calc] Inputs - Subcat: ${newItemSubcategory}, Qty: ${newItemQuantity}, Family: ${effectiveFamilySize}, ShowFamilySizeHint: ${showFamilySizeHint}`);
    
    if (newItemSubcategory && effectiveFamilySize > 1 && newItemQuantity >= 1) {
      const currentSubcategoryConfig = allSubcategories.find(config => 
        config.name.en === newItemSubcategory ||
        config.name[language as 'en' | 'zh-TW' | 'zh-CN'] === newItemSubcategory 
      );
      
      if (currentSubcategoryConfig) {
        const subcategoryNameEn = currentSubcategoryConfig.name.en;
        let shouldAutoScale = false;
        
        // 檢查是否啟用高級數量設置
        if (!settings.advancedQuantitySettings) {
          // 基本模式：僅對特定子類別進行調整，比例為1:1
          shouldAutoScale = DEFAULT_AUTO_SCALE_SUBCATEGORIES_EN.includes(subcategoryNameEn);
          console.log(`[ShopList Basic Mode] 子類別 ${subcategoryNameEn} 是否應調整: ${shouldAutoScale}`);
          
          if (shouldAutoScale) {
            // 基本模式下使用1:1比例
            calculatedQty = newItemQuantity * effectiveFamilySize;
            console.log(`[ShopList Basic Mode] 基本數量: ${newItemQuantity}, 家庭大小: ${effectiveFamilySize} => 結果: ${calculatedQty}`);
          }
        } else {
          // 高級模式：所有子類別都可以調整，使用每人單位設置
          shouldAutoScale = true;
          const multiplier = settings.subcategoryMultipliers?.[subcategoryNameEn] ?? 1;
          calculatedQty = newItemQuantity * effectiveFamilySize * multiplier;
          console.log(`[ShopList Advanced Mode] 基本數量: ${newItemQuantity}, 家庭大小: ${effectiveFamilySize}, 乘數: ${multiplier} => 結果: ${calculatedQty}`);
        }
        
        if (!shouldAutoScale) {
          calculatedQty = newItemQuantity; // 不調整，維持原數量
          console.log(`[ShopList No Adjustment] 子類別 ${subcategoryNameEn} - 不符合調整條件`);
        }
      } else {
        console.log(`[ShopList] 找不到子類別配置: ${newItemSubcategory}`);
      }
    } else {
      console.log(`[ShopList] 無需調整，使用原始數量: ${newItemQuantity}`);
    }

    const finalQuantityString = Math.round(calculatedQty).toString();
    setFinalCalculatedQuantity(finalQuantityString);
  }, [newItemSubcategory, newItemQuantity, settings.familySize, settings.autoAdjustFamilySize, settings.advancedQuantitySettings, settings.subcategoryMultipliers, language, categorySubcategories, showFamilySizeHint]);
  
  const clearLongPressTimer = useCallback((itemId: string) => {
    if (longPressTimers.current[itemId]) {
      console.log(`Clearing long press timer for item: ${itemId}`);
      clearTimeout(longPressTimers.current[itemId]);
      delete longPressTimers.current[itemId];
    }
  }, []);

  const startLongPressTimer = useCallback((itemId: string) => {
    clearLongPressTimer(itemId);
    setIsLongPressTriggeredMap(prev => ({ ...prev, [itemId]: false }));
    
    if (!isSelectionMode) {
      console.log(`Starting long press timer for item: ${itemId}`);
      longPressTimers.current[itemId] = setTimeout(() => {
        console.log(`Long press timer FIRED for item: ${itemId}. Entering selection mode.`);
        setIsLongPressTriggeredMap(prev => ({ ...prev, [itemId]: true })); 
        setIsSelectionMode(true);
        setSelectedItems(prev => prev.includes(itemId) ? prev : [...prev, itemId]);
        delete longPressTimers.current[itemId];
      }, 500);
    }
  }, [clearLongPressTimer, isSelectionMode]);

  const handlePointerDown = (itemId: string) => {
    console.log('Pointer down on item:', itemId);
    startLongPressTimer(itemId);
  };

  const handlePointerUp = (itemId: string) => {
    console.log('Pointer up on item:', itemId);
    clearLongPressTimer(itemId);
  };

  const handlePointerLeave = (itemId: string) => {
    clearLongPressTimer(itemId);
  };

  const handleItemClick = (item: ShopItem) => {
    const wasLongPressTriggered = isLongPressTriggeredMap[item.id];
    setIsLongPressTriggeredMap(prev => ({ ...prev, [item.id]: false }));

    if (isSelectionMode) {
      if (!wasLongPressTriggered) {
        toggleItemSelection(item.id);
      }
    }
    // 非多選模式下点击不再切换勾选状态
    // 只允许通过专用按钮或长按进入多选模式
  };
  
  const handleFloatingAddItem = () => {
    setIsItemFormOpen(true);
  };
  
  const handleAddItem = () => {
    if (!newItemName.trim()) return;
    
    const finalQuantityString = finalCalculatedQuantity;
    console.log(`[Inline Form handleAddItem] Adding item with name: ${newItemName.trim()}, quantity: ${finalQuantityString}`);
    
    addToShopList({
      name: newItemName.trim(),
      quantity: finalQuantityString,
      category: newItemCategory,
      subcategory: newItemSubcategory.trim() || undefined
    });
    
    setNewItemName('');
    setNewItemQuantity(1);
    setNewItemSubcategory('');
    setFinalCalculatedQuantity('1');
  };
  
  const handleToggleAddItem = () => {
    setIsAddingItem(!isAddingItem);
    if (!isAddingItem) {
      setNewItemName('');
      setNewItemQuantity(1);
      setNewItemSubcategory('');
      setFinalCalculatedQuantity('1');
    }
  };
  
  const toggleItemSelection = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(itemId => itemId !== id) 
        : [...prev, id]
    );
  };
  
  const handleToggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedItems([]);
  };

  const toggleGrouping = () => {
    setShopListGroupBySubcategory(!shopListGroupBySubcategory);
  };
  
  const handleMoveSelectedItems = () => {
    moveMultipleShopItemsToDashboard(selectedItems);
    setSelectedItems([]);
    setIsSelectionMode(false);
  };
  
  const handleSelectAll = () => {
    if (selectedItems.length === shopItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(shopItems.map(item => item.id));
    }
  };
  
  const handleClearCheckedItems = () => {
    clearCheckedShopItems();
  };
  
  const handleRemoveSelectedItems = () => {
    if (selectedItems.length > 0) {
      selectedItems.forEach(id => removeFromShopList(id));
      setSelectedItems([]);
      setIsSelectionMode(false);
    }
  };

  const handleToggleFamilySize = (id: string, isEnabled: boolean) => {
    const item = shopItems.find(item => item.id === id);
    if (!item || !item.subcategory) return;

    const effectiveFamilySize = settings.familySize || 1;
    if (effectiveFamilySize <= 1) return;

    const currentQty = parseInt(item.quantity) || 1;

    const foodSubcategories = categorySubcategories?.['Food'] || [];
    const householdSubcategories = categorySubcategories?.['Household'] || [];
    const allSubcategories = [...foodSubcategories, ...householdSubcategories];

    const currentSubcategoryConfig = allSubcategories.find(config => 
      config.name.en === item.subcategory ||
      config.name[language as 'en' | 'zh-TW' | 'zh-CN'] === item.subcategory
    );

    if (!currentSubcategoryConfig) return;

    const subcategoryNameEn = currentSubcategoryConfig.name.en;
    let shouldAutoScale = false;
    let multiplier = 1;
    
    // 檢查是否啟用高級數量設置
    if (!settings.advancedQuantitySettings) {
      // 基本模式：只有特定子類別會自動調整
      shouldAutoScale = DEFAULT_AUTO_SCALE_SUBCATEGORIES_EN.includes(subcategoryNameEn);
      // 基本模式下使用1:1比例
      multiplier = 1;
    } else {
      // 高級模式：所有子類別都可以調整
      shouldAutoScale = true;
      multiplier = settings.subcategoryMultipliers?.[subcategoryNameEn] ?? 1;
    }

    if (!shouldAutoScale) return;

    const effectiveFactor = effectiveFamilySize * multiplier;
    let newQuantity: number;

    if (isEnabled) {
      newQuantity = Math.round(currentQty * effectiveFactor);
      console.log(`啟用調整 (${subcategoryNameEn}): ${currentQty} * ${effectiveFactor} -> ${newQuantity}`);
    } else {
      newQuantity = Math.max(1, Math.round(currentQty / effectiveFactor));
      console.log(`禁用調整 (${subcategoryNameEn}): ${currentQty} / ${effectiveFactor} -> ${newQuantity}`);
    }

    updateShopItem(id, { quantity: newQuantity.toString() });
    
    if (isEnabled) {
      setAdjustedItemIds(prev => [...prev, id]);
    } else {
      setAdjustedItemIds(prev => prev.filter(itemId => itemId !== id));
    }
  };
  
  const handleApplyFamilyAdjustment = (item: ShopItem) => {
    if (!item || !item.subcategory || adjustedItemIds.includes(item.id)) return; 

    const effectiveFamilySize = settings.familySize || 1;
    if (effectiveFamilySize <= 1) return;

    const currentQty = parseInt(item.quantity) || 1;

    const foodSubcategories = categorySubcategories?.['Food'] || [];
    const householdSubcategories = categorySubcategories?.['Household'] || [];
    const allSubcategories = [...foodSubcategories, ...householdSubcategories];
    const currentSubcategoryConfig = allSubcategories.find(config =>
      config.name.en === item.subcategory ||
      config.name[language as 'en' | 'zh-TW' | 'zh-CN'] === item.subcategory
    );

    if (!currentSubcategoryConfig) return;

    const subcategoryNameEn = currentSubcategoryConfig.name.en;
    let shouldAutoScale = false;
    let multiplier = 1;

    // 檢查是否啟用高級數量設置
    if (!settings.advancedQuantitySettings) {
      // 基本模式：只有特定子類別會自動調整
      shouldAutoScale = DEFAULT_AUTO_SCALE_SUBCATEGORIES_EN.includes(subcategoryNameEn);
      // 基本模式下使用1:1比例
      multiplier = 1;
    } else {
      // 高級模式：所有子類別都可以調整
      shouldAutoScale = true;
      multiplier = settings.subcategoryMultipliers?.[subcategoryNameEn] ?? 1;
    }

    if (!shouldAutoScale) return; 
    
    const effectiveFactor = effectiveFamilySize * multiplier;

    if (Math.abs(effectiveFactor - 1) < 0.001) return; 
    
    const newQuantity = Math.round(currentQty * effectiveFactor);
    
    const finalQuantity = Math.max(1, newQuantity);
    
    console.log(`[Family Size Adjust] ${item.name} (${subcategoryNameEn}): ${currentQty} → ${finalQuantity}`);
    
    updateShopItem(item.id, { quantity: finalQuantity.toString() });
    setAdjustedItemIds(prev => [...prev, item.id]);
    
    return finalQuantity;
  };
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const sortedShopItems = useMemo(() => {
    let filtered = [...shopItems];
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(query) || 
        (item.subcategory && item.subcategory.toLowerCase().includes(query))
      );
    }
    
    return filtered.sort((a, b) => {
      if (a.checked && !b.checked) return 1;
      if (!a.checked && b.checked) return -1;
      if (shopListGroupBySubcategory) {
        const subA = a.subcategory || '';
        const subB = b.subcategory || '';
        if (subA < subB) return -1;
        if (subA > subB) return 1;
      }
      return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime();
    });
  }, [shopItems, shopListGroupBySubcategory, searchQuery]);
  
  const totalShopItems = shopItems.length;
  const checkedItemsCount = shopItems.filter(item => item.checked).length;
  
  const isAddButtonVisible = !showTutorial && !isSelectionMode && !isItemFormOpen;
  
  const getCategoryIcon = (category?: string) => {
    if (category === 'Food') {
      return <Utensils className="h-4 w-4 text-muted-foreground" />;
    } else if (category === 'Household') {
      return <Home className="h-4 w-4 text-muted-foreground" />;
    }
    return <Layers className="h-4 w-4 text-muted-foreground" />;
  };
  
  const allItemsSelected = sortedShopItems.length > 0 && selectedItems.length === sortedShopItems.length;

  const handleSelectAllToggle = () => {
    if (allItemsSelected) {
      setSelectedItems([]);
    } else {
      setSelectedItems(sortedShopItems.map(item => item.id));
    }
  };

  const handleClearSelection = () => {
    setSelectedItems([]);
  };
  
  const groupedItems = useMemo(() => {
    if (!shopListGroupBySubcategory) return null;
    const grouped: { [subcategory: string]: { items: ShopItem[], totalQuantity: number } } = {};
    sortedShopItems.forEach(item => {
      const subcategoryKey = item.subcategory || t('uncategorized');
      if (!grouped[subcategoryKey]) {
        grouped[subcategoryKey] = { items: [], totalQuantity: 0 };
      }
      grouped[subcategoryKey].items.push(item);
      grouped[subcategoryKey].totalQuantity += parseInt(item.quantity) || 1;
    });
    return Object.entries(grouped).sort(([keyA], [keyB]) => keyA.localeCompare(keyB));
  }, [shopListGroupBySubcategory, sortedShopItems, t]);
  
  const renderItemCard = (item: ShopItem) => (
    <div
      key={item.id}
      className={cn(
        "group relative flex flex-col p-3 bg-white hover:bg-orange-50/50 rounded-lg shadow-sm mb-1.5 transition-all duration-200 border border-orange-200 hover:border-orange-300",
        "opacity-100 w-full",
        "dark:bg-gray-800 dark:hover:bg-gray-750 dark:border-orange-900/30 dark:hover:border-orange-700/50",
        isSelectionMode && selectedItems.includes(item.id) ? "border-2 border-orange-500 dark:border-orange-500" : ""
      )}
      onClick={(e) => {
        e.stopPropagation();
        const longPressCompleted = isLongPressTriggeredMap[item.id];
        setIsLongPressTriggeredMap(prev => ({ ...prev, [item.id]: false }));

        if (!longPressCompleted) {
          if (isSelectionMode) {
            console.log(`Click detected for ${item.id}. isSelectionMode: ${isSelectionMode}. Toggling selection.`);
            toggleItemSelection(item.id);
          } else {
            console.log(`Click detected for ${item.id}. isSelectionMode: ${isSelectionMode}. Doing nothing.`);
          }
        } else {
          console.log(`Click event ignored for ${item.id} because long press completed.`);
        }
      }}
      onMouseDown={(e) => {
        if (!isSelectionMode) {
          console.log(`Mouse Down detected for ${item.id}. Starting timer.`);
          startLongPressTimer(item.id);
        }
      }}
      onTouchStart={(e) => {
        if (!isSelectionMode) {
          console.log(`Touch Start detected for ${item.id}. Starting timer.`);
          startLongPressTimer(item.id);
        }
      }}
      onMouseUp={(e) => {
        console.log(`Mouse Up detected for ${item.id}. Clearing timer.`);
        clearLongPressTimer(item.id);
      }}
      onMouseLeave={(e) => {
        console.log(`Mouse Leave detected for ${item.id}. Clearing timer.`);
        clearLongPressTimer(item.id);
      }}
      onTouchEnd={(e) => {
        console.log(`Touch End detected for ${item.id}. Clearing timer.`);
        clearLongPressTimer(item.id);
      }}
      onTouchCancel={(e) => {
        console.log(`Touch Cancel detected for ${item.id}. Clearing timer.`);
        clearLongPressTimer(item.id);
      }}
    >
      {isSelectionMode && (
        <div className={`absolute inset-0 z-10 flex items-center justify-center transition-all duration-200 ${selectedItems.includes(item.id) ? "bg-primary/20 dark:bg-primary/30" : "bg-black/5 dark:bg-black/10"}`}>
          <div className={`h-6 w-6 rounded-full flex items-center justify-center border-2 transition-all duration-200 ${selectedItems.includes(item.id) 
            ? "bg-primary border-primary text-primary-foreground scale-100"
            : "bg-background/70 backdrop-blur-sm border-gray-400 dark:border-gray-600 scale-90"}`}>
            {selectedItems.includes(item.id) && <Check className="h-4 w-4" />}
          </div>
        </div>
      )}
      <div className="flex items-start justify-between mb-2 relative">
        <div className="flex-1 min-w-0 pr-2">
          <span className={cn(
            "font-medium text-sm text-foreground break-words block",
            "dark:text-gray-100",
            item.checked && "line-through text-muted-foreground dark:text-gray-400"
          )}>
            {item.name}
          </span>
        </div>
      </div>
      
      <div className="flex items-center justify-between mt-1 relative">
        <div className="flex items-center">
          <div className="flex items-center bg-orange-50 dark:bg-gray-700/60 rounded-full overflow-hidden border border-orange-200 dark:border-gray-600">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 w-7 p-0 rounded-full hover:bg-orange-50 dark:hover:bg-orange-900/20 focus-visible:ring-1 focus-visible:ring-orange-300 flex-shrink-0 text-orange-600 transition-colors" 
              disabled={isSelectionMode}
              onClick={(e) => {
                if (isSelectionMode) return;
                e.stopPropagation();
                const currentQuantity = parseInt(item.quantity) || 1;
                if (currentQuantity > 1) {
                  updateShopItem(item.id, { quantity: (currentQuantity - 1).toString() });
                }
              }}
            >
              <Minus className="h-3.5 w-3.5" />
            </Button>
            <div className="px-2 font-medium text-orange-700 dark:text-orange-200">
              {item.quantity}
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 w-7 p-0 rounded-full hover:bg-orange-50 dark:hover:bg-orange-900/20 focus-visible:ring-1 focus-visible:ring-orange-300 flex-shrink-0 text-orange-600 transition-colors" 
              disabled={isSelectionMode}
              onClick={(e) => {
                if (isSelectionMode) return;
                e.stopPropagation();
                const currentQuantity = parseInt(item.quantity) || 1;
                updateShopItem(item.id, { quantity: (currentQuantity + 1).toString() });
              }}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost" 
            size="sm" 
            disabled={isSelectionMode}
            onClick={(e) => {
              if (isSelectionMode) return;
              e.stopPropagation();
              moveShopItemToDashboard(item.id);
            }}
            className="h-7 w-7 p-0 rounded-full text-muted-foreground hover:text-orange-600 hover:bg-orange-50 dark:hover:text-orange-400 dark:hover:bg-orange-900/20 transition-colors"
            title={language === 'en' ? 'Add to Dashboard' : '添加到主頁'}
          >
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost" 
            size="sm" 
            disabled={isSelectionMode}
            onClick={(e) => {
              if (isSelectionMode) return;
              e.stopPropagation();
              removeFromShopList(item.id);
            }}
            className="h-7 w-7 p-0 rounded-full text-muted-foreground hover:text-red-500 hover:bg-red-50/80 dark:hover:text-red-400 dark:hover:bg-red-900/20 transition-colors"
            title={language === 'en' ? 'Delete' : '刪除'}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
  
  return (
    <div className="w-full max-w-[100%] sm:max-w-md mx-auto px-1 sm:px-2 py-3 sm:py-4 pb-20 flex flex-col">
      <div className="sticky top-[60px] sm:top-[70px] z-30 bg-background/90 backdrop-blur-md pt-1 pb-2 border-b border-gray-100 dark:border-gray-800 mb-3 shadow-sm">
        <div className="flex items-center justify-between space-y-2">
          <div className="flex items-center gap-1.5">
            {isSelectionMode ? (
              <Button 
                variant="outline"
                size="sm"
                className="h-8 px-2.5 border-red-200 bg-red-50 text-red-600 hover:bg-red-100 rounded-full"
                onClick={handleToggleSelectionMode}
              >
                <X className="h-4 w-4 mr-1" />
                {language === 'en' ? "Cancel" : "取消"}
              </Button>
            ) : (
              <>
                <Button 
                  variant={isAddingItem ? "ghost" : "outline"}
                  className={`h-9 px-3 rounded-lg flex items-center gap-1.5 border-orange-200 ${isAddingItem 
                    ? "bg-white shadow-sm text-orange-700 border-2 border-orange-500" 
                    : "bg-white hover:bg-white hover:border-orange-300 text-orange-600"}`}
                  onClick={handleToggleAddItem}
                >
                  {isAddingItem ? (
                    <>
                      <X className="h-4 w-4" />
                      <span className="text-sm">{language === 'en' ? 'Cancel' : '取消'}</span>
                    </>
                  ) : (
                    <>
                      <PlusCircle className="h-4 w-4" />
                      <span className="text-sm">{language === 'en' ? 'Add Item' : '添加項目'}</span>
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {!isSelectionMode && (
              <Button
                variant="outline"
                className={`h-9 w-9 p-0 rounded-full border-orange-200 ${shopListGroupBySubcategory ? "bg-orange-200 text-orange-700 shadow-sm" : "bg-white hover:bg-orange-100/50"} flex items-center justify-center`}
                onClick={toggleGrouping}
              >
                <LayoutPanelLeft className="h-4 w-4 text-orange-600" />
              </Button>
            )}
            
            {!isSelectionMode && (
              <Button
                variant="outline"
                className={`h-9 w-9 p-0 rounded-full border-orange-200 ${isSelectionMode ? "bg-orange-200 text-orange-700 shadow-sm" : "bg-white hover:bg-orange-100/50"} flex items-center justify-center`}
                onClick={handleToggleSelectionMode}
              >
                <ListChecks className="h-4 w-4 text-orange-600" />
              </Button>
            )}
          </div>
        </div>
        
        {/* 搜索欄和統計數字 */}
        {!isSelectionMode ? (
          <div className="flex items-center gap-2 mt-2">
            <div className="relative flex-1 w-full max-w-[90%]">
              <Input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder={language === 'en' ? "Search items..." : "搜索項目..."}
                className="pl-10 pr-10 h-10 w-full bg-white dark:bg-gray-800 border-orange-200 dark:border-gray-700 rounded-full shadow-sm focus-visible:ring-1 focus-visible:ring-orange-300 dark:focus-visible:ring-orange-700"
              />
              <div className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground">
                <Search className="h-4 w-4" />
              </div>
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearSearch}
                  className="h-6 w-6 p-0 absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
            
            <div className="flex gap-2 justify-end">
              <Badge variant="outline" className="h-8 px-2 border-orange-200 bg-white flex items-center gap-1 rounded-full">
                <span className="text-xs font-medium text-orange-900">{sortedShopItems.length} {language === 'en' ? "items" : "項目"}</span>
              </Badge>
              
              <Badge variant="outline" className="h-8 px-2 border-orange-200 bg-white flex items-center gap-1 rounded-full">
                <span className="text-xs font-medium text-orange-900">{sortedShopItems.reduce((total, item) => total + (parseInt(item.quantity) || 1), 0)} {language === 'en' ? "units" : "單位"}</span>
              </Badge>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2 mt-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleMoveSelectedItems}
              className="h-9 px-2.5 rounded-full border-orange-200 flex items-center justify-center bg-white hover:bg-orange-50 hover:text-orange-600 active:bg-orange-100"
            >
              <ArrowUpRight className="h-4 w-4 mr-1 text-orange-600" />
              <span className="text-xs text-orange-900">
                {language === 'en' ? "Add to Dashboard" : "添加到主頁"}
              </span>
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleSelectAllToggle}
              className="h-9 px-2.5 rounded-full border-orange-200 flex items-center justify-center bg-white hover:bg-orange-50 hover:text-orange-600 active:bg-orange-100"
              disabled={sortedShopItems.length === 0}
            >
              {allItemsSelected ? 
                <Check className="h-4 w-4 mr-1 text-orange-600" /> : 
                <CheckSquare className="h-4 w-4 mr-1 text-orange-600" />
              }
              <span className="text-xs text-orange-900">
                {allItemsSelected 
                  ? (language === 'en' ? "Deselect All" : "取消全選") 
                  : (language === 'en' ? "Select All" : "全選")}
              </span>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRemoveSelectedItems}
              className="h-9 w-9 p-0 rounded-full border-orange-200 bg-white hover:bg-red-50 hover:text-red-600 hover:border-red-200 active:bg-red-100"
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        )}
      </div>
      
      {isAddingItem && (
        <div className="bg-primary/5 dark:bg-gray-800/50 rounded-lg p-4 mb-5 shadow-sm border border-orange-100 dark:border-orange-900/30">
          <h2 className="text-sm font-medium mb-3 text-orange-800 dark:text-orange-200 flex items-center">
            <Plus className="h-4 w-4 mr-1.5 text-orange-600 dark:text-orange-400" />
            {language === 'en' ? 'Add Item to ShopList' : '添加項目到購物清單'}
          </h2>
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="relative w-full">
                <Input
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder={language === 'en' ? 'Enter item name' : '輸入項目名稱'}
                  className="border-orange-200 focus:ring-orange-300 focus-visible:ring-orange-300 flex-1 pr-8 dark:border-orange-900/40 dark:focus:ring-orange-500/40"
                />
                {newItemName && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setNewItemName('')}
                    className="h-6 w-6 p-0 absolute right-2 top-1/2 transform -translate-y-1/2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <X className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-750 shadow-sm rounded-lg p-3 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium flex items-center text-slate-700 dark:text-slate-200">
                  <Hash className="h-3.5 w-3.5 mr-1.5 text-orange-500 dark:text-orange-400" />
                  {t('quantity')}
                </Label>
                <div className="flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-muted-foreground dark:text-gray-400 mr-0.5"/>
                  <Label htmlFor="family-toggle-inline" className="text-xs text-muted-foreground dark:text-gray-400 cursor-pointer">
                    {language === 'en' ? 'Auto-adjust' : '自動調整'}
                  </Label>
                  <span className="ml-1 px-1.5 py-0.5 text-xs font-medium text-orange-700 dark:text-orange-300 bg-orange-100 dark:bg-orange-900/50 rounded">
                    x{settings.familySize || 1}
                  </span>
                  <div className={`ml-1 ${showFamilySizeHint ? 'bg-orange-200 dark:bg-orange-700' : 'bg-gray-200 dark:bg-gray-600'} rounded-full w-11 h-6 flex-shrink-0 relative`}>
                    <div className={`absolute top-0.5 left-0.5 rounded-full w-5 h-5 transition-transform ${showFamilySizeHint ? 'translate-x-5 bg-orange-500' : 'translate-x-0 bg-white dark:bg-gray-300'}`}></div>
                    <input 
                      type="checkbox" 
                      id="family-toggle-inline"
                      checked={showFamilySizeHint}
                      onChange={(e) => {
                        setShowFamilySizeHint(e.target.checked);
                      }}
                      disabled={settings.familySize <= 1}
                      className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
                    />
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="ml-1 rounded-full border border-orange-200 w-3.5 h-3.5 flex items-center justify-center">
                          <span className="text-[8px] text-orange-500">i</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="w-64 p-2">
                        <p className="text-xs mb-1">
                          {language === 'en' 
                            ? 'When enabled, quantity will be automatically adjusted based on your family size.' 
                            : '啟用後，數量將根據您的家庭人數自動調整。'}
                        </p>
                        {!settings.advancedQuantitySettings ? (
                          <p className="text-xs">
                            {language === 'en' 
                              ? 'This applies to Meat, Seafood, Fruits & Vegetables categories by default.' 
                              : '預設情況下，此功能適用於肉類、海鮮、水果和蔬菜類別。'}
                          </p>
                        ) : (
                          <p className="text-xs">
                            {language === 'en' 
                              ? 'Advanced quantity settings are enabled. Custom units per person will be used for all subcategories.' 
                              : '已啟用進階數量設定。所有子類別將使用每人自訂單位。'}
                          </p>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
              <div className="flex gap-2 mt-2.5">
                <div className="w-1/2 flex items-center bg-white dark:bg-slate-900 border rounded-md overflow-hidden border-orange-200">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={() => setNewItemQuantity(Math.max(1, newItemQuantity - 1))} 
                    disabled={newItemQuantity <= 1} 
                    className="h-8 w-8 p-1.5 rounded-none focus:ring-0 border-none flex-shrink-0"
                  >
                    <Minus className="h-3.5 w-3.5 text-orange-500" />
                  </Button>
                  <div className="flex-1 text-center font-medium border-x border-orange-200 text-slate-700 dark:text-slate-300">
                    {newItemQuantity}
                  </div>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={() => setNewItemQuantity(newItemQuantity + 1)} 
                    className="h-8 w-8 p-1.5 rounded-none focus:ring-0 border-none flex-shrink-0"
                  >
                    <Plus className="h-3.5 w-3.5 text-orange-500" />
                  </Button>
                </div>
                <div className="w-1/2 rounded-md border border-orange-200 flex items-center px-2.5 py-1 bg-orange-50/50">
                  {showFamilySizeHint && newItemQuantity.toString() !== finalCalculatedQuantity ? (
                    <>
                      <Users className="h-3.5 w-3.5 mr-0.5 text-orange-500" />
                      <span className="mx-0.5 text-xs text-orange-700">{newItemQuantity}</span>
                      <span className="mx-0.5 text-xs text-orange-700">x{settings.familySize || 1}</span>
                      <span className="mx-0.5 text-xs text-orange-700">→</span>
                      <span className="text-xs font-medium text-orange-700">{finalCalculatedQuantity} {language === 'en' ? 'units' : '單位'}</span>
                    </>
                  ) : (
                    <>
                      <span className="text-xs font-medium text-orange-700">{finalCalculatedQuantity} {language === 'en' ? 'units' : '單位'}</span>
                    </>
                  )}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="ml-1 rounded-full border border-orange-200 w-3.5 h-3.5 flex items-center justify-center">
                          <span className="text-[8px] text-orange-500">i</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        {showFamilySizeHint && newItemQuantity.toString() !== finalCalculatedQuantity ? (
                          <p className="text-xs">
                            {language === 'en' 
                              ? 'Quantity adjusted for your family size' 
                              : '根據家庭人數調整數量'}
                          </p>
                        ) : (
                          <p className="text-xs">
                            {language === 'en' 
                              ? 'Original quantity (no adjustment applied)' 
                              : '原始數量（未應用調整）'}
                          </p>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-shrink-0">
                <label className="text-xs text-muted-foreground flex items-center mb-1.5">
                  <Layers className="h-4 w-4 mr-1 text-orange-500 flex-shrink-0" />
                  {t('category')}
                </label>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setNewItemCategory('Food')}
                    className={cn(
                      "w-10 h-10 p-0", 
                      newItemCategory === 'Food' 
                        ? "border-2 border-orange-500 text-orange-500 bg-transparent"
                        : "bg-transparent border border-gray-300 text-gray-400"
                    )}
                    title={t('food')}
                  >
                    <Utensils className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setNewItemCategory('Household')}
                    className={cn(
                      "w-10 h-10 p-0", 
                      newItemCategory === 'Household' 
                        ? "border-2 border-orange-500 text-orange-500 bg-transparent"
                        : "bg-transparent border border-gray-300 text-gray-400"
                    )}
                    title={t('household')}
                  >
                    <Home className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex-1">
                <label className="text-xs text-muted-foreground flex items-center mb-1.5">
                  <Tag className="h-4 w-4 mr-1 text-orange-500 flex-shrink-0" />
                  {t('subcategory')}
                </label>
                <Select 
                  value={newItemSubcategory} 
                  onValueChange={(value) => setNewItemSubcategory(value)}
                >
                  <SelectTrigger className="border-orange-200 w-full focus:ring-orange-300 focus-visible:ring-orange-300">
                    <SelectValue placeholder={language === 'en' ? 'Select subcategory' : '選擇子類別'} />
                  </SelectTrigger>
                  <SelectContent className="border-orange-200 max-h-[30vh]">
                    {(categorySubcategories?.[newItemCategory] || []).map((sub) => {
                      const subcategoryName = sub.name[language as 'en' | 'zh-TW' | 'zh-CN'] || sub.name.en;
                      return (
                        <SelectItem key={sub.name.en} value={subcategoryName}>
                          <div className="flex items-center justify-between w-full">
                            <span>{subcategoryName}</span>
                            <span className="ml-2 text-xs text-orange-500 font-semibold bg-orange-100 dark:bg-orange-900/30 px-1.5 py-0.5 rounded-full">
                              {sub.defaultExpiryDays} {language === 'en' ? 'days' : '天'}
                            </span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex space-x-2 mb-2 mx-auto">
              <Button
                onClick={handleAddItem}
                className="px-4 py-2 bg-gradient-to-br from-primary to-primary-light hover:from-primary-dark hover:to-primary rounded-lg text-white flex items-center justify-center h-10 shadow-md hover:shadow-lg active:scale-98 transition-all duration-200 w-1/2"
                disabled={!newItemName.trim()}
              >
                <Save className="h-4 w-4 mr-1.5" />
                Save to List
              </Button>
              <Button
                onClick={handleAddItem}
                className="px-4 py-2 bg-orange-100 hover:bg-orange-200 text-orange-600 border border-orange-200 rounded-lg flex items-center justify-center h-10 shadow-md hover:shadow-lg active:scale-98 transition-all duration-200 w-1/2"
                disabled={!newItemName.trim()}
              >
                <PlusCircle className="h-4 w-4 mr-1.5" />
                Save & Add More
              </Button>
            </div>
          </div>
        </div>
      )}
      
      <div className="mt-4 flex-1 overflow-hidden">
        {sortedShopItems.length > 0 ? (
          shopListGroupBySubcategory ? (
            <ScrollArea className="-mr-1 sm:-mr-3 pr-1 sm:pr-3 flex-1 overflow-auto">
              <div className="space-y-4">
                {groupedItems?.map(([subcategoryName, groupData]) => {
                  const firstItem = groupData.items[0];
                  const category = firstItem?.category || 'Food';
                  return (
                    <div key={subcategoryName}>
                      <div className="flex items-center justify-between px-3 py-2 bg-orange-50 rounded-md mb-2 border border-orange-100 sticky top-0 z-10 dark:bg-gray-800/90 dark:border-orange-900/30">
                        <div className="flex items-center">
                          {category === 'Food' ? 
                            <Utensils className="h-4 w-4 mr-2 text-orange-600 dark:text-orange-400" /> : 
                            <Home className="h-4 w-4 mr-2 text-orange-600 dark:text-orange-400" />
                          }
                          <span className="text-sm font-medium text-orange-900 dark:text-orange-200">{subcategoryName}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-[#c44714] dark:text-orange-300">
                            {groupData.items.length} {language === 'en' ? 'items' : '項目'}
                          </span>
                          <span className="text-xs text-[#c44714] dark:text-orange-300">
                            {groupData.totalQuantity} {language === 'en' ? 'units' : '單位'}
                          </span>
                          <ChevronDown className="h-4 w-4 text-orange-400 opacity-50 dark:text-orange-300" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {groupData.items.map(renderItemCard)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          ) : (
            <ScrollArea className="-mr-1 sm:-mr-3 pr-1 sm:pr-3 flex-1 overflow-auto">
              <div className="grid grid-cols-2 gap-2">
                {sortedShopItems.map(renderItemCard)}
              </div>
            </ScrollArea>
          )
        ) : (
          !isAddingItem && (
            <div className="flex flex-col items-center justify-center text-center p-8 bg-primary/5 dark:bg-gray-800/50 rounded-lg border border-primary/10 dark:border-orange-900/20">
              <p className="text-sm text-orange-800 dark:text-orange-200 mb-4 max-w-xs">
                {language === 'en' ? 'Your shopping list is empty' : '您的購物清單還沒有項目'}
              </p>
              <Button 
                onClick={handleToggleAddItem} 
                className="bg-orange-500 hover:bg-orange-600 text-white dark:bg-orange-600 dark:hover:bg-orange-700 h-10 flex items-center px-4 py-2 rounded-lg shadow-md hover:shadow-lg active:scale-98 transition-all duration-200"
              >
                <PlusCircle className="h-4 w-4 mr-1.5" />
                {language === 'en' ? 'Add Item' : '添加項目'}
              </Button>
            </div>
          )
        )}
      </div>
      
      <ItemForm 
        open={isItemFormOpen} 
        onOpenChange={setIsItemFormOpen} 
        isShopListMode={true}
      />
    </div>
  );
};

export default ShopList;

// Layout/container mobile optimization (example, actual code may vary):
// Find the main container/card rendering and update their className/style props to ensure:
// - max-w-full or w-full for containers
// - overflow-x-hidden
// - responsive padding/margin
// - card width: w-full or max-w-xs with mx-auto
// - grid: grid-cols-1 or grid-cols-2 for mobile