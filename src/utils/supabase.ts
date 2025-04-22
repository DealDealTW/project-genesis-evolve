import { createClient } from '@supabase/supabase-js';

// 您需要替換這些值為您的實際Supabase項目URL和公共匿名密鑰
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project-url.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-public-anon-key';

// 創建Supabase客戶端
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 檢查用戶當前登入狀態
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

// 使用電子郵件和密碼登入
export const signInWithEmail = async (email: string, password: string) => {
  return await supabase.auth.signInWithPassword({
    email,
    password
  });
};

// 使用電子郵件和密碼註冊
export const signUpWithEmail = async (email: string, password: string) => {
  return await supabase.auth.signUp({
    email,
    password
  });
};

// 使用社交媒體登入
export const signInWithSocial = async (provider: 'google') => {
  return await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}/auth/callback`
    }
  });
};

// 登出
export const signOut = async () => {
  return await supabase.auth.signOut();
};

// 獲取用戶資料
export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
  
  return data;
};

// 更新用戶資料
export const updateUserProfile = async (userId: string, updates: any) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId);
  
  if (error) {
    console.error('Error updating user profile:', error);
    return false;
  }
  
  return true;
};

// 刪除用戶帳號
export const deleteUserAccount = async () => {
  return await supabase.auth.admin.deleteUser(
    (await supabase.auth.getUser()).data.user?.id || ''
  );
}; 