import React, { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useTranslation } from '@/utils/translations';
import { ChevronDown, ChevronRight, HelpCircle } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQCategory {
  title: string;
  items: FAQItem[];
}

const FAQ: React.FC = () => {
  const { language } = useApp();
  const t = useTranslation(language);
  
  // 跟踪展开的FAQ类别和项目
  const [expandedCategories, setExpandedCategories] = useState<Record<number, boolean>>({
    0: true, // 默认展开第一个类别
  });
  
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  
  // 切换类别展开/折叠状态
  const toggleCategory = (index: number) => {
    setExpandedCategories(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };
  
  // 切换问题展开/折叠状态
  const toggleItem = (categoryIndex: number, itemIndex: number) => {
    const key = `${categoryIndex}-${itemIndex}`;
    setExpandedItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };
  
  // FAQ内容 - 根据当前语言可以调整使用不同内容
  const faqCategories: FAQCategory[] = [
    {
      title: t('basicUsage'),
      items: [
        {
          question: t('whatIsPurpose'),
          answer: t('purposeAnswer')
        },
        {
          question: "How do I get started with WhatsLeft?",
          answer: "From the Dashboard, tap the + button to add your first item. You can input manually, use voice input, or scan a barcode. You must enter the item name and expiry date; other information like quantity and category are optional or can be auto-detected."
        },
        {
          question: t('howToAddItem'),
          answer: "You can add items in three ways: 1) Tap the + button at the bottom of the Dashboard for manual input; 2) After signing in, use the 'Voice Input' feature to quickly add multiple items; 3) Use the 'Barcode Scanner' feature to scan an item barcode and auto-fill information."
        },
        {
          question: "How do I use the barcode scanning feature?",
          answer: "Tap the + button at the bottom of the Dashboard, then select the barcode icon. Point your phone at the product barcode, and the app will attempt to find the product in its database. If found, the item name and category will be auto-filled; if not, you'll need to enter the details manually."
        },
        {
          question: t('howToEditItem'),
          answer: "Tap on any item to view its details, then tap the edit button (pencil icon). You can modify the name, quantity, expiry date, notification settings, and other information."
        },
        {
          question: t('howToDeleteItem'),
          answer: "Tap on an item to view its details, then tap the delete button (trash icon). You'll be asked to confirm the deletion."
        },
        {
          question: "What happens when an item is marked as used?",
          answer: "Marking an item as used removes it from the Dashboard but keeps it in the database for statistical analysis. You can view data on all used items in the 'Stats' page, which helps you understand your consumption patterns."
        },
        {
          question: "What happens when an item is marked as wasted?",
          answer: "Marking an item as wasted removes it from the Dashboard and counts it in your waste statistics. This data appears in the waste analysis on the 'Stats' page, helping you identify the types of items you waste most often, so you can improve your shopping and storage habits."
        },
        {
          question: t('whatIsExpiryColor'),
          answer: "Green means safe to use (not expiring soon); Yellow means expiring soon (within 3-4 days); Red means expired or expiring today/tomorrow. These color cues help you quickly identify items that need to be used prioritized."
        }
      ]
    },
    {
      title: "Shopping List Features",
      items: [
        {
          question: "How do I add items to my shopping list?",
          answer: "There are three ways: 1) On the 'Shopping List' page, tap the + button and enter item details; 2) When marking an item as used on the Dashboard, choose the 'Add to Shopping List' option; 3) In the Dashboard item detail view, tap the 'Add to Shopping List' button."
        },
        {
          question: "How can I manage multiple shopping list items at once?",
          answer: "On the Shopping List page, tap the 'Select' button in the top right to enter selection mode. After selecting the items you want to manage, you can move multiple items to the main inventory or delete them all at once."
        },
        {
          question: "What happens when I check off items in my shopping list?",
          answer: "Checking an item in the shopping list indicates you've purchased it. Checked items still appear in the list but are displayed in a different style. You can use the 'Clear Checked Items' button at the bottom to remove all checked items at once."
        },
        {
          question: "How does the family size setting affect my shopping list?",
          answer: "When you turn on the 'Auto-adjust' toggle while adding items to your shopping list, the app will automatically adjust quantities based on your family size for specific categories. In the basic mode, only Meat, Seafood, Fruits & Vegetables categories will have quantities multiplied by your family size. For example, if you input 1 chicken (Meat) with a family size of 4, the app will suggest adding 4 chickens. For other categories like bread or milk, no adjustment happens regardless of family size. This feature can be toggled on/off for each item you add."
        },
        {
          question: "How do I move shopping list items to my main inventory?",
          answer: "In the shopping list, tap the 'Move to Inventory' button next to an item, or use the batch selection mode to move multiple items at once. When moving, you can set details like expiry date."
        }
      ]
    },
    {
      title: t('viewsAndFilters'),
      items: [
        {
          question: t('availableViews'),
          answer: "The app offers three views: Grid View (default, showing large cards), List View (more compact linear display), and Compact View (showing maximum items). You can switch between them by tapping the view toggle button in the top right of the Dashboard."
        },
        {
          question: "How can I group items by subcategory?",
          answer: "On the Dashboard, tap the filter button in the top right, then select the 'Group by Subcategory' option. This will group items by their subcategories (like 'Dairy', 'Meat', etc.), making it easier to manage large numbers of items."
        },
        {
          question: t('howToFilter'),
          answer: "Tap the filter button in the top right of the Dashboard, then choose which category to display (All, Food, or Household) and urgency level (All, Expiring Soon, or Expired). You can also select specific subcategories to filter items further."
        },
        {
          question: t('howToSort'),
          answer: "Tap the sort button in the top right of the Dashboard, then choose your sorting method: by name (alphabetical order), by expiry date (soonest expiring first), or by quantity (highest to lowest)."
        },
        {
          question: "Can I search for items?",
          answer: "Yes, tap the search icon or search bar at the top of the Dashboard and enter an item name or subcategory keyword. Search results will display in real-time, matching both item names and subcategories."
        }
      ]
    },
    {
      title: "Statistics and Analysis",
      items: [
        {
          question: "What information does the 'Stats' page show?",
          answer: "The Stats page displays four key metrics: the number of unique items tracked, usage efficiency percentage, units used, and units wasted. Additionally, it provides detailed analysis of category usage, category efficiency, and most frequently wasted items."
        },
        {
          question: "How can I view statistics for different time periods?",
          answer: "At the top of the Stats page, tap the timeframe dropdown menu to choose: This Month, Last Month, Last 3 Months, or Last 6 Months. All statistics will update according to the selected timeframe."
        },
        {
          question: "How is 'Usage Efficiency' calculated?",
          answer: "Usage Efficiency = (Units Used ÷ Total Tracked Units) × 100%. Total Tracked Units is the sum of Units Used and Units Wasted. This metric measures the proportion of items you use effectively (rather than waste)."
        },
        {
          question: "How can I see which items I waste most often?",
          answer: "On the Stats page, scroll down to the 'Wasted Items' card, which lists items you've marked as wasted, sorted by quantity. Tap 'Show More' to view the complete list. This helps identify items you should buy less of or manage better."
        }
      ]
    },
    {
      title: t('settingsAndPreferences'),
      items: [
        {
          question: t('changeDateFormat'),
          answer: "In the 'Settings' page under the 'Preferences' card, tap the 'Date Format' dropdown menu to select your preferred format (DD/MM/YYYY or MM/DD/YYYY)."
        },
        {
          question: t('changeLanguage'),
          answer: "In the 'Settings' page under the 'Preferences' card, tap the 'Language' dropdown menu to select your language (currently supports English, Traditional Chinese, and Simplified Chinese)."
        },
        {
          question: t('darkModeQuestion'),
          answer: "In the 'Settings' page under the 'Preferences' card, tap the switch next to 'Appearance' to enable or disable dark mode. You can also select 'Follow System' to let the app switch automatically based on your device settings."
        },
        {
          question: "What is the 'Family Size' setting and how does it affect the app?",
          answer: "The 'Family Size' setting in the 'Preferences' card of the Settings page tells the app how many people you're shopping for. When the 'Auto-adjust' feature is enabled in the shopping list, certain categories (Meat, Seafood, Fruits & Vegetables) will automatically have their quantities multiplied by your family size. For example, if you add 1 pound of beef and your family size is 4, the app will suggest 4 pounds of beef. This adjustment only happens if you enable the 'Auto-adjust' toggle for each item and only affects specific food categories. Other items (like rice or cleaning supplies) will keep the quantity you manually enter."
        },
        {
          question: "How do I set the default notification time?",
          answer: "In the 'Settings' page under the 'Default Settings' card, you can set the 'Default Notification Days', which is how many days before expiry to send notifications. This setting applies to all newly added items, but you can adjust it individually when adding or editing an item."
        }
      ]
    },
    {
      title: t('advancedFeatures'),
      items: [
        {
          question: t('cameraQuestion'),
          answer: "The barcode scanning feature allows you to quickly add items by scanning product barcodes. When adding an item, select the barcode icon and point your phone at the product barcode. If the product is in the database, relevant information will be auto-filled; otherwise, you'll need to enter it manually."
        },
        {
          question: t('voiceInputQuestion'),
          answer: t('voiceInputAnswer')
        },
        {
          question: t('statsQuestion'),
          answer: t('statsAnswer')
        },
        {
          question: "Can I share my item list with others?",
          answer: "Currently, the app doesn't support direct list sharing. However, you can indirectly share your inventory information through the data export feature. We plan to add list sharing and family sharing features in future versions."
        }
      ]
    }
  ];
  
  return (
    <div className="w-full max-w-md mx-auto p-3 pb-24">
      <div className="flex items-center justify-center gap-2 mb-4">
        <HelpCircle className="h-6 w-6 text-primary" />
        <h1 className="text-xl font-bold">{t('frequentlyAskedQuestions')}</h1>
      </div>
      
      <ScrollArea className="h-[calc(100vh-120px)]">
        <div className="space-y-2 pr-3">
          {faqCategories.map((category, categoryIndex) => (
            <div key={categoryIndex} className="rounded-lg border overflow-hidden bg-card">
              <div
                className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/30"
                onClick={() => toggleCategory(categoryIndex)}
              >
                <h2 className="font-semibold text-primary">{category.title}</h2>
                {expandedCategories[categoryIndex] ? (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              
              {expandedCategories[categoryIndex] && (
                <div className="px-3 pb-2 divide-y">
                  {category.items.map((item, itemIndex) => {
                    const itemKey = `${categoryIndex}-${itemIndex}`;
                    const isExpanded = expandedItems[itemKey];
                    
                    return (
                      <div key={itemIndex} className="py-2">
                        <div
                          className="flex items-center justify-between gap-2 cursor-pointer hover:text-primary"
                          onClick={() => toggleItem(categoryIndex, itemIndex)}
                        >
                          <h3 className="text-sm font-medium">{item.question}</h3>
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 flex-shrink-0" />
                          ) : (
                            <ChevronRight className="h-4 w-4 flex-shrink-0" />
                          )}
                        </div>
                        
                        {isExpanded && (
                          <div className="mt-2 pl-4 text-sm text-muted-foreground">
                            {item.answer}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default FAQ;