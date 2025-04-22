import React, { useState, useEffect } from 'react';
import 'regenerator-runtime/runtime';
import { SpeechRecognition } from '@capacitor-community/speech-recognition';
import { Capacitor } from '@capacitor/core';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, Mic, MicOff, Save, ShoppingBag, Info, CheckCircle
} from 'lucide-react';
import { ItemCategory, useApp, getExpiryDateFromDays } from '@/contexts/AppContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/utils/translations';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';

// 版本標記
const VERSION = "Native-Google-Speech v8.0 - 2025-04-10";

// 默認值
const DEFAULT_NOTIFY_DAYS_BEFORE = 2;

// 記錄應用程序日誌
const APP_LOGS: {
  timestamp: string;
  type: string;
  text: string;
}[] = [];

// 認可項目的接口
interface RecognizedItem {
  id: string;
  name: string;
  quantity: string;
  category: ItemCategory;
  daysUntilExpiry: number;
  notifyDaysBefore: number;
  isEditing: boolean;
}

// 確定類別的函數
const determineCategory = (name: string): ItemCategory => {
  const foodKeywords = [
    'apple', 'orange', 'banana', 'milk', 'bread', 'eggs', 'cheese', 'meat', 'fish',
    '蘋果', '橙子', '香蕉', '牛奶', '麵包', '雞蛋', '奶酪', '肉', '魚'
  ];
  
  const lowerName = name.toLowerCase();
  // 檢查是否包含食物關鍵詞
  if (foodKeywords.some(keyword => lowerName.includes(keyword))) {
    return 'Food';
  }
  
  // 預設為食物類別
  return 'Food';
};

// 獲取默認過期天數
const getDefaultExpiryDays = (category: ItemCategory, itemName: string): number => {
  const lowerName = itemName.toLowerCase();
  
  // 分類食物
  if (category === 'Food') {
    // 易腐敗的食物: 3天
    if (['milk', 'fish', 'meat', 'seafood', 'salad', '牛奶', '魚', '肉', '海鮮', '沙拉'].some(item => lowerName.includes(item))) {
      return 3;
    }
    // 短期食物: 7天
    else if (['bread', 'fruit', 'vegetable', 'cheese', '麵包', '水果', '蔬菜', '奶酪'].some(item => lowerName.includes(item))) {
      return 7;
    }
    // 中期食物: 14天
    else if (['yogurt', 'juice', 'sauce', 'jam', '優格', '果汁', '醬汁', '果醬'].some(item => lowerName.includes(item))) {
      return 14;
    }
    // 長期食物: 30天
    else {
      return 30;
    }
  }
  // 家庭用品通常有更長的保質期
  else {
    return 90; // 三個月
  }
};

// 處理語音識別結果
const processRawText = (text: string): RecognizedItem[] => {
  if (!text || !text.trim()) return [];
  
  // 記錄原始文本
  console.log('[原始文本]:', text);
  APP_LOGS.push({
    timestamp: new Date().toISOString(),
    type: 'raw-text',
    text: text
  });
  
  // 首先嘗試通過逗號分割
  let items: string[] = [];
  if (text.includes(',') || text.includes('，')) {
    items = text.split(/,|，/)
      .map(item => item.trim())
      .filter(item => item.length > 0);
  } 
  // 然後嘗試通過 "and" 或 "和" 分割
  else if (text.includes(' and ') || text.includes(' 和 ')) {
    items = text.split(/\s+and\s+|\s+和\s+/)
      .map(item => item.trim())
      .filter(item => item.length > 0);
  }
  // 如果沒有找到分隔符，視為單個項目
  else {
    items = [text.trim()];
  }
  
  console.log('[分割結果]:', items);
  
  // 將每個項目轉換為RecognizedItem
  return items.map(item => {
    // 嘗試提取數量，格式如 "2 apples" 或 "2個蘋果"
    const quantityMatch = item.match(/^(\d+)(\s+)?(個|隻|瓶|包|盒|箱|罐|條|份|片|袋|of)?(\s+)?(.+)$/i);
    
    let quantity = 1;
    let name = item;
    
    if (quantityMatch) {
      quantity = parseInt(quantityMatch[1]);
      name = quantityMatch[5] || item;
    }
    
    // 確定類別
    const category = determineCategory(name);
    
    return {
      id: uuidv4(),
      name: name, // 保留原始名稱，不做任何修改
      quantity: quantity.toString(),
      category,
      daysUntilExpiry: getDefaultExpiryDays(category, name),
      notifyDaysBefore: DEFAULT_NOTIFY_DAYS_BEFORE,
      isEditing: false
    };
  });
};

const SpeechInput: React.FC = () => {
  const { addItem, addMultipleItems, settings, language } = useApp();
  const navigate = useNavigate();
  const { toast } = useToast();
  const t = useTranslation(language);

  const [items, setItems] = useState<RecognizedItem[]>([]);
  const [processingText, setProcessingText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [listening, setListening] = useState(false);
  const [showLogInfo, setShowLogInfo] = useState<boolean>(false);
  
  // 檢查設備是否是Android平台
  const isAndroid = Capacitor.getPlatform() === 'android';

  // 日誌追蹤 
  useEffect(() => {
    console.log('[SpeechInput] 初始化 - 平台:', Capacitor.getPlatform());
    console.log('[SpeechInput] 版本:', VERSION);
    
    APP_LOGS.push({
      timestamp: new Date().toISOString(),
      type: 'init',
      text: `平台: ${Capacitor.getPlatform()}, 版本: ${VERSION}`
    });
    
    // 初始化時檢查權限
    const checkPermission = async () => {
      if (!isAndroid) return;
      
      try {
        console.log('[權限] 檢查語音識別權限');
        const { speechRecognition } = await SpeechRecognition.checkPermissions();
        console.log('[權限] 狀態:', speechRecognition);
        
        if (speechRecognition !== 'granted') {
          console.log('[權限] 請求語音識別權限');
          toast({
            title: language === 'en' ? "Microphone Permission Needed" : "需要麥克風權限",
            description: language === 'en' ? "Please allow microphone access for speech recognition" : "請允許使用麥克風以啟用語音識別"
          });
          
          const { speechRecognition: newStatus } = await SpeechRecognition.requestPermissions();
          console.log('[權限] 新狀態:', newStatus);
          
          if (newStatus === 'granted') {
            toast({
              title: language === 'en' ? "Permission Granted" : "權限已授予",
              description: language === 'en' ? "You can now use speech recognition" : "您現在可以使用語音識別功能"
            });
          }
        }
      } catch (error) {
        console.error('[權限] 錯誤:', error);
      }
    };
    
    checkPermission();
    
    return () => {
      // 清理
      SpeechRecognition.removeAllListeners();
    };
  }, []);
  
  // 語音識別事件監聽
  useEffect(() => {
    if (!isAndroid) return;
    
    // 設置結果處理器
    SpeechRecognition.addListener('partialResults', (data: { matches: string[] }) => {
      console.log('[語音] 收到識別結果:', data);
      
      if (data && data.matches && data.matches.length > 0) {
        const text = data.matches[0];
        console.log('[語音] 識別文本:', text);
        
        setProcessingText(text);
        
        APP_LOGS.push({
          timestamp: new Date().toISOString(),
          type: 'speech-result',
          text: text
        });
      }
    });
    
    // 設置狀態監聽器
    SpeechRecognition.addListener('listeningState', (data: { status: 'started' | 'stopped' }) => {
      console.log('[語音] 狀態變更:', data.status);
      
      if (data.status === 'stopped') {
        setListening(false);
        
        // Google語音界面關閉後，自動處理識別結果
        if (processingText.trim()) {
          const newItems = processRawText(processingText);
          if (newItems.length > 0) {
            setItems(prev => [...prev, ...newItems]);
            toast({
              title: language === 'en' ? "Recognition Success" : "識別成功",
              description: language === 'en' 
                ? `Added ${newItems.length} item(s)` 
                : `已添加 ${newItems.length} 個項目`
            });
          }
        }
      } else if (data.status === 'started') {
        setListening(true);
      }
    });
    
    return () => {
      SpeechRecognition.removeAllListeners();
    };
  }, [isAndroid, processingText]);
  
  // 不支持Android平台時顯示提示
  if (!isAndroid) {
    return (
      <div className="p-4 max-w-md mx-auto">
        <div className="flex items-center gap-2 mb-4">
          <Button variant="ghost" onClick={() => navigate('/')} className="p-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">{language === 'en' ? "Batch Voice Input" : "批量語音輸入"}</h1>
        </div>
        <div className="p-4 border rounded bg-red-50 text-red-600">
          {language === 'en' 
            ? "Native speech recognition is only supported on Android devices. Please use this feature on an Android device."
            : "原生語音識別僅支持Android設備。請在Android設備上使用此功能。"
          }
        </div>
      </div>
    );
  }

  // 啟動語音識別
  const handleStartListening = async () => {
    setProcessingText('');
    
    try {
      console.log('[語音] 啟動標準Google語音識別界面');
      
      // 先顯示提示
      toast({
        title: language === 'en' ? "Starting Google Speech" : "正在啟動Google語音",
        description: language === 'en' 
          ? "Standard Google speech recognition interface will open" 
          : "將打開標準的Google語音識別界面"
      });
      
      // 關鍵: 確保popup參數為true以顯示標準Google界面
      await SpeechRecognition.start({
        language: language === 'en' ? 'en-US' : 'zh-CN',
        maxResults: 5,
        popup: true, // 必須為true才能顯示Google標準界面
        partialResults: false, // 不使用部分結果，等待完整識別
        prompt: language === 'en' ? "Say the items you want to add" : "請說出您想要添加的物品"
      });
      
      // 記錄啟動Google界面
      APP_LOGS.push({
        timestamp: new Date().toISOString(),
        type: 'speech-start-google-ui',
        text: '已啟動Google標準語音識別界面'
      });
    } catch (error) {
      console.error('[語音] 啟動Google界面錯誤:', error);
      setListening(false);
      
      toast({
        title: language === 'en' ? "Startup Failed" : "啟動失敗",
        description: language === 'en' ? "Could not open Google speech recognition, please check permissions" : "無法打開Google語音識別，請檢查權限",
        variant: "destructive"
      });
    }
  };

  // 停止語音識別
  const handleStopListening = async () => {
    if (listening) {
      try {
        await SpeechRecognition.stop();
        console.log('[語音] 已停止語音識別');
        
        APP_LOGS.push({
          timestamp: new Date().toISOString(),
          type: 'speech-stop',
          text: '已手動停止語音識別'
        });
      } catch (error) {
        console.error('[語音] 停止語音識別錯誤:', error);
      }
    }
  };

  // 清除所有項目
  const handleClearItems = () => {
    setItems([]);
    setProcessingText('');
    toast({
      title: language === 'en' ? "Cleared" : "已清除",
      description: language === 'en' ? "All items cleared" : "已清除所有項目"
    });
  };

  // 保存所有項目
  const handleSaveItems = () => {
    if (items.length === 0) {
      toast({
        title: language === 'en' ? "No Items" : "沒有項目",
        description: language === 'en' ? "Please add items first" : "請先添加項目",
        variant: "destructive"
      });
      return;
    }

    try {
      // 將項目轉換為可添加的格式
      const itemsToAdd = items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        category: item.category,
        daysUntilExpiry: item.daysUntilExpiry,
        notifyDaysBefore: item.notifyDaysBefore,
        expiryDate: format(getExpiryDateFromDays(item.daysUntilExpiry), 'yyyy-MM-dd'),
      }));
      
      // 批量添加項目
      const numAdded = addMultipleItems(itemsToAdd);
      
      toast({
        title: language === 'en' ? "Success" : "成功",
        description: language === 'en' 
          ? `Successfully added ${numAdded} items to your list` 
          : `已成功添加 ${numAdded} 個項目到清單中`
      });
      
      // 清空並返回
      setItems([]);
      setProcessingText('');
      navigate('/');
    } catch (error) {
      console.error('[保存] 錯誤:', error);
      toast({
        title: language === 'en' ? "Error" : "錯誤",
        description: language === 'en' ? "Error adding items" : "添加項目時發生錯誤",
        variant: "destructive"
      });
    }
  };

  // 刪除單個項目
  const handleDeleteItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  // 渲染日誌信息
  const renderLogInfo = () => {
    if (!showLogInfo) return null;
    
    return (
      <div className="mt-4 p-3 border rounded bg-gray-50 text-xs">
        <h4 className="font-bold mb-1">{language === 'en' ? "Technical Info" : "技術信息"}:</h4>
        <p>版本: {VERSION}</p>
        <p>平台: {Capacitor.getPlatform()}</p>
        <p>語言: {language}</p>
        <p>日誌數量: {APP_LOGS.length}</p>
        <p>最近日誌: {APP_LOGS.length > 0 ? APP_LOGS[APP_LOGS.length - 1].text : 'N/A'}</p>
      </div>
    );
  };

  return (
    <div className="p-4 max-w-md mx-auto pb-20">
      {/* 頂部導航欄 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => navigate('/')} className="p-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">{language === 'en' ? "Batch Voice Input" : "批量語音輸入"}</h1>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setShowLogInfo(!showLogInfo)}
          className="text-muted-foreground"
        >
          <Info className="h-4 w-4" />
        </Button>
      </div>
      
      {/* 技術信息區域 */}
      {renderLogInfo()}
      
      {/* 語音控制區域 */}
      <div className="mt-4 bg-primary-foreground rounded-lg p-4 shadow-sm border">
        <div className="flex flex-col items-center">
          <div className="mb-2 text-center">
            <h2 className="text-lg font-semibold">{language === 'en' ? "Google Speech Recognition" : "Google語音識別"}</h2>
            <p className="text-sm text-muted-foreground">
              {listening 
                ? (language === 'en' ? "Listening... Speak clearly!" : "正在聆聽...請清晰地說話！") 
                : (language === 'en' ? "Tap the microphone to start" : "點擊麥克風開始")}
            </p>
          </div>
          
          <Button
            variant={listening ? "destructive" : "default"}
            size="lg"
            className="rounded-full w-16 h-16 flex items-center justify-center mb-2"
            onClick={listening ? handleStopListening : handleStartListening}
          >
            {listening ? <MicOff className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
          </Button>
          
          {processingText && (
            <div className="mt-2 p-2 bg-muted rounded w-full">
              <p className="text-sm font-medium">{language === 'en' ? "Recognized Text" : "已識別文本"}:</p>
              <p className="text-sm">{processingText}</p>
            </div>
          )}
        </div>
      </div>
      
      {/* 已識別項目列表 */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">
            {language === 'en' ? "Recognized Items" : "已識別項目"} ({items.length})
          </h2>
          {items.length > 0 && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleClearItems}
              className="text-destructive"
            >
              {language === 'en' ? "Clear All" : "清除全部"}
            </Button>
          )}
        </div>
        
        {items.length > 0 ? (
          <div className="space-y-2">
            {items.map(item => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-card rounded-md border">
                <div className="flex-1 mr-2">
                  <div className="flex items-center">
                    <span className="font-medium">{item.name}</span>
                    <span className="ml-2 text-sm bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                      {item.quantity} {language === 'en' ? "units" : "單位"}
                    </span>
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                    {item.category === 'Food' 
                      ? (language === 'en' ? "Food" : "食品") 
                      : (language === 'en' ? "Household" : "家居")} • 
                    {language === 'en' ? "Expires" : "過期"}: {item.daysUntilExpiry} {language === 'en' ? "days" : "天"}
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => handleDeleteItem(item.id)}
                  className="text-destructive h-8 w-8"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18"></path>
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                  </svg>
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center p-6 bg-muted/30 rounded-lg border border-dashed">
            <ShoppingBag className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">
              {language === 'en' ? "No items recognized yet" : "尚未識別任何項目"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {language === 'en' ? "Tap the microphone to start speech recognition" : "點擊麥克風開始語音識別"}
            </p>
          </div>
        )}
      </div>
      
      {/* 底部保存按鈕 */}
      {items.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t">
          <div className="max-w-md mx-auto">
            <Button 
              className="w-full"
              size="lg"
              onClick={handleSaveItems}
            >
              <CheckCircle className="mr-2 h-5 w-5" />
              {language === 'en' 
                ? `Save ${items.length} Items` 
                : `保存 ${items.length} 個項目`}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpeechInput; 