import React from 'react';
import { useApp } from '@/contexts/AppContext';
import { useTranslation } from '@/utils/translations';
import { ScrollArea } from "@/components/ui/scroll-area";

interface PrivacyPolicyContentProps {
  maxHeight?: string;
}

const PrivacyPolicyContent: React.FC<PrivacyPolicyContentProps> = ({ 
  maxHeight = "h-[calc(100vh-200px)]"
}) => {
  const { language } = useApp();
  const t = useTranslation(language);
  
  // 新的隱私政策內容，更簡單且直接反映實際情況
  const getPrivacyPolicyContent = () => {
    if (language === 'zh-TW' || language === 'zh-CN') {
      return `
**隱私政策**

在 WhatsLeft，我們非常重視您的隱私。本政策描述了我們如何處理您的個人數據。

**本地數據存儲**

**注意：所有在 WhatsLeft 中輸入的數據僅存儲在您的設備上。我們不會訪問、上傳或存儲您的數據到雲端伺服器。**

您添加到 WhatsLeft 的所有物品資訊，包括名稱、數量、到期日和類別，都只保存在您的設備本地存儲中。我們沒有訪問這些資訊的能力，也沒有將其保存到我們的伺服器上。

**我們不提供的服務**

為了完全透明，我們目前不提供以下功能：
- 雲端數據存儲或備份
- 數據匯出功能
- 家庭共享功能
- 用戶數據分析

**權限使用**

WhatsLeft 可能會請求使用您設備的相機（用於條碼掃描）或麥克風（用於語音輸入）權限。這些權限僅在您使用相關功能時使用，並且所有處理都在本地完成，不會將數據發送到設備外部。

**更新本政策**

我們可能會不時更新本隱私政策。我們將通過在應用中發布新政策來通知您任何變更。

**聯絡我們**

如果您對我們的隱私政策有任何疑問或建議，請通過應用中的「聯絡我們」功能與我們聯繫。
      `;
    } else {
      return `
**Privacy Policy**

At WhatsLeft, we highly value your privacy. This policy describes how we handle your personal data.

**Local Data Storage**

**Note: All data entered in WhatsLeft is stored only on your device. We do not access, upload, or store your data on cloud servers.**

All item information you add to WhatsLeft, including names, quantities, expiry dates, and categories, is saved only in your device's local storage. We have no ability to access this information and do not save it to our servers.

**Services We Don't Provide**

For complete transparency, we currently do not offer:
- Cloud data storage or backup
- Data export functionality
- Family sharing features
- Analytics on user data

**Permission Usage**

WhatsLeft may request permission to use your device's camera (for barcode scanning) or microphone (for voice input). These permissions are only used when you use the related features, and all processing is done locally without sending data outside your device.

**Updates to This Policy**

We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy in the app.

**Contact Us**

If you have any questions or suggestions about our privacy policy, please contact us through the "Contact Support" feature in the app.
      `;
    }
  };
  
  // 格式化 Markdown 文本為 HTML
  const formatMarkdown = (text: string) => {
    // 使用新的自定義隱私政策
    const customPolicy = getPrivacyPolicyContent();
    
    return customPolicy
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br />');
  };
  
  return (
    <div className="w-full py-2">
      <h2 className="text-xl font-semibold text-primary mb-4">{t('privacyPolicyTitle')}</h2>
      <ScrollArea className={maxHeight}>
        <div className="pr-4 text-sm">
          <div
            className="text-muted-foreground space-y-4"
            dangerouslySetInnerHTML={{ __html: formatMarkdown(t('privacyPolicyContent')) }}
          />
        </div>
      </ScrollArea>
    </div>
  );
};

export default PrivacyPolicyContent; 