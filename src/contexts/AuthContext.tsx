// This file is intentionally left empty to disable duplicate Supabase auth state management.

import React from 'react';

// 為了保持與 App.tsx 的兼容性，建立一個空的 AuthProvider 代理
// 實際的認證功能已經移至 AppContext 中

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 直接返回子組件，不添加任何狀態或邏輯
  // 所有認證功能現在位於 AppContext 中
  return <>{children}</>;
};

// 如果有需要，可以根據具體情況添加其他的兼容性導出
// export const useAuth = useApp; // 不建議這樣做，可能會引入循環依賴