import React, { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useTranslation } from '@/utils/translations';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQCategory {
  title: string;
  items: FAQItem[];
}

interface FAQContentProps {
  maxHeight?: string;
  showHeader?: boolean;
  compact?: boolean;
}

const FAQContent: React.FC<FAQContentProps> = ({ 
  maxHeight = "h-[calc(100vh-120px)]",
  showHeader = true,
  compact = false
}) => {
  const { language } = useApp();
  const t = useTranslation(language);
  
  // Track expanded FAQ categories and items
  const [expandedCategories, setExpandedCategories] = useState<Record<number, boolean>>({
    0: true, // Default: expand the first category
  });
  
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  
  // Toggle category expand/collapse state
  const toggleCategory = (index: number) => {
    setExpandedCategories(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };
  
  // Toggle question expand/collapse state
  const toggleItem = (categoryIndex: number, itemIndex: number) => {
    const key = `${categoryIndex}-${itemIndex}`;
    setExpandedItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };
  
  // FAQ content - can be adjusted based on current language
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
          answer: "When adding items to your shopping list, the app automatically adjusts suggested purchase quantities based on your family size setting. For example, categories like 'Meat', 'Seafood', and 'Fruits & Vegetables' will increase proportionally with family size. If you subscribe to the premium version, you can customize multipliers for each subcategory."
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
          answer: "The 'Family Size' setting is located in the 'Preferences' card of the Settings page. It primarily affects the shopping list feature, automatically adjusting suggested purchase quantities based on family size. For example, a family of 4 might need more meat or vegetables than a single person."
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
          answer: "Voice input lets you add items by speaking, especially useful for adding multiple items at once. When adding an item, select the microphone icon, then clearly state the item name and quantity (e.g., 'two boxes of milk'). The system will attempt to recognize and fill in the relevant information."
        },
        {
          question: "How do I use the batch selection mode?",
          answer: "On the Dashboard, tap the 'Select' button in the top right to enable batch selection mode. After selecting the items you want to operate on, action buttons appear at the bottom: Mark as Used, Mark as Wasted, or Delete. This is very useful for managing multiple items at once."
        },
        {
          question: "Can I share my item list with others?",
          answer: "Currently, the app doesn't support direct list sharing. However, you can indirectly share your inventory information through the data export feature. We plan to add list sharing and family sharing features in future versions."
        }
      ]
    },
    {
      title: t('dataManagement'),
      items: [
        {
          question: t('exportQuestion'),
          answer: "In the 'Settings' page under the 'Data Management' card, tap the 'Export Data' button. The system will generate a JSON file containing all your items and settings, which you can save as a backup."
        },
        {
          question: t('importQuestion'),
          answer: "In the 'Settings' page under the 'Data Management' card, tap the 'Import Data' button, then select a previously exported JSON file. Note: Importing will overwrite all current data, so it's recommended to export your current data as a backup first."
        },
        {
          question: t('dataStorageQuestion'),
          answer: "Your data is primarily stored locally on your device. If you sign in to an account, data will be synced to the cloud for use across multiple devices. We use encryption to keep your data secure."
        },
        {
          question: "How do I transfer my data if I get a new phone?",
          answer: "There are two methods: 1) If you've signed in to an account, simply sign in to the same account on your new device and your data will sync automatically; 2) If not using an account, use the 'Export Data' feature on your old device, then use 'Import Data' on your new device."
        },
        {
          question: "How does WhatsLeft handle my privacy?",
          answer: "We value your privacy. WhatsLeft collects only the minimum necessary information, primarily used to provide services and improve user experience. All item data is stored with encryption and is not shared with third parties. See the Privacy Policy in the Settings page for details."
        }
      ]
    }
  ];
  
  return (
    <div className="w-full">
      <ScrollArea className={maxHeight}>
        <div className={`${compact ? 'space-y-1' : 'space-y-2'} pr-3`}>
          {faqCategories.map((category, categoryIndex) => (
            <div key={categoryIndex} className="rounded-lg border overflow-hidden bg-card">
              <div
                className={`flex items-center justify-between ${compact ? 'p-2' : 'p-3'} cursor-pointer hover:bg-muted/30`}
                onClick={() => toggleCategory(categoryIndex)}
              >
                <h2 className={`font-semibold text-primary ${compact ? 'text-sm' : ''}`}>{category.title}</h2>
                {expandedCategories[categoryIndex] ? (
                  <ChevronDown className={`${compact ? 'h-4 w-4' : 'h-5 w-5'} text-muted-foreground`} />
                ) : (
                  <ChevronRight className={`${compact ? 'h-4 w-4' : 'h-5 w-5'} text-muted-foreground`} />
                )}
              </div>
              
              {expandedCategories[categoryIndex] && (
                <div className={`${compact ? 'px-2' : 'px-3'} pb-2 divide-y`}>
                  {category.items.map((item, itemIndex) => {
                    const itemKey = `${categoryIndex}-${itemIndex}`;
                    const isExpanded = expandedItems[itemKey];
                    
                    return (
                      <div key={itemIndex} className={`${compact ? 'py-1.5' : 'py-2'}`}>
                        <div
                          className="flex items-center justify-between gap-2 cursor-pointer hover:text-primary"
                          onClick={() => toggleItem(categoryIndex, itemIndex)}
                        >
                          <h3 className={`${compact ? 'text-xs' : 'text-sm'} font-medium`}>{item.question}</h3>
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 flex-shrink-0" />
                          ) : (
                            <ChevronRight className="h-4 w-4 flex-shrink-0" />
                          )}
                        </div>
                        
                        {isExpanded && (
                          <div className={`mt-2 pl-4 ${compact ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
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

export default FAQContent;
export type { FAQItem, FAQCategory };