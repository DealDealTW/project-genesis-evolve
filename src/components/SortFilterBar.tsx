import React from 'react';
import { 
  Tabs, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ArrowUpDownIcon } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useTranslation } from '@/utils/translations';
import { cn } from "@/lib/utils";

const SortFilterBar: React.FC = () => {
  const { filter, setFilter, sort, setSort, language } = useApp();
  const t = useTranslation(language);

  return (
    <div className="flex justify-between items-center mb-4 px-1">
      <Tabs 
        value={filter} 
        onValueChange={(value) => setFilter(value as any)}
        className="w-full"
      >
        <TabsList className="grid grid-cols-3 w-full bg-muted/50">
          <TabsTrigger 
            value="All"
            className={cn(
              "data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow",
              "transition-all duration-200"
            )}
          >
            {t('all')}
          </TabsTrigger>
          <TabsTrigger 
            value="Food"
            className={cn(
              "data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow",
              "transition-all duration-200"
            )}
          >
            {t('food')}
          </TabsTrigger>
          <TabsTrigger 
            value="Household"
            className={cn(
              "data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow",
              "transition-all duration-200"
            )}
          >
            {t('household')}
          </TabsTrigger>
        </TabsList>
      </Tabs>
      
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="ml-2">
            <ArrowUpDownIcon className="h-5 w-5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56" align="end">
          <div className="space-y-1">
            <h3 className="font-medium">{t('sortBy')}</h3>
            <div className="space-y-1 pt-1">
              <Button
                variant={sort === 'name' ? 'ghost' : 'ghost'}
                className={`w-full justify-start ${sort === 'name' ? '!bg-orange-500 !text-white hover:bg-orange-600' : ''}`}
                onClick={() => setSort('name')}
              >
                {t('name')}
              </Button>
              <Button
                variant={sort === 'expiry' ? 'ghost' : 'ghost'}
                className={`w-full justify-start ${sort === 'expiry' ? '!bg-orange-500 !text-white hover:bg-orange-600' : ''}`}
                onClick={() => setSort('expiry')}
              >
                {t('expiryDate')}
              </Button>
              <Button
                variant={sort === 'quantity' ? 'ghost' : 'ghost'}
                className={`w-full justify-start ${sort === 'quantity' ? '!bg-orange-500 !text-white hover:bg-orange-600' : ''}`}
                onClick={() => setSort('quantity')}
              >
                {t('quantity')}
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default SortFilterBar;
