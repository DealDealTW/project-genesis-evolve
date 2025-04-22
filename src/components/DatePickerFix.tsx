import React from 'react';
import { format, differenceInDays } from 'date-fns';
import { Input } from "@/components/ui/input";
import { useApp } from '@/contexts/AppContext';
import { formatDateWithUserPreference } from '@/contexts/AppContext';

interface DatePickerFixProps {
  showDateToggle: boolean;
  expiryDate: Date;
  setExpiryDate: (date: Date) => void;
  daysUntilExpiry: number;
  setDaysUntilExpiry: (days: number) => void;
}

const DatePickerFix: React.FC<DatePickerFixProps> = ({
  showDateToggle,
  expiryDate,
  setExpiryDate,
  daysUntilExpiry,
  setDaysUntilExpiry
}) => {
  const { settings } = useApp();

  return (
    <>
{showDateToggle ? (
  <div className="mt-1.5">
    <Input 
      type="date" 
      value={format(expiryDate, 'yyyy-MM-dd')} 
      onChange={(e) => { 
        const date = new Date(e.target.value); 
        if (!isNaN(date.getTime())) { 
          setExpiryDate(date); 
          // 同時更新天數
          const now = new Date();
          now.setHours(0, 0, 0, 0);
          const days = differenceInDays(date, now);
          setDaysUntilExpiry(Math.max(0, days));
        } 
      }} 
      min={format(new Date(), 'yyyy-MM-dd')} 
      className="mb-1 h-9" 
    />
    <p className="text-xs text-muted-foreground">
      {daysUntilExpiry} days remaining ({formatDateWithUserPreference(format(expiryDate, 'yyyy-MM-dd'), settings.dateFormat)})
    </p>
  </div>
      ) : null}
    </>
  );
};

export default DatePickerFix; 