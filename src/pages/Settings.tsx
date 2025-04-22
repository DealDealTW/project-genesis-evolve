import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle } from "@/components/ui/card";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Paintbrush, 
  Info, 
  Moon, 
  Globe, 
  Sliders, 
  Clock,
  User,
  LogOut,
  Mic,
  Camera,
  HelpCircle,
  MessageSquare,
  BookOpen,
  Settings as SettingsIcon,
  CalendarDays,
  LayoutGrid,
  Package,
  FileText,
  ShieldCheck,
  Plus,
  ListFilter,
  BarChart,
  Edit,
  Calendar,
  Bell,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Timer,
  ShoppingBag,
  AlertTriangle,
  Users,
  Box,
  Home,
  Scale,
  Lock,
  Trash2,
  Mail,
  Facebook,
  Loader2,
  Github,
  ScrollText,
  Send,
  Settings2,
  MailQuestion,
  Utensils,
  Calculator,
  Wrench,
  RefreshCw,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useApp, DateFormatOption, ViewModeOption, ItemCategory } from '@/contexts/AppContext';
import { useTranslation, SupportedLanguage, TranslationKey } from '@/utils/translations';
import { toast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import FAQContent from "@/components/FAQContent";
import PrivacyPolicyContent from '@/components/PrivacyPolicyContent';
import TermsOfServiceContent from '@/components/TermsOfServiceContent';
import { categorySubcategories } from '@/utils/categoryConfig';
import { Badge } from "@/components/ui/badge";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import GoogleIcon from '../components/icons/GoogleIcon';
import AppleIcon from '../components/icons/AppleIcon';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

// Define Segment type
type SettingsSegment = 'accountPreferences' | 'about';

const Settings: React.FC = () => {
  const { 
    darkMode, 
    setDarkMode, 
    language, 
    setLanguage, 
    settings, 
    updateSettings, 
    setShowTutorial,
    session, 
    user, 
    authLoading, 
    signUp, 
    signInWithPassword, 
    signInWithProvider, 
    logout,
    updatePassword,
    deleteAccount,
    resetPassword
  } = useApp();
  // Remove: console.log('[Settings] useApp hook called, logout:', typeof logout);
  const t = useTranslation(language);
  
  const [activeSegment, setActiveSegment] = useState<SettingsSegment>('accountPreferences');
  const [showFAQ, setShowFAQ] = useState<boolean>(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState<boolean>(false);
  const [showTermsOfService, setShowTermsOfService] = useState<boolean>(false);
  const [showPasswordChange, setShowPasswordChange] = useState<boolean>(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [showResetPasswordConfirm, setShowResetPasswordConfirm] = useState<boolean>(false);
  const [enableAdvancedSettings, setEnableAdvancedSettings] = useState<boolean>(() => {
    return settings.advancedQuantitySettings || false;
  });
  const [authError, setAuthError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const isLoggedInAuth = !!session;

  const handleAdvancedSettingsToggle = (checked: boolean) => {
    setEnableAdvancedSettings(checked);
    if (!checked) {
      updateSettings({ 
        subcategoryMultipliers: {},
        advancedQuantitySettings: false 
      });
      toast({ 
        title: t('advancedSettingsDisabled' as TranslationKey), 
        description: t('advancedSettingsDisabledDesc' as TranslationKey)
      });
    } else {
      updateSettings({ advancedQuantitySettings: true });
      toast({ 
        title: t('advancedSettingsEnabled' as TranslationKey), 
        description: t('advancedSettingsEnabledDesc' as TranslationKey) 
      });
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      setAuthError(t('enterEmailPassword' as TranslationKey));
      return;
    }
    setAuthError(null);
    const success = await signInWithPassword(email, password);
    if (!success) {
      setAuthError(t('loginFailed' as TranslationKey)); 
    }
  };
  
  const handleSignup = async () => {
    if (!email || !password) {
      setAuthError(t('enterEmailPassword' as TranslationKey));
      return;
    }
    if (password !== confirmPassword) {
      setAuthError(t('passwordsDoNotMatch' as TranslationKey));
      return;
    }
    setAuthError(null);
    const success = await signUp(email, password);
    if (!success) {
      setAuthError(t('signupFailed' as TranslationKey));
    }
  };
  
  const handleSocialSignIn = async (provider: 'google' | 'apple' | 'facebook') => {
    setAuthError(null);
    await signInWithProvider(provider);
  };
  
  const handleLogout = async () => {
    setAuthError(null);
    // Remove: console.log('[Settings] handleLogout called');
    await logout();
  };

  const handleChangePassword = async () => {
    if (!password || !confirmPassword) {
      setAuthError(t('enterNewPassword' as TranslationKey));
      return;
    }
    
    if (password !== confirmPassword) {
      setAuthError(t('passwordsDoNotMatch' as TranslationKey));
      return;
    }
    
    setAuthError(null);
    const success = await updatePassword(password);
    
    if (success) {
      setPassword('');
      setConfirmPassword('');
      setShowPasswordChange(false);
    }
  };
  
  const handleDeleteAccount = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }
    
    setAuthError(null);
    await deleteAccount();
  };

  const handleResetPassword = async () => {
    if (!email && !user?.email) {
      setAuthError(t('enterEmailForReset' as TranslationKey));
      return;
    }
    
    setAuthError(null);
    const emailToUse = email || user?.email || '';
    const success = await resetPassword(emailToUse);
    
    if (success) {
      toast({
        title: t('resetPasswordSuccess' as TranslationKey),
        description: t('resetPasswordSuccessMessage' as TranslationKey),
        duration: 5000
      });
    }
  };

  const renderAuthSection = () => {
    if (authLoading) {
      return (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </div>
      );
    }
    
    if (isLoggedInAuth) {
      return (
        <Card className="rounded-lg border border-gray-100 shadow-sm">
          <CardHeader className="p-4 pb-2 bg-gradient-to-r from-orange-50 to-orange-100 rounded-t-lg border-b">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-orange-500" />
              <CardTitle className="text-sm font-semibold">{t('account' as TranslationKey)}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                  <User className="h-6 w-6 text-orange-500" />
                </div>
                <div>
                  <p className="font-medium">{user?.email?.split('@')[0] || 'User'}</p>
                  <p className="text-xs text-muted-foreground">{user?.email || ''}</p>
                </div>
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                className="px-3 py-1 text-xs h-auto border-orange-200 text-orange-700"
                onClick={handleLogout}
              >
                {t('logout' as TranslationKey)}
              </Button>
            </div>
            
            {user?.app_metadata?.provider === 'email' && (
              <div className="pt-3 border-t mt-3">
                <Button 
                  variant="outline" 
                  className="w-full h-9 px-3 justify-start text-left gap-2"
                  onClick={() => setShowPasswordChange(prev => !prev)}
                >
                  <Lock className="h-4 w-4 text-orange-500" />
                  {t('changePassword' as TranslationKey)}
                </Button>
                
                {showPasswordChange && (
                  <div className="mt-3 space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="new-password" className="text-xs">{t('newPassword' as TranslationKey)}</Label>
                      <Input 
                        id="new-password" 
                        type="password" 
                        className="border-orange-200 focus:border-orange-300"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-new-password" className="text-xs">{t('confirmNewPassword' as TranslationKey)}</Label>
                      <Input 
                        id="confirm-new-password" 
                        type="password" 
                        className="border-orange-200 focus:border-orange-300"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>
                    
                    {authError && (
                      <div className="text-red-500 text-xs p-2 bg-red-50 rounded-md">
                        {authError}
                      </div>
                    )}
                    
                    <div className="flex gap-2 justify-end">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-xs h-8 border-slate-200"
                        onClick={() => {
                          setShowPasswordChange(false);
                          setPassword('');
                          setConfirmPassword('');
                          setAuthError(null);
                        }}
                      >
                        {t('cancel' as TranslationKey)}
                      </Button>
                      <Button 
                        size="sm" 
                        className="text-xs h-8 bg-orange-400 hover:bg-orange-500"
                        onClick={handleChangePassword}
                        disabled={authLoading}
                      >
                        {authLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {t('save' as TranslationKey)}
                      </Button>
                    </div>
                  </div>
                )}
                
                <Button 
                  variant="outline" 
                  className="w-full h-9 px-3 justify-start text-left gap-2 mt-2"
                  onClick={() => setShowResetPasswordConfirm(true)}
                >
                  <RefreshCw className="h-4 w-4 text-orange-500" />
                  {t('resetPassword' as TranslationKey)}
                </Button>
                
                <AlertDialog open={showResetPasswordConfirm} onOpenChange={setShowResetPasswordConfirm}>
                  <AlertDialogContent className="max-w-xs mx-auto">
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t('resetPassword' as TranslationKey)}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t('resetPasswordConfirmMessage' as TranslationKey)}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex gap-2">
                      <AlertDialogCancel className="text-xs h-8">{t('cancel' as TranslationKey)}</AlertDialogCancel>
                      <AlertDialogAction 
                        className="text-xs h-8 bg-orange-400 hover:bg-orange-500 text-white"
                        onClick={() => {
                          handleResetPassword();
                          setShowResetPasswordConfirm(false);
                        }}
                      >
                        {t('resetPassword' as TranslationKey)}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
              
            <div className="pt-3 border-t mt-3">
              <Button 
                variant="outline" 
                className="w-full h-9 px-3 justify-start text-left gap-2 hover:bg-red-50 border-red-200 text-red-600"
                onClick={() => setShowDeleteConfirm(prev => !prev)}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
                {t('deleteAccount' as TranslationKey)}
              </Button>
                
              {showDeleteConfirm && (
                <div className="mt-3 pt-3 border-t space-y-2">
                  <div className="bg-red-50 text-red-600 rounded-md p-3 text-xs">
                    <p className="font-medium mb-1">{t('warningDeleteAccount' as TranslationKey)}</p>
                    <p>{t('deleteAccountConfirmation' as TranslationKey)}</p>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-xs h-8 border-slate-200"
                      onClick={() => setShowDeleteConfirm(false)}
                    >
                      {t('cancel' as TranslationKey)}
                    </Button>
                    <Button 
                      size="sm" 
                      className="text-xs h-8 bg-red-500 hover:bg-red-600"
                      onClick={handleDeleteAccount}
                      disabled={authLoading}
                    >
                      {authLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {t('confirmDelete' as TranslationKey)}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      );
    }
    
    return (
      <Card className="rounded-lg border border-gray-100 shadow-sm">
        <CardHeader className="p-4 pb-2 bg-gradient-to-r from-orange-50 to-orange-100 rounded-t-lg border-b">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-orange-500" />
            <CardTitle className="text-sm font-semibold">{t('account' as TranslationKey)}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-4">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="login">{t('login' as TranslationKey)}</TabsTrigger>
                <TabsTrigger value="signup">{t('signup' as TranslationKey)}</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login" className="space-y-3 pt-4">
                <div className="space-y-1">
                  <Label htmlFor="login-email" className="text-xs">{t('email' as TranslationKey)}</Label>
                  <Input 
                    id="login-email" 
                    type="email" 
                    placeholder="your.email@example.com" 
                    className="border-orange-200 focus:border-orange-300"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setAuthError(null); }}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="login-password" className="text-xs">{t('password' as TranslationKey)}</Label>
                  <Input 
                    id="login-password" 
                    type="password" 
                    className="border-orange-200 focus:border-orange-300"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setAuthError(null); }}
                  />
                </div>
                
                {authError && (
                  <div className="text-red-500 text-xs p-2 bg-red-50 rounded-md">
                    {authError}
                  </div>
                )}
                
                <div className="text-right">
                  <Button 
                    variant="link" 
                    className="h-auto p-0 text-xs text-orange-500"
                    onClick={handleResetPassword}
                  >
                    {t('forgotPassword' as TranslationKey)}
                  </Button>
                </div>
                
                <Button 
                  className="w-full bg-orange-400 hover:bg-orange-500"
                  onClick={handleLogin}
                  disabled={authLoading}
                >
                  {authLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t('login' as TranslationKey)}
                </Button>
                
                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-white dark:bg-card px-2 text-muted-foreground">
                      {t('orContinueWith' as TranslationKey)}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-center gap-3 pt-2">
                  <Button 
                    variant="outline" 
                    size="icon"
                    className="w-12 h-10 border-gray-300 dark:border-gray-600 rounded-md"
                    onClick={() => handleSocialSignIn('apple')}
                    disabled={authLoading}
                    title={t('continueWithApple' as TranslationKey)}
                  >
                    {authLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <AppleIcon className="h-5 w-5" />}
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="icon"
                    className="w-12 h-10 border-gray-300 dark:border-gray-600 rounded-md"
                    onClick={() => handleSocialSignIn('google')}
                    disabled={authLoading}
                    title={t('continueWithGoogle' as TranslationKey)}
                  >
                    {authLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon className="h-5 w-5" />}
                  </Button>

                  <Button 
                    variant="outline" 
                    size="icon"
                    className="w-12 h-10 border-gray-300 dark:border-gray-600 rounded-md"
                    onClick={() => handleSocialSignIn('facebook')}
                    disabled={authLoading}
                    title={t('continueWithFacebook' as TranslationKey)}
                  >
                    {authLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Facebook className="h-5 w-5 text-[#1877F2]" />}
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="signup" className="space-y-3 pt-4">
                <div className="space-y-1">
                  <Label htmlFor="signup-email" className="text-xs">{t('email' as TranslationKey)}</Label>
                  <Input 
                    id="signup-email" 
                    type="email" 
                    placeholder="your.email@example.com" 
                    className="border-orange-200 focus:border-orange-300"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setAuthError(null); }}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="signup-password" className="text-xs">{t('password' as TranslationKey)}</Label>
                  <Input 
                    id="signup-password" 
                    type="password" 
                    className="border-orange-200 focus:border-orange-300"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setAuthError(null); }}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="confirm-password" className="text-xs">{t('confirmPassword' as TranslationKey)}</Label>
                  <Input 
                    id="signup-confirm-password" 
                    type="password" 
                    className="border-orange-200 focus:border-orange-300"
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setAuthError(null); }}
                  />
                </div>
                
                {authError && (
                  <div className="text-red-500 text-xs p-2 bg-red-50 rounded-md">
                    {authError}
                  </div>
                )}
                
                <Button 
                  className="w-full bg-orange-400 hover:bg-orange-500"
                  onClick={handleSignup}
                  disabled={authLoading}
                >
                  {authLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t('signup' as TranslationKey)}
                </Button>
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderContent = () => {
    switch (activeSegment) {
      case 'accountPreferences':
        return (
          <div className="space-y-3">
            {renderAuthSection()}
            
            <Card className="rounded-lg border border-gray-100 shadow-sm">
              <CardHeader className="p-4 pb-2 bg-gradient-to-r from-orange-50 to-orange-100 rounded-t-lg border-b">
                <div className="flex items-center gap-2">
                  <Paintbrush className="h-4 w-4 text-orange-500" />
                  <CardTitle className="text-sm font-semibold">{t('appearance' as TranslationKey)}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Moon className="h-4 w-4 text-orange-500" />
                      <Label htmlFor="dark-mode" className="font-medium cursor-pointer text-sm">{t('darkMode' as TranslationKey)}</Label>
                    </div>
                    <div 
                      className={`ml-1 ${darkMode ? 'bg-orange-200' : 'bg-gray-200'} rounded-full w-11 h-6 flex-shrink-0 relative cursor-pointer`}
                      onClick={() => setDarkMode(!darkMode)}
                    >
                      <div className={`absolute top-0.5 left-0.5 rounded-full w-5 h-5 transition-transform ${darkMode ? 'translate-x-5 bg-orange-500' : 'translate-x-0 bg-white'}`}></div>
                      <input 
                        type="checkbox" 
                        id="dark-mode"
                        checked={darkMode}
                        onChange={() => setDarkMode(!darkMode)} 
                        className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2 pt-3 border-t mt-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Globe className="h-4 w-4 text-orange-400" />
                      <Label htmlFor="language-select" className="font-medium text-sm">{t('language' as TranslationKey)}</Label>
                    </div>
                    <Select 
                      value={language} 
                      onValueChange={(value) => setLanguage(value as SupportedLanguage)}
                    >
                      <SelectTrigger id="language-select" className="h-10 w-full text-sm border-orange-200 focus:ring-orange-200 focus:border-orange-200 focus:ring-opacity-30">
                        <SelectValue placeholder={t('selectLanguage' as TranslationKey)} />
                      </SelectTrigger>
                      <SelectContent className="border-orange-200">
                        <SelectItem value="en" className="text-sm">English</SelectItem>
                        <SelectItem value="zh-TW" className="text-sm">繁體中文</SelectItem>
                        <SelectItem value="zh-CN" className="text-sm">简体中文</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 pt-3 border-t mt-3">
                    <div className="flex items-center gap-2 mb-1">
                      <CalendarDays className="h-4 w-4 text-orange-400" />
                      <Label htmlFor="date-format-select" className="font-medium text-sm">{t('dateFormat' as TranslationKey)}</Label>
                    </div>
                    <Select 
                      value={settings.dateFormat} 
                      onValueChange={(value) => updateSettings({ dateFormat: value as DateFormatOption })}
                    >
                      <SelectTrigger id="date-format-select" className="border-orange-200 focus:ring-orange-200 focus:border-orange-200 focus:ring-opacity-30">
                        <SelectValue placeholder={t('dateFormat' as TranslationKey)} />
                      </SelectTrigger>
                      <SelectContent className="border-orange-200">
                        <SelectItem value="yyyy-MM-dd">YYYY-MM-DD</SelectItem>
                        <SelectItem value="MM/dd/yyyy">MM/DD/YYYY</SelectItem>
                        <SelectItem value="dd/MM/yyyy">DD/MM/YYYY</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-lg border border-gray-100 shadow-sm">
              <CardHeader className="p-4 pb-3 bg-gradient-to-r from-orange-50 to-orange-100 rounded-t-lg border-b">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-orange-500" />
                  <CardTitle className="text-sm font-semibold">{t('notifications' as TranslationKey) || "Notifications"}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-1">
                    <Timer className="h-4 w-4 text-orange-500" />
                    <Label htmlFor="default-notify-days" className="font-medium text-sm">
                      {t('defaultNotifyDaysBefore' as TranslationKey) || "Default Notify Days Before"}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="h-3 w-3 text-orange-400 ml-1 inline" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs max-w-72">
                              {language === 'en' 
                                ? 'Set the default number of days before expiry to notify you for newly added items' 
                                : '設置新添加項目預設的到期前通知天數'}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </Label>
                  </div>
                  <Select 
                    value={settings.defaultNotifyDaysBefore?.toString() || "3"} 
                    onValueChange={(value) => updateSettings({ defaultNotifyDaysBefore: parseInt(value) })}
                  >
                    <SelectTrigger id="default-notify-days" className="border-orange-200 focus:ring-orange-200 focus:border-orange-200 focus:ring-opacity-30">
                      <SelectValue placeholder={settings.defaultNotifyDaysBefore?.toString() || "3"} />
                    </SelectTrigger>
                    <SelectContent className="border-orange-200">
                      <SelectItem value="1">1 {language === 'en' ? 'day' : '天'}</SelectItem>
                      <SelectItem value="2">2 {language === 'en' ? 'days' : '天'}</SelectItem>
                      <SelectItem value="3">3 {language === 'en' ? 'days' : '天'}</SelectItem>
                      <SelectItem value="5">5 {language === 'en' ? 'days' : '天'}</SelectItem>
                      <SelectItem value="7">7 {language === 'en' ? 'days' : '天'}</SelectItem>
                      <SelectItem value="10">10 {language === 'en' ? 'days' : '天'}</SelectItem>
                      <SelectItem value="14">14 {language === 'en' ? 'days' : '天'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-lg border border-gray-100 shadow-sm">
              <CardHeader className="p-4 pb-3 bg-gradient-to-r from-orange-50 to-orange-100 rounded-t-lg border-b">
                <div className="flex items-center gap-2">
                  <Calculator className="h-4 w-4 text-orange-500" />
                  <CardTitle className="text-sm font-semibold">{t('quantitySettings' as TranslationKey)}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="h-4 w-4 text-orange-500" />
                    <Label htmlFor="family-size" className="font-medium text-sm">{t('familySize' as TranslationKey)}</Label>
                  </div>
                  <Input
                    id="family-size"
                    type="number"
                    className="border-orange-200 focus:ring-orange-200 w-full"
                    value={settings.familySize || ''} 
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '') {
                        updateSettings({ ...settings, familySize: undefined });
                      } else {
                        updateSettings({ ...settings, familySize: Number(value) });
                      }
                    }}
                    max="100"
                  />
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Scale className="h-4 w-4 text-orange-500" />
                      <Label htmlFor="auto-resize" className="font-medium cursor-pointer text-sm flex items-center gap-1">
                        {t('autoAdjustFamilySize' as TranslationKey)} 
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <HelpCircle className="h-3 w-3 text-orange-400" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs max-w-72">{t('autoAdjustFamilySizeHint' as TranslationKey)}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </Label>
                    </div>
                    <div 
                      className={`ml-1 ${settings.autoAdjustFamilySize ? 'bg-orange-200' : 'bg-gray-200'} rounded-full w-11 h-6 flex-shrink-0 relative cursor-pointer`}
                      onClick={() => updateSettings({ ...settings, autoAdjustFamilySize: !settings.autoAdjustFamilySize })}
                    >
                      <div className={`absolute top-0.5 left-0.5 rounded-full w-5 h-5 transition-transform ${settings.autoAdjustFamilySize ? 'translate-x-5 bg-orange-500' : 'translate-x-0 bg-white'}`}></div>
                      <input 
                        type="checkbox" 
                        id="auto-resize"
                        checked={settings.autoAdjustFamilySize}
                        onChange={(e) => updateSettings({ ...settings, autoAdjustFamilySize: e.target.checked })}
                        className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="advanced-settings-toggle" className="flex items-center gap-2">
                          <Wrench className="h-4 w-4 text-orange-500" />
                          <span className="text-sm font-medium">{t('advancedQuantitySettings' as TranslationKey)}</span>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <HelpCircle className="h-3 w-3 text-orange-400" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs max-w-72">
                                  {language === 'en' 
                                    ? 'Define specific quantity rules for each subcategory based on per-person requirements.' 
                                    : '根據每人需求為每個子類別定義特定的數量規則。'}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <Badge variant="outline" className="text-xs border-purple-300 text-purple-600 bg-purple-50 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-700">Premium</Badge>
                        </Label>
                        <div 
                          className={`ml-1 ${enableAdvancedSettings ? 'bg-orange-200' : 'bg-gray-200'} rounded-full w-11 h-6 flex-shrink-0 relative cursor-pointer`}
                          onClick={() => handleAdvancedSettingsToggle(!enableAdvancedSettings)}
                        >
                          <div className={`absolute top-0.5 left-0.5 rounded-full w-5 h-5 transition-transform ${enableAdvancedSettings ? 'translate-x-5 bg-orange-500' : 'translate-x-0 bg-white'}`}></div>
                          <input 
                            type="checkbox" 
                            id="advanced-settings-toggle"
                            checked={enableAdvancedSettings}
                            onChange={(e) => handleAdvancedSettingsToggle(e.target.checked)}
                            className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
                          />
                        </div>
                    </div>
                    {enableAdvancedSettings && (
                        <Accordion type="multiple" className="w-full mt-2 pl-6">
                          <AccordionItem value="food-settings">
                            <AccordionTrigger className="text-sm py-2 hover:no-underline">
                                <div className="flex items-center gap-2">
                                    <Utensils className="h-4 w-4 text-orange-500" />
                                    {t('food' as TranslationKey)}
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                <div className="pl-4 pr-2 space-y-3 py-2">
                                    {(categorySubcategories['Food'] || []).map((sub) => (
                                        <div key={`food-${sub.name.en}`} className="flex items-center justify-between gap-2">
                                            <Label htmlFor={`accordion-multiplier-${sub.name.en}`} className="text-sm flex items-center flex-1 min-w-0">
                                                <span className="truncate">{sub.name[language] || sub.name.en}</span>
                                            </Label>
                                            <Input
                                                id={`accordion-multiplier-${sub.name.en}`}
                                                type="number"
                                                min="1"
                                                className="w-20 h-8 border-orange-200 focus:border-orange-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                value={settings.subcategoryMultipliers?.[sub.name.en] || ''} 
                                                placeholder=""
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    const newMultipliers = { ...(settings.subcategoryMultipliers || {}) };
                                                    if (value === '') {
                                                        delete newMultipliers[sub.name.en];
                                                    } else {
                                                        const parsedValue = parseInt(value);
                                                        if (!isNaN(parsedValue) && parsedValue >= 1) {
                                                            newMultipliers[sub.name.en] = parsedValue;
                                                        } else {
                                                            delete newMultipliers[sub.name.en];
                                                        }
                                                    }
                                                    updateSettings({ subcategoryMultipliers: newMultipliers });
                                                }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </AccordionContent>
                          </AccordionItem>
                          <AccordionItem value="household-settings">
                             <AccordionTrigger className="text-sm py-2 hover:no-underline">
                                <div className="flex items-center gap-2">
                                    <Home className="h-4 w-4 text-orange-500" />
                                    {t('household' as TranslationKey)}
                                </div>
                            </AccordionTrigger>
                             <AccordionContent>
                               <div className="pl-4 pr-2 space-y-3 py-2">
                                    {(categorySubcategories['Household'] || []).map((sub) => (
                                        <div key={`household-${sub.name.en}`} className="flex items-center justify-between gap-2">
                                            <Label htmlFor={`accordion-multiplier-${sub.name.en}`} className="text-sm flex items-center flex-1 min-w-0">
                                                <span className="truncate">{sub.name[language] || sub.name.en}</span>
                                            </Label>
                                            <Input
                                                id={`accordion-multiplier-${sub.name.en}`}
                                                type="number"
                                                min="1"
                                                className="w-20 h-8 border-orange-200 focus:border-orange-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                value={settings.subcategoryMultipliers?.[sub.name.en] || ''} 
                                                placeholder=""
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    const newMultipliers = { ...(settings.subcategoryMultipliers || {}) };
                                                    if (value === '') {
                                                        delete newMultipliers[sub.name.en];
                                                    } else {
                                                        const parsedValue = parseInt(value);
                                                        if (!isNaN(parsedValue) && parsedValue >= 1) {
                                                            newMultipliers[sub.name.en] = parsedValue;
                                                        } else {
                                                            delete newMultipliers[sub.name.en];
                                                        }
                                                    }
                                                    updateSettings({ subcategoryMultipliers: newMultipliers });
                                                }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                    )}
                </div>
              </CardContent>
            </Card>
          </div>
        );
      case 'about':
        return (
          <div className="space-y-3">
              <Card className="rounded-lg border border-gray-100 shadow-sm">
                <CardHeader className="p-4 pb-2 bg-gradient-to-r from-orange-50 to-orange-100 rounded-t-lg border-b">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="h-4 w-4 text-orange-500" />
                    <CardTitle className="text-sm font-semibold">{t('helpAndFeedback' as TranslationKey)}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-2">
                  <Button 
                    variant="ghost"
                    className="w-full justify-start text-left gap-2 h-9 px-3 text-sm hover:bg-orange-50"
                    onClick={() => { setShowTutorial(true); }}
                  >
                    <BookOpen className="h-4 w-4 text-orange-500" />
                    {t('viewTutorial' as TranslationKey)}
                  </Button>
                  
                  <Button 
                    variant="ghost"
                    className="w-full justify-start text-left gap-2 h-9 px-3 text-sm hover:bg-orange-50"
                    onClick={() => setShowFAQ(!showFAQ)}
                  >
                    <div className="flex w-full justify-between items-center">
                      <div className="flex items-center gap-2">
                        <HelpCircle className="h-4 w-4 text-orange-500" />
                        {t('faq' as TranslationKey)}
                        {showFAQ ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </Button>
                  
                  {showFAQ && (
                    <div className="mt-2 border-t pt-3">
                      <FAQContent 
                        maxHeight="h-[400px]" 
                        showHeader={false} 
                        compact={true} 
                      />
                    </div>
                  )}
                  
                  <Button 
                    variant="ghost"
                    className="w-full justify-start text-left gap-2 h-9 px-3 text-sm hover:bg-orange-50"
                    onClick={() => { window.location.href = 'mailto:support@example.com?subject=WhatsLeft%20App%20Feedback'; toast({ title: t('contactSupportMessage' as TranslationKey), duration: 3000 }); }}
                  >
                    <div className="flex w-full justify-between items-center">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-orange-500" />
                        {t('contactSupport' as TranslationKey)}
                      </div>
                    </div>
                  </Button>
                  <div className="px-3 pb-1 space-y-1">
                    <div className="flex items-start gap-1.5">
                      <FileText className="h-3 w-3 text-orange-500 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-muted-foreground">{t('reportBugsDesc' as TranslationKey)}</p>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <Lightbulb className="h-3 w-3 text-orange-500 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-muted-foreground">{t('suggestFeaturesDesc' as TranslationKey)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="rounded-lg border border-gray-100 shadow-sm">
                <CardHeader className="p-4 pb-2 bg-gradient-to-r from-orange-50 to-orange-100 rounded-t-lg border-b">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-orange-500" />
                    <CardTitle className="text-sm font-semibold">{t('legal' as TranslationKey)}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-2">
                  <Button 
                    variant="ghost"
                    className="w-full justify-start text-left gap-2 h-9 px-3 text-sm hover:bg-orange-50"
                    onClick={() => setShowPrivacyPolicy(!showPrivacyPolicy)}
                  >
                    <div className="flex w-full justify-between items-center">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-orange-500" />
                        {t('privacyPolicy' as TranslationKey)}
                        {showPrivacyPolicy ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </Button>
                  
                  {showPrivacyPolicy && (
                    <div className="mt-2 border-t pt-3">
                      <PrivacyPolicyContent 
                        maxHeight="h-[400px]" 
                      />
                    </div>
                  )}
                  
                  <Button 
                    variant="ghost"
                    className="w-full justify-start text-left gap-2 h-9 px-3 text-sm hover:bg-orange-50"
                    onClick={() => setShowTermsOfService(!showTermsOfService)}
                  >
                    <div className="flex w-full justify-between items-center">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-orange-500" />
                        {t('termsOfService' as TranslationKey)}
                        {showTermsOfService ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </Button>
                  
                  {showTermsOfService && (
                    <div className="mt-2 border-t pt-3">
                      <TermsOfServiceContent 
                        maxHeight="h-[400px]" 
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card className="rounded-lg border border-gray-100 shadow-sm">
                <CardHeader className="p-4 pb-2 bg-gradient-to-r from-orange-50 to-orange-100 rounded-t-lg border-b">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-orange-500" />
                    <CardTitle className="text-sm font-semibold">{t('about' as TranslationKey)}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <p className="font-medium text-sm">WhatsLeft v1.0.0</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('aboutDescription' as TranslationKey)} 
                  </p>
                </CardContent>
              </Card>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-[100%] sm:max-w-md mx-auto px-1 sm:px-2 py-4 sm:py-6 pb-16">
       <div className="flex items-center justify-center space-x-1 bg-orange-50 p-1 rounded-lg mb-4 shadow-sm border border-orange-100">
         {(['accountPreferences', 'about'] as SettingsSegment[]).map((segment) => (
           <Button
             key={segment}
             variant={activeSegment === segment ? 'secondary' : 'ghost'}
             className={cn(
               "flex-1 flex items-center justify-center gap-1 text-xs h-8 px-2 transition-all",
               activeSegment === segment ? 'bg-white shadow-sm' : 'hover:bg-orange-100'
             )}
             onClick={() => setActiveSegment(segment)}
           >
             {segment === 'accountPreferences' && <SettingsIcon className="h-4 w-4 text-orange-500" />}
             {segment === 'about' && <HelpCircle className="h-4 w-4 text-orange-500" />}
             {segment === 'accountPreferences' ? t('settings' as TranslationKey) : t('aboutAndHelp' as TranslationKey)}
           </Button>
         ))}
       </div>

       <div className="mt-4">
         {renderContent()}
       </div>
    </div>
  );
};

export default Settings;
