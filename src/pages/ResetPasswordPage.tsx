import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { ArrowLeft } from 'lucide-react';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // 檢查URL中是否有access_token (同時檢查hash和查詢參數)
  useEffect(() => {
    // 檢查hash部分
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    // 檢查查詢參數部分
    const queryParams = new URLSearchParams(window.location.search);
    
    const accessToken = hashParams.get('access_token') || queryParams.get('access_token');
    
    if (!accessToken) {
      toast({
        title: "錯誤",
        description: "無效的密碼重置鏈接。請重新嘗試或聯絡支援。",
        variant: "destructive"
      });
      navigate('/settings');
    }
  }, [navigate]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "錯誤",
        description: "密碼不匹配。請確保兩次輸入的密碼相同。",
        variant: "destructive"
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "錯誤",
        description: "密碼必須至少包含6個字符。",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        throw error;
      }

      toast({
        title: "成功",
        description: "您的密碼已重置。請使用新密碼登錄。",
      });
      
      // 登出用戶
      await supabase.auth.signOut();
      navigate('/');
    } catch (error: any) {
      toast({
        title: "錯誤",
        description: error.message || "重置密碼時出錯。請稍後再試。",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-md mx-auto px-4 py-8">
      <Button 
        variant="ghost" 
        className="mb-4 p-0" 
        onClick={() => navigate('/settings')}
      >
        <ArrowLeft className="h-5 w-5 mr-1" />
        返回
      </Button>
      
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">重設密碼</h1>
        <p className="text-gray-600">請輸入並確認您的新密碼</p>
        
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              新密碼
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="輸入新密碼"
              required
              disabled={loading}
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium">
              確認新密碼
            </label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="再次輸入新密碼"
              required
              disabled={loading}
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading}
          >
            {loading ? "處理中..." : "重設密碼"}
          </Button>
        </form>
      </div>
    </div>
  );
} 