import { Sparkles, Heart, MessageCircle, Gift, Frown, MoreHorizontal } from 'lucide-react';

export type LanternStyle = 'turtle' | 'tiger' | 'bird' | 'sunflower' | 'otter' | 'cat' | 'hedgehog' | 'rabbit' | 'elephant';
export type WishCategory = 'wish' | 'talk' | 'thanks' | 'vent' | 'other';
export type FlowStep = 'style' | 'category' | 'content' | 'confirm' | 'animation' | 'complete';

export const lanternStyles = [
  {
    id: 'turtle' as LanternStyle,
    name: '烏龜天燈',
    description: '穩重平和，守護心願',
    points: 0,
    gradient: 'from-green-400 to-emerald-600',
    decoration: 'turtle',
    shadowColor: 'rgba(34, 197, 94, 0.4)',
  },
  {
    id: 'tiger' as LanternStyle,
    name: '老虎天燈',
    description: '威武霸氣，勇氣守護',
    points: 3,
    gradient: 'from-orange-500 to-red-600',
    decoration: 'tiger',
    shadowColor: 'rgba(251, 146, 60, 0.4)',
  },
  {
    id: 'bird' as LanternStyle,
    name: '小鳥天燈',
    description: '自由翱翔，希望之光',
    points: 2,
    gradient: 'from-[#ff8a65] to-[#ffb74d]',
    decoration: 'bird',
    shadowColor: 'rgba(255, 138, 101, 0.4)',
  },
  {
    id: 'sunflower' as LanternStyle,
    name: '向日葵天燈',
    description: '陽光溫暖，正向成長',
    points: 2,
    gradient: 'from-yellow-400 to-orange-500',
    decoration: 'sunflower',
    shadowColor: 'rgba(255, 193, 7, 0.4)',
  },
  {
    id: 'otter' as LanternStyle,
    name: '水獺天燈',
    description: '活潑可愛，快樂療癒',
    points: 2,
    gradient: 'from-orange-400 to-amber-500',
    decoration: 'otter',
    shadowColor: 'rgba(251, 146, 60, 0.4)',
  },
  {
    id: 'cat' as LanternStyle,
    name: '貓咪天燈',
    description: '溫柔陪伴，寧靜安詳',
    points: 2,
    gradient: 'from-orange-300 to-yellow-400',
    decoration: 'cat',
    shadowColor: 'rgba(255, 183, 77, 0.4)',
  },
  {
    id: 'hedgehog' as LanternStyle,
    name: '刺蝟天燈',
    description: '勇敢堅強，保護自己',
    points: 2,
    gradient: 'from-amber-400 to-orange-600',
    decoration: 'hedgehog',
    shadowColor: 'rgba(245, 158, 11, 0.4)',
  },
  {
    id: 'rabbit' as LanternStyle,
    name: '兔子天燈',
    description: '純真可愛，溫暖守護',
    points: 2,
    gradient: 'from-orange-400 to-yellow-500',
    decoration: 'rabbit',
    shadowColor: 'rgba(251, 146, 60, 0.4)',
  },
  {
    id: 'elephant' as LanternStyle,
    name: '大象天燈',
    description: '智慧穩重，力量守護',
    points: 2,
    gradient: 'from-amber-500 to-orange-500',
    decoration: 'elephant',
    shadowColor: 'rgba(245, 158, 11, 0.4)',
  },
];

export const wishCategories = [
  { id: 'wish' as WishCategory, name: '許願', icon: Sparkles, description: '對未來的美好期盼' },
  { id: 'talk' as WishCategory, name: '傾訴', icon: MessageCircle, description: '想說卻說不出的話' },
  { id: 'thanks' as WishCategory, name: '感謝', icon: Gift, description: '想對某人表達的謝意' },
  { id: 'vent' as WishCategory, name: '小小發洩', icon: Frown, description: '釋放心中的小情緒' },
  { id: 'other' as WishCategory, name: '其他', icon: MoreHorizontal, description: '其他想分享的心情' },
];

export const suggestionTexts = {
  wish: ['希望家人身體健康', '願工作順利進展', '期待找到真愛', '願我有勇氣像老虎般勇敢', '希望如向日葵般積極向上', '願自己如刺蝟般堅強', '希望如兔子般純真快樂', '願擁有大象般的智慧'],
  talk: ['最近壓力好大...', '有些話想對你說', '其實我一直...', '像小鳥一樣想要自由', '想像水獺一樣自在快樂', '想學會如刺蝟般保護自己', '想保持如兔子般的純真', '希望有大象般的沉穩'],
  thanks: ['謝謝你一直陪伴我', '感謝這段美好時光', '很慶幸遇見你', '感謝像烏龜般穩定守護我的人', '感謝如貓咪般溫暖的陪伴', '感謝給我如刺蝟般的勇氣', '感謝如兔子般溫暖的守護', '感謝如大象般智慧的指導'],
  vent: ['今天真的很累...', '為什麼總是這樣', '好想大哭一場', '想要慢慢來，不急躁', '希望能像向日葵一樣堅強', '需要像刺蝟一樣守護自己', '想要如兔子般單純快樂', '需要大象般的力量'],
  other: ['記錄這美好的一天', '想念遠方的朋友', '珍惜當下的幸福', '願自己能穩步前進', '想要如貓咪般悠然自得', '學會如刺蝟般獨立堅強', '保持如兔子般的純真', '擁有大象般的智慧與力量'],
};