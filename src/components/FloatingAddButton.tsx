import React from 'react';
import { Button } from "@/components/ui/button";
import { PlusIcon } from 'lucide-react';
import { useTranslation } from '@/utils/translations';
import { useApp } from '@/contexts/AppContext';

interface FloatingAddButtonProps {
  onManualAdd: () => void;
  onVoiceAdd: () => void;
  onBarcodeAdd: () => void;
  isVisible: boolean;
}

const FloatingAddButton: React.FC<FloatingAddButtonProps> = ({
  onManualAdd,
  isVisible
}) => {
  const { language } = useApp();
  const t = useTranslation(language);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-[85px] left-1/2 transform -translate-x-1/2 z-[51] transition-opacity duration-300">
      <Button
        size="icon"
        className="h-16 w-16 rounded-full shadow-xl bg-gradient-to-br from-primary to-primary-light hover:from-primary-dark hover:to-primary active:scale-95 transition-all duration-200 flex items-center justify-center animate-pulse-slow"
        aria-label={t('addItem')}
        onClick={onManualAdd}
      >
        <PlusIcon className="h-8 w-8 text-white" />
      </Button>
    </div>
  );
};

export default FloatingAddButton; 