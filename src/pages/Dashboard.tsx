import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { PlusIcon, ListIcon, LayoutGrid, Apple, Mic, Barcode, Zap, Siren, Edit2, Archive, Tag, ArrowUpDown, Check, InfoIcon, Home, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Filter, Settings, Search, X, FolderIcon, SlidersHorizontal, Layers, Clock, AlertCircle, PackageIcon, Combine, Group, SeparatorHorizontal, DivideIcon, LayoutPanelLeft, LibraryIcon, Rows3Icon, CheckSquare, RotateCw, ShoppingCart, AlignJustify, Hash, AlertTriangle, ListChecks, LayoutList, Users, FilterX, ArrowUpRight, Trash2, PercentIcon, CheckCircle, XCircle, Calendar, Timer, TrendingUp, TrendingDown, Minus, Utensils, ListFilter, Circle, Eye, CalendarDays, Text, CheckCircle2 } from 'lucide-react';
import { Input } from "@/components/ui/input";
import ItemCard from '@/components/ItemCard';
import ItemModal from '@/components/ItemModal';
import ItemForm from '@/components/ItemForm';
import { useApp, Item } from '@/contexts/AppContext';
import { calculateDaysUntilExpiry } from '@/contexts/AppContext';
import { useTranslation, TranslationKey } from '@/utils/translations';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import BarcodeScanner from '@/components/BarcodeScanner';
import FloatingAddButton from '@/components/FloatingAddButton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

// 視圖模式類型
type ViewMode = 'grid' | 'compact' | 'group';

// 排序類型
type SortType = 'name' | 'expiry' | 'quantity';

const Dashboard: React.FC = () => {
  const { 
    items, 
    filter, 
    setFilter, 
    sort, 
    selectedItem, 
    language, 
    setSelectedItem, 
    urgentFilter,
    setUrgentFilter,
    viewMode,
    setViewMode,
    setSort,
    showTutorial,
    markItemAsUsed,
    deleteItem,
    addToShopList,
    dashboardGroupBySubcategory,
    setDashboardGroupBySubcategory,
  } = useApp();
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<Item | null>(null);
  const [reAddItem, setReAddItem] = useState<Item | null>(null);
  const [inputMode, setInputMode] = useState<'manual' | 'voice' | 'barcode'>('manual');
  const [isBarcodeOpen, setIsBarcodeOpen] = useState(false);
  const [collapsedSubcategories, setCollapsedSubcategories] = useState<string[]>([]);
  const [showFilterControls, setShowFilterControls] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);
  const [subcategorySearchQuery, setSubcategorySearchQuery] = useState<string>('');
  const [isMultiSelectMode, setIsMultiSelectMode] = useState<boolean>(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  
  // 新增狀態：控制後續操作模態框
  const [postActionModalOpen, setPostActionModalOpen] = useState<boolean>(false);
  const [postActionItems, setPostActionItems] = useState<Item[]>([]);
  const [postActionType, setPostActionType] = useState<'used' | 'wasted' | null>(null);
  const [postActionItemIndex, setPostActionItemIndex] = useState<number>(0); // 追蹤當前處理項目的索引
  
  const t = useTranslation(language);
  
  // 添加狀態管理滾動
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  const handleAddItem = () => {
    setFormOpen(true);
  };
  
  const handleBarcodeScanComplete = (barcodeResult: string | null) => {
    if (barcodeResult) {
      if (!formOpen) {
        setFormOpen(true);
      }
    }
  };

  const handleTriggerReAdd = (itemToReAdd: Item) => {
    console.log('重新添加項目流程開始', itemToReAdd.name);
    // 重置之前可能有的editItem
    setEditItem(null);
    // 清空可能已有的其他物品狀態
    const cleanedItem = {
      ...itemToReAdd,
      // 確保物品已標記為已使用
      used: true,
      dateUsed: itemToReAdd.dateUsed || new Date().toISOString()
    };
    console.log('設置reAddItem狀態', cleanedItem);
    setReAddItem(cleanedItem);
    // 打開編輯表單以讓用戶調整重新添加的物品
    setFormOpen(true);
    console.log('打開編輯表單完成');
  };

  // 切換是否按子類別分組
  const toggleGrouping = () => {
    setDashboardGroupBySubcategory(!dashboardGroupBySubcategory);
  };
  
  // 切換子類別的展開/收起狀態
  const toggleSubcategory = (subcategory: string) => {
    setCollapsedSubcategories(prev => 
      prev.includes(subcategory)
        ? prev.filter(sub => sub !== subcategory)
        : [...prev, subcategory]
    );
  };
  
  // Filter for items that are NOT used AND NOT deleted
  const activeItems = items.filter(item => !item.used && !item.deleted);

  // Apply urgency filter first (if selected)
  const urgencyFilteredItems = activeItems.filter(item => {
    const daysUntil = calculateDaysUntilExpiry(item.expiryDate);
    if (urgentFilter === 'expiring') return daysUntil >= 0 && daysUntil <= 4;
    if (urgentFilter === 'expired') return daysUntil < 0;
    return true; // 'all' case - no urgency filter applied
  });

  // Apply category filters
  const categoryFilteredItems = urgencyFilteredItems.filter(item => {
    // Apply category filter independently regardless of urgency filter
    if (filter === 'All') return true;
    if (filter === 'Food' || filter === 'Household') return item.category === filter;
    return true;
  });
  
  // 應用子類別過濾器
  const subcategoryFilteredItems = categoryFilteredItems.filter(item => {
    // 如果沒有選擇子類別或選擇了所有子類別，顯示所有項目
    if (selectedSubcategories.length === 0) return true;
    // 否則，僅顯示選定子類別的項目
    return item.subcategory && selectedSubcategories.includes(item.subcategory);
  });
  
  // 添加搜索過濾
  const searchFilteredItems = subcategoryFilteredItems.filter(item => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    return (
      item.name.toLowerCase().includes(query) || 
      (item.subcategory && item.subcategory.toLowerCase().includes(query))
    );
  });
  
  const sortedItems = [...searchFilteredItems].sort((a, b) => {
    if (sort === 'name') {
      return a.name.localeCompare(b.name);
    } else if (sort === 'expiry') {
      return calculateDaysUntilExpiry(a.expiryDate) - calculateDaysUntilExpiry(b.expiryDate);
    } else if (sort === 'quantity') {
      // 確保 quantity 屬性存在，若不存在則視為 1
      const quantityA = typeof a.quantity === 'number' ? a.quantity : 1;
      const quantityB = typeof b.quantity === 'number' ? b.quantity : 1;
      return quantityB - quantityA;
    } else {
      // 默認按名稱排序
      return a.name.localeCompare(b.name);
    }
  });

  // Calculate unique items count
  const uniqueItemCount = sortedItems.length;
  
  // Calculate total quantity of items
  const totalItemQuantity = sortedItems.reduce((total, item) => {
    const quantity = parseInt(item.quantity) || 0;
    return total + quantity;
  }, 0);

  // 獲取所有活躍項目的唯一子類別列表
  const getAllUniqueSubcategories = (): string[] => {
    const subcategories = new Set<string>();
    activeItems.forEach(item => {
      if (item.subcategory && item.subcategory.trim() !== '') {
        subcategories.add(item.subcategory);
      }
    });
    return Array.from(subcategories).sort();
  };
  
  const uniqueSubcategories = getAllUniqueSubcategories();
  
  // 切換子類別選擇
  const toggleSubcategorySelection = (subcategory: string) => {
    setSelectedSubcategories(prev => {
      if (prev.includes(subcategory)) {
        return prev.filter(sub => sub !== subcategory);
      } else {
        return [...prev, subcategory];
      }
    });
  };
  
  // 清除所有選定的子類別
  const clearSubcategorySelection = () => {
    setSelectedSubcategories([]);
  };

  // 過濾後的子類別列表（支持搜尋）
  const filteredSubcategories = useMemo(() => {
    if (!subcategorySearchQuery) return uniqueSubcategories;
    return uniqueSubcategories.filter(subcategory => 
      subcategory.toLowerCase().includes(subcategorySearchQuery.toLowerCase())
    );
  }, [uniqueSubcategories, subcategorySearchQuery]);
  
  // 處理子類別搜尋
  const handleSubcategorySearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSubcategorySearchQuery(e.target.value);
  };
  
  // 清除子類別搜尋
  const handleClearSubcategorySearch = () => {
    setSubcategorySearchQuery('');
  };
  
  // 處理搜索輸入的變化
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // 清除搜索
  const handleClearSearch = () => {
    setSearchQuery('');
  };

  // 按子類別分組項目
  const getItemsBySubcategory = (itemsToGroup: Item[], currentSort: 'name' | 'expiry' | 'quantity' = sort) => {
    const subcategoryGroups: { [key: string]: { items: Item[], totalQuantity: number } } = {}; // Updated type
    const uniqueSubcategories = new Set<string>();
    let hasUncategorized = false;

    console.log("getItemsBySubcategory: Processing items:", itemsToGroup);

    itemsToGroup.forEach(item => {
      const subcat = item.subcategory;
      console.log(`Item: ${item.name}, Category: ${item.category}, Subcategory: ${subcat}`);
      if (subcat && subcat.trim() !== '') {
        uniqueSubcategories.add(subcat);
      } else {
        hasUncategorized = true;
        console.log(`-> Found uncategorized item: ${item.name}`);
      }
    });

    // 創建子類別分組
    uniqueSubcategories.forEach(subcat => {
      const groupItems = itemsToGroup.filter(item => item.subcategory === subcat);
      if (groupItems.length > 0) {
        // 根據當前排序方式對子類別內的項目進行排序
        const sortedItems = [...groupItems].sort((a, b) => {
          if (currentSort === 'name') {
            return a.name.localeCompare(b.name);
          } else if (currentSort === 'expiry') {
            return calculateDaysUntilExpiry(a.expiryDate) - calculateDaysUntilExpiry(b.expiryDate);
          } else if (currentSort === 'quantity') {
            const quantityA = parseInt(a.quantity) || 1;
            const quantityB = parseInt(b.quantity) || 1;
            return quantityB - quantityA;
          } else {
            return a.name.localeCompare(b.name);
          }
        });
        const totalQuantity = sortedItems.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0);
        subcategoryGroups[subcat] = { items: sortedItems, totalQuantity: totalQuantity }; // Store items and total quantity
      }
    });

    // 按名稱排序子類別
    const sortedSubcategories = Object.keys(subcategoryGroups).sort((a, b) => a.localeCompare(b));

    // 然後添加未分類的項目（包括子類別為空字符串的項目）
    if (hasUncategorized) {
      // 找出所有沒有子類別或子類別為空字符串的項目
      const uncategorizedItems = itemsToGroup.filter(item => !item.subcategory || item.subcategory.trim() === '');
      if (uncategorizedItems.length > 0) {
        // 同樣根據當前排序方式排序未分類項目
        const sortedUncategorizedItems = [...uncategorizedItems].sort((a, b) => {
          if (currentSort === 'name') {
            return a.name.localeCompare(b.name);
          } else if (currentSort === 'expiry') {
            return calculateDaysUntilExpiry(a.expiryDate) - calculateDaysUntilExpiry(b.expiryDate);
          } else if (currentSort === 'quantity') {
            const quantityA = parseInt(a.quantity) || 1;
            const quantityB = parseInt(b.quantity) || 1;
            return quantityB - quantityA;
          } else {
            return a.name.localeCompare(b.name);
          }
        });
        
        const groupName = language === 'en' ? 'Uncategorized' : '未分類';
        const totalQuantity = sortedUncategorizedItems.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0);
        subcategoryGroups[groupName] = { items: sortedUncategorizedItems, totalQuantity: totalQuantity }; // Store items and total quantity
        console.log(`-> Added Uncategorized group with ${sortedUncategorizedItems.length} items.`);
      }
    }
    
    console.log("getItemsBySubcategory: Resulting groups:", subcategoryGroups);
    return subcategoryGroups;
  };
  
  // 關閉表單時重置狀態
  useEffect(() => {
    if (!formOpen) {
      setEditItem(null);
      setReAddItem(null);
      // 不需要每次關閉都重置輸入模式，讓它保持原樣以便下次打開時使用相同的模式
    }
  }, [formOpen]);

  // 統一多個項目的使用和浪費處理邏輯
  const handleMarkItemsAsUsed = (itemIds: string[]) => {
    const processedItems = itemIds.map(id => items.find(item => item.id === id)).filter(Boolean) as Item[];
    const processedItemsCount = processedItems.length;
    
    if (processedItemsCount === 0) return;

    // 標記項目為已使用
    processedItems.forEach(item => markItemAsUsed(item.id));
    
    // 清除選擇並退出多選模式
    clearSelectedItems();
    
    // 設置狀態以打開後續操作模態框，並從第一個項目開始
    setPostActionItems(processedItems);
    setPostActionType('used');
    setPostActionItemIndex(0); // 從索引 0 開始
    setPostActionModalOpen(true);
  };

  const handleMarkItemsAsWasted = (itemIds: string[]) => {
    const processedItems = itemIds.map(id => items.find(item => item.id === id)).filter(Boolean) as Item[];
    const processedItemsCount = processedItems.length;
    
    if (processedItemsCount === 0) return;

    // 刪除項目 (代表浪費)
    processedItems.forEach(item => deleteItem(item.id));
    
    // 清除選擇並退出多選模式
    clearSelectedItems();
    
    // 設置狀態以打開後續操作模態框，並從第一個項目開始
    setPostActionItems(processedItems);
    setPostActionType('wasted');
    setPostActionItemIndex(0); // 從索引 0 開始
    setPostActionModalOpen(true);
  };
  
  // 處理後續操作模態框中的按鈕點擊
  const handlePostAction = (action: 'readd' | 'add_to_list' | 'close') => {
    const currentItem = postActionItems[postActionItemIndex];
    if (!currentItem) return;

    switch (action) {
      case 'readd':
        handleTriggerReAdd(currentItem);
        break;
      case 'add_to_list':
        addToShopList({
          name: currentItem.name,
          quantity: currentItem.quantity,
          category: currentItem.category,
          subcategory: currentItem.subcategory,
          originItemId: currentItem.id
        });
        toast({
          title: language === 'en' ? 'Added to Shopping List' : '已添加到購物清單',
          description: `${currentItem.name} ${language === 'en' ? 'added' : '已添加'}`,
          variant: "success"
        });
        break;
      case 'close':
        // 無需額外操作
        break;
    }

    // 檢查是否有下一個項目
    const nextIndex = postActionItemIndex + 1;
    if (nextIndex < postActionItems.length) {
      // 移至下一個項目
      setPostActionItemIndex(nextIndex);
    } else {
      // 所有項目處理完畢，關閉模態框並重置狀態
      setPostActionModalOpen(false);
      setPostActionItems([]);
      setPostActionItemIndex(0);
      setPostActionType(null);
    }
  };

  // Handle item click
  const handleItemClick = (item: Item) => {
    if (isMultiSelectMode) {
      toggleItemSelection(item.id);
    } else {
      setSelectedItem(item);
    }
  };

  // Handle item long press
  const handleItemLongPress = (item: Item) => {
    if (!isMultiSelectMode) {
      setIsMultiSelectMode(true);
      // Ensure the long-pressed item is selected immediately
      if (!selectedItems.includes(item.id)) {
        setSelectedItems(prev => [...prev, item.id]);
      }
    }
    // Long press doesn't do anything if already in multi-select
  };

  // Helper functions for finding most urgent items and calculating days until expiry
  const getMostUrgentItem = (items: Item[]): Item | undefined => {
    if (items.length === 0) return undefined;
    
    // Sort by expiry date ascending
    return [...items]
      .filter(item => item.expiryDate)
      .sort((a, b) => {
        const dateA = a.expiryDate ? new Date(a.expiryDate).getTime() : Infinity;
        const dateB = b.expiryDate ? new Date(b.expiryDate).getTime() : Infinity;
        return dateA - dateB;
      })[0];
  };

  const getDaysUntilExpiry = (item: Item): number | null => {
    if (!item.expiryDate) return null;
    
    const expiryDate = new Date(item.expiryDate);
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    expiryDate.setHours(0, 0, 0, 0);
    
    const differenceInTime = expiryDate.getTime() - currentDate.getTime();
    return Math.floor(differenceInTime / (1000 * 3600 * 24));
  };

  // Restore the original renderGroupedItems function but with correct category icons
  const renderGroupedItems = () => {
    const subcategoryGroups = getItemsBySubcategory(sortedItems);
    const allSubcategories = Object.keys(subcategoryGroups);
    const allCollapsed = allSubcategories.length > 0 && 
      allSubcategories.every(subcat => collapsedSubcategories.includes(subcat));

    return (
      <>
        {Object.entries(subcategoryGroups).map(([subcategory, groupData]) => {
          const isCollapsed = collapsedSubcategories.includes(subcategory);
          const subcategoryItemCount = groupData.items.length;
          const subcategoryUnitCount = groupData.totalQuantity; // Use pre-calculated totalQuantity
          const category = getCategoryForSubcategory(subcategory);
          
          return (
            <div key={subcategory} className="mb-3">
              {/* Updated Subcategory Header - Style applied from ShopList */}
              <div 
                className="flex items-center justify-between px-3 py-2 bg-orange-50 rounded-md mb-2 border border-orange-100 cursor-pointer"
                onClick={() => toggleSubcategory(subcategory)}
              >
                <div className="flex items-center">
                  {category === 'Food' ? 
                    <Utensils className="h-4 w-4 mr-2 text-orange-900" /> : 
                    <Home className="h-4 w-4 mr-2 text-orange-900" />
                  }
                  <span className="text-sm font-medium text-orange-900">{subcategory}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-orange-700">
                    {subcategoryItemCount} {language === 'en' ? 'items' : '項目'}
                  </span>
                  <span className="text-xs text-orange-700">
                    {subcategoryUnitCount} {language === 'en' ? 'units' : '單位'}
                  </span>
                  {/* Chevron Icon for collapse/expand indication */}
                  {isCollapsed ? 
                    <ChevronDown className="h-4 w-4 text-orange-400 opacity-50 transform rotate-180" /> : 
                    <ChevronDown className="h-4 w-4 text-orange-400 opacity-50" />
                  }
                </div>
              </div>
              {!isCollapsed && (
                <div className={cn(
                  viewMode === 'grid' ? 'grid grid-cols-2 gap-2' : 
                  viewMode === 'compact' ? 'grid grid-cols-2 gap-1.5' : 
                  'grid grid-cols-2 gap-2'
                )}>
                  {groupData.items.map(item => (
                    <ItemCard 
                      key={item.id} 
                      item={item} 
                      viewMode={viewMode}
                      onClick={() => handleItemClick(item)}
                      onLongPress={() => handleItemLongPress(item)}
                      isSelected={isMultiSelectMode && selectedItems.includes(item.id)}
                      isMultiSelectMode={isMultiSelectMode}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </>
    );
  };
  
  // 渲染未分組的項目
  const renderUngroupedItems = () => {
    return (
      <div className={cn(
        viewMode === 'compact' ? "grid grid-cols-2 gap-1.5" : 
        "grid grid-cols-2 gap-2"
      )}>
        {sortedItems.map(item => (
          <ItemCard
            key={item.id}
            item={item}
            viewMode={viewMode}
            onClick={handleItemClick}
            onLongPress={handleItemLongPress}
            isSelected={selectedItems.includes(item.id)}
            isMultiSelectMode={isMultiSelectMode}
          />
        ))}
      </div>
    );
  };

  // 檢查按鈕是否應該顯示 - 在 ItemForm、教程、後續操作模態框打開或有選中項目時隱藏
  const isAddButtonVisible = !formOpen && !showTutorial && !postActionModalOpen && !selectedItem && !isBarcodeOpen && !showFilterControls && !isMultiSelectMode && !isScrolling;

  // 獲取類別圖標
  const getCategoryIcon = (category?: string) => {
    if (category === 'Food') {
      return <Utensils className="h-3.5 w-3.5 mr-2 text-orange-500" />;
    } else if (category === 'Household') {
      return <Home className="h-3.5 w-3.5 mr-2 text-orange-500" />;
    }
    return null;
  };

  // 切換過濾控制顯示
  const toggleFilterControls = () => {
    setShowFilterControls(!showFilterControls);
  };

  // 移除在組件加載時讀取用戶偏好的效果，確保每次Dashboard顯示時過濾菜單都是關閉的
  useEffect(() => {
    // 頁面切換後關閉過濾菜單
    setShowFilterControls(false);
  }, []);

  // 添加折疊所有子類別的方法
  const collapseAllSubcategories = () => {
    const subcategoryGroups = getItemsBySubcategory(sortedItems);
    const allSubcategories = Object.keys(subcategoryGroups);
    setCollapsedSubcategories(allSubcategories);
  };

  // 添加展開所有子類別的方法
  const expandAllSubcategories = () => {
    setCollapsedSubcategories([]);
  };

  // 確保選擇後立即更新UI的輔助函數
  const handleFilterChange = (newFilter: 'All' | 'Food' | 'Household') => {
    setFilter(newFilter);
    // 使用RAF來確保樣式更新
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // 在下一個渲染週期強制重繪
        const el = document.activeElement as HTMLElement;
        if (el) el.classList.add('force-repaint');
        setTimeout(() => {
          if (el) el.classList.remove('force-repaint');
        }, 10);
      });
    });
  };

  // 處理緊急過濾器變更，確保立即更新UI
  const handleUrgentFilterChange = (newFilter: 'all' | 'expiring' | 'expired') => {
    setUrgentFilter(newFilter);
    // 使用RAF來確保樣式更新
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // 在下一個渲染週期強制重繪
        const el = document.activeElement as HTMLElement;
        if (el) el.classList.add('force-repaint');
        setTimeout(() => {
          if (el) el.classList.remove('force-repaint');
        }, 10);
      });
    });
  };

  // 渲染活躍的過濾器標籤
  const renderActiveFilterTags = () => {
    if (!(selectedSubcategories.length > 0 || filter !== 'All' || urgentFilter !== 'all' || searchQuery)) {
      return null;
    }
    
    return (
      <div className="flex flex-wrap gap-1.5 mb-2 py-0.5 overflow-x-auto pb-1 scrollbar-none">
        {selectedSubcategories.length > 0 && (
          selectedSubcategories.length < 5 ? (
            // 少於5個子類別時顯示每個子類別
            selectedSubcategories.map(subcategory => (
              <div 
                key={`active-tag-${subcategory}`}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 rounded-full border border-orange-200 dark:border-orange-800 whitespace-nowrap"
              >
                {subcategory}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleSubcategorySelection(subcategory)}
                  className="h-4 w-4 p-0 hover:bg-orange-100 dark:hover:bg-orange-900/50 rounded-full"
                >
                  <X className="h-2.5 w-2.5" />
                </Button>
              </div>
            ))
          ) : (
            // 5個或更多子類別時只顯示數量
            <div 
              className="flex items-center gap-1 px-2 py-1 text-xs bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 rounded-full border border-orange-200 dark:border-orange-800 whitespace-nowrap"
            >
              {language === 'en' 
                ? `${selectedSubcategories.length} subcategories` 
                : `${selectedSubcategories.length} 個子類別`
              }
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSubcategorySelection}
                className="h-4 w-4 p-0 hover:bg-orange-100 dark:hover:bg-orange-900/50 rounded-full"
              >
                <X className="h-2.5 w-2.5" />
              </Button>
            </div>
          )
        )}
        
        {filter !== 'All' && (
          <div 
            className="flex items-center gap-1 px-2 py-1 text-xs bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 rounded-full border border-orange-200 dark:border-orange-800 whitespace-nowrap"
          >
            {getCategoryIcon(filter)}
            {filter === 'Food' ? t('food') : t('household')}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleFilterChange('All')}
              className="h-4 w-4 p-0 hover:bg-orange-100 dark:hover:bg-orange-900/50 rounded-full"
            >
              <X className="h-2.5 w-2.5" />
            </Button>
          </div>
        )}
        
        {urgentFilter !== 'all' && (
          <div 
            className={`flex items-center gap-1 px-2 py-1 text-xs rounded-full border ${
              urgentFilter === 'expiring' 
                ? "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800" 
                : "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800"
            }`}
          >
            {urgentFilter === 'expiring' ? <Clock className="h-3 w-3" /> : <Siren className="h-3 w-3" />}
            {urgentFilter === 'expiring' ? t('expiring') : t('expired')}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleUrgentFilterChange('all')}
              className={`h-4 w-4 p-0 rounded-full ${
                urgentFilter === 'expiring' 
                  ? "hover:bg-amber-100 dark:hover:bg-amber-900/50" 
                  : "hover:bg-red-100 dark:hover:bg-red-900/50"
              }`}
            >
              <X className="h-2.5 w-2.5" />
            </Button>
          </div>
        )}
        
        {searchQuery && (
          <div 
            className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded-full border border-blue-200 dark:border-blue-800 whitespace-nowrap"
          >
            <Search className="h-3 w-3" />
            {searchQuery}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearSearch}
              className="h-4 w-4 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-full"
            >
              <X className="h-2.5 w-2.5" />
            </Button>
          </div>
        )}
      </div>
    );
  };
  
  // 清除所有過濾器
  const clearAllFilters = () => {
    setSelectedSubcategories([]);
    handleFilterChange('All');
    handleUrgentFilterChange('all');
    setSearchQuery('');
  };
  
  // 檢查是否有任何活躍的過濾器
  const hasActiveFilters = selectedSubcategories.length > 0 || filter !== 'All' || urgentFilter !== 'all' || searchQuery;
  
  // 切換選擇項目
  const toggleItemSelection = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(itemId => itemId !== id) 
        : [...prev, id]
    );
  };

  // 清除所有選擇的項目
  const clearSelectedItems = () => {
    setSelectedItems([]);
    setIsMultiSelectMode(false);
  };

  // 切換多選模式
  const toggleMultiSelectMode = () => {
    setIsMultiSelectMode(!isMultiSelectMode);
    if (isMultiSelectMode) {
      setSelectedItems([]);
    }
  };

  // Fix the rendering of category icons for subcategory headers
  const getCategoryForSubcategory = (subcategory: string): 'Food' | 'Household' => {
    // First check if any items with this subcategory exist
    const itemWithSubcategory = sortedItems.find(item => 
      item.subcategory === subcategory || 
      (item.subcategory && item.subcategory.toLowerCase() === subcategory.toLowerCase())
    );
    if (itemWithSubcategory) {
      return itemWithSubcategory.category as ('Food' | 'Household');
    }

    // If no items found, check category configuration
    const foodSubcategories = categoryFilteredItems.filter(item => item.category === 'Food');
    const householdSubcategories = categoryFilteredItems.filter(item => item.category === 'Household');
    
    // Check if subcategory exists in Food category
    const isFood = foodSubcategories.some(item => 
      item.subcategory === subcategory || 
      (item.subcategory && item.subcategory.toLowerCase() === subcategory.toLowerCase())
    );
    
    if (isFood) {
      return 'Food';
    }
    
    // Check if subcategory exists in Household category
    const isHousehold = householdSubcategories.some(item => 
      item.subcategory === subcategory || 
      (item.subcategory && item.subcategory.toLowerCase() === subcategory.toLowerCase())
    );
    
    if (isHousehold) {
      return 'Household';
    }
    
    // Default to Food if can't determine
    return 'Food';
  };

  // Add a helper function to add items to shopping list
  const handleAddToShopList = (item: Item) => {
    addToShopList({
      name: item.name,
      quantity: item.quantity,
      category: item.category,
      subcategory: item.subcategory
    });
  };

  // 處理滾動事件
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolling(true);
      
      // 如果在多選模式且正在滾動，取消多選模式
      if (isMultiSelectMode) {
        setIsMultiSelectMode(false);
        setSelectedItems([]);
      }
      
      // 清除上一個計時器
      if (scrollTimerRef.current) {
        clearTimeout(scrollTimerRef.current);
      }
      
      // 設置新的計時器，在用戶停止滾動1秒後再次顯示按鈕
      scrollTimerRef.current = setTimeout(() => {
        setIsScrolling(false);
      }, 1000);
    };
    
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimerRef.current) {
        clearTimeout(scrollTimerRef.current);
      }
    };
  }, [isMultiSelectMode]);
  
  // 監聽滾動事件
  useEffect(() => {
    const handleScroll = () => {
      // 當滾動超過500px時顯示按鈕
      if (window.scrollY > 500) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // 返回頂部功能
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <div className="w-full max-w-[100%] sm:max-w-md mx-auto px-1 sm:px-2 py-3 sm:py-4 pb-24">
      {/* 搜索欄和過濾按鈕 - 始終固定在適當位置，不會覆蓋頂部欄 */}
      <div className="sticky top-[60px] sm:top-[70px] z-30 bg-background/90 backdrop-blur-md pt-1 pb-2 border-b border-gray-100 dark:border-gray-800 mb-3 shadow-sm">
        {/* 視圖模式和分組切換 */}
        <div className="flex items-center justify-between space-y-2">
          <div className="flex items-center gap-1.5">
            {isMultiSelectMode ? (
              <Button 
                variant="outline"
                size="sm"
                className="h-8 px-2.5 border-red-200 bg-red-50 text-red-600 hover:bg-red-100 rounded-full"
                onClick={clearSelectedItems}
              >
                <X className="h-4 w-4 mr-1" />
                {language === 'en' ? "Cancel" : "取消"}
              </Button>
            ) : (
              <>
                <div className="flex items-center border border-orange-200 rounded-full p-0.5">
                  <Button 
                    variant="ghost"
                    size="sm"
                    className={`h-8 w-8 p-0 rounded-full ${viewMode === 'grid' ? "bg-orange-200 text-orange-700 shadow-sm" : "bg-transparent hover:bg-orange-100/50"}`}
                    onClick={() => setViewMode('grid')}
                  >
                    <LayoutGrid className="h-4 w-4 text-orange-600" />
                  </Button>
                  <Button 
                    variant="ghost"
                    size="sm"
                    className={`h-8 w-8 p-0 rounded-full ${viewMode === 'compact' ? "bg-orange-200 text-orange-700 shadow-sm" : "bg-transparent hover:bg-orange-100/50"}`}
                    onClick={() => setViewMode('compact')}
                  >
                    <Rows3Icon className="h-4 w-4 text-orange-600" />
                  </Button>
                </div>
                
                <div className="flex items-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <div className="flex items-center h-8 pr-2.5 border border-orange-200 rounded-full bg-white cursor-pointer hover:bg-orange-50">
                        <div className="flex items-center justify-center h-8 w-8">
                          <ArrowUpDown className="h-4 w-4 text-orange-600" />
                        </div>
                        <div className="text-xs text-orange-600 font-medium pl-0.5">
                          {sort === 'name' ? (language === 'en' ? "Name" : "名稱") : 
                          sort === 'expiry' ? (language === 'en' ? "Expiry" : "到期日") : 
                          sort === 'quantity' ? (language === 'en' ? "Quantity" : "數量") : ""}
                        </div>
                      </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-48">
                      <DropdownMenuLabel className="text-xs">{language === 'en' ? "Sort by" : "排序方式"}</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className={`text-xs ${sort === 'name' ? "bg-orange-50 text-orange-600" : ""}`}
                        onClick={() => setSort('name')}
                      >
                        <Text className="h-3.5 w-3.5 mr-1.5" />
                        {t('name')}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className={`text-xs ${sort === 'expiry' ? "bg-orange-50 text-orange-600" : ""}`}
                        onClick={() => setSort('expiry')}
                      >
                        <CalendarDays className="h-3.5 w-3.5 mr-1.5" />
                        {t('expiry')}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className={`text-xs ${sort === 'quantity' ? "bg-orange-50 text-orange-600" : ""}`}
                        onClick={() => setSort('quantity')}
                      >
                        <Hash className="h-3.5 w-3.5 mr-1.5" />
                        {t('quantity')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {/* 添加折疊/展開按鈕到頂部欄 */}
            {dashboardGroupBySubcategory && sortedItems.length > 0 && (
              <Button
                variant="outline"
                className={`h-9 w-9 p-0 rounded-full border-orange-200 bg-white hover:bg-orange-100/50 flex items-center justify-center`}
                onClick={Object.keys(getItemsBySubcategory(sortedItems)).length > 0 && Object.keys(getItemsBySubcategory(sortedItems)).every(subcat => collapsedSubcategories.includes(subcat)) ? expandAllSubcategories : collapseAllSubcategories}
              >
                {Object.keys(getItemsBySubcategory(sortedItems)).length > 0 && Object.keys(getItemsBySubcategory(sortedItems)).every(subcat => collapsedSubcategories.includes(subcat)) ? (
                  <ChevronDown className="h-4 w-4 text-orange-600" />
                ) : (
                  <ChevronUp className="h-4 w-4 text-orange-600" />
                )}
              </Button>
            )}

            <Button
              variant="outline"
              className={`h-9 w-9 p-0 rounded-full border-orange-200 ${showFilterControls ? "bg-orange-200 text-orange-700 shadow-sm" : "bg-white hover:bg-orange-100/50"} flex items-center justify-center`}
              onClick={toggleFilterControls}
            >
              <SlidersHorizontal className="h-4 w-4 text-orange-600" />
              {hasActiveFilters && !showFilterControls && (
                <span className="h-2 w-2 bg-orange-500 rounded-full absolute top-0 right-0"></span>
              )}
            </Button>
            
            <Button
              variant="outline"
              className={`h-9 w-9 p-0 rounded-full border-orange-200 ${isMultiSelectMode ? "bg-orange-200 text-orange-700 shadow-sm" : "bg-white hover:bg-orange-100/50"} flex items-center justify-center`}
              onClick={toggleMultiSelectMode}
            >
              <ListChecks className="h-4 w-4 text-orange-600" />
            </Button>
          </div>
        </div>
        
        {/* 搜索欄和統計數字 */}
        <div className="flex items-center gap-2">
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
              <span className="text-xs font-medium text-orange-900">{uniqueItemCount} {language === 'en' ? "items" : "項目"}</span>
            </Badge>
            
            <Badge variant="outline" className="h-8 px-2 border-orange-200 bg-white flex items-center gap-1 rounded-full">
              <span className="text-xs font-medium text-orange-900">{totalItemQuantity} {language === 'en' ? "units" : "單位"}</span>
            </Badge>
          </div>
        </div>
      </div>
      
      {/* 過濾器區域 - 非固定，可滾動 */}
      <div className="space-y-2.5 mb-4">  
        {/* 移除舊的折疊/展開按鈕區域 */}
      
        {/* 過濾器標籤橫行（僅在面板折疊時顯示）*/}
        {!showFilterControls && hasActiveFilters && (
          <div className="relative bg-gray-50/70 dark:bg-gray-900/70 backdrop-blur-sm border border-gray-200 dark:border-gray-800 rounded-xl p-2 animate-in fade-in duration-200 shadow-sm">
            <div className="flex justify-between items-center">
              <div className="flex-1 overflow-hidden mr-2">
                {renderActiveFilterTags()}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground flex-shrink-0"
              >
                {language === 'en' ? "Clear All" : "清除全部"}
              </Button>
            </div>
          </div>
        )}
        
        {/* 改進的過濾器面板 */}
        {showFilterControls && (
          <div className="space-y-3 p-3 bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-800 rounded-xl animate-in fade-in duration-200 shadow-sm overflow-auto max-h-[calc(70vh-5rem)]">
            {/* 排序選項 - 重新添加排序部分 */}
            <div>
              <div className="flex items-center mb-1.5">
                <ArrowUpDown className="h-3.5 w-3.5 mr-2 text-orange-500" />
                <span className="text-xs font-medium">{language === 'en' ? "Sort by" : "排序方式"}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Button 
                  variant="outline"
                  size="sm"
                  className={`h-7 px-2.5 text-xs rounded-full ${sort === 'name' 
                    ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200 dark:border-orange-800 font-medium" 
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200"}`}
                  onClick={() => setSort('name')}
                >
                  <Text className="h-3.5 w-3.5 mr-1.5" />
                  {t('name')}
                </Button>
                <Button 
                  variant="outline"
                  size="sm"
                  className={`h-7 px-2.5 text-xs rounded-full ${sort === 'expiry' 
                    ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200 dark:border-orange-800 font-medium" 
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200"}`}
                  onClick={() => setSort('expiry')}
                >
                  <CalendarDays className="h-3.5 w-3.5 mr-1.5" />
                  {t('expiry')}
                </Button>
                <Button 
                  variant="outline"
                  size="sm"
                  className={`h-7 px-2.5 text-xs rounded-full ${sort === 'quantity' 
                    ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200 dark:border-orange-800 font-medium" 
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200"}`}
                  onClick={() => setSort('quantity')}
                >
                  <Hash className="h-3.5 w-3.5 mr-1.5" />
                  {t('quantity')}
                </Button>
              </div>
            </div>
            
            {/* 視圖和分組選項 - 移除了折疊/展開按鈕，保留分組按鈕 */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center">
                  <Eye className="h-3.5 w-3.5 mr-2 text-orange-500" />
                  <span className="text-xs font-medium">{language === 'en' ? "View options" : "顯示選項"}</span>
                </div>
                
                <div className="flex gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    className={`h-7 px-2.5 text-xs rounded-full border-gray-200 dark:border-gray-700 ${dashboardGroupBySubcategory ? "bg-orange-200 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 shadow-sm" : "bg-white dark:bg-gray-800 hover:bg-orange-100/50"}`}
                    onClick={toggleGrouping}
                  >
                    <LayoutPanelLeft className="h-3.5 w-3.5 mr-1.5" />
                    {dashboardGroupBySubcategory ? (language === 'en' ? "Grouped" : "已分組") : (language === 'en' ? "Ungrouped" : "未分組")}
                  </Button>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-1.5">
                <Button 
                  variant="outline"
                  size="sm"
                  className={`h-7 px-2.5 text-xs rounded-full border-gray-200 dark:border-gray-700 ${viewMode === 'grid' ? "bg-orange-200 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 shadow-sm" : "bg-white dark:bg-gray-800 hover:bg-orange-100/50"}`}
                  onClick={() => setViewMode('grid')}
                >
                  <LayoutGrid className="h-3.5 w-3.5 mr-1.5" />
                  {language === 'en' ? "Grid" : "網格"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "h-7 px-2.5 text-xs rounded-full border-gray-200 dark:border-gray-700",
                    viewMode === 'compact' 
                      ? "bg-orange-200 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 shadow-sm" 
                      : "bg-white dark:bg-gray-800 hover:bg-orange-100/50"
                  )}
                  onClick={() => setViewMode('compact')}
                >
                  <span className="flex items-center">
                    <Rows3Icon className="h-3.5 w-3.5 mr-1.5" />
                    {language === 'en' ? "Compact" : "緊湊"}
                  </span>
                </Button>
              </div>
            </div>
            
            {/* 類別過濾器 */}
            <div>
              <div className="flex items-center mb-1.5">
                <Layers className="h-3.5 w-3.5 mr-2 text-orange-400" />
                <span className="text-xs font-medium">{language === 'en' ? "Category" : "類別"}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Button 
                  variant="outline"
                  size="sm"
                  className={`h-7 px-2.5 text-xs rounded-full border-gray-200 dark:border-gray-700 ${filter === 'All' ? "bg-orange-200 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200 dark:border-orange-800" : "bg-white dark:bg-gray-800 hover:bg-orange-100/50"}`}
                  onClick={() => handleFilterChange('All')}
                >
                  <LayoutGrid className="h-3.5 w-3.5 mr-1.5" />
                  {t('all')}
                </Button>
                <Button 
                  variant="outline"
                  size="sm"
                  className={`h-7 px-2.5 text-xs rounded-full border-gray-200 dark:border-gray-700 ${filter === 'Food' ? "bg-orange-200 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200 dark:border-orange-800" : "bg-white dark:bg-gray-800 hover:bg-orange-100/50"}`}
                  onClick={() => handleFilterChange('Food')}
                >
                  <Utensils className="h-3.5 w-3.5 mr-1.5" />
                  {t('food')}
                </Button>
                <Button 
                  variant="outline"
                  size="sm"
                  className={`h-7 px-2.5 text-xs rounded-full border-gray-200 dark:border-gray-700 ${filter === 'Household' ? "bg-orange-200 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200 dark:border-orange-800" : "bg-white dark:bg-gray-800 hover:bg-orange-100/50"}`}
                  onClick={() => handleFilterChange('Household')}
                >
                  <Home className="h-3.5 w-3.5 mr-1.5" />
                  {t('household')}
                </Button>
              </div>
            </div>
            
            {/* 緊急過濾器 */}
            <div>
              <div className="flex items-center mb-1.5">
                <AlertTriangle className="h-3.5 w-3.5 mr-2 text-orange-400" />
                <span className="text-xs font-medium">{language === 'en' ? "Urgency" : "緊急程度"}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Button 
                  variant="outline"
                  size="sm"
                  className={`h-7 px-2.5 text-xs rounded-full border-gray-200 dark:border-gray-700 ${urgentFilter === 'all' ? "bg-orange-200 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200 dark:border-orange-800" : "bg-white dark:bg-gray-800 hover:bg-orange-100/50"}`}
                  onClick={() => handleUrgentFilterChange('all')}
                >
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                  {t('all')}
                </Button>
                <Button 
                  variant="outline"
                  size="sm"
                  className={`h-7 px-2.5 text-xs rounded-full border-gray-200 dark:border-gray-700 ${urgentFilter === 'expiring' ? "bg-orange-200 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200 dark:border-orange-800" : "bg-white dark:bg-gray-800 hover:bg-orange-100/50"}`}
                  onClick={() => handleUrgentFilterChange('expiring')}
                >
                  <Clock className="h-3.5 w-3.5 mr-1.5" />
                  {t('expiring')}
                </Button>
                <Button 
                  variant="outline"
                  size="sm"
                  className={`h-7 px-2.5 text-xs rounded-full border-gray-200 dark:border-gray-700 ${urgentFilter === 'expired' ? "bg-orange-200 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200 dark:border-orange-800" : "bg-white dark:bg-gray-800 hover:bg-orange-100/50"}`}
                  onClick={() => handleUrgentFilterChange('expired')}
                >
                  <Siren className="h-3.5 w-3.5 mr-1.5" />
                  {t('expired')}
                </Button>
              </div>
            </div>
            
            {/* 改進的子類別過濾器 */}
            {uniqueSubcategories.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center">
                    <Tag className="h-3.5 w-3.5 mr-2 text-orange-400" />
                    <span className="text-xs font-medium">{language === 'en' ? "Subcategories" : "子類別"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedSubcategories.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearSubcategorySelection}
                        className="h-6 px-1.5 text-xs text-muted-foreground hover:text-foreground"
                      >
                        {language === 'en' ? "Clear" : "清除"}
                      </Button>
                    )}
                  </div>
                </div>
                
                {/* 子類別過濾器下拉選單 */}
                {uniqueSubcategories.length <= 5 ? (
                  // 如果子類別數量少，直接顯示按鈕
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1.5">
                      {uniqueSubcategories.map(subcategory => (
                        <Button 
                          key={subcategory}
                          variant="outline"
                          size="sm"
                          className={`h-7 px-2.5 text-xs rounded-full border-gray-200 dark:border-gray-700 ${selectedSubcategories.includes(subcategory) ? "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200 dark:border-orange-800" : "bg-white dark:bg-gray-800"}`}
                          onClick={() => toggleSubcategorySelection(subcategory)}
                        >
                          {subcategory}
                          {selectedSubcategories.includes(subcategory) && (
                            <Check className="h-3 w-3 ml-1.5 text-orange-500" />
                          )}
                        </Button>
                      ))}
                    </div>
                    
                    {/* 顯示選中的子類別摘要 */}
                    {selectedSubcategories.length > 0 && (
                      <div className="mt-1 flex items-center text-xs">
                        <span className="text-muted-foreground mr-2">
                          {language === 'en' ? 'Selected:' : '已選擇:'}
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {selectedSubcategories.map(subcategory => (
                            <div 
                              key={`selected-${subcategory}`}
                              className="flex items-center gap-0.5 pl-2 pr-1 py-0.5 text-[10px] bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 rounded-full border border-orange-200 dark:border-orange-800"
                            >
                              {subcategory}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleSubcategorySelection(subcategory)}
                                className="h-3.5 w-3.5 p-0 hover:bg-orange-100 dark:hover:bg-orange-900/50 rounded-full"
                              >
                                <X className="h-2 w-2" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="outline" 
                          className={`h-8 px-3 justify-between w-full bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-md ${selectedSubcategories.length > 0 ? "text-orange-600 dark:text-orange-300" : "text-muted-foreground"}`}
                        >
                          <span className="text-xs truncate">
                            {selectedSubcategories.length > 0 
                              ? selectedSubcategories.length === 1 
                                ? selectedSubcategories[0] 
                                : language === 'en' 
                                  ? `${selectedSubcategories.length} selected` 
                                  : `已選擇 ${selectedSubcategories.length} 項`
                              : language === 'en' 
                                ? "Select subcategories" 
                                : "選擇子類別"}
                          </span>
                          <ChevronDown className="h-3.5 w-3.5 ml-1 opacity-70" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-56 p-1.5 max-h-56 overflow-auto">
                        <div className="sticky top-0 bg-background p-1.5 mb-1">
                          <div className="relative">
                            <Input 
                              placeholder={language === 'en' ? "Find subcategory..." : "尋找子類別..."} 
                              value={subcategorySearchQuery}
                              onChange={handleSubcategorySearchChange}
                              className="h-8 pl-8 pr-7 text-xs"
                            />
                            <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                            {subcategorySearchQuery && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleClearSubcategorySearch}
                                className="h-5 w-5 p-0 absolute right-1.5 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                        {filteredSubcategories.length === 0 ? (
                          <div className="py-2 text-xs text-center text-muted-foreground">
                            {language === 'en' ? "No subcategories found" : "找不到相符的子類別"}
                          </div>
                        ) : (
                          filteredSubcategories.map(subcategory => (
                            <DropdownMenuItem 
                              key={subcategory}
                              onSelect={(e) => {
                                e.preventDefault();
                                toggleSubcategorySelection(subcategory);
                              }}
                              className={`text-xs rounded-md flex items-center gap-2 ${selectedSubcategories.includes(subcategory) ? "bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-300" : ""}`}
                            >
                              <div className={`flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center ${selectedSubcategories.includes(subcategory) ? "bg-orange-500 border-orange-500 text-white" : "border-gray-300 dark:border-gray-600"}`}>
                                {selectedSubcategories.includes(subcategory) && <Check className="h-3 w-3" />}
                              </div>
                              <span>{subcategory}</span>
                            </DropdownMenuItem>
                          ))
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    
                    {selectedSubcategories.length > 0 && (
                      <div className="flex-shrink-0 flex items-center text-xs text-muted-foreground bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md">
                        {selectedSubcategories.length}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {/* 改進的隱藏過濾器按鈕 - 粘性底部欄設計 */}
            <div className="sticky bottom-0 left-0 right-0 -mx-3 -mb-3 px-3 py-2 bg-gray-50/95 dark:bg-gray-900/95 backdrop-blur-sm border-t border-gray-200 dark:border-gray-800 flex items-center justify-between mt-4">
              <div className="text-xs text-muted-foreground">
                {hasActiveFilters ? 
                  (language === 'en' ? "Filters applied" : "已套用過濾") : 
                  (language === 'en' ? "No filters" : "無過濾")}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleFilterControls}
                className="h-7 rounded-full bg-gray-200/70 dark:bg-gray-800/70 hover:bg-gray-300/70 dark:hover:bg-gray-700/70 px-3 text-xs flex items-center"
              >
                <ChevronUp className="h-3.5 w-3.5 mr-1" />
                {language === 'en' ? "Done" : "完成"}
              </Button>
            </div>
          </div>
        )}
      </div>
      
      {/* 項目列表顯示 */}
      {sortedItems.length === 0 ? (
        searchQuery || selectedSubcategories.length > 0 || filter !== 'All' || urgentFilter !== 'all' ? (
          <div className="rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 flex flex-col items-center justify-center py-8 text-center px-4 mt-4">
            <div className="text-muted-foreground mb-4">
              <Search className="h-8 w-8 mx-auto mb-2" />
              {urgentFilter === 'expired' ? (
                <>
                  <p className="text-lg font-medium text-green-600 dark:text-green-400 mb-1">
                    {language === 'en' ? "Nothing's expired — keep it up!" : "沒有過期物品 — 繼續保持！"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {language === 'en' ? "You're doing a great job managing your items" : "您做得很好，物品管理有序"}
                  </p>
                </>
              ) : urgentFilter === 'expiring' ? (
                <>
                  <p className="text-lg font-medium text-green-600 dark:text-green-400 mb-1">
                    {language === 'en' ? "Nothing's expiring soon" : "沒有即將到期的物品"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {language === 'en' ? "All your items have plenty of time left" : "您的所有物品都有充足的時間"}
                  </p>
                </>
              ) : (
                <p>{language === 'en' ? "No items match your filters" : "沒有符合過濾條件的項目"}</p>
              )}
            </div>
            <div className="flex gap-2">
              {searchQuery && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleClearSearch}
                  className="text-xs"
                >
                  {language === 'en' ? "Clear search" : "清除搜尋"}
                </Button>
              )}
              {(selectedSubcategories.length > 0 || filter !== 'All' || urgentFilter !== 'all') && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setSelectedSubcategories([]);
                    handleFilterChange('All');
                    handleUrgentFilterChange('all');
                  }}
                  className="text-xs"
                >
                  {language === 'en' ? "Clear filters" : "清除過濾"}
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-xl bg-orange-100 border border-orange-300 flex flex-col items-center justify-center py-10 text-center px-4 mt-6">
            <div className="w-28 h-28 bg-gradient-to-br from-orange-500 to-orange-400 rounded-full flex items-center justify-center mb-5 shadow-md">
              <Archive className="h-14 w-14 text-white" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold mb-3 text-orange-700">{t('nothingYet')}</h2>
            <div className="text-sm text-orange-700/80 mb-6 max-w-md whitespace-pre-line">
              {t('emptyDashboardMessage')}
            </div>
            <div className="w-full max-w-xs">
              <Button onClick={handleAddItem} size="lg" className="gap-2 w-full bg-orange-500 hover:bg-orange-600">
                <PlusIcon className="h-5 w-5" />
                {t('addYourFirst')}
              </Button>
            </div>
          </div>
        )
      ) : (
        <div className="space-y-1.5">
          {/* 多選模式提示和操作按鈕 */}
          {isMultiSelectMode && selectedItems.length > 0 && (
            <div className="sticky top-[120px] z-20 bg-primary/10 rounded-lg p-2 mb-2 flex items-center justify-between animate-in fade-in">
              <div className="text-sm font-medium text-primary">
                {selectedItems.length} {language === 'en' ? 'selected' : '已選擇'}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleMarkItemsAsUsed(selectedItems)}
                  className="h-8 text-xs text-green-600 border-green-300 hover:bg-green-50"
                >
                  {language === 'en' ? 'Used' : '已使用'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleMarkItemsAsWasted(selectedItems)}
                  className="h-8 text-xs text-amber-600 border-amber-300 hover:bg-amber-50"
                >
                  {language === 'en' ? 'Wasted' : '已浪費'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // 刪除選定項目
                    selectedItems.forEach(id => deleteItem(id));
                    clearSelectedItems();
                  }}
                  className="h-8 text-xs text-red-600 border-red-300 hover:bg-red-50"
                >
                  {language === 'en' ? 'Delete' : '刪除'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearSelectedItems}
                  className="h-8 w-8 p-0 flex items-center justify-center border-primary/20 text-primary hover:bg-primary/10 rounded-full"
                  title={language === 'en' ? 'Cancel' : '取消'}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
          
          {dashboardGroupBySubcategory ? renderGroupedItems() : renderUngroupedItems()}
        </div>
      )}
      
      {/* 使用修改後的浮動按鈕組件 */}
      {isAddButtonVisible && (
        <div className="fixed bottom-[125px] left-1/2 transform -translate-x-1/2 z-[51] transition-opacity duration-300">
          <Button
            size="icon"
            className="h-16 w-16 rounded-full shadow-xl bg-gradient-to-br from-primary to-primary-light hover:from-primary-dark hover:to-primary active:scale-95 transition-all duration-200 flex items-center justify-center animate-pulse-slow"
            aria-label={t('addItem')}
            onClick={handleAddItem}
          >
            <PlusIcon className="h-8 w-8 text-white" />
          </Button>
        </div>
      )}
      
      {/* 返回頂部按鈕 */}
      {showScrollTop && (
        <div className="fixed bottom-[70px] right-4 z-[51] transition-opacity duration-300">
          <Button
            size="icon"
            className="h-12 w-12 rounded-full shadow-lg bg-white dark:bg-gray-800 border border-orange-200 dark:border-gray-700 hover:bg-orange-50 dark:hover:bg-gray-750 transition-all duration-200 flex items-center justify-center"
            onClick={scrollToTop}
            aria-label={language === 'en' ? "Back to top" : "返回頂部"}
          >
            <ChevronUp className="h-6 w-6 text-orange-500" />
          </Button>
        </div>
      )}
      
      {/* 條形碼掃描器 */}
      <BarcodeScanner 
        isOpen={isBarcodeOpen} 
        onOpenChange={setIsBarcodeOpen} 
        onScanComplete={handleBarcodeScanComplete} 
      />
      
      {/* 項目表單 */}
      <ItemForm
        open={formOpen} 
        onOpenChange={setFormOpen} 
        editItem={editItem}
        reAddItem={reAddItem}
        initialMode={inputMode}
      />
      
      {/* 項目詳情模態框 */}
      <ItemModal 
        onReAdd={handleTriggerReAdd}
      />
      
      {/* 修改：多項目後續操作模態框 - 逐一處理，統一設計 */}
      <Dialog open={postActionModalOpen} onOpenChange={(open) => {
        if (!open) {
          // 如果用戶點擊外部關閉，也重置狀態
          setPostActionItems([]);
          setPostActionItemIndex(0);
          setPostActionType(null);
          setPostActionModalOpen(false);
        }
      }}>
        {postActionItems.length > 0 && postActionItemIndex < postActionItems.length && (
          <DialogContent className="sm:max-w-md dialog-content-no-close-button max-h-[90vh] w-[95vw] rounded-lg shadow-lg border border-orange-200 p-0 overflow-hidden">
            <div className="px-4 pt-4 pb-3 border-b bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/10">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-orange-50 mb-2">
                  <CheckCircle className="h-7 w-7 text-orange-500" />
                </div>
                <DialogTitle className="text-xl font-bold">
                  {language === 'en' 
                    ? `You used up ${postActionItems[postActionItemIndex].name}`
                    : `您已用完 ${postActionItems[postActionItemIndex].name}`
                  }
                </DialogTitle>
              </div>
              
              <DialogDescription className="text-center text-sm text-muted-foreground mt-3">
                {language === 'en' ? "What would you like to do next?" : "接下來您想做什麼？"}
                {postActionItems.length > 1 && 
                  <span className="block text-xs mt-1">({language === 'en' ? `Item ${postActionItemIndex + 1} of ${postActionItems.length}` : `第 ${postActionItemIndex + 1} / ${postActionItems.length} 個項目`})</span>
                }
              </DialogDescription>
            </div>
            
            <div className="px-3 py-4 space-y-3">
              <Button 
                variant="outline"
                className="w-full flex items-center justify-center px-4 py-2 h-10 bg-gradient-to-br from-primary to-primary-light hover:from-primary-dark hover:to-primary text-white active:scale-98 shadow-sm hover:shadow rounded-md"
                onClick={() => handlePostAction('readd')}
              >
                <RotateCw className="h-4 w-4 mr-2" />
                {language === 'en' ? 'Re-add to Dashboard' : '重新添加到儀表板'}
              </Button>
              
              <Button
                variant="outline"
                className="w-full flex items-center justify-center px-4 py-2 h-10 border-orange-300 text-orange-700 bg-orange-50 hover:bg-orange-100"
                onClick={() => handlePostAction('add_to_list')}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                {language === 'en' ? 'Add to Shoplist' : '添加到購物清單'}
              </Button>
              
              <Button
                variant="ghost"
                className="w-full flex items-center justify-center px-4 py-2 h-10 text-muted-foreground hover:text-accent-foreground"
                onClick={() => handlePostAction('close')}
              >
                {language === 'en' ? 'Close' : '關閉'}
              </Button>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
};

export default Dashboard;

