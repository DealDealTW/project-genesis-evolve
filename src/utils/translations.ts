// Import translations from separate files
import { en } from './translations/en';
import { zhTW } from './translations/zh-TW';
import { zhCN } from './translations/zh-CN';

// Combine translations into one object
export const translations = {
  'en': en,
  'zh-TW': zhTW,
  'zh-CN': zhCN
};

export type SupportedLanguage = keyof typeof translations;
export type TranslationKey = keyof typeof translations['en'] | 
  'selectMultiple' | 
  'selectedItemsCount' | 
  'confirmDeleteTitle' | 
  'confirmDeleteDescription' | 
  'confirmMarkUsedTitle' | 
  'confirmMarkUsedDescription' | 
  'stopListening' | 
  'insight' | 
  'nothingYet' |
  'emptyDashboardMessage' | 
  'accountAndPreference' | 
  'manualInput' |
  'milkExample' | 
  'breadExample' | 
  'cookiesExample' | 
  'previous' | 
  'next' | 
  'finish' | 
  'dateFormat' | 
  'submitButton' | 
  'accountDeletion' | 
  'accountDeletionConfirm' | 
  'aboutAndHelp' | 
  'quickGuide' | 
  'privacyPolicy' | 
  'termsOfService' | 
  'categoryUsage' | 
  'categoryEfficiency' | 
  'wastedItems' | 
  'wasteDescription' | 
  'noWastedItems' | 
  'frequency' |
  'uncategorized' | 
  'showUngrouped' | 
  'showBySubcategory' |
  'uniqueItemsTrackedTooltip' |
  'efficiencyRateTooltip' |
  'unitsUsedInTimeTooltip' |
  'unitsWastedTooltip' |
  'detailedCategories' |
  'otherCategories' |
  'back' |
  // Dashboard keys
  'itemSingular' | 'unitSingular' | 'items' | 'units' | 'itemCountTooltip' | 'barcodeInput' |
  // Shopping List Keys
  'shopList' | 'addToShopList' | 'markAndAddToShopList' | 'noShopItems' | 
  'addShopItem' | 'removeFromShopList' | 'clearCompletedItems' | 
  'shopItemAdded' | 'allItemsCleared' | 'enterShopItemName' | 'shopListEmptyMessage' |
  // Tutorial guide keys
  'tutorialStep1Title' | 'tutorialStep1Desc' | 
  'tutorialStep2Title' | 'tutorialStep2Desc' | 
  'tutorialStep3Title' | 'tutorialStep3Desc' | 
  'tutorialStep4Title' | 'tutorialStep4Desc' | 
  'tutorialStep5Title' | 'tutorialStep5Desc' | 
  'tutorialStep6Title' | 'tutorialStep6Desc' | 
  'tutorialStep7Title' | 'tutorialStep7Desc' | 
  'tutorialStep8Title' | 'tutorialStep8Desc' | 
  'tutorialStep9Title' | 'tutorialStep9Desc' | 
  'tutorialStep10Title' | 'tutorialStep10Desc' | 
  // Tutorial Step 1 Content Keys (Added)
  'tutorialStep1ContentTitle1' | 'tutorialStep1ContentDesc1' | 
  'tutorialStep1ContentTitle2' | 'tutorialStep1ContentDesc2' | 
  'tutorialStep1ContentTitle3' | 'tutorialStep1ContentDesc3' | 
  'emptyState' | 'emptyStateDesc' | 
  'welcome' | 'welcomeSubtitle' |
  // FAQ translation keys
  'frequentlyAskedQuestions' | 'basicUsage' | 'whatIsPurpose' | 'purposeAnswer' |
  'howToAddItem' | 'addItemAnswer' | 'howToEditItem' | 'editItemAnswer' |
  'howToDeleteItem' | 'deleteItemAnswer' | 'whatIsExpiryColor' | 'expiryColorAnswer' |
  'viewsAndFilters' | 'availableViews' | 'viewsAnswer' | 'howToFilter' | 'filterAnswer' |
  'howToSort' | 'sortAnswer' | 'settingsAndPreferences' | 'changeDateFormat' | 'dateFormatAnswer' |
  'changeLanguage' | 'languageAnswer' | 'darkModeQuestion' | 'darkModeAnswer' |
  'advancedFeatures' | 'cameraQuestion' | 'cameraAnswer' | 'voiceInputQuestion' |
  'voiceInputAnswer' | 'statsQuestion' | 'statsAnswer' | 'troubleshooting' |
  'appCrashQuestion' | 'appCrashAnswer' | 'lostDataQuestion' | 'lostDataAnswer' |
  'notificationQuestion' | 'notificationAnswer' | 'dataStorageQuestion' | 'dataStorageAnswer' |
  'exportQuestion' | 'exportAnswer' | 'importQuestion' | 'importAnswer' |
  // Food Safety FAQ translation keys
  'foodSafety' | 'foodExpiryQuestion' | 'foodExpiryAnswer' | 
  'storageTemperatureQuestion' | 'storageTemperatureAnswer' | 
  'freezingFoodQuestion' | 'freezingFoodAnswer' | 
  'leftoverFoodQuestion' | 'leftoverFoodAnswer' |
  // Privacy Policy and Terms of Service translation keys
  'privacyPolicyTitle' | 'privacyPolicyContent' | 'termsOfServiceTitle' | 'termsOfServiceContent' | 'lastUpdated' | 'legal' | 'contactSupportMessage' |
  // Quick Guide Keys
  'quickGuideAdd' | 'quickGuideFilter' | 'quickGuideNotify' | 'quickGuideStats' |
  'showBySubcategory' | 'showUngrouped' | 'grouped' | 'ungrouped' |
  // 添加缺失的翻譯鍵
  'selectSubcategory' | 'expiresOn' | 'notifyMe' | 'daysBeforeExpiry' | 
  'notificationDisabled' | 'saveChanges' | 'deleteItemConfirm' | 
  'deleteItemConfirmDesc' | 'reAddToDashboard' | 'addToShopListZero' | 
  'closeModalAndDoNothing';

export const useTranslation = (language: SupportedLanguage) => {
  const t = (key: TranslationKey, params?: Record<string, string | number>): string => {
    let translation = translations[language][key] || translations['en'][key] || key;
    if (params) {
      Object.keys(params).forEach(paramKey => {
        translation = translation.replace(`{${paramKey}}`, String(params[paramKey]));
      });
    }
    return translation;
  };
  return t;
};
// fix duplicate
