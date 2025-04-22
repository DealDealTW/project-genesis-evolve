import React from 'react';
import { Button } from "@/components/ui/button";
import { Apple, ShoppingBag, LayoutGrid } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useTranslation } from '@/utils/translations';

const CategoryFilterMenu: React.FC = () => {
  const { filter, setFilter, language } = useApp();
  const t = useTranslation(language);

  const handleFilter = (categoryFilter: 'All' | 'Food' | 'Household') => {
    // Only change to category filter if we're not in expiry filter mode
    if (filter !== 'Expiring' && filter !== 'Expired') {
      setFilter(categoryFilter);
    } else {
      // If we're in expiry mode, switch back to "All" first
      setFilter(categoryFilter);
    }
  };

  const isCategory = filter === 'All' || filter === 'Food' || filter === 'Household';

  return (
    <div className="flex w-full space-x-2">
      <Button
        variant={isCategory && filter === 'All' ? 'default' : 'outline'}
        className={`flex-1 h-10 px-3 py-2 hover:bg-orange-100 flex items-center justify-center ${
          isCategory && filter === 'All' ? 'bg-orange-500 text-white font-medium shadow-sm' : ''
        }`}
        onClick={() => handleFilter('All')}
      >
        <div className="flex items-center gap-1.5">
          <LayoutGrid className="h-4 w-4" />
          {t('all')}
        </div>
      </Button>
      <Button
        variant={filter === 'Food' ? 'default' : 'outline'}
        className={`flex-1 h-10 px-3 py-2 hover:bg-orange-100 flex items-center justify-center ${
          filter === 'Food' ? 'bg-orange-500 text-white font-medium shadow-sm' : ''
        }`}
        onClick={() => handleFilter('Food')}
      >
        <div className="flex items-center gap-1.5">
          <Apple className="h-4 w-4" />
          {t('food')}
        </div>
      </Button>
      <Button
        variant={filter === 'Household' ? 'default' : 'outline'}
        className={`flex-1 h-10 px-3 py-2 hover:bg-orange-100 flex items-center justify-center ${
          filter === 'Household' ? 'bg-orange-500 text-white font-medium shadow-sm' : ''
        }`}
        onClick={() => handleFilter('Household')}
      >
        <div className="flex items-center gap-1.5">
          <ShoppingBag className="h-4 w-4" />
          {t('household')}
        </div>
      </Button>
    </div>
  );
};

export default CategoryFilterMenu;
