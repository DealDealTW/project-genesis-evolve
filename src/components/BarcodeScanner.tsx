import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Scan, X, Camera } from 'lucide-react';
import { cn } from "@/lib/utils";
import { useTranslation, TranslationKey } from '@/utils/translations';
import { useApp } from '@/contexts/AppContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// 為Capacitor Camera定義一個最小接口
// 實際應用中，您需要導入真正的Capacitor Camera插件
interface BarcodeScanResult {
  text: string;
  format: string;
}

// 這個函數將來自真實插件
async function scanBarcode(): Promise<BarcodeScanResult | null> {
  try {
    // 這是一個模擬，實際上應該調用Capacitor Camera插件
    // 例如：const result = await BarcodeScanner.scan();
    
    // 為模擬返回一些結果
    return {
      text: Math.random().toString().substring(2, 10), // 模擬條形碼
      format: 'QR_CODE'
    };
  } catch (error) {
    console.error('Error scanning barcode:', error);
    return null;
  }
}

interface BarcodeScannerProps {
  onScanComplete: (barcodeResult: string | null) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ 
  onScanComplete, 
  isOpen,
  onOpenChange
}) => {
  const { language } = useApp();
  const t = useTranslation(language);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 當掃描器打開時自動開始掃描
  useEffect(() => {
    if (isOpen) {
      handleStartScan();
    }
  }, [isOpen]);
  
  const handleStartScan = async () => {
    setError(null);
    setIsScanning(true);
    
    try {
      const result = await scanBarcode();
      if (result && result.text) {
        // 先處理掃描結果
        onScanComplete(result.text);
        // 然後關閉掃描器
        onOpenChange(false);
      } else {
        setError(t('scanningFailed'));
      }
    } catch (error) {
      console.error('Error in barcode scanning:', error);
      setError(t('barcodeNotAvailable'));
    } finally {
      setIsScanning(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('cameraInput')}</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center py-4">
          {error && (
            <div className="text-sm text-red-500 mb-4 p-3 bg-red-50 rounded-md border border-red-100 w-full">
              {error}
            </div>
          )}
          
          <div className="text-center w-full py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-solid border-orange-500 border-r-transparent mb-3"></div>
            <p className="text-orange-600 font-medium">{language === 'en' ? 'Camera is active...' : '相機已啟動...'}</p>
            <p className="text-sm text-muted-foreground mt-1">{language === 'en' ? 'Point camera at barcode' : '將相機對準條碼'}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BarcodeScanner; 