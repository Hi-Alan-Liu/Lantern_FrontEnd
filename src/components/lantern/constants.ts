import { Sparkles, MessageCircle, Gift, Frown, MoreHorizontal } from 'lucide-react';

export type LanternStyle = 'turtle' | 'tiger' | 'bird' | 'rabbit';
export type WishCategory = 'wish' | 'talk' | 'thanks' | 'vent' | 'other';
export type FlowStep = 'style' | 'category' | 'content' | 'confirm' | 'animation' | 'complete';

export const fallbackLanternStyles = [
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
    id: 'rabbit' as LanternStyle,
    name: '兔子天燈',
    description: '溫柔靈動，帶來好運',
    points: 1,
    gradient: 'from-pink-400 to-rose-500',
    decoration: 'rabbit',
    shadowColor: 'rgba(244, 114, 182, 0.4)',
  },
];

export const fallbackWishCategories = [
  { id: 'wish' as WishCategory, name: '許願',     icon: Sparkles,      description: '對未來的美好期盼' },
  { id: 'talk' as WishCategory, name: '傾訴',     icon: MessageCircle, description: '想說卻說不出的話' },
  { id: 'thanks' as WishCategory, name: '感謝',   icon: Gift,          description: '想對某人表達的謝意' },
  { id: 'vent' as WishCategory, name: '小小發洩', icon: Frown,         description: '釋放心中的小情緒' },
  { id: 'other' as WishCategory, name: '其他',    icon: MoreHorizontal,description: '其他想分享的心情' },
];

export const suggestionTexts = {
  wish:  ['希望家人身體健康', '願工作順利進展', '期待找到真愛', '願我有勇氣像老虎般勇敢'],
  talk:  ['最近壓力好大...', '有些話想對你說', '其實我一直...', '像小鳥一樣想要自由'],
  thanks:['謝謝你一直陪伴我', '感謝這段美好時光', '很慶幸遇見你', '感謝像烏龜般穩定守護我的人'],
  vent:  ['今天真的很累...', '為什麼總是這樣', '好想大哭一場', '想要慢慢來，不急躁'],
  other: ['記錄這美好的一天', '想念遠方的朋友', '珍惜當下的幸福', '願自己能穩步前進'],
} as const;

// 小工具
export const normalize = (s?: string) => s?.toLowerCase().trim() ?? '';
export const asStyle = (s: string) =>
  (['turtle','tiger','bird','rabbit'] as const).includes(s as any) ? (s as LanternStyle) : 'turtle';
export const asCategory = (s: string) =>
  (['wish','talk','thanks','vent','other'] as const).includes(s as any) ? (s as WishCategory) : 'other';