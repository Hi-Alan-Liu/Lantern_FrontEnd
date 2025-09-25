import React, { useEffect, useMemo, useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Edit,
  Send,
  AlertTriangle,
  MessageCircle,
  MoreHorizontal,
  Gift,
  Frown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LanternRenderer } from './lantern/LanternRenderer';
import { suggestionTexts, FlowStep } from './lantern/constants';
import type { WishCategory, LanternStyleKey, StyleDTO, CategoryDTO } from './lantern/lantern';
import { checkContent } from './lantern/contentFilter';

// ✅ API（保留）
import { createLantern, getStyleList, getCategoryList } from './lantern/lanternService';

/* ------------------ 小工具：名稱/代碼 映射 ------------------ */

const normalize = (s?: string) => (s ?? '').toLowerCase().trim();

/** Style → 前端 key（給 LanternRenderer & 本地 state） */
/** Style → 前端 key（給 LanternRenderer & 本地 state） */
function mapStyleToKey(style: StyleDTO): LanternStyleKey {
  const anyStyle = style as any;
  const code = normalize(anyStyle.code ?? anyStyle.Name ?? anyStyle.name);

  if ([
    'turtle','tiger','bird','rabbit',
    'sunflower','otter','cat','hedgehog',
    'elephant','eagle','lion','wolf','fox'
  ].includes(code)) {
    return code as LanternStyleKey;
  }

  const name = normalize(anyStyle.displayName ?? anyStyle.name);

  if (/(turtle|龜|烏龜)/.test(name)) return 'turtle';
  if (/(tiger|虎|老虎)/.test(name)) return 'tiger';
  if (/(bird|鳥|小鳥)/.test(name)) return 'bird';
  if (/(rabbit|兔|兔子)/.test(name)) return 'rabbit';
  if (/(sunflower|向日葵)/.test(name)) return 'sunflower';
  if (/(otter|水獺)/.test(name)) return 'otter';
  if (/(cat|貓)/.test(name)) return 'cat';
  if (/(hedgehog|刺蝟|刺猬)/.test(name)) return 'hedgehog';
  if (/(elephant|大象)/.test(name)) return 'elephant';
  if (/(eagle|鷹|老鷹)/.test(name)) return 'eagle';
  if (/(lion|獅|獅子)/.test(name)) return 'lion';
  if (/(wolf|狼)/.test(name)) return 'wolf';
  if (/(fox|狐狸)/.test(name)) return 'fox';

  return 'turtle';
}

/** Category → 前端 key（供 suggestionTexts & UI 使用） */
function mapCategoryToKey(cat: CategoryDTO): WishCategory {
  const anyCat = cat as any;
  const code = normalize(anyCat.code ?? anyCat.name);
  if (['wish','talk','thanks','vent','other'].includes(code)) return code as WishCategory;

  const name = normalize(anyCat.displayName ?? anyCat.name);
  if (/(wish|願|許願|祈願|心願)/.test(name)) return 'wish';
  if (/(talk|訴說|傾訴|說說|分享)/.test(name)) return 'talk';
  if (/(thanks|感謝|感恩|謝謝)/.test(name)) return 'thanks';
  if (/(vent|發洩|抱怨|小小發洩|吐槽)/.test(name)) return 'vent';
  return 'other';
}

type IconComp = React.ComponentType<{ className?: string }>;
const CategoryIconMap: Record<WishCategory, IconComp> = {
  wish: Sparkles,
  talk: MessageCircle,
  thanks: Gift,
  vent: Frown,
  other: MoreHorizontal,
};

/** UI 展示型別（由後端資料加工而來） */
type UIStyle = {
  key: LanternStyleKey;
  name: string;
  description?: string;
  points: number;
  backendId: number;
};
type UICategory = {
  key: WishCategory;
  name: string;
  description?: string;
  backendId: number;
  icon: IconComp;
};

/* ------------------ Component ------------------ */

interface LanternFlowProps {
  onNavigate: (page: 'landing' | 'lantern-flow' | 'task-center' | 'wish-wall') => void;
  userPoints: number;
  onSpendPoints: (points: number) => boolean;
  onAddLantern: (lantern: { style: string; category: string; content: string }) => void;
}

export function LanternFlow({ onNavigate, userPoints, onSpendPoints, onAddLantern }: LanternFlowProps) {
  const [currentStep, setCurrentStep] = useState<FlowStep>('style');
  const [selectedStyle, setSelectedStyle] = useState<LanternStyleKey>('turtle');
  const [selectedCategory, setSelectedCategory] = useState<WishCategory>('wish');
  const [wishContent, setWishContent] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const [contentWarning, setContentWarning] = useState('');
  const [showWarning, setShowWarning] = useState(false);

  // 後端 meta（原始）
  const [styleList, setStyleList] = useState<StyleDTO[]>([]);
  const [categoryList, setCategoryList] = useState<CategoryDTO[]>([]);
  const [metaLoading, setMetaLoading] = useState<boolean>(true);
  const [metaError, setMetaError] = useState<string | null>(null);

  // 送出狀態
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // 後端 → UI 可用
  const uiStyles: UIStyle[] = useMemo(() => {
    return (styleList ?? []).map((s: any) => {
      const key = mapStyleToKey(s);
      const name = s.displayName ?? s.name ?? s.Name ?? '—';
      const description = s.desc ?? s.description ?? s.Desc ?? '';
      const points = s.point ?? s.points ?? s.Point ?? 0;
      const backendId = s.id ?? s.Id;
      return { key, name, description, points, backendId } as UIStyle;
    });
  }, [styleList]);

  const uiCats: UICategory[] = useMemo(() => {
    return (categoryList ?? []).map((c: any) => {
      const key = mapCategoryToKey(c);
      const name = c.displayName ?? c.name ?? '—';
      const description = c.desc ?? c.description ?? '';
      const backendId = c.id ?? c.Id;
      return { key, name, description, backendId, icon: CategoryIconMap[key] ?? Sparkles } as UICategory;
    });
  }, [categoryList]);

  // 以 key 找 UI style/category（顯示名稱/點數/ID）
  const currentUIStyle = useMemo(
    () => uiStyles.find((s) => s.key === selectedStyle) ?? uiStyles[0],
    [uiStyles, selectedStyle]
  );
  const currentUICategory = useMemo(
    () => uiCats.find((c) => c.key === selectedCategory) ?? uiCats[0],
    [uiCats, selectedCategory]
  );

  // 載入後端 meta
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setMetaLoading(true);
        const [stylesRes, catsRes] = await Promise.all([
          getStyleList(),
          getCategoryList(),
        ]);
        if (!alive) return;
        setStyleList(stylesRes?.dataList ?? []);
        setCategoryList(catsRes?.dataList ?? []);
        setMetaError(null);
      } catch (e: any) {
        if (!alive) return;
        setMetaError(e?.message ?? '載入樣式/類別失敗（已使用離線預設）');
      } finally {
        if (alive) setMetaLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // 後端資料就緒後，初始化預設選擇（若未選）
  useEffect(() => {
    if (uiStyles.length && !selectedStyle) setSelectedStyle(uiStyles[0].key);
    if (uiCats.length && !selectedCategory) setSelectedCategory(uiCats[0].key);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uiStyles, uiCats]);

  const metaReady = !metaLoading && uiStyles.length > 0 && uiCats.length > 0;

  const nextStep = async () => {
    switch (currentStep) {
      case 'style': {
        if (!currentUIStyle) return;
        const pointsNeed = currentUIStyle.points ?? 0;
        if (pointsNeed > userPoints) {
          onNavigate('task-center'); // 去任務中心賺點數
          return;
        }
        setCurrentStep('category');
        break;
      }
      case 'category':
        setCurrentStep('content');
        break;

      case 'content': {
        if (wishContent.trim()) {
          const contentCheck = checkContent(wishContent);
          if (contentCheck.isValid) {
            setCurrentStep('confirm');
          } else {
            setContentWarning(contentCheck.message);
            setShowWarning(true);
          }
        }
        break;
      }

      case 'confirm': {
        const styleBackendId = currentUIStyle?.backendId;
        const categoryBackendId = currentUICategory?.backendId;
        if (!styleBackendId || !categoryBackendId) {
          setSubmitError('無法解析樣式或類別（ID 不存在），請稍後再試');
          return;
        }

        try {
          setSubmitError(null);
          setSubmitting(true);

          // 呼叫建立 API
          await createLantern({
            styleId: styleBackendId,
            categoryId: categoryBackendId,
            text: wishContent.trim(),
          });

          // 扣點（如需要）
          const cost = currentUIStyle?.points ?? 0;
          if (cost > 0) onSpendPoints(cost);

          // 本地加入（供 WishWall 顯示個人天燈等）
          onAddLantern({
            style: selectedStyle,
            category: selectedCategory,
            content: wishContent,
          });

          // 動畫 → 完成
          setCurrentStep('animation');
          setIsAnimating(true);
          setTimeout(() => {
            setIsAnimating(false);
            setCurrentStep('complete');
          }, 10000);
        } catch (e: any) {
          setSubmitError(e?.message ?? '建立天燈失敗，請稍後再試');
        } finally {
          setSubmitting(false);
        }
        break;
      }
    }
  };

  const prevStep = () => {
    switch (currentStep) {
      case 'category':
        setCurrentStep('style');
        break;
      case 'content':
        setCurrentStep('category');
        break;
      case 'confirm':
        setCurrentStep('content');
        break;
    }
  };

  const useSuggestion = (text: string) => {
    setWishContent(text);
    setShowWarning(false);
    setContentWarning('');
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setWishContent(newContent);

    if (newContent.trim()) {
      const contentCheck = checkContent(newContent);
      if (!contentCheck.isValid) {
        setContentWarning(contentCheck.message);
        setShowWarning(true);
      } else {
        setShowWarning(false);
        setContentWarning('');
      }
    } else {
      setShowWarning(false);
      setContentWarning('');
    }
  };

  /* ------------------ 動畫頁 ------------------ */
  if (currentStep === 'animation') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
        <div className="text-center">
          <motion.div
            className="relative mx-auto mb-8"
            initial={{ y: 150, opacity: 0.9, scale: 0.6 }}
            animate={{ y: -200, opacity: 0, scale: 0.1, x: [0, 8, -6, 4, 0] }}
            transition={{ duration: 10, ease: 'easeOut' }}
          >
            <div className="w-32 h-40 mx-auto relative">
              <motion.div
                className="absolute inset-0 rounded-full blur-lg pointer-events-none mix-blend-screen"
                style={{
                  background: 'radial-gradient(circle, #ffffffb3 0%, transparent 70%)', // 白色核心光
                  boxShadow: '0 0 24px #ffffff80'                                       // 稍微加深
                }}
                animate={{ scale: [1.3, 2, 1.3] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              />
              <motion.div
                className="absolute -inset-4 rounded-full blur-xl opacity-40"
                style={{ background: `radial-gradient(circle, #ff8a65 0%, transparent 60%)` }}
                animate={{ scale: [1, 1.8, 1], opacity: [0.3, 0.7, 0.3] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
              />
              <LanternRenderer style={selectedStyle} size="large" className="w-full h-full relative z-10" />
              <motion.div
                className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 text-xs text-center text-white/90 max-w-32 px-2 py-1 bg-black/20 rounded-lg backdrop-blur-sm"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {/*wishContent.length > 15 ? `${wishContent.substring(0, 15)}...` : wishContent*/}
              </motion.div>
              {Array.from({ length: 6 }).map((_, i) => (
                <motion.div
                  key={`sparkle-${i}`}
                  className="absolute w-1 h-1 bg-white rounded-full"
                  style={{ left: `${20 + i * 15}%`, top: `${20 + i * 10}%` }}
                  animate={{ y: [-20, -60, -100], opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
                  transition={{ duration: 3, repeat: Infinity, delay: i * 0.5, ease: 'easeOut' }}
                />
              ))}
            </div>
          </motion.div>

          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute left-1/2 top-2/3 transform -translate-x-1/2 -translate-y-1/2">
              {Array.from({ length: 5 }).map((_, i) => {
                const s = uiStyles[i % (uiStyles.length || 1)]?.key ?? 'turtle';
                const positions = [
                  { x: -160, y: 10 },
                  { x: -80, y: -20 },
                  { x: 0, y: 0 },
                  { x: 80, y: -20 },
                  { x: 160, y: 10 },
                ] as const;
                const position = positions[i];
                return (
                  <motion.div
                    key={i}
                    className="absolute w-10 h-12 sm:w-14 sm:h-17 opacity-75"
                    style={{ left: `${position.x}px`, top: `${position.y + 80}px`, transform: 'translate(-50%, -50%)' }}
                    initial={{ y: 120, opacity: 0.8, scale: 0.9 }}
                    animate={{ y: -400, opacity: 0, scale: 0.2, x: [0, Math.sin(i) * 8, -Math.sin(i) * 6, 0] }}
                    transition={{ duration: 8.5, delay: i * 0.4, ease: 'easeOut' }}
                  >
                    <div className="relative">
                      <motion.div
                        className="absolute inset-0 rounded-full blur-sm opacity-50"
                        style={{ background: `radial-gradient(circle, #ff8a6550 0%, transparent 60%)` }}
                        animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.2 }}
                      />
                      <LanternRenderer style={s} size="small" className="w-full h-full relative z-10" />
                      {Array.from({ length: 2 }).map((_, j) => (
                        <motion.div
                          key={`trail-${i}-${j}`}
                          className="absolute w-0.5 h-0.5 bg-accent rounded-full"
                          style={{ left: '50%', top: '100%' }}
                          animate={{ y: [0, 20, 40], opacity: [0.8, 0.4, 0], scale: [1, 0.5, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.4 + j * 0.3, ease: 'easeOut' }}
                        />
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1, duration: 1 }}>
            <h2 className="text-2xl mb-4 bg-gradient-to-r from-accent to-soft-orange bg-clip-text text-transparent">願望正在升空...</h2>
            <p className="text-muted-foreground mb-2">讓星空見證你的心願</p>
            <motion.p className="text-sm text-muted-foreground/70 italic" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 3, repeat: Infinity }}>
              願你被溫柔看見，願所有美好都如期而至
            </motion.p>
          </motion.div>
        </div>
      </div>
    );
  }

  /* ------------------ 共同 UI：頂部進度 + 載入提示 ------------------ */
  const metaBanner = (currentStep === 'style' || currentStep === 'category') && (
    <>
      {metaLoading && <p className="text-sm text-muted-foreground mt-3">載入樣式/類別中...</p>}
      {metaError && <p className="text-sm text-destructive mt-3">{metaError}</p>}
    </>
  );

  /* ------------------ 主畫面 ------------------ */
  return (
    <div className="min-h-screen flex flex-col">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-[#0a0e27] via-[#1a1d3a] to-transparent backdrop-blur-sm">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="ghost"
              onClick={() => (currentStep === 'style' ? onNavigate('landing') : prevStep())}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {currentStep === 'style' ? '返回首頁' : '上一步'}
            </Button>

            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-accent" />
              <span className="text-sm text-muted-foreground">點數: {userPoints}</span>
            </div>
          </div>

          {/* Progress */}
          <div className="max-w-md mx-auto w-full">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span>選擇天燈</span>
              <span>願望類型</span>
              <span>填寫內容</span>
              <span>確認</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#ff8a65] to-[#ffb74d] transition-all duration-300"
                style={{
                  width:
                    currentStep === 'style' ? '25%' :
                    currentStep === 'category' ? '50%' :
                    currentStep === 'content' ? '75%' : '100%',
                }}
              />
            </div>
            {metaBanner}
          </div>
        </div>
      </div>

      {/* Step Content with top padding */}
      <div className="flex-1 flex pt-32">
        <div className="w-full max-w-4xl mx-auto flex flex-col px-4">
          <AnimatePresence mode="wait">
            {/* Step 1: Style Selection */}
            {currentStep === 'style' && (
              <motion.div
                key="style"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full flex flex-col"
              >
                <div className="text-center mb-6 flex-shrink-0">
                  <h2 className="text-2xl">選擇你的天燈樣式</h2>
                </div>

                <div className="flex-1 overflow-y-auto px-4 -mx-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-5xl mx-auto pb-6 pt-8">
                    {(uiStyles.length ? uiStyles : [
                      { key: 'turtle' as LanternStyleKey, name: '小烏龜', description: '穩重守護', points: 0, backendId: -1 },
                    ]).map((style) => (
                      <Card
                        key={style.key}
                        className={`p-4 cursor-pointer transition-all duration-300 overflow-visible ${
                          selectedStyle === style.key ? 'border-accent bg-accent/10' : 'border-border hover:border-accent/50'
                        }`}
                        onClick={() => setSelectedStyle(style.key)}
                      >
                        <div className="text-center overflow-visible">
                          <div className="overflow-visible relative -mt-6 mb-2">
                            <LanternRenderer style={style.key} />
                          </div>

                          <h3 className="mb-2 mt-4">{style.name}</h3>

                          <Badge
                            variant={style.points === 0 ? 'secondary' : 'outline'}
                            className={`mb-2 ${style.points > 0 ? 'border-accent text-accent' : ''}`}
                          >
                            {style.points === 0 ? '免費' : `${style.points} 點數`}
                          </Badge>

                          <p className="text-xs text-muted-foreground">{style.description}</p>

                          {style.points > userPoints && (
                            <p className="text-xs text-destructive mt-2">點數不足，需要更多點數</p>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>

                <div className="text-center pt-6 flex-shrink-0">
                  <Button onClick={nextStep} size="lg" className="px-8" disabled={!metaReady}>
                    <ArrowRight className="w-4 h-4 mr-2" />
                    下一步
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Category Selection */}
            {currentStep === 'category' && (
              <motion.div
                key="category"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="text-center flex-1 flex flex-col justify-center"
              >
                <h2 className="text-2xl mb-8">選擇願望類型</h2>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                  {(uiCats.length ? uiCats : [
                    { key: 'wish' as WishCategory, name: '許願', description: '把心願寫下', icon: Sparkles, backendId: -1 },
                    { key: 'talk' as WishCategory, name: '傾訴', description: '說說心事', icon: MessageCircle, backendId: -2 },
                    { key: 'thanks' as WishCategory, name: '感謝', description: '道一聲謝謝', icon: Gift, backendId: -3 },
                  ]).map((category) => {
                    const Icon = category.icon;
                    return (
                      <Card
                        key={category.key}
                        className={`p-4 cursor-pointer transition-all duration-300 ${
                          selectedCategory === category.key ? 'border-accent bg-accent/10' : 'border-border hover:border-accent/50'
                        }`}
                        onClick={() => setSelectedCategory(category.key)}
                      >
                        <div className="text-center">
                          <Icon className="w-8 h-8 mx-auto mb-3 text-accent" />
                          <h3 className="mb-2">{category.name}</h3>
                          <p className="text-xs text-muted-foreground">{category.description}</p>
                        </div>
                      </Card>
                    );
                  })}
                </div>

                <Button onClick={nextStep} size="lg" className="px-8" disabled={!metaReady}>
                  <ArrowRight className="w-4 h-4 mr-2" />
                  下一步
                </Button>
              </motion.div>
            )}

            {/* Step 3: Content Input */}
            {currentStep === 'content' && (
              <motion.div
                key="content"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="text-center flex-1 flex flex-col justify-center"
              >
                <h2 className="text-2xl mb-8">寫下你的心願</h2>

                <div className="mb-6">
                  <Textarea
                    placeholder="在這裡寫下你想說的話..."
                    value={wishContent}
                    onChange={handleContentChange}
                    className={`min-h-32 bg-input-background border-border/50 focus:border-accent resize-none ${
                      showWarning ? 'border-destructive/50 focus:border-destructive' : ''
                    }`}
                    maxLength={50}
                  />
                  <p className="text-xs text-muted-foreground mt-2 text-right">{wishContent.length}/50</p>

                  {showWarning && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg"
                    >
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm text-destructive/90 leading-relaxed">{contentWarning}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>

                <div className="mb-8">
                  <p className="text-sm text-muted-foreground mb-3">或者選擇一個建議：</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {(suggestionTexts[selectedCategory] ?? suggestionTexts['wish']).map((suggestion, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => useSuggestion(suggestion)}
                        className="text-xs rounded-full"
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                </div>

                <Button onClick={nextStep} size="lg" className="px-8" disabled={!wishContent.trim() || showWarning}>
                  <ArrowRight className="w-4 h-4 mr-2" />
                  下一步
                </Button>
              </motion.div>
            )}

            {/* Step 4: Confirmation */}
            {currentStep === 'confirm' && (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="text-center flex-1 flex flex-col justify-center"
              >
                <h2 className="text-2xl mb-8">確認你的天燈</h2>

                {submitError && <p className="text-sm text-destructive mb-4">{submitError}</p>}

                <Card className="p-8 mb-8 bg-card/50 backdrop-blur-sm">
                  <div className="flex flex-col items-center">
                    <LanternRenderer style={selectedStyle} size="large" />

                    <div className="max-w-sm mt-6">
                      <p className="text-sm text-muted-foreground mb-2">樣式：{currentUIStyle?.name ?? '—'}</p>
                      <p className="text-sm text-muted-foreground mb-2">願望類型：{currentUICategory?.name ?? '—'}</p>
                      <p className="text-foreground bg-muted/50 p-4 rounded-lg">{wishContent}</p>
                    </div>
                  </div>
                </Card>

                <div className="flex gap-4 justify-center">
                  <Button variant="outline" onClick={() => setCurrentStep('content')} className="px-6" disabled={submitting}>
                    <Edit className="w-4 h-4 mr-2" />
                    修改內容
                  </Button>

                  <Button
                    onClick={nextStep}
                    size="lg"
                    className="px-8 bg-gradient-to-r from-[#ff8a65] to-[#ffb74d] hover:from-[#ff7043] hover:to-[#ff9800]"
                    disabled={submitting || metaLoading || !currentUIStyle || !currentUICategory}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {submitting ? '送出中...' : '點燈放飛'}
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 5: Complete */}
            {currentStep === 'complete' && (
              <motion.div
                key="complete"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center flex-1 flex flex-col justify-center"
              >
                <div className="mb-8">
                  <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-[#ff8a65] to-[#ffb74d] rounded-full flex items-center justify-center">
                    <Sparkles className="w-12 h-12 text-white" />
                  </div>
                  <h2 className="text-2xl mb-4">願望已放飛</h2>
                  <p className="text-lg text-muted-foreground mb-8">願你被溫柔看見，願所有美好都如期而至</p>
                </div>

                <div className="flex gap-4 justify-center">
                  <Button onClick={() => onNavigate('landing')} variant="outline" size="lg" className="px-8">
                    返回首頁
                  </Button>

                  <Button onClick={() => onNavigate('wish-wall')} size="lg" className="px-8">
                    觀看天燈星空牆
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}