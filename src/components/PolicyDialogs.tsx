import React from 'react';
import { useApp } from '@/contexts/AppContext';
import { useTranslation } from '@/utils/translations';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import PrivacyPolicyContent from './PrivacyPolicyContent';
import TermsOfServiceContent from './TermsOfServiceContent';

interface PolicyDialogsProps {
  privacyOpen: boolean;
  termsOpen: boolean;
  onPrivacyOpenChange: (open: boolean) => void;
  onTermsOpenChange: (open: boolean) => void;
}

const PolicyDialogs: React.FC<PolicyDialogsProps> = ({
  privacyOpen,
  termsOpen,
  onPrivacyOpenChange,
  onTermsOpenChange
}) => {
  const { language } = useApp();
  const t = useTranslation(language);

  return (
    <>
      <Dialog open={privacyOpen} onOpenChange={onPrivacyOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{t('privacyPolicyTitle')}</DialogTitle>
            <DialogDescription className="text-xs opacity-70">
              {t('lastUpdated')}: 2024-05-01
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden mt-2">
            <PrivacyPolicyContent maxHeight="h-[calc(90vh-140px)]" />
          </div>
          <DialogClose asChild>
            <Button size="sm" variant="ghost" className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </DialogClose>
        </DialogContent>
      </Dialog>

      <Dialog open={termsOpen} onOpenChange={onTermsOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{t('termsOfServiceTitle')}</DialogTitle>
            <DialogDescription className="text-xs opacity-70">
              {t('lastUpdated')}: 2024-05-01
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden mt-2">
            <TermsOfServiceContent maxHeight="h-[calc(90vh-140px)]" />
          </div>
          <DialogClose asChild>
            <Button size="sm" variant="ghost" className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </DialogClose>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PolicyDialogs; 