import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { format, addDays, differenceInDays, parseISO } from 'date-fns';
import { Apple, Home, Plus, Minus, Save, Mic, MicOff, Calendar as CalendarIcon, Trash2, X, Pencil, ArrowRight, Check, BookmarkPlus, PlusCircle, AlarmClock, Tag, Timer, BellRing, AlertTriangle, Scan, Barcode, Hash, ShoppingBag, Users, Package as PackageIcon, Info as InfoIcon, Utensils, Layers, Loader2, Copy } from 'lucide-react';
import { useApp, formatDateWithUserPreference, ItemCategory } from '@/contexts/AppContext';
import { useToast } from "@/components/ui/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Capacitor } from '@capacitor/core';
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { SpeechRecognition } from '@capacitor-community/speech-recognition';
import 'regenerator-runtime/runtime';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { useTranslation, TranslationKey } from '@/utils/translations';
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  getDefaultExpiryDays, 
  determineSubcategory, 
  getSubcategoriesByMainCategory,
  CategoryConfig,
  detectCategoryAndSubcategoryByName,
  categorySubcategories
} from '@/utils/categoryConfig';
import { BarcodeScanner, BarcodeFormat, LensFacing } from '@capacitor-mlkit/barcode-scanning';
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// 批量項目的介面定義
interface VoicedItem {
      id: string;
      name: string;
      quantity: string;
      category: ItemCategory;
      daysUntilExpiry: number;
      subcategory?: string; // 新增子類別欄位
}

interface ItemFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editItem?: any;
  reAddItem?: any;
  initialMode?: 'voice' | 'barcode' | 'manual';
  isShopListMode?: boolean; // 添加標記是購物清單模式的選項
}

// 首字母大寫輔助函數
const capitalizeFirstLetter = (string: string): string => {
  if (!string) return string;
  return string.charAt(0).toUpperCase() + string.slice(1);
};

export default function ItemForm({ open, onOpenChange, editItem, reAddItem, initialMode, isShopListMode = false }: ItemFormProps) {
  const { addItem, updateItem, settings, language, addMultipleItems, addToShopList, categorySubcategories, currentUser } = useApp();
  const { toast } = useToast();
  const navigate = useNavigate();
  const t = useTranslation(language);
  
  // 消息位置設置 - 將提示消息顯示在頂部
  const showToast = (props: any) => {
    toast({
      ...props,
      variant: props.variant || "success", // 默認使用成功變體
    });
  };
  
  // 關閉確認狀態
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  // 清除全部確認狀態
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  
  // 用於語音識別的最大無聲時間
  const MAX_SILENCE_DURATION = 3000; // 3秒無聲後自動重啟
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const manualStopRef = useRef(false); // 跟蹤是否是手動停止
  const voiceTextRef = useRef(''); // 存儲最後識別的文本
  const isAndroid = Capacitor.getPlatform() === 'android';
  const itemNameRef = useRef<HTMLInputElement>(null); // 添加對輸入框的引用
  
  // 本地狀態
  const [itemName, setItemName] = useState(editItem ? editItem.name : (reAddItem ? reAddItem.name : ""));
  const [quantity, setQuantity] = useState<number>(editItem ? (parseInt(editItem.quantity) || 1) : (reAddItem ? 1 : 1));
  const [category, setCategory] = useState<ItemCategory>(editItem ? editItem.category : (reAddItem ? reAddItem.category : "Food"));
  const [subcategory, setSubcategory] = useState(editItem ? editItem.subcategory : (reAddItem ? reAddItem.subcategory : ''));
  const [daysUntilExpiry, setDaysUntilExpiry] = useState(editItem ? editItem.daysUntilExpiry : (reAddItem ? reAddItem.daysUntilExpiry : 7));
  const [expiryDate, setExpiryDate] = useState<Date>(editItem ? parseISO(editItem.expiryDate) : (reAddItem ? parseISO(reAddItem.expiryDate) : addDays(new Date(), 7)));
  const [notifyDaysBefore, setNotifyDaysBefore] = useState<number>(() => {
    if (editItem) {
      return editItem.notifyDaysBefore || settings.defaultNotifyDaysBefore;
    } else if (reAddItem) {
      return reAddItem.notifyDaysBefore || settings.defaultNotifyDaysBefore;
    } else {
      // 為新項目使用全局設置中的默認值
      return settings.defaultNotifyDaysBefore;
    }
  });
  const [image, setImage] = useState<string | null>(editItem ? editItem.image : null);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isBarcodeMode, setIsBarcodeMode] = useState(false);
  const [isManualMode, setIsManualMode] = useState(true);
  const [listening, setListening] = useState(false);
  const [showFamilySizeHint, setShowFamilySizeHint] = useState<boolean>(settings.autoAdjustFamilySize ?? false);
  const [finalCalculatedQuantity, setFinalCalculatedQuantity] = useState<string>(quantity.toString());
  
  // 添加展開狀態控制
  const [activeAccordion, setActiveAccordion] = useState<string>("item-details");
  
  // 注意：即使initialMode參數指定了其他模式，我們也保持在手動模式
  
  // 聲明 voicedItemsList 狀態
  const [voicedItemsList, setVoicedItemsList] = useState<VoicedItem[]>([]);

  // 獲取所選類別的子類別列表
  const subcategories = getSubcategoriesByMainCategory(category, language as any);
  
  const itemNameDebounceTimer = useRef<NodeJS.Timeout | null>(null);
  
  // 在組件掛載時設置默認模式及初始化值
  useEffect(() => {
    console.log("ItemForm useEffect - 初始化表單狀態");
    console.log("editItem:", editItem);
    console.log("reAddItem:", reAddItem);
    
    // 確保始終使用手動模式
    setIsManualMode(true);
    setIsVoiceMode(false);
    setIsBarcodeMode(false);
    
    // 初始化編輯或重新添加項目的值
    if (editItem) {
      // 編輯模式下預填充
      setItemName(editItem.name || "");
      setQuantity(parseInt(editItem.quantity) || 1);
      setCategory(editItem.category || "Food");
      if (editItem.subcategory) {
        setSubcategory(editItem.subcategory);
      }
      setDaysUntilExpiry(editItem.daysUntilExpiry || 7);
      setExpiryDate(parseISO(editItem.expiryDate));
      setNotifyDaysBefore(editItem.notifyDaysBefore || settings.defaultNotifyDaysBefore);
      setImage(editItem.image || null);
      console.log("初始化編輯項目:", editItem.name, "類別:", editItem.category, "子類別:", editItem.subcategory);
    } else if (reAddItem) {
      // 重新添加模式下預填充
      setItemName(reAddItem.name || "");
      setQuantity(1); // 重新添加時數量重置為1
      setCategory(reAddItem.category || "Food");
      if (reAddItem.subcategory) {
        setSubcategory(reAddItem.subcategory);
      }
      setDaysUntilExpiry(reAddItem.daysUntilExpiry || 7);
      setExpiryDate(addDays(new Date(), reAddItem.daysUntilExpiry || 7));
      setNotifyDaysBefore(reAddItem.notifyDaysBefore || settings.defaultNotifyDaysBefore);
      console.log("初始化重新添加項目:", reAddItem.name, "類別:", reAddItem.category, "子類別:", reAddItem.subcategory);
    } else {
      // 新增項目時設置默認通知天數
      setNotifyDaysBefore(settings.defaultNotifyDaysBefore);
    }
    
    // 確保自動調整開關與全局設置一致
    setShowFamilySizeHint(settings.autoAdjustFamilySize ?? false);
    
  }, [editItem, reAddItem, settings.autoAdjustFamilySize, settings.defaultNotifyDaysBefore]);
  
  // 當子類別手動變更時，更新預設過期時間
  useEffect(() => {
    if (subcategory && (category === 'Food' || category === 'Household')) {
      const currentSubcategories = getSubcategoriesByMainCategory(category, language as any);
      const subcategoryConfig = currentSubcategories.find(s => s.name === subcategory);
      if (subcategoryConfig) {
        setDaysUntilExpiry(subcategoryConfig.defaultExpiryDays);
        setExpiryDate(addDays(new Date(), subcategoryConfig.defaultExpiryDays));
      }
    }
  }, [subcategory, category, language]);
  
  // 當項目名稱變更時，自動檢測類別和子類別 (帶 debounce)
  useEffect(() => {
    if (itemNameDebounceTimer.current) {
      clearTimeout(itemNameDebounceTimer.current);
    }
    if (itemName && itemName.trim().length >= 2) {
      itemNameDebounceTimer.current = setTimeout(async () => {
        const detected = detectCategoryAndSubcategoryByName(itemName.trim());
        if (detected) {
          setCategory(detected.category);
          const subcategoryName = detected.subcategory.name[language as 'en' | 'zh-TW' | 'zh-CN'];
          setSubcategory(subcategoryName);
          setDaysUntilExpiry(detected.subcategory.defaultExpiryDays);
          setExpiryDate(addDays(new Date(), detected.subcategory.defaultExpiryDays));
          showToast({
            title: t('categoryDetected'),
            description: `${t('detectedAs')}: ${t(detected.category.toLowerCase() as TranslationKey)} / ${subcategoryName}`,
            variant: "info",
            duration: 2000
          });
        } else {
          console.log(`No category detected for "${itemName}"`);
        }
      }, 500);
    }
    return () => {
      if (itemNameDebounceTimer.current) {
        clearTimeout(itemNameDebounceTimer.current);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemName, language]);
  
  // 對話框關閉處理
  const handleOpenChange = (openState: boolean) => {
    console.log(`[handleOpenChange] Triggered with openState: ${openState}`);
    // 如果嘗試關閉對話框且有未保存的批量項目，則顯示確認對話框
    if (!openState && voicedItemsList.length > 0) {
      console.log('[handleOpenChange] Has unsaved items. Showing close confirmation.');
      setShowCloseConfirm(true);
      // 不立即關閉主對話框
    } else {
      // 如果是關閉且沒有批量項目，或者是開啟對話框
      if (!openState) {
        resetForm();
      }
      // 執行實際的對話框狀態更改
      onOpenChange(openState);
    }
  };
  
  // 確認關閉並丟棄項目
  const confirmCloseAndDiscard = async () => {
    console.log('[confirmCloseAndDiscard] User confirmed close. Stopping mic, resetting, closing dialog.');
    
    try {
      // 阻止重複點擊 - 立即將狀態設置為false
      setShowCloseConfirm(false);
      setShowClearConfirm(false);
      
      // 重置批量項目列表
      setVoicedItemsList([]);
      
      // 停止所有可能的異步操作
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      
      // 嘗試停止麥克風 - 不等待結果，避免阻塞UI
      stopSpeechRecognition().catch(e => console.error('Error stopping microphone:', e));
      
      // 重置表單狀態
      resetForm();
      
      // 直接關閉主對話框
      onOpenChange(false);
    } catch (error) {
      console.error('Error during confirmation handling:', error);
      // 確保對話框一定會關閉，即使出錯
      onOpenChange(false);
    }
  };
  
  // 取消關閉確認
  const cancelConfirmation = () => {
    console.log('[cancelConfirmation] User cancelled operation. Hiding confirmation dialogs.');
    setShowCloseConfirm(false); // 關閉關閉確認對話框
    setShowClearConfirm(false); // 關閉清除確認對話框
  };
  
  // 處理清除所有按鈕點擊
  const handleClearAll = () => {
    console.log('[handleClearAll] Clear All button clicked.');
    if (voicedItemsList.length > 0) {
      console.log('[handleClearAll] Has items. Showing clear confirmation.');
      setShowClearConfirm(true); // 顯示清除確認框
    } else {
      console.log('[handleClearAll] No items to clear.');
    }
  };
  
  // 確認清除所有項目 (現在使用相同的確認邏輯)
  const confirmClearAll = confirmCloseAndDiscard;

  // 停止語音識別的輔助函數
  const stopSpeechRecognition = async () => {
    try {
      console.log('[Speech] Attempting to stop speech recognition plugin...');
      await SpeechRecognition.stop();
      console.log('[Speech] Plugin stop command executed.');
      // 狀態更新由 listeningState listener 處理或 ensureStopListening 處理
    } catch (error) {
      console.error('[Speech] Error stopping speech recognition:', error);
    }
  };
  
  // 啟動語音識別的輔助函數
  const startSpeechRecognition = async () => {
    if (!isAndroid) return false;
    try {
      console.log('[Speech] Attempting to start speech recognition plugin...');
      await SpeechRecognition.start({
        language: language === 'en' ? 'en-US' : 'zh-CN',
        maxResults: 1,
        popup: false,
        partialResults: true,
        prompt: language === 'en' ? "Say the item name" : "請說出物品名稱"
      });
      console.log('[Speech] Plugin start command executed successfully.');
      // 狀態更新由 listeningState listener 處理
      manualStopRef.current = false;
      
      // 完全移除靜音檢測邏輯
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
      
      return true;
      } catch (error) {
      console.error('[Speech] Error starting speech recognition:', error);
      await ensureStopListening(); // 啟動失敗也確保停止
      return false;
    }
  };

  // 處理語音輸入模式
  const handleVoiceMode = async () => {
    console.log(`[handleVoiceMode] Clicked. Current listening state: ${listening}`);
    
    // 如果已經在聆聽，則停止
    if (listening) {
      console.log('[handleVoiceMode] Currently listening, stopping manually.');
      await ensureStopListening();
      return;
    }
    
    // 如果不在批量模式，設置適當的模式
    if (voicedItemsList.length === 0) {
      setIsBarcodeMode(false);
      setIsManualMode(false);
      setIsVoiceMode(true);
      // 確保在開始新的批量錄製時清空語音文本
      voiceTextRef.current = '';
    }
    
    // 檢查是否為Android平台
    if (isAndroid) {
      try {
        const { speechRecognition } = await SpeechRecognition.checkPermissions();
        if (speechRecognition !== 'granted') {
          console.log('[handleVoiceMode] Microphone permission not granted. Requesting...');
          showToast({ title: 'Permission Needed', description: 'Please allow microphone access.' });
          const { speechRecognition: newStatus } = await SpeechRecognition.requestPermissions();
          if (newStatus !== 'granted') {
            console.log('[handleVoiceMode] Permission denied.');
            showToast({ title: 'Permission Denied', description: 'Cannot use voice input without permission.', variant: "destructive" });
            await ensureStopListening(); 
            return;
          }
          console.log('[handleVoiceMode] Permission granted.');
        }
        
        console.log('[handleVoiceMode] Setting up speech listeners...');
        await SpeechRecognition.removeAllListeners();
        
        SpeechRecognition.addListener('listeningState', (data: { status: 'started' | 'stopped' }) => {
          console.log(`[Speech Listener] listeningState changed: ${data.status}`);
          if (data.status === 'started') {
            setListening(true);
          } else if (data.status === 'stopped') {
            setListening(false);
            setTimeout(() => {
              if (!manualStopRef.current && voiceTextRef.current) {
                const finalText = voiceTextRef.current.trim();
                console.log(`[Speech Listener] Processing final text after stopped event: ${finalText}`);
                processFinalVoiceText(finalText);
              }
            }, 100); 
          }
        });

        SpeechRecognition.addListener('partialResults', (data: { matches: string[] }) => {
          if (data && data.matches && data.matches.length > 0) {
            const text = data.matches[0];
            console.log(`[Speech Listener] partialResults: ${text}`);
            voiceTextRef.current = text;
            
            // 在批量模式下不更新輸入框
            if (voicedItemsList.length === 0) {
              processVoiceText(text);
            }
          }
        });

        // 針對當前模式顯示不同的提示
        if (voicedItemsList.length > 0) {
          showToast({ 
            title: 'Adding to Batch', 
            description: 'Speak item name clearly' 
          });
        } else {
          showToast({ 
            title: 'Voice Input', 
            description: 'Speak clearly!' 
          });
        }
        
        console.log('[handleVoiceMode] Starting speech recognition...');
        await startSpeechRecognition();
        
      } catch (error) {
        console.error('[handleVoiceMode] Error during voice mode setup or start:', error);
        showToast({ title: 'Error', description: 'Could not start speech recognition.', variant: "destructive" });
        await ensureStopListening();
      }
    } else {
      showToast({ title: 'Not Supported', description: 'Speech recognition only works on Android.', variant: "destructive" });
      await ensureStopListening(); 
    }
  };

  // 處理語音文本的輔助函數 - 即時處理
  const processVoiceText = (inputText: string) => {
    // 將文字首字母大寫
    const capitalizedText = capitalizeFirstLetter(inputText.trim());
    
    // 如果是單詞模式下，直接更新項目名稱
    if (voicedItemsList.length === 0) {
      setItemName(capitalizedText);
    }
    
    // 我們不在這裡分割或判斷批量模式，只在最終結果中執行
  };
  
  // 處理最終語音文本 - 決定是否切換到批量模式
  const processFinalVoiceText = (finalText: string) => {
    if (!finalText) return;
    
    voiceTextRef.current = '';
    const capitalizedText = capitalizeFirstLetter(finalText.trim());
    const isChinese = /[\u4e00-\u9fa5]/.test(capitalizedText);
    console.log(`[processFinalVoiceText] Text received: "${capitalizedText}", Is Chinese: ${isChinese}`);
    
    let itemsList: string[] = [];

    // 嘗試使用不同的分隔方式來分割文本
    const tryToSplit = () => {
      // 1. 標點符號分割
      if (capitalizedText.match(/[,，;；、]/)) {
        console.log('[processFinalVoiceText] Splitting by punctuation marks');
        return capitalizedText.split(/[,，;；、]/).map(item => item.trim()).filter(item => item.length > 0);
      }
      
      // 2. 中文連接詞分割
      if (isChinese) {
        console.log('[processFinalVoiceText] Checking for Chinese connectors');
        const connectors = /和|與|以及|還有|跟|加上/g;
        if (connectors.test(capitalizedText)) {
          let result = capitalizedText.replace(connectors, '|||').split('|||').map(item => item.trim()).filter(item => item.length > 0);
          console.log('[processFinalVoiceText] Split by Chinese connectors:', result);
          if (result.length >= 2) return result;
        }
      }
      
      // 3. 英文連接詞分割
      if (!isChinese && (capitalizedText.includes(' and ') || capitalizedText.includes(' & '))) {
        console.log('[processFinalVoiceText] Splitting by English connectors');
        return capitalizedText.split(/\s+and\s+|\s+&\s+/).map(item => item.trim()).filter(item => item.length > 0);
      }
      
      // 4. 英文空格分割 (僅當詞數多於一個時)
      if (!isChinese && capitalizedText.includes(' ') && capitalizedText.split(/\s+/).length > 1) {
          console.log('[processFinalVoiceText] Splitting English text by spaces');
          const words = capitalizedText.split(/\s+/).filter(word => word.length >= 2);
          // 只有當分割出的單詞數量多於一個時才返回，否則視為單個項目
          if (words.length > 1) {
              return words;
          }
      }
      
      // 5. 針對中文文本，使用改進的詞彙分割方法
      if (isChinese) {
        console.log('[processFinalVoiceText] Using enhanced Chinese word splitting');
        return splitChineseText(capitalizedText);
      }
      
      // 如果所有方法都失敗，返回原文本作為單個項目
      console.log('[processFinalVoiceText] No split applied, returning original text as single item.');
      return [capitalizedText];
    };

    // 用於中文文本的增強分割功能
    const splitChineseText = (text: string): string[] => {
      console.log(`[splitChineseText] Starting split for: "${text}"`);
      // 常見中文食物和家居名詞 (更全面)
      const commonTerms = [
        // 食物 (更長詞優先)
        '雞胸肉', '鸡胸肉', '豬五花', '猪五花', '牛小排', '羊小排', '三文魚', '三文鱼', '金槍魚', '金枪鱼', 
        '花椰菜', '西蘭花', '西兰花', '高麗菜', '包菜', '羽衣甘藍', '羽衣甘蓝', '甜椒', '青椒', '紅椒', '黄椒', 
        '馬鈴薯', '土豆', '地瓜', '番薯', '芋頭', '芋头', '山藥', '山药', 
        '蘋果', '苹果', '香蕉', '葡萄', '西瓜', '草莓', '藍莓', '蓝莓', '芒果', '鳳梨', '凤梨', '奇異果', '猕猴桃', 
        '牛肉', '豬肉', '猪肉', '雞肉', '鸡肉', '魚肉', '鱼肉', '羊肉', '鴨肉', '鸭肉', '海鮮', '海鲜', 
        '雞蛋', '鸡蛋', '鴨蛋', '鸭蛋', '鵝蛋', '鹅蛋', '皮蛋', '鹹蛋', '咸蛋', '茶葉蛋', 
        '牛奶', '酸奶', '優格', '起司', '奶酪', '奶油', '黃油', '黄油', '豆漿', '豆浆', 
        '白米', '糙米', '黑米', '紫米', '米飯', '米饭', '麵包', '面包', '饅頭', '馒头', '麵條', '面条', '吐司', 
        '蔬菜', '水果', '肉類', '肉类', '零食', '飲料', '饮料', 
        // 家居用品
        '洗髮精', '洗发水', '沐浴露', '護髮素', '护发素', '牙膏', '牙刷', '肥皂', '香皂', '洗手液', 
        '洗衣精', '洗衣液', '洗衣粉', '柔順劑', '柔顺剂', '漂白水', 
        '衛生紙', '卫生纸', '面紙', '面巾纸', '廚房紙巾', '厨房纸巾', '濕紙巾', '湿纸巾', 
        '清潔劑', '清洁剂', '洗碗精', '洗洁精', '玻璃水', '消毒液', '酒精', 
        '電池', '电池', '燈泡', '灯泡', '垃圾袋', 
        // 基礎詞
        '肉', '菜', '蛋', '奶', '米', '麵', '面', '魚', '鱼', '果', '油', '鹽', '盐', '糖', '醋', '醬', '酱', '茶', '紙', '纸', '巾'
      ];
      commonTerms.sort((a, b) => b.length - a.length); // 按長度降序排序

      let items: string[] = [];
      let remainingText = text;
      const minItemLength = 2; // 中文項目通常至少兩個字

      console.log('[splitChineseText] Sorted terms:', commonTerms.slice(0, 10)); // Log first 10 terms

      while (remainingText.length >= minItemLength) {
        let bestMatch = '';
        let matchFound = false;

        // 查找最長的前綴匹配
        for (const term of commonTerms) {
          if (remainingText.startsWith(term)) {
            bestMatch = term;
            matchFound = true;
            break;
          }
        }

        if (matchFound) {
          console.log(`[splitChineseText] Found term: ${bestMatch}, Remaining: ${remainingText.substring(bestMatch.length)}`);
          items.push(bestMatch);
          remainingText = remainingText.substring(bestMatch.length).trim();
        } else {
          // 如果沒有找到詞典匹配，嘗試按固定長度分割（如2或3個字符）
          // 這裡我們更保守，如果沒有匹配，將剩餘部分視為一個整體
          console.log(`[splitChineseText] No term match found for start of: "${remainingText}". Treating rest as one item.`);
          if (remainingText.length > 0) {
               items.push(remainingText); // 將剩餘部分作為一個項目
          }
          remainingText = ''; // 結束循環
          break; // 結束主循環
        }
      }

      // 如果最後還有剩餘的單個字符（可能不常見），可以選擇性處理
      // if (remainingText.length > 0) {
      //   console.log(`[splitChineseText] Adding leftover single character: ${remainingText}`);
      //   items.push(remainingText);
      // }

      // 過濾掉空字符串並確保至少返回一個項目
      const result = items.filter(item => item.length > 0);
      console.log(`[splitChineseText] Final split result: ${result.join(' | ')}`);
      return result.length > 0 ? result : [text]; // 如果分割失敗，返回原始文本
    };

    itemsList = tryToSplit();
    console.log('[processFinalVoiceText] Final itemsList after split attempt:', itemsList);

    // --- 後續處理邏輯不變，根據 itemsList 決定是單個項目還是批量 --- 
    // (如果 itemsList.length === 1, 走單項目邏輯) 
    // (如果 itemsList.length > 1, 走批量模式邏輯)
    
    // 如果在單個項目模式下且列表只有一個項目，僅更新項目名稱
    if (voicedItemsList.length === 0 && itemsList.length === 1 && itemsList[0].trim() !== '') {
      const singleItemName = itemsList[0];
      console.log(`[processFinalVoiceText] Handling as single item: ${singleItemName}`);
      setItemName(singleItemName);
      
      // 自動檢測類別和子類別
      const detectedResult = detectCategoryAndSubcategoryByName(singleItemName);
      let itemCategory: ItemCategory = 'Food'; // 默認為食品
      let subcategoryName: string | undefined = undefined;
      let defaultDays = 7;
      
      if (detectedResult) {
        itemCategory = detectedResult.category;
        subcategoryName = detectedResult.subcategory.name[language as 'en' | 'zh-TW' | 'zh-CN'];
        defaultDays = detectedResult.subcategory.defaultExpiryDays;
        console.log(`[processFinalVoiceText] Detected for single item: ${itemCategory} / ${subcategoryName} / ${defaultDays} days`);
      } else {
        // 如果沒有檢測到，嘗試簡單推斷
        itemCategory = singleItemName.toLowerCase().includes('清潔') || singleItemName.toLowerCase().includes('洗') ? 'Household' : 'Food';
        const fallbackSubcategory = determineSubcategory(singleItemName, itemCategory);
        subcategoryName = fallbackSubcategory.name[language as 'en' | 'zh-TW' | 'zh-CN'];
        defaultDays = fallbackSubcategory.defaultExpiryDays;
        console.log(`[processFinalVoiceText] Fallback for single item: ${itemCategory} / ${subcategoryName} / ${defaultDays} days`);
      }
      
      setCategory(itemCategory);
      setSubcategory(subcategoryName || '');
      setDaysUntilExpiry(defaultDays);
      setExpiryDate(addDays(new Date(), defaultDays));
      
      showToast({
        title: language === 'en' ? 'Voice Input' : '語音輸入',
        description: capitalizeFirstLetter(singleItemName)
      });
    }
    // 如果是多個項目 (無論是否已在批量模式)，切換到/添加到批量模式
    else if (itemsList.length > 1) {
        console.log(`[processFinalVoiceText] Handling as batch items (${itemsList.length} items):`, itemsList);
        const newItems: VoicedItem[] = [];
        
        for (const item of itemsList) {
          const itemName = capitalizeFirstLetter(item);
          const detectedResult = detectCategoryAndSubcategoryByName(itemName);
          let itemCategory: ItemCategory = 'Food';
          let subcategoryName: string | undefined = undefined;
          let defaultDays = 7;
          
          if (detectedResult) {
            itemCategory = detectedResult.category;
            subcategoryName = detectedResult.subcategory.name[language as 'en' | 'zh-TW' | 'zh-CN'];
            defaultDays = detectedResult.subcategory.defaultExpiryDays;
          } else {
             itemCategory = itemName.toLowerCase().includes('清潔') || itemName.toLowerCase().includes('洗') ? 'Household' : 'Food';
             const fallbackSubcategory = determineSubcategory(itemName, itemCategory);
             subcategoryName = fallbackSubcategory.name[language as 'en' | 'zh-TW' | 'zh-CN'];
             defaultDays = fallbackSubcategory.defaultExpiryDays;
          }
          
          newItems.push({
            id: uuidv4(),
            name: itemName,
            quantity: '1',
            category: itemCategory,
            subcategory: subcategoryName,
            daysUntilExpiry: defaultDays
          });
        }
        
        // 添加到現有列表或創建新列表
        setVoicedItemsList(prevList => [...prevList, ...newItems]);
        
        showToast({
          title: language === 'en' ? (voicedItemsList.length > 0 ? 'Added to Batch' : 'Batch Mode') : (voicedItemsList.length > 0 ? '已加入批次' : '批量模式'),
          description: language === 'en' 
            ? `${itemsList.length} items added` 
            : `已添加 ${itemsList.length} 個項目`
        });
    }
     else if (itemsList.length === 1 && itemsList[0].trim() === '' && voicedItemsList.length === 0) {
       console.log('[processFinalVoiceText] Received empty text, no action taken.');
       // 可以選擇性地顯示提示，告知用戶沒有識別到內容
       showToast({
           title: language === 'en' ? 'No Input Detected' : '未檢測到輸入',
           description: language === 'en' ? 'Please try speaking again.' : '請重試。',
           variant: 'info'
       });
    }
     else {
         console.warn('[processFinalVoiceText] Unexpected condition, itemsList:', itemsList, 'voicedItemsList length:', voicedItemsList.length);
     }
  };
  
  // 處理手動輸入模式
  const handleManualMode = () => {
    resetForm(true); 
    // 已移除自動聚焦，防止鍵盤自動彈出
  };

  // 在handleCameraMode函數之後添加刪除照片的函數
  const handleDeleteImage = () => {
    // 刪除圖片
    setImage(null);
    
    // 顯示提示
    showToast({
      title: 'Photo Deleted',
      description: 'Photo has been removed from item',
      variant: "success"
    });
  };

  // 保存多個項目的函數
  const saveMultipleItems = () => {
    let anyQuantityAdjusted = false;
    const effectiveFamilySize = settings.familySize || 1;
    const allSubcategories = [...(categorySubcategories?.['Food'] || []), ...(categorySubcategories?.['Household'] || [])];

    const itemsToAdd = voicedItemsList.map(item => {
      const originalQuantity = parseInt(item.quantity) || 1;
      let finalQuantity = originalQuantity;
      let quantityAdjusted = false;
      let shouldAutoScale = false; // 新增：判斷是否應該自動調整

      if (item.subcategory && effectiveFamilySize > 1 && originalQuantity >= 1) {
        const currentSubcategoryConfig = allSubcategories.find(config => 
          config.name.en === item.subcategory || 
          config.name[language as 'en' | 'zh-TW' | 'zh-CN'] === item.subcategory
        );

        if (currentSubcategoryConfig) {
          const subcategoryNameEn = currentSubcategoryConfig.name.en;
          
          // 修正：根據 isPremium 或預設列表決定是否調整
          if (currentUser?.isPremium || DEFAULT_AUTO_SCALE_SUBCATEGORIES_EN.includes(subcategoryNameEn)) {
              shouldAutoScale = true;
          }

          if (shouldAutoScale) {
              const multiplier = settings.subcategoryMultipliers?.[subcategoryNameEn] ?? 1;
              const calculatedQty = originalQuantity * effectiveFamilySize * multiplier;
              finalQuantity = Math.round(calculatedQty);
              if (finalQuantity !== originalQuantity) {
                quantityAdjusted = true;
                anyQuantityAdjusted = true; // 如果任何一個項目被調整，設置此標誌
                console.log(`[Save Multiple Adjusted]: ${item.name} (${subcategoryNameEn}), BaseQ: ${originalQuantity}, Family: ${effectiveFamilySize}, Multiplier: ${multiplier} => Result: ${finalQuantity}`);
              }
          } else {
               console.log(`[Save Multiple Not Scaled - Basic/NonDefault]: ${item.name} (${subcategoryNameEn})`);
          }
        } else {
           console.log(`[Save Multiple Not Scaled - No Config]: ${item.name}`);
        }
      }
      // End Simplified Quantity Calculation

      return {
          name: item.name,
          quantity: finalQuantity.toString(),
          category: item.category,
          subcategory: item.subcategory,
          daysUntilExpiry: item.daysUntilExpiry,
          notifyDaysBefore: settings.notificationsEnabled ? 2 : 0, 
          expiryDate: format(addDays(new Date(), item.daysUntilExpiry), 'yyyy-MM-dd'),
      };
    });
    
    addMultipleItems(itemsToAdd);
    
    const adjustedMessage = anyQuantityAdjusted ? (language === 'en' ? ' (Quantities adjusted for family where applicable)' : ' (適用項目的數量已根據家庭調整)') : '';

    showToast({
      title: `${itemsToAdd.length} Items Saved`,
      description: `Items added to inventory${adjustedMessage}`,
      variant: "success"
    });
    
    resetForm();
    onOpenChange(false);
  };
  
  // 重置表單
  const resetForm = (keepDialogOpen = false) => { // Add optional parameter
    console.log('[resetForm] 重置表單狀態');
    
    // 重置表單狀態
    setItemName('');
    setQuantity(1);
    setCategory('Food');
    setSubcategory('');
    setDaysUntilExpiry(7);
    setExpiryDate(addDays(new Date(), 7));
    setNotifyDaysBefore(settings.defaultNotifyDaysBefore); // 使用設置中的默認通知天數
    setImage(null);
    
    // 重置語音相關狀態
    setVoicedItemsList([]);
    setIsVoiceMode(false);
    setIsBarcodeMode(false);
    setIsManualMode(true);
    setListening(false);
    manualStopRef.current = true; // 標記為需要停止
    voiceTextRef.current = '';
    
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
      console.log('[resetForm] Cleared silence timer.');
    }
    
    // 重置條形碼掃描結果
    setBarcodeResult(null);
    setBarcodeFormat(null);
    
    // 重置編輯項目
    if (!keepDialogOpen) {
      if (onOpenChange) {
        onOpenChange(false);
      }
    }
    
    console.log('[resetForm] 表單已重置');
  };
  
  // 確保停止聆聽 (應由確認關閉或手動停止等調用)
  const ensureStopListening = async () => {
    console.log(`[ensureStopListening] Called. Current state - listening: ${listening}, isVoiceMode: ${isVoiceMode}`);
    if (listening || isVoiceMode) { // 只要處於語音模式或仍在監聽，就執行停止
        console.log('[ensureStopListening] Stopping listening process...');
        manualStopRef.current = true; // 設置手動停止標誌
        setIsVoiceMode(false); // 退出語音模式狀態
        setListening(false); // 更新監聽狀態
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
          console.log('[ensureStopListening] Cleared silence timer.');
        }
        await stopSpeechRecognition(); // 調用插件停止
        console.log('[ensureStopListening] Stop process completed.');
    } else {
        console.log('[ensureStopListening] Already not listening or not in voice mode.');
    }
  };
  
  // 驗證表單
  const validateForm = () => {
    // Check if form is valid
    if (!itemName.trim()) {
      showToast({
        title: t('validationErrorTitle'),
        description: t('validationItemNameRequired'),
        variant: 'destructive',
      });
      return false;
    }

    // Check if days until expiry is valid - must be non-negative
    if (daysUntilExpiry < 0) {
      showToast({
        title: t('validationErrorTitle'),
        description: t('validationDaysInvalid'),
        variant: 'destructive',
      });
      return false;
    }
    
    // Check if notify days is valid - must be non-negative
    if (notifyDaysBefore < 0) {
      showToast({
        title: t('validationErrorTitle'),
        description: t('validationNotifyDaysInvalid'),
        variant: 'destructive',
      });
      return false;
    }
    
    if (!isValidDate(expiryDate)) {
      showToast({
        title: t('validationErrorTitle'),
        description: 'Invalid expiry date',
        variant: 'destructive',
      });
      return false;
    }
    
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 驗證表單
    if (!validateForm()) {
      return;
    }
    
    // 計算家庭大小調整的數量
    const effectiveFamilySize = settings.familySize || 1;
    const originalQuantity = quantity;
    let finalQuantity = originalQuantity;
    let quantityAdjusted = false;
    let shouldAutoScale = false;
    
    const allSubcategories = [...(categorySubcategories?.['Food'] || []), ...(categorySubcategories?.['Household'] || [])];
    
    // 只有啟用自動調整且有子類別時才進行計算
    if (showFamilySizeHint && subcategory && effectiveFamilySize > 1 && originalQuantity >= 1) {
      const currentSubcategoryConfig = allSubcategories.find(config => 
        config.name.en === subcategory || 
        config.name[language as 'en' | 'zh-TW' | 'zh-CN'] === subcategory
      );
      
      if (currentSubcategoryConfig) {
        const subcategoryNameEn = currentSubcategoryConfig.name.en;
        
        // 檢查是否啟用高級數量設置
        if (!settings.advancedQuantitySettings) {
          // 基本模式：僅對特定子類別進行調整，比例為1:1
          shouldAutoScale = DEFAULT_AUTO_SCALE_SUBCATEGORIES_EN.includes(subcategoryNameEn);
          console.log(`[Submit Basic Mode] 子類別 ${subcategoryNameEn} 是否應調整: ${shouldAutoScale}`);
          
          if (shouldAutoScale) {
            // 基本模式下使用1:1比例
            finalQuantity = originalQuantity * effectiveFamilySize;
            quantityAdjusted = true;
            console.log(`[Submit Basic Mode] ${itemName} (${subcategoryNameEn}), 基本數量: ${originalQuantity}, 家庭大小: ${effectiveFamilySize} => 結果: ${finalQuantity}`);
          }
        } else {
          // 高級模式：所有子類別都可以調整，使用每人單位設置
          shouldAutoScale = true;
          const multiplier = settings.subcategoryMultipliers?.[subcategoryNameEn] ?? 1;
          finalQuantity = Math.round(originalQuantity * effectiveFamilySize * multiplier);
          quantityAdjusted = finalQuantity !== originalQuantity;
          console.log(`[Submit Advanced Mode] ${itemName} (${subcategoryNameEn}), 基本數量: ${originalQuantity}, 家庭大小: ${effectiveFamilySize}, 乘數: ${multiplier} => 結果: ${finalQuantity}`);
        }
      } else {
        console.log(`[Submit No Config] ${itemName} - 找不到子類別配置`);
      }
    } else {
      console.log(`[Submit No Adjustment Needed] ${itemName}, 基本數量: ${originalQuantity}`);
    }
    
    const finalQuantityString = finalQuantity.toString();
    
    // 設置最終的通知天數，使用設置中的默認值
    const finalNotifyDaysBefore = notifyDaysBefore || settings.defaultNotifyDaysBefore;
    
    console.log(`[Submit] 項目:${itemName}, 原始數量=${quantity}, 最終數量=${finalQuantityString}, 通知天數=${finalNotifyDaysBefore}, 開關狀態=${showFamilySizeHint}, 調整=${quantityAdjusted}, 購物清單模式=${isShopListMode}`);

    // 根據模式決定保存到儀表板還是購物清單
    if (isShopListMode) {
      // 購物清單模式 - 使用 addToShopList 函數
      addToShopList({
        name: capitalizeFirstLetter(itemName),
        quantity: finalQuantityString, // 使用計算後的數量
        category: category,
        subcategory: subcategory
      });
      
      const adjustedMessage = quantityAdjusted ? (language === 'en' ? ` (Quantity set to ${finalQuantityString} for family)` : ` (數量已設為 ${finalQuantityString} 個以供家庭使用)`) : '';
      
      // 只有當不是重新添加項目時或名稱發生變化時才顯示toast
      if (!reAddItem || (reAddItem && reAddItem.name !== capitalizeFirstLetter(itemName))) {
        showToast({
          title: "Success",
          description: `${itemName} has been added to shopping list.${adjustedMessage}`,
        });
      }
    } else if (editItem) {
      // 編輯模式 - 使用 updateItem 函數
      const updatedItem = {
        ...editItem,
        name: capitalizeFirstLetter(itemName),
        quantity: finalQuantityString,
        category: category,
        subcategory: subcategory,
        expiryDate: expiryDate.toISOString(),
        daysUntilExpiry: differenceInDays(expiryDate, new Date()),
        notifyDaysBefore: finalNotifyDaysBefore,
        image: image,
      };
      
      updateItem(editItem.id, updatedItem);
      
      showToast({
        title: "Success",
        description: `${updatedItem.name} has been updated successfully.`,
      });
    } else {
      // 新項目模式 - 使用 addItem 函數
      const newItem = {
        name: capitalizeFirstLetter(itemName),
        quantity: finalQuantityString, // 使用計算後的數量
        category: category,
        subcategory: subcategory,
        expiryDate: expiryDate.toISOString(),
        daysUntilExpiry: differenceInDays(expiryDate, new Date()),
        notifyDaysBefore: finalNotifyDaysBefore,
        image: image,
      };
      
      addItem(newItem);
      
      const adjustedMessage = quantityAdjusted ? (language === 'en' ? ` (Quantity set to ${finalQuantityString} for family)` : ` (數量已設為 ${finalQuantityString} 個以供家庭使用)`) : '';
      
      // 只有當不是重新添加項目時或名稱發生變化時才顯示toast
      if (!reAddItem || (reAddItem && reAddItem.name !== capitalizeFirstLetter(itemName))) {
        showToast({
          title: "Success",
          description: `${newItem.name} has been added successfully.${adjustedMessage}`,
        });
      }
    }

    resetForm();
    onOpenChange(false);
  }

  // 條形碼掃描相關
  const [barcodeResult, setBarcodeResult] = useState<string | null>(null);
  const [barcodeFormat, setBarcodeFormat] = useState<string | null>(null);

  // 使用Microsoft Translate API翻譯產品名稱
  const translateProductName = async (text: string, targetLanguage: string): Promise<string> => {
    try {
      // 設置Microsoft Translator API的配置
      const apiKey = "3ta7QMWDWLfH2CqBO4h0SwUlh6TlcIbiweSyVIRcKIyuFSSarA7eJQQJ99BDACL93NaXJ3w3AAAbACOGzNBK"; // API密鑰
      const endpoint = "https://api.cognitive.microsofttranslator.com";
      const region = "australiaeast"; // 區域

      // 根據目標語言設置正確的語言代碼
      let targetLang = 'en';
      if (targetLanguage === 'zh-TW') {
        targetLang = 'zh-Hant'; // 繁體中文的語言代碼
      } else if (targetLanguage === 'zh-CN') {
        targetLang = 'zh-Hans'; // 簡體中文的語言代碼
      }

      // 構建請求
      const url = `${endpoint}/translate?api-version=3.0&to=${targetLang}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': apiKey,
          'Ocp-Apim-Subscription-Region': region,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([{ text }]),
      });

      if (!response.ok) {
        console.error('翻譯API錯誤:', response.status);
        return text; // 如果翻譯失敗，返回原始文本
      }

      const data = await response.json();
      console.log('翻譯API響應:', data); // 添加日誌以便調試
      
      // 從返回結果中獲取翻譯文本
      if (data && data.length > 0 && data[0].translations && data[0].translations.length > 0) {
        return data[0].translations[0].text;
      }

      return text; // 如果無法獲取翻譯，返回原始文本
    } catch (error) {
      console.error('翻譯錯誤:', error);
      return text; // 出錯時返回原始文本
    }
  };

  // 使用Open Food Facts API獲取產品信息
  const getProductInfoFromUPC = async (barcode: string): Promise<{ name: string | null; error?: string; isTranslated?: boolean; originalLanguage?: string }> => {
    try {
      // Open Food Facts API 請求
      const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      
      if (!response.ok) {
        console.error('Open Food Facts API 錯誤:', response.status);
        return { name: null, error: `API 錯誤: ${response.status}` };
      }
      
      const data = await response.json();
      
      // 檢查是否有結果
      if (data.status === 1 && data.product) {
        // 根據當前語言選擇產品名稱
        let productName = '';
        let needsTranslation = false;
        
        // 嘗試獲取對應語言的產品名稱
        if (language === 'en' && data.product.product_name_en) {
          productName = data.product.product_name_en;
        } else if (language === 'zh-TW' && data.product.product_name_zh) {
          productName = data.product.product_name_zh;
        } else if (language === 'zh-CN' && data.product.product_name_zh) {
          productName = data.product.product_name_zh;
        } else {
          // 如果沒有對應的語言版本，使用默認名稱並標記需要翻譯
          productName = data.product.product_name || '';
          needsTranslation = true;
        }
        
        if (productName) {
          // 如果需要翻譯且產品名稱不為空
          if (needsTranslation && language !== 'en') {
            // 使用Microsoft翻譯API翻譯產品名稱
            const translatedName = await translateProductName(productName, language);
            return { name: translatedName, isTranslated: true, originalLanguage: 'en' };
          }
          return { name: productName, isTranslated: false };
        } else {
          // 如果產品名稱為空，使用通用名稱或品牌
          const genericName = data.product.generic_name || data.product.brands || '';
          
          // 如果有通用名稱且需要翻譯
          if (genericName && needsTranslation && language !== 'en') {
            const translatedName = await translateProductName(genericName, language);
            return { name: translatedName, isTranslated: true, originalLanguage: 'en' };
          }
          
          return { name: genericName || null, error: genericName ? undefined : '未找到產品名稱' };
        }
      } else {
        console.log('沒有找到產品');
        return { name: null, error: '沒有找到產品' };
      }
    } catch (error) {
      console.error('獲取產品信息錯誤:', error);
      return { name: null, error: '網絡錯誤，無法獲取產品信息' };
    }
  };

  // 添加一個模擬的條碼數據庫作為備用
  const getProductNameByBarcode = (barcode: string): string | null => {
    // 根據當前語言設置選擇產品名稱
    const barcodeDatabase: Record<string, { 
      en: string, 
      'zh-TW': string, 
      'zh-CN': string 
    }> = {
      // 台灣/中國常見食品
      '4710421000097': { 
        en: 'Wei-Chuan Fresh Milk', 
        'zh-TW': '光泉鮮乳', 
        'zh-CN': '光泉鲜奶' 
      },
      '8886950034662': { 
        en: 'Milo Chocolate Malt Drink', 
        'zh-TW': '美祿巧克力麥芽飲品', 
        'zh-CN': '美禄巧克力麦芽饮品' 
      },
      // ... 現有條碼信息保留 ...
    };
    
    // 根據當前語言返回產品名稱
    const product = barcodeDatabase[barcode];
    if (product) {
      // 如果有對應語言的產品名稱，則返回對應語言的產品名稱，否則返回英文名稱
      return product[language as 'en' | 'zh-TW' | 'zh-CN'] || product.en;
    }
    
    return null;
  };

  // 處理條碼掃描模式
  const handleBarcodeMode = async () => {
    try {
      // 檢查權限
      const permissionStatus = await BarcodeScanner.checkPermissions();
      
      if (permissionStatus.camera === 'denied') {
        const request = await BarcodeScanner.requestPermissions();
        if (request.camera !== 'granted') {
          showToast({
            title: t('permissionDenied'),
            description: t('cameraPermissionRequired'),
            variant: "destructive"
          });
          return;
        }
      }
      
      // 開始掃描
      const result = await BarcodeScanner.scan({
        formats: [
          BarcodeFormat.Ean13,
          BarcodeFormat.Ean8,
          BarcodeFormat.UpcA,
          BarcodeFormat.UpcE,
          BarcodeFormat.QrCode
        ]
      });
      
      // 檢查是否有掃描結果
      if (result && result.barcodes && result.barcodes.length > 0) {
        const barcode = result.barcodes[0];
        
        // 設置條碼值為商品名稱或使用條碼值作為備選
        if (barcode.displayValue || barcode.rawValue) {
          const barcodeValue = barcode.displayValue || barcode.rawValue;
          
          // 先顯示掃描成功
          showToast({
            title: t('barcodeScanned'),
            description: `${barcode.format}: ${barcodeValue}`,
            variant: "success"
          });
          
          // 顯示加載中...
          showToast({
            title: t('searchingProduct'),
            description: t('pleaseWait'),
            variant: "default"
          });
          
          // 嘗試從Open Food Facts獲取產品信息
          const productInfo = await getProductInfoFromUPC(barcodeValue);
          
          if (productInfo.name) {
            // 如果從API找到產品名稱，使用它
            setItemName(productInfo.name);
            
            // 檢查是否是翻譯的結果
            if (productInfo.isTranslated) {
              showToast({
                title: t('productFound'),
                description: t('translatedFrom', { lang: productInfo.originalLanguage || 'English' }),
                variant: "success"
              });
            } else {
              showToast({
                title: t('productFound'),
                description: productInfo.name,
                variant: "success"
              });
            }
          } else {
            // 如果API沒有找到，嘗試從本地數據庫獲取
            const localProductName = getProductNameByBarcode(barcodeValue);
            
            if (localProductName) {
              // 如果在本地數據庫找到產品名稱，使用它
              setItemName(localProductName);
              
              showToast({
                title: t('productFound'),
                description: localProductName,
                variant: "success"
              });
            } else {
              // 如果兩者都沒有找到產品名稱，使用條碼值並提示用戶編輯
              setItemName(barcodeValue);
              
              showToast({
                title: t('productNotFound'),
                description: t('pleaseEditItemName'),
                variant: "warning"
              });
            }
          }
          
          // 保存條碼值供參考
          setBarcodeResult(barcodeValue);
          setBarcodeFormat(barcode.format);
        }
      }
    } catch (error: any) {
      console.error('條碼掃描錯誤:', error);
      
      if (error.message === 'User denied camera permission') {
        showToast({
          title: t('permissionDenied'),
          description: t('cameraPermissionRequired'),
          variant: "destructive"
        });
      } else {
        showToast({
          title: t('scanningError'),
          description: t('scanningFailed'),
          variant: "destructive"
        });
      }
    }
    
    // 關閉條碼模式，切換到手動模式
    setIsBarcodeMode(false);
    setIsManualMode(true);
  };

  // 查找並移除設置 showDateToggle 的代碼
  const handleDaysInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    if (value === '') {
      setDaysUntilExpiry(0); // 改為數字類型
    } else {
      const days = parseInt(value);
      setDaysUntilExpiry(days);
      // 同時更新日期
      const newDate = addDays(new Date(), days);
      setExpiryDate(newDate);
    }
  };
  
  // 修改通知天數處理函數
  const handleNotifyDaysInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    if (value === '') {
      setNotifyDaysBefore(0); // 改為數字類型
    } else {
      setNotifyDaysBefore(parseInt(value));
    }
  };
  
  // 新增：定義預設自動調整數量的子類別 (與 ShopList 保持一致)
  const DEFAULT_AUTO_SCALE_SUBCATEGORIES_EN = ['Meat', 'Seafood', 'Fruits & Vegetables'];

  // 修改：重寫此 useEffect 以實現正確的數量計算邏輯
  useEffect(() => {
    if (!showFamilySizeHint) {
        setFinalCalculatedQuantity(quantity.toString());
        return;
    }
    
    const effectiveFamilySize = settings.familySize || 1;
    let calculatedQty = quantity;
    const allSubcategories = [...(categorySubcategories?.['Food'] || []), ...(categorySubcategories?.['Household'] || [])];
    let shouldAutoScale = false; // 判斷是否應該自動調整

    // 只有當啟用自動調整、有子類別、家庭大小大於1且數量至少為1時才計算
    if (subcategory && effectiveFamilySize > 1 && quantity >= 1) {
        const currentSubcategoryConfig = allSubcategories.find(config => 
          config.name.en === subcategory || 
          config.name[language as 'en' | 'zh-TW' | 'zh-CN'] === subcategory
        );

        if (currentSubcategoryConfig) {
            const subcategoryNameEn = currentSubcategoryConfig.name.en;
            
            // 檢查是否啟用高級數量設置
            if (!settings.advancedQuantitySettings) {
                // 基本模式：僅對特定子類別進行調整，比例為1:1
                shouldAutoScale = DEFAULT_AUTO_SCALE_SUBCATEGORIES_EN.includes(subcategoryNameEn);
                console.log(`[Basic Mode] 子類別 ${subcategoryNameEn} 是否應調整: ${shouldAutoScale}`);
                
                if (shouldAutoScale) {
                    // 基本模式下使用1:1比例
                    calculatedQty = quantity * effectiveFamilySize;
                    console.log(`[Basic Mode] ${itemName} (${subcategoryNameEn}), 基本數量: ${quantity}, 家庭大小: ${effectiveFamilySize} => 結果: ${calculatedQty}`);
                }
            } else {
                // 高級模式：所有子類別都可以調整 - 不再檢查是否為高級用戶
                shouldAutoScale = true;
                const multiplier = settings.subcategoryMultipliers?.[subcategoryNameEn] ?? 1;
                calculatedQty = quantity * effectiveFamilySize * multiplier;
                console.log(`[Advanced Mode] ${itemName} (${subcategoryNameEn}), 基本數量: ${quantity}, 家庭大小: ${effectiveFamilySize}, 乘數: ${multiplier} => 結果: ${calculatedQty}`);
            }
        } else {
             calculatedQty = quantity; // 找不到配置，不調整
             console.log(`[No Config] ${itemName} - 找不到子類別配置`);
        }
    } else {
      // 如果沒有子類別或家庭大小為1等，不進行調整
      calculatedQty = quantity;
      console.log(`[No Adjustment Needed] ${itemName}, 基本數量: ${quantity}`);
    }
    
    const finalQuantityString = Math.round(calculatedQty).toString();
    setFinalCalculatedQuantity(finalQuantityString);
    
  }, [quantity, subcategory, settings.familySize, settings.advancedQuantitySettings, settings.subcategoryMultipliers, language, categorySubcategories, itemName, showFamilySizeHint, currentUser]);

  // 檢查日期是否有效
  const isValidDate = (date: Date): boolean => {
    return date instanceof Date && !isNaN(date.getTime());
  };

  // 新增：處理儲存並繼續的操作
  const handleSaveAndContinue = () => {
    // Check if form is valid
    if (!itemName.trim()) {
      showToast({
        title: t('validationErrorTitle'),
        description: t('validationItemNameRequired'),
        variant: 'destructive',
      });
      return;
    }
    
    // Check if days until expiry is valid - must be non-negative
    if (daysUntilExpiry < 0) {
      showToast({
        title: t('validationErrorTitle'),
        description: t('validationDaysInvalid'),
        variant: 'destructive',
      });
      return;
    }
    
    // Check if notify days is valid - must be non-negative
    if (notifyDaysBefore < 0) {
      showToast({
        title: t('validationErrorTitle'),
        description: t('validationNotifyDaysInvalid'),
        variant: 'destructive',
      });
      return;
    }
    
    if (!isValidDate(expiryDate)) {
      showToast({
        title: t('validationErrorTitle'),
        description: 'Invalid expiry date',
        variant: 'destructive',
      });
      return;
    }
    
    // 計算家庭大小調整的數量
    const effectiveFamilySize = settings.familySize || 1;
    const originalQuantity = quantity;
    let finalQuantity = originalQuantity;
    let quantityAdjusted = false;
    let shouldAutoScale = false;
    
    const allSubcategories = [...(categorySubcategories?.['Food'] || []), ...(categorySubcategories?.['Household'] || [])];
    
    // 只有啟用自動調整且有子類別時才進行計算
    if (showFamilySizeHint && subcategory && effectiveFamilySize > 1 && originalQuantity >= 1) {
      const currentSubcategoryConfig = allSubcategories.find(config => 
        config.name.en === subcategory || 
        config.name[language as 'en' | 'zh-TW' | 'zh-CN'] === subcategory
      );
      
      if (currentSubcategoryConfig) {
        const subcategoryNameEn = currentSubcategoryConfig.name.en;
        
        // 檢查是否啟用高級數量設置
        if (!settings.advancedQuantitySettings) {
          // 基本模式：僅對特定子類別進行調整，比例為1:1
          shouldAutoScale = DEFAULT_AUTO_SCALE_SUBCATEGORIES_EN.includes(subcategoryNameEn);
          console.log(`[SaveContinue Basic Mode] 子類別 ${subcategoryNameEn} 是否應調整: ${shouldAutoScale}`);
          
          if (shouldAutoScale) {
            // 基本模式下使用1:1比例
            finalQuantity = originalQuantity * effectiveFamilySize;
            quantityAdjusted = true;
            console.log(`[SaveContinue Basic Mode] ${itemName} (${subcategoryNameEn}), 基本數量: ${originalQuantity}, 家庭大小: ${effectiveFamilySize} => 結果: ${finalQuantity}`);
          }
        } else {
          // 高級模式：所有子類別都可以調整，使用每人單位設置
          shouldAutoScale = true;
          const multiplier = settings.subcategoryMultipliers?.[subcategoryNameEn] ?? 1;
          finalQuantity = Math.round(originalQuantity * effectiveFamilySize * multiplier);
          quantityAdjusted = finalQuantity !== originalQuantity;
          console.log(`[SaveContinue Advanced Mode] ${itemName} (${subcategoryNameEn}), 基本數量: ${originalQuantity}, 家庭大小: ${effectiveFamilySize}, 乘數: ${multiplier} => 結果: ${finalQuantity}`);
        }
      } else {
        console.log(`[SaveContinue No Config] ${itemName} - 找不到子類別配置`);
      }
    } else {
      console.log(`[SaveContinue No Adjustment Needed] ${itemName}, 基本數量: ${originalQuantity}`);
    }
    
    const finalQuantityString = finalQuantity.toString();

    console.log(`[Save & Continue] 項目:${itemName}, 原始數量=${quantity}, 最終數量=${finalQuantityString}, 開關狀態=${showFamilySizeHint}, 調整=${quantityAdjusted}, 購物清單模式=${isShopListMode}`);

    // 根據模式決定保存到儀表板還是購物清單
    if (isShopListMode) {
      // 購物清單模式 - 使用 addToShopList 函數
      addToShopList({
        name: capitalizeFirstLetter(itemName),
        quantity: finalQuantityString, // 使用計算後的數量
        category: category,
        subcategory: subcategory
      });
      
      const adjustedMessage = quantityAdjusted ? (language === 'en' ? ` (Quantity set to ${finalQuantityString} for family)` : ` (數量已設為 ${finalQuantityString} 個以供家庭使用)`) : '';
      
      // 只有當不是重新添加項目時或名稱發生變化時才顯示toast
      if (!reAddItem || (reAddItem && reAddItem.name !== capitalizeFirstLetter(itemName))) {
        showToast({
          title: "Success",
          description: `${itemName} has been added to shopping list.${adjustedMessage}`,
        });
      }
    } else {
      // 儀表板模式 - 使用原有的 addItem 函數
      const newItem = {
        name: capitalizeFirstLetter(itemName),
        quantity: finalQuantityString, // 使用計算後的數量
        category: category,
        subcategory: subcategory,
        expiryDate: expiryDate.toISOString(),
        daysUntilExpiry: differenceInDays(expiryDate, new Date()),
        notifyDaysBefore: 3, // 始終使用默認值 3
        image: image,
      };
      
      addItem(newItem);
      
      const adjustedMessage = quantityAdjusted ? (language === 'en' ? ` (Quantity set to ${finalQuantityString} for family)` : ` (數量已設為 ${finalQuantityString} 個以供家庭使用)`) : '';
      
      // 只有當不是重新添加項目時或名稱發生變化時才顯示toast
      if (!reAddItem || (reAddItem && reAddItem.name !== capitalizeFirstLetter(itemName))) {
        showToast({
          title: "Success",
          description: `${newItem.name} has been added successfully.${adjustedMessage}`,
        });
      }
    }

    resetForm(true);
    // 移除對輸入框的聚焦，以防止移動設備上顯示鍵盤
  };

  // 新增一個函數來檢查是否應該顯示通知設置部分
  const shouldShowNotifySection = () => {
    return Boolean(editItem) && !reAddItem
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent 
          className={`sm:max-w-md p-0 gap-0 overflow-hidden dialog-content-no-close-button max-h-[85vh] w-[95vw]`} 
          autoFocus={false} // 禁用自動聚焦
        >
          {/* 使用 autoFocus={false} 來防止對話框自動聚焦在輸入欄位 */}
          {/* 
          調整 DialogContent 的樣式以改善行動裝置體驗：
          - max-h-[90vh] 或類似值，限制最大高度
          - display: flex, flex-direction: column，使內容和頁腳可以垂直排列
          - overflow: hidden，防止父容器滾動
        */}
          <div className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/10 px-4 pt-4 pb-3 border-b shadow-sm flex-shrink-0">
            <div>
              <DialogTitle className="text-lg font-bold text-foreground mb-1 flex items-center">
                <span className="bg-orange-500/10 rounded-full p-1 mr-2">
                  {editItem ? <Pencil className="h-4 w-4 text-orange-600" /> : <PlusCircle className="h-4 w-4 text-orange-600" />}
                </span>
                {editItem 
                  ? t('editItem') 
                  : isShopListMode 
                    ? (language === 'en' ? 'Add to Shopping List' : '添加到購物清單')
                    : t('addItem')
                }
              </DialogTitle>
              <div className="text-xs text-muted-foreground pl-7">
                {language === 'en' ? 
                  'Use manual, voice or barcode scanner to record items' : 
                  language === 'zh-TW' ? 
                  '使用手動、語音或條碼掃描來記錄物品' : 
                  '使用手动、语音或条码扫描来记录物品'
                }
              </div>
            </div>
          </div>
          
          {/* 主要內容 - 調整最大高度，改為 60vh，以確保在移動設備上更好的體驗 */} 
          <div className="max-h-[calc(60vh)] overflow-y-auto p-0 pb-2 mx-3 space-y-3">
            {/* 輸入模式切換按鈕 - 移除此部分 */}
            {voicedItemsList.length === 0 && (
              <>
                {/* 如果有圖片，顯示預覽和刪除按鈕 */}
                {image && (
                  <div className="mt-2 mb-2 relative">
                    <img 
                      src={image} 
                      alt="Item Preview" 
                      className="w-full h-28 object-cover rounded-md border" 
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2 h-7 w-7 rounded-full p-0"
                      onClick={handleDeleteImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                {/* 1. 項目名稱部分 - 語音和條碼按鈕完全分離 */}
                <div className="bg-white dark:bg-slate-900 shadow-sm rounded-lg p-2 border border-gray-100 dark:border-gray-800 mb-1.5">
                  <Label htmlFor="name" className="text-sm font-medium flex items-center text-slate-700 dark:text-slate-300 mb-1">
                    <Pencil className="h-4 w-4 mr-1.5 text-orange-500" />
                    {language === 'en' ? "Item Name" : "項目名稱"} <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <div className="flex space-x-2">
                    {/* 修改輸入欄位，添加清除按鈕 */}
                    <div className="relative flex-1">
                      <Input 
                        id="name" 
                        ref={itemNameRef}
                        value={itemName} 
                        onChange={e => setItemName(e.target.value)} 
                        placeholder={language === 'en' ? "Enter item name" : "輸入項目名稱"} 
                        className="h-9 border-orange-200 focus:border-orange-500 focus:ring-orange-500 pr-8" 
                        autoFocus={false}
                        tabIndex={1}
                      />
                      {itemName && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setItemName('')}
                          className="h-6 w-6 p-0 absolute right-1.5 top-1/2 transform -translate-y-1/2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                          <X className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                      )}
                    </div>
                    
                    {/* 獨立的語音和條碼按鈕，使用類似類別按鈕的樣式 */}
                    <div className="flex space-x-1 items-center">
                      <Button
                        type="button"
                        onClick={handleVoiceMode}
                        variant="outline"
                        className={`h-9 px-2 border-orange-300 ${listening ? "bg-red-50 text-red-500 animate-pulse border-red-300" : "bg-orange-50/70 hover:bg-orange-100 text-orange-500"}`}
                        title="Voice Input"
                      >
                        {listening ? 
                          <MicOff className="h-4 w-4" /> : 
                          <Mic className="h-4 w-4" />
                        }
                      </Button>
                      <Button
                        type="button"
                        onClick={handleBarcodeMode}
                        variant="outline"
                        className={`h-9 px-2 border-orange-300 ${isBarcodeMode ? "bg-orange-100 text-orange-600" : "bg-orange-50/70 hover:bg-orange-100 text-orange-500"}`}
                        title="Barcode Scanner"
                      >
                        <Barcode className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* 2. 數量部分 - 寬度100%並優化家庭尺寸切換 */}
                <div className="bg-white dark:bg-slate-900 shadow-sm rounded-lg p-2 border border-gray-100 dark:border-gray-800 mb-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium flex items-center text-slate-700 dark:text-slate-300">
                      <Hash className="h-4 w-4 mr-1.5 text-orange-500" />
                      Quantity
                    </Label>
                    {/* 3. 簡潔的自動調整開關設計 - 統一間距 */}
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
                          
                          {/* 添加實際輸入元素，以便更好地處理事件 */}
                          <input 
                            type="checkbox" 
                            id="family-toggle-itemform"
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
                  {/* 數量控制元件 - 改為水平布局 */}
                  <div className="flex items-center gap-2 mt-1.5"> 
                    <div className="flex items-center bg-white dark:bg-slate-900 border rounded-md overflow-hidden border-orange-200 w-1/2"> 
                      <Button 
                        type="button" 
                        variant="ghost" 
                        onClick={() => setQuantity(Math.max(1, quantity - 1))} 
                        disabled={quantity <= 1} 
                        className="h-8 w-8 rounded-none focus:ring-0 border-none flex-shrink-0"
                      >
                        <Minus className="h-4 w-4 text-orange-500" />
                      </Button>
                      {/* 基本數量顯示 */}
                      <div className="flex-1 text-center font-medium border-x border-orange-200 text-slate-700 dark:text-slate-300">
                        <input
                          type="number"
                          min="1" 
                          value={quantity}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            if (!isNaN(val) && val >= 1) {
                              setQuantity(val);
                            } else if (e.target.value === '') {
                              setQuantity(1);
                            }
                          }}
                          className="w-full h-8 text-center border-0 bg-transparent text-base font-medium focus-visible:ring-0 focus-visible:ring-offset-0 p-0" 
                          tabIndex={4}
                        />
                      </div>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        onClick={() => setQuantity(quantity + 1)} 
                        className="h-8 w-8 rounded-none focus:ring-0 border-none flex-shrink-0"
                      >
                        <Plus className="h-4 w-4 text-orange-500" />
                      </Button>
                    </div>
                    
                    {/* 替換為 ShopList 的自動調整數量顯示邏輯 */}
                    <div className="w-1/2 rounded-md border border-orange-200 flex items-center px-2.5 py-1 bg-orange-50/50 h-8"> {/* Added h-8 */}
                      {showFamilySizeHint && quantity.toString() !== finalCalculatedQuantity ? (
                        <>
                          <Users className="h-3.5 w-3.5 mr-0.5 text-orange-500" />
                          <span className="mx-0.5 text-xs text-orange-700">{quantity}</span>
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
                            <div className="ml-1 rounded-full border border-orange-200 w-3.5 h-3.5 flex items-center justify-center cursor-help"> {/* Added cursor-help */}
                              <span className="text-[8px] text-orange-500">i</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs p-2"> {/* Added padding */}
                            {showFamilySizeHint && settings.familySize > 1 ? (
                              <p className="text-xs">
                                {language === 'en' 
                                  ? `Quantity adjusted based on family size (${settings.familySize}). Applies to certain categories or with premium.`
                                  : `數量已根據家庭人數(${settings.familySize})調整。適用於特定類別或高級用戶。`}
                              </p>
                            ) : (
                              <p className="text-xs">
                                {language === 'en' 
                                  ? 'Original quantity (no auto-adjustment applied or needed)' 
                                  : '原始數量（未應用或無需自動調整）'}
                              </p>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                </div>

                {/* 類別和子類別選擇部分 - 改為頂部對齊 */}
                <div className="flex flex-wrap gap-3 mb-1.5 bg-white dark:bg-slate-900 shadow-sm rounded-lg p-3 border border-gray-100 dark:border-gray-800 items-start"> 
                  <div className="flex-shrink-0 w-[90px] min-w-[90px]"> 
                    <Label htmlFor="category" className="text-sm font-medium mb-2 block flex items-center text-slate-700 dark:text-slate-300"> 
                      <Layers className="h-[1.1rem] w-[1.1rem] mr-1.5 text-orange-500 flex-shrink-0" /> 
                      {t('category')}
                    </Label>
                    {/* Removed fixed height, adjust button size/padding/gap */}
                    <div className="flex justify-start gap-1.5 mt-1 p-1 rounded-lg"> {/* 移除背景色 */} 
                      <Button
                        type="button"
                        onClick={() => setCategory('Food')}
                        className={`w-10 h-10 p-0 ${category === 'Food' 
                          ? 'border-2 border-orange-500 text-orange-500 bg-transparent'
                          : 'bg-transparent border border-gray-300 text-gray-400'}`}
                        tabIndex={2}
                      >
                        <Utensils className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        onClick={() => setCategory('Household')}
                        className={`w-10 h-10 p-0 ${category === 'Household' 
                          ? 'border-2 border-orange-500 text-orange-500 bg-transparent'
                          : 'bg-transparent border border-gray-300 text-gray-400'}`}
                        tabIndex={3}
                      >
                        <Home className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* 子類別選擇 */}
                  <div className="flex-1 self-stretch"> {/* Ensure subcategory div takes full height */} 
                    {/* Keep mb-2 for Subcategory title */}
                    <Label htmlFor="subcategory" className="text-sm font-medium mb-2 block flex items-center text-slate-700 dark:text-slate-300">
                      <Tag className="h-4 w-4 mr-1.5 text-orange-500 flex-shrink-0" /> 
                      {t('subcategory')}
                    </Label>
                    <Select 
                      value={subcategory} 
                      onValueChange={(value: string) => setSubcategory(value)}
                      disabled={!category || category === 'All' || category !== 'Food' && category !== 'Household' || subcategories.length === 0}
                    >
                      <SelectTrigger className="h-10 border-orange-200 w-full focus:ring-orange-300 focus-visible:ring-orange-300">
                        <SelectValue placeholder={language === 'en' ? "Select subcategory" : "選擇子類別"} />
                      </SelectTrigger>
                      {/* ... SelectContent ... */}
                       <SelectContent className="border-orange-200 max-h-[30vh]">
                        {subcategories.map((sub) => (
                          <SelectItem key={sub.name} value={sub.name}>
                            <div className="flex items-center justify-between w-full">
                              <span>{sub.name}</span>
                              <span className="ml-2 text-xs text-orange-500 font-semibold bg-orange-100 dark:bg-orange-900/30 px-1.5 py-0.5 rounded-full">
                                {sub.defaultExpiryDays} {t('days')}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="border-t pt-2 mt-1 mb-1.5">
                  <div className="flex justify-between items-center">
                    <Label className="text-sm font-medium flex items-center">
                      <Timer className={`h-4 w-4 mr-1.5 ${category === 'Food' || category === 'Household' ? "text-orange-500" : "text-muted-foreground"}`} />
                      {language === 'en' ? "Expires in" : "到期時間"}
                    </Label>
                  </div>
                  <div className="mt-1">
                    <div className="flex gap-1.5 items-center">
                      <div className="flex items-center w-[35%]">
                        <Input 
                         value={daysUntilExpiry === '' ? '' : String(daysUntilExpiry)} 
                         onChange={handleDaysInput}
                         type="text"
                         pattern="[0-9]*"
                         inputMode="numeric"
                         className="h-9 w-[3.5rem] text-center border-orange-200 focus:border-orange-500 focus:ring-orange-500"
                         maxLength={3}
                         autoFocus={false}
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
                              daysUntilExpiry === days 
                                ? "bg-white dark:bg-slate-800 text-orange-500 border-orange-300 shadow-sm" 
                                : "bg-orange-50/50 dark:bg-orange-900/10 border-orange-200/50 hover:bg-white dark:hover:bg-slate-800/30 text-muted-foreground hover:text-orange-500"
                            }`} 
                            onClick={() => {
                              setDaysUntilExpiry(days);
                              // 同時更新日期
                              const newDate = addDays(new Date(), days);
                              setExpiryDate(newDate);
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
                          {language === 'en' ? "Date:" : "日期:"} {formatDateWithUserPreference(format(expiryDate, 'yyyy-MM-dd'), settings.dateFormat)}
                        </p>
                        <div className="relative">
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm" 
                            className="h-5 p-1"
                            onClick={() => {
                              // 點擊顯示隱藏的原生日期選擇器
                              const dateInput = document.getElementById('hidden-date-input');
                              if (dateInput) dateInput.click();
                            }}
                          >
                            <CalendarIcon className="h-3 w-3 text-orange-500" />
                          </Button>
                          <input 
                            id="hidden-date-input"
                            type="date" 
                            value={format(expiryDate, 'yyyy-MM-dd')} 
                            onChange={(e) => { 
                              const date = new Date(e.target.value); 
                              if (!isNaN(date.getTime())) { 
                                setExpiryDate(date); 
                                // 同時更新天數
                                const now = new Date();
                                now.setHours(0, 0, 0, 0);
                                const days = differenceInDays(date, now);
                                setDaysUntilExpiry(Math.max(0, days));
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
                {/* Notify Before Section - 只在編輯項目時顯示 */}
                {shouldShowNotifySection() && (
                  <div className="space-y-1 mb-5">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium flex items-center">
                        <BellRing className="h-4 w-4 mr-2 text-orange-500" />
                        {t('notifyMeBefore' as TranslationKey)}
                      </Label>
                      <div className="flex items-center space-x-2 relative w-24">
                        <Select
                          value={String(notifyDaysBefore)}
                          onValueChange={(value: string) => {
                            setNotifyDaysBefore(parseInt(value, 10));
                          }}
                        >
                          <SelectContent>
                            <SelectItem value="0">0</SelectItem>
                            <SelectItem value="1">1</SelectItem>
                            <SelectItem value="2">2</SelectItem>
                            <SelectItem value="3">3</SelectItem>
                            <SelectItem value="4">4</SelectItem>
                            <SelectItem value="5">5</SelectItem>
                            <SelectItem value="6">6</SelectItem>
                            <SelectItem value="7">7</SelectItem>
                            <SelectItem value="8">8</SelectItem>
                            <SelectItem value="9">9</SelectItem>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="11">11</SelectItem>
                            <SelectItem value="12">12</SelectItem>
                            <SelectItem value="13">13</SelectItem>
                            <SelectItem value="14">14</SelectItem>
                            <SelectItem value="15">15</SelectItem>
                            <SelectItem value="16">16</SelectItem>
                            <SelectItem value="17">17</SelectItem>
                            <SelectItem value="18">18</SelectItem>
                            <SelectItem value="19">19</SelectItem>
                            <SelectItem value="20">20</SelectItem>
                            <SelectItem value="21">21</SelectItem>
                            <SelectItem value="22">22</SelectItem>
                            <SelectItem value="23">23</SelectItem>
                            <SelectItem value="24">24</SelectItem>
                            <SelectItem value="25">25</SelectItem>
                            <SelectItem value="26">26</SelectItem>
                            <SelectItem value="27">27</SelectItem>
                            <SelectItem value="28">28</SelectItem>
                            <SelectItem value="29">29</SelectItem>
                            <SelectItem value="30">30</SelectItem>
                          </SelectContent>
                        </Select>
                        <span className="absolute right-2 text-xs text-muted-foreground">
                          {t('days')}
                        </span>
                      </div>
                    </div>
                    {notifyDaysBefore === -1 && (
                      <div className="text-xs text-muted-foreground">{t('notificationDisabled' as TranslationKey)}</div>
                    )}
                  </div>
                )}
              </>
            )}
            
            {/* 批量項目列表 */}
            {voicedItemsList.length > 0 && (
              <div className="space-y-1.5 mt-2 rounded-lg border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                <div className="flex justify-between items-center p-3 bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/20 border-b">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Barcode className="h-4 w-4 text-orange-500" />
                    Items Detected ({voicedItemsList.length})
                  </h3>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className={`h-7 px-2 text-xs ${listening ? "bg-red-50 text-red-500 border-red-200 animate-pulse" : "hover:bg-orange-50 hover:text-orange-600 border-orange-200"}`}
                      onClick={handleVoiceMode}
                      title={listening ? "Stop Listening" : "Add More with Voice"}
                    >
                      {listening ? 
                        <MicOff className="h-4 w-4 mr-1 text-red-500" /> : 
                        <Mic className="h-4 w-4 mr-1 text-orange-500" />
                      }
                      {listening ? "Stop" : "Add More"}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-1.5 text-xs text-muted-foreground hover:text-destructive"
                      onClick={handleClearAll} 
                    >
                      <Trash2 className="h-4 w-4 mr-0.5" />
                      Clear All
                    </Button>
                  </div>
                </div>

                {/* 添加標題行，説明各欄位的用途 */}
                <div className="flex items-center gap-x-1.5 px-3 py-2 text-xs text-muted-foreground bg-muted/30">
                  <div className="flex-1 min-w-0">Name</div>
                  <div className="w-[60px] text-center">Qty</div>
                  <div className="w-[48px] text-center">Type</div>
                  <div className="w-[60px] text-center">Expire</div>
                  <div className="w-[24px]"></div>
                </div>

                {/* 列表容器 - 微調 */} 
                <div className="space-y-1 max-h-[calc(70vh-220px)] overflow-y-auto p-2"> 
                  {voicedItemsList.map((item, index) => (
                    <div key={item.id} className="flex items-center gap-x-1.5 bg-muted/40 rounded-md p-1.5 hover:bg-orange-50/50 dark:hover:bg-orange-900/10 transition-colors"> 
                      {/* 名稱 - 使用 flex-1 佔據剩餘空間 */} 
                      <div className="flex-1 min-w-0"> 
                        <input
                          type="text"
                          className="w-full border-0 bg-transparent py-0.5 px-1 focus:ring-1 focus:ring-orange-300 rounded text-sm font-medium"
                          value={item.name}
                          onChange={(e) => { 
                              const newList = [...voicedItemsList];
                              newList[index].name = e.target.value;
                              setVoicedItemsList(newList);
                           }}
                        />
                      </div>
                
                      {/* 數量 - 減小按鈕 padding p-0.5 */} 
                      <div className="flex items-center shrink-0 border border-orange-200 dark:border-orange-900/50 rounded-md">
                         <button type="button" className="p-0.5 hover:bg-orange-50 dark:hover:bg-orange-900/30 rounded-l-md" onClick={() => {
                            const newList = [...voicedItemsList];
                            const qty = parseInt(newList[index].quantity) || 1;
                            newList[index].quantity = Math.max(1, qty - 1).toString();
                            setVoicedItemsList(newList);
                          }}><Minus className="h-4 w-4 text-orange-500" /></button>
                         <span className="min-w-[1.1rem] text-center text-xs px-0.5 border-x border-orange-200 dark:border-orange-900/50">{item.quantity}</span>
                         <button type="button" className="p-0.5 hover:bg-orange-50 dark:hover:bg-orange-900/30 rounded-r-md" onClick={() => {
                            const newList = [...voicedItemsList];
                            const qty = parseInt(newList[index].quantity) || 0;
                            newList[index].quantity = (qty + 1).toString();
                            setVoicedItemsList(newList);
                          }}><Plus className="h-4 w-4 text-orange-500" /></button>
                      </div>
                       {/* 類別 - 減小按鈕 padding p-1 */} 
                      <div className="flex items-center shrink-0 space-x-0.5">
                         <button type="button" className={`p-1 rounded-full ${item.category === 'Food' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400' : 'bg-muted/40 hover:bg-orange-50 dark:hover:bg-orange-900/20'}`} onClick={() => {
                            const newList = [...voicedItemsList];
                            newList[index].category = 'Food';
                            setVoicedItemsList(newList);
                          }}><Apple className="h-4 w-4" /></button>
                         <button type="button" className={`p-1 rounded-full ${item.category === 'Household' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400' : 'bg-muted/40 hover:bg-orange-50 dark:hover:bg-orange-900/20'}`} onClick={() => {
                            const newList = [...voicedItemsList];
                            newList[index].category = 'Household';
                            setVoicedItemsList(newList);
                          }}><ShoppingBag className="h-4 w-4" /></button>
                    </div>
                       {/* 過期 - 減小按鈕 padding p-0.5 */} 
                      <div className="flex items-center shrink-0 border border-orange-200 dark:border-orange-900/50 rounded-md">
                         <button type="button" className="p-0.5 hover:bg-orange-50 dark:hover:bg-orange-900/30 rounded-l-md" onClick={() => {
                            const newList = [...voicedItemsList];
                            newList[index].daysUntilExpiry = Math.max(1, newList[index].daysUntilExpiry - 1);
                            setVoicedItemsList(newList);
                          }}><Minus className="h-4 w-4 text-orange-500" /></button>
                         <span className="text-xs min-w-[1.1rem] text-center px-0.5 border-x border-orange-200 dark:border-orange-900/50">{item.daysUntilExpiry}d</span>
                         <button type="button" className="p-0.5 hover:bg-orange-50 dark:hover:bg-orange-900/30 rounded-r-md" onClick={() => {
                            const newList = [...voicedItemsList];
                            newList[index].daysUntilExpiry = newList[index].daysUntilExpiry + 1;
                            setVoicedItemsList(newList);
                          }}><Plus className="h-4 w-4 text-orange-500" /></button>
                  </div>
                       {/* 刪除 - 減小按鈕 padding p-1 */} 
                      <button
                        type="button"
                        className="p-1 hover:bg-red-100 text-muted-foreground hover:text-destructive rounded-md shrink-0 ml-auto"
                        onClick={() => {
                          setVoicedItemsList(voicedItemsList.filter((_, i) => i !== index));
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 底部按鈕 */} 
          <div className="px-3 py-3 border-t bg-gradient-to-b from-gray-50 to-gray-100 dark:from-slate-900 dark:to-slate-950">
            {voicedItemsList.length > 0 ? (
              // Bulk mode: Save All and Cancel
              <div className="flex flex-row justify-between gap-2 mt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenChange(false)}
                  className="h-9 w-9 p-0 transition-all duration-200 hover:bg-white dark:hover:bg-slate-800 shadow-sm hover:shadow border-gray-200 dark:border-gray-700" 
                  title="Cancel"
                >
                  <X className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={saveMultipleItems}
                  disabled={voicedItemsList.some(item => !item.name.trim())}
                  className="bg-gradient-to-br from-primary to-primary-light hover:from-primary-dark hover:to-primary active:scale-98 h-9 shadow-sm hover:shadow transition-all duration-200 touch-feedback" 
                >
                  <Save className="h-4 w-4 mr-1" />
                  Save {voicedItemsList.length} Items
                </Button>
              </div>
            ) : (
              <div className="mx-3 flex justify-between">
                <div className="flex flex-row justify-between w-full">
                  <div>
                    {/* Cancel Button */}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenChange(false)}
                      className="h-10 w-10 p-0 transition-all duration-200 hover:bg-white dark:hover:bg-slate-800 shadow-sm hover:shadow"
                      title="Cancel"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {/* Buttons on the right */}
                  <div className="flex gap-2">
                    {/* Save/Update Button (Primary Action) */}
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleSubmit}
                      className="bg-gradient-to-br from-primary to-primary-light hover:from-primary-dark hover:to-primary active:scale-98 h-10 shadow-sm hover:shadow transition-all duration-200 px-3 touch-feedback"
                      disabled={!itemName.trim()}
                      tabIndex={7}
                    >
                      <Save className="h-4 w-4 mr-1.5" />
                      Save to Dashboard
                    </Button>
                    
                    {/* Save and New Button (always show when not editing) */}
                    {!editItem && (
                      <Button 
                        onClick={handleSaveAndContinue} 
                        variant="secondary" 
                        size="sm"
                        className="h-10 bg-orange-100 hover:bg-orange-200 text-orange-600 border border-orange-200 shadow-sm hover:shadow transition-all duration-200 px-3 touch-feedback"
                      >
                        <PlusCircle className="h-4 w-4 mr-1.5" />
                        Save & Add More
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
           </div>
        </DialogContent>
      </Dialog>
      
      {/* 確認關閉對話框 (使用 Dialog) */} 
      <Dialog 
        open={showCloseConfirm} 
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setShowCloseConfirm(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-md dialog-content-no-close-button max-h-[90vh] w-[95vw]" autoFocus={false}>
          <DialogHeader>
            <DialogTitle>Unsaved Items</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            You have {voicedItemsList.length} unsaved items. Are you sure?
          </DialogDescription>
          <DialogFooter className="gap-2 sm:justify-end pt-4">
            <Button variant="outline" onClick={cancelConfirmation} className="h-9 w-9 p-0" title="Cancel">
              <X className="h-4 w-4" />
            </Button>
            <Button variant="destructive" onClick={confirmCloseAndDiscard}>
              Close and Discard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* 確認清除全部對話框 (使用 Dialog) */} 
      <Dialog
        open={showClearConfirm} 
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setShowClearConfirm(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-md dialog-content-no-close-button max-h-[90vh] w-[95vw]" autoFocus={false}>
          <DialogHeader className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/20 p-4 rounded-t-lg border-b">
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              Clear All Items?
            </DialogTitle>
          </DialogHeader>
          <DialogDescription className="p-4">
            Are you sure you want to clear all {voicedItemsList.length} items?
          </DialogDescription>
          <DialogFooter className="gap-2 sm:justify-end px-4 py-3 border-t bg-gradient-to-b from-gray-50 to-gray-100 dark:from-slate-900 dark:to-slate-950">
            <Button variant="outline" onClick={cancelConfirmation} className="h-9 w-9 p-0 hover:bg-white dark:hover:bg-slate-800 shadow-sm hover:shadow border-gray-200 dark:border-gray-700" title="Cancel">
              <X className="h-4 w-4" />
            </Button>
            <Button variant="destructive" onClick={confirmClearAll} className="shadow-sm hover:shadow transition-all duration-200">
              Clear All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 