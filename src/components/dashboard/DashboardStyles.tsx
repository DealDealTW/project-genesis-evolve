import React from 'react';
import { cn } from '@/lib/utils';

// 標準按鈕樣式
interface ButtonProps {
  active?: boolean;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

// 篩選按鈕
export const FilterButton: React.FC<ButtonProps> = ({ 
  active, 
  children, 
  className, 
  onClick 
}) => {
  return (
    <button
      className={cn(
        "button-text h-8 px-3 flex-1 text-sm rounded-lg border",
        active 
          ? "bg-orange-200 text-orange-900 hover:bg-orange-300 border-orange-300" 
          : "bg-white hover:bg-orange-50 hover:text-orange-600 border-gray-200",
        className
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

// 視圖模式按鈕
export const ViewModeButton: React.FC<ButtonProps> = ({ 
  active, 
  children, 
  className, 
  onClick 
}) => {
  return (
    <button
      className={cn(
        "button-text h-8 px-3 text-sm rounded-full border",
        active 
          ? "bg-orange-100 text-orange-600 border-orange-200" 
          : "bg-white border-gray-200",
        className
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

// 區域標題
interface SectionHeaderProps {
  icon?: React.ReactNode;
  title: string;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ 
  icon, 
  title, 
  className 
}) => {
  return (
    <div className={cn("flex items-center mb-2", className)}>
      {icon && <span className="text-orange-500 mr-2">{icon}</span>}
      <h2 className="section-header">{title}</h2>
    </div>
  );
};

// 標籤文字
interface LabelProps {
  children: React.ReactNode;
  className?: string;
}

export const Label: React.FC<LabelProps> = ({ 
  children, 
  className 
}) => {
  return (
    <span className={cn("label-text", className)}>
      {children}
    </span>
  );
};

// 強調標籤
export const AccentLabel: React.FC<LabelProps> = ({ 
  children, 
  className 
}) => {
  return (
    <span className={cn("accent-label", className)}>
      {children}
    </span>
  );
};

// 正文文字
interface BodyTextProps {
  children: React.ReactNode;
  className?: string;
}

export const BodyText: React.FC<BodyTextProps> = ({ 
  children, 
  className 
}) => {
  return (
    <p className={cn("body-text", className)}>
      {children}
    </p>
  );
};

// 導出一些自定義樣式的函數
export const getFilterButtonClass = (isActive: boolean) => cn(
  "button-text h-8 px-3 text-sm",
  isActive 
    ? "bg-orange-200 text-orange-900 hover:bg-orange-300 border-orange-300" 
    : "bg-white hover:bg-orange-50 hover:text-orange-600 border-gray-200"
);

// 卡片標題
export const CardTitle: React.FC<{children: React.ReactNode}> = ({ children }) => (
  <h3 className="section-header">{children}</h3>
);

// 卡片副標題
export const CardSubtitle: React.FC<{children: React.ReactNode}> = ({ children }) => (
  <div className="body-text text-muted-foreground">{children}</div>
);

// 空狀態消息
export const EmptyStateMessage: React.FC<{
  title: string;
  description: string;
  icon?: React.ReactNode;
}> = ({ title, description, icon }) => (
  <div className="flex flex-col items-center justify-center text-center py-8">
    {icon && <div className="text-muted-foreground mb-4">{icon}</div>}
    <h3 className="section-header text-green-600 mb-1">{title}</h3>
    <p className="body-text text-muted-foreground">{description}</p>
  </div>
);

export default {
  FilterButton,
  ViewModeButton,
  SectionHeader,
  Label,
  AccentLabel,
  BodyText,
  CardTitle,
  CardSubtitle,
  EmptyStateMessage,
  getFilterButtonClass
}; 