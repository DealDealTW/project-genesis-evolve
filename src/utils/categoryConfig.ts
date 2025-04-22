import { ItemCategory } from '../contexts/AppContext';

// 詳細的食品子分類及其默認過期天數
export interface CategoryConfig {
  name: {
    en: string;
    'zh-TW': string;
    'zh-CN': string;
  };
  defaultExpiryDays: number;
  keywordMatches: string[]; // 關鍵詞匹配，用於自動識別
}

// 各類別的子分類
export interface SubcategoriesConfig {
  [key: string]: CategoryConfig[];
}

// 主要商品類別配置 - 僅使用'Food'和'Household'作為鍵
export const categorySubcategories: SubcategoriesConfig = {
  'Food': [
    {
      name: {
        en: 'Meat',
        'zh-TW': '肉類',
        'zh-CN': '肉类'
      },
      defaultExpiryDays: 5,
      keywordMatches: ['meat', 'beef', 'pork', 'chicken', 'lamb', 'duck', 'turkey', 'goose', 'steak', 'sausage', 'bacon', 'ham', 'venison', '肉', '牛肉', '豬肉', '猪肉', '雞肉', '鸡肉', '羊肉', '鴨肉', '鸭肉', '火雞', '火鸡', '鵝肉', '鹅肉', '牛排', '香腸', '香肠', '培根', '火腿', '鹿肉']
    },
    {
      name: {
        en: 'Seafood',
        'zh-TW': '海鮮',
        'zh-CN': '海鲜'
      },
      defaultExpiryDays: 3,
      keywordMatches: ['fish', 'seafood', 'prawn', 'shrimp', 'crab', 'lobster', 'salmon', 'tuna', 'cod', 'squid', 'octopus', 'scallop', 'oyster', 'mussel', 'clam', 'tilapia', 'trout', '魚', '鱼', '海鮮', '海鲜', '蝦', '虾', '蟹', '龍蝦', '龙虾', '鮭魚', '三文鱼', '鮪魚', '金枪鱼', '鱈魚', '鳕鱼', '魷魚', '鱿鱼', '章魚', '章鱼', '扇貝', '扇贝', '牡蠣', '牡蛎', '貽貝', '贻贝', '蛤蜊', '鯛魚', '鯽魚']
    },
    {
      name: {
        en: 'Eggs',
        'zh-TW': '雞蛋',
        'zh-CN': '鸡蛋'
      },
      defaultExpiryDays: 14,
      keywordMatches: ['egg', 'eggs', 'chicken egg', 'duck egg', 'quail egg', '蛋', '雞蛋', '鸡蛋', '鴨蛋', '鸭蛋', '鵪鶉蛋', '鹌鹑蛋', '茶葉蛋', '茶叶蛋', '皮蛋', '松花蛋', '鹹蛋', '咸蛋']
    },
    {
      name: {
        en: 'Dairy',
        'zh-TW': '乳製品',
        'zh-CN': '乳制品'
      },
      defaultExpiryDays: 7,
      keywordMatches: ['milk', 'yogurt', 'cheese', 'butter', 'sour cream', 'cottage cheese', 'cream cheese', 'whipped cream', 'heavy cream', 'light cream', 'half and half', 'kefir', 'custard', 'pudding', 'buttermilk', 'margarine', '牛奶', '奶油', '優格', '酸奶', '起司', '奶酪', '黃油', '黄油', '酸奶油', '茅屋起司', '奶油起司', '奶油奶酪', '鮮奶油', '鲜奶油', '淡奶油', '一半一半', '克菲爾', '卡士達', '布丁', '酪乳', '人造黃油', '人造黄油']
    },
    {
      name: {
        en: 'Fruits & Vegetables',
        'zh-TW': '水果和蔬菜',
        'zh-CN': '水果和蔬菜'
      },
      defaultExpiryDays: 7,
      keywordMatches: ['fruit', 'vegetable', 'apple', 'banana', 'orange', 'carrot', 'salad', 'potato', 'potatoes', 'tomato', 'lettuce', 'cabbage', 'onion', 'garlic', 'ginger', 'pepper', 'cucumber', 'broccoli', 'cauliflower', 'corn', 'pea', 'bean', 'spinach', 'kale', 'eggplant', 'avocado', 'strawberry', 'blueberry', 'raspberry', 'blackberry', 'grape', 'melon', 'watermelon', 'cantaloupe', 'pineapple', 'mango', 'papaya', 'peach', 'plum', 'cherry', 'pear', 'kiwi', 'lemon', 'lime', 'grapefruit', 'pomegranate', 'fig', 'date', 'coconut', 'radish', 'celery', 'asparagus', 'artichoke', 'mushroom', 'zucchini', 'pumpkin', 'squash', 'sweet potato', 'yam', 'leek', 'shallot', 'scallion', 'spring onion', 'beet', 'turnip', 'parsnip', 'okra', 'watercress', 'arugula', 'rocket', 'bok choy', 'chard', 'collard', 'brussels sprout', '水果', '蔬菜', '蘋果', '苹果', '香蕉', '橙子', '胡蘿蔔', '胡萝卜', '沙拉', '馬鈴薯', '土豆', '番茄', '西紅柿', '生菜', '高麗菜', '包菜', '洋蔥', '洋葱', '大蒜', '生薑', '生姜', '辣椒', '黃瓜', '黄瓜', '花椰菜', '西蘭花', '西兰花', '玉米', '豌豆', '豆子', '菠菜', '羽衣甘藍', '羽衣甘蓝', '茄子', '酪梨', '牛油果', '草莓', '藍莓', '蓝莓', '覆盆子', '黑莓', '葡萄', '哈密瓜', '西瓜', '蜜瓜', '鳳梨', '凤梨', '芒果', '木瓜', '桃子', '李子', '櫻桃', '樱桃', '梨', '奇異果', '猕猴桃', '檸檬', '柠檬', '酸橙', '葡萄柚', '石榴', '無花果', '无花果', '棗子', '枣子', '椰子', '蘿蔔', '萝卜', '芹菜', '蘆筍', '芦笋', '朝鮮薊', '蘑菇', '香菇', '西葫蘆', '南瓜', '冬瓜', '地瓜', '山芋', '韭蔥', '韭葱', '紅蘿蔔', '紅萝卜', '春天洋蔥', '甜菜', '蕪菁', '芋頭', '芋头', '羊角豆', '豆苗', '芝麻菜', '芥菜', '小白菜', '甜菜', '甘藍菜', '甘蓝菜', '抱子甘藍', '抱子甘蓝']
    },
    {
      name: {
        en: 'Bakery',
        'zh-TW': '麵包烘焙',
        'zh-CN': '面包烘焙'
      },
      defaultExpiryDays: 5,
      keywordMatches: ['bread', 'cake', 'pastry', 'bun', 'roll', 'bagel', 'croissant', 'donut', 'muffin', 'scone', 'pie', 'tart', 'cookie', 'brownie', 'waffle', 'pancake', 'biscuit', 'cupcake', 'pretzel', 'baguette', 'brioche', 'ciabatta', 'focaccia', 'tortilla', 'wrap', 'danish', 'strudel', 'macaroon', '麵包', '面包', '蛋糕', '甜點', '甜点', '糕點', '糕点', '麵包卷', '面包卷', '貝果', '贝果', '可頌', '可颂', '甜甜圈', '馬芬', '马芬', '司康', '派', '塔', '餅乾', '饼干', '布朗尼', '華夫餅', '华夫饼', '鬆餅', '松饼', '餅乾', '饼干', '紙杯蛋糕', '纸杯蛋糕', '椒鹽捲餅', '椒盐卷饼', '法棍', '布里歐修', '布里欧修', '恰巴塔', '佛卡夏', '玉米餅', '玉米饼', '捲餅', '卷饼', '丹麥酥', '丹麦酥', '果醬餡餅', '果酱馅饼', '杏仁酥餅', '杏仁酥饼']
    },
    {
      name: {
        en: 'Pantry Items',
        'zh-TW': '乾貨食品',
        'zh-CN': '干货食品'
      },
      defaultExpiryDays: 180,
      keywordMatches: ['rice', 'pasta', 'noodle', 'cereal', 'canned goods', 'grain', 'bean', 'lentil', 'chickpea', 'flour', 'sugar', 'salt', 'spice', 'dried spice', 'dried herb', 'dried', 'instant', 'ramen', 'udon', 'soba', 'couscous', 'quinoa', 'oat', 'barley', 'corn meal', 'cornstarch', 'baking powder', 'baking soda', 'canned tomato', 'canned tuna', 'canned fruit', 'dried fruit', 'canned bean', 'dried bean', 'raisin', 'nut', 'peanut', 'walnut', 'almond', 'cashew', 'hazelnut', 'pecan', 'pistachio', 'seed', 'sunflower seed', 'pumpkin seed', 'chia seed', 'flax seed', '米', '米飯', '米饭', '義大利麵', '意大利面', '麵條', '面条', '麥片', '麦片', '罐頭食品', '罐头食品', '穀物', '谷物', '豆子', '小扁豆', '鷹嘴豆', '鹰嘴豆', '麵粉', '面粉', '糖', '鹽', '盐', '香料', '乾燥香料', '乾燥香草', '乾燥', '干燥', '即食', '速食', '拉麵', '拉面', '烏冬麵', '乌冬面', '蕎麥麵', '荞麦面', '玉米粉', '玉米澱粉', '玉米淀粉', '泡打粉', '小蘇打', '小苏打', '罐裝番茄', '罐装番茄', '罐裝金槍魚', '罐装金枪鱼', '罐裝水果', '罐装水果', '乾果', '干果', '罐裝豆子', '罐装豆子', '乾豆', '干豆', '葡萄乾', '葡萄干', '堅果', '坚果', '花生', '核桃', '杏仁', '腰果', '榛子', '胡桃', '開心果', '开心果', '種子', '种子', '向日葵籽', '葵花籽', '南瓜籽', '奇亞籽', '亚麻籽']
    },
    {
      name: {
        en: 'Condiments & Sauces',
        'zh-TW': '調味品和醬料',
        'zh-CN': '调味品和酱料'
      },
      defaultExpiryDays: 180,
      keywordMatches: ['condiment', 'sauce', 'ketchup', 'mustard', 'jam', 'honey', 'cooking oil', 'olive oil', 'vegetable oil', 'sesame oil', 'vinegar', 'dressing', 'mayonnaise', 'soy sauce', 'hot sauce', 'bbq sauce', 'teriyaki', 'pesto', 'salsa', 'guacamole', 'hummus', 'tahini', 'miso', 'wasabi', 'horseradish', 'pickle', 'relish', 'chutney', 'maple syrup', 'molasses', 'peanut butter', 'almond butter', 'nutella', 'chocolate syrup', 'caramel sauce', 'vanilla extract', 'coconut oil', 'fish sauce', 'oyster sauce', 'hoisin sauce', 'sriracha', 'tabasco', '調味品', '酱料', '醬油', '酱油', '番茄醬', '番茄酱', '果醬', '果酱', '蜂蜜', '食用油', '橄欖油', '橄榄油', '植物油', '芝麻油', '醋', '沙拉醬', '沙拉酱', '美乃滋', '蛋黃醬', '蛋黄酱', '醬油', '辣醬', '辣酱', '燒烤醬', '烧烤酱', '照燒醬', '照烧酱', '羅勒青醬', '罗勒青酱', '莎莎醬', '莎莎酱', '酪梨醬', '鷹嘴豆泥', '鹰嘴豆泥', '芝麻醬', '芝麻酱', '味噌', '山葵', '辣根', '泡菜', '醃黃瓜', '腌黄瓜', '甜酸醬', '甜酸酱', '酸辣醬', '酸辣酱', '楓糖漿', '枫糖浆', '糖蜜', '花生醬', '花生酱', '杏仁醬', '杏仁酱', '巧克力醬', '巧克力酱', '焦糖醬', '焦糖酱', '香草精', '椰子油', '魚露', '鱼露', '蠔油', '蚝油', '海鮮醬', '海鲜酱', '是拉差醬', '是拉差酱', '塔巴斯科醬', '塔巴斯科酱']
    },
    {
      name: {
        en: 'Frozen Foods',
        'zh-TW': '冷凍食品',
        'zh-CN': '冷冻食品'
      },
      defaultExpiryDays: 90,
      keywordMatches: ['frozen', 'ice cream', 'freezer', 'frozen pizza', 'frozen meal', 'frozen vegetable', 'frozen fruit', 'frozen fish', 'frozen meat', 'frozen chicken', 'frozen beef', 'frozen pork', 'frozen dinner', 'frozen breakfast', 'ice cube', 'popsicle', 'sorbet', 'frozen yogurt', 'frozen dessert', 'frozen appetizer', 'frozen snack', 'frozen dumpling', 'frozen wonton', 'frozen dim sum', '冷凍', '冷冻', '冰淇淋', '冷藏', '冷凍披薩', '冷冻披萨', '冷凍餐點', '冷冻餐点', '冷凍蔬菜', '冷冻蔬菜', '冷凍水果', '冷冻水果', '冷凍魚', '冷冻鱼', '冷凍肉', '冷冻肉', '冷凍雞肉', '冷冻鸡肉', '冷凍牛肉', '冷冻牛肉', '冷凍豬肉', '冷冻猪肉', '冷凍晚餐', '冷冻晚餐', '冷凍早餐', '冷冻早餐', '冰塊', '冰块', '冰棒', '雪糕', '冰沙', '冷凍優格', '冷冻酸奶', '冷凍甜點', '冷冻甜点', '冷凍開胃菜', '冷冻开胃菜', '冷凍點心', '冷冻点心', '冷凍餃子', '冷冻饺子', '冷凍雲吞', '冷冻云吞', '冷凍點心', '冷冻点心']
    },
    {
      name: {
        en: 'Beverages',
        'zh-TW': '飲料',
        'zh-CN': '饮料'
      },
      defaultExpiryDays: 14,
      keywordMatches: ['juice', 'soda', 'drink', 'water', 'beer', 'wine', 'coffee', 'tea', 'milk', 'smoothie', 'shake', 'cocktail', 'spirit', 'liquor', 'whiskey', 'vodka', 'rum', 'gin', 'tequila', 'brandy', 'champagne', 'prosecco', 'cider', 'kombucha', 'lemonade', 'cola', 'energy drink', 'sports drink', 'sparkling water', 'mineral water', 'coconut water', 'almond milk', 'soy milk', 'rice milk', 'oat milk', 'chocolate milk', 'milkshake', '果汁', '蘇打', '苏打', '飲料', '饮料', '水', '啤酒', '葡萄酒', '咖啡', '茶', '牛奶', '果昔', '奶昔', '雞尾酒', '鸡尾酒', '烈酒', '威士忌', '伏特加', '朗姆酒', '琴酒', '龍舌蘭', '龙舌兰', '白蘭地', '白兰地', '香檳', '香槟', '普羅塞克', '苹果酒', '康普茶', '檸檬水', '柠檬水', '可樂', '可乐', '能量飲料', '能量饮料', '運動飲料', '运动饮料', '氣泡水', '气泡水', '礦泉水', '矿泉水', '椰子水', '杏仁奶', '豆漿', '豆浆', '米漿', '米浆', '燕麥奶', '燕麦奶', '巧克力奶', '奶昔']
    },
    {
      name: {
        en: 'Snacks',
        'zh-TW': '零食',
        'zh-CN': '零食'
      },
      defaultExpiryDays: 60,
      keywordMatches: ['snack', 'chips', 'cookie', 'chocolate', 'candy', 'cracker', 'popcorn', 'pretzel', 'nut mix', 'trail mix', 'granola bar', 'energy bar', 'protein bar', 'cereal bar', 'rice cake', 'fruit snack', 'dried fruit', 'beef jerky', 'pork rinds', 'cheese puff', 'corn chip', 'tortilla chip', 'potato chip', 'gummy', 'hard candy', 'chewing gum', 'caramel', 'lollipop', 'marshmallow', 'licorice', 'jelly bean', 'toffee', 'fudge', 'brittle', 'truffle', '零食', '薯片', '餅乾', '饼干', '巧克力', '糖果', '蘇打餅', '苏打饼', '爆米花', '椒鹽捲餅', '椒盐卷饼', '堅果混合', '坚果混合', '能量棒', '蛋白質棒', '蛋白质棒', '穀物棒', '谷物棒', '米餅', '米饼', '水果零食', '乾果', '干果', '牛肉乾', '牛肉干', '豬皮', '猪皮', '起司泡芙', '奶酪泡芙', '玉米片', '玉米饼', '薯片', '軟糖', '软糖', '硬糖', '口香糖', '焦糖', '棒棒糖', '棉花糖', '甘草', '糖豆', '太妃糖', '乳脂軟糖', '乳脂软糖', '糖衣杏仁', '松脆糖', '松脆糖', '巧克力松露', '巧克力松露']
    },
    {
      name: {
        en: 'Other Food',
        'zh-TW': '其他食品',
        'zh-CN': '其他食品'
      },
      defaultExpiryDays: 30,
      keywordMatches: []
    }
  ],
  'Household': [
    {
      name: {
        en: 'Cleaning Supplies',
        'zh-TW': '清潔用品',
        'zh-CN': '清洁用品'
      },
      defaultExpiryDays: 365,
      keywordMatches: ['cleaner', 'detergent', 'soap', 'cleaning', 'bleach', 'disinfectant', 'sanitizer', 'wipe', 'sponge', 'brush', 'vacuum', 'mop', 'broom', 'dustpan', 'duster', 'polish', 'stain remover', 'fabric softener', 'air freshener', 'odor eliminator', 'pest control', 'insect repellent', 'laundry', 'dishwasher', 'toilet bowl cleaner', 'window cleaner', 'floor cleaner', 'carpet cleaner', 'all purpose cleaner', 'kitchen cleaner', 'bathroom cleaner', 'drain cleaner', 'oven cleaner', 'furniture polish', 'shoe polish', 'cleaning supplies', 'supplies', 'cleaning tools', 'cleaning equipment', 'cleaning product', 'cleaning agent', 'laundry detergent', '清潔', '清洁', '洗潔精', '洗洁精', '肥皂', '清潔劑', '清洁剂', '漂白劑', '漂白剂', '消毒劑', '消毒剂', '消毒液', '抹布', '海綿', '海绵', '刷子', '吸塵器', '吸尘器', '拖把', '掃把', '扫把', '畚箕', '撢子', '抹布', '除漬劑', '除渍剂', '柔順劑', '柔顺剂', '空氣清新劑', '空气清新剂', '除臭劑', '除臭剂', '除蟲劑', '除虫剂', '驅蟲劑', '驱虫剂', '洗衣', '洗碗機', '洗碗机', '馬桶清潔劑', '马桶清洁剂', '窗戶清潔劑', '窗户清洁剂', '地板清潔劑', '地板清洁剂', '地毯清潔劑', '地毯清洁剂', '多用途清潔劑', '多用途清洁剂', '廚房清潔劑', '厨房清洁剂', '浴室清潔劑', '浴室清洁剂', '排水管清潔劑', '排水管清洁剂', '烤箱清潔劑', '烤箱清洁剂', '家具拋光劑', '家具抛光剂', '鞋油', '清潔用品', '清洁用品', '清潔工具', '清洁工具', '清潔設備', '清洁设备', '清潔產品', '清洁产品', '清潔劑', '清洁剂', '洗衣粉', '洗衣液']
    },
    {
      name: {
        en: 'Personal Care',
        'zh-TW': '個人護理',
        'zh-CN': '个人护理'
      },
      defaultExpiryDays: 365,
      keywordMatches: ['shampoo', 'conditioner', 'hair wash', 'hair care', 'toothpaste', 'lotion', 'body lotion', 'hand cream', 'face cream', 'moisturizer', 'cosmetic', 'soap', 'hand soap', 'bar soap', 'body wash', 'shower gel', 'deodorant', 'antiperspirant', 'face wash', 'face cleanser', 'face mask', 'sunscreen', 'sunblock', 'after sun', 'lip balm', 'chapstick', 'makeup', 'foundation', 'concealer', 'mascara', 'eyeliner', 'eyeshadow', 'lipstick', 'lip gloss', 'blush', 'bronzer', 'highlighter', 'nail polish', 'nail polish remover', 'razor', 'shaving cream', 'shaving gel', 'aftershave', 'perfume', 'cologne', 'hairspray', 'hair gel', 'hair wax', 'mousse', 'pomade', 'dental floss', 'mouthwash', 'toothbrush', 'contact lens solution', 'feminine product', 'sanitary pad', 'tampon', 'pad', 'hand sanitizer', 'foot care', 'cotton swab', 'q-tip', 'cotton ball', 'tissue', 'facial tissue', '洗髮精', '洗发水', '護髮素', '护发素', '洗髮', '洗发', '護髮', '护发', '牙膏', '乳液', '身體乳', '身体乳', '護手霜', '护手霜', '面霜', '保濕霜', '保湿霜', '化妝品', '化妆品', '香皂', '洗手液', '肥皂', '沐浴露', '淋浴露', '除臭劑', '除臭剂', '止汗劑', '止汗剂', '洗面乳', '洗面奶', '面膜', '防曬霜', '防晒霜', '曬後修復', '晒后修复', '唇膏', '口紅', '口红', '妝前乳', '妆前乳', '粉底', '遮瑕', '睫毛膏', '眼線筆', '眼线笔', '眼影', '脣膏', '脣彩', '腮紅', '腮红', '古銅粉', '古铜粉', '提亮液', '指甲油', '卸甲水', '刮鬍刀', '刮胡刀', '刮鬍膏', '刮胡膏', '鬍後水', '胡后水', '香水', '古龍水', '古龙水', '髮膠', '发胶', '髮蠟', '发蜡', '慕斯', '髮油', '发油', '牙線', '牙线', '漱口水', '牙刷', '隱形眼鏡藥水', '隐形眼镜药水', '女性用品', '衛生棉', '卫生棉', '衛生棉條', '卫生棉条', '衛生巾', '卫生巾', '洗手液', '搓手液', '足部護理', '足部护理', '棉花棒', '棉签', '棉球', '面紙', '面巾纸']
    },
    {
      name: {
        en: 'Medicine & Supplements',
        'zh-TW': '藥品和補充劑',
        'zh-CN': '药品和补充剂'
      },
      defaultExpiryDays: 365,
      keywordMatches: ['medicine', 'drug', 'pill', 'supplement', 'vitamin', 'painkiller', 'aspirin', 'ibuprofen', 'acetaminophen', 'antibiotic', 'antihistamine', 'decongestant', 'cough syrup', 'cold medicine', 'flu medicine', 'allergy medicine', 'band aid', 'bandage', 'gauze', 'antiseptic', 'ointment', 'cream', 'first aid', 'thermometer', 'multivitamin', 'calcium', 'iron', 'fish oil', 'omega 3', 'probiotic', 'protein powder', 'fiber supplement', 'sleep aid', 'melatonin', 'digestive aid', 'antacid', 'laxative', 'stool softener', 'prescription', '藥', '药', '藥品', '药品', '維生素', '维生素', '補充劑', '补充剂', '止痛藥', '止痛药', '阿司匹林', '布洛芬', '對乙酰氨基酚', '对乙酰氨基酚', '抗生素', '抗組織胺', '抗组织胺', '減充血劑', '减充血剂', '止咳糖漿', '止咳糖浆', '感冒藥', '感冒药', '流感藥', '流感药', '過敏藥', '过敏药', '創可貼', '创可贴', '繃帶', '绷带', '紗布', '纱布', '消毒劑', '消毒剂', '藥膏', '药膏', '乳霜', '急救箱', '體溫計', '体温计', '複合維生素', '复合维生素', '鈣', '钙', '鐵', '铁', '魚油', '鱼油', '歐米伽3', '欧米伽3', '益生菌', '蛋白質粉', '蛋白质粉', '纖維補充劑', '纤维补充剂', '助眠劑', '助眠剂', '褪黑激素', '消化劑', '消化剂', '制酸劑', '制酸剂', '瀉藥', '泻药', '大便軟化劑', '大便软化剂', '處方藥', '处方药']
    },
    {
      name: {
        en: 'Paper Products',
        'zh-TW': '紙製品',
        'zh-CN': '纸制品'
      },
      defaultExpiryDays: 730,
      keywordMatches: ['tissue', 'toilet paper', 'paper towel', 'napkin', 'facial tissue', 'wipe', 'kitchen roll', 'toilet roll', 'paper plate', 'paper cup', 'paper bowl', 'paper bag', 'wrapping paper', 'parchment paper', 'wax paper', 'aluminum foil', 'plastic wrap', 'cling film', 'freezer paper', 'butcher paper', 'baking paper', 'filter paper', 'coffee filter', 'gift wrap', 'greeting card', 'notebook', 'sticky note', 'note pad', 'envelope', 'label', 'sticker', '紙巾', '纸巾', '衛生紙', '卫生纸', '廚房紙巾', '厨房纸巾', '餐巾紙', '餐巾纸', '面紙', '面巾纸', '濕紙巾', '湿纸巾', '廚房紙卷', '厨房纸卷', '衛生紙卷', '卫生纸卷', '紙盤', '纸盘', '紙杯', '纸杯', '紙碗', '纸碗', '紙袋', '纸袋', '包裝紙', '包装纸', '羊皮紙', '羊皮纸', '蠟紙', '蜡纸', '鋁箔紙', '铝箔纸', '保鮮膜', '保鲜膜', '保鮮紙', '保鲜纸', '冷凍紙', '冷冻纸', '屠夫紙', '屠夫纸', '烘焙紙', '烘焙纸', '過濾紙', '过滤纸', '咖啡濾紙', '咖啡滤纸', '禮品包裝紙', '礼品包装纸', '賀卡', '贺卡', '筆記本', '笔记本', '便利貼', '便利贴', '便條紙', '便条纸', '信封', '標籤', '标签', '貼紙', '贴纸']
    },
    {
      name: {
        en: 'Batteries & Electronics',
        'zh-TW': '電池和電子產品',
        'zh-CN': '电池和电子产品'
      },
      defaultExpiryDays: 730,
      keywordMatches: ['battery', 'electronic', 'charger', 'cable', 'adapter', 'power bank', 'usb', 'flash drive', 'memory card', 'sd card', 'headphone', 'earphone', 'earbud', 'speaker', 'mouse', 'keyboard', 'webcam', 'microphone', 'camera', 'cell phone', 'smartphone', 'tablet', 'laptop', 'computer', 'monitor', 'tv', 'remote control', 'game controller', 'printer', 'scanner', 'light bulb', 'lamp', 'extension cord', 'power strip', 'surge protector', 'router', 'modem', 'electric toothbrush', 'electric razor', 'hair dryer', 'curling iron', 'straightener', 'watch', 'alarm clock', 'calculator', '電池', '电池', '電子', '电子', '充電器', '充电器', '電纜', '电缆', '適配器', '适配器', '轉接頭', '转接头', '移動電源', '移动电源', '充電寶', '充电宝', '隨身碟', '随身碟', '記憶卡', '记忆卡', '儲存卡', '储存卡', '耳機', '耳机', '藍牙耳機', '蓝牙耳机', '耳塞', '音箱', '滑鼠', '鼠标', '鍵盤', '键盘', '攝像頭', '摄像头', '麥克風', '麦克风', '相機', '相机', '手機', '手机', '智能手機', '智能手机', '平板電腦', '平板电脑', '筆記本電腦', '笔记本电脑', '電腦', '电脑', '顯示器', '显示器', '電視', '电视', '遙控器', '遥控器', '遊戲控制器', '游戏控制器', '印表機', '打印机', '掃描儀', '扫描仪', '燈泡', '灯泡', '燈', '灯', '延長線', '延长线', '電源插座', '电源插座', '插線板', '插线板', '防浪湧保護器', '防浪涌保护器', '路由器', '調製解調器', '调制解调器', '電動牙刷', '电动牙刷', '電動剃須刀', '电动剃须刀', '吹風機', '吹风机', '捲髮棒', '卷发棒', '直髮器', '直发器', '手錶', '手表', '鬧鐘', '闹钟', '計算器', '计算器']
    },
    {
      name: {
        en: 'Other Household',
        'zh-TW': '其他家居用品',
        'zh-CN': '其他家居用品'
      },
      defaultExpiryDays: 365,
      keywordMatches: ['toilet', 'bathroom', 'bathroom fixture', 'shower', 'bathtub', 'sink', 'faucet', 'door handle', 'door knob', 'door lock', 'cabinet', 'drawer', 'curtain', 'blind', 'shade', 'rug', 'doormat', 'pillow', 'cushion', 'blanket', 'throw', 'towel', 'hanger', 'storage bin', 'storage box', 'trash can', 'garbage bin', 'waste basket', '馬桶', '厕所', '衛浴', '卫浴', '淋浴', '浴缸', '水槽', '水龍頭', '水龙头', '門把手', '门把手', '門鎖', '门锁', '抽屜', '抽屉', '窗簾', '窗帘', '地毯', '門墊', '门垫', '枕頭', '枕头', '坐墊', '坐垫', '毯子', '被子', '毛巾', '衣架', '收納箱', '收纳箱', '垃圾桶', '廢紙簍', '废纸篓']
    }
  ]
};

/**
 * 根據商品名稱檢測主類別和子類別
 * @param itemName 商品名稱
 * @returns 包含主類別和子類別配置的物件，如果找不到則返回 null
 */
export const detectCategoryAndSubcategoryByName = (
  itemName: string
): { category: 'Food' | 'Household'; subcategory: CategoryConfig } | null => {
  if (!itemName) {
    return null;
  }
  
  // 拓展中文特別處理關鍵詞 - 添加更多家居用品關鍵詞
  const chineseSpecialKeywords: Record<string, 'Food' | 'Household'> = {
    // 現有食品關鍵詞
    '牛肉': 'Food',
    '豬肉': 'Food',
    '猪肉': 'Food',
    '雞肉': 'Food',
    '鸡肉': 'Food',
    '魚': 'Food',
    '鱼': 'Food',
    '蝦': 'Food',
    '虾': 'Food',
    '蔬菜': 'Food',
    '水果': 'Food',
    '米飯': 'Food',
    '米饭': 'Food',
    '麵包': 'Food',
    '面包': 'Food',
    '雞蛋': 'Food',
    '鸡蛋': 'Food',
    '鴨蛋': 'Food',
    '鸭蛋': 'Food',
    '茶葉': 'Food',
    '茶叶': 'Food',
    '餅乾': 'Food',
    '饼干': 'Food',
    '巧克力': 'Food',
    '糖果': 'Food',
    '堅果': 'Food',
    '坚果': 'Food',
    '薯片': 'Food',
    '洋芋片': 'Food',
    
    // 擴展家居用品關鍵詞
    '清潔': 'Household',
    '清洁': 'Household',
    '洗滌': 'Household',
    '洗涤': 'Household',
    '洗髮': 'Household',
    '洗发': 'Household',
    '沐浴': 'Household',
    '洗衣': 'Household',
    '衛生紙': 'Household',
    '卫生纸': 'Household',
    '電池': 'Household',
    '电池': 'Household',
    '燈泡': 'Household',
    '灯泡': 'Household',
    '傢俱': 'Household',
    '家具': 'Household',
    '家電': 'Household',
    '家电': 'Household',
    '廚具': 'Household',
    '厨具': 'Household',
    '餐具': 'Household',
    '衣架': 'Household',
    '掛鉤': 'Household',
    '挂钩': 'Household',
    '洗潔精': 'Household',
    '洗洁精': 'Household',
    '洗衣粉': 'Household',
    '洗衣液': 'Household',
    '清潔劑': 'Household',
    '清洁剂': 'Household',
    '紙巾': 'Household',
    '纸巾': 'Household',
    '餐巾紙': 'Household',
    '餐巾纸': 'Household',
    '工具': 'Household',
    '螺絲刀': 'Household',
    '螺丝刀': 'Household',
    '扳手': 'Household',
    '鐵錘': 'Household',
    '铁锤': 'Household',
    '釘子': 'Household',
    '钉子': 'Household',
    '膠帶': 'Household',
    '胶带': 'Household',
    '膠水': 'Household',
    '胶水': 'Household',
    '文具': 'Household',
    '筆': 'Household',
    '笔': 'Household',
    '橡皮': 'Household',
    '剪刀': 'Household',
    '打印紙': 'Household',
    '打印纸': 'Household'
  };
  
  // 檢查中文特殊關鍵詞
  for (const [keyword, category] of Object.entries(chineseSpecialKeywords)) {
    if (itemName.toLowerCase().includes(keyword.toLowerCase())) {
      console.log(`中文關鍵詞匹配: ${itemName} 包含 ${keyword}, 分類為 ${category}`);
      // 獲取默認子類別
      const subcategories = categorySubcategories[category];
      for (const subcategory of subcategories) {
        if (subcategory.keywordMatches.some(kw => 
            kw.toLowerCase() === keyword.toLowerCase() || 
            keyword.toLowerCase().includes(kw.toLowerCase()) || 
            kw.toLowerCase().includes(keyword.toLowerCase())
        )) {
          return { category, subcategory };
        }
      }
      // 如果找不到精確匹配的子類別，返回該類別的第一個非"其他"子類別
      for (const subcategory of subcategories) {
        if (subcategory.name.en !== 'Other Food' && subcategory.name.en !== 'Other Household') {
          return { category, subcategory };
        }
      }
      // 最後回退到該類別的第一個子類別
      return { category, subcategory: subcategories[0] };
    }
  }
  
  const lowerName = itemName.toLowerCase();
  // 搜索順序：先搜 Household，因為其關鍵字通常更具體，不易與食物衝突
  const categoriesToSearch: ('Household' | 'Food')[] = ['Household', 'Food'];

  // 增強關鍵詞部分匹配的靈活性
  for (const category of categoriesToSearch) {
    const subcategories = categorySubcategories[category];
    
    // 直接關鍵詞匹配檢查 - 更寬鬆的匹配邏輯
    for (const subcategory of subcategories) {
      // 跳過 "其他" 類別，除非是最後的回退選項
      if (subcategory.name.en === 'Other Food' || subcategory.name.en === 'Other Household') {
        continue;
      }
      
      // 檢查關鍵詞匹配 - 優先使用完整詞匹配，然後嘗試部分匹配
      for (const keyword of subcategory.keywordMatches) {
        const keywordLower = keyword.toLowerCase();
        
        // 完整詞匹配
        if (lowerName === keywordLower || lowerName.includes(` ${keywordLower} `)) {
          console.log(`完整詞匹配: ${itemName} -> ${category} / ${subcategory.name.en} (關鍵詞: ${keyword})`);
          return { category, subcategory };
        }
        
        // 詞首匹配 (以關鍵詞開始)
        if (lowerName.startsWith(`${keywordLower} `) || lowerName.startsWith(keywordLower)) {
          console.log(`詞首匹配: ${itemName} -> ${category} / ${subcategory.name.en} (關鍵詞: ${keyword})`);
          return { category, subcategory };
        }
        
        // 詞尾匹配 (以關鍵詞結束)
        if (lowerName.endsWith(` ${keywordLower}`) || lowerName.endsWith(keywordLower)) {
          console.log(`詞尾匹配: ${itemName} -> ${category} / ${subcategory.name.en} (關鍵詞: ${keyword})`);
          return { category, subcategory };
        }
        
        // 部分匹配 - 但至少要匹配3個字符的關鍵詞以避免過度匹配
        if (keywordLower.length >= 3 && lowerName.includes(keywordLower)) {
          console.log(`部分匹配: ${itemName} -> ${category} / ${subcategory.name.en} (關鍵詞: ${keyword})`);
          return { category, subcategory };
        }
      }
    }
  }
  
  // 如果沒有匹配到關鍵詞，檢查是否有一些常見家居術語
  const householdTerms = ['tool', 'furniture', 'appliance', 'decoration', 'decor', 'storage', 'container', 'hanger', 'hook', 'rack', 'shelf', 'equipment', 'device', 'accessory', 'fixture', 'utensil', 'gadget', 'supplies', 'tool', '工具', '家具', '電器', '电器', '裝飾', '装饰', '儲存', '储存', '容器', '掛鉤', '挂钩', '架子', '設備', '设备', '配件', '固定裝置', '固定装置', '器具', '小工具', '用品'];
  
  for (const term of householdTerms) {
    if (lowerName.includes(term.toLowerCase())) {
      console.log(`家居術語匹配: ${itemName} 包含 ${term}, 分類為 Household`);
      // 回退到第一個家居子類別（不是"其他"類別）
      for (const subcategory of categorySubcategories['Household']) {
        if (subcategory.name.en !== 'Other Household') {
          return { category: 'Household', subcategory };
        }
      }
      return { category: 'Household', subcategory: categorySubcategories['Household'][0] };
    }
  }
  
  console.log(`未檢測到 ${itemName} 的類別和子類別`);
  return null;
};

/**
 * 根據商品名稱和大類別確定最適合的子類別
 * @param itemName 商品名稱
 * @param category 主類別 (Food/Household)
 * @returns 子類別配置
 */
export const determineSubcategory = (itemName: string, category: 'Food' | 'Household'): CategoryConfig => {
  if (category !== 'Food' && category !== 'Household') {
    // 預設返回食品的其他類別
    return categorySubcategories['Food'][categorySubcategories['Food'].length - 1];
  }
  
  const lowerName = itemName.toLowerCase();
  const subcategories = categorySubcategories[category];
  
  // 嘗試根據關鍵詞匹配確定子類別
  for (const subcategory of subcategories) {
    if (subcategory.keywordMatches.some(keyword => lowerName.includes(keyword))) {
      return subcategory;
    }
  }
  
  // 如果沒有匹配，返回該類別的"其他"子類別（最後一個）
  return subcategories[subcategories.length - 1];
};

/**
 * 獲取商品的預設過期天數
 * @param itemName 商品名稱
 * @param category 主類別 (Food/Household)
 * @returns 預設過期天數
 */
export const getDefaultExpiryDays = (itemName: string, category: 'Food' | 'Household'): number => {
  const subcategory = determineSubcategory(itemName, category);
  return subcategory.defaultExpiryDays;
};

/**
 * 獲取所有子類別列表，包含名稱和預設過期天數
 * @param category 主類別 (Food/Household)
 * @param language 語言
 * @returns 子類別列表
 */
export const getSubcategoriesByMainCategory = (
  category: 'Food' | 'Household' | 'All', 
  language: 'en' | 'zh-TW' | 'zh-CN' = 'en'
): { name: string; defaultExpiryDays: number }[] => {
  if (category !== 'Food' && category !== 'Household') {
    return []; // 如果是'All'或其他值，返回空陣列
  }
  
  return categorySubcategories[category].map(subcategory => ({
    name: subcategory.name[language],
    defaultExpiryDays: subcategory.defaultExpiryDays
  }));
}; 