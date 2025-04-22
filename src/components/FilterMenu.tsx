import React from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Filter, ChevronLeft } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useTranslation } from '@/utils/translations';

const FilterMenu: React.FC = () => {
  const { filter, setFilter, language } = useApp();
  const t = useTranslation(language);
  const [open, setOpen] = React.useState(false);

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
          <Button variant="ghost" size="icon">
            <Filter className="h-5 w-5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56" align="end">
          <div className="space-y-1">
            <h3 className="font-medium">{t('filter')}</h3>
            <div className="space-y-1 pt-1">
              <Button
                variant={filter === 'All' ? 'ghost' : 'ghost'}
                className={`w-full justify-start ${filter === 'All' ? 'bg-orange-100 text-orange-600 hover:bg-orange-200' : ''}`}
                onClick={() => setFilter('All')}
              >
                {t('all')}
              </Button>
              <Button
                variant={filter === 'Food' ? 'ghost' : 'ghost'}
                className={`w-full justify-start ${filter === 'Food' ? 'bg-orange-100 text-orange-600 hover:bg-orange-200' : ''}`}
                onClick={() => setFilter('Food')}
              >
                {t('food')}
              </Button>
              <Button
                variant={filter === 'Household' ? 'ghost' : 'ghost'}
                className={`w-full justify-start ${filter === 'Household' ? 'bg-orange-100 text-orange-600 hover:bg-orange-200' : ''}`}
                onClick={() => setFilter('Household')}
              >
                {t('household')}
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default FilterMenu;
