export interface ContentCheckResult {
  isValid: boolean;
  message: string;
}

export const checkContent = (content: string): ContentCheckResult => {
  const lowerContent = content.toLowerCase();
  
  // Violence-related keywords
  const violenceKeywords = [
    '殺', '死', '打', '暴力', '血', '傷害', '攻擊', '武器', '刀', '槍',
    '毆打', '揍', '砍', '砸', '撞', '踢', '仇恨', '報復', '毀滅',
    '戰爭', '爆炸', '炸彈', '自殺', '殺死', '殺害', '虐待', '痛苦'
  ];
  
  // Drug-related keywords (since this is about saying no to drugs)
  const drugKeywords = [
    '毒品', '吸毒', '海洛因', '嗎啡', '可卡因', '大麻', '搖頭丸', 'k他命',
    '冰毒', '安非他命', '芬太尼', '鴉片', '迷幻藥', '禁藥'
  ];
  
  // Inappropriate language
  const inappropriateKeywords = [
    '他媽', '幹你', '操', '靠北', '死', '滾', '婊', '賤', '爛',
    '垃圾人', '白痴', '智障', '廢物', '去死', '活該'
  ];

  // Check for violence
  for (const keyword of violenceKeywords) {
    if (lowerContent.includes(keyword)) {
      return {
        isValid: false,
        message: '親愛的朋友，天燈感受到了負面的能量 🕊️ 暴力和仇恨的話語會讓天燈迷失方向，無法將你的心意傳達到星空。請用更溫柔的語言重新表達，讓我們一起創造正向的力量吧～'
      };
    }
  }
  
  // Check for drugs (though this should be rare given the theme)
  for (const keyword of drugKeywords) {
    if (lowerContent.includes(keyword)) {
      return {
        isValid: false,
        message: '天燈 Go 致力於推廣「創意放飛，毒品 Say No!」的理念 ✨ 讓我們用正向的創意和美好的願望來點亮生活，拒絕任何有害物質。請重新寫下對未來的美好期盼吧～'
      };
    }
  }
  
  // Check for inappropriate language
  for (const keyword of inappropriateKeywords) {
    if (lowerContent.includes(keyword)) {
      return {
        isValid: false,
        message: '溫柔的天燈聽到了刺耳的聲音 🌙 負面的言語會讓願望失去力量，無法順利升空。請用更柔和、正向的話語來表達你的心意，讓天燈帶著滿滿的祝福飛向星空～'
      };
    }
  }
  
  return { isValid: true, message: '' };
};