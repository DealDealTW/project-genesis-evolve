import React from 'react';
import { useApp } from '@/contexts/AppContext';
import { useTranslation } from '@/utils/translations';
import { ScrollArea } from "@/components/ui/scroll-area";

interface TermsOfServiceContentProps {
  maxHeight?: string;
}

const TermsOfServiceContent: React.FC<TermsOfServiceContentProps> = ({ 
  maxHeight = "h-[calc(100vh-200px)]"
}) => {
  const { language } = useApp();
  const t = useTranslation(language);
  
  // 將 Markdown 文本中的 ** 格式轉換為 HTML 粗體
  const formatMarkdown = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br />');
  };
  
  return (
    <div className="w-full py-2">
      <h2 className="text-xl font-semibold text-primary mb-4">{t('termsOfServiceTitle')}</h2>
      <ScrollArea className={maxHeight}>
        <div className="pr-4 text-sm">
          <div
            className="text-muted-foreground space-y-4"
            dangerouslySetInnerHTML={{ __html: formatMarkdown(t('termsOfServiceContent')) }}
          />
        </div>
      </ScrollArea>
    </div>
  );
};

export default TermsOfServiceContent; 