import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import { Loader2 } from 'lucide-react';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // 處理從OAuth提供商返回的URL
        const { error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }
        
        // 登入成功，重定向到設置頁面
        navigate('/settings', { replace: true });
      } catch (err: any) {
        setError(err.message || '登入過程中發生錯誤');
        console.error('Auth callback error:', err);
      }
    };

    handleAuthCallback();
  }, [navigate]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="bg-red-50 text-red-600 p-4 rounded-md max-w-md text-center">
          <h2 className="text-lg font-semibold mb-2">登入失敗</h2>
          <p>{error}</p>
          <button 
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            onClick={() => navigate('/settings')}
          >
            返回登入頁面
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <Loader2 className="h-12 w-12 text-orange-500 animate-spin" />
      <p className="mt-4 text-muted-foreground">正在登入中，請稍候...</p>
    </div>
  );
};

export default AuthCallback; 