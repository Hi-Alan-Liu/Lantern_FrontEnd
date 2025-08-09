import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { ArrowLeft, ArrowRight, Sparkles, Edit, Send, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";
import { LanternRenderer } from './lantern/LanternRenderer';
import { lanternStyles, wishCategories, suggestionTexts, LanternStyle, WishCategory, FlowStep } from './lantern/constants';
import { checkContent } from './lantern/contentFilter';
// import turtleImage from 'figma:asset/77c01e84d3ea668a4a6bf174344e9ce607a71818.png';
// import tigerImage from 'figma:asset/c05a431ec7e88403afbb97ede2c2d8794edd850f.png';
// import birdImage from 'figma:asset/c24383adfb4b961f8f5083ecc7ff13f0b42afb10.png';

interface LanternFlowProps {
  onNavigate: (page: 'landing' | 'lantern-flow' | 'task-center' | 'wish-wall') => void;
  userPoints: number;
  onSpendPoints: (points: number) => boolean;
}

export function LanternFlow({ onNavigate, userPoints, onSpendPoints }: LanternFlowProps) {
  const [currentStep, setCurrentStep] = useState<FlowStep>('style');
  const [selectedStyle, setSelectedStyle] = useState<LanternStyle>('turtle');
  const [selectedCategory, setSelectedCategory] = useState<WishCategory>('wish');
  const [wishContent, setWishContent] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const [contentWarning, setContentWarning] = useState('');
  const [showWarning, setShowWarning] = useState(false);

  const getSelectedStyleData = () => {
    return lanternStyles.find(style => style.id === selectedStyle)!;
  };

  const nextStep = () => {
    switch (currentStep) {
      case 'style':
        const styleData = getSelectedStyleData();
        if (styleData.points > userPoints) {
          onNavigate('task-center');
          return;
        }
        setCurrentStep('category');
        break;
      case 'category':
        setCurrentStep('content');
        break;
      case 'content':
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
      case 'confirm':
        const selectedStyleData = getSelectedStyleData();
        if (selectedStyleData.points > 0) {
          onSpendPoints(selectedStyleData.points);
        }
        setCurrentStep('animation');
        setIsAnimating(true);
        setTimeout(() => {
          setIsAnimating(false);
          setCurrentStep('complete');
        }, 10000);
        break;
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

  if (currentStep === 'animation') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
        <div className="text-center">
          <motion.div
            className="relative mx-auto mb-8"
            initial={{ y: 100, opacity: 0.8, scale: 0.5 }}
            animate={{ y: -100, opacity: 0, scale: 0.2 }}
            transition={{ duration: 10, ease: "easeOut" }}
          >
            <div className="w-32 h-40 mx-auto relative">
              <img 
                // src={selectedStyle === 'turtle' ? turtleImage : selectedStyle === 'tiger' ? tigerImage : birdImage} 
                alt={`${selectedStyle} lantern`}
                className="w-full h-full object-contain transform scale-[1.95]"
              />
              <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-center text-white/80 max-w-24">
                {wishContent.substring(0, 20)}...
              </div>
            </div>
          </motion.div>

          {/* Background lanterns */}
          {Array.from({ length: 5 }).map((_, i) => {
            const randomStyle = lanternStyles[Math.floor(Math.random() * lanternStyles.length)];
            let imageSrc;
            switch (randomStyle.id) {
              case 'turtle':
                imageSrc = "turtleImage";
                break;
              case 'tiger':
                imageSrc = "tigerImage";
                break;
              case 'bird':
                imageSrc = "birdImage";
                break;
              default:
                imageSrc = "turtleImage";
            }
            
            return (
              <motion.div
                key={i}
                className="absolute w-16 h-20 opacity-60"
                style={{
                  left: `${20 + i * 15}%`,
                  top: '60%',
                }}
                initial={{ y: 50, opacity: 0.6 }}
                animate={{ y: -200, opacity: 0 }}
                transition={{ 
                  duration: 8,
                  delay: i * 0.5,
                  ease: "easeOut"
                }}
              >
                <img 
                  src={imageSrc} 
                  alt={`${randomStyle.id} lantern`}
                  className="w-full h-full object-contain transform scale-[1.95]"
                />
              </motion.div>
            );
          })}

          <h2 className="text-2xl mb-4">願望正在升空...</h2>
          <p className="text-muted-foreground">讓星空見證你的心願</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Button
          variant="ghost"
          onClick={() => currentStep === 'style' ? onNavigate('landing') : prevStep()}
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
      <div className="max-w-md mx-auto mb-8 w-full">
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
              width: currentStep === 'style' ? '25%' : 
                     currentStep === 'category' ? '50%' : 
                     currentStep === 'content' ? '75%' : '100%' 
            }}
          />
        </div>
      </div>

      {/* Step Content */}
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            {/* Step 1: Style Selection */}
            {currentStep === 'style' && (
              <motion.div
                key="style"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="text-center"
              >
                <h2 className="text-2xl mb-8">選擇你的天燈樣式</h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8 max-w-3xl mx-auto">
                  {lanternStyles.map((style) => (
                    <Card 
                      key={style.id}
                      className={`p-4 cursor-pointer transition-all duration-300 ${
                        selectedStyle === style.id 
                          ? 'border-accent bg-accent/10' 
                          : 'border-border hover:border-accent/50'
                      }`}
                      onClick={() => setSelectedStyle(style.id)}
                    >
                      <div className="text-center">
                        <LanternRenderer style={style.id} />
                        
                        <h3 className="mb-2 mt-4">{style.name}</h3>
                        
                        <Badge 
                          variant={style.points === 0 ? "secondary" : "outline"} 
                          className={`mb-2 ${style.points > 0 ? 'border-accent text-accent' : ''}`}
                        >
                          {style.points === 0 ? '免費' : `${style.points} 點數`}
                        </Badge>
                        
                        <p className="text-xs text-muted-foreground">
                          {style.description}
                        </p>
                        
                        {style.points > userPoints && (
                          <p className="text-xs text-destructive mt-2">
                            點數不足，需要更多點數
                          </p>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>

                <Button onClick={nextStep} size="lg" className="px-8">
                  <ArrowRight className="w-4 h-4 mr-2" />
                  下一步
                </Button>
              </motion.div>
            )}

            {/* Step 2: Category Selection */}
            {currentStep === 'category' && (
              <motion.div
                key="category"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="text-center"
              >
                <h2 className="text-2xl mb-8">選擇願望類型</h2>
                
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                  {wishCategories.map((category) => {
                    const Icon = category.icon;
                    return (
                      <Card
                        key={category.id}
                        className={`p-4 cursor-pointer transition-all duration-300 ${
                          selectedCategory === category.id
                            ? 'border-accent bg-accent/10'
                            : 'border-border hover:border-accent/50'
                        }`}
                        onClick={() => setSelectedCategory(category.id)}
                      >
                        <div className="text-center">
                          <Icon className="w-8 h-8 mx-auto mb-3 text-accent" />
                          <h3 className="mb-2">{category.name}</h3>
                          <p className="text-xs text-muted-foreground">
                            {category.description}
                          </p>
                        </div>
                      </Card>
                    );
                  })}
                </div>

                <Button onClick={nextStep} size="lg" className="px-8">
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
                className="text-center"
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
                    maxLength={200}
                  />
                  <p className="text-xs text-muted-foreground mt-2 text-right">
                    {wishContent.length}/200
                  </p>
                  
                  {/* Content Warning */}
                  {showWarning && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg"
                    >
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm text-destructive/90 leading-relaxed">
                            {contentWarning}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Suggestions */}
                <div className="mb-8">
                  <p className="text-sm text-muted-foreground mb-3">或者選擇一個建議：</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {suggestionTexts[selectedCategory].map((suggestion, index) => (
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

                <Button 
                  onClick={nextStep} 
                  size="lg" 
                  className="px-8"
                  disabled={!wishContent.trim() || showWarning}
                >
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
                className="text-center"
              >
                <h2 className="text-2xl mb-8">確認你的天燈</h2>
                
                <Card className="p-8 mb-8 bg-card/50 backdrop-blur-sm">
                  <div className="flex flex-col items-center">
                    <LanternRenderer style={selectedStyle} size="large" />
                    
                    <div className="max-w-sm mt-6">
                      <p className="text-sm text-muted-foreground mb-2">
                        樣式：{getSelectedStyleData().name}
                      </p>
                      <p className="text-sm text-muted-foreground mb-2">
                        願望類型：{wishCategories.find(c => c.id === selectedCategory)?.name}
                      </p>
                      <p className="text-foreground bg-muted/50 p-4 rounded-lg">
                        {wishContent}
                      </p>
                    </div>
                  </div>
                </Card>

                <div className="flex gap-4 justify-center">
                  <Button 
                    variant="outline"
                    onClick={() => setCurrentStep('content')}
                    className="px-6"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    修改內容
                  </Button>
                  
                  <Button 
                    onClick={nextStep}
                    size="lg"
                    className="px-8 bg-gradient-to-r from-[#ff8a65] to-[#ffb74d] hover:from-[#ff7043] hover:to-[#ff9800]"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    點燈放飛
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
                className="text-center"
              >
                <div className="mb-8">
                  <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-[#ff8a65] to-[#ffb74d] rounded-full flex items-center justify-center">
                    <Sparkles className="w-12 h-12 text-white" />
                  </div>
                  <h2 className="text-2xl mb-4">願望已放飛</h2>
                  <p className="text-lg text-muted-foreground mb-8">
                    願你被溫柔看見，願所有美好都如期而至
                  </p>
                </div>

                <div className="flex gap-4 justify-center">
                  <Button 
                    onClick={() => onNavigate('landing')}
                    variant="outline"
                    size="lg"
                    className="px-8"
                  >
                    返回首頁
                  </Button>
                  
                  <Button 
                    onClick={() => onNavigate('wish-wall')}
                    size="lg"
                    className="px-8"
                  >
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