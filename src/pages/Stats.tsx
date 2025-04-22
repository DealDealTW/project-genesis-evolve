import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { useApp } from '@/contexts/AppContext';
import { calculateDaysUntilExpiry, ItemCategory, UsageHistoryEntry } from '@/contexts/AppContext';
import { useTranslation } from '@/utils/translations';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Layers, 
  AlertCircle, 
  CheckCircle, 
  ArrowDownUp,
  Apple,
  ShoppingBag,
  PieChart,
  ChevronDown,
  ChevronUp,
  InfoIcon,
  PercentIcon,
  Package,
  Timer,
  BellRing,
  BarChart3,
  AlertTriangle,
  Calendar,
  CircleUser,
  Hand,
  Home,
  Plus,
  Mic,
  XCircle,
  ArrowUpDown,
  Info,
  Barcode,
  Check,
  X,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowUpRightIcon,
  ArrowDownRightIcon,
  LayoutGrid,
  Utensils,
} from 'lucide-react';
import { format, parseISO, subMonths, startOfMonth, endOfMonth, isWithinInterval, isAfter, differenceInCalendarDays, subWeeks, startOfWeek, endOfWeek } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import FloatingAddButton from '@/components/FloatingAddButton';
import ItemForm from '@/components/ItemForm';
import BarcodeScanner from '@/components/BarcodeScanner';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';

const Stats: React.FC = () => {
  const { items, language, showTutorial, usageHistory } = useApp();
  const t = useTranslation(language);
  const [timeframe, setTimeframe] = useState<string>("thisMonth");
  const [showAllItems, setShowAllItems] = useState<boolean>(false);
  const [wasteCategory, setWasteCategory] = useState<string>('All');
  
  // 統計卡片展開狀態
  const [expandedCards, setExpandedCards] = useState<{[key: number]: boolean}>({});
  
  // 切換卡片展開狀態的函數
  const toggleCardExpand = (index: number) => {
    setExpandedCards(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };
  
  // 添加項目相關狀態
  const [formOpen, setFormOpen] = useState(false);
  const [inputMode, setInputMode] = useState<'manual' | 'voice' | 'barcode'>('manual');
  const [isBarcodeOpen, setIsBarcodeOpen] = useState(false);
  
  // 處理添加項目的函數
  const handleAddItem = () => {
    setInputMode('manual');
    setFormOpen(true);
  };
  
  const handleVoiceAddItem = () => {
    setInputMode('voice');
    setFormOpen(true);
  };
  
  const handleBarcodeAddItem = () => {
    setInputMode('barcode');
    setFormOpen(true);
  };
  
  const handleBarcodeScanComplete = (barcodeResult: string | null) => {
    if (barcodeResult) {
      if (!formOpen) {
        setFormOpen(true);
      }
    }
  };
  
  // 檢查按鈕是否應該顯示
  const isAddButtonVisible = !formOpen && !showTutorial && !isBarcodeOpen;
  
  // --- 計算時間範圍 --- 
  const now = new Date();
  let startDate: Date;
  let endDate: Date = now; // 默認結束日期為現在

  switch (timeframe) {
    case 'lastMonth':
      startDate = startOfMonth(subMonths(now, 1));
      endDate = endOfMonth(subMonths(now, 1));
      break;
    case 'last3Months':
      startDate = startOfMonth(subMonths(now, 3));
      endDate = now;
      break;
    case 'last6Months':
      startDate = startOfMonth(subMonths(now, 6));
      endDate = now;
      break;
    default: // thisMonth
      startDate = startOfMonth(now);
      endDate = now;
      break;
  }
  // 設定時間到午夜以確保包含邊界日期
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);
  const timeInterval = { start: startDate, end: endDate };
  
  // --- 1. 追蹤的獨特項目 (新增時每個項目都算一個，無論是否為相同項目) ---
  const timeframedAddedItems = items.filter(item => {
    try {
      return item.dateAdded && isWithinInterval(parseISO(item.dateAdded), timeInterval);
    } catch { return false; }
  });
  
  // --- 2. 已使用單位 (使用 usageHistory 來獲取更準確的數據) ---
  // 獲取指定時間範圍內的已使用記錄
  const timeframedUsageHistory = usageHistory.filter(entry => {
    try {
      return entry.type === 'used' && 
             isWithinInterval(parseISO(entry.timestamp), timeInterval);
    } catch { return false; }
  });
  
  // --- 3. 浪費單位 (使用 usageHistory 來獲取更準確的數據) ---
  // 獲取指定時間範圍內的已浪費記錄
  const timeframedWasteHistory = usageHistory.filter(entry => {
    try {
      return entry.type === 'wasted' &&
             isWithinInterval(parseISO(entry.timestamp), timeInterval);
    } catch { return false; }
  });
  
  // --- 4. 計算效率 = (已使用單位 / (已使用 + 已浪費)) * 100 ---
  // 使用 usage history 獲取總單位數
  const getTotalUnitsFromHistory = (entries: UsageHistoryEntry[]) => {
    return entries.reduce((total, entry) => total + entry.quantity, 0);
  };

  // 舊的 getTotalUnits 函數保留用於處理 Item 對象
  const getTotalUnits = (items: any[]) => {
    return items.reduce((total, item) => {
      const quantity = parseInt(item.quantity) || 1;
      return total + quantity;
    }, 0);
  };
  
  // 計算使用和浪費的單位數量 - 使用 usageHistory
  const usedUnits = getTotalUnitsFromHistory(timeframedUsageHistory);
  const wastedUnits = getTotalUnitsFromHistory(timeframedWasteHistory);
  const totalTrackedUnits = usedUnits + wastedUnits;
  
  // 單獨計算每個類別的使用單位 - 需要根據 itemId 獲取分類信息
  const getItemCategoryByIdMap = () => {
    const categoryMap: Record<string, ItemCategory> = {};
    items.forEach(item => {
      categoryMap[item.id] = item.category;
    });
    return categoryMap;
  };
  
  const itemCategoryMap = getItemCategoryByIdMap();
  
  // 按類別過濾 usage history - 使用記錄中的 category 字段
  const getFoodUsageHistory = () => {
    return timeframedUsageHistory.filter(entry => 
      entry.category === 'Food' || 
      (!entry.category && itemCategoryMap[entry.itemId] === 'Food') // 向下兼容舊記錄
    );
  };
  
  const getHouseholdUsageHistory = () => {
    return timeframedUsageHistory.filter(entry => 
      entry.category === 'Household' || 
      (!entry.category && itemCategoryMap[entry.itemId] === 'Household') // 向下兼容舊記錄
    );
  };
  
  const getOtherUsageHistory = () => {
    return timeframedUsageHistory.filter(entry => 
      (entry.category !== 'Food' && entry.category !== 'Household') || 
      (!entry.category && itemCategoryMap[entry.itemId] !== 'Food' && itemCategoryMap[entry.itemId] !== 'Household') // 向下兼容舊記錄
    );
  };
  
  // 使用篩選後的 history 計算各類別的使用單位
  const foodUsedUnits = getTotalUnitsFromHistory(getFoodUsageHistory());
  const householdUsedUnits = getTotalUnitsFromHistory(getHouseholdUsageHistory());
  const otherUsedUnits = getTotalUnitsFromHistory(getOtherUsageHistory());
  
  // 計算效率率
  const efficiencyRate = totalTrackedUnits > 0 ? Math.round((usedUnits / totalTrackedUnits) * 100) : 0;
  
  // 渲染類別效率百分比（使用與Dashboard的過期狀態相同的顏色方案）
  const renderEfficiencyPercentage = (usedItems: UsageHistoryEntry[], wastedItems: UsageHistoryEntry[]) => {
    const usedUnits = getTotalUnitsFromHistory(usedItems);
    const wastedUnits = getTotalUnitsFromHistory(wastedItems);
    const totalUnits = usedUnits + wastedUnits;
    
    if (totalUnits === 0) return null; // 如果沒有數據，不顯示百分比
    
    const efficiencyRate = Math.round((usedUnits / totalUnits) * 100);
    
    // 使用與Dashboard頁面相同的顏色方案
    let bgColorClass = "";
    const textColorClass = "text-white";
    
    if (efficiencyRate >= 81) {
      bgColorClass = "bg-green-500";
    } else if (efficiencyRate >= 51) {
      bgColorClass = "bg-yellow-500";
    } else {
      bgColorClass = "bg-red-500";
    }
    
    return (
      <Badge className={`${bgColorClass} ${textColorClass} text-xs font-medium`}>
        {efficiencyRate}%
      </Badge>
    );
  };
  
  // 調試日誌 - 在控制台輸出以查看差異
  console.log('===== 單位數量調試 =====');
  console.log('總使用單位數 (usedUnits):', usedUnits);
  console.log('食品使用單位數:', foodUsedUnits);
  console.log('家居用品使用單位數:', householdUsedUnits);
  console.log('其他類別使用單位數:', otherUsedUnits);
  console.log('食品+家居用品總和:', foodUsedUnits + householdUsedUnits);
  console.log('差異值:', usedUnits - (foodUsedUnits + householdUsedUnits));
  console.log('');
  
  // 查看詳細的時間範圍篩選項目
  console.log('時間範圍篩選項目詳情:');
  console.log('時間範圍:', timeframe);
  console.log('開始日期:', startDate.toISOString());
  console.log('結束日期:', endDate.toISOString());
  console.log('時間範圍內使用記錄數量:', timeframedUsageHistory.length);
  console.log('時間範圍內浪費記錄數量:', timeframedWasteHistory.length);
  console.log('===== 調試結束 =====');
  
  // 收集浪費數據
  interface WasteData {
    name: string;
    category: ItemCategory;
    quantity: number;
  }
  
  const getWasteStats = () => {
    // 使用 usage history 中的浪費記錄
    const wasteMap: Record<string, WasteData> = {};
    
    // 處理每個浪費記錄
    timeframedWasteHistory.forEach(entry => {
      const itemName = entry.itemName;
      const itemCategory = entry.category || itemCategoryMap[entry.itemId] || 'Food'; // 默認為食物
      
      if (!wasteMap[itemName]) {
        wasteMap[itemName] = {
          name: itemName,
          category: itemCategory,
          quantity: 0
        };
      }
      wasteMap[itemName].quantity += entry.quantity;
    });
    
    return Object.values(wasteMap).sort((a, b) => b.quantity - a.quantity);
  };
  
  const wasteStats = getWasteStats();

  // 各週期篩選函數
  const filterHistoryByTimeInterval = (entries: UsageHistoryEntry[], interval: {start: Date, end: Date}) => {
    return entries.filter(entry => {
      try {
        return isWithinInterval(parseISO(entry.timestamp), interval);
      } catch { return false; }
    });
  };
  
  // 統計卡數據，僅保留效率率和浪費單位
  const statsCards = [
    {
      title: t('efficiencyRate'),
      value: `${efficiencyRate}%`,
      icon: <PercentIcon className="h-4 w-4 text-green-500" />,
      details: [
        { label: t('used'), value: usedUnits },
        { label: t('wasted'), value: wastedUnits }
      ]
    },
    {
      title: t('unitsWasted'),
      value: wastedUnits,
      icon: <XCircle className="h-4 w-4 text-red-500" />,
      details: [
        { label: t('food'), value: getTotalUnitsFromHistory(timeframedWasteHistory.filter(entry => 
          entry.category === 'Food' || 
          (!entry.category && itemCategoryMap[entry.itemId] === 'Food')
        )) },
        { label: t('household'), value: getTotalUnitsFromHistory(timeframedWasteHistory.filter(entry => 
          entry.category === 'Household' || 
          (!entry.category && itemCategoryMap[entry.itemId] === 'Household')
        )) }
      ]
    }
  ];

  // 渲染變化趨勢指標
  const renderTrend = (change: number, positiveIsGood = true) => {
    if (change === 0) {
      return (
        <Badge className="bg-gray-200 text-gray-700 text-xs font-medium flex items-center gap-0.5">
          <Minus className="h-3 w-3" />
          <span>0%</span>
        </Badge>
      );
    }
    
    const isPositive = change > 0;
    // 如果 positiveIsGood 為 true，正面變化應該是綠色；如果為 false，負面變化應該是綠色
    const isGood = positiveIsGood ? isPositive : !isPositive;
    
    return (
      <Badge className={`${isGood ? 'bg-green-500' : 'bg-red-500'} text-white text-xs font-medium flex items-center gap-0.5`}>
        {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
        <span>{isPositive ? '+' : ''}{change}%</span>
      </Badge>
    );
  };

  return (
    <div className="container max-w-md mx-auto p-4 pb-20">
      {/* 1. 時間範圍選擇器 - 全局控制器，影響下方的統計卡片、類別效率和浪費項目列表 */}
      <div className="mb-4">
        <div className="flex items-center gap-1.5 mb-1.5">
          <Timer className="h-4 w-4 text-orange-400" />
          <span className="text-sm font-medium text-orange-600">{t('timeframe')}</span>
        </div>
        <Select value={timeframe} onValueChange={setTimeframe}>
          <SelectTrigger className="w-full text-sm h-10 border-orange-200 focus:ring-orange-200 focus:border-orange-200 focus:ring-opacity-30">
            <SelectValue placeholder={t('thisMonth')} />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="thisMonth">{t('thisMonth')}</SelectItem>
              <SelectItem value="lastMonth">{t('lastMonth')}</SelectItem>
              <SelectItem value="last3Months">{t('last3Months')}</SelectItem>
              <SelectItem value="last6Months">{t('last6Months')}</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      
      {/* 3. 效率概覽卡片 - 整合所有效率數據 */}
      <Card className="mb-4 shadow-sm border border-orange-100 rounded-lg overflow-hidden">
        <CardHeader className="p-4 pb-2 bg-gradient-to-r from-orange-50 to-orange-100/70 rounded-t-lg border-b border-orange-100">
          <div className="flex items-center">
            <CardTitle className="text-base flex items-center text-orange-800">
              <PercentIcon className="h-4 w-4 mr-1.5 text-orange-500" />
              {language === 'en' ? 'Efficiency Overview' : '效率概覽'}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          {/* 主要效率指標 */}
          <div className="flex items-center justify-center mb-5 py-6 px-4 bg-orange-50/50 rounded-lg border border-orange-100">
            <div className="text-center">
              <div className="text-sm text-orange-600 mb-1">{language === 'en' ? 'Overall Efficiency' : '整體效率'}</div>
              <div className={`text-3xl font-bold ${
                efficiencyRate >= 81 ? 'text-green-500' : 
                efficiencyRate >= 51 ? 'text-yellow-500' : 'text-red-500'
              }`}>
                {efficiencyRate}%
              </div>
              <div className="flex justify-center mt-3 gap-8">
                <div className="flex flex-col items-center w-16">
                  <CheckCircle className="h-4 w-4 text-green-500 mb-1" />
                  <div className="text-xs text-green-600">{language === 'en' ? 'Used' : '已使用'}</div>
                  <div className="font-semibold text-green-700">{usedUnits}</div>
                </div>
                <div className="flex flex-col items-center w-16">
                  <XCircle className="h-4 w-4 text-red-500 mb-1" />
                  <div className="text-xs text-red-600">{language === 'en' ? 'Wasted' : '已浪費'}</div>
                  <div className="font-semibold text-red-700">{wastedUnits}</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* 類別標題 */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <Layers className="h-4 w-4 mr-1.5 text-orange-500" />
              <span className="text-sm font-medium text-orange-800">
                {language === 'en' ? 'Category Breakdown' : '類別分析'} <span className="text-xs text-orange-600/80">({language === 'en' ? 'Units' : '單位'})</span>
                    </span>
                  </div>
                  </div>
          
          {/* 類別效率 */}
          <div className="space-y-3">
            {/* 食品類別 */}
            <div className="rounded-lg bg-white dark:bg-gray-800 p-4 shadow-sm border border-orange-100/80 dark:border-orange-900/20 mb-5">
              <h3 className="text-lg font-semibold mb-3.5 text-gray-800 dark:text-gray-200">{language === 'en' ? 'Summary by Category' : '類別摘要'}</h3>
              <div className="space-y-4">
                <div className="rounded-lg overflow-hidden border border-orange-200/60 dark:border-orange-800/40 shadow-sm">
                  <div className="bg-orange-50/80 dark:bg-orange-900/20 p-3 flex items-center justify-between">
                    <div className="flex items-center">
                      <Utensils className="h-4 w-4 mr-1.5 text-orange-500 dark:text-orange-400" />
                      <span className="text-sm font-medium text-orange-800 dark:text-orange-300">{language === 'en' ? 'Food' : '食品'}</span>
                    </div>
                      {renderEfficiencyPercentage(
                        getFoodUsageHistory(),
                        timeframedWasteHistory.filter(entry => 
                          entry.category === 'Food' || 
                          (!entry.category && itemCategoryMap[entry.itemId] === 'Food')
                        )
                      )}
                  </div>
                  <div className="p-3 flex justify-between items-center bg-white dark:bg-gray-800 border-t border-orange-100/60 dark:border-orange-900/20">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center w-16">
                        <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400 mr-1.5" />
                        <span className="text-xs text-gray-600 dark:text-gray-400">{language === 'en' ? 'Used' : '已使用'}</span>
                      </div>
                      <span className="text-sm font-medium text-green-600 dark:text-green-500 min-w-[2rem] text-center">
                        {getTotalUnitsFromHistory(getFoodUsageHistory())}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center w-16">
                        <XCircle className="h-4 w-4 text-red-500 dark:text-red-400 mr-1.5" />
                        <span className="text-xs text-gray-600 dark:text-gray-400">{language === 'en' ? 'Wasted' : '已浪費'}</span>
                      </div>
                      <span className="text-sm font-medium text-red-600 dark:text-red-500 min-w-[2rem] text-center">
                        {getTotalUnitsFromHistory(timeframedWasteHistory.filter(entry => 
                          entry.category === 'Food' || 
                          (!entry.category && itemCategoryMap[entry.itemId] === 'Food')
                        ))}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* 家居類別 */}
                <div className="rounded-lg overflow-hidden border border-orange-200/60 dark:border-orange-800/40 shadow-sm">
                  <div className="bg-orange-50/80 dark:bg-orange-900/20 p-3 flex items-center justify-between">
                    <div className="flex items-center">
                      <Home className="h-4 w-4 mr-1.5 text-orange-500 dark:text-orange-400" />
                      <span className="text-sm font-medium text-orange-800 dark:text-orange-300">{language === 'en' ? 'Household' : '家居'}</span>
                    </div>
                      {renderEfficiencyPercentage(
                        getHouseholdUsageHistory(),
                        timeframedWasteHistory.filter(entry => 
                          entry.category === 'Household' || 
                          (!entry.category && itemCategoryMap[entry.itemId] === 'Household')
                        )
                      )}
                  </div>
                  <div className="p-3 flex justify-between items-center bg-white dark:bg-gray-800 border-t border-orange-100/60 dark:border-orange-900/20">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center w-16">
                        <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400 mr-1.5" />
                        <span className="text-xs text-gray-600 dark:text-gray-400">{language === 'en' ? 'Used' : '已使用'}</span>
                      </div>
                      <span className="text-sm font-medium text-green-600 dark:text-green-500 min-w-[2rem] text-center">
                        {getTotalUnitsFromHistory(getHouseholdUsageHistory())}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center w-16">
                        <XCircle className="h-4 w-4 text-red-500 dark:text-red-400 mr-1.5" />
                        <span className="text-xs text-gray-600 dark:text-gray-400">{language === 'en' ? 'Wasted' : '已浪費'}</span>
                      </div>
                      <span className="text-sm font-medium text-red-600 dark:text-red-500 min-w-[2rem] text-center">
                        {getTotalUnitsFromHistory(timeframedWasteHistory.filter(entry => 
                          entry.category === 'Household' || 
                          (!entry.category && itemCategoryMap[entry.itemId] === 'Household')
                        ))}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* 4. 浪費項目列表 - 受時間範圍影響的詳細項目數據 */}
      <Card className="shadow-sm border border-red-100 rounded-lg">
        <CardHeader className="p-3 sm:p-4 pb-0 sm:pb-0 bg-gradient-to-r from-red-50 to-red-100/70 rounded-t-lg border-b border-red-100">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base sm:text-lg flex items-center text-red-800">
              {t('wastedItems')}{' '}{' '}<span className="text-xs text-red-600/80 ml-1">({language === 'en' ? 'Units' : '單位'})</span>
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                className="h-6 sm:h-8 px-1 sm:px-2 text-xs rounded-lg flex items-center border-red-200 bg-white text-red-600 hover:bg-red-50"
                onClick={() => setShowAllItems(!showAllItems)}
              >
                {showAllItems ? <ChevronUp className="h-3 w-3 mr-0.5" /> : <ChevronDown className="h-3 w-3 mr-0.5" />}
                {showAllItems ? t('showLess') : t('showAll')}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 pt-4 overflow-x-auto">
          {wasteStats.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm">
              {t('noWastedItems')}
            </div>
          ) : (
            <>
              {/* 按類別分組顯示浪費項目 */}
              {['Food', 'Household'].map((category) => {
                const categoryItems = wasteStats.filter(item => item.category === category);
                if (!categoryItems.length) return null;
                
                // 計算該類別的總浪費單位數
                const totalWastedInCategory = categoryItems.reduce((sum, item) => sum + item.quantity, 0);
                
                return (
                  <div key={category} className="mb-4 last:mb-0">
                    {/* 類別標題與總計 */}
                    <div className="flex items-center justify-between mb-2 px-3 py-2 bg-gradient-to-r from-red-50 to-orange-50 rounded-md border border-red-100">
                      <div className="flex items-center">
                        {category === 'Food' ? (
                          <Utensils className="h-4.5 w-4.5 mr-2 text-orange-600" />
                        ) : (
                          <Home className="h-4.5 w-4.5 mr-2 text-orange-600" />
                        )}
                        <span className="font-medium text-sm text-orange-900">
                          {language === 'en' ? category : category === 'Food' ? '食品' : '家居'}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-xs mr-1.5 text-red-700">
                          {language === 'en' ? 'Total:' : '總計:'}
                        </span>
                        <Badge variant="destructive" className="bg-red-600 hover:bg-red-700 text-sm px-2 py-0.5">
                          {totalWastedInCategory}
                      </Badge>
                      </div>
                    </div>
                    
                    <Table className="text-xs sm:text-sm w-full min-w-[300px] mb-4">
                      <TableBody>
                        {categoryItems
                          .slice(0, showAllItems ? categoryItems.length : 5)
                          .map((item, index) => (
                            <TableRow key={index} className="border-b border-red-50 hover:bg-red-50/50">
                              <TableCell className="font-medium text-red-900">
                                {item.name}
                              </TableCell>
                              <TableCell className="text-right">
                                <Badge variant="destructive" className="bg-red-500 hover:bg-red-600">
                                  {item.quantity}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                );
              })}
            </>
          )}
        </CardContent>
      </Card>

      {/* 條形碼掃描器和項目表單 */}
      <BarcodeScanner 
        isOpen={isBarcodeOpen} 
        onOpenChange={setIsBarcodeOpen} 
        onScanComplete={handleBarcodeScanComplete} 
      />
      
      <ItemForm
        open={formOpen} 
        onOpenChange={setFormOpen} 
        editItem={null}
        reAddItem={null}
        initialMode={inputMode}
      />
    </div>
  );
};

export default Stats;
