import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Session, User as SupabaseUser, Provider } from '@supabase/supabase-js';
import { addDays, differenceInDays, parseISO, format } from 'date-fns';
import { v4 as uuid } from 'uuid';
import { useToast } from "../hooks/use-toast";
import { categorySubcategories, determineSubcategory } from '../utils/categoryConfig';
import { supabase } from '../lib/supabaseClient';

export type ItemCategory = 'All' | 'Food' | 'Household';

export const DEFAULT_EXPIRY_DAYS = 7;
export const DEFAULT_NOTIFY_DAYS = 3;

export interface User {
  id?: string;
  username?: string;
  email?: string;
}

export type FilterType = 'All' | 'Food' | 'Household' | 'Expiring' | 'Expired';

export interface Item {
  id: string;
  name: string;
  quantity: string;
  category: ItemCategory;
  subcategory?: string;
  expiryDate: string;
  daysUntilExpiry: number;
  dateAdded: string;
  notifyDaysBefore: number;
  used?: boolean;
  dateUsed?: string;
  deleted?: boolean;
  dateDeleted?: string;
  image?: string | null;
  timesRepurchased?: number;
  lastRepurchased?: string;
}

export interface ShopItem {
  id: string;
  name: string;
  quantity: string;
  category: ItemCategory;
  subcategory?: string;
  dateAdded: string;
  checked: boolean;
  originItemId?: string;
}

export type DateFormatOption = 'yyyy-MM-dd' | 'MM/dd/yyyy' | 'dd/MM/yyyy';
export type ViewModeOption = 'grid' | 'compact';

export interface AppSettings {
  dateFormat: DateFormatOption;
  defaultViewMode: ViewModeOption;
  defaultCategory: ItemCategory;
  familySize?: number;
  autoAdjustFamilySize?: boolean;
  subcategoryMultipliers?: Record<string, number>;
  notificationsEnabled: boolean;
  advancedQuantitySettings?: boolean;
  defaultNotifyDaysBefore: number;
}

export interface UsageHistoryEntry {
  id: string;
  itemId: string;
  itemName: string;
  type: 'used' | 'wasted';
  quantity: number;
  timestamp: string;
  category?: ItemCategory;
}

interface AppContextType {
  session: Session | null;
  user: SupabaseUser | null;
  authLoading: boolean;
  logout: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<boolean>;
  signInWithPassword: (email: string, password: string) => Promise<boolean>;
  signInWithProvider: (provider: Provider) => Promise<void>;
  resetPassword: (email: string) => Promise<boolean>;
  updatePassword: (newPassword: string) => Promise<boolean>;
  deleteAccount: () => Promise<boolean>;

  items: Item[];
  addItem: (item: Omit<Item, 'id' | 'daysUntilExpiry' | 'dateAdded'>) => void;
  addMultipleItems: (newItems: Omit<Item, 'id' | 'daysUntilExpiry' | 'dateAdded'>[]) => number;
  updateItem: (id: string, item: Partial<Omit<Item, 'id' | 'dateAdded'>>) => void;
  deleteItem: (id: string) => void;
  markItemAsUsed: (id: string) => void;
  filter: FilterType;
  setFilter: (filter: FilterType) => void;
  sort: 'name' | 'expiry' | 'quantity';
  setSort: (sort: 'name' | 'expiry' | 'quantity') => void;
  darkMode: boolean;
  setDarkMode: (darkMode: boolean) => void;
  language: 'en' | 'zh-TW' | 'zh-CN';
  setLanguage: (language: 'en' | 'zh-TW' | 'zh-CN') => void;
  selectedItem: Item | null;
  setSelectedItem: (item: Item | null) => void;
  settings: AppSettings;
  updateSettings: (settings: Partial<AppSettings>) => void;
  exportData: () => string;
  importData: (jsonData: string) => boolean;
  expiringItemsCount: number;
  viewMode: 'grid' | 'compact';
  setViewMode: (mode: 'grid' | 'compact') => void;
  urgentFilter: 'all' | 'expiring' | 'expired';
  setUrgentFilter: (filter: 'all' | 'expiring' | 'expired') => void;
  showTutorial: boolean;
  setShowTutorial: (show: boolean) => void;
  shopItems: ShopItem[];
  addToShopList: (item: Omit<ShopItem, 'id' | 'dateAdded' | 'checked'>) => void;
  updateShopItem: (id: string, item: Partial<ShopItem>) => void;
  removeFromShopList: (id: string) => void;
  toggleShopItemCheck: (id: string) => void;
  clearCheckedShopItems: () => void;
  moveShopItemToDashboard: (shopItemId: string) => boolean;
  moveMultipleShopItemsToDashboard: (shopItemIds: string[]) => number;
  recordPartialUsage: (itemId: string, quantityUsed: number) => void;
  recordPartialWaste: (itemId: string, quantityWasted: number) => void;
  usageHistory: UsageHistoryEntry[];
  categorySubcategories: typeof categorySubcategories;
  dashboardGroupBySubcategory: boolean;
  setDashboardGroupBySubcategory: (value: boolean) => void;
  shopListGroupBySubcategory: boolean;
  setShopListGroupBySubcategory: (value: boolean) => void;

  currentUser?: {
    isPremium?: boolean;
  };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export const calculateDaysUntilExpiry = (expiryDate: string): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  try {
    const expiry = parseISO(expiryDate);
    if (isNaN(expiry.getTime())) {
      console.warn(`Invalid date format for expiryDate: ${expiryDate}`);
      return 9999;
    }
    return differenceInDays(expiry, today);
  } catch (error) {
    console.error(`Error parsing date: ${expiryDate}`, error);
    return 9999;
  }
};

export const getExpiryDateFromDays = (days: number | string): string => {
  const daysNum = typeof days === 'string' ? parseInt(days) || 0 : days;
  const date = addDays(new Date(), daysNum);
  return format(date, 'yyyy-MM-dd');
};

export const formatDateWithUserPreference = (dateString: string, dateFormat: DateFormatOption): string => {
  try {
    const date = parseISO(dateString);
    return format(date, dateFormat);
  } catch (error) {
    console.error(`Error formatting date: ${dateString}`, error);
    return dateString;
  }
};

const getPreferredViewMode = (): ViewModeOption => {
  try {
    const savedViewMode = localStorage.getItem('preferredViewMode') as ViewModeOption;
    return (savedViewMode === 'grid' || savedViewMode === 'compact') ? savedViewMode : 'grid';
  } catch (error) {
    return 'grid';
  }
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Supabase Auth State
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [items, setItems] = useState<Item[]>(() => {
    const savedItems = localStorage.getItem('whatsleftItems');
    return savedItems ? JSON.parse(savedItems) : [];
  });
  
  const [usageHistory, setUsageHistory] = useState<UsageHistoryEntry[]>(() => {
    const savedHistory = localStorage.getItem('whatsleftUsageHistory');
    return savedHistory ? JSON.parse(savedHistory) : [];
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    const savedSettings = localStorage.getItem('whatsleftSettings');
    return savedSettings ? JSON.parse(savedSettings) : {
      dateFormat: 'yyyy-MM-dd',
      defaultViewMode: 'grid',
      defaultCategory: 'Food',
      familySize: 2,
      autoAdjustFamilySize: false,
      subcategoryMultipliers: {},
      notificationsEnabled: true,
      advancedQuantitySettings: false,
      defaultNotifyDaysBefore: DEFAULT_NOTIFY_DAYS
    };
  });

  const [shopItems, setShopItems] = useState<ShopItem[]>(() => {
    const savedShopItems = localStorage.getItem('whatsleftShopItems');
    return savedShopItems ? JSON.parse(savedShopItems) : [];
  });

  const [sort, setSort] = useState<'name' | 'expiry' | 'quantity'>(() => {
    const savedSort = localStorage.getItem('sort') as 'name' | 'expiry' | 'quantity';
    return savedSort || 'expiry';
  });

  const [filter, setFilter] = useState<FilterType>(() => {
    return 'All';
  });
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const savedDarkMode = localStorage.getItem('whatsleftDarkMode');
    return savedDarkMode ? JSON.parse(savedDarkMode) : false;
  });
  const [language, setLanguage] = useState<'en' | 'zh-TW' | 'zh-CN'>(() => {
    const savedLanguage = localStorage.getItem('whatsleftLanguage');
    return savedLanguage ? JSON.parse(savedLanguage) : 'en';
  });
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'compact'>(() => {
    const savedViewMode = localStorage.getItem('whatsleftViewMode');
    return (savedViewMode === 'grid' || savedViewMode === 'compact') ? savedViewMode : 'grid';
  });
  const [urgentFilter, setUrgentFilter] = useState<'all' | 'expiring' | 'expired'>(() => {
    const savedUrgentFilter = localStorage.getItem('whatsleftUrgentFilter');
    return savedUrgentFilter ? JSON.parse(savedUrgentFilter) : 'all';
  });

  const { toast } = useToast();

  const [dashboardGroupBySubcategory, setDashboardGroupBySubcategoryState] = useState<boolean>(() => {
    const saved = localStorage.getItem('dashboardGroupBySubcategory');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [shopListGroupBySubcategory, setShopListGroupBySubcategoryState] = useState<boolean>(() => {
    const saved = localStorage.getItem('shopListGroupBySubcategory');
    return saved !== null ? JSON.parse(saved) : false;
  });

  const [expiringItemsCount, setExpiringItemsCount] = useState<number>(0);

  const [showTutorial, setShowTutorial] = useState<boolean>(false);

  useEffect(() => {
    setAuthLoading(true);
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        console.log("Supabase auth event:", _event, session);
        const currentPath = window.location.pathname;
        
        if (_event === 'INITIAL_SESSION') {
          setSession(session);
          setUser(session?.user ?? null);
        } else if (_event === 'SIGNED_IN') {
          setSession(session);
          setUser(session?.user ?? null);
          if (currentPath !== '/settings') {
            console.log("User signed in, redirecting (if not on /settings).");
            setShowTutorial(false);
          }
        } else if (_event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          console.log("User signed out.");
        } else if (_event === 'PASSWORD_RECOVERY') {
        } else if (_event === 'TOKEN_REFRESHED') {
        } else if (_event === 'USER_UPDATED') {
          setUser(session?.user ?? null);
        }
        
        setAuthLoading(false);
      }
    );

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('whatsleftItems', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem('whatsleftDarkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('whatsleftLanguage', JSON.stringify(language));
  }, [language]);
  
  useEffect(() => {
    localStorage.setItem('whatsleftSettings', JSON.stringify(settings));
    
    if (!localStorage.getItem('whatsleftViewMode')) {
      setViewMode(settings.defaultViewMode);
    }
    
    if (!localStorage.getItem('whatsleftFilter')) {
      setFilter(settings.defaultCategory);
    }
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('whatsleftFilter', JSON.stringify(filter));
  }, [filter]);

  useEffect(() => {
    localStorage.setItem('whatsleftViewMode', JSON.stringify(viewMode));
  }, [viewMode]);

  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const count = items.filter(item => {
      if (item.used) return false;
      try {
        const expiry = parseISO(item.expiryDate);
        if (isNaN(expiry.getTime())) return false;
        const daysLeft = differenceInDays(expiry, today);
        return daysLeft <= DEFAULT_NOTIFY_DAYS || daysLeft < 0;
      } catch {
        return false;
      }
    }).length;
    
    setExpiringItemsCount(count);
    console.log("Updated expiring items count:", count);
  }, [items]);

  useEffect(() => {
    localStorage.setItem('whatsleftUsageHistory', JSON.stringify(usageHistory));
  }, [usageHistory]);

  useEffect(() => {
    localStorage.setItem('dashboardGroupBySubcategory', JSON.stringify(dashboardGroupBySubcategory));
  }, [dashboardGroupBySubcategory]);

  useEffect(() => {
    localStorage.setItem('shopListGroupBySubcategory', JSON.stringify(shopListGroupBySubcategory));
  }, [shopListGroupBySubcategory]);

  const setDashboardGroupBySubcategory = (value: boolean) => {
    setDashboardGroupBySubcategoryState(value);
  };
  const setShopListGroupBySubcategory = (value: boolean) => {
    setShopListGroupBySubcategoryState(value);
  };

  const addItem = (newItemData: Omit<Item, 'id' | 'daysUntilExpiry' | 'dateAdded'>) => {
    const today = new Date();
    const newItem: Item = {
      id: uuid(),
      ...newItemData,
      daysUntilExpiry: calculateDaysUntilExpiry(newItemData.expiryDate),
      dateAdded: today.toISOString(),
      notifyDaysBefore: newItemData.notifyDaysBefore !== undefined ? 
        newItemData.notifyDaysBefore : 
        settings.defaultNotifyDaysBefore
    };
    setItems(prevItems => [...prevItems, newItem]);
  };

  const addMultipleItems = (newItemsData: Omit<Item, 'id' | 'daysUntilExpiry' | 'dateAdded'>[]): number => {
    const today = new Date();
    const itemsToAdd: Item[] = newItemsData.map(itemData => ({
        id: uuid(),
      ...itemData,
      daysUntilExpiry: calculateDaysUntilExpiry(itemData.expiryDate),
      dateAdded: today.toISOString(),
      notifyDaysBefore: itemData.notifyDaysBefore !== undefined ? 
        itemData.notifyDaysBefore : 
        settings.defaultNotifyDaysBefore
    }));
    setItems(prevItems => [...prevItems, ...itemsToAdd]);
    return itemsToAdd.length;
  };

  const updateItem = (id: string, itemUpdate: Partial<Omit<Item, 'id' | 'dateAdded'>>) => {
    setItems(prevItems => 
      prevItems.map(item => {
        if (item.id === id) {
          const updatedItem = { ...item, ...itemUpdate };
          if (itemUpdate.expiryDate) {
            updatedItem.daysUntilExpiry = calculateDaysUntilExpiry(itemUpdate.expiryDate);
          }
          return updatedItem;
        } 
        return item;
      })
    );
  };

  const deleteItem = (id: string) => {
    setItems(prevItems => prevItems.filter(item => item.id !== id));
  };

  const markItemAsUsed = (id: string) => {
    let markedItem: Item | null = null;
    setItems(prevItems => 
      prevItems.map(item => {
        if (item.id === id) {
          markedItem = { 
            ...item, 
            used: true, 
            dateUsed: new Date().toISOString(),
            quantity: '0'
          };
          console.log(`[markItemAsUsed] Marking ${item.name} as used and setting quantity to 0.`);
          return markedItem;
        }
        return item;
      })
    );
    
    const originalItem = items.find(i => i.id === id);
    if (originalItem) {
      const historyEntry: UsageHistoryEntry = {
        id: uuid(),
        itemId: id,
        itemName: originalItem.name,
        type: 'used',
        quantity: parseInt(originalItem.quantity) || 1,
        timestamp: new Date().toISOString(),
        category: originalItem.category,
      };
      setUsageHistory(prev => [...prev, historyEntry]);
    } else {
      console.warn(`[markItemAsUsed] Original item with id ${id} not found for history logging.`);
    }
  };

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prevSettings => ({ ...prevSettings, ...newSettings }));
  };
  
  const exportData = (): string => {
    const dataToExport = {
      items,
      settings,
      shopItems,
      usageHistory,
      dashboardGroupBySubcategory,
      shopListGroupBySubcategory,
    };
    return JSON.stringify(dataToExport, null, 2);
  };

  const importData = (jsonData: string): boolean => {
    try {
      const data = JSON.parse(jsonData);
      if (data.items) setItems(data.items);
      if (data.settings) setSettings(prev => ({ ...prev, ...data.settings }));
      if (data.shopItems) setShopItems(data.shopItems);
      if (data.usageHistory) setUsageHistory(data.usageHistory);
      if (data.dashboardGroupBySubcategory !== undefined) setDashboardGroupBySubcategoryState(data.dashboardGroupBySubcategory);
      if (data.shopListGroupBySubcategory !== undefined) setShopListGroupBySubcategoryState(data.shopListGroupBySubcategory);
      if (data.settings?.defaultCategory) setFilter(data.settings.defaultCategory);
      if (data.settings?.defaultViewMode) setViewMode(data.settings.defaultViewMode);

      toast({ title: 'Success', description: 'Data imported successfully.' });
      return true;
    } catch (error) {
      console.error("Import failed:", error);
      toast({ title: 'Error', description: 'Failed to import data. Invalid file format.', variant: 'destructive' });
      return false;
    }
  };

  const addToShopList = (newItemData: Omit<ShopItem, 'id' | 'dateAdded' | 'checked'>) => {
    const newShopItem: ShopItem = {
      id: uuid(),
      ...newItemData,
      dateAdded: new Date().toISOString(),
      checked: false,
    };
    setShopItems(prevItems => [...prevItems, newShopItem]);
  };

  const updateShopItem = (id: string, itemUpdate: Partial<Omit<ShopItem, 'id' | 'dateAdded'>>) => {
    setShopItems(prevItems =>
      prevItems.map(item => (item.id === id ? { ...item, ...itemUpdate } : item))
    );
  };

  const removeFromShopList = (id: string) => {
    setShopItems(prevItems => prevItems.filter(item => item.id !== id));
  };
  
  const toggleShopItemCheck = (id: string) => {
    setShopItems(prevItems =>
      prevItems.map(item =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };
  
  const clearCheckedShopItems = () => {
    setShopItems(prevItems => prevItems.filter(item => !item.checked));
  };
  
  const moveShopItemToDashboard = (shopItemId: string): boolean => {
    const shopItem = shopItems.find(item => item.id === shopItemId);
    if (!shopItem) return false;
    
    const categoryForSubcategoryLookup: 'Food' | 'Household' = shopItem.category === 'All' 
      ? 'Food'
      : shopItem.category;

    const defaultExpiryDays = determineSubcategory(shopItem.name, categoryForSubcategoryLookup).defaultExpiryDays || DEFAULT_EXPIRY_DAYS;
    const expiryDate = getExpiryDateFromDays(defaultExpiryDays);

    const newItem: Omit<Item, 'id' | 'daysUntilExpiry' | 'dateAdded'> = {
      name: shopItem.name,
      quantity: shopItem.quantity,
      category: shopItem.category,
      subcategory: shopItem.subcategory,
      expiryDate: expiryDate,
      notifyDaysBefore: settings.defaultNotifyDaysBefore,
    };
    addItem(newItem);
    removeFromShopList(shopItemId);
    return true;
  };

  const moveMultipleShopItemsToDashboard = (shopItemIds: string[]): number => {
    let count = 0;
    shopItemIds.forEach(id => {
      if (moveShopItemToDashboard(id)) {
        count++;
      }
    });
    return count;
  };

  const recordPartialUsage = (itemId: string, quantityUsed: number) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    const currentQuantity = parseInt(item.quantity) || 0;
    if (quantityUsed >= currentQuantity) {
      markItemAsUsed(itemId);
    } else {
      updateItem(itemId, { quantity: (currentQuantity - quantityUsed).toString() });
      const historyEntry: UsageHistoryEntry = {
        id: uuid(),
        itemId: itemId,
        itemName: item.name,
        type: 'used',
        quantity: quantityUsed,
        timestamp: new Date().toISOString(),
        category: item.category,
      };
      setUsageHistory(prev => [...prev, historyEntry]);
    }
  };

  const recordPartialWaste = (itemId: string, quantityWasted: number) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    const currentQuantity = parseInt(item.quantity) || 0;
    const actualWastedQuantity = Math.min(quantityWasted, currentQuantity);
    
    const historyEntry: UsageHistoryEntry = {
      id: uuid(),
      itemId: itemId,
      itemName: item.name,
      type: 'wasted',
      quantity: actualWastedQuantity,
      timestamp: new Date().toISOString(),
      category: item.category,
    };

    if (quantityWasted >= currentQuantity) {
      updateItem(itemId, { quantity: '0' });
    } else {
      const newQuantity = currentQuantity - quantityWasted;
      updateItem(itemId, { quantity: newQuantity.toString() });
    }
    
    setUsageHistory(prev => [...prev, historyEntry]);
  };

  const logout = async () => {
    setAuthLoading(true);
    try {
      console.log('[AppContext] logout called');
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
      setAuthLoading(false);
    } catch (error: any) {
      console.error("Unexpected error during logout:", error);
      toast({ title: 'Logout Error', description: error.message || 'Unexpected error during logout.', variant: 'destructive' });
      setSession(null);
      setUser(null);
      setAuthLoading(false);
    }
  };

  const signUp = async (email: string, password: string): Promise<boolean> => {
    setAuthLoading(true);
    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    });
    setAuthLoading(false);

    if (error) {
      console.error("Sign up error:", error);
      toast({ title: '註冊失敗', description: error.message, variant: 'destructive' });
      return false;
    }
    
    if (data.user && !data.session) {
      toast({ 
        title: '註冊成功', 
        description: '請檢查您的電子郵件並點擊確認連結以完成註冊。您在確認前將無法登入。',
        duration: 6000
      });
    } else {
      toast({ title: '註冊成功', description: '您已成功註冊並登入！' });
    }
    return true;
  };

  const signInWithPassword = async (email: string, password: string): Promise<boolean> => {
    setAuthLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setAuthLoading(false);

    if (error) {
      console.error("Sign in error:", error);
      toast({ title: 'Sign In Error', description: error.message, variant: 'destructive' });
      return false;
    }
    toast({ title: 'Sign In Successful', description: 'Welcome back!' });
    return true;
  };

  const signInWithProvider = async (provider: Provider) => {
    setAuthLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: provider,
    });
    setAuthLoading(false);
    if (error) {
      console.error(`Sign in with ${provider} error:`, error);
      toast({ title: `Sign In Error`, description: error.message, variant: 'destructive' });
    }
  };

  const updatePassword = async (newPassword: string): Promise<boolean> => {
    setAuthLoading(true);
    
    try {
      if (!session || !user) {
        toast({ title: '錯誤', description: '您需要先登入才能更改密碼', variant: 'destructive' });
        setAuthLoading(false);
        return false;
      }
      
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) {
        console.error("Update password error:", error);
        toast({ title: '密碼更新失敗', description: error.message, variant: 'destructive' });
        setAuthLoading(false);
        return false;
      }
      
      toast({ title: '密碼已更新', description: '您的密碼已成功更新', });
      setAuthLoading(false);
      return true;
    } catch (error) {
      console.error("Update password error:", error);
      toast({ title: '密碼更新失敗', description: '發生未知錯誤', variant: 'destructive' });
      setAuthLoading(false);
      return false;
    }
  };

  const resetPassword = async (email: string): Promise<boolean> => {
    setAuthLoading(true);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });
      
      if (error) {
        console.error("Reset password error:", error);
        toast({ title: '密碼重設失敗', description: error.message, variant: 'destructive' });
        setAuthLoading(false);
        return false;
      }
      
      toast({ title: '重設郵件已發送', description: '請檢查您的電子郵件獲取密碼重設連結', });
      setAuthLoading(false);
      return true;
    } catch (error) {
      console.error("Reset password error:", error);
      toast({ title: '密碼重設失敗', description: '發生未知錯誤', variant: 'destructive' });
      setAuthLoading(false);
      return false;
    }
  };

  const deleteAccount = async (): Promise<boolean> => {
    setAuthLoading(true);
    
    try {
      if (!session || !user) {
        toast({ title: '錯誤', description: '您需要先登入才能刪除帳號', variant: 'destructive' });
        setAuthLoading(false);
        return false;
      }
      
      const { error: functionError } = await supabase.functions.invoke('delete-user');
      
      if (functionError) {
        console.error("Error calling delete-user function:", functionError);
        toast({
          title: '帳號刪除失敗',
          description: functionError.message || '無法調用刪除功能，請稍後再試或聯繫管理員。',
          variant: 'destructive' 
        });
        setAuthLoading(false);
        return false;
      }
      
      toast({ title: '帳號已刪除', description: '您的帳號已成功刪除，您將被登出。', });
      await logout();
      setAuthLoading(false);
      return true;
    } catch (error) {
      console.error("Unexpected error during delete account process:", error);
      toast({ title: '帳號刪除失敗', description: '發生未知錯誤', variant: 'destructive' });
      setAuthLoading(false);
      return false;
    }
  };

  return (
    <AppContext.Provider
      value={{
        session,
        user,
        authLoading,
        logout,
        signUp,
        signInWithPassword,
        signInWithProvider,
        resetPassword,
        updatePassword,
        deleteAccount,

        items,
        addItem,
        addMultipleItems,
        updateItem,
        deleteItem,
        markItemAsUsed,
        filter,
        setFilter,
        sort,
        setSort,
        darkMode,
        setDarkMode,
        language,
        setLanguage,
        selectedItem,
        setSelectedItem,
        settings,
        updateSettings,
        exportData,
        importData,
        expiringItemsCount,
        viewMode,
        setViewMode,
        urgentFilter,
        setUrgentFilter,
        showTutorial,
        setShowTutorial,
        shopItems,
        addToShopList,
        updateShopItem,
        removeFromShopList,
        toggleShopItemCheck,
        clearCheckedShopItems,
        moveShopItemToDashboard,
        moveMultipleShopItemsToDashboard,
        recordPartialUsage,
        recordPartialWaste,
        usageHistory,
        categorySubcategories,
        dashboardGroupBySubcategory,
        setDashboardGroupBySubcategory,
        shopListGroupBySubcategory,
        setShopListGroupBySubcategory,

        currentUser: {
          isPremium: false,
        },
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
