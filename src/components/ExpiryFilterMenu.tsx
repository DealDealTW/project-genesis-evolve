import React from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { AlertTriangle, AlertCircle, LayoutGrid, Filter, Check, ChevronLeft } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useTranslation } from '@/utils/translations';

const ExpiryFilterMenu: React.FC = () => {
  const { filter, setFilter, language } = useApp();
  const t = useTranslation(language);
  const [open, setOpen] = React.useState(false);
  
  // We only handle expiry filters here
  const handleFilterChange = (newFilter: 'All' | 'Expiring' | 'Expired') => {
    setFilter(newFilter);
  };
  
  // Check if filter is related to expiry
  const isExpiryFilter = (filter === 'All' || filter === 'Expiring' || filter === 'Expired');
  
  return (
    <div className="flex items-center gap-1 relative">
      {open && (
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => setOpen(false)}
          className="h-8 w-8 p-0 absolute -left-10 top-0 z-50 bg-white dark:bg-slate-900 shadow-sm border border-orange-200 dark:border-orange-800"
        >
          <ChevronLeft className="h-4 w-4 text-orange-600 dark:text-orange-400" />
        </Button>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="hover:bg-muted/50">
            <Filter className="h-5 w-5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-0 rounded-xl overflow-hidden" align="end">
          <div className="bg-orange-50 p-3 border-b border-orange-100">
            <h3 className="font-bold text-orange-600">{t('expiryFilter')}</h3>
          </div>
          <div className="p-2">
            <Button
              className={`w-full justify-start font-normal mb-1 rounded-lg ${filter === 'Expiring' ? 'bg-orange-100 text-orange-600 hover:bg-orange-200' : 'hover:bg-muted/50'}`}
              variant="ghost"
              onClick={() => handleFilterChange('Expiring')}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  {t('expiring')}
                </div>
                {filter === 'Expiring' && <Check className="h-4 w-4 text-orange-600" />}
              </div>
            </Button>
            <Button
              className={`w-full justify-start font-normal mb-1 rounded-lg ${filter === 'Expired' ? 'bg-orange-100 text-orange-600 hover:bg-orange-200' : 'hover:bg-muted/50'}`}
              variant="ghost"
              onClick={() => handleFilterChange('Expired')}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {t('expired')}
                </div>
                {filter === 'Expired' && <Check className="h-4 w-4 text-orange-600" />}
              </div>
            </Button>
            <Button
              className={`w-full justify-start font-normal rounded-lg ${filter === 'All' ? 'bg-orange-100 text-orange-600 hover:bg-orange-200' : 'hover:bg-muted/50'}`}
              variant="ghost"
              onClick={() => handleFilterChange('All')}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <LayoutGrid className="h-4 w-4" />
                  {t('showAll')}
                </div>
                {filter === 'All' && <Check className="h-4 w-4 text-orange-600" />}
              </div>
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default ExpiryFilterMenu;
